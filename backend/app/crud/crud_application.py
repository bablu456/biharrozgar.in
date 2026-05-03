from __future__ import annotations

import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application


async def get_application(db: AsyncSession, application_id: uuid.UUID) -> Application | None:
    result = await db.execute(select(Application).where(Application.id == application_id))
    return result.scalar_one_or_none()


async def get_applications_by_job(db: AsyncSession, job_id: uuid.UUID) -> list[Application]:
    result = await db.execute(select(Application).where(Application.job_id == job_id))
    return list(result.scalars().all())


async def get_applications_by_user(db: AsyncSession, user_id: uuid.UUID) -> list[Application]:
    result = await db.execute(select(Application).where(Application.applicant_id == user_id))
    return list(result.scalars().all())


async def create_application(
    db: AsyncSession, *, obj_in: dict, applicant_id: uuid.UUID
) -> Application:
    db_obj = Application(**obj_in, applicant_id=applicant_id)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def update_application_status(
    db: AsyncSession, *, db_obj: Application, status: str
) -> Application:
    db_obj.status = status
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj
