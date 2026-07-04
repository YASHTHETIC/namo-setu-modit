from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, require_permission
from backend.app.core.database import get_db
from backend.app.core.rbac import PermissionName
from backend.app.models.enums import BookingStatus, ProductCode, PujaStatus
from backend.app.models.namo_setu import (
    Accommodation,
    AccommodationBooking,
    DarshanSlot,
    Hotel,
    NearbyAttraction,
    NamoBooking,
    Pandit,
    PilgrimageRoute,
    Puja,
    PujaBooking,
    Room,
    Temple,
    TempleEvent,
    TempleImage,
    TempleReview,
    TempleTiming,
    Transportation,
    TourGuide,
    TravelPackage,
    TravelPackageBooking,
    Festival,
)
from backend.app.models.shared import AnalyticsEvent, Notification
from backend.app.models.user import User
from backend.app.schemas.namo import (
    AIAssistantRequest,
    AIAssistantResponse,
    AccommodationBookingCreate,
    AccommodationBookingRead,
    AccommodationCreate,
    AccommodationRead,
    AnalyticsEventCreate,
    AnalyticsSummary,
    BookingCancellationRequest,
    DarshanBookingCreate,
    DarshanBookingRead,
    DarshanSlotCreate,
    DarshanSlotRead,
    DarshanSlotUpdate,
    DonationCreate,
    DonationRead,
    FestivalCreate,
    FestivalRead,
    FestivalReminderRequest,
    FestivalReminderRead,
    HotelCreate,
    HotelRead,
    NearbyAttractionCreate,
    NearbyAttractionRead,
    NearbyTempleRequest,
    PanditCreate,
    PanditRead,
    PilgrimageRouteCreate,
    PilgrimageRouteRead,
    PujaBookingCreate,
    PujaBookingRead,
    PujaCreate,
    PujaRead,
    RoomCreate,
    RoomRead,
    TempleCreate,
    TempleDetailRead,
    TempleEventCreate,
    TempleEventRead,
    TempleImageCreate,
    TempleImageRead,
    TempleListResponse,
    TempleRead,
    TempleReviewCreate,
    TempleReviewRead,
    TempleSearchResponse,
    TempleTimingCreate,
    TempleTimingRead,
    TourGuideCreate,
    TourGuideRead,
    TransportationCreate,
    TransportationRead,
    TravelPackageBookingCreate,
    TravelPackageBookingRead,
    TravelPackageCreate,
    TravelPackageRead,
    TripPlannerRequest,
    TripPlannerResponse,
    VoiceAssistantRequest,
)
from backend.app.schemas.platform import NotificationRead, StandardResponse
from backend.app.services.namo import (
    ai_answer,
    analytics_summary,
    cancel_darshan_booking,
    create_accommodation_booking,
    create_darshan_booking,
    create_donation,
    create_namo_notification,
    create_travel_booking,
    darshan_booking_to_read,
    festival_reminders,
    get_temple_or_404,
    nearby_temples,
    plan_trip,
    popular_temples,
    search_temples,
    temple_to_detail,
    temple_to_read,
)

router = APIRouter(prefix="/namo", tags=["namo-setu"])
admin_dependency = Depends(require_permission(PermissionName.CONFIG_READ))


def _pages(total: int, page_size: int) -> int:
    return (total + page_size - 1) // page_size if total else 0


