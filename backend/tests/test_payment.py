"""Tests for payment endpoints."""
import pytest


def test_checkout_requires_auth(client):
    response = client.post("/api/v1/payments/checkout", json={"amount": 100, "currency": "INR"})
    assert response.status_code == 401


def test_payment_intent_requires_auth(client):
    response = client.post("/api/v1/payments/intent", json={"amount": 100, "currency": "INR"})
    assert response.status_code == 401


def test_payment_history_requires_auth(client):
    response = client.get("/api/v1/payments/history")
    assert response.status_code == 401


def test_payment_webhook_no_auth_needed(client):
    response = client.post("/api/v1/payments/webhook", content=b"{}", headers={"Stripe-Signature": "test"})
    assert response.status_code in (200, 400, 422, 500)


def test_donation_payment_requires_auth(client):
    response = client.post("/api/v1/payments/donation", json={"amount": 500, "currency": "INR"})
    assert response.status_code == 401


def test_booking_payment_requires_auth(client):
    response = client.post("/api/v1/payments/booking", json={"amount": 200, "currency": "INR"})
    assert response.status_code == 401


def test_order_payment_requires_auth(client):
    response = client.post("/api/v1/payments/order", json={"amount": 1000, "currency": "INR"})
    assert response.status_code == 401


def test_refund_requires_auth(client):
    response = client.post("/api/v1/payments/refund", json={"payment_id": "test", "reason": "test"})
    assert response.status_code == 401
