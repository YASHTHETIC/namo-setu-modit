from __future__ import annotations

import base64
import hashlib
import html
import re
import secrets
import time

from backend.app.core.redis import (
    get_redis,
    note_redis_failure,
    note_redis_success,
    redis_circuit_open,
)

# In-process fallback stores, used only while the Redis circuit is open.
# Rate limits and CSRF must keep working (fail-open is not an option for
# brute-force protection) even with Redis down.
_mem_rate: dict[str, list[float]] = {}
_mem_csrf: dict[str, tuple[str, float]] = {}


class SecurityService:
    def __init__(self) -> None:
        pass

    async def _redis(self):
        return await get_redis()

    @staticmethod
    def _mem_incr(key: str, window_seconds: int) -> int:
        now = time.time()
        times = [t for t in _mem_rate.get(key, []) if now - t < window_seconds]
        times.append(now)
        _mem_rate[key] = times
        if len(_mem_rate) > 10_000:  # bound memory
            cutoff = now - window_seconds
            _mem_rate.clear()
        return len(times)

    async def check_rate_limit(self, key: str, max_requests: int, window_seconds: int) -> bool:
        if redis_circuit_open():
            return self._mem_incr(key, window_seconds) <= max_requests
        try:
            r = await self._redis()
            current = await r.incr(key)
            if current == 1:
                await r.expire(key, window_seconds)
            note_redis_success()
            return current <= max_requests
        except Exception as e:
            note_redis_failure(e)
            return self._mem_incr(key, window_seconds) <= max_requests

    async def increment_rate_limit(self, key: str, window_seconds: int) -> int:
        if redis_circuit_open():
            return self._mem_incr(key, window_seconds)
        try:
            r = await self._redis()
            current = await r.incr(key)
            if current == 1:
                await r.expire(key, window_seconds)
            note_redis_success()
            return current
        except Exception as e:
            note_redis_failure(e)
            return self._mem_incr(key, window_seconds)

    async def get_rate_limit_remaining(self, key: str, max_requests: int, window_seconds: int) -> int:
        if redis_circuit_open():
            used = len(_mem_rate.get(key, []))
            return max(0, max_requests - used)
        try:
            r = await self._redis()
            current = await r.get(key)
            note_redis_success()
            if current is None:
                return max_requests
            return max(0, max_requests - int(current))
        except Exception as e:
            note_redis_failure(e)
            used = len(_mem_rate.get(key, []))
            return max(0, max_requests - used)

    async def generate_csrf_token(self, session_id: str) -> str:
        token = secrets.token_urlsafe(32)
        if redis_circuit_open():
            _mem_csrf[session_id] = (token, time.time() + 3600)
            return token
        try:
            r = await self._redis()
            await r.setex(f"csrf:{session_id}", 3600, token)
            note_redis_success()
        except Exception as e:
            note_redis_failure(e)
            _mem_csrf[session_id] = (token, time.time() + 3600)
        return token

    async def validate_csrf_token(self, session_id: str, token: str) -> bool:
        if redis_circuit_open():
            stored, expires = _mem_csrf.get(session_id, ("", 0))
            return bool(stored) and time.time() < expires and secrets.compare_digest(stored, token)
        try:
            r = await self._redis()
            stored = await r.get(f"csrf:{session_id}")
            note_redis_success()
        except Exception as e:
            note_redis_failure(e)
            stored_t, expires = _mem_csrf.get(session_id, ("", 0))
            return bool(stored_t) and time.time() < expires and secrets.compare_digest(stored_t, token)
        if stored is None:
            return False
        return secrets.compare_digest(stored, token)

    def sanitize_input(self, text: str) -> str:
        text = html.unescape(text)
        text = re.sub(r"<[^>]+>", "", text)
        text = re.sub(r"[<>\"';&(){}]", "", text)
        text = text.strip()
        return text

    def validate_file_upload(self, filename: str, file_size: int, allowed_types: list[str] | None = None) -> bool:
        if file_size > 50 * 1024 * 1024:
            return False
        if not filename or len(filename) > 255:
            return False
        if allowed_types:
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
            if ext not in allowed_types:
                return False
        dangerous_extensions = {"exe", "bat", "cmd", "sh", "ps1", "vbs", "js", "msi", "com", "scr", "pif"}
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext in dangerous_extensions:
            return False
        return True

    def check_file_magic_bytes(self, data: bytes) -> str:
        if len(data) < 4:
            return "application/octet-stream"
        magic_map = {
            b"\x89PNG": "image/png",
            b"\xff\xd8\xff": "image/jpeg",
            b"GIF8": "image/gif",
            b"RIFF": "image/webp",
            b"%PDF": "application/pdf",
            b"PK\x03\x04": "application/zip",
            b"\x1f\x8b": "application/gzip",
            b"\x00\x00\x00": "video/mp4",
            b"OggS": "application/ogg",
            b"ID3": "audio/mpeg",
        }
        for magic, mime in magic_map.items():
            if data[:len(magic)] == magic:
                return mime
        return "application/octet-stream"

    def encrypt_sensitive_data(self, data: str, key: str) -> str:
        from cryptography.fernet import Fernet
        key_bytes = base64.urlsafe_b64encode(hashlib.sha256(key.encode()).digest()[:32])
        f = Fernet(key_bytes)
        encrypted = f.encrypt(data.encode())
        return encrypted.decode()

    def decrypt_sensitive_data(self, encrypted: str, key: str) -> str:
        from cryptography.fernet import Fernet
        key_bytes = base64.urlsafe_b64encode(hashlib.sha256(key.encode()).digest()[:32])
        f = Fernet(key_bytes)
        decrypted = f.decrypt(encrypted.encode())
        return decrypted.decode()
