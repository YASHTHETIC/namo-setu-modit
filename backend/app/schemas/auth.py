from pydantic import BaseModel, EmailStr

from backend.app.schemas.user import UserRead


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str | None = None
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OtpRequest(BaseModel):
    phone: str


class OtpVerifyRequest(BaseModel):
    phone: str
    code: str


class OtpRequestResponse(BaseModel):
    sent: bool


class ClaimStaffResponse(BaseModel):
    claimed: bool


class StaffStatusResponse(BaseModel):
    is_staff: bool
    staff_exists: bool
