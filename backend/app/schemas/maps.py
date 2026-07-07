from __future__ import annotations

from pydantic import BaseModel, Field


class GeocodeRequest(BaseModel):
    address: str = Field(..., min_length=1, max_length=500)


class GeocodeResponse(BaseModel):
    lat: float
    lng: float
    formatted_address: str


class ReverseGeocodeRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class ReverseGeocodeResponse(BaseModel):
    formatted_address: str
    address_components: list[dict[str, str]]


class NearbySearchRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    radius_m: int = Field(default=5000, ge=1, le=50000)
    place_type: str = Field(default="point_of_interest", max_length=100)


class NearbyPlace(BaseModel):
    name: str
    lat: float
    lng: float
    rating: float | None = None
    place_id: str
    address: str
    open_now: bool | None = None
    vicinity: str | None = None
    types: list[str] = []


class DirectionRequest(BaseModel):
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lng: float = Field(..., ge=-180, le=180)
    dest_lat: float = Field(..., ge=-90, le=90)
    dest_lng: float = Field(..., ge=-180, le=180)
    mode: str = Field(default="driving", pattern="^(driving|walking|bicycling|transit)$")


class DirectionStep(BaseModel):
    instruction: str
    distance_m: float
    duration_s: float
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float


class DirectionResponse(BaseModel):
    distance_km: float
    duration_minutes: int
    steps: list[DirectionStep]
    start_address: str
    end_address: str


class DistanceMatrixRequest(BaseModel):
    origins: list[str] = Field(..., min_length=1, max_length=10)
    destinations: list[str] = Field(..., min_length=1, max_length=10)
    mode: str = Field(default="driving", pattern="^(driving|walking|bicycling|transit)$")


class DistanceMatrixCell(BaseModel):
    distance_km: float | None = None
    duration_minutes: int | None = None
    status: str


class DistanceMatrixResponse(BaseModel):
    distances: list[list[DistanceMatrixCell]]
    durations: list[list[DistanceMatrixCell]]


class TempleNearbyResponse(BaseModel):
    temple_id: str
    name: str
    distance_km: float
    latitude: float | None = None
    longitude: float | None = None
    address_line1: str
    deity_name: str | None = None
    temple_type: str = "main"
    rating_avg: float = 0
    review_count: int = 0


class HotelNearbyResponse(BaseModel):
    hotel_id: str
    name: str
    distance_km: float
    latitude: float | None = None
    longitude: float | None = None
    star_rating: int | None = None
    contact_number: str | None = None
    accommodation_type: str
    address_line1: str | None = None


class RestaurantNearbyResponse(BaseModel):
    place_id: str
    name: str
    distance_km: float
    lat: float
    lng: float
    rating: float | None = None
    address: str
    open_now: bool | None = None


class EmergencyServiceResponse(BaseModel):
    name: str
    distance_km: float
    lat: float
    lng: float
    address: str
    phone: str | None = None
    place_type: str
    rating: float | None = None


class RouteWaypoint(BaseModel):
    lat: float
    lng: float
    name: str | None = None


class RouteRequest(BaseModel):
    origin_lat: float = Field(..., ge=-90, le=90)
    origin_lng: float = Field(..., ge=-180, le=180)
    dest_lat: float = Field(..., ge=-90, le=90)
    dest_lng: float = Field(..., ge=-180, le=180)
    mode: str = Field(default="driving", pattern="^(driving|walking|bicycling|transit)$")
    waypoints: list[RouteWaypoint] = []


class RouteResponse(BaseModel):
    distance_km: float
    duration_minutes: int
    start_address: str
    end_address: str
    steps: list[DirectionStep]
    waypoint_distances: list[dict[str, float | str]] = []
