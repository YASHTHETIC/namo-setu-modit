from __future__ import annotations

import base64
import json
from datetime import date, datetime, timezone
from math import asin, cos, radians, sin, sqrt
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.enums import AnalyticsEventType, BookingStatus, DarshanSlotStatus, PaymentStatus, ProductCode, PujaStatus
from backend.app.models.namo_setu import (
    AccommodationBooking,
    BookingHistory,
    BookingPayment,
    DarshanSlot,
    Donation,
    Festival,
    NamoBooking,
    Puja,
    PujaBooking,
    Temple,
    TempleReview,
    TravelPackage,
    TravelPackageBooking,
)
from backend.app.models.shared import AnalyticsEvent, Notification, SearchHistory
from backend.app.models.user import User
from backend.app.schemas.namo import (
    AIAssistantResponse,
    AnalyticsSummary,
    DarshanBookingCreate,
    DarshanBookingRead,
    DonationCreate,
    FestivalReminderRead,
    NearbyTempleRequest,
    TempleDetailRead,
    TempleRead,
    TripPlannerRequest,
    TripPlannerResponse,
)


def make_reference(prefix: str) -> str:
    """Create a compact, human-readable business reference."""

    return f"{prefix}-{datetime.now(timezone.utc):%Y%m%d}-{uuid4().hex[:8].upper()}"


