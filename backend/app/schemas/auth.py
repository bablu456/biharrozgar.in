from __future__ import annotations

from datetime import datetime
import re
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.security import normalize_phone_number
from app.models.enums import UserRole
from app.schemas.profile import ProfileRead

PASSWORD_UPPERCASE_PATTERN = re.compile(r"[A-Z]")
PASSWORD_LOWERCASE_PATTERN = re.compile(r"[a-z]")
PASSWORD_NUMBER_PATTERN = re.compile(r"\d")
PASSWORD_SPECIAL_PATTERN = re.compile(r"[^A-Za-z0-9]")


class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., max_length=255, examples=["user@example.com"])
    phone_number: str = Field(
        ...,
        description="Phone number in 10-digit local or full E.164 format.",
        examples=["9876543210", "+919876543210"],
    )
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = Field(default=UserRole.SEEKER)
    district: str = Field(..., min_length=2, max_length=100)

    @field_validator("full_name", "district")
    @classmethod
    def strip_required_strings(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field is required.")
        return cleaned

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if not email or "@" not in email:
            raise ValueError("Email must be a valid email address.")
        return email

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        return normalize_phone_number(value)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not PASSWORD_UPPERCASE_PATTERN.search(value):
            raise ValueError("Password must include at least one uppercase letter.")
        if not PASSWORD_LOWERCASE_PATTERN.search(value):
            raise ValueError("Password must include at least one lowercase letter.")
        if not PASSWORD_NUMBER_PATTERN.search(value):
            raise ValueError("Password must include at least one number.")
        if not PASSWORD_SPECIAL_PATTERN.search(value):
            raise ValueError("Password must include at least one special character.")
        return value

    @field_validator("role")
    @classmethod
    def validate_registration_role(cls, value: UserRole) -> UserRole:
        if value == UserRole.ADMIN:
            raise ValueError("Admin accounts cannot be created through registration.")
        return value


class UserLoginRequest(BaseModel):
    identifier: str = Field(
        ...,
        description="Either the account email address or phone number.",
        examples=["user@example.com", "9876543210", "+919876543210"],
    )
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("identifier")
    @classmethod
    def normalize_identifier(cls, value: str) -> str:
        identifier = value.strip()
        if not identifier:
            raise ValueError("Identifier is required.")

        if "@" in identifier:
            return identifier.lower()

        return normalize_phone_number(identifier)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Password is required.")
        return value


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


class EmailPayload(BaseModel):
    email: str = Field(..., max_length=255, examples=["user@example.com"])

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if not email or "@" not in email:
            raise ValueError("Email must be a valid email address.")
        return email


class EmailOTPRequest(EmailPayload):
    pass


class EmailOTPVerifyPayload(EmailPayload):
    otp_code: str = Field(..., min_length=6, max_length=6, examples=["123456"])

    @field_validator("otp_code")
    @classmethod
    def validate_otp_code(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) != 6 or not cleaned.isdigit():
            raise ValueError("OTP code must be a 6-digit numeric value.")
        return cleaned


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
        if self.role == UserRole.ADMIN:
            raise ValueError("Admin accounts cannot be created through registration.")

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
    email: str
    phone_number: str
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
