from __future__ import annotations

import logging
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import get_settings
from backend.app.models.namo_setu import Accommodation, Hotel, Temple
from backend.app.services.namo import haversine_km

logger = logging.getLogger(__name__)

settings = get_settings()

GOOGLE_MAPS_BASE = "https://maps.googleapis.com/maps/api"
GEOCODE_URL = f"{GOOGLE_MAPS_BASE}/geocode/json"
NEARBY_SEARCH_URL = f"{GOOGLE_MAPS_BASE}/place/nearbysearch/json"
DIRECTIONS_URL = f"{GOOGLE_MAPS_BASE}/directions/json"
DISTANCE_MATRIX_URL = f"{GOOGLE_MAPS_BASE}/distancematrix/json"
PLACE_DETAILS_URL = f"{GOOGLE_MAPS_BASE}/place/details/json"
PHOTO_URL = f"{GOOGLE_MAPS_BASE}/place/photo"

HTTP_TIMEOUT = 15.0


class MapsService:
    """Google Maps integration service for Namo Setu + MODIT platforms."""

    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key or settings.google_maps_api_key

    @property
    def _has_api_key(self) -> bool:
        return bool(self._api_key)

    async def _get(self, url: str, params: dict[str, Any]) -> dict[str, Any] | None:
        if not self._has_api_key:
            return None
        params["key"] = self._api_key
        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                return resp.json()
        except Exception:
            logger.exception("Google Maps API request failed: %s", url)
            return None

    # ------------------------------------------------------------------
    # Geocoding
    # ------------------------------------------------------------------

    async def geocode(self, address: str) -> dict[str, Any] | None:
        data = await self._get(GEOCODE_URL, {"address": address})
        if not data or data.get("status") != "OK" or not data.get("results"):
            return None
        result = data["results"][0]
        loc = result["geometry"]["location"]
        return {
            "lat": loc["lat"],
            "lng": loc["lng"],
            "formatted_address": result.get("formatted_address", address),
        }

    async def reverse_geocode(self, lat: float, lng: float) -> dict[str, Any] | None:
        data = await self._get(GEOCODE_URL, {"latlng": f"{lat},{lng}"})
        if not data or data.get("status") != "OK" or not data.get("results"):
            return None
        result = data["results"][0]
        components = [
            {"long_name": c.get("long_name", ""), "short_name": c.get("short_name", ""), "types": ",".join(c.get("types", []))}
            for c in result.get("address_components", [])
        ]
        return {
            "formatted_address": result.get("formatted_address", ""),
            "address_components": components,
        }

    # ------------------------------------------------------------------
    # Places
    # ------------------------------------------------------------------

    async def nearby_search(
        self,
        lat: float,
        lng: float,
        radius_m: int = 5000,
        place_type: str = "point_of_interest",
    ) -> list[dict[str, Any]]:
        data = await self._get(
            NEARBY_SEARCH_URL,
            {"location": f"{lat},{lng}", "radius": radius_m, "type": place_type},
        )
        if not data or data.get("status") not in ("OK", "ZERO_RESULTS"):
            return []
        results: list[dict[str, Any]] = []
        for place in data.get("results", []):
            loc = place.get("geometry", {}).get("location", {})
            opening = place.get("opening_hours")
            results.append(
                {
                    "name": place.get("name", ""),
                    "lat": loc.get("lat", 0),
                    "lng": loc.get("lng", 0),
                    "rating": place.get("rating"),
                    "place_id": place.get("place_id", ""),
                    "address": place.get("vicinity", ""),
                    "open_now": opening.get("open_now") if opening else None,
                    "types": place.get("types", []),
                }
            )
        return results

    async def place_details(self, place_id: str) -> dict[str, Any] | None:
        data = await self._get(
            PLACE_DETAILS_URL,
            {"place_id": place_id, "fields": "name,formatted_phone_number,website,rating,photo,formatted_address,opening_hours,url"},
        )
        if not data or data.get("status") != "OK":
            return None
        result = data.get("result", {})
        photos = [p.get("photo_reference") for p in result.get("photos", []) if p.get("photo_reference")]
        opening = result.get("opening_hours")
        return {
            "name": result.get("name", ""),
            "address": result.get("formatted_address", ""),
            "phone": result.get("formatted_phone_number"),
            "website": result.get("website"),
            "rating": result.get("rating"),
            "photos": photos,
            "url": result.get("url"),
            "open_now": opening.get("open_now") if opening else None,
        }

    # ------------------------------------------------------------------
    # Directions
    # ------------------------------------------------------------------

    async def directions(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        mode: str = "driving",
    ) -> dict[str, Any] | None:
        data = await self._get(
            DIRECTIONS_URL,
            {
                "origin": f"{origin_lat},{origin_lng}",
                "destination": f"{dest_lat},{dest_lng}",
                "mode": mode,
            },
        )
        if not data or data.get("status") != "OK" or not data.get("routes"):
            return None
        route = data["routes"][0]
        leg = route["legs"][0]
        steps = []
        for s in leg.get("steps", []):
            start = s.get("start_location", {})
            end = s.get("end_location", {})
            steps.append(
                {
                    "instruction": _strip_html(s.get("html_instructions", "")),
                    "distance_m": s.get("distance", {}).get("value", 0),
                    "duration_s": s.get("duration", {}).get("value", 0),
                    "start_lat": start.get("lat", 0),
                    "start_lng": start.get("lng", 0),
                    "end_lat": end.get("lat", 0),
                    "end_lng": end.get("lng", 0),
                }
            )
        return {
            "distance_km": leg.get("distance", {}).get("value", 0) / 1000,
            "duration_minutes": round(leg.get("duration", {}).get("value", 0) / 60),
            "steps": steps,
            "start_address": leg.get("start_address", ""),
            "end_address": leg.get("end_address", ""),
        }

    # ------------------------------------------------------------------
    # Distance Matrix
    # ------------------------------------------------------------------

    async def distance_matrix(
        self,
        origins: list[str],
        destinations: list[str],
        mode: str = "driving",
    ) -> dict[str, Any] | None:
        data = await self._get(
            DISTANCE_MATRIX_URL,
            {
                "origins": "|".join(origins),
                "destinations": "|".join(destinations),
                "mode": mode,
            },
        )
        if not data or data.get("status") != "OK":
            return None

        rows = data.get("rows", [])
        distances: list[list[dict[str, Any]]] = []
        durations: list[list[dict[str, Any]]] = []
        for row in rows:
            dist_row: list[dict[str, Any]] = []
            dur_row: list[dict[str, Any]] = []
            for elem in row.get("elements", []):
                dist_val = elem.get("distance", {}).get("value")
                dur_val = elem.get("duration", {}).get("value")
                dist_row.append({
                    "distance_km": round(dist_val / 1000, 2) if dist_val else None,
                    "duration_minutes": round(dur_val / 60) if dur_val else None,
                    "status": elem.get("status", "UNKNOWN"),
                })
                dur_row.append({
                    "distance_km": round(dist_val / 1000, 2) if dist_val else None,
                    "duration_minutes": round(dur_val / 60) if dur_val else None,
                    "status": elem.get("status", "UNKNOWN"),
                })
            distances.append(dist_row)
            durations.append(dur_row)
        return {"distances": distances, "durations": durations}

    # ------------------------------------------------------------------
    # DB-based nearby queries (with haversine fallback)
    # ------------------------------------------------------------------

    async def find_nearby_temples(
        self,
        session: AsyncSession,
        lat: float,
        lng: float,
        radius_km: float = 25.0,
    ) -> list[dict[str, Any]]:
        result = await session.execute(
            select(Temple).where(
                Temple.is_active.is_(True),
                Temple.deleted_at.is_(None),
                Temple.latitude.is_not(None),
                Temple.longitude.is_not(None),
            )
        )
        temples = result.scalars().all()
        ranked: list[dict[str, Any]] = []
        for temple in temples:
            t_lat = float(temple.latitude)
            t_lng = float(temple.longitude)
            distance = haversine_km(lat, lng, t_lat, t_lng)
            if distance <= radius_km:
                ranked.append(
                    {
                        "temple_id": temple.id,
                        "name": temple.name,
                        "distance_km": round(distance, 2),
                        "latitude": t_lat,
                        "longitude": t_lng,
                        "address_line1": temple.address_line1,
                        "deity_name": temple.deity_name,
                        "temple_type": temple.temple_type,
                    }
                )
        ranked.sort(key=lambda x: x["distance_km"])
        return ranked

    async def find_nearby_hotels(
        self,
        session: AsyncSession,
        lat: float,
        lng: float,
        radius_km: float = 25.0,
    ) -> list[dict[str, Any]]:
        google_results = await self.nearby_search(lat, lng, radius_m=int(radius_km * 1000), place_type="lodging")
        if google_results:
            return [
                {
                    "hotel_id": r["place_id"],
                    "name": r["name"],
                    "distance_km": round(haversine_km(lat, lng, r["lat"], r["lng"]), 2),
                    "latitude": r["lat"],
                    "longitude": r["lng"],
                    "star_rating": None,
                    "contact_number": None,
                    "accommodation_type": "lodging",
                    "address_line1": r.get("address"),
                }
                for r in google_results
            ]
        result = await session.execute(
            select(Hotel, Accommodation)
            .join(Accommodation, Accommodation.id == Hotel.accommodation_id)
            .where(Hotel.is_active.is_(True), Accommodation.is_active.is_(True))
        )
        rows = result.all()
        return [
            {
                "hotel_id": hotel.id,
                "name": acc.name,
                "distance_km": 0,
                "latitude": None,
                "longitude": None,
                "star_rating": hotel.star_rating,
                "contact_number": hotel.contact_number,
                "accommodation_type": acc.accommodation_type,
                "address_line1": None,
            }
            for hotel, acc in rows[:25]
        ]

    async def find_nearby_restaurants(
        self,
        lat: float,
        lng: float,
        radius_m: int = 5000,
    ) -> list[dict[str, Any]]:
        return await self.nearby_search(lat, lng, radius_m=radius_m, place_type="restaurant")

    async def find_emergency_services(
        self,
        session: AsyncSession,
        lat: float,
        lng: float,
        radius_m: int = 10000,
    ) -> list[dict[str, Any]]:
        services: list[dict[str, Any]] = []
        for place_type in ("hospital", "police"):
            results = await self.nearby_search(lat, lng, radius_m=radius_m, place_type=place_type)
            for place in results:
                dist = haversine_km(lat, lng, place["lat"], place["lng"])
                services.append(
                    {
                        "name": place["name"],
                        "distance_km": round(dist, 2),
                        "lat": place["lat"],
                        "lng": place["lng"],
                        "address": place.get("address", ""),
                        "phone": None,
                        "place_type": place_type,
                        "rating": place.get("rating"),
                    }
                )
        services.sort(key=lambda x: x["distance_km"])
        return services

    async def get_live_route(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        mode: str = "driving",
        waypoints: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any] | None:
        params: dict[str, Any] = {
            "origin": f"{origin_lat},{origin_lng}",
            "destination": f"{dest_lat},{dest_lng}",
            "mode": mode,
        }
        if waypoints:
            wp_str = "|".join(f"{w['lat']},{w['lng']}" for w in waypoints)
            params["waypoints"] = f"optimize:true|{wp_str}"

        data = await self._get(DIRECTIONS_URL, params)
        if not data or data.get("status") != "OK" or not data.get("routes"):
            return None
        route = data["routes"][0]
        leg = route["legs"][0]
        steps = []
        for s in leg.get("steps", []):
            start = s.get("start_location", {})
            end = s.get("end_location", {})
            steps.append(
                {
                    "instruction": _strip_html(s.get("html_instructions", "")),
                    "distance_m": s.get("distance", {}).get("value", 0),
                    "duration_s": s.get("duration", {}).get("value", 0),
                    "start_lat": start.get("lat", 0),
                    "start_lng": start.get("lng", 0),
                    "end_lat": end.get("lat", 0),
                    "end_lng": end.get("lng", 0),
                }
            )
        waypoint_distances: list[dict[str, Any]] = []
        for idx, wp in enumerate(waypoints or []):
            dist = haversine_km(leg.get("start_location", {}).get("lat", 0), leg.get("start_location", {}).get("lng", 0), wp["lat"], wp["lng"])
            waypoint_distances.append({"waypoint_index": idx, "name": wp.get("name", ""), "distance_km_from_origin": round(dist, 2)})

        return {
            "distance_km": leg.get("distance", {}).get("value", 0) / 1000,
            "duration_minutes": round(leg.get("duration", {}).get("value", 0) / 60),
            "start_address": leg.get("start_address", ""),
            "end_address": leg.get("end_address", ""),
            "steps": steps,
            "waypoint_distances": waypoint_distances,
        }


def _strip_html(text: str) -> str:
    """Minimal HTML tag removal for direction instructions."""
    import re
    return re.sub(r"<[^>]+>", "", text).strip()


maps_service = MapsService()
