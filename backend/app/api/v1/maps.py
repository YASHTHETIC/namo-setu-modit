from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.schemas.maps import (
    DirectionRequest,
    DirectionResponse,
    DistanceMatrixRequest,
    DistanceMatrixResponse,
    EmergencyServiceResponse,
    GeocodeRequest,
    GeocodeResponse,
    HotelNearbyResponse,
    NearbySearchRequest,
    NearbyPlace,
    RestaurantNearbyResponse,
    ReverseGeocodeRequest,
    ReverseGeocodeResponse,
    RouteRequest,
    RouteResponse,
    TempleNearbyResponse,
)
from backend.app.services.maps_service import maps_service

router = APIRouter(prefix="/maps", tags=["maps"])


# ------------------------------------------------------------------
# Geocoding
# ------------------------------------------------------------------


@router.post("/geocode", response_model=GeocodeResponse)
async def geocode_address(
    payload: GeocodeRequest,
    _user=Depends(get_current_user),
) -> GeocodeResponse:
    result = await maps_service.geocode(payload.address)
    if result is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Geocoding service unavailable")
    return GeocodeResponse(**result)


@router.post("/reverse-geocode", response_model=ReverseGeocodeResponse)
async def reverse_geocode(
    payload: ReverseGeocodeRequest,
    _user=Depends(get_current_user),
) -> ReverseGeocodeResponse:
    result = await maps_service.reverse_geocode(payload.lat, payload.lng)
    if result is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Reverse geocoding service unavailable")
    return ReverseGeocodeResponse(**result)


# ------------------------------------------------------------------
# Nearby Search
# ------------------------------------------------------------------


@router.post("/nearby", response_model=list[NearbyPlace])
async def nearby_search(
    payload: NearbySearchRequest,
    _user=Depends(get_current_user),
) -> list[NearbyPlace]:
    results = await maps_service.nearby_search(
        lat=payload.lat,
        lng=payload.lng,
        radius_m=payload.radius_m,
        place_type=payload.place_type,
    )
    return [NearbyPlace(**r) for r in results]


# ------------------------------------------------------------------
# Directions
# ------------------------------------------------------------------


@router.post("/directions", response_model=DirectionResponse)
async def get_directions(
    payload: DirectionRequest,
    _user=Depends(get_current_user),
) -> DirectionResponse:
    result = await maps_service.directions(
        origin_lat=payload.origin_lat,
        origin_lng=payload.origin_lng,
        dest_lat=payload.dest_lat,
        dest_lng=payload.dest_lng,
        mode=payload.mode,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Directions service unavailable")
    return DirectionResponse(**result)


# ------------------------------------------------------------------
# Distance Matrix
# ------------------------------------------------------------------


@router.post("/distance-matrix", response_model=DistanceMatrixResponse)
async def distance_matrix(
    payload: DistanceMatrixRequest,
    _user=Depends(get_current_user),
) -> DistanceMatrixResponse:
    result = await maps_service.distance_matrix(
        origins=payload.origins,
        destinations=payload.destinations,
        mode=payload.mode,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Distance matrix service unavailable")
    return DistanceMatrixResponse(**result)


# ------------------------------------------------------------------
# DB-based nearby queries
# ------------------------------------------------------------------


@router.get("/nearby-temples", response_model=list[TempleNearbyResponse])
async def nearby_temples(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(default=25.0, ge=0.1, le=200),
    _user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TempleNearbyResponse]:
    results = await maps_service.find_nearby_temples(session=db, lat=lat, lng=lng, radius_km=radius_km)
    return [TempleNearbyResponse(**r) for r in results]


@router.get("/nearby-hotels", response_model=list[HotelNearbyResponse])
async def nearby_hotels(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(default=25.0, ge=0.1, le=200),
    _user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[HotelNearbyResponse]:
    results = await maps_service.find_nearby_hotels(session=db, lat=lat, lng=lng, radius_km=radius_km)
    return [HotelNearbyResponse(**r) for r in results]


@router.get("/nearby-restaurants", response_model=list[RestaurantNearbyResponse])
async def nearby_restaurants(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_m: int = Query(default=5000, ge=1, le=50000),
    _user=Depends(get_current_user),
) -> list[RestaurantNearbyResponse]:
    results = await maps_service.find_nearby_restaurants(lat=lat, lng=lng, radius_m=radius_m)
    return [RestaurantNearbyResponse(**r) for r in results]


@router.get("/emergency", response_model=list[EmergencyServiceResponse])
async def find_emergency(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_m: int = Query(default=10000, ge=1, le=50000),
    _user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[EmergencyServiceResponse]:
    results = await maps_service.find_emergency_services(session=db, lat=lat, lng=lng, radius_m=radius_m)
    return [EmergencyServiceResponse(**r) for r in results]


# ------------------------------------------------------------------
# Live Route Planning
# ------------------------------------------------------------------


@router.post("/route", response_model=RouteResponse)
async def plan_route(
    payload: RouteRequest,
    _user=Depends(get_current_user),
) -> RouteResponse:
    waypoints = [{"lat": w.lat, "lng": w.lng, "name": w.name} for w in payload.waypoints] if payload.waypoints else None
    result = await maps_service.get_live_route(
        origin_lat=payload.origin_lat,
        origin_lng=payload.origin_lng,
        dest_lat=payload.dest_lat,
        dest_lng=payload.dest_lng,
        mode=payload.mode,
        waypoints=waypoints,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Route planning service unavailable")
    return RouteResponse(**result)
