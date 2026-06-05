from __future__ import annotations

from collections.abc import Awaitable, Callable
from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import (
    create_jwt_token,
    decode_jwt_token,
    generate_otp_code,
    hash_otp_code,
    utc_now,
    verify_otp_code,
)
from app.crud import auth_otp as otp_crud
from app.crud import profile as profile_crud
from app.crud import user as user_crud
from app.models.enums import OtpPurpose, UserRole
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    AuthenticatedSession,
    OTPChallengeResponse,
    RegisterVerifyRequest,
    TokenPair,
    UserRead,
)
from app.schemas.profile import ProfileRead, ProfileUpdate
from app.services.otp_delivery import send_email_otp_code, send_phone_otp_code

settings = get_settings()
MAX_OTP_ATTEMPTS = 5
OTPDelivery = Callable[[str, str, str], Awaitable[None]]


def build_authenticated_session(user: User) -> AuthenticatedSession:
    profile = user.profile
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authenticated user is missing a profile record.",
        )

    return AuthenticatedSession(
        user=UserRead.model_validate(user),
        profile=ProfileRead.model_validate(profile),
    )


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


async def _request_otp(
    session: AsyncSession,
    *,
    recipient: str,
    purpose: OtpPurpose,
    existing_user: User | None,
    must_have_existing_user: bool,
    delivery: OTPDelivery,
) -> OTPChallengeResponse:
    if must_have_existing_user and existing_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account exists for this email address or phone number.",
        )

    if not must_have_existing_user and existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address or phone number already exists.",
        )

    latest_otp = await otp_crud.get_latest_pending(
        session,
        recipient=recipient,
        purpose=purpose,
    )
    if latest_otp is not None and latest_otp.created_at is not None:
        seconds_since_last_issue = int((utc_now() - latest_otp.created_at).total_seconds())
        seconds_remaining = settings.otp_resend_cooldown_seconds - seconds_since_last_issue
        if seconds_remaining > 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {seconds_remaining} seconds before requesting another OTP.",
            )

    otp_code = generate_otp_code(settings.otp_length)
    expires_at = utc_now() + timedelta(minutes=settings.otp_expire_minutes)
    code_hash = hash_otp_code(
        recipient=recipient,
        purpose=purpose.value,
        otp_code=otp_code,
        secret_key=settings.otp_secret_key.get_secret_value(),
    )

    await otp_crud.create(
        session,
        recipient=recipient,
        purpose=purpose,
        code_hash=code_hash,
        expires_at=expires_at,
    )
    await delivery(recipient, otp_code, purpose.value)
    await session.commit()

    debug_otp_code = (
        otp_code
        if settings.debug or settings.environment.strip().lower() == "development"
        else None
    )
    return OTPChallengeResponse(
        message="OTP generated successfully.",
        expires_in_seconds=settings.otp_expire_minutes * 60,
        retry_after_seconds=settings.otp_resend_cooldown_seconds,
        debug_otp_code=debug_otp_code,
    )


async def request_registration_otp(
    session: AsyncSession,
    *,
    phone_number: str,
) -> OTPChallengeResponse:
    existing_user = await user_crud.get_by_phone(session, phone_number)
    return await _request_otp(
        session,
        recipient=phone_number,
        purpose=OtpPurpose.REGISTER,
        existing_user=existing_user,
        must_have_existing_user=False,
        delivery=send_phone_otp_code,
    )


async def request_login_otp(
    session: AsyncSession,
    *,
    phone_number: str,
) -> OTPChallengeResponse:
    existing_user = await user_crud.get_by_phone(session, phone_number)
    return await _request_otp(
        session,
        recipient=phone_number,
        purpose=OtpPurpose.LOGIN,
        existing_user=existing_user,
        must_have_existing_user=True,
        delivery=send_phone_otp_code,
    )


async def request_email_login_otp(
    session: AsyncSession,
    *,
    email: str,
) -> OTPChallengeResponse:
    existing_user = await user_crud.get_by_email(session, email)
    return await _request_otp(
        session,
        recipient=email,
        purpose=OtpPurpose.LOGIN,
        existing_user=existing_user,
        must_have_existing_user=True,
        delivery=send_email_otp_code,
    )


