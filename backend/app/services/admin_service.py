from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.models.shared import AuditLog, UserSession
from backend.app.models.user import Permission, Role, User, role_permissions, user_roles
from backend.app.schemas.admin import (
    ActivityTimelineItem,
    AuditLogListResponse,
    AuditLogRead,
    PermissionRead,
    RoleRead,
    SystemHealthResponse,
    SystemMetricsResponse,
)

logger = logging.getLogger(__name__)

_app_start_time = time.time()


class AdminService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_role(self, name: str, description: str | None = None, permission_ids: list[str] | None = None) -> RoleRead:
        role = Role(name=name, description=description)
        if permission_ids:
            perms = []
            for pid in permission_ids:
                perm = await self.db.get(Permission, pid)
                if perm is None:
                    raise ValueError(f"Permission not found: {pid}")
                perms.append(perm)
            role.permissions = perms
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)
        return await self._role_to_read(role)

    async def update_role(self, role_id: str, name: str | None = None, description: str | None = None, permission_ids: list[str] | None = None) -> RoleRead:
        role = await self.db.get(Role, role_id)
        if role is None:
            raise ValueError("Role not found")
        if name is not None:
            role.name = name
        if description is not None:
            role.description = description
        if permission_ids is not None:
            perms = []
            for pid in permission_ids:
                perm = await self.db.get(Permission, pid)
                if perm is None:
                    raise ValueError(f"Permission not found: {pid}")
                perms.append(perm)
            role.permissions = perms
        await self.db.commit()
        await self.db.refresh(role)
        return await self._role_to_read(role)

    async def delete_role(self, role_id: str) -> None:
        role = await self.db.get(Role, role_id)
        if role is None:
            raise ValueError("Role not found")
        await self.db.delete(role)
        await self.db.commit()

    async def list_roles(self) -> list[RoleRead]:
        result = await self.db.execute(
            select(Role)
            .options(selectinload(Role.permissions))
            .order_by(Role.name.asc())
        )
        roles = result.scalars().all()
        return [await self._role_to_read(r) for r in roles]

    async def get_role_permissions(self, role_id: str) -> list[PermissionRead]:
        role = await self.db.execute(
            select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
        )
        role = role.scalar_one_or_none()
        if role is None:
            raise ValueError("Role not found")
        return [PermissionRead.model_validate(p) for p in role.permissions]

    async def assign_role_to_user(self, user_id: str, role_name: str) -> None:
        user = await self.db.get(User, user_id)
        if user is None:
            raise ValueError("User not found")
        result = await self.db.execute(select(Role).where(Role.name == role_name))
        role = result.scalar_one_or_none()
        if role is None:
            raise ValueError(f"Role '{role_name}' not found")
        role_ids = {r.id for r in user.roles}
        if role.id not in role_ids:
            user.roles.append(role)
            await self.db.commit()

    async def remove_role_from_user(self, user_id: str, role_name: str) -> None:
        user = await self.db.get(User, user_id)
        if user is None:
            raise ValueError("User not found")
        result = await self.db.execute(select(Role).where(Role.name == role_name))
        role = result.scalar_one_or_none()
        if role is None:
            raise ValueError(f"Role '{role_name}' not found")
        user.roles = [r for r in user.roles if r.id != role.id]
        await self.db.commit()

    async def list_permissions(self) -> list[PermissionRead]:
        result = await self.db.execute(select(Permission).order_by(Permission.name.asc()))
        return [PermissionRead.model_validate(p) for p in result.scalars().all()]

    async def create_permission(self, name: str, description: str | None = None) -> PermissionRead:
        perm = Permission(name=name, description=description)
        self.db.add(perm)
        await self.db.commit()
        await self.db.refresh(perm)
        return PermissionRead.model_validate(perm)

    async def log_action(
        self,
        product_code: str,
        actor_user_id: str | None,
        action: str,
        entity_type: str,
        entity_id: str,
        before_json: str | None = None,
        after_json: str | None = None,
        ip_address: str | None = None,
        request_id: str | None = None,
    ) -> AuditLog:
        log = AuditLog(
            product_code=product_code,
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before_json=before_json,
            after_json=after_json,
            ip_address=ip_address,
            request_id=request_id,
        )
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)
        return log

    async def get_audit_logs(
        self,
        product_code: str | None = None,
        actor_user_id: str | None = None,
        action: str | None = None,
        entity_type: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> AuditLogListResponse:
        query = select(AuditLog)
        count_query = select(func.count(AuditLog.id))

        if product_code:
            query = query.where(AuditLog.product_code == product_code)
            count_query = count_query.where(AuditLog.product_code == product_code)
        if actor_user_id:
            query = query.where(AuditLog.actor_user_id == actor_user_id)
            count_query = count_query.where(AuditLog.actor_user_id == actor_user_id)
        if action:
            query = query.where(AuditLog.action == action)
            count_query = count_query.where(AuditLog.action == action)
        if entity_type:
            query = query.where(AuditLog.entity_type == entity_type)
            count_query = count_query.where(AuditLog.entity_type == entity_type)

        total = (await self.db.execute(count_query)).scalar_one() or 0
        query = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        logs = [AuditLogRead.model_validate(l) for l in result.scalars().all()]
        return AuditLogListResponse(logs=logs, total=total)

    async def get_audit_log_detail(self, log_id: str) -> AuditLogRead:
        log = await self.db.get(AuditLog, log_id)
        if log is None:
            raise ValueError("Audit log not found")
        return AuditLogRead.model_validate(log)

    async def get_system_health(self) -> SystemHealthResponse:
        db_status = "healthy"
        try:
            await self.db.execute(select(func.count(User.id)))
        except Exception:
            db_status = "unhealthy"

        redis_status = "healthy"
        try:
            from backend.app.core.redis import get_redis
            r = await get_redis()
            await r.ping()
        except Exception:
            redis_status = "unhealthy"

        import psutil
        try:
            mem = psutil.virtual_memory()
            memory_usage = {"total_gb": round(mem.total / (1024**3), 2), "used_gb": round(mem.used / (1024**3), 2), "percent": mem.percent}
        except Exception:
            memory_usage = {"total_gb": 0, "used_gb": 0, "percent": 0}

        uptime = round(time.time() - _app_start_time, 2)
        overall = "healthy" if db_status == "healthy" and redis_status == "healthy" else "degraded"
        return SystemHealthResponse(status=overall, database=db_status, redis=redis_status, uptime=uptime, memory_usage=memory_usage)

    async def get_system_metrics(self) -> SystemMetricsResponse:
        try:
            import psutil
            cpu_percent = psutil.cpu_percent(interval=0.1)
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage("/")
            memory_percent = mem.percent
            disk_percent = disk.percent
        except ImportError:
            cpu_percent = 0.0
            memory_percent = 0.0
            disk_percent = 0.0

        result = await self.db.execute(select(func.count(UserSession.id)).where(UserSession.is_revoked == False))
        active_sessions = result.scalar_one() or 0

        return SystemMetricsResponse(cpu_percent=cpu_percent, memory_percent=memory_percent, disk_percent=disk_percent, active_sessions=active_sessions)

    async def get_activity_timeline(self, limit: int = 20) -> list[ActivityTimelineItem]:
        result = await self.db.execute(
            select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        )
        logs = result.scalars().all()

        user_ids = {l.actor_user_id for l in logs if l.actor_user_id}
        user_map: dict[str, str] = {}
        if user_ids:
            users_result = await self.db.execute(select(User.id, User.full_name, User.email).where(User.id.in_(user_ids)))
            for row in users_result.all():
                user_map[row[0]] = row[1] or row[2]

        items = []
        for log in logs:
            user_name = user_map.get(log.actor_user_id, "System") if log.actor_user_id else "System"
            items.append(ActivityTimelineItem(
                timestamp=log.created_at,
                user_name=user_name,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                details=log.after_json,
            ))
        return items

    async def list_users(self, page: int = 1, page_size: int = 20) -> list[User]:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.roles))
            .order_by(User.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all())

    async def get_user_detail(self, user_id: str) -> User:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.roles), selectinload(User.sessions))
            .where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise ValueError("User not found")
        return user

    async def update_user_status(self, user_id: str, is_active: bool) -> User:
        user = await self.db.get(User, user_id)
        if user is None:
            raise ValueError("User not found")
        user.is_active = is_active
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def _role_to_read(self, role: Role) -> RoleRead:
        result = await self.db.execute(
            select(func.count(user_roles.c.user_id))
            .where(user_roles.c.role_id == role.id)
        )
        user_count = result.scalar_one() or 0
        return RoleRead(
            id=role.id,
            name=role.name,
            description=role.description,
            permissions=[PermissionRead.model_validate(p) for p in role.permissions],
            user_count=user_count,
        )
