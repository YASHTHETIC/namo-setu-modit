"""Live delivery tracking: rider pings + Blinkit-style micro-status timeline."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.enums import DeliveryStatus
from backend.app.models.modit import Delivery, DeliveryPing
from backend.app.services.geo import estimate_eta_minutes, haversine_km

TRACK_STEPS: tuple[tuple[str, str], ...] = (
    ("placed", "Order placed"),
    ("packed", "Packed at warehouse"),
    ("dispatched", "Dispatched"),
    ("out_for_delivery", "Out for delivery"),
    ("arriving", "Arriving now"),
    ("delivered", "Delivered"),
)

# Statuses at/after each step (DeliveryStatus values).
_STEP_REACHED_BY: dict[str, set[str]] = {
    "placed": {
        DeliveryStatus.PENDING.value,
        DeliveryStatus.PICKED_UP.value,
        DeliveryStatus.IN_TRANSIT.value,
        DeliveryStatus.DELIVERED.value,
    },
    "packed": {DeliveryStatus.PICKED_UP.value, DeliveryStatus.IN_TRANSIT.value, DeliveryStatus.DELIVERED.value},
    "dispatched": {DeliveryStatus.PICKED_UP.value, DeliveryStatus.IN_TRANSIT.value, DeliveryStatus.DELIVERED.value},
    "out_for_delivery": {DeliveryStatus.IN_TRANSIT.value, DeliveryStatus.DELIVERED.value},
    "arriving": {DeliveryStatus.DELIVERED.value},
    "delivered": {DeliveryStatus.DELIVERED.value},
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def record_delivery_ping(
    session: AsyncSession,
    delivery_id: str,
    lat: float,
    lng: float,
) -> DeliveryPing:
    """Store a rider heartbeat and refresh the delivery's last-known position.

    First ping on a pending delivery auto-marks it dispatched/in_transit so
    customers see movement without dispatcher input.
    """
    delivery = await session.get(Delivery, delivery_id)
    if delivery is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    now = _utcnow()
    ping = DeliveryPing(delivery_id=delivery.id, latitude=lat, longitude=lng, recorded_at=now)
    session.add(ping)
    delivery.last_lat = lat
    delivery.last_lng = lng
    delivery.last_ping_at = now
    if getattr(delivery, "status", None) == DeliveryStatus.PENDING.value:
        delivery.status = DeliveryStatus.IN_TRANSIT.value
        if getattr(delivery, "dispatched_at", None) is None:
            delivery.dispatched_at = now
    await session.commit()
    await session.refresh(ping)
    return ping


async def get_delivery_track(session: AsyncSession, delivery_id: str) -> dict:
    """Build the public tracking payload: position, distance/ETA, timeline."""
    delivery = await session.get(Delivery, delivery_id)
    if delivery is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")

    dstatus: str = getattr(delivery, "status", DeliveryStatus.PENDING.value) or DeliveryStatus.PENDING.value
    last_lat = getattr(delivery, "last_lat", None)
    last_lng = getattr(delivery, "last_lng", None)
    dest_lat = getattr(delivery, "dest_lat", None)
    dest_lng = getattr(delivery, "dest_lng", None)

    distance_km: float | None = None
    eta_minutes: int | None = None
    if None not in (last_lat, last_lng, dest_lat, dest_lng):
        try:
            distance_km = round(
                haversine_km(float(last_lat), float(last_lng), float(dest_lat), float(dest_lng)), 2
            )
            eta_minutes = estimate_eta_minutes(distance_km)
        except (TypeError, ValueError):
            distance_km, eta_minutes = None, None

    dispatched_at = getattr(delivery, "dispatched_at", None)
    delivered_at = getattr(delivery, "delivered_at", None)
    last_ping_at = getattr(delivery, "last_ping_at", None)
    created_at = getattr(delivery, "created_at", None)

    failed = dstatus == DeliveryStatus.FAILED.value
    timeline: list[dict] = []
    for key, label in TRACK_STEPS:
        done = not failed and (
            dstatus in _STEP_REACHED_BY[key]
            or (key == "out_for_delivery" and last_ping_at is not None)
            or (key == "arriving" and distance_km is not None and distance_km < 1.0)
        )
        at = {
            "placed": created_at,
            "packed": dispatched_at,
            "dispatched": dispatched_at,
            "out_for_delivery": last_ping_at,
            "arriving": last_ping_at,
            "delivered": delivered_at,
        }[key]
        timeline.append({"key": key, "label": label, "done": done, "at": at})

    return {
        "delivery_id": getattr(delivery, "id", delivery_id),
        "delivery_number": getattr(delivery, "delivery_number", ""),
        "status": dstatus,
        "last_lat": last_lat,
        "last_lng": last_lng,
        "last_ping_at": last_ping_at,
        "dest_lat": dest_lat,
        "dest_lng": dest_lng,
        "distance_km": distance_km,
        "eta_minutes": eta_minutes,
        "timeline": timeline,
    }
