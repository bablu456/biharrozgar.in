from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ApplicationMethod, JobStatus, JobType, SalaryType


class JobBase(BaseModel):
    title: str
    description: str
    requirements: str | None = None
    category: str
    job_type: JobType
    district: str
    city: str | None = None
    locality: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_type: SalaryType | None = None
    is_fresher_friendly: bool = False
    application_method: ApplicationMethod = ApplicationMethod.WHATSAPP
    whatsapp_number: str | None = None
    application_link: str | None = None
    apply_instructions: str | None = None


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    requirements: str | None = None
    category: str | None = None
    job_type: JobType | None = None
    district: str | None = None
    city: str | None = None
    locality: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_type: SalaryType | None = None
    is_fresher_friendly: bool | None = None
    status: JobStatus | None = None


class JobInDBBase(JobBase):
    id: uuid.UUID
    employer_id: uuid.UUID
    status: JobStatus
    views_count: int
    applicants_count: int
    is_featured: bool
    is_urgent: bool
    is_premium: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Job(JobInDBBase):
    pass


class JobSearchResults(BaseModel):
    results: list[Job]
    total: int
