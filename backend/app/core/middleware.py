from typing import Callable, Awaitable
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)


class ValidationMiddleware(BaseHTTPMiddleware):
    """Middleware to validate request data before it reaches the route handler."""
    
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        # Add request ID for tracking
        request_id = f"req_{id(request)}"
        request.state.request_id = request_id
        
        # Log incoming request
        logger.info(f"[{request_id}] {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
            
            # Log response
            logger.info(
                f"[{request_id}] Response: {response.status_code} - "
                f"{request.method} {request.url.path}"
            )
            
            # Add security headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            
            return response
            
        except Exception as e:
            logger.error(f"[{request_id}] Error in middleware: {str(e)}")
            raise


class ContentTypeMiddleware(BaseHTTPMiddleware):
    """Middleware to ensure proper content-type for POST/PUT/PATCH requests."""
    
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")
            
            # Skip validation for multipart/form-data
            if "multipart/form-data" not in content_type:
                # For JSON requests, ensure content-type is set
                if not content_type:
                    # Try to check if body looks like JSON
                    body = await request.body()
                    if body and (body.startswith(b"{") or body.startswith(b"[")):
                        request.headers.__dict__["_list"].append(
                            (b"content-type", b"application/json")
                        )
        
        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Basic rate limiting middleware (placeholder for production implementation)."""
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts = {}
    
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        # Get client identifier (IP or user ID if authenticated)
        client_id = request.client.host if request.client else "unknown"
        
        # In production, use Redis for distributed rate limiting
        # This is a basic in-memory implementation for development
        import time
        current_time = time.time()
        
        if client_id not in self.request_counts:
            self.request_counts[client_id] = []
        
        # Clean old requests (older than 1 minute)
        self.request_counts[client_id] = [
            t for t in self.request_counts[client_id]
            if current_time - t < 60
        ]
        
        # Check rate limit
        if len(self.request_counts[client_id]) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for {client_id}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests",
                    "code": "RATE_LIMIT_EXCEEDED",
                },
            )
        
        # Record this request
        self.request_counts[client_id].append(current_time)
        
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses."""
    
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # HSTS (only in production with HTTPS)
        # response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response
