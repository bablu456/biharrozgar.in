from __future__ import annotations

import hashlib
import hmac
import re
import secrets
import string
from datetime import UTC, datetime, timedelta
from typing import Any, Literal
from uuid import uuid4

import jwt
from jwt import InvalidTokenError
from passlib.context import CryptContext

PHONE_PATTERN = re.compile(r"^\+[1-9]\d{9,14}$")
PASSWORD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenValidationError(ValueError):
    """Raised when a JWT cannot be validated."""


def utc_now() -> datetime:
    return datetime.now(UTC)


def normalize_phone_number(phone_number: str) -> str:
    raw = re.sub(r"[^\d+]", "", phone_number.strip())

    if raw.startswith("00"):
        raw = f"+{raw[2:]}"

    if raw.isdigit() and len(raw) == 10:
        raw = f"+91{raw}"
    elif raw.isdigit():
        raw = f"+{raw}"

    if not PHONE_PATTERN.fullmatch(raw):
        raise ValueError("Phone number must be a valid 10-digit or E.164 formatted value.")

    return raw


def generate_otp_code(length: int) -> str:
    alphabet = string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def hash_otp_code(*, recipient: str, purpose: str, otp_code: str, secret_key: str) -> str:
    payload = f"{recipient}:{purpose}:{otp_code}".encode("utf-8")
    return hmac.new(secret_key.encode("utf-8"), payload, hashlib.sha256).hexdigest()


def verify_otp_code(
    *,
    recipient: str,
    purpose: str,
    otp_code: str,
    expected_hash: str,
    secret_key: str,
) -> bool:
    computed_hash = hash_otp_code(
        recipient=recipient,
        purpose=purpose,
        otp_code=otp_code,
        secret_key=secret_key,
    )
    return hmac.compare_digest(computed_hash, expected_hash)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return PASSWORD_CONTEXT.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return PASSWORD_CONTEXT.hash(password)


def create_jwt_token(
    *,
    subject: str,
    token_type: Literal["access", "refresh"],
    secret_key: str,
    algorithm: str,
    expires_delta: timedelta,
    role: str | None = None,
) -> tuple[str, datetime]:
    issued_at = utc_now()
    expires_at = issued_at + expires_delta

    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "jti": uuid4().hex,
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    if role is not None:
        payload["role"] = role

    token = jwt.encode(payload, secret_key, algorithm=algorithm)
    return token, expires_at


def decode_jwt_token(
    *,
    token: str,
    secret_key: str,
    algorithm: str,
    expected_type: Literal["access", "refresh"],
) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[algorithm],
            options={"require": ["exp", "iat", "sub", "type"]},
        )
    except InvalidTokenError as exc:
        raise TokenValidationError("Token is invalid or expired.") from exc

    token_type = payload.get("type")
    if token_type != expected_type:
        raise TokenValidationError("Token type is not valid for this operation.")

    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject:
        raise TokenValidationError("Token subject is missing.")

    return payload
