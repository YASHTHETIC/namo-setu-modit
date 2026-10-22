"""Tests for payment endpoints."""
import pytest


def test_razorpay_order_requires_auth(client):
    response = client.post("/api/v1/payments/razorpay/order", json={"order_id": "test"})
    assert response.status_code == 401


def test_razorpay_verify_requires_auth(client):
    response = client.post(
        "/api/v1/payments/razorpay/verify",
        json={
            "order_id": "test",
            "razorpay_order_id": "order_x",
            "razorpay_payment_id": "pay_x",
            "razorpay_signature": "sig",
        },
    )
    assert response.status_code == 401


def test_payment_history_requires_auth(client):
    response = client.get("/api/v1/payments/history")
    assert response.status_code == 401


def test_legacy_stripe_routes_removed(client):
    # Razorpay replaced Stripe checkout/intent/webhook flows — the old
    # routes must not half-exist (they served 500s via signature drift).
    for path in (
        "/api/v1/payments/checkout",
        "/api/v1/payments/intent",
        "/api/v1/payments/webhook",
        "/api/v1/payments/donation",
        "/api/v1/payments/booking",
        "/api/v1/payments/order",
        "/api/v1/payments/refund",
        "/api/v1/payments/pay_xyz",
    ):
        assert client.post(path, json={}).status_code == 404
        assert client.get(path).status_code == 404


def test_webhook_signature_helper_still_rejects_garbage():
    from fastapi import HTTPException

    from backend.app.services.payment_service import _verify_webhook_signature

    with pytest.raises(HTTPException) as exc:
        _verify_webhook_signature(b"{}", "test", "secret")
    assert exc.value.status_code == 400


def test_webhook_signature_helper_rejects_stale_timestamp():
    import hashlib
    import hmac
    import time

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


def test_webhook_signature_helper_accepts_fresh_valid_signature():
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
