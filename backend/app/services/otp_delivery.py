from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


async def send_otp_code(*, phone_number: str, otp_code: str, purpose: str) -> None:
    """Placeholder transport for OTP delivery.

    Replace this with Twilio, MSG91, Gupshup, or another SMS provider client.
    """

    logger.info("Prepared %s OTP delivery for %s.", purpose, phone_number)
    logger.debug("OTP code for %s is %s", phone_number, otp_code)
