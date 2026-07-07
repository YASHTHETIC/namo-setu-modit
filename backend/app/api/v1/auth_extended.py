from __future__ import annotations

import json
import secrets
import string
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pyotp
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.api.deps import get_current_user
from backend.app.core.config import get_settings
from backend.app.core.database import get_db
from backend.app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from backend.app.models.shared import (
    EmailVerificationToken,
    PasswordResetToken,
    UserSession,
)
from backend.app.models.user import RefreshToken, User
from backend.app.schemas.auth import TokenResponse
from backend.app.schemas.auth_extended import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GoogleLoginRequest,
    ProfileRead,
    ProfileUpdateRequest,
    RevokeSessionRequest,
    ResetPasswordRequest,
    SessionListResponse,
    SessionRead,
    TwoFactorEnableResponse,
    TwoFactorVerifyRequest,
    VerifyEmailRequest,
)
from backend.app.schemas.user import UserRead
from backend.app.services.email_service import email_service

router = APIRouter()
settings = get_settings()


def _generate_recovery_codes(count: int = 8) -> list[str]:
    alphabet = string.ascii_uppercase + string.digits
    return ["".join(secrets.choice(alphabet) for _ in range(8)) for _ in range(count)]


def _get_session_info(request: Request) -> tuple[str | None, str | None]:
    return request.headers.get("x-forwarded-for"), request.headers.get("user-agent")


