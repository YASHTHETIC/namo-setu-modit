from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, require_permission
from backend.app.core.database import get_db
from backend.app.core.rbac import PermissionName
from backend.app.models.enums import ProductCode
from backend.app.models.modit import PlatformCoupon
from backend.app.models.user import User
from backend.app.schemas.admin import (
    AuditLogListResponse,
    AuditLogRead,
    PermissionRead,
    RoleCreate,
    RoleRead,
    RoleUpdate,
    SystemHealthResponse,
    SystemMetricsResponse,
    ActivityTimelineItem,
    UserStatusUpdate,
    UserRoleAssignRequest,
)
from backend.app.schemas.modit import (
    PlatformCouponCreate,
    PlatformCouponRead,
    PlatformCouponUpdate,
)
from backend.app.schemas.platform import PermissionCreate as PlatformPermissionCreate, StandardResponse
from backend.app.services.admin_service import AdminService
from backend.app.services.audit_service import create_audit_log

router = APIRouter()


@router.post(
    "/admin/roles",
    response_model=RoleRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(PermissionName.ROLE_MANAGE))],
)
async def create_role_endpoint(
    payload: RoleCreate,
    db: AsyncSession = Depends(get_db),
) -> RoleRead:
    svc = AdminService(db)
    try:
        return await svc.create_role(payload.name, payload.description, payload.permission_ids)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/admin/roles",
    response_model=list[RoleRead],
    dependencies=[Depends(require_permission(PermissionName.ROLE_MANAGE))],
)
async def list_roles_endpoint(db: AsyncSession = Depends(get_db)) -> list[RoleRead]:
    svc = AdminService(db)
    return await svc.list_roles()


@router.put(
    "/admin/roles/{role_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_permission(PermissionName.ROLE_MANAGE))],
)
async def update_role_endpoint(
    role_id: str,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
) -> RoleRead:
    svc = AdminService(db)
    try:
        return await svc.update_role(role_id, payload.name, payload.description, payload.permission_ids)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete(
    "/admin/roles/{role_id}",
    response_model=StandardResponse[str],
    dependencies=[Depends(require_permission(PermissionName.ROLE_MANAGE))],
)
async def delete_role_endpoint(
    role_id: str,
    db: AsyncSession = Depends(get_db),
) -> StandardResponse[str]:
    svc = AdminService(db)
    try:
        await svc.delete_role(role_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return StandardResponse(message="Role deleted", data=role_id)


@router.post(
    "/admin/roles/assign",
    response_model=StandardResponse[str],
    dependencies=[Depends(require_permission(PermissionName.ROLE_MANAGE))],
)
async def assign_role_endpoint(
    payload: UserRoleAssignRequest,
    db: AsyncSession = Depends(get_db),
) -> StandardResponse[str]:
    svc = AdminService(db)
    try:
        await svc.assign_role_to_user(payload.user_id, payload.role_name)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return StandardResponse(message="Role assigned", data=payload.user_id)


@router.delete(
    "/admin/roles/assign",
    response_model=StandardResponse[str],
    dependencies=[Depends(require_permission(PermissionName.ROLE_MANAGE))],
)
async def remove_role_endpoint(
    payload: UserRoleAssignRequest,
    db: AsyncSession = Depends(get_db),
) -> StandardResponse[str]:
    svc = AdminService(db)
    try:
        await svc.remove_role_from_user(payload.user_id, payload.role_name)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return StandardResponse(message="Role removed", data=payload.user_id)


@router.get(
    "/admin/permissions",
    response_model=list[PermissionRead],
    dependencies=[Depends(require_permission(PermissionName.ROLE_MANAGE))],
)
async def list_permissions_endpoint(db: AsyncSession = Depends(get_db)) -> list[PermissionRead]:
    svc = AdminService(db)
    return await svc.list_permissions()


@router.post(
    "/admin/permissions",
    response_model=PermissionRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission(PermissionName.ROLE_MANAGE))],
)
async def create_permission_endpoint(
    payload: PlatformPermissionCreate,
    db: AsyncSession = Depends(get_db),
) -> PermissionRead:
    svc = AdminService(db)
    return await svc.create_permission(payload.name, payload.description)


@router.get(
    "/admin/audit-logs",
    response_model=AuditLogListResponse,
    dependencies=[Depends(require_permission(PermissionName.AUDIT_READ))],
)
async def list_audit_logs_endpoint(
    product_code: str | None = Query(None),
    actor_user_id: str | None = Query(None),
    action: str | None = Query(None),
    entity_type: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> AuditLogListResponse:
    svc = AdminService(db)
    return await svc.get_audit_logs(product_code, actor_user_id, action, entity_type, page, page_size)


@router.get(
    "/admin/audit-logs/{log_id}",
    response_model=AuditLogRead,
    dependencies=[Depends(require_permission(PermissionName.AUDIT_READ))],
)
async def get_audit_log_detail_endpoint(
    log_id: str,
    db: AsyncSession = Depends(get_db),
) -> AuditLogRead:
    svc = AdminService(db)
    try:
        return await svc.get_audit_log_detail(log_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/admin/health",
    response_model=SystemHealthResponse,
    dependencies=[Depends(require_permission(PermissionName.SYSTEM_HEALTH_READ))],
)
async def system_health_endpoint(db: AsyncSession = Depends(get_db)) -> SystemHealthResponse:
    svc = AdminService(db)
    return await svc.get_system_health()


@router.get(
    "/admin/metrics",
    response_model=SystemMetricsResponse,
    dependencies=[Depends(require_permission(PermissionName.SYSTEM_HEALTH_READ))],
)
async def system_metrics_endpoint(db: AsyncSession = Depends(get_db)) -> SystemMetricsResponse:
    svc = AdminService(db)
    return await svc.get_system_metrics()


@router.get(
    "/admin/activity-timeline",
    response_model=list[ActivityTimelineItem],
    dependencies=[Depends(require_permission(PermissionName.AUDIT_READ))],
)
async def activity_timeline_endpoint(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[ActivityTimelineItem]:
    svc = AdminService(db)
    return await svc.get_activity_timeline(limit)


@router.get(
    "/admin/users",
    dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))],
)
async def list_users_endpoint(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    svc = AdminService(db)
    users = await svc.list_users(page, page_size, search)
    return {
        "items": [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "roles": [{"id": r.id, "name": r.name} for r in u.roles],
            }
            for u in users
        ],
        "total": await svc.count_users(search),
    }


