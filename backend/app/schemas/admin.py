from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from backend.app.schemas.common import ORMModel


class RoleCreate(BaseModel):
    name: str
    description: str | None = None
    permission_ids: list[str] = Field(default_factory=list)


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permission_ids: list[str] | None = None


class RoleRead(ORMModel):
    id: str
    name: str
    description: str | None = None
    permissions: list[PermissionRead] = Field(default_factory=list)
    user_count: int = 0


class PermissionRead(ORMModel):
    id: str
    name: str
    description: str | None = None


RoleRead.model_rebuild()


class AuditLogRead(ORMModel):
    id: str
    product_code: str
    actor_user_id: str | None = None
    action: str
    entity_type: str
    entity_id: str
    before_json: str | None = None
    after_json: str | None = None
    ip_address: str | None = None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    logs: list[AuditLogRead]
    total: int


class SystemHealthResponse(BaseModel):
    status: str
    database: str
    redis: str
    uptime: float
    memory_usage: dict[str, float]


class SystemMetricsResponse(BaseModel):
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    active_sessions: int


class ActivityTimelineItem(BaseModel):
    timestamp: datetime
    user_name: str
    action: str
    entity_type: str
    entity_id: str
    details: str | None = None


class UserRoleAssignRequest(BaseModel):
    user_id: str
    role_name: str


class UserStatusUpdate(BaseModel):
    is_active: bool
