from collections.abc import Awaitable, Callable
import logging
import traceback
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

logger = logging.getLogger(__name__)


class AppException(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details or {}


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found", details: dict[str, Any] | None = None) -> None:
        super().__init__(message, status.HTTP_404_NOT_FOUND, "NOT_FOUND", details)


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request", details: dict[str, Any] | None = None) -> None:
        super().__init__(message, status.HTTP_400_BAD_REQUEST, "BAD_REQUEST", details)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized", details: dict[str, Any] | None = None) -> None:
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", details)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden", details: dict[str, Any] | None = None) -> None:
        super().__init__(message, status.HTTP_403_FORBIDDEN, "FORBIDDEN", details)


class ConflictException(AppException):
    def __init__(self, message: str = "Resource conflict", details: dict[str, Any] | None = None) -> None:
        super().__init__(message, status.HTTP_409_CONFLICT, "CONFLICT", details)


class ValidationException(AppException):
    def __init__(self, message: str = "Validation failed", details: dict[str, Any] | None = None) -> None:
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", details)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def handle_app_exception(request: Request, exc: AppException) -> JSONResponse:
        logger.warning(f"AppException: {exc.message} - Code: {exc.code} - Path: {request.url.path}")
        
        response_content: dict[str, Any] = {
            "detail": exc.message,
            "code": exc.code,
        }
        
        if exc.details:
            response_content["details"] = exc.details
        
        return JSONResponse(status_code=exc.status_code, content=response_content)

    @app.exception_handler(HTTPException)
    async def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
        logger.warning(f"HTTPException: {exc.detail} - Status: {exc.status_code} - Path: {request.url.path}")
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "code": "HTTP_ERROR",
            },
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        logger.warning(f"Validation error: {exc.errors()} - Path: {request.url.path}")
        
        formatted_errors = []
        for error in exc.errors():
            formatted_errors.append({
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"],
            })
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Validation failed",
                "code": "VALIDATION_ERROR",
                "errors": formatted_errors,
            },
        )

    @app.exception_handler(ValidationError)
    async def handle_pydantic_validation_error(
        request: Request, exc: ValidationError
    ) -> JSONResponse:
        logger.warning(f"Pydantic validation error: {exc.errors()} - Path: {request.url.path}")
        
        formatted_errors = []
        for error in exc.errors():
            formatted_errors.append({
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"],
            })
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Data validation failed",
                "code": "VALIDATION_ERROR",
                "errors": formatted_errors,
            },
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_exception(request: Request, exc: Exception) -> JSONResponse:
        error_id = f"ERR_{id(exc)}"
        logger.error(
            f"Unexpected error [{error_id}]: {str(exc)} - Path: {request.url.path}\n"
            f"Traceback: {traceback.format_exc()}"
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An unexpected error occurred",
                "code": "INTERNAL_ERROR",
                "error_id": error_id,
            },
        )
