from __future__ import annotations


def test_namo_routes_are_registered(client) -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]

    expected_paths = {
        "/api/v1/namo/temples",
        "/api/v1/namo/search/temples",
        "/api/v1/namo/search/nearby",
        "/api/v1/namo/darshan/bookings",
        "/api/v1/namo/puja/bookings",
        "/api/v1/namo/donations",
        "/api/v1/namo/accommodation/bookings",
        "/api/v1/namo/travel/planner",
        "/api/v1/namo/travel/bookings",
        "/api/v1/namo/ai/spiritual-guide",
        "/api/v1/namo/ai/voice-assistant",
        "/api/v1/namo/analytics/summary",
    }

    assert expected_paths.issubset(paths)
