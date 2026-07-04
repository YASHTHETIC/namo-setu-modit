from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, require_permission
from backend.app.core.database import get_db
from backend.app.core.rbac import PermissionName
from backend.app.models.shared import AuditLog
from backend.app.models.user import User
from backend.app.schemas.platform import AuditLogRead, PaginatedResponse

router = APIRouter()


@router.get("/audit/logs", response_model=PaginatedResponse[AuditLogRead], dependencies=[Depends(require_permission(PermissionName.AUDIT_READ))])
async def list_audit_logs(db: AsyncSession = Depends(get_db)) -> PaginatedResponse[AuditLogRead]:
    result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()))
    items = [AuditLogRead.model_validate(item) for item in result.scalars().all()]
    return PaginatedResponse(items=items, page=1, page_size=len(items) or 1, total=len(items), pages=1 if items else 0)


@router.get("/audit/login-history", response_model=PaginatedResponse[AuditLogRead], dependencies=[Depends(require_permission(PermissionName.AUDIT_READ))])
async def login_history(db: AsyncSession = Depends(get_db)) -> PaginatedResponse[AuditLogRead]:
    result = await db.execute(select(AuditLog).where(AuditLog.action.like("auth.%")).order_by(AuditLog.created_at.desc()))
    items = [AuditLogRead.model_validate(item) for item in result.scalars().all()]
    return PaginatedResponse(items=items, page=1, page_size=len(items) or 1, total=len(items), pages=1 if items else 0)


@router.get("/audit/security-events", response_model=PaginatedResponse[AuditLogRead], dependencies=[Depends(require_permission(PermissionName.AUDIT_READ))])
async def security_events(db: AsyncSession = Depends(get_db)) -> PaginatedResponse[AuditLogRead]:
    result = await db.execute(select(AuditLog).where(AuditLog.entity_type == "security_event").order_by(AuditLog.created_at.desc()))
    items = [AuditLogRead.model_validate(item) for item in result.scalars().all()]
    return PaginatedResponse(items=items, page=1, page_size=len(items) or 1, total=len(items), pages=1 if items else 0)
