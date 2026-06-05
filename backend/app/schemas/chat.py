from __future__ import annotations

from typing import List

from pydantic import BaseModel, field_validator

from app.core.openrouter_models import DEFAULT_CHAT_MODEL_ID, OPENROUTER_CHAT_MODEL_IDS


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model_id: str = DEFAULT_CHAT_MODEL_ID

    @field_validator("model_id")
    @classmethod
    def validate_model_id(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            return DEFAULT_CHAT_MODEL_ID
        if cleaned not in OPENROUTER_CHAT_MODEL_IDS:
            raise ValueError("Unsupported OpenRouter chat model.")
        return cleaned