def _parse_user_agent(ua: str | None) -> str | None:
    if not ua:
        return None
    parts = []
    if "Windows" in ua:
        parts.append("Windows")
    elif "Macintosh" in ua or "Mac OS" in ua:
        parts.append("macOS")
    elif "Linux" in ua:
        parts.append("Linux")
    elif "Android" in ua:
        parts.append("Android")
    elif "iPhone" in ua or "iPad" in ua:
        parts.append("iOS")
    if "Chrome" in ua:
        parts.append("Chrome")
    elif "Firefox" in ua:
        parts.append("Firefox")
    elif "Safari" in ua:
        parts.append("Safari")
    elif "Edge" in ua:
        parts.append("Edge")
    return " ".join(parts) if parts else ua[:80]


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
    request: Request = None,
) -> dict[str, str]:
    ip, ua = _get_session_info(request) if request else (None, None)
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()
    if user is None:
        # Return success even if user not found to prevent enumeration
        return {"detail": "If the email exists, a reset link has been sent"}

    raw_token = secrets.token_urlsafe(48)
    token_hash = hash_token(raw_token)

    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            requested_ip=ip,
            requested_user_agent=ua,
        )
    )
    await db.commit()

    reset_url = f"{settings.frontend_url or 'http://localhost:3000'}/reset-password?token={raw_token}"
    await email_service.send_password_reset(user.email, reset_url)

    return {"detail": "If the email exists, a reset link has been sent"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    token_hash = hash_token(payload.token)
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.revoked.is_(False),
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > datetime.now(timezone.utc),
        )
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user_result = await db.execute(select(User).where(User.id == row.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    user.password_changed_at = datetime.now(timezone.utc)
    row.used_at = datetime.now(timezone.utc)

    # Revoke all sessions for this user
    session_result = await db.execute(
        select(UserSession).where(UserSession.user_id == user.id, UserSession.is_revoked.is_(False))
    )
    for s in session_result.scalars().all():
        s.is_revoked = True

    await db.commit()
    return {"detail": "Password has been reset"}


# ---------------------------------------------------------------------------
# Email verification
# ---------------------------------------------------------------------------

@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(
    payload: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    token_hash = hash_token(payload.token)
    result = await db.execute(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.revoked.is_(False),
            EmailVerificationToken.verified_at.is_(None),
            EmailVerificationToken.expires_at > datetime.now(timezone.utc),
        )
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token")

    user_result = await db.execute(select(User).where(User.id == row.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

    user.is_verified = True
    user.email_verified_at = datetime.now(timezone.utc)
    row.verified_at = datetime.now(timezone.utc)
    await db.commit()

    return {"detail": "Email verified successfully"}


@router.post("/send-verification", status_code=status.HTTP_200_OK)
async def send_verification(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    if user.is_verified:
        return {"detail": "Email already verified"}

    raw_token = secrets.token_urlsafe(48)
    token_hash = hash_token(raw_token)

    db.add(
        EmailVerificationToken(
            user_id=user.id,
            token_hash=token_hash,
            email_address=user.email,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
    )
    await db.commit()

    verify_url = f"{settings.frontend_url or 'http://localhost:3000'}/verify-email?token={raw_token}"
    await email_service.send_email_verification(user.email, verify_url)

    return {"detail": "Verification email sent"}


# ---------------------------------------------------------------------------
# Google OAuth (simulated)
# ---------------------------------------------------------------------------

@router.post("/google", response_model=TokenResponse)
async def google_login(
    payload: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db),
    request: Request = None,
) -> TokenResponse:
    ip, ua = _get_session_info(request) if request else (None, None)

    try:
        claims = decode_token(payload.id_token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

    email = claims.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email not found in token")

    result = await db.execute(
        select(User)
        .options(selectinload(User.roles), selectinload(User.profile), selectinload(User.sessions))
        .where(User.email == email.lower())
    )
    user = result.scalar_one_or_none()

    if user is None:
        from backend.app.core.rbac import RoleName
        from backend.app.models.user import Role

        user = User(
            email=email.lower(),
            full_name=claims.get("name"),
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            is_active=True,
            is_verified=True,
            email_verified_at=datetime.now(timezone.utc),
        )
        role_result = await db.execute(select(Role).where(Role.name == RoleName.USER.value))
        role = role_result.scalar_one_or_none()
        if role is None:
            role = Role(name=RoleName.USER.value, description="User")
            db.add(role)
            await db.flush()
        user.roles.append(role)
        db.add(user)
        await db.commit()
        user = await db.execute(
            select(User)
            .options(selectinload(User.roles), selectinload(User.profile), selectinload(User.sessions))
            .where(User.id == user.id)
        )
        user = user.scalar_one()

    session_id = uuid4().hex
    access_token = create_access_token(subject=user.id, extra_claims={"roles": [r.name for r in user.roles]})
    refresh_token = create_refresh_token(
        subject=user.id,
        extra_claims={"roles": [r.name for r in user.roles], "sid": session_id},
    )

    db.add(
        UserSession(
            user_id=user.id,
            session_token=session_id,
            refresh_token_hash=hash_token(refresh_token),
            ip_address=ip,
            user_agent=ua,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
            is_revoked=False,
        )
    )
    user.last_login_at = datetime.now(timezone.utc)

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
            revoked=False,
        )
    )
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserRead.model_validate(user),
    )


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
) -> SessionListResponse:
    result = await db.execute(
        select(UserSession)
        .where(UserSession.user_id == user.id)
        .order_by(UserSession.created_at.desc())
    )
    rows = result.scalars().all()

    current_token = None
    if request:
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                claims = decode_token(auth_header[7:])
                current_token = claims.get("sid")
            except Exception:
                pass

    sessions = [
        SessionRead(
            id=s.id,
            session_token=s.session_token,
            ip_address=s.ip_address,
            user_agent=_parse_user_agent(s.user_agent),
            created_at=s.created_at,
            expires_at=s.expires_at,
            is_revoked=s.is_revoked,
            is_current=s.session_token == current_token and not s.is_revoked,
        )
        for s in rows
    ]
    return SessionListResponse(sessions=sessions)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_200_OK)
async def revoke_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    result = await db.execute(
        select(UserSession).where(
            UserSession.id == session_id,
            UserSession.user_id == user.id,
        )
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    row.is_revoked = True
    await db.commit()
    return {"detail": "Session revoked"}


@router.delete("/sessions", status_code=status.HTTP_200_OK)
async def revoke_all_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
) -> dict[str, str]:
    current_token = None
    if request:
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                claims = decode_token(auth_header[7:])
                current_token = claims.get("sid")
            except Exception:
                pass

    result = await db.execute(
        select(UserSession).where(
            UserSession.user_id == user.id,
            UserSession.is_revoked.is_(False),
        )
    )
    count = 0
    for s in result.scalars().all():
        if s.session_token != current_token:
            s.is_revoked = True
            count += 1
    await db.commit()
    return {"detail": f"Revoked {count} session(s)"}


# ---------------------------------------------------------------------------
# Change password (logged-in)
# ---------------------------------------------------------------------------

@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    payload: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    user.hashed_password = hash_password(payload.new_password)
    user.password_changed_at = datetime.now(timezone.utc)

    # Revoke all other sessions
    result = await db.execute(
        select(UserSession).where(UserSession.user_id == user.id, UserSession.is_revoked.is_(False))
    )
    for s in result.scalars().all():
        s.is_revoked = True

    await db.commit()
    return {"detail": "Password changed successfully"}


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=ProfileRead)
async def get_profile(
    user: User = Depends(get_current_user),
) -> ProfileRead:
    data = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "email_verified_at": user.email_verified_at,
        "last_login_at": user.last_login_at,
        "password_changed_at": user.password_changed_at,
        "mfa_enabled": user.mfa_enabled,
        "phone_number": None,
        "avatar_url": None,
        "preferences_json": None,
        "notification_preferences_json": None,
        "date_of_birth": None,
        "timezone": None,
    }
    if user.profile:
        data["phone_number"] = user.profile.phone_number
        data["preferences_json"] = user.profile.preferences_json
        data["notification_preferences_json"] = user.profile.notification_preferences_json
        data["date_of_birth"] = user.profile.date_of_birth
        data["timezone"] = user.profile.timezone
        if user.profile.avatar_media:
            data["avatar_url"] = user.profile.avatar_media.url
    return ProfileRead(**data)


