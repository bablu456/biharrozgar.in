from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum as SqlEnum, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin
from app.models.enums import OtpPurpose


class AuthOTP(TimestampMixin, Base):
    __tablename__ = "auth_otps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    # Stores either an E.164 phone number or a normalized email address.
    phone: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    purpose: Mapped[OtpPurpose] = mapped_column(
        SqlEnum(OtpPurpose, name="otp_purpose", native_enum=False, validate_strings=True),
        index=True,
        nullable=False,
    )
    code_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
