import secrets
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from ..models.otp import EmailOTP
from ..core.security import hash_otp, verify_otp
from ..core.config import settings


def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit numeric OTP."""
    # secrets.randbelow(900000) produces 0..899999, so result is 100000..999999
    code = secrets.randbelow(900000) + 100000
    return str(code)


def can_resend_otp(db: Session, email: str) -> Tuple[bool, int]:
    """Check whether a new OTP can be requested based on cooldown timer."""
    clean_email = email.lower().strip()
    latest_otp = (
        db.query(EmailOTP)
        .filter(EmailOTP.email == clean_email)
        .order_by(EmailOTP.id.desc())
        .first()
    )

    if not latest_otp:
        return True, 0

    now = datetime.now(timezone.utc)
    # Ensure latest_otp.created_at is timezone-aware
    created_at = latest_otp.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    cooldown_expiry = created_at + timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS)
    if now < cooldown_expiry:
        remaining_seconds = int((cooldown_expiry - now).total_seconds())
        return False, max(1, remaining_seconds)

    return True, 0


def create_and_save_otp(db: Session, email: str) -> str:
    """
    Invalidates any previous active OTPs for the email,
    generates a new 6-digit code, securely hashes it, and saves it.
    Returns the plain-text OTP to be sent via email.
    """
    clean_email = email.lower().strip()

    # Invalidate previous unused OTPs
    db.query(EmailOTP).filter(
        EmailOTP.email == clean_email,
        EmailOTP.is_used == False
    ).update({"is_used": True}, synchronize_session=False)

    raw_otp = generate_otp()
    otp_hash = hash_otp(raw_otp, clean_email)

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    new_otp_record = EmailOTP(
        email=clean_email,
        otp_hash=otp_hash,
        attempts=0,
        is_used=False,
        expires_at=expires_at,
        created_at=now,
    )

    db.add(new_otp_record)
    db.commit()
    db.refresh(new_otp_record)

    return raw_otp


def verify_email_otp(db: Session, email: str, raw_otp: str) -> Tuple[bool, str]:
    """
    Validates the supplied OTP against the database record.
    Enforces expiration, attempt limits, single-use, and atomic state updates.
    """
    clean_email = email.lower().strip()
    clean_otp = raw_otp.strip()

    latest_otp = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == clean_email,
            EmailOTP.is_used == False
        )
        .order_by(EmailOTP.id.desc())
        .first()
    )

    if not latest_otp:
        return False, "No active verification code found. Please request a new code."

    # Check attempt limits
    if latest_otp.attempts >= settings.MAX_OTP_ATTEMPTS:
        latest_otp.is_used = True
        db.commit()
        return False, "Too many incorrect attempts. This code has been invalidated. Please request a new code."

    # Check expiration
    now = datetime.now(timezone.utc)
    expires_at = latest_otp.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        latest_otp.is_used = True
        db.commit()
        return False, "Verification code has expired. Please request a new code."

    # Verify cryptographic hash
    if verify_otp(clean_otp, clean_email, latest_otp.otp_hash):
        # Atomic single-use consumption
        latest_otp.is_used = True
        db.commit()
        return True, "Email verified successfully."
    else:
        latest_otp.attempts += 1
        db.commit()
        remaining = settings.MAX_OTP_ATTEMPTS - latest_otp.attempts
        if remaining > 0:
            return False, f"Incorrect verification code. {remaining} attempt{'s' if remaining > 1 else ''} remaining."
        else:
            latest_otp.is_used = True
            db.commit()
            return False, "Too many incorrect attempts. This code has been invalidated. Please request a new code."
