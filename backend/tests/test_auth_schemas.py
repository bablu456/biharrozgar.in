from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.security import hash_otp_code, verify_otp_code
from app.models.enums import UserRole
from app.schemas.auth import EmailOTPVerifyPayload, UserRegisterRequest


def test_detailed_registration_normalizes_contact_details() -> None:
    payload = UserRegisterRequest(
        full_name="  Anjali Kumari  ",
        email="  ANJALI@example.com ",
        phone_number="9876543210",
        password="Strong#123",
        role=UserRole.SEEKER,
        district="  patna ",
    )

    assert payload.full_name == "Anjali Kumari"
    assert payload.email == "anjali@example.com"
    assert payload.phone_number == "+919876543210"
    assert payload.district == "patna"


def test_public_registration_rejects_admin_role() -> None:
    with pytest.raises(ValidationError):
        UserRegisterRequest(
            full_name="Admin User",
            email="admin@example.com",
            phone_number="9876543210",
            password="Strong#123",
            role=UserRole.ADMIN,
            district="patna",
        )


def test_email_otp_payload_normalizes_email_and_validates_code() -> None:
    payload = EmailOTPVerifyPayload(email=" USER@example.com ", otp_code="123456")

    assert payload.email == "user@example.com"
    assert payload.otp_code == "123456"

    with pytest.raises(ValidationError):
        EmailOTPVerifyPayload(email="user@example.com", otp_code="12345a")


def test_otp_hash_supports_email_recipient() -> None:
    code_hash = hash_otp_code(
        recipient="user@example.com",
        purpose="login",
        otp_code="123456",
        secret_key="test-secret",
    )

    assert verify_otp_code(
        recipient="user@example.com",
        purpose="login",
        otp_code="123456",
        expected_hash=code_hash,
        secret_key="test-secret",
    )
