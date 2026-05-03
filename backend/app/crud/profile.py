from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import Profile


def _to_uuid(value: uuid.UUID | str) -> uuid.UUID:
    return value if isinstance(value, uuid.UUID) else uuid.UUID(value)


async def get_by_user_id(session: AsyncSession, user_id: uuid.UUID | str) -> Profile | None:
    statement = select(Profile).where(Profile.id == _to_uuid(user_id))
    result = await session.execute(statement)
    return result.scalar_one_or_none()


async def update_fields(
    session: AsyncSession,
    profile: Profile,
    *,
    values: dict[str, Any],
) -> Profile:
    for key, value in values.items():
        setattr(profile, key, value)

    await session.flush()
    return profile
