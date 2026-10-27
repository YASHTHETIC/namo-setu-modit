from __future__ import annotations

import secrets
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
from backend.app.core.redis import get_redis
from backend.app.core.security import (
    burn_password_verify,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
    hash_password,
    verify_password,
)
from backend.app.models.shared import UserProfile, UserSession
from backend.app.models.user import Permission, RefreshToken, Role, User
from backend.app.schemas.auth import (
    ClaimStaffResponse,
    LoginRequest,
    LogoutRequest,
    OtpRequest,
    OtpRequestResponse,
    OtpVerifyRequest,
    RefreshRequest,
    RegisterRequest,
    StaffStatusResponse,
    TokenResponse,
)
from backend.app.services.otp_service import normalize_phone, request_login_otp, verify_login_otp
from backend.app.schemas.user import UserRead
from backend.app.services.audit_service import create_audit_log
from backend.app.models.enums import ProductCode

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


async def _ensure_bootstrap_admin(session: AsyncSession, user: User) -> None:
    """First-staff bootstrap: the configured email auto-gets super_admin on
    register/login (role is in the token because this runs before signing).
    Disabled when BOOTSTRAP_ADMIN_EMAIL is unset."""
    target = (get_settings().bootstrap_admin_email or "").strip().lower()
    if not target or (user.email or "").strip().lower() != target:
        return
    role = await _ensure_default_role(session, RoleName.SUPER_ADMIN.value)
    if all(getattr(r, "name", None) != role.name for r in (user.roles or [])):
        user.roles.append(role)
        await session.flush()


STAFF_ROLE_VALUES = frozenset({"super_admin", "admin", "support", "manager"})


async def _any_staff_exists(session: AsyncSession) -> bool:
    """True once any user holds any staff role (used by the claim flow)."""
    stmt = (
        select(User.id)
        .join(User.roles)
        .where(Role.name.in_(STAFF_ROLE_VALUES))
        .limit(1)
    )
    return (await session.execute(stmt)).scalars().first() is not None


async def _claim_first_staff(session: AsyncSession, user: User) -> bool:
    """Grant super_admin to this user, but ONLY while zero staff exist.
    Self-disabling: after the first claim every later call fails closed."""
    if await _any_staff_exists(session):
        return False
    role = await _ensure_default_role(session, RoleName.SUPER_ADMIN.value)
    if all(getattr(r, "name", None) != role.name for r in (user.roles or [])):
        user.roles.append(role)
        await session.flush()
    return True


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
    await _ensure_bootstrap_admin(db, user)
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
    if user is None:
        # Same bcrypt cost as the real-hash branch — no timing oracle.
        burn_password_verify()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    await _ensure_bootstrap_admin(db, user)
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


@router.post("/otp/request", response_model=OtpRequestResponse)
async def otp_request(
    payload: OtpRequest,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> OtpRequestResponse:
    """Send a login code to an Indian mobile number (SMS gateway or logs)."""
    phone = normalize_phone(payload.phone)
    await request_login_otp(
        redis,
        phone,
        settings.sms_gateway_url,
        settings.sms_api_key,
        settings.sms_sender,
        settings.otp_debug_to_logs,
    )
    return OtpRequestResponse(sent=True)


@router.post("/otp/verify", response_model=TokenResponse)
async def otp_verify(
    payload: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> TokenResponse:
    """Verify a login code; logs in or creates the phone account (mobile-only signup)."""
    phone = normalize_phone(payload.phone)
    if not await verify_login_otp(redis, phone, payload.code):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired code")

    profile = (
        (await db.execute(select(UserProfile).where(UserProfile.phone_number == phone)))
        .scalars()
        .first()
    )
    user: User | None = None
    if profile is not None:
        user = await _load_user_with_roles(db, profile.user_id)
    if user is None:
        user = User(
            email=f"{phone}@phone.modit.in",
            full_name=None,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            is_active=True,
            is_verified=True,
        )
        default_role = await _ensure_default_role(db, RoleName.USER.value)
        user.roles.append(default_role)
        db.add(user)
        await db.flush()
        db.add(UserProfile(user_id=user.id, phone_number=phone))
        await _ensure_bootstrap_admin(db, user)
        await db.commit()
        user = await _load_user_with_roles(db, user.id) or user
    else:
        await _ensure_bootstrap_admin(db, user)
        await db.commit()

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


@router.get("/staff-status", response_model=StaffStatusResponse)
async def staff_status(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> StaffStatusResponse:
    """Am I staff? Does any staff exist? (Drives the admin claim banner.)"""
    mine = {getattr(r, "name", None) for r in (user.roles or [])}
    return StaffStatusResponse(
        is_staff=bool(mine & STAFF_ROLE_VALUES),
        staff_exists=await _any_staff_exists(db),
    )


@router.post("/claim-staff", response_model=ClaimStaffResponse)
async def claim_staff(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> ClaimStaffResponse:
    """Become the first staff member. Works ONLY while zero staff exist —
    afterwards it fails closed (ask an admin instead). No SSH needed."""
    if await _claim_first_staff(db, user):
        # First-staff claim elevates an account to admin — always auditable
        # (same transaction as the role change so it cannot land without it).
        await create_audit_log(
            db,
            product_code=ProductCode.MODIT,
            actor_user_id=user.id,
            action="modit.staff.claim",
            entity_type="user",
            entity_id=user.id,
            after={"email": user.email, "name": user.name},
        )
        await db.commit()
        return ClaimStaffResponse(claimed=True)
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Staff already exists — ask an administrator for access.",
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
    from backend.app.core.datetime_utils import is_expired

    if is_expired(stored_token.expires_at):
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
    # Rotation must retire the token it replaces — otherwise a stolen
    # refresh token stays valid for its full 30-day lifetime.
    stored_token.revoked = True
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
