from __future__ import annotations

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import get_settings
from backend.app.models.enums import MediaType, ProductCode
from backend.app.models.shared import MediaAsset
from backend.app.services.storage import storage_backend

ALLOWED_MEDIA_TYPES = {
    MediaType.IMAGE.value: {"image/jpeg", "image/png", "image/webp", "image/gif"},
    MediaType.DOCUMENT.value: {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    MediaType.VIDEO.value: {"video/mp4", "video/webm"},
    MediaType.AUDIO.value: {"audio/mpeg", "audio/wav", "audio/ogg"},
}


async def create_media_asset(
    session: AsyncSession,
    *,
    upload: UploadFile,
    product_code: ProductCode | str,
    owner_user_id: str | None,
    media_type: str,
) -> MediaAsset:
    allowed = ALLOWED_MEDIA_TYPES.get(media_type)
    if allowed is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported media type")
    if upload.content_type not in allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported content type")

    stored = await storage_backend.save(upload, prefix=media_type, allowed_prefixes={media_type})
    asset = MediaAsset(
        product_code=product_code.value if isinstance(product_code, ProductCode) else product_code,
        owner_user_id=owner_user_id,
        media_type=media_type,
        storage_key=stored.storage_key,
        url=stored.url,
        mime_type=stored.mime_type,
        file_size_bytes=stored.file_size_bytes,
        checksum_sha256=stored.checksum_sha256,
    )
    session.add(asset)
    await session.flush()
    return asset