async def _verify_otp(
    session: AsyncSession,
    *,
    recipient: str,
    otp_code: str,
    purpose: OtpPurpose,
) -> None:
    otp_record = await otp_crud.get_latest_pending(
        session,
        recipient=recipient,
        purpose=purpose,
    )
    if otp_record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP was found for this email address or phone number.",
        )

    now = utc_now()
    if otp_record.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new code.",
        )

    if otp_record.attempts >= MAX_OTP_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum OTP attempts exceeded. Request a new code.",
        )

    is_valid = verify_otp_code(
        recipient=recipient,
        purpose=purpose.value,
        otp_code=otp_code,
        expected_hash=otp_record.code_hash,
        secret_key=settings.otp_secret_key.get_secret_value(),
    )
    if not is_valid:
        await otp_crud.increment_attempts(session, otp_record)
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code is invalid.",
        )

    await otp_crud.mark_consumed(session, otp_record, consumed_at=now)


async def verify_registration(
    session: AsyncSession,
    *,
    payload: RegisterVerifyRequest,
) -> AuthResponse:
    existing_user = await user_crud.get_by_phone(session, payload.phone)
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this phone number already exists.",
        )

    await _verify_otp(
        session,
        recipient=payload.phone,
        otp_code=payload.otp_code,
        purpose=OtpPurpose.REGISTER,
    )

    full_name = payload.company_name or payload.full_name
    if full_name is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A name is required to complete registration.",
        )

    user = await user_crud.create_with_profile(
        session,
        phone_number=payload.phone,
        role=payload.role,
        full_name=full_name,
        district=payload.district,
    )
    await session.commit()

    fresh_user = await user_crud.get_by_id(session, user.id)
    if fresh_user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The account was created but could not be reloaded.",
        )

    auth_session = build_authenticated_session(fresh_user)
    return AuthResponse(
        user=auth_session.user,
        profile=auth_session.profile,
        tokens=_build_token_pair(fresh_user),
    )


async def verify_login(
    session: AsyncSession,
    *,
    phone_number: str,
    otp_code: str,
) -> AuthResponse:
    user = await user_crud.get_by_phone(session, phone_number)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account exists for this phone number.",
        )

    await _verify_otp(
        session,
        recipient=phone_number,
        otp_code=otp_code,
        purpose=OtpPurpose.LOGIN,
    )
    await user_crud.mark_logged_in(session, user, verify_phone=True)
    await session.commit()

    fresh_user = await user_crud.get_by_id(session, user.id)
    if fresh_user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The account exists but could not be reloaded.",
        )

    auth_session = build_authenticated_session(fresh_user)
    return AuthResponse(
        user=auth_session.user,
        profile=auth_session.profile,
        tokens=_build_token_pair(fresh_user),
    )


async def verify_email_login(
    session: AsyncSession,
    *,
    email: str,
    otp_code: str,
) -> AuthResponse:
    user = await user_crud.get_by_email(session, email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account exists for this email address.",
        )

    await _verify_otp(
        session,
        recipient=email,
        otp_code=otp_code,
        purpose=OtpPurpose.LOGIN,
    )
    await user_crud.mark_logged_in(session, user)
    await session.commit()

    fresh_user = await user_crud.get_by_id(session, user.id)
    if fresh_user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The account exists but could not be reloaded.",
        )

    auth_session = build_authenticated_session(fresh_user)
    return AuthResponse(
        user=auth_session.user,
        profile=auth_session.profile,
        tokens=_build_token_pair(fresh_user),
    )


async def refresh_tokens(session: AsyncSession, *, refresh_token: str) -> TokenPair:
    try:
        payload = decode_jwt_token(
            token=refresh_token,
            secret_key=settings.jwt_refresh_secret_key.get_secret_value(),
            algorithm=settings.jwt_algorithm,
            expected_type="refresh",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    user = await user_crud.get_by_id(session, payload["sub"])
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is not available.",
        )

    return _build_token_pair(user)


async def update_current_profile(
    session: AsyncSession,
    *,
    user: User,
    payload: ProfileUpdate,
) -> AuthenticatedSession:
    if user.profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile could not be found for the authenticated user.",
        )

    values = payload.model_dump(exclude_unset=True)
    if values:
        await profile_crud.update_fields(session, user.profile, values=values)
        await session.commit()

    fresh_user = await user_crud.get_by_id(session, user.id)
    if fresh_user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile was updated but the user could not be reloaded.",
        )

    return build_authenticated_session(fresh_user)
