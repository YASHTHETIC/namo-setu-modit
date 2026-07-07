from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import require_permission
from backend.app.core.database import get_db
from backend.app.core.rbac import PermissionName
from backend.app.services.search_service import search_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/temples")
async def search_temples(
    q: str | None = Query(None, description="Full-text search query"),
    state_id: str | None = None,
    city_id: str | None = None,
    temple_type: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    filters: dict[str, Any] = {}
    if state_id:
        filters["state_id"] = state_id
    if city_id:
        filters["city_id"] = city_id
    if temple_type:
        filters["temple_type"] = temple_type

    return await search_service.search_temples(
        session=db,
        query=q,
        filters=filters,
        page=page,
        page_size=page_size,
    )


@router.get("/products")
async def search_products(
    q: str | None = Query(None, description="Full-text search query"),
    category_id: str | None = None,
    brand_id: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    filters: dict[str, Any] = {}
    if category_id:
        filters["category_id"] = category_id
    if brand_id:
        filters["brand_id"] = brand_id
    if min_price is not None:
        filters["min_price"] = min_price
    if max_price is not None:
        filters["max_price"] = max_price

    return await search_service.search_products(
        session=db,
        query=q,
        filters=filters,
        page=page,
        page_size=page_size,
    )


@router.get("/suppliers")
async def search_suppliers(
    q: str | None = Query(None, description="Full-text search query"),
    is_verified: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    filters: dict[str, Any] = {}
    if is_verified is not None:
        filters["is_verified"] = is_verified

    return await search_service.search_suppliers(
        session=db,
        query=q,
        filters=filters,
        page=page,
        page_size=page_size,
    )


@router.get("/autocomplete")
async def autocomplete(
    q: str = Query(..., min_length=2, description="Prefix to autocomplete"),
    product_code: str | None = Query(None, description="Filter by product: namo_setu | modit"),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    return await search_service.autocomplete(
        session=db,
        query=q,
        product_code=product_code,
    )


@router.post("/reindex", dependencies=[Depends(require_permission(PermissionName.CONFIG_READ))])
async def reindex(
    product_code: str | None = Query(None, description="Reindex only a specific product"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    count = await search_service.reindex_all(product_code=product_code)
    return {"detail": "Search index invalidated", "keys_cleared": count}
