from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.app.api.deps import get_current_user
from backend.app.schemas.platform import StandardResponse
from backend.app.services.security_service import SecurityService

router = APIRouter()


class RateLimitStatusRequest(BaseModel):
    key: str
    max_requests: int = 100
    window_seconds: int = 60


class RateLimitStatusResponse(BaseModel):
    key: str
    remaining: int
    allowed: bool


class ValidateFileRequest(BaseModel):
    filename: str
    file_size: int
    allowed_types: list[str] | None = None


class SanitizeRequest(BaseModel):
    text: str


class SanitizeResponse(BaseModel):
    original: str
    sanitized: str


@router.get(
    "/security/rate-limit-status",
    response_model=RateLimitStatusResponse,
    dependencies=[Depends(get_current_user)],
)
async def rate_limit_status(
    key: str,
    max_requests: int = 100,
    window_seconds: int = 60,
) -> RateLimitStatusResponse:
    svc = SecurityService()
    remaining = await svc.get_rate_limit_remaining(key, max_requests, window_seconds)
    return RateLimitStatusResponse(key=key, remaining=remaining, allowed=remaining > 0)


@router.post(
    "/security/validate-file",
    response_model=StandardResponse[bool],
    dependencies=[Depends(get_current_user)],
)
async def validate_file_endpoint(
    payload: ValidateFileRequest,
) -> StandardResponse[bool]:
    svc = SecurityService()
    valid = svc.validate_file_upload(payload.filename, payload.file_size, payload.allowed_types)
    return StandardResponse(message="File validated", data=valid)


@router.post(
    "/security/sanitize",
    response_model=SanitizeResponse,
    dependencies=[Depends(get_current_user)],
)
async def sanitize_endpoint(
    payload: SanitizeRequest,
) -> SanitizeResponse:
    svc = SecurityService()
    sanitized = svc.sanitize_input(payload.text)
    return SanitizeResponse(original=payload.text, sanitized=sanitized)
