from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from backend.app.schemas.common import ORMModel


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class VerifyEmailRequest(BaseModel):
    token: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class SessionRead(ORMModel):
    id: str
    session_token: str
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime
    expires_at: datetime
    is_revoked: bool = False
    is_current: bool = False


class SessionListResponse(BaseModel):
    sessions: list[SessionRead]


class RevokeSessionRequest(BaseModel):
    session_id: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    phone_number: str | None = None
    avatar_url: str | None = None
    preferences_json: str | None = None
    notification_preferences_json: str | None = None


class ProfileRead(ORMModel):
    id: str
    email: EmailStr
    full_name: str | None = None
    is_active: bool
    is_verified: bool
    email_verified_at: datetime | None = None
    last_login_at: datetime | None = None
    password_changed_at: datetime | None = None
    mfa_enabled: bool = False
    phone_number: str | None = None
    avatar_url: str | None = None
    preferences_json: str | None = None
    notification_preferences_json: str | None = None
    date_of_birth: datetime | None = None
    timezone: str | None = None


class DeviceInfo(BaseModel):
    user_agent: str | None = None
    ip_address: str | None = None


class TwoFactorEnableResponse(BaseModel):
    secret: str
    recovery_codes: list[str]


class TwoFactorVerifyRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6)
