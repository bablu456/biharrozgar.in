from __future__ import annotations


DEFAULT_CHAT_MODEL_ID = "openai/gpt-oss-20b:free"

OPENROUTER_CHAT_MODEL_IDS: tuple[str, ...] = (
    DEFAULT_CHAT_MODEL_ID,
    "openrouter/free",
    "openai/gpt-oss-120b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "z-ai/glm-4.5-air:free",
    "google/gemma-4-31b-it:free",
    "moonshotai/kimi-k2.6:free",
    "nvidia/nemotron-nano-9b-v2:free",
)

CHAT_FALLBACK_MODEL_IDS: tuple[str, ...] = (
    "openrouter/free",
    "openai/gpt-oss-120b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "z-ai/glm-4.5-air:free",
    "google/gemma-4-31b-it:free",
    "moonshotai/kimi-k2.6:free",
    "nvidia/nemotron-nano-9b-v2:free",
)
