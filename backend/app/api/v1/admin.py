from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.api.deps import require_permission
from backend.app.core.database import get_db
from backend.app.core.rbac import PermissionName
from backend.app.models.modit import Organization
from backend.app.models.shared import UserSession
from backend.app.models.user import Permission, Role, User
from backend.app.schemas.platform import (
    AdminDashboardResponse,
    PermissionRead,
    PermissionUpdate,
    RolePermissionsUpdate,
    RoleRead,
    RoleUpdate,
    StandardResponse,
    UserAdminUpdate,
    UserRead,
    UserRolesUpdate,
)

router = APIRouter()


@router.get("/admin/dashboard", response_model=AdminDashboardResponse, dependencies=[Depends(require_permission(PermissionName.SYSTEM_HEALTH_READ))])
async def dashboard(db: AsyncSession = Depends(get_db)) -> AdminDashboardResponse:
    users = (await db.execute(select(func.count(User.id)))).scalar_one()
    organizations = (await db.execute(select(func.count(Organization.id)))).scalar_one()
    roles = (await db.execute(select(func.count(Role.id)))).scalar_one()
    permissions = (await db.execute(select(func.count(Permission.id)))).scalar_one()
    sessions = (await db.execute(select(func.count(UserSession.id)))).scalar_one()
    return AdminDashboardResponse(users=users, organizations=organizations, roles=roles, permissions=permissions, sessions=sessions)


@router.patch("/admin/users/{user_id}", response_model=UserRead, dependencies=[Depends(require_permission(PermissionName.USER_MANAGE))])
async def admin_update_user(user_id: str, payload: UserAdminUpdate, db: AsyncSession = Depends(get_db)) -> UserRead:
    # selectinload: UserRead serializes roles; a db.get() lazy-load on the
    # async session would raise inside response validation (the old 500).
    user = (
        await db.execute(
            select(User).options(selectinload(User.roles)).where(User.id == user_id)
        )
    ).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.is_verified is not None:
        user.is_verified = payload.is_verified
    await db.commit()
    await db.refresh(user)
    return UserRead.model_validate(user)


@router.post("/admin/users/{user_id}/roles", response_model=StandardResponse[str], dependencies=[Depends(require_permission(PermissionName.ROLE_MANAGE))])
async def assign_roles(user_id: str, payload: UserRolesUpdate, db: AsyncSession = Depends(get_db)) -> StandardResponse[str]:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    roles = []
    for role_id in payload.role_ids:
        role = await db.get(Role, role_id)
        if role is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Role not found: {role_id}")
        roles.append(role)
    user.roles = roles
    await db.commit()
    return StandardResponse(message="Roles assigned", data=user_id)


# GET/POST /admin/roles, GET/POST /admin/permissions, GET /admin/users and
# the audit/health/metrics lists live ONLY in admin_extended.py (service-
# backed, eager-loaded). Registering them twice made one raw duplicate
# shadow the other (FastAPI serves the FIRST match) — exactly why role
# creation silently ignored permission_ids and users listed without roles.


@router.patch("/admin/roles/{role_id}", response_model=RoleRead, dependencies=[Depends(require_permission(PermissionName.ROLE_MANAGE))])
async def update_role(role_id: str, payload: RoleUpdate, db: AsyncSession = Depends(get_db)) -> RoleRead:
    role = await db.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    if payload.name is not None:
        role.name = payload.name
    if payload.description is not None:
        role.description = payload.description
    await db.commit()
    await db.refresh(role)
    return RoleRead.model_validate(role)


@router.patch("/admin/permissions/{permission_id}", response_model=PermissionRead, dependencies=[Depends(require_permission(PermissionName.ROLE_MANAGE))])
async def update_permission(permission_id: str, payload: PermissionUpdate, db: AsyncSession = Depends(get_db)) -> PermissionRead:
    permission = await db.get(Permission, permission_id)
    if permission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")
    if payload.name is not None:
        permission.name = payload.name
    if payload.description is not None:
        permission.description = payload.description
    await db.commit()
    await db.refresh(permission)
    return PermissionRead.model_validate(permission)


@router.post("/admin/roles/{role_id}/permissions", response_model=StandardResponse[str], dependencies=[Depends(require_permission(PermissionName.ROLE_MANAGE))])
async def assign_permissions(role_id: str, payload: RolePermissionsUpdate, db: AsyncSession = Depends(get_db)) -> StandardResponse[str]:
    role = await db.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    permissions = []
    for permission_id in payload.permission_ids:
        permission = await db.get(Permission, permission_id)
        if permission is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Permission not found: {permission_id}")
        permissions.append(permission)
    role.permissions = permissions
    await db.commit()
    return StandardResponse(message="Permissions assigned", data=role_id)
