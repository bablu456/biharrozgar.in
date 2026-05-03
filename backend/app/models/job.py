from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import ApplicationMethod, JobStatus, JobType, SalaryType

if TYPE_CHECKING:
    from app.models.profile import Profile


class Job(TimestampMixin, Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    employer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    job_type: Mapped[JobType] = mapped_column(String(50), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    locality: Mapped[str | None] = mapped_column(String(255), nullable=True)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_type: Mapped[SalaryType | None] = mapped_column(String(20), nullable=True)
    is_fresher_friendly: Mapped[bool] = mapped_column(Boolean, default=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    application_method: Mapped[ApplicationMethod] = mapped_column(
        String(20), default=ApplicationMethod.WHATSAPP
    )
    whatsapp_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    application_link: Mapped[str | None] = mapped_column(Text, nullable=True)
    apply_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    views_count: Mapped[int] = mapped_column(Integer, default=0)
    applicants_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[JobStatus] = mapped_column(String(20), default=JobStatus.PENDING)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("profiles.id"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    employer: Mapped[Profile] = relationship(
        "Profile", foreign_keys=[employer_id], back_populates="posted_jobs"
    )
    approver: Mapped[Profile | None] = relationship("Profile", foreign_keys=[approved_by])
    applications: Mapped[list[Application]] = relationship(
        "Application", back_populates="job", cascade="all, delete-orphan"
    )
