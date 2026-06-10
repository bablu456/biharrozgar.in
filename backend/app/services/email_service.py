from __future__ import annotations

import logging
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

conf = ConnectionConfig(
    MAIL_USERNAME=settings.mail_username,
    MAIL_PASSWORD=settings.mail_password,
    MAIL_FROM=settings.mail_from,
    MAIL_PORT=settings.mail_port,
    MAIL_SERVER=settings.mail_host,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

async def send_otp_email(email_to: EmailStr, otp_code: str) -> None:
    if not settings.mail_host or not settings.mail_from:
        if settings.environment.strip().lower() != "development":
            logger.warning("Email OTP delivery is not configured.")
            return

        logger.warning(
            "SMTP is not configured; prepared email OTP for %s without sending it.",
            email_to,
        )
        logger.debug("OTP code for %s is %s", email_to, otp_code)
        return

    html = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to BiharRozgar!</h2>
        <p>Your OTP for verification is: <strong>{otp_code}</strong></p>
        <p>It is valid for {settings.otp_expire_minutes} minutes.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
    </div>
    """

    message = MessageSchema(
        subject="Your BiharRozgar OTP Verification Code",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info("Successfully sent OTP email to %s", email_to)
    except Exception as e:
        logger.error("Failed to send OTP email to %s: %s", email_to, e)
