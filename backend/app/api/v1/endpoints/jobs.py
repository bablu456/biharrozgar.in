from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import dependencies
from app.crud import crud_job
from app.models.enums import JobStatus
from app.schemas.job import Job, JobCreate, JobUpdate

router = APIRouter()


@router.get("/", response_model=list[Job])
async def read_jobs(
    db: AsyncSession = Depends(dependencies.get_db),
    skip: int = 0,
    limit: int = 100,
    district: str | None = None,
    category: str | None = None,
) -> Any:
    """
    Retrieve jobs.
    """
    jobs = await crud_job.get_jobs(
        db, skip=skip, limit=limit, district=district, category=category
    )
    return jobs


from app.dependencies.auth import CurrentUser

@router.post("/", response_model=Job)
async def create_job(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    job_in: JobCreate,
    current_user: CurrentUser,
) -> Any:
    """
    Create new job.
    """
    if not current_user.profile or current_user.profile.role != "employer":
        raise HTTPException(status_code=403, detail="Only employers can post jobs")
        
    job = await crud_job.create_job(db, obj_in=job_in.model_dump(), employer_id=current_user.id)
    return job

@router.get("/my", response_model=list[Job])
async def read_my_jobs(
    current_user: CurrentUser,
    db: AsyncSession = Depends(dependencies.get_db),
) -> Any:
    """
    Get current user's (employer's) jobs.
    """
    jobs = await crud_job.get_jobs(db, employer_id=current_user.id, status=None)
    return jobs


@router.get("/{id}", response_model=Job)
async def read_job(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    id: uuid.UUID,
) -> Any:
    """
    Get job by ID.
    """
    job = await crud_job.get_job(db, job_id=id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.put("/{id}", response_model=Job)
async def update_job(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    id: uuid.UUID,
    job_in: JobUpdate,
    # current_user = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Update a job.
    """
    job = await crud_job.get_job(db, job_id=id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    # Check permissions here (is current_user the employer?)
    job = await crud_job.update_job(db, db_obj=job, obj_in=job_in.model_dump(exclude_unset=True))
    return job


@router.delete("/{id}", response_model=bool)
async def delete_job(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    id: uuid.UUID,
    # current_user = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Delete a job.
    """
    success = await crud_job.delete_job(db, job_id=id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")
    return success
