from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import Job
from app.models.enums import JobStatus


async def get_job(db: AsyncSession, job_id: uuid.UUID) -> Job | None:
    result = await db.execute(select(Job).where(Job.id == job_id))
    return result.scalar_one_or_none()


async def get_jobs(
    db: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 100,
    district: str | None = None,
    category: str | None = None,
    status: JobStatus | None = JobStatus.APPROVED,
    employer_id: uuid.UUID | None = None,
) -> list[Job]:
    query = select(Job)
    if status:
        query = query.where(Job.status == status)
    if district:
        query = query.where(Job.district == district)
    if category:
        query = query.where(Job.category == category)
    if employer_id:
        query = query.where(Job.employer_id == employer_id)
    
    query = query.offset(skip).limit(limit).order_by(Job.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_job(db: AsyncSession, *, obj_in: dict[str, Any], employer_id: uuid.UUID) -> Job:
    db_obj = Job(**obj_in, employer_id=employer_id)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def update_job(
    db: AsyncSession, *, db_obj: Job, obj_in: dict[str, Any]
) -> Job:
    for field in obj_in:
        if hasattr(db_obj, field):
            setattr(db_obj, field, obj_in[field])
    
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def delete_job(db: AsyncSession, *, job_id: uuid.UUID) -> bool:
    db_obj = await get_job(db, job_id)
    if not db_obj:
        return False
    await db.delete(db_obj)
    await db.commit()
    return True
