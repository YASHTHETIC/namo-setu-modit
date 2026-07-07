from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, require_permission
from backend.app.core.database import get_db
from backend.app.core.rbac import PermissionName
from backend.app.models.enums import DocumentType, MediaType, ProductCode
from backend.app.models.shared import DocumentAsset, MediaAsset
from backend.app.models.user import User
from backend.app.schemas.media import (
    BatchUploadRequest,
    BatchUploadResponse,
    DocumentAssetFilter,
    DocumentListResponse,
    DocumentRead,
    DocumentUploadRequest,
    DocumentUploadResponse,
    ImageTransformation,
    MediaAssetFilter,
    MediaAssetRead,
    MediaListResponse,
    MediaUploadResponse,
    UrlUploadRequest,
)
from backend.app.schemas.platform import MediaRead, StandardResponse
from backend.app.services.audit_service import create_audit_log
from backend.app.services.cloudinary_service import cloudinary_service
from backend.app.services.media_service import create_media_asset

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"}
ALLOWED_DOC_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
}


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
    if media.storage_key:
        await cloudinary_service.delete_asset(media.storage_key)
    await db.delete(media)
    await db.commit()
    return StandardResponse(message="Media deleted", data=media_id)


@router.post("/media/upload-image", response_model=MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image_cloudinary(
    folder: str = Query(..., min_length=1, max_length=200),
    product_code: str = Query(default="modit", min_length=1, max_length=20),
    tags: str | None = Query(default=None),
    transformation: str | None = Query(default=None),
    upload: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MediaUploadResponse:
    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type: {upload.content_type}. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}",
        )

    tag_list = [t.strip() for t in tags.split(",")] if tags else None
    transform = None
    if transformation:
        parts = {}
        for kv in transformation.split(","):
            if "_" in kv:
                k, v = kv.split("_", 1)
                if k == "w":
                    parts["width"] = int(v)
                elif k == "h":
                    parts["height"] = int(v)
                elif k == "c":
                    parts["crop"] = v
                elif k == "q":
                    parts["quality"] = int(v)
                elif k == "f":
                    parts["format"] = v
        transform = ImageTransformation(**parts) if parts else None

    asset = await cloudinary_service.upload_image_to_db(
        db,
        upload=upload,
        folder=folder,
        product_code=product_code,
        owner_user_id=user.id,
        media_type=MediaType.IMAGE.value,
        transformation=transform,
        tags=tag_list,
    )
    await create_audit_log(
        db,
        product_code=product_code,
        actor_user_id=user.id,
        action="media.upload_image",
        entity_type="media",
        entity_id=asset.id,
    )
    await db.commit()
    await db.refresh(asset)

    thumbnail_url = None
    if asset.storage_key:
        thumbnail_url = cloudinary_service.generate_thumbnail_url(
            asset.storage_key, width=200, height=200, crop="fill"
        )

    return MediaUploadResponse(
        id=asset.id,
        url=asset.url,
        thumbnail_url=thumbnail_url,
        mime_type=asset.mime_type,
        file_size=asset.file_size_bytes,
        width=asset.width,
        height=asset.height,
    )


