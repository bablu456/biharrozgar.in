from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import ApplicationStatus

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.profile import Profile


class Application(TimestampMixin, Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("job_id", "applicant_id", name="unique_job_applicant"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    applicant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        String(20), default=ApplicationStatus.PENDING
    )
    cover_letter: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    job: Mapped[Job] = relationship("Job", back_populates="applications")
    applicant: Mapped[Profile] = relationship("Profile", back_populates="applications")
