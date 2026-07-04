from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user
from backend.app.core.config import get_settings
from backend.app.core.database import get_db
from backend.app.core.rbac import RoleName
from backend.app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
    hash_password,
    verify_password,
)
from backend.app.models.shared import UserSession
from backend.app.models.user import Permission, RefreshToken, Role, User
from backend.app.repositories.base import BaseRepository
from backend.app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from backend.app.schemas.user import UserRead

router = APIRouter()
settings = get_settings()


def _user_to_schema(user: User) -> UserRead:
    return UserRead.model_validate(user)


async def _ensure_default_role(session: AsyncSession, role_name: str) -> Role:
    result = await session.execute(select(Role).where(Role.name == role_name))
    role = result.scalar_one_or_none()
    if role is None:
        role = Role(name=role_name, description=role_name.replace("_", " ").title())
        session.add(role)
        await session.flush()
    return role


async def _load_user_with_roles(session: AsyncSession, user_id: str) -> User | None:
    result = await session.execute(
        select(User)
        .options(
            selectinload(User.roles),
            selectinload(User.profile),
            selectinload(User.sessions),
            selectinload(User.addresses),
        )
        .where(User.id == user_id)
    )
    return result.scalar_one_or_none()


async def _create_session(
    db: AsyncSession,
    user: User,
    refresh_token: str,
    *,
    session_id: str,
    client_ip: str | None = None,
    user_agent: str | None = None,
) -> str:
    db.add(
        UserSession(
            user_id=user.id,
            session_token=session_id,
            refresh_token_hash=hash_token(refresh_token),
            ip_address=client_ip,
            user_agent=user_agent,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
            is_revoked=False,
        )
    )
    user.last_login_at = datetime.now(timezone.utc)
    await db.flush()
    return session_id


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    existing = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        is_active=True,
        is_verified=False,
    )
    default_role = await _ensure_default_role(db, RoleName.USER.value)
    user.roles.append(default_role)
    db.add(user)
    await db.commit()
    user = await _load_user_with_roles(db, user.id) or user

    session_id = uuid4().hex
    access_token = create_access_token(subject=user.id, extra_claims={"roles": [role.name for role in user.roles]})
    refresh_token = create_refresh_token(subject=user.id, extra_claims={"roles": [role.name for role in user.roles], "sid": session_id})
    await _create_session(db, user, refresh_token, session_id=session_id)

    refresh_row = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
        revoked=False,
    )
    db.add(refresh_row)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_user_to_schema(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(
        select(User)
        .options(selectinload(User.roles), selectinload(User.profile), selectinload(User.sessions))
        .where(User.email == payload.email.lower())
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    session_id = uuid4().hex
    access_token = create_access_token(subject=user.id, extra_claims={"roles": [role.name for role in user.roles]})
    refresh_token = create_refresh_token(subject=user.id, extra_claims={"roles": [role.name for role in user.roles], "sid": session_id})
    await _create_session(db, user, refresh_token, session_id=session_id)

    refresh_row = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
        revoked=False,
    )
    db.add(refresh_row)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_user_to_schema(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    token_payload = decode_token(payload.refresh_token)
    if token_payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user_id = token_payload.get("sub")
    session_id = token_payload.get("sid")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    result = await db.execute(select(User).options(selectinload(User.roles)).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    refresh_hash = hash_token(payload.refresh_token)
    token_result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == refresh_hash, RefreshToken.revoked.is_(False))
    )
    stored_token = token_result.scalar_one_or_none()
    if stored_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked")
    if stored_token.expires_at <= datetime.now(timezone.utc):
        stored_token.revoked = True
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    if session_id:
        session_result = await db.execute(
            select(UserSession).where(UserSession.session_token == session_id, UserSession.is_revoked.is_(False))
        )
        session_row = session_result.scalar_one_or_none()
        if session_row is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session revoked")

    access_token = create_access_token(subject=user.id, extra_claims={"roles": [role.name for role in user.roles]})
    refresh_token = create_refresh_token(subject=user.id, extra_claims={"roles": [role.name for role in user.roles], "sid": session_id})

    refresh_row = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
        revoked=False,
    )
    db.add(refresh_row)
    if session_id:
        session_row.refresh_token_hash = hash_token(refresh_token)
        session_row.expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_user_to_schema(user),
    )


@router.post("/logout")
async def logout(payload: LogoutRequest, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    token_payload = decode_token(payload.refresh_token)
    refresh_hash = hash_token(payload.refresh_token)
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == refresh_hash))
    token_row = result.scalar_one_or_none()
    if token_row is not None:
        token_row.revoked = True
    session_id = token_payload.get("sid")
    if session_id:
        session_result = await db.execute(select(UserSession).where(UserSession.session_token == session_id))
        session_row = session_result.scalar_one_or_none()
        if session_row is not None:
            session_row.is_revoked = True
        await db.commit()
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)) -> UserRead:
    return _user_to_schema(user)