@router.put("/profile", response_model=ProfileRead)
async def update_profile(
    payload: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileRead:
    if payload.full_name is not None:
        user.full_name = payload.full_name

    from backend.app.models.shared import UserProfile

    if user.profile is None:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
        await db.flush()
    else:
        profile = user.profile

    if payload.phone_number is not None:
        profile.phone_number = payload.phone_number
    if payload.preferences_json is not None:
        profile.preferences_json = payload.preferences_json
    if payload.notification_preferences_json is not None:
        profile.notification_preferences_json = payload.notification_preferences_json

    await db.commit()
    await db.refresh(user)

    data = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "email_verified_at": user.email_verified_at,
        "last_login_at": user.last_login_at,
        "password_changed_at": user.password_changed_at,
        "mfa_enabled": user.mfa_enabled,
        "phone_number": profile.phone_number,
        "avatar_url": profile.avatar_media.url if profile.avatar_media else None,
        "preferences_json": profile.preferences_json,
        "notification_preferences_json": profile.notification_preferences_json,
        "date_of_birth": profile.date_of_birth,
        "timezone": profile.timezone,
    }
    return ProfileRead(**data)


# ---------------------------------------------------------------------------
# 2FA
# ---------------------------------------------------------------------------

@router.post("/2fa/enable", response_model=TwoFactorEnableResponse)
async def enable_2fa(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TwoFactorEnableResponse:
    if user.mfa_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is already enabled")

    secret = pyotp.random_base32()
    user.mfa_secret_encrypted = hash_password(secret)
    recovery_codes = _generate_recovery_codes()
    user.mfa_recovery_codes_json = json.dumps([hash_password(c) for c in recovery_codes])
    user.mfa_enabled = True
    await db.commit()

    return TwoFactorEnableResponse(secret=secret, recovery_codes=recovery_codes)


@router.post("/2fa/disable", status_code=status.HTTP_200_OK)
async def disable_2fa(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    if not user.mfa_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled")

    user.mfa_enabled = False
    user.mfa_secret_encrypted = None
    user.mfa_recovery_codes_json = None
    await db.commit()
    return {"detail": "2FA disabled"}


@router.post("/2fa/verify", status_code=status.HTTP_200_OK)
async def verify_2fa(
    payload: TwoFactorVerifyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    if not user.mfa_enabled or not user.mfa_secret_encrypted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled")

    totp = pyotp.TOTP(user.mfa_secret_encrypted)
    if totp.verify(payload.code, valid_window=1):
        return {"detail": "2FA code verified"}

    # Check recovery codes
    if user.mfa_recovery_codes_json:
        codes = json.loads(user.mfa_recovery_codes_json)
        for i, hashed in enumerate(codes):
            if verify_password(payload.code, hashed):
                codes.pop(i)
                user.mfa_recovery_codes_json = json.dumps(codes)
                await db.commit()
                return {"detail": "Recovery code verified"}

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA code")
