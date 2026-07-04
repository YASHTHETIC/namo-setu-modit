from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.api.deps import get_current_user, require_permission
from backend.app.core.config import get_settings
from backend.app.core.database import get_db
from backend.app.core.rbac import PermissionName
from backend.app.core.security import hash_password, verify_password
from backend.app.models.enums import ProductCode, AddressOwnerType, AddressType, MediaType, NotificationChannel
from backend.app.models.shared import Address, EmailVerificationToken, MediaAsset, PasswordResetToken, UserProfile, UserSession
from backend.app.models.user import RefreshToken, User
from backend.app.schemas.auth import LoginRequest
from backend.app.schemas.platform import (
    AddressCreate,
    AddressRead,
    AddressUpdate,
    EmailVerificationRequest,
    NotificationPreferenceUpdate,
    PasswordChangeRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    PaginatedResponse,
    SessionRead,
    StandardResponse,
    UserAdminUpdate,
    UserProfileRead,
    UserProfileUpdate,
    UserRead,
)
from backend.app.services.audit_service import create_audit_log
from backend.app.services.media_service import create_media_asset
from backend.app.services.notification_service import create_in_app_notification

router = APIRouter()
settings = get_settings()


async def _load_user(session: AsyncSession, user_id: str) -> User | None:
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


async def _get_profile(session: AsyncSession, user: User) -> UserProfile:
    if user.profile is not None:
        return user.profile
    profile = UserProfile(user_id=user.id)
    session.add(profile)
    await session.flush()
    return profile


async def _revoke_user_tokens(session: AsyncSession, user_id: str) -> None:
    result = await session.execute(select(RefreshToken).where(RefreshToken.user_id == user_id))
    for row in result.scalars().all():
        row.revoked = True
    session_result = await session.execute(select(UserSession).where(UserSession.user_id == user_id))
    for row in session_result.scalars().all():
        row.is_revoked = True


