from pydantic import EmailStr, Field

from backend.app.schemas.common import ORMModel


class RoleRead(ORMModel):
    id: str
    name: str
    description: str | None = None


class PermissionRead(ORMModel):
    id: str
    name: str
    description: str | None = None


class UserRead(ORMModel):
    id: str
    email: EmailStr
    full_name: str | None = None
    is_active: bool
    is_verified: bool
    roles: list[RoleRead] = Field(default_factory=list)


class UserCreate(ORMModel):
    email: EmailStr
    full_name: str | None = None
    password: str


class UserLogin(ORMModel):
    email: EmailStr
    password: str
