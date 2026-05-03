from __future__ import annotations

import json
from functools import lru_cache

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    project_name: str = "Bihar Rozgar API"
    environment: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/bihar_rozgar"
    )
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    jwt_secret_key: SecretStr = SecretStr("change-me-access-secret")
    jwt_refresh_secret_key: SecretStr = SecretStr("change-me-refresh-secret")
    otp_secret_key: SecretStr = SecretStr("change-me-otp-secret")
    jwt_algorithm: str = "HS256"

    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    otp_expire_minutes: int = 10
    otp_resend_cooldown_seconds: int = 60
    otp_length: int = 6

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value

        value = value.strip()
        if not value:
            return []

        if value.startswith("["):
            parsed = json.loads(value)
            if not isinstance(parsed, list):
                raise ValueError("CORS_ORIGINS JSON must be a list of strings.")
            return [str(item) for item in parsed]

        return [item.strip() for item in value.split(",") if item.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
