from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, status
from fastapi import HTTPException
from passlib.exc import UnknownHashError
from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.core.security import create_jwt_token, get_password_hash, utc_now, verify_password
from app.crud import user as user_crud
from app.dependencies.auth import CurrentUser
from app.dependencies.database import DatabaseSession
from app.models.enums import UserRole
from app.models.profile import Profile
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    AuthenticatedSession,
    EmailOTPRequest,
    EmailOTPVerifyPayload,
    ForgotPasswordRequest,
    ForgotPasswordReset,
    LoginVerifyRequest,
    OTPChallengeResponse,
    OTPRequest,
    RefreshTokenRequest,
    TokenPair,
    UserLoginRequest,
    UserRegisterRequest,
)
from app.services import auth as auth_service

settings = get_settings()
router = APIRouter()


def _profile_role_as_string(user: User) -> str | None:
    if user.profile is None:
        return None

    role = user.profile.role
    return role.value if isinstance(role, UserRole) else str(role)


def _build_token_pair(user: User) -> TokenPair:
    role = _profile_role_as_string(user)

    access_token, access_expires_at = create_jwt_token(
        subject=str(user.id),
        token_type="access",
        secret_key=settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        role=role,
    )
    refresh_token, refresh_expires_at = create_jwt_token(
        subject=str(user.id),
        token_type="refresh",
        secret_key=settings.jwt_refresh_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
        role=role,
    )

    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires_at=access_expires_at,
        refresh_token_expires_at=refresh_expires_at,
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_user(
    payload: UserRegisterRequest,
    session: DatabaseSession,
) -> AuthResponse:
    existing_email_user = await user_crud.get_user_by_email_or_phone(session, payload.email)
    if existing_email_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    existing_phone_user = await user_crud.get_user_by_email_or_phone(session, payload.phone_number)
    if existing_phone_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this phone number already exists.",
        )

    user = User(
        email=payload.email,
        phone_number=payload.phone_number,
        hashed_password=get_password_hash(payload.password),
        last_login_at=utc_now(),
    )
    session.add(user)

    try:
        await session.flush()
        profile = Profile(
            id=user.id,
            phone=payload.phone_number,
            full_name=payload.full_name,
            role=payload.role,
            district=payload.district,
        )
        user.profile = profile
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email or phone number already exists.",
        ) from None

    fresh_user = await user_crud.get_by_id(session, user.id)
    if fresh_user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The account was created but could not be reloaded.",
        )

    auth_session = auth_service.build_authenticated_session(fresh_user)
    return AuthResponse(
        user=auth_session.user,
        profile=auth_session.profile,
        tokens=_build_token_pair(fresh_user),
    )


@router.post("/login", response_model=AuthResponse)
async def login_user(
    payload: UserLoginRequest,
    session: DatabaseSession,
) -> AuthResponse:
    user = await user_crud.get_user_by_email_or_phone(session, payload.identifier)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    try:
        is_password_valid = verify_password(payload.password, user.hashed_password)
    except UnknownHashError:
        is_password_valid = False

    if not is_password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    user.last_login_at = utc_now()
    await session.commit()

    fresh_user = await user_crud.get_by_id(session, user.id)
    if fresh_user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The account exists but could not be reloaded.",
        )

    auth_session = auth_service.build_authenticated_session(fresh_user)
    return AuthResponse(
        user=auth_session.user,
        profile=auth_session.profile,
        tokens=_build_token_pair(fresh_user),
    )


from fastapi import BackgroundTasks
from app.services.email_service import send_otp_email
from app.services.otp_delivery import send_phone_otp_code

@router.post("/login/request-otp", include_in_schema=False)
@router.post("/login/phone/request-otp", response_model=OTPChallengeResponse)
async def request_phone_login_otp(
    payload: OTPRequest,
    session: DatabaseSession,
    background_tasks: BackgroundTasks,
) -> OTPChallengeResponse:
    challenge, otp_code = await auth_service.request_login_otp(
        session,
        phone_number=payload.phone,
    )
    background_tasks.add_task(send_phone_otp_code, payload.phone, otp_code, "login")
    return challenge


@router.post("/login/verify-otp", include_in_schema=False)
@router.post("/login/phone/verify-otp", response_model=AuthResponse)
async def verify_phone_login_otp(
    payload: LoginVerifyRequest,
    session: DatabaseSession,
) -> AuthResponse:
    return await auth_service.verify_login(
        session,
        phone_number=payload.phone,
        otp_code=payload.otp_code,
    )


@router.post("/login/email/request-otp", response_model=OTPChallengeResponse)
async def request_email_login_otp(
    payload: EmailOTPRequest,
    session: DatabaseSession,
    background_tasks: BackgroundTasks,
) -> OTPChallengeResponse:
    challenge, otp_code = await auth_service.request_email_login_otp(
        session,
        email=payload.email,
    )
    background_tasks.add_task(send_otp_email, payload.email, otp_code)
    return challenge


@router.post("/login/email/verify-otp", response_model=AuthResponse)
async def verify_email_login_otp(
    payload: EmailOTPVerifyPayload,
    session: DatabaseSession,
) -> AuthResponse:
    return await auth_service.verify_email_login(
        session,
        email=payload.email,
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


@router.post("/forgot-password/request", response_model=OTPChallengeResponse)
async def request_forgot_password(
    payload: ForgotPasswordRequest,
    session: DatabaseSession,
    background_tasks: BackgroundTasks,
) -> OTPChallengeResponse:
    challenge, otp_code = await auth_service.request_forgot_password_otp(
        session,
        email=payload.email,
    )
    if otp_code:
        background_tasks.add_task(send_otp_email, payload.email, otp_code)
    return challenge


@router.post("/forgot-password/reset", status_code=status.HTTP_200_OK)
async def reset_forgot_password(
    payload: ForgotPasswordReset,
    session: DatabaseSession,
) -> dict:
    await auth_service.verify_and_reset_password(
        session,
        email=payload.email,
        otp_code=payload.otp_code,
        new_password=payload.new_password,
    )
    return {"message": "Password successfully reset."}
