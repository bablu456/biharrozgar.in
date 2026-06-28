from __future__ import annotations

from app.services.ai_chat import FALLBACK_ASSISTANT_REPLY, _get_assistant_reply_text


def test_get_assistant_reply_text_falls_back_for_null_content() -> None:
    assert _get_assistant_reply_text({"content": None}) == FALLBACK_ASSISTANT_REPLY


def test_get_assistant_reply_text_flattens_text_parts() -> None:
    message = {
        "content": [
            {"type": "text", "text": "Pehla jawab"},
            {"type": "tool_call", "id": "ignored"},
            {"type": "text", "text": "Doosra jawab"},
        ]
    }

    assert _get_assistant_reply_text(message) == "Pehla jawab\nDoosra jawab"
