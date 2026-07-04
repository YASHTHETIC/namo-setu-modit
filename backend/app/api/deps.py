from collections.abc import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.core.config import get_settings
from backend.app.core.database import get_db
from backend.app.core.rbac import PermissionName, RoleName, has_permission
from backend.app.core.security import decode_token
from backend.app.models.user import User

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    result = await db.execute(
        select(User)
        .options(selectinload(User.roles), selectinload(User.profile), selectinload(User.sessions), selectinload(User.addresses))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_permission(permission: PermissionName):
    async def dependency(user: User = Depends(get_current_user)) -> User:
        role_names = [role.name for role in user.roles]
        if not has_permission(role_names, permission):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return dependency


def require_any_permission(*permissions: PermissionName):
    async def dependency(user: User = Depends(get_current_user)) -> User:
        role_names = [role.name for role in user.roles]
        if not any(has_permission(role_names, permission) for permission in permissions):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return dependency


def require_role(*roles: RoleName):
    async def dependency(user: User = Depends(get_current_user)) -> User:
        role_names = {role.name for role in user.roles}
        if not any(role.value in role_names for role in roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return dependency
