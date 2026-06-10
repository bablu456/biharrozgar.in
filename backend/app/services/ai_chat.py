from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.openrouter_models import CHAT_FALLBACK_MODEL_IDS
from app.schemas.chat import ChatMessage
from app.services.ai_gateway import AIProviderUnavailableError, OpenRouterGateway


ROZGAR_MITRA_SYSTEM_PROMPT = """You are Rozgar Mitra, an expert, empathetic, and action-oriented AI Assistant for biharrozgar.in.

You help job seekers find employment and assist employers in discovering skilled talent within Bihar's local economy.

Core rules:
- Speak in conversational, professional Hinglish using Hindi written in Latin script.
- Keep responses concise, encouraging, and highly actionable.
- For job seekers, ask for district in Bihar, preferred job role, and experience level when needed.
- For employers, help with posting jobs, drafting job descriptions, and explaining featured or urgent hiring plans.
- Never invent job listings, candidate profiles, salaries, company names, openings, locations, application states, or contact details.
- Never reveal personal identities, private contact details, or sensitive historical user data.
- If someone asks for private details of another candidate or employer, reply exactly: "I cannot share any personal information or details from past conversations due to privacy reasons."
- Stay focused on jobs, career counseling, resume building, and biharrozgar.in platform features.

Your tone must be highly professional, polite, and direct. Avoid excessive emojis. At the very end of EVERY response, you MUST provide 2 to 3 actionable, short follow-up options for the user. You must wrap each option EXACTLY in square brackets like this: [Search Jobs] [Post a Job] [Update Profile]. Do not add any text after these brackets.
"""

class OpenRouterAIService:
    def __init__(self) -> None:
        self.gateway = OpenRouterGateway()

    async def generate_reply(
        self,
        messages: Sequence[ChatMessage],
        model_id: str,
        db: AsyncSession,
    ) -> str:
        # Get the user's latest message to query the vector DB
        latest_message = messages[-1].content if messages else ""
        
        # Retrieve relevant context
        from app.services.retrieval import get_relevant_context
        context = await get_relevant_context(latest_message, db)
        
        # Construct the final system prompt with context
        system_prompt = ROZGAR_MITRA_SYSTEM_PROMPT
        if context:
            system_prompt += f"\n\nAnswer the user based ONLY on the following context. If the answer is not in the context, say you don't know but offer to help them search.\nCONTEXT:\n{context}"

        payload_messages = [
            {"role": "system", "content": system_prompt},
            *[
                {"role": message.role, "content": message.content}
                for message in messages
            ],
        ]

        return await self.gateway.complete_text(
            messages=payload_messages,
            model_ids=(model_id, *CHAT_FALLBACK_MODEL_IDS),
            temperature=0.3,
        )
