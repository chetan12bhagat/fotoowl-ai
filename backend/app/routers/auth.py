from fastapi import APIRouter, Depends, HTTPException, status, Header, BackgroundTasks
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
from ..services.otp_service import (
    create_and_save_otp,
    verify_email_otp,
    can_resend_otp,
)
from ..services.email_service import send_otp_email

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

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_VERIFIED",
        )

    return user


@router.post("/register", response_model=UserRegisterResponse)
def register(
    request: UserRegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Registers a new user account in a pending unverified state.
    Generates a secure 6-digit OTP and dispatches it to the user's email.
    Never returns the OTP in the API response.
    """
    clean_email = request.email.lower().strip()

    # Check if a user with this email already exists
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user and existing_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in instead.",
        )

    # Hash the password securely with bcrypt
    pw_hash = hash_password(request.password)

    if existing_user and not existing_user.is_verified:
        # Update existing unverified record with new details
        existing_user.full_name = request.fullName.strip()
        existing_user.password_hash = pw_hash
        existing_user.gender = request.gender or "Male"
        existing_user.mobile_number = request.mobileNumber.strip() if request.mobileNumber else None
        existing_user.address = request.address.strip() if request.address else None
        existing_user.city = request.city.strip() if request.city else "Bangalore"
        db.commit()
        db.refresh(existing_user)
        user = existing_user
    else:
        # Create new unverified user
        user = User(
            full_name=request.fullName.strip(),
            email=clean_email,
            password_hash=pw_hash,
            gender=request.gender or "Male",
            mobile_number=request.mobileNumber.strip() if request.mobileNumber else None,
            address=request.address.strip() if request.address else None,
            city=request.city.strip() if request.city else "Bangalore",
            is_verified=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Generate and securely store 6-digit OTP
    raw_otp = create_and_save_otp(db, clean_email)

    # Send verification email asynchronously in background task for sub-second API response
    background_tasks.add_task(send_otp_email, clean_email, raw_otp, user.full_name)

    return UserRegisterResponse(
        success=True,
        message="Account created! Please enter the 6-digit verification code sent to your email.",
        email=clean_email,
        is_verified=False,
    )


@router.post("/verify-email", response_model=VerifyOtpResponse)
def verify_email(request: VerifyOtpRequest, db: Session = Depends(get_db)):
    """
    Validates the 6-digit OTP code against the database record.
    Marks the account as verified and generates a signed JWT session.
    """
    clean_email = request.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email address.",
        )

    # Verify OTP against single-use, attempts limit, and expiration rules
    is_valid, message = verify_email_otp(db, clean_email, request.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )

    # Mark user account as verified
    user.is_verified = True
    db.commit()
    db.refresh(user)

    # Generate authenticated session JWT
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
        avatarId=user.avatar_id,
        avatarUri=user.avatar_uri,
        is_verified=True,
        createdAt=user.created_at.isoformat() if user.created_at else None,
    )

    return VerifyOtpResponse(
        success=True,
        message="Email successfully verified. Welcome to FotoOwl.AI!",
        token=token,
        user=user_response,
    )


@router.post("/resend-otp", response_model=ResendOtpResponse)
def resend_otp(
    request: ResendOtpRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Issues a fresh 6-digit OTP and invalidates previous codes.
    Enforces a 60-second cooldown timer between requests.
    """
    clean_email = request.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is already verified. Please log in directly.",
        )

    # Check cooldown
    can_send, remaining_seconds = can_resend_otp(db, clean_email)
    if not can_send:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {remaining_seconds} seconds before requesting another code.",
        )

    raw_otp = create_and_save_otp(db, clean_email)
    background_tasks.add_task(send_otp_email, clean_email, raw_otp, user.full_name)

    return ResendOtpResponse(
        success=True,
        message="A new 6-digit verification code has been sent to your email.",
        cooldown_seconds=60,
    )


@router.post("/login", response_model=UserLoginResponse)
def login(
    request: UserLoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Authenticates email and password.
    Rejects unverified accounts and automatically sends a fresh OTP.
    """
    clean_email = request.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password.",
        )

    # Reject unverified account and send fresh OTP
    if not user.is_verified:
        can_send, _ = can_resend_otp(db, clean_email)
        if can_send:
            raw_otp = create_and_save_otp(db, clean_email)
            background_tasks.add_task(send_otp_email, clean_email, raw_otp, user.full_name)

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_VERIFIED",
        )

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
        avatarId=user.avatar_id,
        avatarUri=user.avatar_uri,
        is_verified=True,
        createdAt=user.created_at.isoformat() if user.created_at else None,
    )

    return UserLoginResponse(
        success=True,
        message="Login successful",
        token=token,
        user=user_response,
        is_verified=True,
    )


@router.post("/logout")
def logout():
    """Client-side token disposal endpoint."""
    return {"success": True, "message": "Successfully logged out."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return UserResponse(
        id=current_user.id,
        fullName=current_user.full_name,
        email=current_user.email,
        gender=current_user.gender,
        mobileNumber=current_user.mobile_number,
        address=current_user.address,
        city=current_user.city,
        avatarId=current_user.avatar_id,
        avatarUri=current_user.avatar_uri,
        is_verified=current_user.is_verified,
        createdAt=current_user.created_at.isoformat() if current_user.created_at else None,
    )
