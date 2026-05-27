from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.profile import Profile


class JobRecommendation(Base):
    __tablename__ = "job_recommendations"
    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_job_recommendations_user_job"),
        CheckConstraint("match_score >= 0 AND match_score <= 100", name="ck_job_recommendations_match_score"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    match_score: Mapped[int] = mapped_column(Integer, nullable=False)
    ai_reason: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped[Profile] = relationship("Profile", back_populates="job_recommendations")
    job: Mapped[Job] = relationship("Job", back_populates="recommendations")
