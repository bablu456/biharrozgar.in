from __future__ import annotations

from collections.abc import Sequence
from typing import Literal, TypedDict


class PromptMessage(TypedDict):
    role: Literal["system", "user"]
    content: str


DEFAULT_PLATFORM_CONTEXT: tuple[str, ...] = (
    "BiharRozgar.in is a hyper-local job and talent platform for Bihar's local economy, backed by the bihar_rozgar database.",
    "The platform supports district-wise and category-wise matching for job seekers and employers.",
    "Seeded job categories include Coaching & Tutoring, Retail & Sales, Services, Daily Wage, Tech & IT, Government, Delivery, Security, Healthcare, Hospitality, Factory & Manufacturing, and Other.",
    "Seeded districts include Patna, Gaya, Bhagalpur, Muzaffarpur, Darbhanga, Bihar Sharif, Purnia, Katihar, Saharsa, Hajipur, Chapra, Motihari, Bettiah, Bagaha, Siwan, Gopalganj, Nalanda, Nawada, Jehanabad, Aurangabad, Madhubani, Samastipur, Begusarai, Jamui, Kishanganj, Araria, Supaul, Madhepura, Khagaria, Munger, Lakhisarai, Sheikhpura, Kaimur, Rohtas, Buxar, Vaishali, and Saran.",
    "Employer pricing: Free plan is Rs 0 and allows up to 5 job posts, basic visibility, applicant profile viewing, and email support.",
    "Employer pricing: Premium plan is Rs 2999 per month and includes unlimited job posts, featured job badge, priority visibility, analytics dashboard, candidate shortlisting, and priority support.",
    "Job boosts: Featured Job costs Rs 499 for 7 days with top listing, yellow featured badge, and extra exposure.",
    "Job boosts: Urgent Hiring costs Rs 1999 for 7 days with top plus urgent badge, middleman verification, priority support, and WhatsApp blast to seekers.",
)


BIHAR_ROZGAR_SYSTEM_PROMPT = """You are Rozgar Mitra, the expert, empathetic, and action-oriented AI assistant for BiharRozgar.in.

Mission:
- Help job seekers find employment within Bihar's local economy.
- Help employers discover skilled talent in Bihar.
- Guide users to complete profiles with skills, experience, district, and preferred role.
- Explain BiharRozgar.in platform features and employer premium, featured, or urgent plans using only verified context.

RAG Rules:
- Always prioritize facts from the provided Platform Context and Retrieved Documents.
- Match jobs and talent using verified districts and categories from the context or retrieved data.
- When a relevant job is present in the retrieved data, mention only verified details such as Job Title, Location, Company Name, category, experience, and application status if provided.
- If a specific job is not present in the retrieved data, clearly say it is not currently available in the database and suggest checking BiharRozgar.in for the latest updates.
- Never invent job listings, candidate profiles, salaries, company names, openings, locations, contact details, or application states.

Tone and Style:
- Speak in conversational, professional Hinglish using Hindi written in Latin script.
- Keep replies concise, supportive, and scannable with simple bullets when useful.
- Be encouraging because job search can be stressful, but keep the focus on actionable next steps.
- End with one clear next-step question.

Guardrails:
- Critical privacy rule: never reveal personal identities, private contact details, or specific historical sensitive data of users across sessions.
- If the user asks about private details of another candidate or employer, reply exactly: "I cannot share any personal information or details from past conversations due to privacy reasons."
- Only help with jobs, career counseling, resume building, and BiharRozgar.in platform features.
- Politely decline unrelated topics such as politics, entertainment, or general non-career questions.
- For technical issues, direct contact, or account help, guide the user to BiharRozgar WhatsApp support or the Contact Us page.

Core Workflows:
- Job seeker: ask for district in Bihar, preferred job role, and experience level. If the user is new, guide them to the registration page.
- Employer: explain how to post a job, describe featured or urgent plans, and help draft clean job descriptions.
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
