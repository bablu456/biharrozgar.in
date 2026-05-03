from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import dependencies
from app.crud import crud_application, crud_job
from app.schemas.application import Application, ApplicationCreate, ApplicationUpdate

from app.dependencies.auth import CurrentUser

router = APIRouter()


@router.post("/", response_model=Application)
async def create_application(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    application_in: ApplicationCreate,
    current_user: CurrentUser,
) -> Any:
    """
    Apply for a job.
    """
    # Check if job exists
    job = await crud_job.get_job(db, job_id=application_in.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if already applied
    # (SQL UniqueConstraint will also catch this)
    
    application = await crud_application.create_application(
        db, obj_in=application_in.model_dump(), applicant_id=current_user.id
    )
    return application


@router.get("/my", response_model=list[Application])
async def read_my_applications(
    current_user: CurrentUser,
    db: AsyncSession = Depends(dependencies.get_db),
) -> Any:
    """
    Get current user's applications.
    """
    applications = await crud_application.get_applications_by_user(db, user_id=current_user.id)
    return applications


@router.get("/job/{job_id}", response_model=list[Application])
async def read_job_applications(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    job_id: uuid.UUID,
    current_user: CurrentUser,
) -> Any:
    """
    Get all applications for a specific job (for employers).
    """
    job = await crud_job.get_job(db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.employer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    applications = await crud_application.get_applications_by_job(db, job_id=job_id)
    return applications


@router.patch("/{id}/status", response_model=Application)
async def update_application_status(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    id: uuid.UUID,
    status_in: ApplicationUpdate,
    current_user: CurrentUser,
) -> Any:
    """
    Update application status (shortlisted, rejected, hired).
    """
    application = await crud_application.get_application(db, application_id=id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    job = await crud_job.get_job(db, job_id=application.job_id)
    if not job or job.employer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    application = await crud_application.update_application_status(
        db, db_obj=application, status=status_in.status
    )
    return application
