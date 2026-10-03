"""Tests for Blinkit-like features: live tracking, nearest warehouse, fuzzy search, support chat."""
from types import SimpleNamespace

import pytest

from backend.app.services.fuzzy import correct_query, fuzzy_score
from backend.app.services.geo import estimate_eta_minutes, find_nearest_warehouse, haversine_km
from backend.app.services.support import generate_bot_reply


# ── Geo math ────────────────────────────────────────────────────────────────

def test_haversine_one_degree_latitude():
    # 1 degree of latitude ≈ 111.19 km.
    assert haversine_km(28.0, 77.0, 29.0, 77.0) == pytest.approx(111.19, abs=0.5)


def test_haversine_same_point_is_zero():
    assert haversine_km(28.6, 77.2, 28.6, 77.2) == 0.0


def test_haversine_invalid_coords_raise():
    with pytest.raises(ValueError):
        haversine_km(120.0, 77.0, 28.0, 77.0)
    with pytest.raises(ValueError):
        haversine_km(28.0, 77.0, 28.0, 200.0)


def test_eta_defaults():
    assert estimate_eta_minutes(22.0) == 60  # 22 km @ 22 km/h
    assert estimate_eta_minutes(0.05) == 1  # minimum 1 minute
    with pytest.raises(ValueError):
        estimate_eta_minutes(-1.0)


class _Scalars:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return self._rows


class _ExecResult:
    def __init__(self, rows):
        self._rows = rows

    def scalars(self):
        return _Scalars(self._rows)


class _StubSession:
    def __init__(self, rows):
        self._rows = rows

    async def execute(self, statement):
        return _ExecResult(self._rows)


@pytest.mark.asyncio
async def test_find_nearest_warehouse_picks_closest():
    cp = SimpleNamespace(id="cp", latitude=28.6139, longitude=77.2090)  # Connaught Place
    gurgaon = SimpleNamespace(id="gg", latitude=28.4595, longitude=77.0266)
    session = _StubSession([gurgaon, cp])
    best, km = await find_nearest_warehouse(session, 28.62, 77.21, None)
    assert best is cp
    assert km == pytest.approx(0.7, abs=0.5)


@pytest.mark.asyncio
async def test_find_nearest_warehouse_skips_untagged():
    session = _StubSession([SimpleNamespace(id="x", latitude=None, longitude=None)])
    best, km = await find_nearest_warehouse(session, 28.62, 77.21, None)
    assert best is None and km is None


# ── Fuzzy search ────────────────────────────────────────────────────────────

def test_fuzzy_exact_match_scores_one():
    assert fuzzy_score("cement", "UltraTech Cement 50kg") == pytest.approx(1.0)


def test_fuzzy_typo_matches():
    # "brwn brd" -> "brown bread": vowel-drop skeletons still match.
    assert fuzzy_score("brwn brd", "Brown Bread 500g") >= 0.6


def test_fuzzy_unrelated_scores_zero():
    assert fuzzy_score("cement", "Brown Bread 500g") == 0.0
    assert fuzzy_score("", "Anything") == 0.0


def test_correct_query_picks_best_candidate():
    candidates = ["UltraTech Cement 50kg", "Brown Bread 500g", "Turmeric Powder 200g"]
    assert correct_query("brwn brd", candidates) == "Brown Bread 500g"


def test_correct_query_none_when_exact_or_hopeless():
    candidates = ["UltraTech Cement 50kg"]
    assert correct_query("ultratech cement 50kg", candidates) is None
    assert correct_query("xyzzy plugh", candidates) is None
    assert correct_query("cem", []) is None


# ── Support bot ─────────────────────────────────────────────────────────────

def test_bot_reply_tracking_with_order_status():
    reply = generate_bot_reply("where is my order?", order_status="dispatched")
    assert "live location" in reply.lower()


def test_bot_reply_refund():
    assert "return" in generate_bot_reply("received damaged bag, need refund").lower()


def test_bot_reply_escalation():
    assert "agent" in generate_bot_reply("connect me to a human agent").lower()


def test_bot_reply_default_asks_for_order():
    assert "order id" in generate_bot_reply("hello there").lower()


# ── Endpoints (fake-DB contract) ────────────────────────────────────────────

def test_nearest_warehouse_invalid_coords_rejected(client):
    response = client.get("/api/v1/modit/warehouses/nearest?lat=200&lng=77.2")
    assert response.status_code == 422


def test_nearest_warehouse_no_geo_data_is_404(client):
    response = client.get("/api/v1/modit/warehouses/nearest?lat=28.6&lng=77.2")
    assert response.status_code == 404
    assert "detail" in response.json()


def test_track_delivery_shape(client):
    response = client.get("/api/v1/modit/deliveries/some-id/track")
    assert response.status_code == 200
    data = response.json()
    assert data["delivery_number"] == "DEL-1"
    assert len(data["timeline"]) == 6
    assert {s["key"] for s in data["timeline"]} == {
        "placed", "packed", "dispatched", "out_for_delivery", "arriving", "delivered",
    }


def test_product_search_carries_did_you_mean(client):
    response = client.get("/api/v1/modit/products?search=brwn")
    assert response.status_code == 200
    assert "did_you_mean" in response.json()


def test_support_requires_auth(client):
    response = client.post(
        "/api/v1/modit/support/conversations", json={"subject": "Late delivery"}
    )
    assert response.status_code == 401


def test_delivery_ping_requires_auth(client):
    response = client.post(
        "/api/v1/modit/deliveries/some-id/pings", json={"latitude": 28.6, "longitude": 77.2}
    )
    assert response.status_code == 401
