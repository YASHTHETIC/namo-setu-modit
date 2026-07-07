from __future__ import annotations

import base64
import hashlib
import hmac
import math
import secrets
import struct
import time
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.security import hash_password, verify_password

if TYPE_CHECKING:
    from backend.app.models.user import User


class TwoFactorService:
    TOTP_INTERVAL = 30
    TOTP_DIGITS = 6
    RECOVERY_CODE_COUNT = 8
    RECOVERY_CODE_LENGTH = 16

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ── Secret Generation ───────────────────────────────────────────────

    def generate_secret(self) -> tuple[str, str]:
        raw_bytes = secrets.token_bytes(20)
        secret_b32 = base64.b32encode(raw_bytes).decode("utf-8").rstrip("=")
        otpauth_url = (
            "otpauth://totp/Foundation:"
            f"{secret_b32}"
            "?secret="
            f"{secret_b32}"
            "&issuer=Foundation"
            f"&algorithm=SHA1"
            f"&digits={self.TOTP_DIGITS}"
            f"&period={self.TOTP_INTERVAL}"
        )
        return secret_b32, otpauth_url

    # ── Recovery Codes ──────────────────────────────────────────────────

    def generate_recovery_codes(self) -> list[str]:
        codes: list[str] = []
        for _ in range(self.RECOVERY_CODE_COUNT):
            code = secrets.token_urlsafe(self.RECOVERY_CODE_LENGTH)
            codes.append(code)
        return codes

    def _hash_recovery_code(self, code: str) -> str:
        return hash_password(code)

    # ── TOTP Implementation (RFC 6238) ─────────────────────────────────

    def _generate_totp(self, secret: str, time_counter: int) -> str:
        padded_secret = secret + "=" * ((8 - len(secret) % 8) % 8)
        key = base64.b32decode(padded_secret, casefold=True)
        counter_bytes = struct.pack(">Q", time_counter)
        hmac_digest = hmac.new(key, counter_bytes, hashlib.sha1).digest()

        offset = hmac_digest[-1] & 0x0F
        truncated = struct.unpack(">I", hmac_digest[offset : offset + 4])[0]
        truncated &= 0x7FFFFFFF
        otp_value = truncated % (10 ** self.TOTP_DIGITS)
        return str(otp_value).zfill(self.TOTP_DIGITS)

    def _get_current_time_counter(self) -> int:
        return math.floor(time.time() / self.TOTP_INTERVAL)

    def verify_totp(self, secret: str, code: str) -> bool:
        current_counter = self._get_current_time_counter()

        for offset in (-1, 0, 1):
            expected = self._generate_totp(secret, current_counter + offset)
            if hmac.compare_digest(expected, code):
                return True
        return False

    # ── 2FA Enable / Disable ────────────────────────────────────────────

    async def enable_2fa(self, user: "User", secret: str) -> list[str]:
        raw_codes = self.generate_recovery_codes()
        hashed_codes = [self._hash_recovery_code(code) for code in raw_codes]

        import json

        user.mfa_enabled = True
        user.mfa_secret_encrypted = secret
        user.mfa_recovery_codes_json = json.dumps(hashed_codes)
        await self.session.flush()
        return raw_codes

    async def disable_2fa(self, user: "User") -> bool:
        if not user.mfa_enabled:
            return False

        user.mfa_enabled = False
        user.mfa_secret_encrypted = None
        user.mfa_recovery_codes_json = None
        await self.session.flush()
        return True

    # ── 2FA Verification ────────────────────────────────────────────────

    async def verify_2fa(self, user: "User", code: str) -> bool:
        if not user.mfa_enabled or not user.mfa_secret_encrypted:
            return False

        totp_valid = self.verify_totp(user.mfa_secret_encrypted, code)
        if totp_valid:
            return True

        if user.mfa_recovery_codes_json:
            import json

            hashed_codes: list[str] = json.loads(user.mfa_recovery_codes_json)
            for idx, hashed in enumerate(hashed_codes):
                if verify_password(code, hashed):
                    hashed_codes.pop(idx)
                    user.mfa_recovery_codes_json = json.dumps(hashed_codes)
                    await self.session.flush()
                    return True

        return False
