from __future__ import annotations

import pytest

from app.ai.prompts import (
    BIHAR_ROZGAR_SYSTEM_PROMPT,
    DEFAULT_PLATFORM_CONTEXT,
    build_bihar_rozgar_messages,
)


def test_system_prompt_keeps_core_guardrails() -> None:
    assert "You are Rozgar Mitra" in BIHAR_ROZGAR_SYSTEM_PROMPT
    assert "Never invent job listings, candidate profiles, salaries, company names, openings, locations, contact details, or application states." in BIHAR_ROZGAR_SYSTEM_PROMPT
    assert "Only help with jobs, career counseling, resume building, and BiharRozgar.in platform features." in BIHAR_ROZGAR_SYSTEM_PROMPT
    assert "Speak in conversational, professional Hinglish" in BIHAR_ROZGAR_SYSTEM_PROMPT


def test_system_prompt_keeps_privacy_refusal() -> None:
    assert "never reveal personal identities, private contact details, or specific historical sensitive data" in BIHAR_ROZGAR_SYSTEM_PROMPT
    assert 'I cannot share any personal information or details from past conversations due to privacy reasons.' in BIHAR_ROZGAR_SYSTEM_PROMPT


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
    assert "Employer pricing: Premium plan is Rs 2999 per month" in messages[1]["content"]
    assert "FastTrack Logistics" in messages[1]["content"]
    assert "Patna mein delivery boy ki job hai?" in messages[1]["content"]


def test_message_builder_requires_non_blank_user_query() -> None:
    with pytest.raises(ValueError):
        build_bihar_rozgar_messages("   ")
