"""Local E2E test stack for MODIT (no Docker/Postgres/Redis needed).

Runs the real FastAPI app with:
- SQLite (aiosqlite) instead of Postgres — real persistence, real commits,
  real constraint enforcement (idempotency, unique indexes)
- an in-memory Redis shim (same surface the code uses) so OTP/rate-limit/
  cache paths behave like production without a Redis server

Seeds the full catalog from apps/modit/web/lib/product-data.ts and creates:
- admin@modit.in / Demo@1234   (super_admin — admin panel testing)
- demo@modit.in  / Demo@1234   (buyer)

Usage:
  python scripts/local-e2e-server.py            # serve on 127.0.0.1:8000
  python scripts/local-e2e-server.py --reset    # wipe + recreate DB first
  python scripts/local-e2e-server.py --seed-only # (re)seed and exit

Dev frontend: run `MODIT_API_ORIGIN=http://127.0.0.1:8000 npm run dev --workspace=@modit/web`
(next.config rewrites /api/* -> this server; OTP codes print to this console).
"""

from __future__ import annotations

import argparse
import os
import sys
import time
import uuid
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
DB_DIR = REPO / ".local-test"
DB_PATH = DB_DIR / "modit.db"


def _setup_env() -> None:
    DB_DIR.mkdir(exist_ok=True)
    os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH.as_posix()}")
    os.environ.setdefault("JWT_SECRET_KEY", "local-e2e-secret-" + "x" * 40)
    os.environ.setdefault("ENVIRONMENT", "development")
    os.environ.setdefault("OTP_DEBUG_TO_LOGS", "true")
    os.environ.setdefault("LOG_LEVEL", "INFO")
    os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")  # unreachable; shim used anyway
    os.environ.setdefault("SMS_GATEWAY_URL", "")  # OTP prints to logs
    os.environ.setdefault(
        "BACKEND_CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://modit.in,https://api.modit.in",
    )
    os.environ.setdefault("LOG_FILE", str(DB_DIR / "server.log"))
    sys.path.insert(0, str(REPO))


class InMemoryRedis:
    """Subset of redis.asyncio used by the backend (grep-verified surface:
    ping/get/set/setex/mget/incr/exists/expire/ttl/delete/scan/hset/hgetall/
    hincrby + pipeline sorted-set ops for the rate limiter)."""

    def __init__(self) -> None:
        self._kv: dict[str, str] = {}
        self._hash: dict[str, dict[str, str]] = {}
        self._z: dict[str, dict[str, float]] = {}
        self._ttl: dict[str, float] = {}
        self._counters: dict[str, int] = {}

    async def ping(self):
        return True

    async def aclose(self):
        return None

    async def get(self, key):
        return self._kv.get(key)

    async def set(self, key, value, **kwargs):
        self._kv[key] = str(value)
        if "ex" in kwargs and kwargs["ex"]:
            self._ttl[key] = time.time() + float(kwargs["ex"])
        return True

    async def setex(self, key, ttl_seconds, value):
        self._kv[key] = str(value)
        self._ttl[key] = time.time() + float(ttl_seconds)
        return True

    async def mget(self, keys):
        return [self._kv.get(k) for k in keys]

    async def incr(self, key):
        self._counters[key] = self._counters.get(key, 0) + 1
        return self._counters[key]

    async def exists(self, *keys):
        return sum(1 for k in keys if k in self._kv or k in self._hash or k in self._z)

    async def expire(self, key, seconds):
        self._ttl[key] = time.time() + float(seconds)
        return True

    async def ttl(self, key):
        deadline = self._ttl.get(key)
        if deadline is None:
            return -2
        left = int(deadline - time.time())
        return left if left > 0 else -2

    async def delete(self, *keys):
        n = 0
        for k in keys:
            if self._kv.pop(k, None) is not None or self._hash.pop(k, None) is not None:
                n += 1
        return n

    async def scan(self, cursor=0, match=None, count=200):
        import fnmatch

        keys = [k for k in self._kv if (match is None or fnmatch.fnmatch(k, match))]
        return (0, keys[:count])

    # --- hashes (OTP store) ---
    async def hset(self, key, mapping=None, **kwargs):
        data = dict(mapping or {})
        data.update({k: str(v) for k, v in kwargs.items()})
        self._hash.setdefault(key, {}).update(data)
        return len(data)

    async def hgetall(self, key):
        return dict(self._hash.get(key, {}))

    async def hincrby(self, key, field, amount=1):
        cur = int(self._hash.get(key, {}).get(field, 0))
        self._hash.setdefault(key, {})[field] = str(cur + amount)
        return cur + amount

    # --- sorted sets (rate limiter) ---
    def pipeline(self):
        return _Pipeline(self)

    async def zadd(self, key, mapping):
        z = self._z.setdefault(key, {})
        for member, score in mapping.items():
            z[member] = float(score)
        return len(mapping)


