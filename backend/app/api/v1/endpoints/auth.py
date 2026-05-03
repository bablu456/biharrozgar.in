from __future__ import annotations

from fastapi import APIRouter, status

from app.dependencies.auth import CurrentUser
from app.dependencies.database import DatabaseSession
from app.schemas.auth import (
    AuthResponse,
    AuthenticatedSession,
    LoginVerifyRequest,
    OTPChallengeResponse,
    OTPRequest,
    RefreshTokenRequest,
    RegisterVerifyRequest,
    TokenPair,
)
from app.schemas.profile import ProfileUpdate
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register/request-otp",
    response_model=OTPChallengeResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def request_registration_otp(
    payload: OTPRequest,
    session: DatabaseSession,
) -> OTPChallengeResponse:
    return await auth_service.request_registration_otp(
        session,
        phone_number=payload.phone,
    )


@router.post(
    "/register/verify-otp",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def verify_registration_otp(
    payload: RegisterVerifyRequest,
    session: DatabaseSession,
) -> AuthResponse:
    return await auth_service.verify_registration(session, payload=payload)


@router.post(
    "/login/request-otp",
    response_model=OTPChallengeResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def request_login_otp(
    payload: OTPRequest,
    session: DatabaseSession,
) -> OTPChallengeResponse:
    return await auth_service.request_login_otp(
        session,
        phone_number=payload.phone,
    )


@router.post("/login/verify-otp", response_model=AuthResponse)
async def verify_login_otp(
    payload: LoginVerifyRequest,
    session: DatabaseSession,
) -> AuthResponse:
    return await auth_service.verify_login(
        session,
        phone_number=payload.phone,
        otp_code=payload.otp_code,
    )


@router.post("/refresh", response_model=TokenPair)
async def refresh_access_token(
    payload: RefreshTokenRequest,
    session: DatabaseSession,
) -> TokenPair:
    return await auth_service.refresh_tokens(
        session,
        refresh_token=payload.refresh_token,
    )


@router.get("/me", response_model=AuthenticatedSession)
async def read_current_session(current_user: CurrentUser) -> AuthenticatedSession:
    return auth_service.build_authenticated_session(current_user)


@router.patch("/me/profile", response_model=AuthenticatedSession)
async def update_my_profile(
    payload: ProfileUpdate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> AuthenticatedSession:
    return await auth_service.update_current_profile(
        session,
        user=current_user,
        payload=payload,
    )