def build_qr_ticket(booking: NamoBooking) -> str:
    """Encode enough signed-in context for offline ticket scanning."""

    payload = {
        "type": "namo_darshan_ticket",
        "booking_id": booking.id,
        "booking_number": booking.booking_number,
        "temple_id": booking.temple_id,
        "visit_date": booking.visit_date.isoformat(),
        "party_size": booking.party_size,
        "status": booking.booking_status,
    }
    encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    return encoded.decode("ascii")


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate geographic distance without requiring a spatial database extension."""

    earth_radius_km = 6371.0088
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    return 2 * earth_radius_km * asin(sqrt(a))


async def temple_rating(session: AsyncSession, temple_id: str) -> tuple[float, int]:
    result = await session.execute(
        select(func.coalesce(func.avg(TempleReview.rating), 0), func.count(TempleReview.id)).where(TempleReview.temple_id == temple_id, TempleReview.deleted_at.is_(None))
    )
    rating_avg, review_count = result.one()
    return round(float(rating_avg or 0), 2), int(review_count or 0)


async def temple_to_read(session: AsyncSession, temple: Temple) -> TempleRead:
    rating_avg, review_count = await temple_rating(session, temple.id)
    return TempleRead.model_validate(temple).model_copy(update={"rating_avg": rating_avg, "review_count": review_count})


async def temple_to_detail(session: AsyncSession, temple: Temple) -> TempleDetailRead:
    base = await temple_to_read(session, temple)
    return TempleDetailRead(
        **base.model_dump(),
        images=list(temple.images),
        timings=list(temple.timings),
        festivals=list(temple.festivals),
        events=list(temple.events),
        attractions=list(temple.attractions),
        reviews=list(temple.reviews),
    )


async def get_temple_or_404(session: AsyncSession, temple_id: str) -> Temple:
    result = await session.execute(
        select(Temple)
        .options(
            selectinload(Temple.images),
            selectinload(Temple.timings),
            selectinload(Temple.festivals),
            selectinload(Temple.events),
            selectinload(Temple.attractions),
            selectinload(Temple.reviews),
        )
        .where(Temple.id == temple_id)
    )
    temple = result.scalar_one_or_none()
    if temple is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Temple not found")
    return temple


async def search_temples(
    session: AsyncSession,
    *,
    query: str | None = None,
    state_id: str | None = None,
    city_id: str | None = None,
    category: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[TempleRead], int, list[str]]:
    stmt = select(Temple).where(Temple.is_active.is_(True), Temple.deleted_at.is_(None))
    if query:
        pattern = f"%{query.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Temple.name).like(pattern),
                func.lower(Temple.deity_name).like(pattern),
                func.lower(Temple.description).like(pattern),
                func.lower(Temple.address_line1).like(pattern),
            )
        )
    if state_id:
        stmt = stmt.where(Temple.state_id == state_id)
    if city_id:
        stmt = stmt.where(Temple.city_id == city_id)
    if category:
        stmt = stmt.where(Temple.temple_type == category)

    total = (await session.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    result = await session.execute(stmt.order_by(Temple.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    temples = result.scalars().all()
    items = [await temple_to_read(session, temple) for temple in temples]
    suggestions = [item.name for item in items[:5]]

    if query:
        session.add(
            SearchHistory(
                product_code=ProductCode.NAMO_SETU.value,
                source="namo",
                query_text=query,
                result_count=total,
            )
        )
    return items, int(total), suggestions


async def nearby_temples(session: AsyncSession, payload: NearbyTempleRequest) -> list[TempleRead]:
    result = await session.execute(select(Temple).where(Temple.is_active.is_(True), Temple.latitude.is_not(None), Temple.longitude.is_not(None)))
    ranked: list[tuple[float, Temple]] = []
    for temple in result.scalars().all():
        distance = haversine_km(float(temple.latitude), float(temple.longitude), payload.latitude, payload.longitude)
        if distance <= payload.radius_km:
            ranked.append((distance, temple))
    ranked.sort(key=lambda item: item[0])
    return [await temple_to_read(session, temple) for _, temple in ranked[:25]]


async def popular_temples(session: AsyncSession, limit: int = 10) -> list[TempleRead]:
    stmt = (
        select(Temple)
        .outerjoin(NamoBooking, NamoBooking.temple_id == Temple.id)
        .where(Temple.is_active.is_(True))
        .group_by(Temple.id)
        .order_by(func.count(NamoBooking.id).desc(), Temple.created_at.desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    return [await temple_to_read(session, temple) for temple in result.scalars().all()]


async def create_darshan_booking(session: AsyncSession, payload: DarshanBookingCreate, user: User) -> NamoBooking:
    temple = await session.get(Temple, payload.temple_id)
    if temple is None or not temple.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Temple not found")

    slot: DarshanSlot | None = None
    if payload.darshan_slot_id:
        slot = await session.get(DarshanSlot, payload.darshan_slot_id)
        if slot is None or slot.temple_id != payload.temple_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Darshan slot not found")
        if slot.slot_status != DarshanSlotStatus.AVAILABLE.value:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Darshan slot is not available")
        if slot.booked_count + payload.party_size > slot.capacity:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Darshan slot capacity exceeded")
        slot.booked_count += payload.party_size
        if slot.booked_count >= slot.capacity:
            slot.slot_status = DarshanSlotStatus.FULL.value

    booking = NamoBooking(
        booking_number=make_reference("DARSHAN"),
        user_id=user.id,
        temple_id=payload.temple_id,
        darshan_slot_id=payload.darshan_slot_id,
        booking_status=BookingStatus.CONFIRMED.value,
        visit_date=payload.visit_date,
        party_size=payload.party_size,
        notes=payload.notes,
        total_amount=0,
        currency="INR",
    )
    session.add(booking)
    await session.flush()
    session.add(BookingHistory(booking_id=booking.id, new_status=BookingStatus.CONFIRMED.value, remarks="Booking confirmed"))
    return booking


async def cancel_darshan_booking(session: AsyncSession, booking_id: str, user: User, reason: str | None = None) -> NamoBooking:
    booking = await session.get(NamoBooking, booking_id)
    if booking is None or booking.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.booking_status == BookingStatus.CANCELLED.value:
        return booking
    previous_status = booking.booking_status
    booking.booking_status = BookingStatus.CANCELLED.value
    if booking.darshan_slot_id:
        slot = await session.get(DarshanSlot, booking.darshan_slot_id)
        if slot is not None:
            slot.booked_count = max(slot.booked_count - booking.party_size, 0)
            if slot.slot_status == DarshanSlotStatus.FULL.value:
                slot.slot_status = DarshanSlotStatus.AVAILABLE.value
    session.add(
        BookingHistory(
            booking_id=booking.id,
            previous_status=previous_status,
            new_status=BookingStatus.CANCELLED.value,
            remarks=reason,
        )
    )
    return booking


def darshan_booking_to_read(booking: NamoBooking) -> DarshanBookingRead:
    return DarshanBookingRead.model_validate(booking).model_copy(update={"qr_ticket": build_qr_ticket(booking)})


async def create_donation(session: AsyncSession, payload: DonationCreate, user: User | None) -> Donation:
    temple = await session.get(Temple, payload.temple_id)
    if temple is None or not temple.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Temple not found")
    donation = Donation(
        temple_id=payload.temple_id,
        user_id=user.id if user else None,
        donation_reference=make_reference("DON"),
        donor_name=payload.donor_name,
        purpose=payload.purpose,
        amount=payload.amount,
        currency=payload.currency,
    )
    session.add(donation)
    await session.flush()
    session.add(
        BookingPayment(
            donation_id=donation.id,
            payment_reference=make_reference("PAY"),
            provider=payload.provider,
            amount=payload.amount,
            currency=payload.currency,
            payment_status=PaymentStatus.CAPTURED.value,
            paid_at=datetime.now(timezone.utc),
        )
    )
    return donation


async def create_accommodation_booking(
    session: AsyncSession,
    *,
    room_id: str,
    temple_id: str | None,
    check_in_date: date,
    check_out_date: date,
    guests: int,
    special_requests: str | None,
    user: User,
) -> AccommodationBooking:
    from backend.app.models.namo_setu import Room

    room = await session.get(Room, room_id)
    if room is None or not room.is_active or not room.is_available:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not available")
    if guests > room.capacity:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Room capacity exceeded")
    nights = (check_out_date - check_in_date).days
    if nights <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Check-out must be after check-in")
    booking = AccommodationBooking(
        booking_reference=make_reference("STAY"),
        user_id=user.id,
        room_id=room_id,
        temple_id=temple_id,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        guests=guests,
        total_amount=float(room.price_per_night) * nights,
        special_requests=special_requests,
    )
    session.add(booking)
    return booking


async def create_travel_booking(
    session: AsyncSession,
    *,
    package_id: str,
    guide_id: str | None,
    transport_id: str | None,
    start_date: date,
    travelers: int,
    notes: str | None,
    user: User,
) -> TravelPackageBooking:
    package = await session.get(TravelPackage, package_id)
    if package is None or not package.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Travel package not found")
    itinerary = {
        "start_date": start_date.isoformat(),
        "pace": "balanced",
        "stops": ["Temple arrival", "Guided darshan", "Local prasad and cultural walk"],
    }
    booking = TravelPackageBooking(
        booking_reference=make_reference("TRIP"),
        user_id=user.id,
        package_id=package_id,
        guide_id=guide_id,
        transport_id=transport_id,
        start_date=start_date,
        travelers=travelers,
        total_amount=float(package.price) * travelers,
        currency=package.currency,
        itinerary_json=json.dumps(itinerary),
        notes=notes,
    )
    session.add(booking)
    return booking


async def plan_trip(session: AsyncSession, payload: TripPlannerRequest) -> TripPlannerResponse:
    stmt = select(Temple).where(Temple.is_active.is_(True), Temple.deleted_at.is_(None))
    if payload.city_id:
        stmt = stmt.where(Temple.city_id == payload.city_id)
    if payload.temple_ids:
        stmt = stmt.where(Temple.id.in_(payload.temple_ids))
    result = await session.execute(stmt.limit(max(payload.days * 2, 4)))
    temples = result.scalars().all()
    if not temples:
        return TripPlannerResponse(
            summary="No matching temples were found for the selected plan.",
            days=[],
            estimated_budget=0,
            recommendations=["Try another city, date range, or a broader interest set."],
        )

    days: list[dict[str, object]] = []
    for day_index in range(payload.days):
        day_temples = temples[day_index:: payload.days] or temples[:1]
        days.append(
            {
                "day": day_index + 1,
                "date": payload.start_date.isoformat(),
                "theme": payload.interests[day_index % len(payload.interests)] if payload.interests else "darshan and local culture",
                "stops": [
                    {
                        "temple_id": temple.id,
                        "name": temple.name,
                        "recommended_time": "morning" if index == 0 else "evening",
                    }
                    for index, temple in enumerate(day_temples[:2])
                ],
            }
        )
    estimated_budget = float(payload.travelers * payload.days * 1800)
    return TripPlannerResponse(
        summary=f"{payload.days}-day pilgrimage plan for {payload.travelers} traveler(s), paced as {payload.pace}.",
        days=days,
        estimated_budget=estimated_budget,
        recommendations=["Book darshan slots before travel.", "Keep festival crowd buffers in the itinerary.", "Carry ID proof for bookings."],
    )


async def ai_answer(session: AsyncSession, *, message: str, temple_id: str | None = None, mode: str = "guide") -> AIAssistantResponse:
    temple: Temple | None = await session.get(Temple, temple_id) if temple_id else None
    temple_name = temple.name if temple else "the selected temple"
    normalized = message.lower()
    if "festival" in normalized:
        answer = f"For {temple_name}, check upcoming festival dates early and reserve darshan or stay options before the rush window."
        actions = ["View festival reminders", "Open temple calendar", "Set notification"]
    elif "near" in normalized or "nearby" in normalized:
        answer = f"Nearby recommendations around {temple_name} should balance distance, crowd flow, and elder-friendly access."
        actions = ["Show nearby temples", "Show attractions", "Build half-day route"]
    elif "trip" in normalized or "plan" in normalized:
        answer = f"A calm trip to {temple_name} works best with morning darshan, midday rest, and evening local exploration."
        actions = ["Open trip planner", "Compare travel packages", "Find guides"]
    else:
        answer = f"Here is a devotional guide response for {temple_name}: arrive early, confirm timings, follow dress guidance, and keep your booking QR ready."
        actions = ["Search temples", "Book darshan", "Ask FAQ"]
    session.add(
        AnalyticsEvent(
            product_code=ProductCode.NAMO_SETU.value,
            event_type=AnalyticsEventType.AI_INTERACTION.value,
            event_name=f"ai_{mode}",
            entity_type="temple" if temple_id else None,
            entity_id=temple_id,
            payload_json=json.dumps({"message": message[:500]}),
        )
    )
    return AIAssistantResponse(answer=answer, suggested_actions=actions, sources=["namo-setu-knowledge-base"])


async def festival_reminders(session: AsyncSession, *, temple_id: str | None = None, state_id: str | None = None, days_ahead: int = 30) -> list[FestivalReminderRead]:
    stmt = select(Festival, Temple).join(Temple, Temple.id == Festival.temple_id).where(Festival.starts_on >= datetime.now(timezone.utc))
    if temple_id:
        stmt = stmt.where(Festival.temple_id == temple_id)
    if state_id:
        stmt = stmt.where(Temple.state_id == state_id)
    result = await session.execute(stmt.order_by(Festival.starts_on.asc()).limit(50))
    reminders: list[FestivalReminderRead] = []
    for festival, temple in result.all():
        reminders.append(
            FestivalReminderRead(
                festival_id=festival.id,
                temple_id=temple.id,
                title=festival.name,
                starts_on=festival.starts_on,
                reminder_text=f"{festival.name} at {temple.name} starts on {festival.starts_on.date().isoformat()}.",
            )
        )
    return reminders


async def create_namo_notification(session: AsyncSession, user_id: str, title: str, message: str) -> Notification:
    notification = Notification(
        product_code=ProductCode.NAMO_SETU.value,
        user_id=user_id,
        channel="in_app",
        title=title,
        message=message,
        status="queued",
    )
    session.add(notification)
    return notification


async def analytics_summary(session: AsyncSession) -> AnalyticsSummary:
    temples = (await session.execute(select(func.count(Temple.id)))).scalar_one()
    darshan_bookings = (await session.execute(select(func.count(NamoBooking.id)))).scalar_one()
    puja_bookings = (await session.execute(select(func.count(PujaBooking.id)))).scalar_one()
    donations = (await session.execute(select(func.count(Donation.id)))).scalar_one()
    donation_amount = (await session.execute(select(func.coalesce(func.sum(Donation.amount), 0)))).scalar_one()
    accommodation_bookings = (await session.execute(select(func.count(AccommodationBooking.id)))).scalar_one()
    travel_bookings = (await session.execute(select(func.count(TravelPackageBooking.id)))).scalar_one()
    reviews = (await session.execute(select(func.count(TempleReview.id)))).scalar_one()
    return AnalyticsSummary(
        temples=int(temples),
        darshan_bookings=int(darshan_bookings),
        puja_bookings=int(puja_bookings),
        donations=int(donations),
        donation_amount=float(donation_amount or 0),
        accommodation_bookings=int(accommodation_bookings),
        travel_bookings=int(travel_bookings),
        reviews=int(reviews),
    )
