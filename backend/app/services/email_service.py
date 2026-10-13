import smtplib
import logging
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from typing import Tuple
from ..core.config import settings

logger = logging.getLogger("fotoowl.email")
logging.basicConfig(level=logging.INFO)

# Template and Asset paths
TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"
TEMPLATE_HTML_PATH = TEMPLATES_DIR / "email_verification.html"

# Root assets directory
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
LOGO_PATH = WORKSPACE_ROOT / "assets" / "fotoowl-logo.png"


def render_otp_html(otp: str, user_name: str = "") -> str:
    """
    Renders the production-grade branded HTML email template for FotoOwl AI.
    Loads from backend/app/templates/email_verification.html if available.
    """
    if TEMPLATE_HTML_PATH.exists():
        try:
            content = TEMPLATE_HTML_PATH.read_text(encoding="utf-8")
            content = content.replace("{{otp_code}}", otp)
            content = content.replace("{{expire_minutes}}", str(settings.OTP_EXPIRE_MINUTES))
            display_name = user_name.strip() if user_name else "there"
            content = content.replace("{{user_name}}", display_name)
            return content
        except Exception as e:
            logger.warning(f"Failed to read email template file: {e}. Using inline fallback.")

    display_name = user_name.strip() if user_name else "there"
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your FotoOwl AI account</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;">
    <div style="background-color: #071421; padding: 28px 24px; text-align: center;">
      <img src="cid:fotoowl_logo" alt="FotoOwl AI" width="180" style="display: block; margin: 0 auto;" />
      <div style="color: #94A3B8; font-size: 12px; margin-top: 8px; letter-spacing: 2px;">AI EVENT MEMORIES</div>
    </div>
    <div style="padding: 32px 28px;">
      <h1 style="font-size: 20px; color: #071421; margin: 0 0 12px 0;">Verify your email address</h1>
      <p style="font-size: 15px; color: #475467; line-height: 1.6;">Welcome to FotoOwl AI! One quick step to get started: enter the verification code below to verify your email and activate your account.</p>
      <div style="background: #FFF9E6; border: 2px dashed #FFB900; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <div style="font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #071421;">{otp}</div>
        <div style="font-size: 13px; color: #8A5800; margin-top: 8px; font-weight: 600;">Expires in {settings.OTP_EXPIRE_MINUTES} minutes</div>
      </div>
      <p style="font-size: 13px; color: #667085;">If you didn't initiate this request, you can safely ignore this email.</p>
    </div>
    <div style="border-top: 1px solid #F2F4F7; padding: 18px 28px; background: #FAFAFA; font-size: 12px; color: #98A2B3; text-align: center;">
      &copy; 2026 FotoOwl AI. All rights reserved. &bull; support@fotoowl.ai
    </div>
  </div>
</body>
</html>
"""


def render_otp_text(otp: str, user_name: str = "") -> str:
    display_name = user_name.strip() if user_name else "there"
    return f"""FotoOwl AI Verification Code

Hello {display_name},

Welcome to FotoOwl AI! One quick step to get started: enter the verification code below to verify your email and activate your account.

Your verification code is: {otp}

This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.

If you did not request this verification code, please ignore this email.

— The FotoOwl AI Team
Support: support@fotoowl.ai
"""


def send_otp_email(to_email: str, otp: str, user_name: str = "") -> Tuple[bool, str]:
    """
    Sends the 6-digit OTP to the user's email address using the branded FotoOwl AI template.
    Embeds the official FotoOwl AI logo via Content-ID (CID) for instant rendering in Gmail.
    Falls back gracefully to development console output if SMTP credentials are missing or network fails.
    """
    clean_email = to_email.strip()

    # Check if SMTP is configured
    has_smtp = bool(
        settings.SMTP_USERNAME
        and settings.SMTP_PASSWORD
        and settings.SMTP_HOST
    )

    if not has_smtp:
        logger.info(
            f"\n=======================================================\n"
            f"[FOTOOWL AI DEV EMAIL SERVICE] OTP for {clean_email}:\n"
            f"CODE: >> {otp} << (Valid for {settings.OTP_EXPIRE_MINUTES} mins)\n"
            f"=======================================================\n"
        )
        return True, "Development mode: OTP logged to server console."

    try:
        from email.utils import formatdate, make_msgid, parseaddr

        # Extract clean email address for SMTP envelope
        envelope_from = parseaddr(settings.EMAIL_FROM)[1] or settings.SMTP_USERNAME or "bhagatchetan583@gmail.com"

        # Create outer container for related parts (HTML + inline images)
        msg_root = MIMEMultipart("related")
        msg_root["Subject"] = f"FotoOwl AI Verification Code: {otp}"
        msg_root["From"] = f"FotoOwl AI <{envelope_from}>"
        msg_root["Reply-To"] = envelope_from
        msg_root["To"] = clean_email
        msg_root["Date"] = formatdate(localtime=True)
        msg_root["Message-ID"] = make_msgid(domain="gmail.com")

        # Alternative container for text and HTML
        msg_alt = MIMEMultipart("alternative")
        msg_root.attach(msg_alt)

        text_content = render_otp_text(otp, user_name)
        html_content = render_otp_html(otp, user_name)

        part_text = MIMEText(text_content, "plain", "utf-8")
        part_html = MIMEText(html_content, "html", "utf-8")

        msg_alt.attach(part_text)
        msg_alt.attach(part_html)

        # Attach official FotoOwl AI logo with Content-ID for inline rendering
        if LOGO_PATH.exists():
            try:
                logo_bytes = LOGO_PATH.read_bytes()
                logo_image = MIMEImage(logo_bytes, _subtype="png")
                logo_image.add_header("Content-ID", "<fotoowl_logo>")
                logo_image.add_header("Content-Disposition", "inline", filename="fotoowl-logo.png")
                msg_root.attach(logo_image)
            except Exception as img_err:
                logger.warning(f"Could not attach inline logo image: {img_err}")

        # Connect and authenticate via SMTP
        if settings.SMTP_TLS:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)
            server.ehlo()
            server.starttls()
            server.ehlo()
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)

        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(envelope_from, clean_email, msg_root.as_string())
        server.quit()

        logger.info(f"Branded verification email successfully delivered to {clean_email}")
        return True, "Email sent successfully."
    except Exception as e:
        logger.error(f"Failed to send verification email to {clean_email}: {str(e)}")
        # In development, also log the code so developer is not blocked
        logger.info(f"[DEV FALLBACK] OTP for {clean_email}: {otp}")
        return False, f"Email delivery failed: {str(e)}"
