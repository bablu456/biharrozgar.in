from __future__ import annotations

from datetime import datetime

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auth_otp import AuthOTP
from app.models.enums import OtpPurpose


async def get_latest_pending(
    session: AsyncSession,
    *,
    phone_number: str,
    purpose: OtpPurpose,
) -> AuthOTP | None:
    statement = (
        select(AuthOTP)
        .where(
            AuthOTP.phone == phone_number,
            AuthOTP.purpose == purpose,
            AuthOTP.consumed_at.is_(None),
        )
        .order_by(desc(AuthOTP.created_at))
        .limit(1)
    )
    result = await session.execute(statement)
    return result.scalar_one_or_none()


async def create(
    session: AsyncSession,
    *,
    phone_number: str,
    purpose: OtpPurpose,
    code_hash: str,
    expires_at: datetime,
) -> AuthOTP:
    otp = AuthOTP(
        phone=phone_number,
        purpose=purpose,
        code_hash=code_hash,
        expires_at=expires_at,
    )
    session.add(otp)
    await session.flush()
    return otp


async def mark_consumed(session: AsyncSession, otp: AuthOTP, *, consumed_at: datetime) -> AuthOTP:
    otp.consumed_at = consumed_at
    await session.flush()
    return otp


async def increment_attempts(session: AsyncSession, otp: AuthOTP) -> AuthOTP:
    otp.attempts += 1
    await session.flush()
    return otp
