"""Phone-OTP login/signup: Blinkit-style mobile-only auth.

Codes live in Redis (5-min TTL, 5 attempts, 30s resend cooldown) — no DB
migration needed. SMS delivery goes through a generic gateway when
SMS_GATEWAY_URL is configured; otherwise codes only reach server logs
(OTP_DEBUG_TO_LOGS, internal testing) and are NEVER returned to clients.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import re
import secrets

import httpx
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

OTP_TTL_SECONDS = 300
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 30

_INDIA_MOBILE = re.compile(r"^[6-9]\d{9}$")


def normalize_phone(raw: str | None) -> str:
    """+91 98765 43210 -> 9876543210. Raises 422 on anything invalid."""
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    if digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]
    if not _INDIA_MOBILE.match(digits):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Enter a valid 10-digit Indian mobile number.",
        )
    return digits


def _key(phone: str) -> str:
    return f"otp:login:{phone}"


async def request_login_otp(redis, phone: str, gateway_url: str | None, api_key: str | None, sender: str, debug_to_logs: bool) -> int:
    """Create + store a code, deliver via SMS gateway. Returns retry_after=0.

    Raises 429 while in cooldown, 503 when no delivery channel exists.
    """
    now_ttl = await redis.ttl(_key(phone))
    if now_ttl is not None and now_ttl > OTP_TTL_SECONDS - OTP_RESEND_COOLDOWN_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"OTP already sent. Retry in {now_ttl - (OTP_TTL_SECONDS - OTP_RESEND_COOLDOWN_SECONDS)}s.",
        )
    code = f"{secrets.randbelow(900000) + 100000:06d}"
    digest = hashlib.sha256(code.encode()).hexdigest()
    await redis.hset(_key(phone), mapping={"code_hash": digest, "attempts": 0})
    await redis.expire(_key(phone), OTP_TTL_SECONDS)

    if gateway_url:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    gateway_url,
                    json={"phone": phone, "code": code, "sender": sender, "message": f"{sender}: your login code is {code}. Valid 5 minutes."},
                    headers={"Authorization": f"Bearer {api_key}"} if api_key else {},
                )
            if resp.status_code >= 400:
                logger.warning("SMS gateway rejected OTP for %s...%s: %s", phone[:2], phone[-2:], resp.status_code)
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="SMS service failed. Please try again in a minute.",
                )
        except HTTPException:
            raise
        except Exception as exc:
            logger.warning("SMS gateway error: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="SMS service unreachable. Please try again in a minute.",
            )
        return 0

    if debug_to_logs:
        logger.info("OTP for +91 %s...%s: %s (testing only)", phone[:2], phone[-2:], code)
        return 0
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="SMS login is not enabled yet. Please use email login.",
    )


async def verify_login_otp(redis, phone: str, code: str) -> bool:
    """True + consumes the code on match. False on missing/expired/wrong/locked."""
    entry = await redis.hgetall(_key(phone))
    if not entry:
        return False
    try:
        attempts = int(entry.get("attempts", 0))
    except (TypeError, ValueError):
        attempts = 0
    if attempts >= OTP_MAX_ATTEMPTS:
        await redis.delete(_key(phone))
        return False
    ok = hmac.compare_digest(
        str(entry.get("code_hash", "")), hashlib.sha256(code.strip().encode()).hexdigest()
    )
    if not ok:
        await redis.hincrby(_key(phone), "attempts", 1)
        return False
    await redis.delete(_key(phone))
    return True
