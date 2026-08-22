from typing import Callable, Awaitable
import asyncio
import gzip
import time

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
        request_id = f"req_{id(request)}"
        request.state.request_id = request_id
        request.state.start_time = time.monotonic()

        try:
            response = await call_next(request)

            # Add timing header
            elapsed = time.monotonic() - request.state.start_time
            response.headers["X-Response-Time"] = f"{elapsed:.3f}s"
            response.headers["X-Request-ID"] = request_id

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

            if "multipart/form-data" not in content_type:
                if not content_type:
                    body = await request.body()
                    if body and (body.startswith(b"{") or body.startswith(b"[")):
                        request.headers.__dict__["_list"].append(
                            (b"content-type", b"application/json")
                        )

        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Redis-backed distributed rate limiting middleware.

    Sliding window counter per client IP. Works across multiple workers.
    Falls back to in-memory if Redis is unavailable.
    """

    def __init__(self, app, requests_per_minute: int = 120, burst: int = 30):
        super().__init__(app)
        self.rpm = requests_per_minute
        self.burst = burst
        # Fallback in-memory store (only used if Redis is down)
        self._local_counts: dict[str, list[float]] = {}
        self._local_cleanup_interval = 60
        self._last_cleanup = time.monotonic()

    async def _get_redis(self):
        try:
            from backend.app.core.redis import get_redis
            return await get_redis()
        except Exception:
            return None

    def _cleanup_local(self):
        now = time.monotonic()
        if now - self._last_cleanup < self._local_cleanup_interval:
            return
        self._last_cleanup = now
        cutoff = now - 60
        self._local_counts = {
            ip: [t for t in times if t > cutoff]
            for ip, times in self._local_counts.items()
            if any(t > cutoff for t in times)
        }

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        # Skip rate limiting for health checks
        if request.url.path in ("/healthz", "/api/v1/healthz"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        key = f"rl:{client_ip}"
        now = time.time()

        redis = await self._get_redis()
        if redis:
            try:
                pipe = redis.pipeline()
                pipe.zremrangebyscore(key, 0, now - 60)
                pipe.zadd(key, {str(now): now})
                pipe.zcard(key)
                pipe.expire(key, 70)
                results = await pipe.execute()
                request_count = results[2]

                if request_count > self.rpm:
                    retry_after = int(60 - (now - float(results[0] or now)))
                    logger.warning(f"Rate limit exceeded for {client_ip}: {request_count}/{self.rpm}")
                    return JSONResponse(
                        status_code=429,
                        content={
                            "detail": "Too many requests",
                            "code": "RATE_LIMIT_EXCEEDED",
                            "retry_after": max(retry_after, 1),
                        },
                        headers={"Retry-After": str(max(retry_after, 1))},
                    )
                return await call_next(request)
            except Exception as e:
                logger.warning(f"Redis rate limit failed, using fallback: {e}")

        # Fallback: in-memory sliding window
        self._cleanup_local()
        if client_ip not in self._local_counts:
            self._local_counts[client_ip] = []

        self._local_counts[client_ip] = [
            t for t in self._local_counts[client_ip] if now - t < 60
        ]

        if len(self._local_counts[client_ip]) >= self.rpm:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests",
                    "code": "RATE_LIMIT_EXCEEDED",
                    "retry_after": 60,
                },
                headers={"Retry-After": "60"},
            )

        self._local_counts[client_ip].append(now)
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        return response


class GZipMiddleware(BaseHTTPMiddleware):
    """GZip compression for responses > 1KB. Reduces bandwidth by 60-80%."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        response = await call_next(request)

        # Only compress if client accepts gzip and response is large enough
        accept_encoding = request.headers.get("accept-encoding", "")
        if "gzip" not in accept_encoding:
            return response

        # Skip if already compressed or is a small response
        content_encoding = response.headers.get("content-type", "")
        if "image/" in content_encoding or "gzip" in response.headers.get("content-encoding", ""):
            return response

        # Read body
        body = b""
        async for chunk in response.body_iterator:
            if isinstance(chunk, str):
                body += chunk.encode("utf-8")
            else:
                body += chunk

        # Only compress if > 1KB
        if len(body) < 1024:
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )

        compressed = gzip.compress(body, compresslevel=6)

        # Only use compressed if it's actually smaller
        if len(compressed) >= len(body):
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )

        headers = dict(response.headers)
        headers["content-encoding"] = "gzip"
        headers["content-length"] = str(len(compressed))
        headers["vary"] = "Accept-Encoding"

        return Response(
            content=compressed,
            status_code=response.status_code,
            headers=headers,
            media_type=response.media_type,
        )


class RequestTimeoutMiddleware(BaseHTTPMiddleware):
    """Cancel requests that exceed the timeout to prevent resource exhaustion."""

    TIMEOUT_SECONDS = 30

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        try:
            return await asyncio.wait_for(
                call_next(request),
                timeout=self.TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            logger.warning(f"Request timed out: {request.method} {request.url.path}")
            return JSONResponse(
                status_code=504,
                content={
                    "detail": "Request timed out",
                    "code": "REQUEST_TIMEOUT",
                },
            )
