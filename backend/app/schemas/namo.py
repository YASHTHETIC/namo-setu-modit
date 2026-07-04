from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field

from backend.app.schemas.common import ORMModel


class PageParams(BaseModel):
    """Shared pagination and search controls for Namo Setu list endpoints."""

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    search: str | None = None


class NamoPage(BaseModel):
    page: int
    page_size: int
    total: int
    pages: int


class TempleBase(BaseModel):
    city_id: str
    state_id: str
    country_id: str
    address_id: str | None = None
    name: str
    slug: str
    temple_type: str = "main"
    deity_name: str | None = None
    address_line1: str
    address_line2: str | None = None
    pincode: str
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    history: str | None = None
    dress_code: str | None = None
    accessibility_notes: str | None = None
    website_url: str | None = None
    phone_number: str | None = None
    is_active: bool = True


class TempleCreate(TempleBase):
    """Admin request for creating a temple profile."""


class TempleUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    temple_type: str | None = None
    deity_name: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    pincode: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    history: str | None = None
    dress_code: str | None = None
    accessibility_notes: str | None = None
    website_url: str | None = None
    phone_number: str | None = None
    is_active: bool | None = None


class TempleRead(ORMModel):
    id: str
    city_id: str
    state_id: str
    country_id: str
    address_id: str | None = None
    name: str
    slug: str
    temple_type: str
    deity_name: str | None = None
    address_line1: str
    address_line2: str | None = None
    pincode: str
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    history: str | None = None
    dress_code: str | None = None
    accessibility_notes: str | None = None
    website_url: str | None = None
    phone_number: str | None = None
    is_active: bool
    created_at: datetime
    rating_avg: float = 0
    review_count: int = 0


class TempleListResponse(NamoPage):
    items: list[TempleRead]


class TempleImageCreate(BaseModel):
    media_id: str
    caption: str | None = None
    sort_order: int = 0
    is_primary: bool = False


class TempleImageRead(ORMModel):
    id: str
    temple_id: str
    media_id: str
    caption: str | None = None
    sort_order: int
    is_primary: bool


