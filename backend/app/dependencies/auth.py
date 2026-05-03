from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings
from app.core.security import TokenValidationError, decode_jwt_token
from app.crud import user as user_crud
from app.dependencies.database import DatabaseSession
from app.models.profile import Profile
from app.models.user import User

settings = get_settings()
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    session: DatabaseSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
        )

    try:
        payload = decode_jwt_token(
            token=credentials.credentials,
            secret_key=settings.jwt_secret_key.get_secret_value(),
            algorithm=settings.jwt_algorithm,
            expected_type="access",
        )
    except TokenValidationError as exc:
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

    return user


async def get_current_profile(current_user: Annotated[User, Depends(get_current_user)]) -> Profile:
    if current_user.profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile could not be found for the authenticated user.",
        )

    return current_user.profile


CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentProfile = Annotated[Profile, Depends(get_current_profile)]
