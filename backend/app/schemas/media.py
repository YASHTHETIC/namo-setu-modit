from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from backend.app.schemas.common import ORMModel


class ImageTransformation(BaseModel):
    width: int | None = Field(default=None, ge=1, le=10000)
    height: int | None = Field(default=None, ge=1, le=10000)
    crop: str | None = Field(default=None, pattern="^(scale|fill|fit|thumb|limit|pad|crop)$")
    quality: int | None = Field(default=None, ge=1, le=100)
    format: str | None = Field(default=None, pattern="^(auto|jpg|png|webp|gif|avif|pdf)$")


class MediaUploadRequest(BaseModel):
    product_code: str = Field(..., min_length=1, max_length=20)
    folder: str = Field(..., min_length=1, max_length=200)
    file_type: str = Field(..., pattern="^(image|video|audio|document)$")
    tags: list[str] | None = None
    transformation: ImageTransformation | None = None


class MediaUploadResponse(BaseModel):
    id: str
    url: str
    thumbnail_url: str | None = None
    mime_type: str
    file_size: int
    width: int | None = None
    height: int | None = None


class MediaAssetRead(ORMModel):
    id: str
    product_code: str
    media_type: str
    url: str
    mime_type: str
    file_size_bytes: int
    width: int | None = None
    height: int | None = None
    created_at: datetime
    owner_user_id: str | None = None


class MediaListResponse(BaseModel):
    assets: list[MediaAssetRead]
    total: int


class DocumentUploadRequest(BaseModel):
    product_code: str = Field(..., min_length=1, max_length=20)
    document_type: str = Field(..., min_length=1, max_length=30)
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None


class DocumentUploadResponse(BaseModel):
    id: str
    url: str
    document_type: str
    title: str
    media_id: str | None = None


class DocumentRead(ORMModel):
    id: str
    product_code: str
    document_type: str
    title: str
    description: str | None = None
    media_id: str | None = None
    is_verified: bool
    created_at: datetime
    owner_user_id: str | None = None


class DocumentListResponse(BaseModel):
    documents: list[DocumentRead]
    total: int


class BatchUploadRequest(BaseModel):
    product_code: str = Field(..., min_length=1, max_length=20)
    folder: str = Field(..., min_length=1, max_length=200)
    file_type: str = Field(..., pattern="^(image|video|audio|document)$")
    tags: list[str] | None = None
    transformation: ImageTransformation | None = None


class BatchUploadResponse(BaseModel):
    assets: list[MediaUploadResponse]
    total: int
    failed: int = 0
    errors: list[str] = Field(default_factory=list)


class UrlUploadRequest(BaseModel):
    url: str = Field(..., min_length=1)
    product_code: str = Field(..., min_length=1, max_length=20)
    folder: str = Field(..., min_length=1, max_length=200)
    file_type: str = Field(default="image", pattern="^(image|video|audio|document)$")
    tags: list[str] | None = None
    transformation: ImageTransformation | None = None


class MediaAssetFilter(BaseModel):
    product_code: str | None = None
    media_type: str | None = None
    owner_user_id: str | None = None
    mime_type: str | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class DocumentAssetFilter(BaseModel):
    product_code: str | None = None
    document_type: str | None = None
    owner_user_id: str | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
