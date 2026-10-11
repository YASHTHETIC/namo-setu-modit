"""Tests for phone-OTP login/signup (service-level, fake Redis)."""
import asyncio
import hashlib

import pytest
from fastapi import HTTPException

from backend.app.services import otp_service as otp


class FakeRedis:
    def __init__(self):
        self.hashes: dict[str, dict[str, str]] = {}
        self.ttls: dict[str, int] = {}

    async def hset(self, key, mapping=None, **kwargs):
        data = dict(mapping or {})
        data.update(kwargs)
        self.hashes[key] = {k: str(v) for k, v in data.items()}
        return len(data)

    async def expire(self, key, seconds):
        self.ttls[key] = seconds
        return True

    async def hgetall(self, key):
        return dict(self.hashes.get(key, {}))

    async def hincrby(self, key, field, amount):
        current = int(self.hashes.get(key, {}).get(field, 0))
        self.hashes.setdefault(key, {})[field] = str(current + amount)
        return current + amount

    async def delete(self, key):
        return self.hashes.pop(key, None) is not None

    async def ttl(self, key):
        if key not in self.hashes:
            return -2
        return self.ttls.get(key, -1)


def test_normalize_phone():
    assert otp.normalize_phone("+91 98765 43210") == "9876543210"
    assert otp.normalize_phone("09876543210") == "9876543210"
    assert otp.normalize_phone("9876543210") == "9876543210"
    with pytest.raises(HTTPException):
        otp.normalize_phone("12345")
    with pytest.raises(HTTPException):
        otp.normalize_phone("5876543210")  # not a mobile series
    with pytest.raises(HTTPException):
        otp.normalize_phone(None)


def test_request_needs_delivery_channel():
    redis = FakeRedis()
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            otp.request_login_otp(redis, "9876543210", None, None, "MODIT", False)
        )
    assert exc.value.status_code == 503


def test_request_debug_mode_then_verify():
    redis = FakeRedis()
    assert asyncio.run(otp.request_login_otp(redis, "9876543210", None, None, "MODIT", True)) == 0
    # second request inside cooldown is rejected
    redis.ttls["otp:login:9876543210"] = 295
    with pytest.raises(HTTPException) as exc:
        asyncio.run(otp.request_login_otp(redis, "9876543210", None, None, "MODIT", True))
    assert exc.value.status_code == 429


def test_verify_ok_wrong_lockout():
    redis = FakeRedis()
    code = "123456"
    digest = hashlib.sha256(code.encode()).hexdigest()
    asyncio.run(redis.hset("otp:login:9876543210", mapping={"code_hash": digest, "attempts": 0}))
    asyncio.run(redis.expire("otp:login:9876543210", 300))

    assert asyncio.run(otp.verify_login_otp(redis, "9876543210", code)) is True
    # consumed — second use fails
    assert asyncio.run(otp.verify_login_otp(redis, "9876543210", code)) is False

    # wrong codes burn attempts, then lock
    asyncio.run(redis.hset("otp:login:9876543210", mapping={"code_hash": digest, "attempts": 0}))
    for _ in range(5):
        assert asyncio.run(otp.verify_login_otp(redis, "9876543210", "000000")) is False
    # locked: even the right code fails now
    assert asyncio.run(otp.verify_login_otp(redis, "9876543210", code)) is False
