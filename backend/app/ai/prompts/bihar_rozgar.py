from __future__ import annotations

from collections.abc import Sequence
from typing import Literal, TypedDict


class PromptMessage(TypedDict):
    role: Literal["system", "user"]
    content: str


DEFAULT_PLATFORM_CONTEXT: tuple[str, ...] = (
    "BiharRozgar is a hyper-local job portal focused on Bihar districts such as Patna, Gaya, Muzaffarpur, and nearby local markets.",
    "The platform mainly serves small and medium businesses such as coaching institutes, retail shops, clinics, delivery services, and daily-wage employers.",
    "Key platform features include district-wise search, free access for job seekers, and one-click WhatsApp apply.",
)


BIHAR_ROZGAR_SYSTEM_PROMPT = """You are BiharRozgar, the AI career assistant for BiharRozgar.in.

Mission:
- Help youth in Bihar find relevant local job opportunities.
- Help employers understand how BiharRozgar supports local hiring.

RAG Rules:
- Always prioritize facts from the provided Platform Context and Retrieved Documents.
- When a relevant job is present in the retrieved data, mention only verified details such as Job Title, Location, and Company Name.
- If a specific job is not present in the retrieved data, clearly say it is not currently available in the database and suggest checking BiharRozgar.in for the latest updates.
- Never invent job titles, salaries, company names, openings, locations, or contact details.

Tone and Style:
- Keep the reply concise, supportive, and easy to understand.
- Use a practical Hinglish mix so it feels natural for users in Bihar.
- Focus on direct help instead of long explanations.

Guardrails:
- Only help with job search and BiharRozgar platform support.
- Do not answer unrelated topics.
- For technical issues, direct contact, or account help, guide the user to BiharRozgar WhatsApp support or the Contact Us page.
"""


def _normalize_items(items: Sequence[str] | None) -> list[str]:
    if not items:
        return []
    return [item.strip() for item in items if item and item.strip()]


def _render_section(title: str, items: Sequence[str], empty_message: str) -> str:
    if not items:
        return f"{title}:\n- {empty_message}"
    rendered_items = "\n".join(f"- {item}" for item in items)
    return f"{title}:\n{rendered_items}"


def build_bihar_rozgar_messages(
    user_query: str,
    *,
    retrieved_documents: Sequence[str] | None = None,
    platform_context: Sequence[str] | None = None,
) -> list[PromptMessage]:
    normalized_query = user_query.strip()
    if not normalized_query:
        raise ValueError("user_query must not be blank.")

    context_items = _normalize_items(
        platform_context if platform_context is not None else DEFAULT_PLATFORM_CONTEXT
    )
    retrieved_items = _normalize_items(retrieved_documents)

    user_prompt = "\n\n".join(
        (
            _render_section(
                "Platform Context",
                context_items,
                "Use the built-in BiharRozgar platform description only.",
            ),
            _render_section(
                "Retrieved Documents",
                retrieved_items,
                "No matching documents were retrieved. If the requested job is missing, say so politely and guide the user to BiharRozgar.in for the latest updates.",
            ),
            f"User Query:\n- {normalized_query}",
            "Respond using only the verified information above and keep the answer concise.",
        )
    )

    return [
        {"role": "system", "content": BIHAR_ROZGAR_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]
