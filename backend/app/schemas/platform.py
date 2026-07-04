from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, EmailStr, Field

from backend.app.schemas.common import ORMModel
from backend.app.schemas.user import PermissionRead, RoleRead, UserRead

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str | None = None
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")
    search: str | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    page: int
    page_size: int
    total: int
    pages: int


class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str | None = None
    data: T | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    token: str
    new_password: str


class EmailVerificationRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class SessionRead(ORMModel):
    id: str
    user_id: str
    session_token: str
    ip_address: str | None = None
    user_agent: str | None = None
    expires_at: datetime
    is_revoked: bool


class SessionRevokeRequest(BaseModel):
    session_id: str


class SessionListResponse(ORMModel):
    sessions: list[SessionRead]


class UserProfileRead(ORMModel):
    id: str
    user_id: str
    phone_number: str | None = None
    language_id: str | None = None
    avatar_media_id: str | None = None
    status: str
    date_of_birth: datetime | None = None
    timezone: str | None = None
    preferences_json: str | None = None
    notification_preferences_json: str | None = None


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    phone_number: str | None = None
    language_id: str | None = None
    timezone: str | None = None
    preferences_json: str | None = None
    notification_preferences_json: str | None = None


class AddressCreate(BaseModel):
    country_id: str
    state_id: str
    city_id: str
    address_line1: str
    address_line2: str | None = None
    pincode: str
    address_type: str = "home"
    owner_type: str = "user"
    is_primary: bool = False


class AddressUpdate(BaseModel):
    address_line1: str | None = None
    address_line2: str | None = None
    pincode: str | None = None
    address_type: str | None = None
    is_primary: bool | None = None


class AddressRead(ORMModel):
    id: str
    user_id: str | None = None
    organization_id: str | None = None
    country_id: str
    state_id: str
    city_id: str
    address_line1: str
    address_line2: str | None = None
    pincode: str
    address_type: str
    owner_type: str
    is_primary: bool


class MediaRead(ORMModel):
    id: str
    product_code: str
    owner_user_id: str | None = None
    media_type: str
    storage_key: str
    url: str
    mime_type: str
    file_size_bytes: int
    width: int | None = None
    height: int | None = None
    checksum_sha256: str | None = None


class NotificationRead(ORMModel):
    id: str
    product_code: str
    user_id: str
    channel: str
    title: str
    message: str
    template_key: str | None = None
    status: str
    metadata_json: str | None = None
    scheduled_at: datetime | None = None
    sent_at: datetime | None = None
    read_at: datetime | None = None


class NotificationPreferenceUpdate(BaseModel):
    notification_preferences_json: str | None = None


class AuditLogRead(ORMModel):
    id: str
    product_code: str
    actor_user_id: str | None = None
    action: str
    entity_type: str
    entity_id: str
    before_json: str | None = None
    after_json: str | None = None
    request_id: str | None = None
    ip_address: str | None = None


class OrganizationRead(ORMModel):
    id: str
    owner_user_id: str | None = None
    name: str
    legal_name: str | None = None
    organization_type: str
    registration_number: str | None = None
    gst_number: str | None = None
    pan_number: str | None = None
    website_url: str | None = None
    is_active: bool
    billing_email: str | None = None
    settings_json: str | None = None


class OrganizationCreate(BaseModel):
    name: str
    legal_name: str | None = None
    organization_type: str
    billing_email: EmailStr | None = None
    settings_json: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = None
    legal_name: str | None = None
    billing_email: EmailStr | None = None
    settings_json: str | None = None
    is_active: bool | None = None


class OrganizationMemberRead(ORMModel):
    id: str
    organization_id: str
    user_id: str
    role_name: str
    designation: str | None = None
    is_primary: bool


class OrganizationMemberCreate(BaseModel):
    user_id: str
    role_name: str
    designation: str | None = None
    is_primary: bool = False


class OrganizationTeamRead(ORMModel):
    id: str
    organization_id: str
    created_by_user_id: str | None = None
    name: str
    code: str
    description: str | None = None
    is_default: bool
    is_active: bool


class OrganizationTeamCreate(BaseModel):
    name: str
    code: str
    description: str | None = None
    is_default: bool = False


class OrganizationTeamMemberRead(ORMModel):
    id: str
    team_id: str
    user_id: str
    role_name: str
    is_owner: bool


class OrganizationInvitationRead(ORMModel):
    id: str
    organization_id: str
    team_id: str | None = None
    invited_by_user_id: str | None = None
    email: EmailStr
    role_name: str
    token_hash: str
    status: str
    expires_at: datetime
    accepted_at: datetime | None = None
    revoked_at: datetime | None = None


class OrganizationInvitationCreate(BaseModel):
    email: EmailStr
    role_name: str
    team_id: str | None = None
    expires_at: datetime | None = None


class RoleCreate(BaseModel):
    name: str
    description: str | None = None


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class PermissionCreate(BaseModel):
    name: str
    description: str | None = None


class PermissionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class RolePermissionsUpdate(BaseModel):
    permission_ids: list[str] = Field(default_factory=list)


class UserRolesUpdate(BaseModel):
    role_ids: list[str] = Field(default_factory=list)


class UserAdminUpdate(BaseModel):
    full_name: str | None = None
    is_active: bool | None = None
    is_verified: bool | None = None


class LoginHistoryRead(ORMModel):
    id: str
    product_code: str
    actor_user_id: str | None = None
    action: str
    entity_type: str
    entity_id: str
    request_id: str | None = None
    ip_address: str | None = None


class SecurityEventRead(ORMModel):
    id: str
    product_code: str
    actor_user_id: str | None = None
    action: str
    entity_type: str
    entity_id: str
    before_json: str | None = None
    after_json: str | None = None
    request_id: str | None = None
    ip_address: str | None = None


class UploadRequest(BaseModel):
    product_code: str
    media_type: str


class UploadResponse(ORMModel):
    media: MediaRead


class AppHealthResponse(BaseModel):
    status: str
    dependencies: dict[str, str]


class AdminDashboardResponse(BaseModel):
    users: int = 0
    organizations: int = 0
    roles: int = 0
    permissions: int = 0
    sessions: int = 0
