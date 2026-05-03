from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import ApplicationStatus


class ApplicationBase(BaseModel):
    job_id: uuid.UUID
    cover_letter: str | None = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus | None = None


class ApplicationInDBBase(ApplicationBase):
    id: uuid.UUID
    applicant_id: uuid.UUID
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Application(ApplicationInDBBase):
    pass
