"""Tests for maps endpoints."""


def test_nearby_temples(client):
    response = client.get("/api/v1/maps/nearby-temples?lat=25.3176&lng=82.9739&radius_km=50")
    assert response.status_code in (200, 401)


def test_nearby_hotels(client):
    response = client.get("/api/v1/maps/nearby-hotels?lat=25.3176&lng=82.9739&radius_km=10")
    assert response.status_code in (200, 401)


def test_nearby_restaurants(client):
    response = client.get("/api/v1/maps/nearby-restaurants?lat=25.3176&lng=82.9739&radius_km=5")
    assert response.status_code in (200, 401)


def test_emergency_services(client):
    response = client.get("/api/v1/maps/emergency?lat=25.3176&lng=82.9739")
    assert response.status_code in (200, 401)


def test_geocode_requires_auth(client):
    response = client.post("/api/v1/maps/geocode", json={"address": "Varanasi, India"})
    assert response.status_code == 401


def test_directions_requires_auth(client):
    response = client.post("/api/v1/maps/directions", json={"origin_lat": 25.3, "origin_lng": 82.9, "dest_lat": 25.4, "dest_lng": 83.0})
    assert response.status_code == 401
