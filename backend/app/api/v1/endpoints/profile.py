from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks

from app.dependencies.auth import CurrentUser
from app.dependencies.database import DatabaseSession
from app.schemas.auth import AuthenticatedSession
from app.schemas.profile import ProfileUpdate
from app.services import auth as auth_service
from app.services.ai_matcher import run_ai_job_matching_background

router = APIRouter()


@router.patch("/me/profile", response_model=AuthenticatedSession)
async def update_my_profile(
    payload: ProfileUpdate,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> AuthenticatedSession:
    authenticated_session = await auth_service.update_current_profile(
        session,
        user=current_user,
        payload=payload,
    )

    if payload.model_dump(exclude_unset=True):
        background_tasks.add_task(run_ai_job_matching_background, current_user.id)

    return authenticated_session
