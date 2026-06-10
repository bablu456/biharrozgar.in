from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks

from app.dependencies.auth import CurrentUser
from app.dependencies.database import DatabaseSession
from app.schemas.auth import AuthenticatedSession
from app.schemas.profile import ProfileResponse, ProfileUpdateRequest
from app.services import auth as auth_service
from app.services.ai_matcher import run_ai_job_matching_background

router = APIRouter()


def _build_profile_response(auth_session: AuthenticatedSession) -> ProfileResponse:
    user = auth_session.user
    profile = auth_session.profile
    return ProfileResponse(
        name=profile.full_name,
        email=user.email,
        phone=user.phone_number,
        district=profile.district,
        city=profile.city,
        gender=profile.gender,
        education=profile.education,
        bio=profile.bio,
        skills=profile.skills,
        experience_years=profile.experience_years,
        resume_url=None, # Update later if tracking resume URLs
    )


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(current_user: CurrentUser) -> ProfileResponse:
    # AuthenticatedSession builder correctly groups user and profile
    auth_session = auth_service.build_authenticated_session(current_user)
    return _build_profile_response(auth_session)


@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    payload: ProfileUpdateRequest,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> ProfileResponse:
    authenticated_session = await auth_service.update_current_profile(
        session,
        user=current_user,
        payload=payload,
    )

    if payload.model_dump(exclude_unset=True):
        background_tasks.add_task(run_ai_job_matching_background, current_user.id)

    return _build_profile_response(authenticated_session)
