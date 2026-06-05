from __future__ import annotations

import asyncio
import logging
import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


async def send_phone_otp_code(recipient: str, otp_code: str, purpose: str) -> None:
    """Placeholder transport for OTP delivery.

    Replace this with Twilio, MSG91, Gupshup, or another SMS provider client.
    """

    logger.info("Prepared %s phone OTP delivery for %s.", purpose, recipient)
    logger.debug("OTP code for %s is %s", recipient, otp_code)


async def send_email_otp_code(recipient: str, otp_code: str, purpose: str) -> None:
    if not settings.smtp_host or not settings.smtp_from_email:
        if settings.environment.strip().lower() != "development":
            raise RuntimeError(
                "Email OTP delivery is not configured. Configure the SMTP settings."
            )

        logger.warning(
            "SMTP is not configured; prepared %s email OTP for %s without sending it.",
            purpose,
            recipient,
        )
        logger.debug("OTP code for %s is %s", recipient, otp_code)
        return

    message = EmailMessage()
    message["Subject"] = "Your Bihar Rozgar login OTP"
    message["From"] = settings.smtp_from_email
    message["To"] = recipient
    message.set_content(
        f"Your Bihar Rozgar login OTP is {otp_code}. "
        f"It expires in {settings.otp_expire_minutes} minutes."
    )

    await asyncio.to_thread(_send_email_message, message)


def _send_email_message(message: EmailMessage) -> None:
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls(context=ssl.create_default_context())

        password = settings.smtp_password.get_secret_value()
        if settings.smtp_username and password:
            smtp.login(settings.smtp_username, password)

        smtp.send_message(message)
