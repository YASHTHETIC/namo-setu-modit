from __future__ import annotations

import functools
import hashlib
import json
from typing import Any, Callable, TypeVar

from backend.app.core.redis import get_redis

F = TypeVar("F", bound=Callable[..., Any])


class CacheService:
    """Redis-backed caching service with JSON serialization and pattern invalidation."""

    _DEFAULT_PREFIX = "cache"

    @staticmethod
    def _make_key(key: str) -> str:
        if ":" not in key:
            return f"{CacheService._DEFAULT_PREFIX}:{key}"
        return key

    @staticmethod
    def _hash_value(value: Any) -> str:
        raw = json.dumps(value, sort_keys=True, default=str)
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    async def get(self, key: str) -> Any | None:
        redis = await get_redis()
        raw = await redis.get(self._make_key(key))
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return raw

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        redis = await get_redis()
        serialized = json.dumps(value, default=str)
        return await redis.setex(self._make_key(key), ttl_seconds, serialized)

    async def delete(self, key: str) -> bool:
        redis = await get_redis()
        return bool(await redis.delete(self._make_key(key)))

    async def exists(self, key: str) -> bool:
        redis = await get_redis()
        return bool(await redis.exists(self._make_key(key)))

    async def get_or_set(self, key: str, factory_fn: Callable[..., Any], ttl_seconds: int = 300) -> Any:
        cached = await self.get(key)
        if cached is not None:
            return cached

        if callable(factory_fn):
            result = await factory_fn() if functools.iscoroutinefunction(factory_fn) else factory_fn()
        else:
            result = factory_fn

        await self.set(key, result, ttl_seconds)
        return result

    async def invalidate_pattern(self, pattern: str) -> int:
        redis = await get_redis()
        full_pattern = self._make_key(pattern)
        cursor = 0
        deleted = 0
        while True:
            cursor, keys = await redis.scan(cursor=cursor, match=full_pattern, count=200)
            if keys:
                deleted += await redis.delete(*keys)
            if cursor == 0:
                break
        return deleted

    async def get_many(self, keys: list[str]) -> dict[str, Any]:
        redis = await get_redis()
        full_keys = [self._make_key(k) for k in keys]
        values = await redis.mget(full_keys)
        result: dict[str, Any] = {}
        for key, raw in zip(keys, values):
            if raw is not None:
                try:
                    result[key] = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    result[key] = raw
        return result

    async def set_many(self, mapping: dict[str, Any], ttl_seconds: int = 300) -> bool:
        redis = await get_redis()
        pipe = redis.pipeline()
        for key, value in mapping.items():
            serialized = json.dumps(value, default=str)
            pipe.setex(self._make_key(key), ttl_seconds, serialized)
        results = await pipe.execute()
        return all(results)


cache = CacheService()


def cached(ttl: int = 300, key_prefix: str = "") -> Callable[[F], F]:
    """Decorator that caches a function's return value in Redis.

    For sync functions the result is cached on first call.
    For async functions the same applies.
    """

    def decorator(fn: F) -> F:
        @functools.wraps(fn)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            cache_key = _build_key(fn, key_prefix, args, kwargs)
            cached_value = await cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            result = await fn(*args, **kwargs)
            await cache.set(cache_key, result, ttl_seconds=ttl)
            return result

        @functools.wraps(fn)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            return fn(*args, **kwargs)

        if _is_async(fn):
            return async_wrapper  # type: ignore[return-value]
        return sync_wrapper  # type: ignore[return-value]

    return decorator


def cache_invalidate(pattern: str) -> Callable[[F], F]:
    """Decorator that invalidates cache keys matching *pattern* after a mutation."""

    def decorator(fn: F) -> F:
        @functools.wraps(fn)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            result = await fn(*args, **kwargs)
            await cache.invalidate_pattern(pattern)
            return result

        @functools.wraps(fn)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            return fn(*args, **kwargs)

        if _is_async(fn):
            return async_wrapper  # type: ignore[return-value]
        return sync_wrapper  # type: ignore[return-value]

    return decorator


def _is_async(fn: Callable[..., Any]) -> bool:
    import asyncio
    return asyncio.iscoroutinefunction(fn)


def _build_key(fn: Callable[..., Any], prefix: str, args: tuple, kwargs: dict) -> str:
    parts = [prefix or fn.__module__, fn.__qualname__]
    for a in args:
        parts.append(str(a))
    for k, v in sorted(kwargs.items()):
        parts.append(f"{k}={v}")
    raw = ":".join(parts)
    if len(raw) > 200:
        digest = hashlib.sha256(raw.encode()).hexdigest()[:24]
        raw = digest
    return raw


# ── Well-known cache key templates ────────────────────────────────────────────

class CacheKeys:
    TEMPLE_DETAIL = "temple:{id}"
    TEMPLE_LIST = "temples:list:{page}:{filters}"
    PRODUCT_DETAIL = "product:{id}"
    PRODUCT_LIST = "products:list:{page}:{filters}"
    ANALYTICS = "analytics:{product_code}:{period}"
    USER_PROFILE = "user:{id}:profile"
    AI_HISTORY = "ai:session:{id}:history"
    SEARCH_POPULAR = "search:popular:{product_code}"

    @staticmethod
    def temple_detail(temple_id: str) -> str:
        return f"temple:{temple_id}"

    @staticmethod
    def temple_list(page: int, filters: str = "") -> str:
        return f"temples:list:{page}:{filters}"

    @staticmethod
    def product_detail(product_id: str) -> str:
        return f"product:{product_id}"

    @staticmethod
    def product_list(page: int, filters: str = "") -> str:
        return f"products:list:{page}:{filters}"

    @staticmethod
    def analytics(product_code: str, period: str = "daily") -> str:
        return f"analytics:{product_code}:{period}"

    @staticmethod
    def user_profile(user_id: str) -> str:
        return f"user:{user_id}:profile"

    @staticmethod
    def ai_history(session_id: str) -> str:
        return f"ai:session:{session_id}:history"