@router.get(
    "/admin/users/{user_id}",
    dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))],
)
async def get_user_detail_endpoint(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    svc = AdminService(db)
    try:
        user = await svc.get_user_detail(user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "mfa_enabled": user.mfa_enabled,
        "last_login_at": str(user.last_login_at) if user.last_login_at else None,
        "created_at": str(user.created_at),
        "roles": [{"id": r.id, "name": r.name} for r in user.roles],
        "sessions": [
            {"id": s.id, "ip_address": s.ip_address, "expires_at": str(s.expires_at), "is_revoked": s.is_revoked}
            for s in user.sessions
        ],
    }


@router.put(
    "/admin/users/{user_id}/status",
    response_model=StandardResponse[str],
    dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))],
)
async def update_user_status_endpoint(
    user_id: str,
    payload: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> StandardResponse[str]:
    svc = AdminService(db)
    try:
        await svc.update_user_status(user_id, payload.is_active)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    state = "activated" if payload.is_active else "deactivated"
    return StandardResponse(message=f"User {state}", data=user_id)


# =====================================================
# Server-managed coupons (validation truth for checkout)
# =====================================================

COUPON_ADMIN = Depends(require_permission(PermissionName.CONFIG_READ))


@router.get(
    "/admin/coupons",
    response_model=list[PlatformCouponRead],
    dependencies=[COUPON_ADMIN],
)
async def list_coupons_endpoint(db: AsyncSession = Depends(get_db)) -> list[PlatformCoupon]:
    result = await db.execute(
        select(PlatformCoupon)
        .where(PlatformCoupon.deleted_at.is_(None))
        .order_by(PlatformCoupon.is_active.desc(), PlatformCoupon.created_at.desc())
    )
    return list(result.scalars().all())


@router.post(
    "/admin/coupons",
    response_model=PlatformCouponRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[COUPON_ADMIN],
)
async def create_coupon_endpoint(
    payload: PlatformCouponCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PlatformCoupon:
    existing = (
        await db.execute(
            select(PlatformCoupon).where(PlatformCoupon.code == payload.code, PlatformCoupon.deleted_at.is_(None))
        )
    )
    if existing.scalars().first() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Coupon {payload.code} already exists")
    coupon = PlatformCoupon(
        code=payload.code,
        description=payload.description,
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        max_discount=payload.max_discount,
        min_order=payload.min_order,
        valid_till=payload.valid_till,
        usage_limit=payload.usage_limit,
        used_count=0,
        category=payload.category,
        is_active=payload.is_active,
    )
    db.add(coupon)
    await create_audit_log(db, product_code=ProductCode.MODIT, actor_user_id=user.id, action="modit.coupon.create", entity_type="coupon", entity_id=payload.code, after=payload.model_dump(mode="json"))
    await db.commit()
    await db.refresh(coupon)
    return coupon


@router.patch(
    "/admin/coupons/{coupon_id}",
    response_model=PlatformCouponRead,
    dependencies=[COUPON_ADMIN],
)
async def update_coupon_endpoint(
    coupon_id: str,
    payload: PlatformCouponUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PlatformCoupon:
    coupon = await db.get(PlatformCoupon, coupon_id)
    if coupon is None or coupon.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
    data = payload.model_dump(exclude_unset=True)
    new_type = data.get("discount_type") or coupon.discount_type
    if new_type == "ship":
        data["discount_value"] = 0.0
        data["max_discount"] = None
    if new_type == "percent":
        value = data.get("discount_value", coupon.discount_value)
        if value is not None and float(value) > 90:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="percentage discount cannot exceed 90%")
    elif new_type != "percent" and "max_discount" not in data and coupon.max_discount is not None and data.get("discount_type"):
        data["max_discount"] = None
    before = {k: getattr(coupon, k) for k in data}
    for key, value in data.items():
        setattr(coupon, key, value)
    await create_audit_log(db, product_code=ProductCode.MODIT, actor_user_id=user.id, action="modit.coupon.update", entity_type="coupon", entity_id=coupon.code, before=before, after=data)
    await db.commit()
    await db.refresh(coupon)
    return coupon


@router.delete(
    "/admin/coupons/{coupon_id}",
    response_model=StandardResponse[str],
    dependencies=[COUPON_ADMIN],
)
async def delete_coupon_endpoint(
    coupon_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StandardResponse[str]:
    coupon = await db.get(PlatformCoupon, coupon_id)
    if coupon is None or coupon.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
    coupon.soft_delete()
    await create_audit_log(db, product_code=ProductCode.MODIT, actor_user_id=user.id, action="modit.coupon.delete", entity_type="coupon", entity_id=coupon.code)
    await db.commit()
    return StandardResponse(message="Coupon deleted", data=coupon.id)