class _Pipeline:
    def __init__(self, redis: InMemoryRedis):
        self._r = redis
        self._ops: list[tuple] = []

    def zremrangebyscore(self, key, lo, hi):
        self._ops.append(("zrem", key, lo, hi))
        return self

    def zadd(self, key, mapping):
        self._ops.append(("zadd", key, mapping))
        return self

    def zcard(self, key):
        self._ops.append(("zcard", key))
        return self

    def expire(self, key, seconds):
        self._ops.append(("expire", key, seconds))
        return self

    async def execute(self):
        out = []
        for op in self._ops:
            kind = op[0]
            key = op[1]
            if kind == "zrem":
                z = self._r._z.setdefault(key, {})
                lo, hi = op[2], op[3]
                for m, s in list(z.items()):
                    if lo <= s <= hi:
                        z.pop(m)
                out.append(0)
            elif kind == "zadd":
                out.append(await self._r.zadd(key, op[2]))
            elif kind == "zcard":
                out.append(len(self._r._z.get(key, {})))
            elif kind == "expire":
                out.append(await self._r.expire(key, op[2]))
        self._ops.clear()
        return out


def _patch_redis() -> None:
    import backend.app.core.redis as redis_mod

    shim = InMemoryRedis()

    def _fake_client():
        return shim

    redis_mod.get_redis_client = _fake_client  # middleware direct calls
    redis_mod.get_redis = _fake_client  # FastAPI dependency


async def _prepare_db() -> None:
    from sqlalchemy import select
    from backend.app.core.database import Base, AsyncSessionLocal, engine
    from backend.app.core.security import hash_password
    from backend.app.models.user import User, Role, user_roles
    from backend.app.models.shared import UserProfile

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for name, desc in (("super_admin", "Full platform control"), ("user", "Buyer account")):
            if (await session.execute(select(Role).where(Role.name == name))).scalars().first() is None:
                session.add(Role(name=name, description=desc))
        await session.commit()

        admin_role = (await session.execute(select(Role).where(Role.name == "super_admin"))).scalars().first()
        buyer_role = (await session.execute(select(Role).where(Role.name == "user"))).scalars().first()
        for email, name, phone, role in (
            ("admin@modit.in", "Admin", "+919999900001", admin_role),
            ("demo@modit.in", "Demo Buyer", "+919999900002", buyer_role),
        ):
            user = (await session.execute(select(User).where(User.email == email))).scalars().first()
            if user is not None:
                continue
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                full_name=name,
                hashed_password=hash_password("Demo@1234"),
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            await session.flush()
            session.add(UserProfile(id=str(uuid.uuid4()), user_id=user.id, phone_number=phone))
            await session.execute(user_roles.insert().values(user_id=user.id, role_id=role.id))
            await session.commit()
    print("[stack] admin + demo users ready")


async def _seed_catalog() -> None:
    from backend.app.seeders.catalog import main as seed_main

    await seed_main()


async def main_async(reset: bool, seed_only: bool) -> None:
    if reset and DB_PATH.exists():
        DB_PATH.unlink()
    await _prepare_db()
    await _seed_catalog()
    if seed_only:
        return

    import uvicorn

    from backend.app.main import app

    config = uvicorn.Config(app, host="127.0.0.1", port=8000, log_level="info", workers=1)
    await uvicorn.Server(config).serve()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--seed-only", action="store_true")
    args = parser.parse_args()
    _setup_env()
    _patch_redis()
    import asyncio

    asyncio.run(main_async(args.reset, args.seed_only))
