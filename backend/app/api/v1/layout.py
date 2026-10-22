from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.schemas.layout import LayoutResponse
from backend.app.services.layout_service import build_fallback_layout, build_home_layout
from backend.app.services.cache_service import cache

logger = logging.getLogger(__name__)

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
    try:
        cached = await cache.get(cache_key)
    except Exception:
        # Cache hiccup must not take the homepage down
        logger.exception("layout cache read failed")
        cached = None
    if cached is not None:
        return LayoutResponse(**cached)

    try:
        result = await build_home_layout(db, pincode=pincode, user_segment=segment)
    except Exception:
        # Catalog hiccup must not take the homepage down: serve the static
        # fallback layout (graceful degradation, mirrors the Redis breaker).
        logger.exception("layout build failed — serving fallback")
        result = build_fallback_layout(pincode=pincode, user_segment=segment)

    try:
        await cache.set(cache_key, result.model_dump(), ttl_seconds=LAYOUT_CACHE_TTL)
    except Exception:
        logger.exception("layout cache write failed")

    return result
