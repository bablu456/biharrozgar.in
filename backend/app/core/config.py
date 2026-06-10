from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    project_name: str = "Bihar Rozgar API"
    environment: str = "development"
    debug: bool = Field(
        default=False,
        validation_alias=AliasChoices("API_DEBUG", "DEBUG"),
    )
    api_v1_prefix: str = "/api/v1"
    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/bihar_rozgar"
    )
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    jwt_secret_key: SecretStr = SecretStr("change-me-access-secret-at-least-32-characters")
    jwt_refresh_secret_key: SecretStr = SecretStr("change-me-refresh-secret-at-least-32-characters")
    otp_secret_key: SecretStr = SecretStr("change-me-otp-secret-at-least-32-characters")
    openrouter_api_key: SecretStr = SecretStr("")
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_http_referer: str = "https://biharrozgar.in"
    openrouter_app_title: str = "Bihar Rozgar AI"
    openrouter_timeout_seconds: float = 60.0
    openrouter_max_retries: int = 2
    openrouter_retry_backoff_seconds: float = 0.75
    openrouter_embedding_model: str = "openai/text-embedding-3-small"
    openrouter_embedding_fallback_models: list[str] = Field(default_factory=lambda: ["text-embedding-3-small"])
    openrouter_embedding_dimensions: int = 1536
    openrouter_embedding_batch_size: int = 32
    mail_host: str = "smtp.gmail.com"
    mail_port: int = 587
    mail_username: str = ""
    mail_password: str = ""
    mail_from: str = ""
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

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug_flag(cls, value: object) -> bool:
        if isinstance(value, bool):
            return value
        if value is None:
            return False
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "y", "on"}:
                return True
            if normalized in {"0", "false", "no", "n", "off", "release", "prod", "production"}:
                return False
        raise ValueError("DEBUG must be a boolean-like value (true/false).")

    @field_validator("openrouter_embedding_fallback_models", mode="before")
    @classmethod
    def parse_embedding_fallback_models(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]

        value = value.strip()
        if not value:
            return []

        if value.startswith("["):
            parsed = json.loads(value)
            if not isinstance(parsed, list):
                raise ValueError("OPENROUTER_EMBEDDING_FALLBACK_MODELS JSON must be a list.")
            return [str(item).strip() for item in parsed if str(item).strip()]

        return [item.strip() for item in value.split(",") if item.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