@router.post("/media/upload-document", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document_cloudinary(
    folder: str = Query(..., min_length=1, max_length=200),
    product_code: str = Query(default="modit", min_length=1, max_length=20),
    document_type: str = Query(default="other", min_length=1, max_length=30),
    title: str = Query(default="Uploaded Document", min_length=1, max_length=255),
    description: str | None = Query(default=None),
    upload: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DocumentUploadResponse:
    if upload.content_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported document type: {upload.content_type}",
        )

    doc = await cloudinary_service.upload_document_to_db(
        db,
        upload=upload,
        folder=folder,
        product_code=product_code,
        owner_user_id=user.id,
        document_type=document_type,
        title=title,
        description=description,
    )
    await create_audit_log(
        db,
        product_code=product_code,
        actor_user_id=user.id,
        action="media.upload_document",
        entity_type="document",
        entity_id=doc.id,
    )
    await db.commit()
    await db.refresh(doc)

    media_url = ""
    if doc.media_id:
        media_asset = await db.get(MediaAsset, doc.media_id)
        if media_asset:
            media_url = media_asset.url

    return DocumentUploadResponse(
        id=doc.id,
        url=media_url,
        document_type=doc.document_type,
        title=doc.title,
        media_id=doc.media_id,
    )


@router.post("/media/upload-url", response_model=MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_from_url(
    body: UrlUploadRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MediaUploadResponse:
    result = await cloudinary_service.upload_from_url(
        body.url,
        folder=body.folder,
        transformation=body.transformation,
        tags=body.tags,
    )

    pc = body.product_code
    asset = MediaAsset(
        product_code=pc,
        owner_user_id=user.id,
        media_type=body.file_type,
        storage_key=result.public_id,
        url=result.secure_url or result.url,
        mime_type=f"{body.file_type}/{result.format}" if result.format else "application/octet-stream",
        file_size_bytes=result.bytes,
        width=result.width,
        height=result.height,
    )
    db.add(asset)
    await create_audit_log(
        db,
        product_code=pc,
        actor_user_id=user.id,
        action="media.upload_url",
        entity_type="media",
        entity_id=asset.id,
    )
    await db.commit()
    await db.refresh(asset)

    thumbnail_url = cloudinary_service.generate_thumbnail_url(
        result.public_id, width=200, height=200, crop="fill"
    ) if result.resource_type == "image" else None

    return MediaUploadResponse(
        id=asset.id,
        url=asset.url,
        thumbnail_url=thumbnail_url,
        mime_type=asset.mime_type,
        file_size=asset.file_size_bytes,
        width=asset.width,
        height=asset.height,
    )


@router.get("/media/assets", response_model=MediaListResponse)
async def list_media_assets(
    product_code: str | None = Query(default=None),
    media_type: str | None = Query(default=None),
    mime_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MediaListResponse:
    query = select(MediaAsset).where(MediaAsset.owner_user_id == user.id)
    count_query = select(func.count()).select_from(MediaAsset).where(MediaAsset.owner_user_id == user.id)

    if product_code:
        query = query.where(MediaAsset.product_code == product_code)
        count_query = count_query.where(MediaAsset.product_code == product_code)
    if media_type:
        query = query.where(MediaAsset.media_type == media_type)
        count_query = count_query.where(MediaAsset.media_type == media_type)
    if mime_type:
        query = query.where(MediaAsset.mime_type == mime_type)
        count_query = count_query.where(MediaAsset.mime_type == mime_type)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(MediaAsset.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    assets = result.scalars().all()

    return MediaListResponse(
        assets=[MediaAssetRead.model_validate(a) for a in assets],
        total=total,
    )


@router.delete("/media/{media_id}/cloudinary", response_model=StandardResponse[str])
async def delete_media_cloudinary(
    media_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StandardResponse[str]:
    media = await db.get(MediaAsset, media_id)
    if media is None or media.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")
    if media.storage_key:
        deleted = await cloudinary_service.delete_asset(media.storage_key)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to delete asset from Cloudinary",
            )
    await db.delete(media)
    await db.commit()
    return StandardResponse(message="Media deleted from Cloudinary and database", data=media_id)


@router.post("/media/batch-upload", response_model=BatchUploadResponse, status_code=status.HTTP_201_CREATED)
async def batch_upload_media(
    folder: str = Query(..., min_length=1, max_length=200),
    product_code: str = Query(default="modit", min_length=1, max_length=20),
    tags: str | None = Query(default=None),
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BatchUploadResponse:
    tag_list = [t.strip() for t in tags.split(",")] if tags else None
    assets: list[MediaUploadResponse] = []
    errors: list[str] = []
    failed = 0

    for idx, upload in enumerate(files):
        try:
            if upload.content_type not in ALLOWED_IMAGE_TYPES:
                errors.append(f"File {idx + 1} ({upload.filename}): unsupported type {upload.content_type}")
                failed += 1
                continue

            asset = await cloudinary_service.upload_image_to_db(
                db,
                upload=upload,
                folder=folder,
                product_code=product_code,
                owner_user_id=user.id,
                media_type=MediaType.IMAGE.value,
                tags=tag_list,
            )
            thumbnail_url = None
            if asset.storage_key:
                thumbnail_url = cloudinary_service.generate_thumbnail_url(
                    asset.storage_key, width=200, height=200, crop="fill"
                )
            assets.append(MediaUploadResponse(
                id=asset.id,
                url=asset.url,
                thumbnail_url=thumbnail_url,
                mime_type=asset.mime_type,
                file_size=asset.file_size_bytes,
                width=asset.width,
                height=asset.height,
            ))
        except Exception as exc:
            errors.append(f"File {idx + 1} ({upload.filename}): {str(exc)}")
            failed += 1

    await create_audit_log(
        db,
        product_code=product_code,
        actor_user_id=user.id,
        action="media.batch_upload",
        entity_type="media",
        entity_id=user.id,
    )
    await db.commit()

    return BatchUploadResponse(
        assets=assets,
        total=len(files),
        failed=failed,
        errors=errors,
    )


@router.get("/media/documents", response_model=DocumentListResponse)
async def list_documents(
    product_code: str | None = Query(default=None),
    document_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DocumentListResponse:
    query = select(DocumentAsset).where(DocumentAsset.owner_user_id == user.id)
    count_query = select(func.count()).select_from(DocumentAsset).where(DocumentAsset.owner_user_id == user.id)

    if product_code:
        query = query.where(DocumentAsset.product_code == product_code)
        count_query = count_query.where(DocumentAsset.product_code == product_code)
    if document_type:
        query = query.where(DocumentAsset.document_type == document_type)
        count_query = count_query.where(DocumentAsset.document_type == document_type)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(DocumentAsset.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    docs = result.scalars().all()

    return DocumentListResponse(
        documents=[DocumentRead.model_validate(d) for d in docs],
        total=total,
    )


@router.delete("/media/documents/{doc_id}", response_model=StandardResponse[str])
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StandardResponse[str]:
    doc = await db.get(DocumentAsset, doc_id)
    if doc is None or doc.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if doc.media_id:
        media = await db.get(MediaAsset, doc.media_id)
        if media:
            if media.storage_key:
                await cloudinary_service.delete_asset(media.storage_key)
            await db.delete(media)

    await db.delete(doc)
    await db.commit()
    return StandardResponse(message="Document deleted", data=doc_id)


@router.post("/media/temple-images/{temple_id}", response_model=MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_temple_images(
    temple_id: str,
    upload: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MediaUploadResponse:
    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type: {upload.content_type}",
        )

    asset = await cloudinary_service.upload_temple_image(
        db,
        upload=upload,
        temple_id=temple_id,
        product_code=ProductCode.NAMO_SETU,
        owner_user_id=user.id,
    )
    await create_audit_log(
        db,
        product_code=ProductCode.NAMO_SETU,
        actor_user_id=user.id,
        action="media.upload_temple_image",
        entity_type="media",
        entity_id=asset.id,
    )
    await db.commit()
    await db.refresh(asset)

    thumbnail_url = None
    if asset.storage_key:
        thumbnail_url = cloudinary_service.generate_thumbnail_url(
            asset.storage_key, width=200, height=200, crop="fill"
        )

    return MediaUploadResponse(
        id=asset.id,
        url=asset.url,
        thumbnail_url=thumbnail_url,
        mime_type=asset.mime_type,
        file_size=asset.file_size_bytes,
        width=asset.width,
        height=asset.height,
    )


@router.post("/media/product-images/{product_id}", response_model=MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_product_images(
    product_id: str,
    upload: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MediaUploadResponse:
    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type: {upload.content_type}",
        )

    asset = await cloudinary_service.upload_product_image(
        db,
        upload=upload,
        product_id=product_id,
        product_code=ProductCode.MODIT,
        owner_user_id=user.id,
    )
    await create_audit_log(
        db,
        product_code=ProductCode.MODIT,
        actor_user_id=user.id,
        action="media.upload_product_image",
        entity_type="media",
        entity_id=asset.id,
    )
    await db.commit()
    await db.refresh(asset)

    thumbnail_url = None
    if asset.storage_key:
        thumbnail_url = cloudinary_service.generate_thumbnail_url(
            asset.storage_key, width=200, height=200, crop="fill"
        )

    return MediaUploadResponse(
        id=asset.id,
        url=asset.url,
        thumbnail_url=thumbnail_url,
        mime_type=asset.mime_type,
        file_size=asset.file_size_bytes,
        width=asset.width,
        height=asset.height,
    )
