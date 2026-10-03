"""Geo helpers for hyperlocal fulfillment: nearest warehouse, rider ETA.

Pure math + thin DB helpers. Warehouse counts are small (tens, not millions),
so nearest-hub lookup runs in Python over active warehouses — no PostGIS
needed on the shared VPS box.
"""

from __future__ import annotations

import math

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

EARTH_RADIUS_KM = 6371.0

# Observed city average for Blinkit-style riders is ~20 km/h; MODIT trucks
# are slower and bulkier, so default to 22 km/h blended and let callers tune.
DEFAULT_RIDER_SPEED_KMH = 22.0


def _validate_coords(lat: float, lng: float) -> None:
    if not (-90.0 <= lat <= 90.0):
        raise ValueError(f"latitude out of range: {lat}")
    if not (-180.0 <= lng <= 180.0):
        raise ValueError(f"longitude out of range: {lng}")


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in km between two WGS84 points."""
    _validate_coords(lat1, lng1)
    _validate_coords(lat2, lng2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def estimate_eta_minutes(distance_km: float, speed_kmh: float = DEFAULT_RIDER_SPEED_KMH) -> int:
    """Ceiling ETA in minutes, at least 1. Raises on bad input."""
    if distance_km < 0:
        raise ValueError(f"distance_km must be >= 0: {distance_km}")
    if speed_kmh <= 0:
        raise ValueError(f"speed_kmh must be > 0: {speed_kmh}")
    return max(1, math.ceil(distance_km / speed_kmh * 60))


async def find_nearest_warehouse(
    session: AsyncSession,
    lat: float,
    lng: float,
    organization_id: str | None = None,
) -> tuple[object | None, float | None]:
    """Return (warehouse, distance_km) for the closest geo-tagged warehouse.

    Warehouses without coordinates are skipped. Returns (None, None) when
    no warehouse has coordinates yet.
    """
    from backend.app.models.modit import Warehouse

    _validate_coords(lat, lng)
    stmt = select(Warehouse).where(Warehouse.is_active.is_(True), Warehouse.deleted_at.is_(None))
    if organization_id:
        stmt = stmt.where(Warehouse.organization_id == organization_id)
    rows = (await session.execute(stmt)).scalars().all()

    best = None
    best_km: float | None = None
    for wh in rows:
        wlat = getattr(wh, "latitude", None)
        wlng = getattr(wh, "longitude", None)
        if wlat is None or wlng is None:
            continue
        try:
            km = haversine_km(lat, lng, float(wlat), float(wlng))
        except (TypeError, ValueError):
            continue
        if best_km is None or km < best_km:
            best, best_km = wh, km
    return best, best_km
