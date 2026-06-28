from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.openrouter_models import CHAT_FALLBACK_MODEL_IDS
from app.schemas.chat import ChatMessage
from app.services.ai_gateway import AIProviderUnavailableError, OpenRouterGateway
from app.services.ai_tools import (
    SEARCH_JOBS_TOOL_SCHEMA, 
    search_jobs_in_db,
    UPDATE_PROFILE_TOOL_SCHEMA,
    update_user_profile_via_ai,
    APPLY_FOR_JOB_TOOL_SCHEMA,
    apply_to_job_via_ai
)
import json
from typing import Any


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

FALLBACK_ASSISTANT_REPLY = (
    "Main abhi clear response generate nahi kar paaya. Aap apna sawaal "
    "thoda aur detail me dobara bhejiye.\n\n"
    "[Search Jobs] [Post a Job] [Update Profile]"
)


class OpenRouterAIService:
    def __init__(self) -> None:
        self.gateway = OpenRouterGateway()

    async def generate_reply(
        self,
        messages: Sequence[ChatMessage],
        model_id: str,
        db: AsyncSession,
        current_user_id: Any = None,
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

        # 1. Send the user's message to OpenRouter, with tools included
        response_message = await self.gateway.complete_chat(
            messages=payload_messages,
            model_ids=(model_id, *CHAT_FALLBACK_MODEL_IDS),
            temperature=0.3,
            tools=[SEARCH_JOBS_TOOL_SCHEMA, UPDATE_PROFILE_TOOL_SCHEMA, APPLY_FOR_JOB_TOOL_SCHEMA],
        )

        # 2. Check if the response contains tool_calls
        if "tool_calls" in response_message and response_message["tool_calls"]:
            tool_call = response_message["tool_calls"][0]  # Just handling the first tool call for now
            tool_name = tool_call["function"]["name"]
            
            try:
                arguments = json.loads(tool_call["function"]["arguments"])
            except json.JSONDecodeError:
                arguments = {}

            db_results = json.dumps({"message": "Unknown tool called."})
            
            if tool_name == "search_jobs":
                # 3. Parse JSON arguments, call Python function, and get database results
                location = arguments.get("location")
                role = arguments.get("role")
                db_results = await search_jobs_in_db(db, location=location, role=role)
            elif tool_name == "update_profile":
                if not current_user_id:
                    db_results = json.dumps({"message": "Error: User is not logged in, cannot update profile."})
                else:
                    skills = arguments.get("skills")
                    bio = arguments.get("bio")
                    db_results = await update_user_profile_via_ai(db, current_user_id, skills=skills, bio=bio)
            elif tool_name == "apply_for_job":
                if not current_user_id:
                    db_results = json.dumps({"message": "Error: User is not logged in, cannot apply for jobs."})
                else:
                    job_id = arguments.get("job_id")
                    if not job_id:
                        db_results = json.dumps({"message": "Error: job_id is required."})
                    else:
                        db_results = await apply_to_job_via_ai(db, current_user_id, job_id)
            
            # 4. Append a new message to the conversation history with role "tool"
            # OpenRouter requires us to append the assistant's tool call request first
            payload_messages.append(response_message)
            
            # Then append the actual tool response
            payload_messages.append({
                "role": "tool",
                "name": tool_name,
                "content": db_results,
                "tool_call_id": tool_call["id"],
            })
            
            # 5. Make a second API call to OpenRouter with updated history 
            # so the LLM can generate a human-friendly response based on the job data
            final_response_message = await self.gateway.complete_chat(
                messages=payload_messages,
                model_ids=(model_id, *CHAT_FALLBACK_MODEL_IDS),
                temperature=0.3,
            )
            return _get_assistant_reply_text(final_response_message)

        # Normal text response when no tool is called
        return _get_assistant_reply_text(response_message)


def _get_assistant_reply_text(message: dict[str, Any]) -> str:
    content = message.get("content")

    if isinstance(content, str):
        normalized = content.strip()
        return normalized or FALLBACK_ASSISTANT_REPLY

    if isinstance(content, list):
        text_parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text = item.get("text")
                if isinstance(text, str):
                    stripped = text.strip()
                    if stripped:
                        text_parts.append(stripped)

        normalized = "\n".join(text_parts).strip()
        return normalized or FALLBACK_ASSISTANT_REPLY

    return FALLBACK_ASSISTANT_REPLY
