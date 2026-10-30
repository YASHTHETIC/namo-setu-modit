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
    # are throttled independently of normal browsing traffic. Values are
    # route paths under the API prefix (see bucket_for).
    _AUTH_PATHS = frozenset(
        (
            "/auth/login",
            "/auth/register",
            "/auth/forgot-password",
            "/auth/reset-password",
            "/auth/otp/request",
            "/auth/otp/verify",
        )
    )
    # The thousands-at-once crowd: on Indian mobile networks thousands of
    # distinct shoppers legitimately share a handful of CGNAT IPs, so the
    # cheap, cached browsing endpoints (list/detail/category/brand GETs)
    # get a much larger single-IP window than writes/auth/admin.
    _BROWSE_PATHS = frozenset(
        (
            "/modit/products",
            "/modit/categories",
            "/modit/brands",
        )
    )

    def __init__(self, app, requests_per_minute: int = 300, burst: int = 100, browse_rpm: int = 1200):
        super().__init__(app)
        # 300 req/min/IP ≈ a fast human clicking/scrolling plus chart-bursts,
        # yet renders a single-IP script useless. 120/min false-throttled
        # shared office/CGNAT IPs during a real sales rush.
        self.rpm = requests_per_minute
        self.browse_rpm = browse_rpm
        try:
            from backend.app.core.config import get_settings

            self._api_v1 = get_settings().api_v1_prefix
        except Exception:
            self._api_v1 = "/api/v1"
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

    def bucket_for(self, method: str, path: str) -> tuple[str, str, int]:
        """(bucket name, fully-qualified window key base, per-minute limit).

        Pure — unit tested. The caller appends the client IP.
        """
        # Exact full-path matching against the configured API prefix: the
        # old startswith/removeprefix pair silently never matched (prefix
        # included /auth, suffixes did not), so credential endpoints were
        # limited by the wide general window instead of the tight one.
        if method == "POST" and path in {f"{self._api_v1}{p}" for p in self._AUTH_PATHS}:
            return "auth", f"auth:{path}", 10
        # Browse bucket: GET-only, read-only catalog endpoints (no writes,
        # no admin) — cheap to serve, cacheable, and the surface a shared
        # CGNAT IP can flood without any abuse.
        is_browse = method == "GET" and any(
            path == f"{self._api_v1}{p}" or path.startswith(f"{self._api_v1}{p}/")
            for p in self._BROWSE_PATHS
        )
        if is_browse:
            return "browse", "browse:", self.browse_rpm
        return "general", "", self.rpm

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

        bucket, _, limit = self.bucket_for(request.method, request.url.path)
        window_key = f"rl:{bucket}:{client_ip}" if bucket != "general" else f"rl:{client_ip}"

        # Circuit closed -> try Redis once; on failure the shared breaker
        # opens and every layer bypasses Redis for the cooldown.
        if not redis_circuit_open():
            try:
                count = await self._redis_count(window_key, now)
            except Exception as e:
                note_redis_failure(e)

        if count is None:
            count = self._local_count(client_ip, now, bucket_key=bucket)

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
