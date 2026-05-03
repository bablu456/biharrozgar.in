from __future__ import annotations

import pytest

from app.ai.prompts import (
    BIHAR_ROZGAR_SYSTEM_PROMPT,
    DEFAULT_PLATFORM_CONTEXT,
    build_bihar_rozgar_messages,
)


def test_system_prompt_keeps_core_guardrails() -> None:
    assert "Never invent job titles, salaries, company names, openings, locations, or contact details." in BIHAR_ROZGAR_SYSTEM_PROMPT
    assert "Only help with job search and BiharRozgar platform support." in BIHAR_ROZGAR_SYSTEM_PROMPT
    assert "Use a practical Hinglish mix" in BIHAR_ROZGAR_SYSTEM_PROMPT


def test_message_builder_includes_context_retrieval_and_query() -> None:
    messages = build_bihar_rozgar_messages(
        "Patna mein delivery boy ki job hai?",
        retrieved_documents=(
            "Job Title: Delivery Boy | Location: Patna | Company Name: FastTrack Logistics",
        ),
    )

    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"
    assert "Platform Context" in messages[1]["content"]
    assert DEFAULT_PLATFORM_CONTEXT[0] in messages[1]["content"]
    assert "FastTrack Logistics" in messages[1]["content"]
    assert "Patna mein delivery boy ki job hai?" in messages[1]["content"]


def test_message_builder_requires_non_blank_user_query() -> None:
    with pytest.raises(ValueError):
        build_bihar_rozgar_messages("   ")
