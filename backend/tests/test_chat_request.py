from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.openrouter_models import DEFAULT_CHAT_MODEL_ID
from app.schemas.chat import ChatMessage, ChatRequest


def test_chat_request_defaults_to_recommended_model() -> None:
    request = ChatRequest(messages=[ChatMessage(role="user", content="Hello")])

    assert request.model_id == DEFAULT_CHAT_MODEL_ID


def test_chat_request_rejects_unknown_model() -> None:
    with pytest.raises(ValidationError):
        ChatRequest(
            messages=[ChatMessage(role="user", content="Hello")],
            model_id="openai/gpt-4o",
        )
