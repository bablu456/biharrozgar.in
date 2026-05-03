from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import utc_now
from app.models.enums import UserRole
from app.models.profile import Profile
from app.models.user import User


def _to_uuid(value: uuid.UUID | str) -> uuid.UUID:
    return value if isinstance(value, uuid.UUID) else uuid.UUID(value)


async def get_by_id(session: AsyncSession, user_id: uuid.UUID | str) -> User | None:
    statement = (
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == _to_uuid(user_id))
    )
    result = await session.execute(statement)
    return result.scalar_one_or_none()


async def get_by_phone(session: AsyncSession, phone_number: str) -> User | None:
    statement = (
        select(User)
        .options(selectinload(User.profile))
        .where(User.phone == phone_number)
    )
    result = await session.execute(statement)
    return result.scalar_one_or_none()


async def create_with_profile(
    session: AsyncSession,
    *,
    phone_number: str,
    role: UserRole,
    full_name: str,
    district: str | None = None,
) -> User:
    user_id = uuid.uuid4()
    verified_at = utc_now()

    user = User(
        id=user_id,
        phone=phone_number,
        phone_verified_at=verified_at,
        last_login_at=verified_at,
    )
    profile = Profile(
        id=user_id,
        phone=phone_number,
        role=role,
        full_name=full_name,
        district=district,
    )
    user.profile = profile

    session.add(user)
    await session.flush()
    return user


async def mark_logged_in(session: AsyncSession, user: User) -> User:
    now = utc_now()
    user.last_login_at = now
    user.phone_verified_at = user.phone_verified_at or now
    await session.flush()
    return user
