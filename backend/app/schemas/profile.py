from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import UserRole


class ProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone: str | None = None
    full_name: str | None = None
    role: UserRole
    district: str | None = None
    city: str | None = None
    gender: str | None = None
    education: str | None = None
    bio: str | None = None
    skills: list[str] | None = None
    experience_years: int | None = None
    whatsapp_notifications: bool
    email_notifications: bool
    is_premium: bool
    premium_plan: str | None = None
    premium_expires_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ProfileResponse(BaseModel):
    name: str | None = None
    email: str
    phone: str | None = None
    district: str | None = None
    city: str | None = None
    gender: str | None = None
    education: str | None = None
    bio: str | None = None
    skills: list[str] | None = None
    experience_years: int | None = None
    resume_url: str | None = None


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    district: str | None = Field(default=None, min_length=2, max_length=100)
    city: str | None = Field(default=None, min_length=2, max_length=100)
    gender: str | None = Field(default=None, max_length=20)
    education: str | None = Field(default=None, max_length=255)
    bio: str | None = Field(default=None, max_length=5000)
    skills: list[str] | None = Field(default=None, max_length=30)
    experience_years: int | None = Field(default=None, ge=0, le=60)

    @field_validator("full_name", "district", "city", "gender", "education", "bio", mode="before")
    @classmethod
    def strip_optional_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("skills")
    @classmethod
    def normalize_skills(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return [item.strip() for item in value if item.strip()]
