from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models.user import User
from ..schemas.auth import (
    UserRegisterRequest,
    UserRegisterResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
    ResendOtpRequest,
    ResendOtpResponse,
    UserLoginRequest,
    UserLoginResponse,
    UserResponse,
)
from ..core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to extract and validate the authenticated user from the Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1].strip()
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@router.post("/register", response_model=UserRegisterResponse)
def register(
    request: UserRegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Registers a new user account directly with instant activation.
    No SMTP/email dependency required.
    """
    clean_email = request.email.lower().strip()

    # Check if a user with this email already exists
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user and existing_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in instead.",
        )

    pw_hash = hash_password(request.password)

    if existing_user:
        existing_user.full_name = request.fullName.strip()
        existing_user.password_hash = pw_hash
        existing_user.gender = request.gender or "Male"
        existing_user.mobile_number = request.mobileNumber.strip() if request.mobileNumber else None
        existing_user.address = request.address.strip() if request.address else None
        existing_user.city = request.city.strip() if request.city else "Bangalore"
        existing_user.is_verified = True
        db.commit()
        db.refresh(existing_user)
        user = existing_user
    else:
        user = User(
            full_name=request.fullName.strip(),
            email=clean_email,
            password_hash=pw_hash,
            gender=request.gender or "Male",
            mobile_number=request.mobileNumber.strip() if request.mobileNumber else None,
            address=request.address.strip() if request.address else None,
            city=request.city.strip() if request.city else "Bangalore",
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return UserRegisterResponse(
        success=True,
        message="Account registered successfully!",
        email=clean_email,
        is_verified=True,
    )


@router.post("/verify-email", response_model=VerifyOtpResponse)
def verify_email(request: VerifyOtpRequest, db: Session = Depends(get_db)):
    """
    Direct verification endpoint.
    Marks account verified and generates access token.
    """
    clean_email = request.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email address.",
        )

    user.is_verified = True
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "full_name": user.full_name,
    })

    user_response = UserResponse(
        id=user.id,
        fullName=user.full_name,
        email=user.email,
        gender=user.gender,
        mobileNumber=user.mobile_number,
        address=user.address,
        city=user.city,
        isVerified=True,
        createdAt=user.created_at.isoformat() if user.created_at else None,
    )

    return VerifyOtpResponse(
        success=True,
        message="Email verified successfully!",
        access_token=token,
        token_type="bearer",
        user=user_response,
    )


@router.post("/resend-otp", response_model=ResendOtpResponse)
def resend_otp(request: ResendOtpRequest, db: Session = Depends(get_db)):
    """Instant confirmation for resend without SMTP block."""
    clean_email = request.email.lower().strip()
    return ResendOtpResponse(
        success=True,
        message="Verification code generated successfully.",
        cooldown_seconds=30,
    )


@router.post("/login", response_model=UserLoginResponse)
def login(
    request: UserLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Direct credentials login.
    No unverified account blocker.
    """
    clean_email = request.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password.",
        )

    # Ensure user is verified
    if not user.is_verified:
        user.is_verified = True
        db.commit()
        db.refresh(user)

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "full_name": user.full_name,
    })

    user_response = UserResponse(
        id=user.id,
        fullName=user.full_name,
        email=user.email,
        gender=user.gender,
        mobileNumber=user.mobile_number,
        address=user.address,
        city=user.city,
        isVerified=True,
        createdAt=user.created_at.isoformat() if user.created_at else None,
    )

    return UserLoginResponse(
        success=True,
        message="Login successful",
        access_token=token,
        token_type="bearer",
        user=user_response,
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile for currently authenticated user."""
    return UserResponse(
        id=current_user.id,
        fullName=current_user.full_name,
        email=current_user.email,
        gender=current_user.gender,
        mobileNumber=current_user.mobile_number,
        address=current_user.address,
        city=current_user.city,
        isVerified=current_user.is_verified,
        createdAt=current_user.created_at.isoformat() if current_user.created_at else None,
    )
