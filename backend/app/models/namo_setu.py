from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from backend.app.models.base import BaseModel
from backend.app.models.enums import AccommodationType, BookingStatus, DarshanSlotStatus, PaymentStatus, PujaStatus, RefundStatus, TempleType, TransportType


class Temple(BaseModel):
    __tablename__ = "temples"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_namo_temples_slug"),
        Index("ix_namo_temples_city_state", "city_id", "state_id"),
        Index("ix_namo_temples_type_status", "temple_type", "is_active"),
    )

    city_id: Mapped[str] = mapped_column(ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False)
    state_id: Mapped[str] = mapped_column(ForeignKey("states.id", ondelete="RESTRICT"), nullable=False)
    country_id: Mapped[str] = mapped_column(ForeignKey("countries.id", ondelete="RESTRICT"), nullable=False)
    address_id: Mapped[str | None] = mapped_column(ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False)
    temple_type: Mapped[str] = mapped_column(String(30), default=TempleType.MAIN.value, nullable=False)
    deity_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pincode: Mapped[str] = mapped_column(String(20), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    history: Mapped[str | None] = mapped_column(Text, nullable=True)
    dress_code: Mapped[str | None] = mapped_column(String(255), nullable=True)
    accessibility_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    city = relationship("City")
    state = relationship("State")
    country = relationship("Country")
    address = relationship("Address")
    images = relationship("TempleImage", back_populates="temple", cascade="all, delete-orphan")
    timings = relationship("TempleTiming", back_populates="temple", cascade="all, delete-orphan")
    events = relationship("TempleEvent", back_populates="temple", cascade="all, delete-orphan")
    festivals = relationship("Festival", back_populates="temple", cascade="all, delete-orphan")
    attractions = relationship("NearbyAttraction", back_populates="temple", cascade="all, delete-orphan")
    darshan_slots = relationship("DarshanSlot", back_populates="temple", cascade="all, delete-orphan")
    bookings = relationship("NamoBooking", back_populates="temple", cascade="all, delete-orphan")
    donations = relationship("Donation", back_populates="temple", cascade="all, delete-orphan")
    pujas = relationship("Puja", back_populates="temple", cascade="all, delete-orphan")
    travel_packages = relationship("TravelPackage", back_populates="temple", cascade="all, delete-orphan")
    pandits = relationship("Pandit", back_populates="temple", cascade="all, delete-orphan")
    reviews = relationship("TempleReview", back_populates="temple", cascade="all, delete-orphan")

    @validates("name", "slug")
    def validate_required_text(self, key: str, value: str) -> str:
        if not value or not value.strip():
            raise ValueError(f"{key} cannot be empty")
        return value.strip()


class TempleImage(BaseModel):
    __tablename__ = "temple_images"
    __table_args__ = (Index("ix_temple_images_temple_primary", "temple_id", "is_primary"),)

    temple_id: Mapped[str] = mapped_column(ForeignKey("temples.id", ondelete="CASCADE"), nullable=False)
    media_id: Mapped[str] = mapped_column(ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    temple = relationship("Temple", back_populates="images")
    media = relationship("MediaAsset")


class TempleTiming(BaseModel):
    __tablename__ = "temple_timings"
    __table_args__ = (Index("ix_temple_timings_temple_day", "temple_id", "day_of_week"),)

    temple_id: Mapped[str] = mapped_column(ForeignKey("temples.id", ondelete="CASCADE"), nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    opens_at: Mapped[str] = mapped_column(String(10), nullable=False)
    closes_at: Mapped[str] = mapped_column(String(10), nullable=False)
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    temple = relationship("Temple", back_populates="timings")


class TempleEvent(BaseModel):
    __tablename__ = "temple_events"
    __table_args__ = (Index("ix_temple_events_temple_starts", "temple_id", "starts_on"),)

    temple_id: Mapped[str] = mapped_column(ForeignKey("temples.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    starts_on: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_on: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    temple = relationship("Temple", back_populates="events")


class Festival(BaseModel):
    __tablename__ = "festivals"
    __table_args__ = (Index("ix_festivals_temple_starts", "temple_id", "starts_on"),)

    temple_id: Mapped[str] = mapped_column(ForeignKey("temples.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    starts_on: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_on: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    annual_recurring: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    temple = relationship("Temple", back_populates="festivals")


class NearbyAttraction(BaseModel):
    """A pilgrim-friendly point of interest near a temple."""

    __tablename__ = "nearby_attractions"
    __table_args__ = (Index("ix_nearby_attractions_temple_distance", "temple_id", "distance_km"),)

    temple_id: Mapped[str] = mapped_column(ForeignKey("temples.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(80), default="landmark", nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    distance_km: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    temple = relationship("Temple", back_populates="attractions")


class DarshanSlot(BaseModel):
    __tablename__ = "darshan_slots"
    __table_args__ = (
        Index("ix_darshan_slots_temple_datetime", "temple_id", "slot_date", "start_time"),
        CheckConstraint("capacity >= 0", name="ck_darshan_slots_capacity_non_negative"),
    )

    temple_id: Mapped[str] = mapped_column(ForeignKey("temples.id", ondelete="CASCADE"), nullable=False)
    slot_date: Mapped[Date] = mapped_column(Date, nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    booked_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    slot_status: Mapped[str] = mapped_column(String(20), default=DarshanSlotStatus.AVAILABLE.value, nullable=False)

    temple = relationship("Temple", back_populates="darshan_slots")
    bookings = relationship("NamoBooking", back_populates="darshan_slot")


class NamoBooking(BaseModel):
    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint("booking_number", name="uq_bookings_booking_number"),
        Index("ix_bookings_user_status", "user_id", "booking_status"),
        Index("ix_bookings_temple_slot", "temple_id", "darshan_slot_id"),
    )

    booking_number: Mapped[str] = mapped_column(String(50), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    temple_id: Mapped[str] = mapped_column(ForeignKey("temples.id", ondelete="RESTRICT"), nullable=False)
    darshan_slot_id: Mapped[str | None] = mapped_column(ForeignKey("darshan_slots.id", ondelete="SET NULL"), nullable=True)
    booking_status: Mapped[str] = mapped_column(String(20), default=BookingStatus.DRAFT.value, nullable=False)
    visit_date: Mapped[Date] = mapped_column(Date, nullable=False)
    party_size: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)

    user = relationship("User", back_populates="namo_bookings")
    temple = relationship("Temple", back_populates="bookings")
    darshan_slot = relationship("DarshanSlot", back_populates="bookings")
    history = relationship("BookingHistory", back_populates="booking", cascade="all, delete-orphan")
    payments = relationship("BookingPayment", back_populates="booking", cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="booking", cascade="all, delete-orphan")


class BookingHistory(BaseModel):
    __tablename__ = "booking_history"
    __table_args__ = (Index("ix_booking_history_booking_created", "booking_id", "created_at"),)

    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    previous_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    new_status: Mapped[str] = mapped_column(String(20), nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    booking = relationship("NamoBooking", back_populates="history")


class BookingPayment(BaseModel):
    __tablename__ = "payments"
    __table_args__ = (
        UniqueConstraint("payment_reference", name="uq_payments_payment_reference"),
        Index("ix_payments_booking_status", "booking_id", "payment_status"),
    )

    booking_id: Mapped[str | None] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"), nullable=True)
    donation_id: Mapped[str | None] = mapped_column(ForeignKey("donations.id", ondelete="CASCADE"), nullable=True)
    payment_reference: Mapped[str] = mapped_column(String(100), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    payment_status: Mapped[str] = mapped_column(String(20), default=PaymentStatus.PENDING.value, nullable=False)
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    booking = relationship("NamoBooking", back_populates="payments")
    donation = relationship("Donation", back_populates="payments")


class Refund(BaseModel):
    __tablename__ = "refunds"
    __table_args__ = (Index("ix_refunds_booking_status", "booking_id", "refund_status"),)

    booking_id: Mapped[str | None] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"), nullable=True)
    payment_id: Mapped[str | None] = mapped_column(ForeignKey("payments.id", ondelete="CASCADE"), nullable=True)
    refund_reference: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    refund_status: Mapped[str] = mapped_column(String(20), default=RefundStatus.REQUESTED.value, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    booking = relationship("NamoBooking", back_populates="refunds")


class Donation(BaseModel):
    __tablename__ = "donations"
    __table_args__ = (Index("ix_donations_temple_user_created", "temple_id", "user_id", "created_at"),)

    temple_id: Mapped[str] = mapped_column(ForeignKey("temples.id", ondelete="RESTRICT"), nullable=False)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    donation_reference: Mapped[str] = mapped_column(String(100), nullable=False)
    donor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)

    temple = relationship("Temple", back_populates="donations")
    user = relationship("User", back_populates="namo_donations")
    payments = relationship("BookingPayment", back_populates="donation")


class Puja(BaseModel):
    __tablename__ = "puja"
    __table_args__ = (Index("ix_puja_temple_status", "temple_id", "status"),)

    temple_id: Mapped[str] = mapped_column(ForeignKey("temples.id", ondelete="RESTRICT"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=PujaStatus.DRAFT.value, nullable=False)
    base_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)

    temple = relationship("Temple", back_populates="pujas")
    bookings = relationship("PujaBooking", back_populates="puja", cascade="all, delete-orphan")


class PujaBooking(BaseModel):
    __tablename__ = "puja_bookings"
    __table_args__ = (Index("ix_puja_bookings_puja_user", "puja_id", "user_id"),)

    puja_id: Mapped[str] = mapped_column(ForeignKey("puja.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    temple_id: Mapped[str] = mapped_column(ForeignKey("temples.id", ondelete="RESTRICT"), nullable=False)
    pandit_id: Mapped[str | None] = mapped_column(ForeignKey("pandits.id", ondelete="SET NULL"), nullable=True)
    booking_date: Mapped[Date] = mapped_column(Date, nullable=False)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=PujaStatus.DRAFT.value, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    devotee_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    puja = relationship("Puja", back_populates="bookings")
    temple = relationship("Temple")
    pandit = relationship("Pandit", back_populates="puja_bookings")
    user = relationship("User", back_populates="namo_puja_bookings")


class Pandit(BaseModel):
    __tablename__ = "pandits"
    __table_args__ = (Index("ix_pandits_temple_active", "temple_id", "is_active"),)

    temple_id: Mapped[str] = mapped_column(ForeignKey("temples.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    language_id: Mapped[str | None] = mapped_column(ForeignKey("languages.id", ondelete="SET NULL"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    temple = relationship("Temple", back_populates="pandits")
    puja_bookings = relationship("PujaBooking", back_populates="pandit")


class Accommodation(BaseModel):
    __tablename__ = "accommodation"
    __table_args__ = (Index("ix_accommodation_temple_type", "temple_id", "accommodation_type"),)

    temple_id: Mapped[str | None] = mapped_column(ForeignKey("temples.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    accommodation_type: Mapped[str] = mapped_column(String(20), nullable=False)
    address_id: Mapped[str | None] = mapped_column(ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    temple = relationship("Temple")
    address = relationship("Address")
    hotels = relationship("Hotel", back_populates="accommodation", cascade="all, delete-orphan")


class Hotel(BaseModel):
    __tablename__ = "hotels"
    __table_args__ = (Index("ix_hotels_accommodation", "accommodation_id", "is_active"),)

    accommodation_id: Mapped[str] = mapped_column(ForeignKey("accommodation.id", ondelete="CASCADE"), nullable=False)
    star_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    check_in_time: Mapped[str | None] = mapped_column(String(10), nullable=True)
    check_out_time: Mapped[str | None] = mapped_column(String(10), nullable=True)
    contact_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    accommodation = relationship("Accommodation", back_populates="hotels")
    rooms = relationship("Room", back_populates="hotel", cascade="all, delete-orphan")


class Room(BaseModel):
    __tablename__ = "rooms"
    __table_args__ = (Index("ix_rooms_hotel_status", "hotel_id", "is_active"),)

    hotel_id: Mapped[str] = mapped_column(ForeignKey("hotels.id", ondelete="CASCADE"), nullable=False)
    room_type: Mapped[str] = mapped_column(String(100), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_per_night: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    hotel = relationship("Hotel", back_populates="rooms")
    bookings = relationship("AccommodationBooking", back_populates="room", cascade="all, delete-orphan")


class AccommodationBooking(BaseModel):
    """Reservation for a hotel room or dharamshala room."""

    __tablename__ = "accommodation_bookings"
    __table_args__ = (
        UniqueConstraint("booking_reference", name="uq_accommodation_bookings_reference"),
        Index("ix_accommodation_bookings_user_status", "user_id", "status"),
    )

    booking_reference: Mapped[str] = mapped_column(String(80), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id", ondelete="RESTRICT"), nullable=False)
    temple_id: Mapped[str | None] = mapped_column(ForeignKey("temples.id", ondelete="SET NULL"), nullable=True)
    check_in_date: Mapped[Date] = mapped_column(Date, nullable=False)
    check_out_date: Mapped[Date] = mapped_column(Date, nullable=False)
    guests: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=BookingStatus.CONFIRMED.value, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    special_requests: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("User")
    room = relationship("Room", back_populates="bookings")
    temple = relationship("Temple")


class Transportation(BaseModel):
    __tablename__ = "transportation"
    __table_args__ = (Index("ix_transportation_temple_type", "temple_id", "transport_type"),)

    temple_id: Mapped[str | None] = mapped_column(ForeignKey("temples.id", ondelete="SET NULL"), nullable=True)
    provider_name: Mapped[str] = mapped_column(String(255), nullable=False)
    transport_type: Mapped[str] = mapped_column(String(20), nullable=False)
    vehicle_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    contact_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    temple = relationship("Temple")
    travel_bookings = relationship("TravelPackageBooking", back_populates="transport")


class PilgrimageRoute(BaseModel):
    __tablename__ = "pilgrimage_routes"
    __table_args__ = (UniqueConstraint("origin_city_id", "destination_city_id", "name", name="uq_routes_path_name"),)

    origin_city_id: Mapped[str] = mapped_column(ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False)
    destination_city_id: Mapped[str] = mapped_column(ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    distance_km: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    estimated_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    origin_city = relationship("City", foreign_keys=[origin_city_id])
    destination_city = relationship("City", foreign_keys=[destination_city_id])


class TravelPackage(BaseModel):
    __tablename__ = "travel_packages"
    __table_args__ = (Index("ix_travel_packages_temple_active", "temple_id", "is_active"),)

    temple_id: Mapped[str | None] = mapped_column(ForeignKey("temples.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    temple = relationship("Temple", back_populates="travel_packages")
    bookings = relationship("TravelPackageBooking", back_populates="package", cascade="all, delete-orphan")


class TourGuide(BaseModel):
    __tablename__ = "tour_guides"
    __table_args__ = (Index("ix_tour_guides_city_active", "city_id", "is_active"),)

    city_id: Mapped[str | None] = mapped_column(ForeignKey("cities.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    language_id: Mapped[str | None] = mapped_column(ForeignKey("languages.id", ondelete="SET NULL"), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    rating_avg: Mapped[float] = mapped_column(Numeric(4, 2), default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    city = relationship("City")
    language = relationship("Language")
    travel_bookings = relationship("TravelPackageBooking", back_populates="guide")


class TravelPackageBooking(BaseModel):
    """Reservation for a Namo Setu travel package with optional guide and transport."""

    __tablename__ = "travel_package_bookings"
    __table_args__ = (
        UniqueConstraint("booking_reference", name="uq_travel_package_bookings_reference"),
        Index("ix_travel_package_bookings_user_status", "user_id", "status"),
    )

    booking_reference: Mapped[str] = mapped_column(String(80), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    package_id: Mapped[str] = mapped_column(ForeignKey("travel_packages.id", ondelete="RESTRICT"), nullable=False)
    guide_id: Mapped[str | None] = mapped_column(ForeignKey("tour_guides.id", ondelete="SET NULL"), nullable=True)
    transport_id: Mapped[str | None] = mapped_column(ForeignKey("transportation.id", ondelete="SET NULL"), nullable=True)
    start_date: Mapped[Date] = mapped_column(Date, nullable=False)
    travelers: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=BookingStatus.CONFIRMED.value, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    itinerary_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("User")
    package = relationship("TravelPackage", back_populates="bookings")
    guide = relationship("TourGuide", back_populates="travel_bookings")
    transport = relationship("Transportation", back_populates="travel_bookings")


class TempleReview(BaseModel):
    __tablename__ = "temple_reviews"
    __table_args__ = (Index("ix_temple_reviews_temple_user", "temple_id", "user_id"),)

    temple_id: Mapped[str] = mapped_column(ForeignKey("temples.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    temple = relationship("Temple", back_populates="reviews")
