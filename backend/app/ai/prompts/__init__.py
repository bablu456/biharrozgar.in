"""Prompt templates and prompt versioning."""

from app.ai.prompts.bihar_rozgar import (
    BIHAR_ROZGAR_SYSTEM_PROMPT,
    DEFAULT_PLATFORM_CONTEXT,
    PromptMessage,
    build_bihar_rozgar_messages,
)

__all__ = [
    "BIHAR_ROZGAR_SYSTEM_PROMPT",
    "DEFAULT_PLATFORM_CONTEXT",
    "PromptMessage",
    "build_bihar_rozgar_messages",
]
