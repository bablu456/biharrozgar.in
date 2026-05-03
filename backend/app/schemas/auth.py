from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.security import normalize_phone_number
from app.models.enums import UserRole
from app.schemas.profile import ProfileRead


class PhoneNumberPayload(BaseModel):
    phone: str = Field(
        ...,
        description="Phone number in 10-digit local or full E.164 format.",
        examples=["9876543210", "+919876543210"],
    )

    @field_validator("phone")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        return normalize_phone_number(value)


class OTPRequest(PhoneNumberPayload):
    pass


class OTPVerifyPayload(PhoneNumberPayload):
    otp_code: str = Field(..., min_length=6, max_length=6, examples=["123456"])

    @field_validator("otp_code")
    @classmethod
    def validate_otp_code(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) != 6 or not cleaned.isdigit():
            raise ValueError("OTP code must be a 6-digit numeric value.")
        return cleaned


class RegisterVerifyRequest(OTPVerifyPayload):
    role: UserRole = Field(..., description="Whether the account is for a seeker or employer.")
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    company_name: str | None = Field(default=None, min_length=2, max_length=255)
    district: str | None = Field(default=None, min_length=2, max_length=100)

    @field_validator("full_name", "company_name", "district", mode="before")
    @classmethod
    def strip_optional_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @model_validator(mode="after")
    def validate_name_for_role(self) -> "RegisterVerifyRequest":
        if self.role == UserRole.EMPLOYER and not self.company_name:
            raise ValueError("company_name is required when registering an employer account.")

        if self.role != UserRole.EMPLOYER and not self.full_name:
            raise ValueError("full_name is required when registering a seeker account.")

        return self


class LoginVerifyRequest(OTPVerifyPayload):
    pass


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=32)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone: str
    is_active: bool
    phone_verified_at: datetime | None = None
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class TokenPair(BaseModel):
    token_type: str = "bearer"
    access_token: str
    refresh_token: str
    access_token_expires_at: datetime
    refresh_token_expires_at: datetime


class OTPChallengeResponse(BaseModel):
    message: str
    expires_in_seconds: int
    retry_after_seconds: int
    debug_otp_code: str | None = None


class AuthenticatedSession(BaseModel):
    user: UserRead
    profile: ProfileRead


class AuthResponse(AuthenticatedSession):
    tokens: TokenPair
