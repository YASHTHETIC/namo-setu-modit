from typing import Callable, Awaitable
import asyncio
import time
import uuid

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)


class RequestTimingMiddleware(BaseHTTPMiddleware):
    """Single layer: request ID, response-time header, security headers.

    Replaces the former ValidationMiddleware + SecurityHeadersMiddleware pair
    (two BaseHTTPMiddleware layers doing one job).
    """

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = f"req_{uuid.uuid4().hex[:12]}"
        request.state.request_id = request_id
        start = time.monotonic()

        response = await call_next(request)

        elapsed = time.monotonic() - start
        response.headers["X-Response-Time"] = f"{elapsed:.3f}s"
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Sliding-window rate limiting per client IP (120 req/min default).

    Uses Redis when available (shared across workers). If Redis is down the
    middleware opens a circuit for 30s and counts in-process only, so an
    unavailable Redis never adds latency to requests.
    """

    _SKIP_PATHS = frozenset(("/healthz", "/api/v1/healthz", "/readyz", "/api/v1/readyz"))
    # Credential flows get their own tighter window so token spray attacks
    # are throttled independently of normal browsing traffic.
    _AUTH_PREFIX = "/api/v1/auth/"
    _AUTH_PATHS = frozenset(("/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"))

    def __init__(self, app, requests_per_minute: int = 120, burst: int = 30):
        super().__init__(app)
        self.rpm = requests_per_minute
        self.burst = burst
        self._local_counts: dict[str, list[float]] = {}
        self._last_cleanup = time.monotonic()

    async def _redis_count(self, key: str, now: float) -> int:
        from backend.app.core.redis import get_redis, note_redis_success

        redis = await get_redis()
        pipe = redis.pipeline()
        pipe.zremrangebyscore(key, 0, now - 60)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, 70)
        results = await pipe.execute()
        note_redis_success()
        return int(results[2])

    def _cleanup_local(self):
        now = time.monotonic()
        if now - self._last_cleanup < 60:
            return
        self._last_cleanup = now
        cutoff = now - 60
        for bucket in self._local_counts.values():
            bucket.update(
                {
                    ip: [t for t in times if t > cutoff]
                    for ip, times in list(bucket.items())
                    if any(t > cutoff for t in times)
                }
            )

    def _local_count(self, client_ip: str, now: float, bucket_key: str = "general") -> int:
        bucket = self._local_counts.setdefault(bucket_key, {})
        self._cleanup_local()
        times = [t for t in bucket.get(client_ip, []) if now - t < 60]
        times.append(now)
        bucket[client_ip] = times
        return len(times)

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        if request.url.path in self._SKIP_PATHS:
            return await call_next(request)

        from backend.app.core.redis import note_redis_failure, redis_circuit_open

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        count: int | None = None

        auth_path = (
            request.url.path.startswith(self._AUTH_PREFIX)
            and request.url.path.removeprefix(self._AUTH_PREFIX) in self._AUTH_PATHS
            and request.method == "POST"
        )
        window_key = f"rl:auth:{client_ip}" if auth_path else f"rl:{client_ip}"
        limit = 10 if auth_path else self.rpm

        # Circuit closed -> try Redis once; on failure the shared breaker
        # opens and every layer bypasses Redis for the cooldown.
        if not redis_circuit_open():
            try:
                count = await self._redis_count(window_key, now)
            except Exception as e:
                note_redis_failure(e)

        if count is None:
            count = (
                self._local_count(client_ip, now, bucket_key="auth")
                if auth_path
                else self._local_count(client_ip, now)
            )

        if count > limit:
            logger.warning(
                "Rate limit exceeded for %s: %s/%s (%s)",
                client_ip,
                count,
                limit,
                "auth" if auth_path else "general",
            )
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests",
                    "code": "RATE_LIMIT_EXCEEDED",
                    "retry_after": 60,
                },
                headers={"Retry-After": "60"},
            )

        return await call_next(request)


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
            logger.warning("Request timed out: %s %s", request.method, request.url.path)
            return JSONResponse(
                status_code=504,
                content={
                    "detail": "Request timed out",
                    "code": "REQUEST_TIMEOUT",
                },
            )