class TempleTimingCreate(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    opens_at: str
    closes_at: str
    is_closed: bool = False
    notes: str | None = None


class TempleTimingRead(ORMModel):
    id: str
    temple_id: str
    day_of_week: int
    opens_at: str
    closes_at: str
    is_closed: bool
    notes: str | None = None


class TempleEventCreate(BaseModel):
    title: str
    description: str | None = None
    starts_on: datetime
    ends_on: datetime | None = None
    is_public: bool = True


class TempleEventRead(ORMModel):
    id: str
    temple_id: str
    title: str
    description: str | None = None
    starts_on: datetime
    ends_on: datetime | None = None
    is_public: bool


class FestivalCreate(BaseModel):
    name: str
    description: str | None = None
    starts_on: datetime
    ends_on: datetime | None = None
    annual_recurring: bool = True


class FestivalRead(ORMModel):
    id: str
    temple_id: str
    name: str
    description: str | None = None
    starts_on: datetime
    ends_on: datetime | None = None
    annual_recurring: bool


class NearbyAttractionCreate(BaseModel):
    name: str
    category: str = "landmark"
    description: str | None = None
    distance_km: float | None = None
    duration_minutes: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool = True


class NearbyAttractionRead(ORMModel):
    id: str
    temple_id: str
    name: str
    category: str
    description: str | None = None
    distance_km: float | None = None
    duration_minutes: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool


class TempleReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: str | None = None
    body: str | None = None


class TempleReviewRead(ORMModel):
    id: str
    temple_id: str
    user_id: str | None = None
    rating: int
    title: str | None = None
    body: str | None = None
    is_verified: bool
    created_at: datetime


class TempleDetailRead(TempleRead):
    images: list[TempleImageRead] = Field(default_factory=list)
    timings: list[TempleTimingRead] = Field(default_factory=list)
    festivals: list[FestivalRead] = Field(default_factory=list)
    events: list[TempleEventRead] = Field(default_factory=list)
    attractions: list[NearbyAttractionRead] = Field(default_factory=list)
    reviews: list[TempleReviewRead] = Field(default_factory=list)


class TempleSearchResponse(NamoPage):
    items: list[TempleRead]
    suggestions: list[str] = Field(default_factory=list)


class NearbyTempleRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = Field(default=50, gt=0, le=500)


class DarshanSlotCreate(BaseModel):
    temple_id: str
    slot_date: date
    start_time: str
    end_time: str
    capacity: int = Field(default=0, ge=0)
    slot_status: str = "available"


class DarshanSlotUpdate(BaseModel):
    slot_date: date | None = None
    start_time: str | None = None
    end_time: str | None = None
    capacity: int | None = Field(default=None, ge=0)
    slot_status: str | None = None


class DarshanSlotRead(ORMModel):
    id: str
    temple_id: str
    slot_date: date
    start_time: str
    end_time: str
    capacity: int
    booked_count: int
    slot_status: str
    available_count: int = 0


class DarshanBookingCreate(BaseModel):
    temple_id: str
    darshan_slot_id: str | None = None
    visit_date: date
    party_size: int = Field(default=1, ge=1, le=25)
    notes: str | None = None


class DarshanBookingRead(ORMModel):
    id: str
    booking_number: str
    user_id: str
    temple_id: str
    darshan_slot_id: str | None = None
    booking_status: str
    visit_date: date
    party_size: int
    notes: str | None = None
    total_amount: float
    currency: str
    qr_ticket: str = ""


class BookingCancellationRequest(BaseModel):
    reason: str | None = None


class PujaCreate(BaseModel):
    temple_id: str
    title: str
    description: str | None = None
    status: str = "scheduled"
    base_price: float = Field(default=0, ge=0)


class PujaRead(ORMModel):
    id: str
    temple_id: str
    title: str
    description: str | None = None
    status: str
    base_price: float


class PanditCreate(BaseModel):
    temple_id: str
    name: str
    phone_number: str | None = None
    language_id: str | None = None
    is_active: bool = True


class PanditRead(ORMModel):
    id: str
    temple_id: str
    name: str
    phone_number: str | None = None
    language_id: str | None = None
    is_active: bool


class PujaBookingCreate(BaseModel):
    puja_id: str
    temple_id: str
    pandit_id: str | None = None
    booking_date: date
    scheduled_at: datetime | None = None
    devotee_name: str | None = None
    notes: str | None = None


class PujaBookingRead(ORMModel):
    id: str
    puja_id: str
    user_id: str
    temple_id: str
    pandit_id: str | None = None
    booking_date: date
    scheduled_at: datetime | None = None
    status: str
    amount: float
    notes: str | None = None
    devotee_name: str | None = None


class DonationCreate(BaseModel):
    temple_id: str
    donor_name: str
    purpose: str | None = None
    amount: float = Field(gt=0)
    currency: str = "INR"
    provider: str = "online"


class DonationRead(ORMModel):
    id: str
    temple_id: str
    user_id: str | None = None
    donation_reference: str
    donor_name: str
    purpose: str | None = None
    amount: float
    currency: str
    receipt_number: str = ""
    created_at: datetime


class AccommodationCreate(BaseModel):
    temple_id: str | None = None
    name: str
    accommodation_type: str = "hotel"
    address_id: str | None = None
    is_active: bool = True


class AccommodationRead(ORMModel):
    id: str
    temple_id: str | None = None
    name: str
    accommodation_type: str
    address_id: str | None = None
    is_active: bool


class HotelCreate(BaseModel):
    accommodation_id: str
    star_rating: int | None = Field(default=None, ge=0, le=5)
    check_in_time: str | None = None
    check_out_time: str | None = None
    contact_number: str | None = None
    is_active: bool = True


class HotelRead(ORMModel):
    id: str
    accommodation_id: str
    star_rating: int | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None
    contact_number: str | None = None
    is_active: bool


class RoomCreate(BaseModel):
    hotel_id: str
    room_type: str
    capacity: int = Field(ge=1)
    price_per_night: float = Field(ge=0)
    is_available: bool = True
    is_active: bool = True


class RoomRead(ORMModel):
    id: str
    hotel_id: str
    room_type: str
    capacity: int
    price_per_night: float
    is_available: bool
    is_active: bool


class AccommodationBookingCreate(BaseModel):
    room_id: str
    temple_id: str | None = None
    check_in_date: date
    check_out_date: date
    guests: int = Field(default=1, ge=1)
    special_requests: str | None = None


class AccommodationBookingRead(ORMModel):
    id: str
    booking_reference: str
    user_id: str
    room_id: str
    temple_id: str | None = None
    check_in_date: date
    check_out_date: date
    guests: int
    status: str
    total_amount: float
    currency: str
    special_requests: str | None = None


class TransportationCreate(BaseModel):
    temple_id: str | None = None
    provider_name: str
    transport_type: str = "cab"
    vehicle_number: str | None = None
    contact_number: str | None = None
    is_active: bool = True


class TransportationRead(ORMModel):
    id: str
    temple_id: str | None = None
    provider_name: str
    transport_type: str
    vehicle_number: str | None = None
    contact_number: str | None = None
    is_active: bool


class PilgrimageRouteCreate(BaseModel):
    origin_city_id: str
    destination_city_id: str
    name: str
    description: str | None = None
    distance_km: float | None = None
    estimated_duration_minutes: int | None = None
    is_active: bool = True


class PilgrimageRouteRead(ORMModel):
    id: str
    origin_city_id: str
    destination_city_id: str
    name: str
    description: str | None = None
    distance_km: float | None = None
    estimated_duration_minutes: int | None = None
    is_active: bool


class TravelPackageCreate(BaseModel):
    temple_id: str | None = None
    title: str
    description: str | None = None
    price: float = Field(ge=0)
    currency: str = "INR"
    is_active: bool = True


class TravelPackageRead(ORMModel):
    id: str
    temple_id: str | None = None
    title: str
    description: str | None = None
    price: float
    currency: str
    is_active: bool


class TourGuideCreate(BaseModel):
    city_id: str | None = None
    name: str
    language_id: str | None = None
    phone_number: str | None = None
    rating_avg: float = Field(default=0, ge=0, le=5)
    is_active: bool = True


class TourGuideRead(ORMModel):
    id: str
    city_id: str | None = None
    name: str
    language_id: str | None = None
    phone_number: str | None = None
    rating_avg: float
    is_active: bool


class TravelPackageBookingCreate(BaseModel):
    package_id: str
    guide_id: str | None = None
    transport_id: str | None = None
    start_date: date
    travelers: int = Field(default=1, ge=1)
    notes: str | None = None


class TravelPackageBookingRead(ORMModel):
    id: str
    booking_reference: str
    user_id: str
    package_id: str
    guide_id: str | None = None
    transport_id: str | None = None
    start_date: date
    travelers: int
    status: str
    total_amount: float
    currency: str
    itinerary_json: str | None = None
    notes: str | None = None


class TripPlannerRequest(BaseModel):
    city_id: str | None = None
    temple_ids: list[str] = Field(default_factory=list)
    start_date: date
    days: int = Field(default=2, ge=1, le=14)
    travelers: int = Field(default=1, ge=1)
    interests: list[str] = Field(default_factory=list)
    pace: str = "balanced"


class TripPlannerResponse(BaseModel):
    summary: str
    days: list[dict[str, Any]]
    estimated_budget: float
    recommendations: list[str]


class AIAssistantRequest(BaseModel):
    message: str
    temple_id: str | None = None
    language: str = "en"
    user_context: dict[str, Any] = Field(default_factory=dict)


class AIAssistantResponse(BaseModel):
    answer: str
    suggested_actions: list[str] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)


class VoiceAssistantRequest(AIAssistantRequest):
    transcript: str | None = None
    audio_url: str | None = None


class FestivalReminderRequest(BaseModel):
    temple_id: str | None = None
    state_id: str | None = None
    days_ahead: int = Field(default=30, ge=1, le=365)


class FestivalReminderRead(BaseModel):
    festival_id: str
    temple_id: str
    title: str
    starts_on: datetime
    reminder_text: str


class AnalyticsEventCreate(BaseModel):
    event_name: str
    event_type: str = "page_view"
    entity_type: str | None = None
    entity_id: str | None = None
    payload_json: str | None = None
    session_id: str | None = None


class AnalyticsSummary(BaseModel):
    temples: int
    darshan_bookings: int
    puja_bookings: int
    donations: int
    donation_amount: float
    accommodation_bookings: int
    travel_bookings: int
    reviews: int