async def _count(session: AsyncSession, stmt) -> int:
    return int((await session.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one())


async def _temple_exists(session: AsyncSession, temple_id: str) -> None:
    if await session.get(Temple, temple_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Temple not found")


@router.get("/temples", response_model=TempleListResponse)
async def list_temples(
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    state_id: str | None = None,
    city_id: str | None = None,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> TempleListResponse:
    """List active temple profiles with search and location filters."""

    items, total, _ = await search_temples(db, query=search, state_id=state_id, city_id=city_id, category=category, page=page, page_size=page_size)
    return TempleListResponse(items=items, page=page, page_size=page_size, total=total, pages=_pages(total, page_size))


@router.post("/temples", response_model=TempleRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_temple(payload: TempleCreate, db: AsyncSession = Depends(get_db)) -> TempleRead:
    """Create a temple profile for the Namo Setu catalog."""

    temple = Temple(**payload.model_dump())
    db.add(temple)
    await db.commit()
    await db.refresh(temple)
    return await temple_to_read(db, temple)


@router.get("/temples/{temple_id}", response_model=TempleDetailRead)
async def get_temple(temple_id: str, db: AsyncSession = Depends(get_db)) -> TempleDetailRead:
    temple = await get_temple_or_404(db, temple_id)
    return await temple_to_detail(db, temple)


@router.patch("/temples/{temple_id}", response_model=TempleRead, dependencies=[admin_dependency])
async def update_temple(temple_id: str, payload: dict, db: AsyncSession = Depends(get_db)) -> TempleRead:
    """Patch temple fields without replacing related content."""

    temple = await db.get(Temple, temple_id)
    if temple is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Temple not found")
    allowed = set(TempleCreate.model_fields) - {"city_id", "state_id", "country_id", "address_id"}
    for key, value in payload.items():
        if key in allowed:
            setattr(temple, key, value)
    await db.commit()
    await db.refresh(temple)
    return await temple_to_read(db, temple)


@router.delete("/temples/{temple_id}", response_model=StandardResponse[str], dependencies=[admin_dependency])
async def delete_temple(temple_id: str, db: AsyncSession = Depends(get_db)) -> StandardResponse[str]:
    temple = await db.get(Temple, temple_id)
    if temple is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Temple not found")
    temple.is_active = False
    temple.soft_delete()
    await db.commit()
    return StandardResponse(message="Temple archived", data=temple_id)


@router.post("/temples/{temple_id}/images", response_model=TempleImageRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def add_temple_image(temple_id: str, payload: TempleImageCreate, db: AsyncSession = Depends(get_db)) -> TempleImageRead:
    await _temple_exists(db, temple_id)
    item = TempleImage(temple_id=temple_id, **payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return TempleImageRead.model_validate(item)


@router.get("/temples/{temple_id}/timings", response_model=list[TempleTimingRead])
async def list_temple_timings(temple_id: str, db: AsyncSession = Depends(get_db)) -> list[TempleTimingRead]:
    result = await db.execute(select(TempleTiming).where(TempleTiming.temple_id == temple_id, TempleTiming.deleted_at.is_(None)).order_by(TempleTiming.day_of_week.asc()))
    return [TempleTimingRead.model_validate(item) for item in result.scalars().all()]


@router.post("/temples/{temple_id}/timings", response_model=TempleTimingRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def add_temple_timing(temple_id: str, payload: TempleTimingCreate, db: AsyncSession = Depends(get_db)) -> TempleTimingRead:
    await _temple_exists(db, temple_id)
    item = TempleTiming(temple_id=temple_id, **payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return TempleTimingRead.model_validate(item)


@router.post("/temples/{temple_id}/festivals", response_model=FestivalRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def add_festival(temple_id: str, payload: FestivalCreate, db: AsyncSession = Depends(get_db)) -> FestivalRead:
    await _temple_exists(db, temple_id)
    item = Festival(temple_id=temple_id, **payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return FestivalRead.model_validate(item)


@router.post("/temples/{temple_id}/events", response_model=TempleEventRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def add_event(temple_id: str, payload: TempleEventCreate, db: AsyncSession = Depends(get_db)) -> TempleEventRead:
    await _temple_exists(db, temple_id)
    item = TempleEvent(temple_id=temple_id, **payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return TempleEventRead.model_validate(item)


@router.post("/temples/{temple_id}/attractions", response_model=NearbyAttractionRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def add_attraction(temple_id: str, payload: NearbyAttractionCreate, db: AsyncSession = Depends(get_db)) -> NearbyAttractionRead:
    await _temple_exists(db, temple_id)
    item = NearbyAttraction(temple_id=temple_id, **payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return NearbyAttractionRead.model_validate(item)


@router.get("/temples/{temple_id}/reviews", response_model=list[TempleReviewRead])
async def list_reviews(temple_id: str, db: AsyncSession = Depends(get_db)) -> list[TempleReviewRead]:
    result = await db.execute(select(TempleReview).where(TempleReview.temple_id == temple_id, TempleReview.deleted_at.is_(None)).order_by(TempleReview.created_at.desc()))
    return [TempleReviewRead.model_validate(item) for item in result.scalars().all()]


@router.post("/temples/{temple_id}/reviews", response_model=TempleReviewRead, status_code=status.HTTP_201_CREATED)
async def add_review(
    temple_id: str,
    payload: TempleReviewCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TempleReviewRead:
    await _temple_exists(db, temple_id)
    review = TempleReview(temple_id=temple_id, user_id=user.id, is_verified=True, **payload.model_dump())
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return TempleReviewRead.model_validate(review)


@router.get("/search/temples", response_model=TempleSearchResponse)
async def search_temple_catalog(
    q: str | None = None,
    state_id: str | None = None,
    city_id: str | None = None,
    category: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
) -> TempleSearchResponse:
    items, total, suggestions = await search_temples(db, query=q, state_id=state_id, city_id=city_id, category=category, page=page, page_size=page_size)
    return TempleSearchResponse(items=items, page=page, page_size=page_size, total=total, pages=_pages(total, page_size), suggestions=suggestions)


@router.post("/search/nearby", response_model=list[TempleRead])
async def search_nearby_temples(payload: NearbyTempleRequest, db: AsyncSession = Depends(get_db)) -> list[TempleRead]:
    return await nearby_temples(db, payload)


@router.get("/search/popular", response_model=list[TempleRead])
async def list_popular_temples(limit: int = 10, db: AsyncSession = Depends(get_db)) -> list[TempleRead]:
    return await popular_temples(db, limit=limit)


@router.post("/search/recommendations", response_model=AIAssistantResponse)
async def ai_temple_recommendations(payload: AIAssistantRequest, db: AsyncSession = Depends(get_db)) -> AIAssistantResponse:
    response = await ai_answer(db, message=payload.message, temple_id=payload.temple_id, mode="recommendation")
    await db.commit()
    return response


@router.post("/darshan/slots", response_model=DarshanSlotRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_darshan_slot(payload: DarshanSlotCreate, db: AsyncSession = Depends(get_db)) -> DarshanSlotRead:
    await _temple_exists(db, payload.temple_id)
    slot = DarshanSlot(**payload.model_dump())
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return DarshanSlotRead.model_validate(slot).model_copy(update={"available_count": slot.capacity - slot.booked_count})


@router.get("/temples/{temple_id}/darshan/slots", response_model=list[DarshanSlotRead])
async def list_darshan_slots(temple_id: str, db: AsyncSession = Depends(get_db)) -> list[DarshanSlotRead]:
    result = await db.execute(select(DarshanSlot).where(DarshanSlot.temple_id == temple_id, DarshanSlot.deleted_at.is_(None)).order_by(DarshanSlot.slot_date.asc(), DarshanSlot.start_time.asc()))
    return [
        DarshanSlotRead.model_validate(item).model_copy(update={"available_count": max(item.capacity - item.booked_count, 0)})
        for item in result.scalars().all()
    ]


@router.patch("/darshan/slots/{slot_id}", response_model=DarshanSlotRead, dependencies=[admin_dependency])
async def update_darshan_slot(slot_id: str, payload: DarshanSlotUpdate, db: AsyncSession = Depends(get_db)) -> DarshanSlotRead:
    slot = await db.get(DarshanSlot, slot_id)
    if slot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Darshan slot not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(slot, key, value)
    await db.commit()
    await db.refresh(slot)
    return DarshanSlotRead.model_validate(slot).model_copy(update={"available_count": max(slot.capacity - slot.booked_count, 0)})


@router.post("/darshan/bookings", response_model=DarshanBookingRead, status_code=status.HTTP_201_CREATED)
async def book_darshan(
    payload: DarshanBookingCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DarshanBookingRead:
    booking = await create_darshan_booking(db, payload, user)
    await db.commit()
    await db.refresh(booking)
    return darshan_booking_to_read(booking)


@router.get("/darshan/bookings", response_model=list[DarshanBookingRead])
async def my_darshan_bookings(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> list[DarshanBookingRead]:
    result = await db.execute(select(NamoBooking).where(NamoBooking.user_id == user.id, NamoBooking.deleted_at.is_(None)).order_by(NamoBooking.created_at.desc()))
    return [darshan_booking_to_read(item) for item in result.scalars().all()]


@router.post("/darshan/bookings/{booking_id}/cancel", response_model=DarshanBookingRead)
async def cancel_booking(
    booking_id: str,
    payload: BookingCancellationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DarshanBookingRead:
    booking = await cancel_darshan_booking(db, booking_id, user, payload.reason)
    await db.commit()
    await db.refresh(booking)
    return darshan_booking_to_read(booking)


@router.get("/darshan/bookings/{booking_id}/qr", response_model=StandardResponse[str])
async def booking_qr_ticket(booking_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> StandardResponse[str]:
    booking = await db.get(NamoBooking, booking_id)
    if booking is None or booking.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return StandardResponse(message="QR ticket generated", data=darshan_booking_to_read(booking).qr_ticket)


@router.post("/puja/packages", response_model=PujaRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_puja(payload: PujaCreate, db: AsyncSession = Depends(get_db)) -> PujaRead:
    await _temple_exists(db, payload.temple_id)
    item = Puja(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return PujaRead.model_validate(item)


@router.get("/temples/{temple_id}/puja/packages", response_model=list[PujaRead])
async def list_puja_packages(temple_id: str, db: AsyncSession = Depends(get_db)) -> list[PujaRead]:
    result = await db.execute(select(Puja).where(Puja.temple_id == temple_id, Puja.deleted_at.is_(None)).order_by(Puja.base_price.asc()))
    return [PujaRead.model_validate(item) for item in result.scalars().all()]


@router.post("/puja/pandits", response_model=PanditRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_pandit(payload: PanditCreate, db: AsyncSession = Depends(get_db)) -> PanditRead:
    await _temple_exists(db, payload.temple_id)
    item = Pandit(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return PanditRead.model_validate(item)


@router.get("/temples/{temple_id}/puja/pandits", response_model=list[PanditRead])
async def list_pandits(temple_id: str, db: AsyncSession = Depends(get_db)) -> list[PanditRead]:
    result = await db.execute(select(Pandit).where(Pandit.temple_id == temple_id, Pandit.is_active.is_(True), Pandit.deleted_at.is_(None)).order_by(Pandit.name.asc()))
    return [PanditRead.model_validate(item) for item in result.scalars().all()]


@router.post("/puja/bookings", response_model=PujaBookingRead, status_code=status.HTTP_201_CREATED)
async def book_puja(payload: PujaBookingCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> PujaBookingRead:
    puja = await db.get(Puja, payload.puja_id)
    if puja is None or puja.temple_id != payload.temple_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Puja package not found")
    booking = PujaBooking(
        user_id=user.id,
        status=PujaStatus.SCHEDULED.value,
        amount=puja.base_price,
        **payload.model_dump(),
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return PujaBookingRead.model_validate(booking)


@router.get("/puja/bookings", response_model=list[PujaBookingRead])
async def my_puja_bookings(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> list[PujaBookingRead]:
    result = await db.execute(select(PujaBooking).where(PujaBooking.user_id == user.id, PujaBooking.deleted_at.is_(None)).order_by(PujaBooking.created_at.desc()))
    return [PujaBookingRead.model_validate(item) for item in result.scalars().all()]


@router.post("/donations", response_model=DonationRead, status_code=status.HTTP_201_CREATED)
async def donate(payload: DonationCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> DonationRead:
    donation = await create_donation(db, payload, user)
    await db.commit()
    await db.refresh(donation)
    return DonationRead.model_validate(donation).model_copy(update={"receipt_number": donation.donation_reference})


@router.get("/donations", response_model=list[DonationRead])
async def donation_history(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> list[DonationRead]:
    from backend.app.models.namo_setu import Donation

    result = await db.execute(select(Donation).where(Donation.user_id == user.id, Donation.deleted_at.is_(None)).order_by(Donation.created_at.desc()))
    return [DonationRead.model_validate(item).model_copy(update={"receipt_number": item.donation_reference}) for item in result.scalars().all()]


@router.get("/donations/{donation_id}/receipt", response_model=DonationRead)
async def donation_receipt(donation_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> DonationRead:
    from backend.app.models.namo_setu import Donation

    donation = await db.get(Donation, donation_id)
    if donation is None or donation.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donation not found")
    return DonationRead.model_validate(donation).model_copy(update={"receipt_number": donation.donation_reference})


@router.post("/accommodation", response_model=AccommodationRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_accommodation(payload: AccommodationCreate, db: AsyncSession = Depends(get_db)) -> AccommodationRead:
    item = Accommodation(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return AccommodationRead.model_validate(item)


@router.get("/accommodation", response_model=list[AccommodationRead])
async def list_accommodation(temple_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[AccommodationRead]:
    stmt = select(Accommodation).where(Accommodation.is_active.is_(True), Accommodation.deleted_at.is_(None))
    if temple_id:
        stmt = stmt.where(Accommodation.temple_id == temple_id)
    result = await db.execute(stmt.order_by(Accommodation.name.asc()))
    return [AccommodationRead.model_validate(item) for item in result.scalars().all()]


@router.post("/accommodation/hotels", response_model=HotelRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_hotel(payload: HotelCreate, db: AsyncSession = Depends(get_db)) -> HotelRead:
    item = Hotel(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return HotelRead.model_validate(item)


@router.post("/accommodation/rooms", response_model=RoomRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_room(payload: RoomCreate, db: AsyncSession = Depends(get_db)) -> RoomRead:
    item = Room(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return RoomRead.model_validate(item)


@router.get("/accommodation/rooms", response_model=list[RoomRead])
async def list_rooms(hotel_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[RoomRead]:
    stmt = select(Room).where(Room.is_active.is_(True), Room.deleted_at.is_(None))
    if hotel_id:
        stmt = stmt.where(Room.hotel_id == hotel_id)
    result = await db.execute(stmt.order_by(Room.price_per_night.asc()))
    return [RoomRead.model_validate(item) for item in result.scalars().all()]


@router.post("/accommodation/bookings", response_model=AccommodationBookingRead, status_code=status.HTTP_201_CREATED)
async def book_accommodation(
    payload: AccommodationBookingCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AccommodationBookingRead:
    booking = await create_accommodation_booking(db, user=user, **payload.model_dump())
    await db.commit()
    await db.refresh(booking)
    return AccommodationBookingRead.model_validate(booking)


@router.get("/accommodation/bookings", response_model=list[AccommodationBookingRead])
async def my_accommodation_bookings(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> list[AccommodationBookingRead]:
    result = await db.execute(select(AccommodationBooking).where(AccommodationBooking.user_id == user.id, AccommodationBooking.deleted_at.is_(None)).order_by(AccommodationBooking.created_at.desc()))
    return [AccommodationBookingRead.model_validate(item) for item in result.scalars().all()]


@router.post("/travel/routes", response_model=PilgrimageRouteRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_route(payload: PilgrimageRouteCreate, db: AsyncSession = Depends(get_db)) -> PilgrimageRouteRead:
    item = PilgrimageRoute(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return PilgrimageRouteRead.model_validate(item)


@router.get("/travel/routes", response_model=list[PilgrimageRouteRead])
async def list_routes(city_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[PilgrimageRouteRead]:
    stmt = select(PilgrimageRoute).where(PilgrimageRoute.is_active.is_(True), PilgrimageRoute.deleted_at.is_(None))
    if city_id:
        stmt = stmt.where((PilgrimageRoute.origin_city_id == city_id) | (PilgrimageRoute.destination_city_id == city_id))
    result = await db.execute(stmt.order_by(PilgrimageRoute.name.asc()))
    return [PilgrimageRouteRead.model_validate(item) for item in result.scalars().all()]


@router.post("/travel/transport", response_model=TransportationRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_transport(payload: TransportationCreate, db: AsyncSession = Depends(get_db)) -> TransportationRead:
    item = Transportation(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return TransportationRead.model_validate(item)


@router.get("/travel/transport", response_model=list[TransportationRead])
async def list_transport(temple_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[TransportationRead]:
    stmt = select(Transportation).where(Transportation.is_active.is_(True), Transportation.deleted_at.is_(None))
    if temple_id:
        stmt = stmt.where(Transportation.temple_id == temple_id)
    result = await db.execute(stmt.order_by(Transportation.provider_name.asc()))
    return [TransportationRead.model_validate(item) for item in result.scalars().all()]


@router.post("/travel/packages", response_model=TravelPackageRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_travel_package(payload: TravelPackageCreate, db: AsyncSession = Depends(get_db)) -> TravelPackageRead:
    item = TravelPackage(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return TravelPackageRead.model_validate(item)


@router.get("/travel/packages", response_model=list[TravelPackageRead])
async def list_travel_packages(temple_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[TravelPackageRead]:
    stmt = select(TravelPackage).where(TravelPackage.is_active.is_(True), TravelPackage.deleted_at.is_(None))
    if temple_id:
        stmt = stmt.where(TravelPackage.temple_id == temple_id)
    result = await db.execute(stmt.order_by(TravelPackage.price.asc()))
    return [TravelPackageRead.model_validate(item) for item in result.scalars().all()]


@router.post("/travel/guides", response_model=TourGuideRead, status_code=status.HTTP_201_CREATED, dependencies=[admin_dependency])
async def create_guide(payload: TourGuideCreate, db: AsyncSession = Depends(get_db)) -> TourGuideRead:
    item = TourGuide(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return TourGuideRead.model_validate(item)


@router.get("/travel/guides", response_model=list[TourGuideRead])
async def list_guides(city_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[TourGuideRead]:
    stmt = select(TourGuide).where(TourGuide.is_active.is_(True), TourGuide.deleted_at.is_(None))
    if city_id:
        stmt = stmt.where(TourGuide.city_id == city_id)
    result = await db.execute(stmt.order_by(TourGuide.rating_avg.desc(), TourGuide.name.asc()))
    return [TourGuideRead.model_validate(item) for item in result.scalars().all()]


@router.post("/travel/planner", response_model=TripPlannerResponse)
async def trip_planner(payload: TripPlannerRequest, db: AsyncSession = Depends(get_db)) -> TripPlannerResponse:
    return await plan_trip(db, payload)


@router.post("/travel/bookings", response_model=TravelPackageBookingRead, status_code=status.HTTP_201_CREATED)
async def book_travel(payload: TravelPackageBookingCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> TravelPackageBookingRead:
    booking = await create_travel_booking(db, user=user, **payload.model_dump())
    await db.commit()
    await db.refresh(booking)
    return TravelPackageBookingRead.model_validate(booking)


@router.get("/travel/bookings", response_model=list[TravelPackageBookingRead])
async def my_travel_bookings(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> list[TravelPackageBookingRead]:
    result = await db.execute(select(TravelPackageBooking).where(TravelPackageBooking.user_id == user.id, TravelPackageBooking.deleted_at.is_(None)).order_by(TravelPackageBooking.created_at.desc()))
    return [TravelPackageBookingRead.model_validate(item) for item in result.scalars().all()]


@router.get("/notifications", response_model=list[NotificationRead])
async def list_namo_notifications(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> list[NotificationRead]:
    result = await db.execute(
        select(Notification)
        .where(Notification.product_code == ProductCode.NAMO_SETU.value, Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
    )
    return [NotificationRead.model_validate(item) for item in result.scalars().all()]


@router.post("/notifications", response_model=NotificationRead, status_code=status.HTTP_201_CREATED)
async def create_notification(title: str, message: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> NotificationRead:
    notification = await create_namo_notification(db, user.id, title, message)
    await db.commit()
    await db.refresh(notification)
    return NotificationRead.model_validate(notification)


@router.post("/analytics/events", response_model=StandardResponse[str])
async def track_event(payload: AnalyticsEventCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> StandardResponse[str]:
    event = AnalyticsEvent(product_code=ProductCode.NAMO_SETU.value, user_id=user.id, **payload.model_dump())
    db.add(event)
    await db.commit()
    return StandardResponse(message="Analytics event accepted", data=event.event_name)


@router.get("/analytics/summary", response_model=AnalyticsSummary, dependencies=[admin_dependency])
async def read_analytics_summary(db: AsyncSession = Depends(get_db)) -> AnalyticsSummary:
    return await analytics_summary(db)


@router.post("/ai/spiritual-guide", response_model=AIAssistantResponse)
async def spiritual_guide(payload: AIAssistantRequest, db: AsyncSession = Depends(get_db)) -> AIAssistantResponse:
    response = await ai_answer(db, message=payload.message, temple_id=payload.temple_id, mode="spiritual_guide")
    await db.commit()
    return response


@router.post("/ai/voice-assistant", response_model=AIAssistantResponse)
async def voice_assistant(payload: VoiceAssistantRequest, db: AsyncSession = Depends(get_db)) -> AIAssistantResponse:
    message = payload.transcript or payload.message
    response = await ai_answer(db, message=message, temple_id=payload.temple_id, mode="voice")
    await db.commit()
    return response


@router.post("/ai/nearby", response_model=AIAssistantResponse)
async def nearby_recommendation(payload: AIAssistantRequest, db: AsyncSession = Depends(get_db)) -> AIAssistantResponse:
    response = await ai_answer(db, message=f"nearby recommendation: {payload.message}", temple_id=payload.temple_id, mode="nearby")
    await db.commit()
    return response


@router.post("/ai/faq", response_model=AIAssistantResponse)
async def faq_assistant(payload: AIAssistantRequest, db: AsyncSession = Depends(get_db)) -> AIAssistantResponse:
    response = await ai_answer(db, message=payload.message, temple_id=payload.temple_id, mode="faq")
    await db.commit()
    return response


@router.post("/ai/festival-reminders", response_model=list[FestivalReminderRead])
async def festival_reminder(payload: FestivalReminderRequest, db: AsyncSession = Depends(get_db)) -> list[FestivalReminderRead]:
    return await festival_reminders(db, temple_id=payload.temple_id, state_id=payload.state_id, days_ahead=payload.days_ahead)
