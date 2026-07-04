from __future__ import annotations

import base64
import json
from datetime import date
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from backend.app.schemas.namo import DarshanBookingCreate, TempleReviewCreate
from backend.app.services.namo import build_qr_ticket, haversine_km, make_reference


def test_make_reference_uses_prefix() -> None:
    reference = make_reference("DARSHAN")

    assert reference.startswith("DARSHAN-")
    assert len(reference.split("-")) == 3


def test_qr_ticket_contains_booking_payload() -> None:
    booking = SimpleNamespace(
        id="booking-1",
        booking_number="DARSHAN-20260701-ABC12345",
        temple_id="temple-1",
        visit_date=date(2026, 7, 8),
        party_size=3,
        booking_status="confirmed",
    )

    ticket = build_qr_ticket(booking)
    payload = json.loads(base64.urlsafe_b64decode(ticket.encode("ascii")).decode("utf-8"))

    assert payload["type"] == "namo_darshan_ticket"
    assert payload["booking_number"] == booking.booking_number
    assert payload["party_size"] == 3


def test_nearby_distance_helper_is_reasonable() -> None:
    distance = haversine_km(25.3176, 82.9739, 25.4358, 81.8463)

    assert 110 <= distance <= 130


def test_booking_party_size_validation() -> None:
    with pytest.raises(ValidationError):
        DarshanBookingCreate(temple_id="temple-1", visit_date=date(2026, 7, 8), party_size=50)


def test_review_rating_validation() -> None:
    with pytest.raises(ValidationError):
        TempleReviewCreate(rating=6)
