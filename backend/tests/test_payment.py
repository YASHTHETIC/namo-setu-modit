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


def test_webhook_rejects_garbage_signature():
    import pytest
    from fastapi import HTTPException

    from backend.app.services.payment_service import _verify_webhook_signature

    with pytest.raises(HTTPException) as exc:
        _verify_webhook_signature(b"{}", "test", "secret")
    assert exc.value.status_code == 400


def test_webhook_rejects_stale_timestamp():
    import hashlib
    import hmac
    import time

    import pytest
    from fastapi import HTTPException

    from backend.app.services.payment_service import _verify_webhook_signature

    secret = "whsec_test"
    stale_ts = str(int(time.time()) - 3600)
    payload = b'{"id":"evt_test","type":"charge.refunded","data":{"object":{}}}'
    sig = hmac.new(secret.encode(), f"{stale_ts}.{payload.decode()}".encode(), hashlib.sha256).hexdigest()
    with pytest.raises(HTTPException) as exc:
        _verify_webhook_signature(payload, f"t={stale_ts},v1={sig}", secret)
    assert exc.value.status_code == 400
    assert "Stale" in exc.value.detail


def test_webhook_accepts_fresh_valid_signature():
    import hashlib
    import hmac
    import time

    from backend.app.services.payment_service import _verify_webhook_signature

    secret = "whsec_test"
    ts = str(int(time.time()))
    payload = b'{"id":"evt_test","type":"charge.refunded","data":{"object":{}}}'
    sig = hmac.new(secret.encode(), f"{ts}.{payload.decode()}".encode(), hashlib.sha256).hexdigest()
    event = _verify_webhook_signature(payload, f"t={ts},v1={sig}", secret)
    assert event["id"] == "evt_test"
