from functools import lru_cache
import logging
import time

import redis.asyncio as redis

from backend.app.core.config import get_settings

logger = logging.getLogger(__name__)

# ── Circuit breaker ──────────────────────────────────────────────────────────
# When any Redis operation fails, the circuit opens for 30s and all callers
# bypass Redis entirely (no connect attempts, no latency). After the cooldown
# one caller probes again; success closes the circuit.
_CIRCUIT_SECONDS = 30.0
_circuit_open_until = 0.0


def redis_circuit_open() -> bool:
    return time.monotonic() < _circuit_open_until


def note_redis_failure(err: Exception) -> None:
    global _circuit_open_until
    now = time.monotonic()
    if now >= _circuit_open_until:
        _circuit_open_until = now + _CIRCUIT_SECONDS
        logger.warning(
            "Redis unavailable — bypassing for %ds (using fallbacks): %s",
            int(_CIRCUIT_SECONDS), err,
        )


def note_redis_success() -> None:
    global _circuit_open_until
    _circuit_open_until = 0.0


@lru_cache(maxsize=1)
def get_redis_client() -> redis.Redis:
    settings = get_settings()
    return redis.from_url(
        settings.redis_url,
        decode_responses=True,
        # Fast-fail: if Redis is down, every request must not stall.
        # localhost/LAN RTT is <5ms; 1s covers remote TLS (rediss) handshakes.
        socket_connect_timeout=1.0,
        socket_timeout=1.0,
        retry_on_timeout=False,
        health_check_interval=30,
    )


async def get_redis() -> redis.Redis:
    return get_redis_client()
