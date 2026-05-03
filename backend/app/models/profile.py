from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from app.models.base import Base, TimestampMixin
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.user import User


class Profile(TimestampMixin, Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        SqlEnum(UserRole, name="user_role", native_enum=False, validate_strings=True),
        nullable=False,
        default=UserRole.SEEKER,
        server_default=UserRole.SEEKER.value,
    )
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    resume_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    resume_parsed: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    skills: Mapped[list[str] | None] = mapped_column(ARRAY(String()), nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    whatsapp_notifications: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=expression.true(),
    )
    email_notifications: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=expression.true(),
    )
    is_premium: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=expression.false(),
    )
    premium_plan: Mapped[str | None] = mapped_column(String(50), nullable=True)
    premium_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    user: Mapped[User] = relationship(back_populates="profile", lazy="selectin")
    posted_jobs: Mapped[list[Job]] = relationship(
        "Job", foreign_keys="Job.employer_id", back_populates="employer", cascade="all, delete-orphan"
    )
    applications: Mapped[list[Application]] = relationship(
        "Application", back_populates="applicant", cascade="all, delete-orphan"
    )
