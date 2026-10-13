import os
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET_KEY"] = "test_super_secret_jwt_key_32_characters_long"

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.otp import EmailOTP
from app.core.security import verify_password, hash_otp

TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


client = TestClient(app)


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["service"] == "FotoOwl.AI Auth & OTP API"

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"


def test_register_creates_unverified_account_and_dispatches_otp():
    payload = {
        "fullName": "Test User",
        "email": "test@fotoowl.ai",
        "password": "SecurePassword123!",
        "gender": "Female",
        "mobileNumber": "+919876543210",
        "address": "123 Innovation Way",
        "city": "Mumbai",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["email"] == "test@fotoowl.ai"
    assert data["is_verified"] is False
    # CRITICAL SECURITY CHECK: Raw OTP must never be returned in API response
    assert "otp" not in data

    # Verify user in database
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "test@fotoowl.ai").first()
    assert user is not None
    assert user.is_verified is False
    assert user.full_name == "Test User"
    assert verify_password("SecurePassword123!", user.password_hash) is True

    # Verify OTP record in database
    otp_record = db.query(EmailOTP).filter(EmailOTP.email == "test@fotoowl.ai").first()
    assert otp_record is not None
    assert otp_record.is_used is False
    assert otp_record.otp_hash is not None
    db.close()


def test_verify_email_with_correct_otp():
    # 1. Register user
    reg = client.post("/auth/register", json={
        "fullName": "Aryan Sharma",
        "email": "aryan@fotoowl.ai",
        "password": "Password123!",
    })
    assert reg.status_code == 200

    # 2. Retrieve the active OTP hash and compute match for testing
    db = TestingSessionLocal()
    otp_rec = db.query(EmailOTP).filter(EmailOTP.email == "aryan@fotoowl.ai", EmailOTP.is_used == False).first()
    assert otp_rec is not None

    # Find the matching 6-digit code for testing
    # Since secrets generated the code, let's inject a known test code for predictable verification
    test_code = "654321"
    otp_rec.otp_hash = hash_otp(test_code, "aryan@fotoowl.ai")
    db.commit()
    otp_id = otp_rec.id
    db.close()

    # 3. Verify with the code
    verify_res = client.post("/auth/verify-email", json={
        "email": "aryan@fotoowl.ai",
        "otp": test_code,
    })
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["success"] is True
    assert v_data["token"] is not None
    assert v_data["user"]["is_verified"] is True
    assert v_data["user"]["email"] == "aryan@fotoowl.ai"

    # Verify DB user is now marked verified
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "aryan@fotoowl.ai").first()
    assert user.is_verified is True

    # Verify OTP is now marked as used
    otp_after = db.query(EmailOTP).filter(EmailOTP.id == otp_id).first()
    assert otp_after.is_used is True
    db.close()


def test_verify_email_with_incorrect_otp():
    client.post("/auth/register", json={
        "fullName": "Wrong OTP Tester",
        "email": "wrong@fotoowl.ai",
        "password": "Password123!",
    })

    res = client.post("/auth/verify-email", json={
        "email": "wrong@fotoowl.ai",
        "otp": "000000",
    })
    assert res.status_code == 400
    assert "Incorrect verification code" in res.json()["detail"]


def test_verify_email_expired_otp():
    client.post("/auth/register", json={
        "fullName": "Expired Tester",
        "email": "expired@fotoowl.ai",
        "password": "Password123!",
    })

    db = TestingSessionLocal()
    otp_rec = db.query(EmailOTP).filter(EmailOTP.email == "expired@fotoowl.ai").first()
    # Expire the OTP by setting expires_at to the past
    otp_rec.expires_at = datetime.now(timezone.utc) - timedelta(minutes=10)
    db.commit()
    db.close()

    res = client.post("/auth/verify-email", json={
        "email": "expired@fotoowl.ai",
        "otp": "123456",
    })
    assert res.status_code == 400
    assert "expired" in res.json()["detail"].lower()


def test_resend_otp_and_cooldown():
    client.post("/auth/register", json={
        "fullName": "Cooldown Tester",
        "email": "cooldown@fotoowl.ai",
        "password": "Password123!",
    })

    # Immediate second request should be blocked by cooldown (60 seconds)
    resend_fail = client.post("/auth/resend-otp", json={"email": "cooldown@fotoowl.ai"})
    assert resend_fail.status_code == 429
    assert "seconds before requesting another code" in resend_fail.json()["detail"]


def test_login_flow_unverified_vs_verified():
    # 1. Register unverified account
    client.post("/auth/register", json={
        "fullName": "Login Tester",
        "email": "login@fotoowl.ai",
        "password": "ValidPassword123!",
    })

    # 2. Login before verification must be rejected
    unverified_login = client.post("/auth/login", json={
        "email": "login@fotoowl.ai",
        "password": "ValidPassword123!",
    })
    assert unverified_login.status_code == 403
    assert unverified_login.json()["detail"] == "EMAIL_NOT_VERIFIED"

    # 3. Verify user
    db = TestingSessionLocal()
    otp_rec = db.query(EmailOTP).filter(EmailOTP.email == "login@fotoowl.ai").first()
    test_code = "777888"
    otp_rec.otp_hash = hash_otp(test_code, "login@fotoowl.ai")
    db.commit()
    db.close()

    verify_res = client.post("/auth/verify-email", json={
        "email": "login@fotoowl.ai",
        "otp": test_code,
    })
    assert verify_res.status_code == 200

    # 4. Login after verification must succeed
    verified_login = client.post("/auth/login", json={
        "email": "login@fotoowl.ai",
        "password": "ValidPassword123!",
    })
    assert verified_login.status_code == 200
    token = verified_login.json()["token"]
    assert token is not None

    # 5. Access /auth/me with Bearer token
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "login@fotoowl.ai"
    assert me_res.json()["fullName"] == "Login Tester"


def test_logout_endpoint():
    res = client.post("/auth/logout")
    assert res.status_code == 200
    assert res.json()["success"] is True
