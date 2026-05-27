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
    AuthenticatedSession,
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
    response_model=TokenPair,
    status_code=status.HTTP_201_CREATED,
)
async def register_user(
    payload: UserRegisterRequest,
    session: DatabaseSession,
) -> TokenPair:
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
        profile = Profile(id=user.id, phone=payload.phone_number)
        user.profile = profile
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email or phone number already exists.",
        ) from None

    return _build_token_pair(user)


@router.post("/login", response_model=TokenPair)
async def login_user(
    payload: UserLoginRequest,
    session: DatabaseSession,
) -> TokenPair:
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
    return _build_token_pair(user)


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