@router.get("/users/me", response_model=UserRead)
async def read_me(user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(user)


@router.patch("/users/me", response_model=UserRead)
async def update_me(payload: UserProfileUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> UserRead:
    profile = await _get_profile(db, user)
    if payload.full_name is not None:
        user.full_name = payload.full_name.strip() if payload.full_name else None
    if payload.phone_number is not None:
        profile.phone_number = payload.phone_number
    if payload.language_id is not None:
        profile.language_id = payload.language_id
    if payload.timezone is not None:
        profile.timezone = payload.timezone
    if payload.preferences_json is not None:
        profile.preferences_json = payload.preferences_json
    if payload.notification_preferences_json is not None:
        profile.notification_preferences_json = payload.notification_preferences_json
    await db.commit()
    await db.refresh(user)
    return UserRead.model_validate(user)


@router.get("/users/me/profile", response_model=UserProfileRead)
async def read_profile(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> UserProfileRead:
    profile = await _get_profile(db, user)
    await db.refresh(profile)
    return UserProfileRead.model_validate(profile)


@router.patch("/users/me/profile", response_model=UserProfileRead)
async def update_profile(payload: UserProfileUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> UserProfileRead:
    profile = await _get_profile(db, user)
    if payload.phone_number is not None:
        profile.phone_number = payload.phone_number
    if payload.language_id is not None:
        profile.language_id = payload.language_id
    if payload.timezone is not None:
        profile.timezone = payload.timezone
    if payload.preferences_json is not None:
        profile.preferences_json = payload.preferences_json
    if payload.notification_preferences_json is not None:
        profile.notification_preferences_json = payload.notification_preferences_json
    await db.commit()
    await db.refresh(profile)
    return UserProfileRead.model_validate(profile)


@router.get("/users/me/addresses", response_model=PaginatedResponse[AddressRead])
async def list_addresses(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> PaginatedResponse[AddressRead]:
    result = await db.execute(select(Address).where(Address.user_id == user.id).order_by(Address.is_primary.desc(), Address.created_at.desc()))
    items = [AddressRead.model_validate(item) for item in result.scalars().all()]
    return PaginatedResponse(items=items, page=1, page_size=len(items) or 1, total=len(items), pages=1 if items else 0)


@router.post("/users/me/addresses", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
async def create_address(payload: AddressCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> AddressRead:
    if payload.owner_type != AddressOwnerType.USER.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User addresses must use user ownership")
    address = Address(
        user_id=user.id,
        organization_id=None,
        country_id=payload.country_id,
        state_id=payload.state_id,
        city_id=payload.city_id,
        address_line1=payload.address_line1,
        address_line2=payload.address_line2,
        pincode=payload.pincode,
        address_type=payload.address_type,
        owner_type=payload.owner_type,
        is_primary=payload.is_primary,
    )
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return AddressRead.model_validate(address)


@router.patch("/users/me/addresses/{address_id}", response_model=AddressRead)
async def update_address(address_id: str, payload: AddressUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> AddressRead:
    address = await db.get(Address, address_id)
    if address is None or address.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    if payload.address_line1 is not None:
        address.address_line1 = payload.address_line1
    if payload.address_line2 is not None:
        address.address_line2 = payload.address_line2
    if payload.pincode is not None:
        address.pincode = payload.pincode
    if payload.address_type is not None:
        address.address_type = payload.address_type
    if payload.is_primary is not None:
        address.is_primary = payload.is_primary
    await db.commit()
    await db.refresh(address)
    return AddressRead.model_validate(address)


@router.delete("/users/me/addresses/{address_id}", response_model=StandardResponse[str])
async def delete_address(address_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> StandardResponse[str]:
    address = await db.get(Address, address_id)
    if address is None or address.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    await db.delete(address)
    await db.commit()
    return StandardResponse(message="Address deleted", data=address_id)


@router.post("/users/me/avatar", response_model=UserProfileRead)
async def upload_avatar(
    upload: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserProfileRead:
    profile = await _get_profile(db, user)
    media = await create_media_asset(
        db,
        upload=upload,
        product_code=ProductCode.NAMO_SETU,
        owner_user_id=user.id,
        media_type=MediaType.IMAGE.value,
    )
    profile.avatar_media_id = media.id
    await db.commit()
    await db.refresh(profile)
    return UserProfileRead.model_validate(profile)


@router.patch("/users/me/preferences", response_model=UserProfileRead)
async def update_preferences(
    payload: NotificationPreferenceUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserProfileRead:
    profile = await _get_profile(db, user)
    profile.notification_preferences_json = payload.notification_preferences_json
    await db.commit()
    await db.refresh(profile)
    return UserProfileRead.model_validate(profile)


@router.get("/users/me/sessions", response_model=PaginatedResponse[SessionRead])
async def list_sessions(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> PaginatedResponse[SessionRead]:
    result = await db.execute(select(UserSession).where(UserSession.user_id == user.id).order_by(UserSession.created_at.desc()))
    items = [SessionRead.model_validate(item) for item in result.scalars().all()]
    return PaginatedResponse(items=items, page=1, page_size=len(items) or 1, total=len(items), pages=1 if items else 0)


@router.delete("/users/me/sessions/{session_id}", response_model=StandardResponse[str])
async def revoke_session(session_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> StandardResponse[str]:
    session_row = await db.get(UserSession, session_id)
    if session_row is None or session_row.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    session_row.is_revoked = True
    await db.commit()
    return StandardResponse(message="Session revoked", data=session_id)


@router.post("/users/password/change", response_model=StandardResponse[str])
async def change_password(
    payload: PasswordChangeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StandardResponse[str]:
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is invalid")
    user.hashed_password = hash_password(payload.new_password)
    user.password_changed_at = datetime.now(timezone.utc)
    await _revoke_user_tokens(db, user.id)
    await db.commit()
    return StandardResponse(message="Password updated", data=user.id)


@router.post("/users/password/reset/request", response_model=StandardResponse[str])
async def request_password_reset(payload: PasswordResetRequest, db: AsyncSession = Depends(get_db)) -> StandardResponse[str]:
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()
    token = secrets.token_urlsafe(32)
    if user is not None:
        reset_row = PasswordResetToken(
            user_id=user.id,
            token_hash=sha256(token.encode("utf-8")).hexdigest(),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.password_reset_token_expire_minutes),
            revoked=False,
        )
        db.add(reset_row)
        await db.commit()
    return StandardResponse(message="If the account exists, a reset link has been generated.", data=token if settings.environment != "production" else "accepted")


@router.post("/users/password/reset/confirm", response_model=StandardResponse[str])
async def confirm_password_reset(payload: PasswordResetConfirmRequest, db: AsyncSession = Depends(get_db)) -> StandardResponse[str]:
    token_hash = sha256(payload.token.encode("utf-8")).hexdigest()
    result = await db.execute(select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash, PasswordResetToken.revoked.is_(False)))
    token_row = result.scalar_one_or_none()
    if token_row is None or token_row.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token is invalid or expired")
    user = await db.get(User, token_row.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.hashed_password = hash_password(payload.new_password)
    user.password_changed_at = datetime.now(timezone.utc)
    token_row.revoked = True
    token_row.used_at = datetime.now(timezone.utc)
    await _revoke_user_tokens(db, user.id)
    await db.commit()
    return StandardResponse(message="Password reset complete", data=user.id)


@router.post("/users/email-verification/request", response_model=StandardResponse[str])
async def request_email_verification(payload: EmailVerificationRequest, db: AsyncSession = Depends(get_db)) -> StandardResponse[str]:
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()
    if user is None:
        return StandardResponse(message="If the account exists, a verification link has been generated.", data="accepted")
    token = secrets.token_urlsafe(32)
    db.add(
        EmailVerificationToken(
            user_id=user.id,
            token_hash=sha256(token.encode("utf-8")).hexdigest(),
            email_address=user.email,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.email_verification_token_expire_minutes),
            revoked=False,
        )
    )
    await db.commit()
    return StandardResponse(message="Verification link generated", data=token if settings.environment != "production" else "accepted")


@router.post("/users/email-verification/confirm", response_model=StandardResponse[str])
async def confirm_email_verification(token: str, db: AsyncSession = Depends(get_db)) -> StandardResponse[str]:
    token_hash = sha256(token.encode("utf-8")).hexdigest()
    result = await db.execute(select(EmailVerificationToken).where(EmailVerificationToken.token_hash == token_hash, EmailVerificationToken.revoked.is_(False)))
    token_row = result.scalar_one_or_none()
    if token_row is None or token_row.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification token is invalid or expired")
    user = await db.get(User, token_row.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_verified = True
    user.email_verified_at = datetime.now(timezone.utc)
    token_row.revoked = True
    token_row.verified_at = datetime.now(timezone.utc)
    await db.commit()
    return StandardResponse(message="Email verified", data=user.id)


@router.get("/users", response_model=PaginatedResponse[UserRead], dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))])
async def list_users(db: AsyncSession = Depends(get_db)) -> PaginatedResponse[UserRead]:
    result = await db.execute(select(User).options(selectinload(User.roles)).order_by(User.created_at.desc()))
    items = [UserRead.model_validate(item) for item in result.scalars().all()]
    return PaginatedResponse(items=items, page=1, page_size=len(items) or 1, total=len(items), pages=1 if items else 0)


@router.get("/users/{user_id}", response_model=UserRead, dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))])
async def read_user(user_id: str, db: AsyncSession = Depends(get_db)) -> UserRead:
    user = await _load_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserRead.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserRead, dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))])
async def update_user(user_id: str, payload: UserAdminUpdate, db: AsyncSession = Depends(get_db)) -> UserRead:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.is_verified is not None:
        user.is_verified = payload.is_verified
    await db.commit()
    user = await _load_user(db, user.id) or user
    return UserRead.model_validate(user)


@router.delete("/users/{user_id}", response_model=StandardResponse[str], dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))])
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db)) -> StandardResponse[str]:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    await _revoke_user_tokens(db, user_id)
    await db.delete(user)
    await db.commit()
    return StandardResponse(message="User deleted", data=user_id)
