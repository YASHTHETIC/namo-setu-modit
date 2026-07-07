from __future__ import annotations

import base64
import hashlib
import html
import re
import secrets
import time

from backend.app.core.redis import get_redis


class SecurityService:
    def __init__(self) -> None:
        pass

    async def _redis(self):
        return await get_redis()

    async def check_rate_limit(self, key: str, max_requests: int, window_seconds: int) -> bool:
        r = await self._redis()
        current = await r.incr(key)
        if current == 1:
            await r.expire(key, window_seconds)
        return current <= max_requests

    async def increment_rate_limit(self, key: str, window_seconds: int) -> int:
        r = await self._redis()
        current = await r.incr(key)
        if current == 1:
            await r.expire(key, window_seconds)
        return current

    async def get_rate_limit_remaining(self, key: str, max_requests: int, window_seconds: int) -> int:
        r = await self._redis()
        current = await r.get(key)
        if current is None:
            return max_requests
        remaining = max_requests - int(current)
        return max(0, remaining)

    async def generate_csrf_token(self, session_id: str) -> str:
        r = await self._redis()
        token = secrets.token_urlsafe(32)
        await r.setex(f"csrf:{session_id}", 3600, token)
        return token

    async def validate_csrf_token(self, session_id: str, token: str) -> bool:
        r = await self._redis()
        stored = await r.get(f"csrf:{session_id}")
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
