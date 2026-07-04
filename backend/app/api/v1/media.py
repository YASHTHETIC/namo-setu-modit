from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, require_permission
from backend.app.core.database import get_db
from backend.app.core.rbac import PermissionName
from backend.app.models.enums import MediaType, ProductCode
from backend.app.models.shared import MediaAsset
from backend.app.models.user import User
from backend.app.schemas.platform import MediaRead, StandardResponse
from backend.app.services.audit_service import create_audit_log
from backend.app.services.media_service import create_media_asset

router = APIRouter()


@router.post("/media/upload", response_model=MediaRead, status_code=status.HTTP_201_CREATED)
async def upload_media(
    media_type: str,
    upload: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MediaRead:
    asset = await create_media_asset(db, upload=upload, product_code=ProductCode.MODIT, owner_user_id=user.id, media_type=media_type)
    await create_audit_log(db, product_code=ProductCode.MODIT, actor_user_id=user.id, action="media.upload", entity_type="media", entity_id=asset.id)
    await db.commit()
    await db.refresh(asset)
    return MediaRead.model_validate(asset)


@router.post("/media/avatar", response_model=MediaRead, status_code=status.HTTP_201_CREATED)
async def upload_avatar(
    upload: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MediaRead:
    asset = await create_media_asset(db, upload=upload, product_code=ProductCode.MODIT, owner_user_id=user.id, media_type=MediaType.IMAGE.value)
    await db.commit()
    await db.refresh(asset)
    return MediaRead.model_validate(asset)


@router.post("/media/documents", response_model=MediaRead, status_code=status.HTTP_201_CREATED)
async def upload_document(
    upload: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MediaRead:
    asset = await create_media_asset(db, upload=upload, product_code=ProductCode.MODIT, owner_user_id=user.id, media_type=MediaType.DOCUMENT.value)
    await db.commit()
    await db.refresh(asset)
    return MediaRead.model_validate(asset)


@router.get("/media", response_model=list[MediaRead], dependencies=[Depends(require_permission(PermissionName.FILE_UPLOAD))])
async def list_media(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> list[MediaRead]:
    result = await db.execute(select(MediaAsset).where(MediaAsset.owner_user_id == user.id).order_by(MediaAsset.created_at.desc()))
    return [MediaRead.model_validate(item) for item in result.scalars().all()]


@router.get("/media/{media_id}", response_model=MediaRead)
async def read_media(media_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> MediaRead:
    media = await db.get(MediaAsset, media_id)
    if media is None or media.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    return MediaRead.model_validate(media)


@router.delete("/media/{media_id}", response_model=StandardResponse[str])
async def delete_media(media_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> StandardResponse[str]:
    media = await db.get(MediaAsset, media_id)
    if media is None or media.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    await db.delete(media)
    await db.commit()
    return StandardResponse(message="Media deleted", data=media_id)
