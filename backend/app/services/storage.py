from __future__ import annotations

import hashlib
import os
import shutil
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from fastapi import HTTPException, UploadFile, status

from backend.app.core.config import get_settings


@dataclass(slots=True)
class StoredFile:
    storage_key: str
    url: str
    mime_type: str
    file_size_bytes: int
    checksum_sha256: str
    original_filename: str | None


class StorageBackend(Protocol):
    async def save(self, upload: UploadFile, *, prefix: str, allowed_prefixes: set[str] | None = None) -> StoredFile:
        ...

    async def delete(self, storage_key: str) -> None:
        ...


class LocalStorageBackend:
    def __init__(self, root: str | None = None) -> None:
        settings = get_settings()
        self.root = Path(root or settings.storage_root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    async def save(self, upload: UploadFile, *, prefix: str, allowed_prefixes: set[str] | None = None) -> StoredFile:
        if allowed_prefixes is not None and prefix not in allowed_prefixes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid upload category")
        if not upload.filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is required")
        if os.path.sep in upload.filename or (os.path.altsep and os.path.altsep in upload.filename):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename")

        raw = await upload.read()
        if not raw:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file upload")

        checksum = hashlib.sha256(raw).hexdigest()
        extension = Path(upload.filename).suffix.lower()
        storage_dir = self.root / prefix
        storage_dir.mkdir(parents=True, exist_ok=True)
        storage_key = f"{prefix}/{uuid.uuid4().hex}{extension}"
        file_path = self.root / storage_key
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(raw)
        content_type = upload.content_type or "application/octet-stream"
        return StoredFile(
            storage_key=storage_key,
            url=f"/{storage_key}",
            mime_type=content_type,
            file_size_bytes=len(raw),
            checksum_sha256=checksum,
            original_filename=upload.filename,
        )

    async def delete(self, storage_key: str) -> None:
        file_path = self.root / storage_key
        if file_path.exists():
            file_path.unlink()


storage_backend = LocalStorageBackend()
