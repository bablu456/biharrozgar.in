from __future__ import annotations

from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, status

from app.schemas.chat import ChatRequest
from app.dependencies.database import DatabaseSession
from app.dependencies.auth import CurrentUser
from app.services.ai_chat import AIProviderUnavailableError, OpenRouterAIService
from app.services.ai_gateway import AIConfigurationError, AIResponseFormatError

router = APIRouter()


@router.post("", include_in_schema=False)
@router.post("/")
async def chat_with_rozgar_mitra(
    chat_request: ChatRequest, 
    db: DatabaseSession,
    current_user: CurrentUser,
) -> dict[str, Any]:
    service = OpenRouterAIService()

    try:
        reply = await service.generate_reply(
            messages=chat_request.messages,
            model_id=chat_request.model_id,
            db=db,
            current_user_id=current_user.id,
        )
    except httpx.HTTPStatusError as exc:
        detail = "AI provider request failed."
        try:
            provider_error = exc.response.json()
            detail = provider_error.get("error", {}).get("message", detail)
        except ValueError:
            pass
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=detail,
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach AI provider.",
        ) from exc
    except AIProviderUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except AIResponseFormatError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except AIConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    return {"reply": reply}
