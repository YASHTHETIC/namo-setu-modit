from functools import lru_cache

import redis.asyncio as redis

from backend.app.core.config import get_settings


@lru_cache(maxsize=1)
def get_redis_client() -> redis.Redis:
    settings = get_settings()
    return redis.from_url(
        settings.redis_url,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
        retry_on_timeout=True,
    )


async def get_redis() -> redis.Redis:
    return get_redis_client()
