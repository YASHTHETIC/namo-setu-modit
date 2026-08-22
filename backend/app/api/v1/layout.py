from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.schemas.layout import LayoutResponse
from backend.app.services.layout_service import build_home_layout
from backend.app.services.cache_service import cache

router = APIRouter()

# Cache layout for 60 seconds (homepage is hit on every app open)
LAYOUT_CACHE_TTL = 60


@router.get("/layout/{screen}", response_model=LayoutResponse)
async def get_layout(
    screen: str,
    pincode: str = Query(default="201301", description="Delivery pincode"),
    segment: str = Query(default="all", description="User segment: all, new_user, returning_user"),
    db: AsyncSession = Depends(get_db),
):
    """
    Server-Driven UI layout endpoint.

    Returns a JSON structure describing the sections to render on the given screen.
    The frontend maps `type` fields to React components via a component registry.

    Supported screens: home, category, search, product_detail
    """
    cache_key = f"layout:{screen}:{pincode}:{segment}"
    cached = await cache.get(cache_key)
    if cached is not None:
        return LayoutResponse(**cached)

    result = await build_home_layout(db, pincode=pincode, user_segment=segment)
    await cache.set(cache_key, result.model_dump(), ttl_seconds=LAYOUT_CACHE_TTL)
    return result
