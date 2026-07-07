"""Tests for AI endpoints."""
import pytest


def test_ai_chat_requires_auth(client):
    response = client.post("/api/v1/ai/chat", json={"message": "Hello"})
    assert response.status_code == 401


def test_material_recommendation_requires_auth(client):
    response = client.post("/api/v1/ai/material-recommendation", json={"requirements": "cement", "budget": 10000, "location": "Delhi"})
    assert response.status_code == 401


def test_boq_reader_requires_auth(client):
    response = client.post("/api/v1/ai/boq-reader", json={"boq_text": "10 bags cement"})
    assert response.status_code == 401


def test_travel_planner_requires_auth(client):
    response = client.post("/api/v1/ai/travel-planner", json={"destination": "Varanasi", "dates": "2025-03-01 to 2025-03-05", "budget": 50000, "preferences": "spiritual"})
    assert response.status_code == 401


def test_temple_recommendation_requires_auth(client):
    response = client.post("/api/v1/ai/temple-recommendation", json={"preferences": "ancient", "location": "UP", "budget": 10000})
    assert response.status_code == 401


def test_ai_sessions_requires_auth(client):
    response = client.get("/api/v1/ai/sessions")
    assert response.status_code == 401


def test_price_prediction_requires_auth(client):
    response = client.post("/api/v1/ai/price-prediction", json={"product_name": "cement", "quantity": 100, "location": "Delhi"})
    assert response.status_code == 401
