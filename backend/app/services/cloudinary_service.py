from __future__ import annotations

import base64
import hashlib
import hmac
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException, UploadFile, status

from backend.app.core.config import get_settings
from backend.app.models.enums import DocumentType, MediaType, ProductCode
from backend.app.models.shared import DocumentAsset, MediaAsset
from backend.app.schemas.media import ImageTransformation


@dataclass(slots=True)
class CloudinaryUploadResult:
    public_id: str
    url: str
    secure_url: str
    format: str
    resource_type: str
    bytes: int
    width: int | None
    height: int | None
    folder: str
    created_at: str
    version: int
    signature: str


class CloudinaryService:
    def __init__(self) -> None:
        settings = get_settings()
        self.cloud_name = settings.cloudinary_cloud_name
        self.api_key = settings.cloudinary_api_key
        self.api_secret = settings.cloudinary_api_secret
        self.base_url = f"https://api.cloudinary.com/v1_1/{self.cloud_name}"

    def _generate_signature(self, params_to_sign: dict[str, Any]) -> str:
        sorted_params = "&".join(
            f"{k}={v}" for k, v in sorted(params_to_sign.items()) if v is not None and v != ""
        )
        to_sign = f"{sorted_params}{self.api_secret}"
        return hashlib.sha1(to_sign.encode("utf-8")).hexdigest()

    def _generate_upload_params(
        self,
        *,
        folder: str,
        public_id: str | None = None,
        transformation: str | None = None,
        tags: list[str] | None = None,
        context: dict[str, str] | None = None,
        overwrite: bool = False,
        unique_filename: bool = True,
    ) -> dict[str, Any]:
        timestamp = str(int(time.time()))
        params: dict[str, Any] = {
            "folder": folder,
            "timestamp": timestamp,
            "api_key": self.api_key,
        }
        if public_id:
            params["public_id"] = public_id
        if transformation:
            params["transformation"] = transformation
        if tags:
            params["tags"] = ",".join(tags)
        if context:
            for k, v in context.items():
                params[f"context={k}"] = v
        if overwrite:
            params["overwrite"] = "true"
        if unique_filename:
            params["unique_filename"] = "true"
        else:
            params["unique_filename"] = "false"

        signable = {k: v for k, v in params.items() if k != "api_key"}
        params["signature"] = self._generate_signature(signable)
        return params

    def _build_transformation_string(self, transforms: ImageTransformation | None) -> str | None:
        if not transforms:
            return None
        parts: list[str] = []
        if transforms.width or transforms.height:
            w = f"{transforms.width}" if transforms.width else ""
            h = f"{transforms.height}" if transforms.height else ""
            crop = transforms.crop or "scale"
            parts.append(f"c_{crop},w_{w},h_{h}")
        if transforms.quality:
            parts.append(f"q_{transforms.quality}")
        if transforms.format:
            parts.append(f"f_{transforms.format}")
        return ",".join(parts) if parts else None

    async def _do_upload(
        self,
        *,
        file_bytes: bytes | None = None,
        file_path: str | None = None,
        file_url: str | None = None,
        upload_preset: str | None = None,
        folder: str,
        public_id: str | None = None,
        transformation: ImageTransformation | None = None,
        tags: list[str] | None = None,
        context: dict[str, str] | None = None,
        overwrite: bool = False,
    ) -> dict[str, Any]:
        transform_str = self._build_transformation_string(transformation)
        timestamp = str(int(time.time()))

        data: dict[str, Any] = {
            "timestamp": timestamp,
            "api_key": self.api_key,
            "folder": folder,
        }
        if public_id:
            data["public_id"] = public_id
        if transform_str:
            data["transformation"] = transform_str
        if tags:
            data["tags"] = ",".join(tags)
        if context:
            for k, v in context.items():
                data[f"context={k}"] = v
        if overwrite:
            data["overwrite"] = "true"
        if file_url:
            data["file"] = file_url
        else:
            data["unique_filename"] = "true"

        signable = {k: v for k, v in data.items() if k != "api_key"}
        data["signature"] = self._generate_signature(signable)

        upload_url = f"{self.base_url}/upload"

        async with httpx.AsyncClient(timeout=60.0) as client:
            if file_bytes is not None:
                files = {"file": ("upload", file_bytes, "application/octet-stream")}
                resp = await client.post(upload_url, data=data, files=files)
            elif file_url is not None:
                resp = await client.post(upload_url, data=data)
            else:
                raise ValueError("Either file_bytes or file_url must be provided")

        if resp.status_code != 200:
            detail = resp.text
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Cloudinary upload failed: {detail}",
            )
        return resp.json()

    async def upload_from_bytes(
        self,
        file_bytes: bytes,
        *,
        folder: str,
        public_id: str | None = None,
        transformation: ImageTransformation | None = None,
        tags: list[str] | None = None,
        context: dict[str, str] | None = None,
    ) -> CloudinaryUploadResult:
        result = await self._do_upload(
            file_bytes=file_bytes,
            folder=folder,
            public_id=public_id,
            transformation=transformation,
            tags=tags,
            context=context,
        )
        return CloudinaryUploadResult(
            public_id=result.get("public_id", ""),
            url=result.get("url", ""),
            secure_url=result.get("secure_url", ""),
            format=result.get("format", ""),
            resource_type=result.get("resource_type", ""),
            bytes=result.get("bytes", 0),
            width=result.get("width"),
            height=result.get("height"),
            folder=result.get("folder", ""),
            created_at=result.get("created_at", ""),
            version=result.get("version", 0),
            signature=result.get("signature", ""),
        )

    async def upload_from_file_path(
        self,
        file_path: str,
        *,
        folder: str,
        public_id: str | None = None,
        transformation: ImageTransformation | None = None,
        tags: list[str] | None = None,
        context: dict[str, str] | None = None,
    ) -> CloudinaryUploadResult:
        path = Path(file_path)
        if not path.is_file():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File not found: {file_path}")
        file_bytes = path.read_bytes()
        return await self.upload_from_bytes(
            file_bytes,
            folder=folder,
            public_id=public_id,
            transformation=transformation,
            tags=tags,
            context=context,
        )

    async def upload_from_url(
        self,
        file_url: str,
        *,
        folder: str,
        public_id: str | None = None,
        transformation: ImageTransformation | None = None,
        tags: list[str] | None = None,
        context: dict[str, str] | None = None,
    ) -> CloudinaryUploadResult:
        parsed = urlparse(file_url)
        if parsed.scheme not in ("http", "https"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid URL scheme")
        result = await self._do_upload(
            file_url=file_url,
            folder=folder,
            public_id=public_id,
            transformation=transformation,
            tags=tags,
            context=context,
        )
        return CloudinaryUploadResult(
            public_id=result.get("public_id", ""),
            url=result.get("url", ""),
            secure_url=result.get("secure_url", ""),
            format=result.get("format", ""),
            resource_type=result.get("resource_type", ""),
            bytes=result.get("bytes", 0),
            width=result.get("width"),
            height=result.get("height"),
            folder=result.get("folder", ""),
            created_at=result.get("created_at", ""),
            version=result.get("version", 0),
            signature=result.get("signature", ""),
        )

    async def upload_from_uploadfile(
        self,
        upload: UploadFile,
        *,
        folder: str,
        public_id: str | None = None,
        transformation: ImageTransformation | None = None,
        tags: list[str] | None = None,
        context: dict[str, str] | None = None,
    ) -> CloudinaryUploadResult:
        file_bytes = await upload.read()
        if not file_bytes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file upload")
        return await self.upload_from_bytes(
            file_bytes,
            folder=folder,
            public_id=public_id,
            transformation=transformation,
            tags=tags,
            context=context,
        )

    async def delete_asset(self, public_id: str, resource_type: str = "image") -> bool:
        timestamp = str(int(time.time()))
        data: dict[str, str] = {
            "public_id": public_id,
            "timestamp": timestamp,
            "api_key": self.api_key,
            "resource_type": resource_type,
        }
        signable = {k: v for k, v in data.items() if k != "api_key"}
        data["signature"] = self._generate_signature(signable)

        url = f"{self.base_url}/{resource_type}/destroy"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, data=data)
        if resp.status_code != 200:
            return False
        result = resp.json()
        return result.get("result") == "ok"

    async def get_asset_details(self, public_id: str, resource_type: str = "image") -> dict[str, Any]:
        url = f"{self.base_url}/{resource_type}/upload/{public_id}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cloudinary asset not found: {public_id}",
            )
        return resp.json()

    def generate_thumbnail_url(
        self,
        public_id: str,
        *,
        width: int = 200,
        height: int = 200,
        crop: str = "fill",
        format: str | None = None,
        quality: int | None = None,
    ) -> str:
        transform_parts = [f"c_{crop}", f"w_{width}", f"h_{height}"]
        if quality:
            transform_parts.append(f"q_{quality}")
        if format:
            transform_parts.append(f"f_{format}")
        transform_str = ",".join(transform_parts)
        base = f"https://res.cloudinary.com/{self.cloud_name}/image/upload"
        return f"{base}/{transform_str}/{public_id}"

    def generate_optimized_url(
        self,
        public_id: str,
        *,
        width: int | None = None,
        height: int | None = None,
        format_auto: bool = True,
        quality_auto: bool = True,
    ) -> str:
        parts: list[str] = []
        if format_auto:
            parts.append("f_auto")
        if quality_auto:
            parts.append("q_auto")
        if width or height:
            w = f"w_{width}" if width else ""
            h = f"h_{height}" if height else ""
            crop = "scale"
            parts.extend([f"c_{crop}", w, h])
        transform_str = ",".join(p for p in parts if p)
        base = f"https://res.cloudinary.com/{self.cloud_name}/image/upload"
        if transform_str:
            return f"{base}/{transform_str}/{public_id}"
        return f"{base}/{public_id}"

    async def upload_image_to_db(
        self,
        db: "AsyncSession",
        *,
        upload: UploadFile,
        folder: str,
        product_code: ProductCode | str,
        owner_user_id: str | None,
        media_type: str = MediaType.IMAGE.value,
        transformation: ImageTransformation | None = None,
        tags: list[str] | None = None,
        context: dict[str, str] | None = None,
        public_id: str | None = None,
    ) -> MediaAsset:
        result = await self.upload_from_uploadfile(
            upload,
            folder=folder,
            public_id=public_id,
            transformation=transformation,
            tags=tags,
            context=context,
        )

        pc = product_code.value if isinstance(product_code, ProductCode) else product_code
        asset = MediaAsset(
            product_code=pc,
            owner_user_id=owner_user_id,
            media_type=media_type,
            storage_key=result.public_id,
            url=result.secure_url or result.url,
            mime_type=upload.content_type or "application/octet-stream",
            file_size_bytes=result.bytes,
            width=result.width,
            height=result.height,
        )
        db.add(asset)
        await db.flush()
        return asset

    async def upload_document_to_db(
        self,
        db: "AsyncSession",
        *,
        upload: UploadFile,
        folder: str,
        product_code: ProductCode | str,
        owner_user_id: str | None,
        document_type: str = DocumentType.OTHER.value,
        title: str,
        description: str | None = None,
        tags: list[str] | None = None,
    ) -> DocumentAsset:
        result = await self.upload_from_uploadfile(
            upload,
            folder=folder,
            tags=tags,
        )

        pc = product_code.value if isinstance(product_code, ProductCode) else product_code
        media = MediaAsset(
            product_code=pc,
            owner_user_id=owner_user_id,
            media_type=MediaType.DOCUMENT.value,
            storage_key=result.public_id,
            url=result.secure_url or result.url,
            mime_type=upload.content_type or "application/octet-stream",
            file_size_bytes=result.bytes,
        )
        db.add(media)
        await db.flush()

        doc = DocumentAsset(
            product_code=pc,
            owner_user_id=owner_user_id,
            media_id=media.id,
            document_type=document_type,
            title=title,
            description=description,
        )
        db.add(doc)
        await db.flush()
        return doc

    async def upload_temple_image(
        self,
        db: "AsyncSession",
        *,
        upload: UploadFile,
        temple_id: str,
        product_code: ProductCode | str = ProductCode.NAMO_SETU,
        owner_user_id: str | None = None,
        transformation: ImageTransformation | None = None,
    ) -> MediaAsset:
        folder = "namo_setu/temples"
        public_id = f"temple_{temple_id}_{uuid.uuid4().hex[:8]}"
        tags = ["temple", "namo_setu", temple_id]
        context = {"temple_id": temple_id}
        return await self.upload_image_to_db(
            db,
            upload=upload,
            folder=folder,
            product_code=product_code,
            owner_user_id=owner_user_id,
            media_type=MediaType.IMAGE.value,
            transformation=transformation,
            tags=tags,
            context=context,
            public_id=public_id,
        )

    async def upload_product_image(
        self,
        db: "AsyncSession",
        *,
        upload: UploadFile,
        product_id: str,
        product_code: ProductCode | str = ProductCode.MODIT,
        owner_user_id: str | None = None,
        transformation: ImageTransformation | None = None,
    ) -> MediaAsset:
        folder = "modit/products"
        public_id = f"product_{product_id}_{uuid.uuid4().hex[:8]}"
        tags = ["product", "modit", product_id]
        context = {"product_id": product_id}
        return await self.upload_image_to_db(
            db,
            upload=upload,
            folder=folder,
            product_code=product_code,
            owner_user_id=owner_user_id,
            media_type=MediaType.IMAGE.value,
            transformation=transformation,
            tags=tags,
            context=context,
            public_id=public_id,
        )

    async def upload_boq_document(
        self,
        db: "AsyncSession",
        *,
        upload: UploadFile,
        product_code: ProductCode | str = ProductCode.MODIT,
        owner_user_id: str | None,
        title: str = "BOQ Document",
        description: str | None = None,
    ) -> DocumentAsset:
        folder = "modit/documents/boq"
        tags = ["boq", "modit", "document"]
        return await self.upload_document_to_db(
            db,
            upload=upload,
            folder=folder,
            product_code=product_code,
            owner_user_id=owner_user_id,
            document_type=DocumentType.OTHER.value,
            title=title,
            description=description,
            tags=tags,
        )

    async def upload_invoice(
        self,
        db: "AsyncSession",
        *,
        upload: UploadFile,
        product_code: ProductCode | str = ProductCode.MODIT,
        owner_user_id: str | None,
        title: str = "Invoice",
        description: str | None = None,
    ) -> DocumentAsset:
        folder = "modit/documents/invoices"
        tags = ["invoice", "modit", "document"]
        return await self.upload_document_to_db(
            db,
            upload=upload,
            folder=folder,
            product_code=product_code,
            owner_user_id=owner_user_id,
            document_type=DocumentType.INVOICE.value,
            title=title,
            description=description,
            tags=tags,
        )

    async def upload_user_avatar(
        self,
        db: "AsyncSession",
        *,
        upload: UploadFile,
        user_id: str,
        product_code: ProductCode | str = ProductCode.MODIT,
        transformation: ImageTransformation | None = None,
    ) -> MediaAsset:
        folder = "shared/avatars"
        public_id = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}"
        tags = ["avatar", "user", user_id]
        context = {"user_id": user_id}
        return await self.upload_image_to_db(
            db,
            upload=upload,
            folder=folder,
            product_code=product_code,
            owner_user_id=user_id,
            media_type=MediaType.IMAGE.value,
            transformation=transformation or ImageTransformation(width=256, height=256, crop="fill"),
            tags=tags,
            context=context,
            public_id=public_id,
        )

    async def upload_supplier_document(
        self,
        db: "AsyncSession",
        *,
        upload: UploadFile,
        supplier_id: str,
        product_code: ProductCode | str = ProductCode.MODIT,
        owner_user_id: str | None,
        title: str = "Supplier Document",
        description: str | None = None,
        document_type: str = DocumentType.OTHER.value,
    ) -> DocumentAsset:
        folder = "modit/documents/suppliers"
        tags = ["supplier", "modit", "document", supplier_id]
        return await self.upload_document_to_db(
            db,
            upload=upload,
            folder=folder,
            product_code=product_code,
            owner_user_id=owner_user_id,
            document_type=document_type,
            title=title,
            description=description,
            tags=tags,
        )

    async def batch_upload(
        self,
        db: "AsyncSession",
        *,
        files: list[UploadFile],
        folder: str,
        product_code: ProductCode | str,
        owner_user_id: str | None,
        media_type: str = MediaType.IMAGE.value,
        transformation: ImageTransformation | None = None,
        tags: list[str] | None = None,
    ) -> list[MediaAsset]:
        results: list[MediaAsset] = []
        for upload in files:
            asset = await self.upload_image_to_db(
                db,
                upload=upload,
                folder=folder,
                product_code=product_code,
                owner_user_id=owner_user_id,
                media_type=media_type,
                transformation=transformation,
                tags=tags,
            )
            results.append(asset)
        return results

    async def batch_delete(self, public_ids: list[str], resource_type: str = "image") -> dict[str, bool]:
        results: dict[str, bool] = {}
        for pid in public_ids:
            deleted = await self.delete_asset(pid, resource_type=resource_type)
            results[pid] = deleted
        return results


cloudinary_service = CloudinaryService()
