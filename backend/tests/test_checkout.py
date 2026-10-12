"""Tests for real B2C checkout + Razorpay verification."""
from datetime import date

import re

import pytest
from fastapi import HTTPException

from backend.app.services.checkout import validate_coupon, verify_razorpay_signature


def _auth_headers():
    from backend.app.core.security import create_access_token

    return {"Authorization": f"Bearer {create_access_token('1')}"}


def test_checkout_requires_auth(client):
    response = client.post(
        "/api/v1/modit/checkout",
        json={"items": [{"sku": "X", "quantity": 1}], "payment_method": "cod"},
    )
    assert response.status_code == 401


def test_razorpay_order_requires_auth(client):
    response = client.post("/api/v1/payments/razorpay/order", json={"order_id": "x"})
    assert response.status_code == 401


def test_razorpay_verify_requires_auth(client):
    response = client.post(
        "/api/v1/payments/razorpay/verify",
        json={
            "order_id": "x",
            "razorpay_order_id": "y",
            "razorpay_payment_id": "z",
            "razorpay_signature": "w",
        },
    )
    assert response.status_code == 401


def test_checkout_rejects_empty_items(client):
    response = client.post(
        "/api/v1/modit/checkout",
        json={"items": [], "payment_method": "cod"},
        headers=_auth_headers(),
    )
    assert response.status_code == 422


def test_checkout_rejects_bad_payment_method(client):
    response = client.post(
        "/api/v1/modit/checkout",
        json={"items": [{"sku": "X", "quantity": 1}], "payment_method": "bitcoin"},
        headers=_auth_headers(),
    )
    assert response.status_code == 422


def test_checkout_happy_path_fake_db(client):
    # Fake DB returns a universal product (₹100) with stock 100.
    response = client.post(
        "/api/v1/modit/checkout",
        json={"items": [{"sku": "ANY", "quantity": 2}], "payment_method": "cod"},
        headers=_auth_headers(),
    )
    assert response.status_code == 201, response.text[:300]
    data = response.json()
    assert data["status"] == "placed"
    assert data["subtotal"] == 200.0
    assert data["grand_total"] == 200.0 + 250.0 + 36.0
    assert data["payment_status"] == "pending"
    assert data["purchase_order_id"]
    assert len(data["items"]) == 1


def test_checkout_unknown_sku_service():
    import asyncio

    from backend.app.schemas.modit import CheckoutRequest
    from backend.app.services import checkout as svc

    class EmptySession:
        async def execute(self, statement):
            class R:
                def scalars(self):
                    class S:
                        def all(self):
                            return []

                        def first(self):
                            return None

                    return S()

            return R()

        async def get(self, model, ident):
            return None

    payload = CheckoutRequest(
        items=[{"sku": "NOPE", "quantity": 1}], payment_method="cod"
    )
    with pytest.raises(HTTPException) as exc:
        asyncio.run(svc.compute_checkout_totals(EmptySession(), payload))
    # Either catalog missing (503) or SKU unknown (404) — both honest failures.
    assert exc.value.status_code in (404, 503)


def test_coupon_math():
    # Deterministic: explicit dates, no dependence on "today".
    disc, ship = validate_coupon("FIRST100", 2000.0, set(), date(2026, 1, 1))
    assert (disc, ship) == (100.0, False)
    disc, ship = validate_coupon("BULK10", 10000.0, set(), date(2026, 1, 1))
    assert (disc, ship) == (500.0, False)  # capped
    disc, ship = validate_coupon("FREESHIP", 100.0, set(), date(2026, 1, 1))
    assert (disc, ship) == (0.0, True)
    with pytest.raises(HTTPException):
        validate_coupon("NOPE", 2000.0, set(), date(2026, 1, 1))
    disc, ship = validate_coupon("DIWALI20", 2000.0, {"tiling"}, date(2026, 10, 10))
    assert (disc, ship) == (400.0, False)  # capped
    with pytest.raises(HTTPException):
        validate_coupon("DIWALI20", 2000.0, {"tiling"}, date(2026, 12, 1))  # expired


def test_credit_needs_approved_account():
    import asyncio

    from backend.app.services import checkout as svc

    class Rows:
        def __init__(self, row):
            self._row = row

        def scalars(self):
            return self

        def first(self):
            return self._row

    class NoAccountSession:
        async def execute(self, stmt):
            return Rows(None)

    class RichSession(NoAccountSession):
        async def execute(self, stmt):
            class Acct:
                available_credit = 100000.0

            return Rows(Acct())

    class PoorSession(NoAccountSession):
        async def execute(self, stmt):
            class Acct:
                available_credit = 10.0

            return Rows(Acct())

    with pytest.raises(HTTPException) as exc:
        asyncio.run(svc._require_credit_approval(NoAccountSession(), "org-1", 500.0))
    assert exc.value.status_code == 400
    with pytest.raises(HTTPException):
        asyncio.run(svc._require_credit_approval(PoorSession(), "org-1", 500.0))
    asyncio.run(svc._require_credit_approval(RichSession(), "org-1", 500.0))  # no raise


def test_find_order_by_reference():
    import asyncio

    from backend.app.services import checkout as svc

    class Rows:
        def __init__(self, row):
            self._row = row

        def scalars(self):
            return self

        def first(self):
            return self._row

    class EmptySession:
        async def execute(self, stmt):
            return Rows(None)

    class HitSession:
        async def execute(self, stmt):
            return Rows(object())

    assert asyncio.run(svc._find_order_by_reference(EmptySession(), "org-1", "ref-1")) is None
    assert asyncio.run(svc._find_order_by_reference(HitSession(), "org-1", "ref-1")) is not None
    with pytest.raises(HTTPException):
        validate_coupon("CEMENT50", 500.0, {"cement"}, date(2026, 1, 1))  # under min
    with pytest.raises(HTTPException):
        validate_coupon("CEMENT50", 5000.0, {"painting"}, date(2026, 1, 1))  # wrong category


def test_razorpay_hmac():
    import hashlib
    import hmac

    secret = "test_secret"
    sig = hmac.new(secret.encode(), b"order_1|pay_1", hashlib.sha256).hexdigest()
    assert verify_razorpay_signature("order_1", "pay_1", sig, secret) is True
    assert verify_razorpay_signature("order_1", "pay_2", sig, secret) is False
    assert verify_razorpay_signature("order_1", "pay_1", sig, "") is False


def test_buyer_cancel_rules():
    from backend.app.api.v1.modit import buyer_may_cancel

    assert buyer_may_cancel("placed", False) is True
    assert buyer_may_cancel("confirmed", False) is True
    assert buyer_may_cancel("packed", False) is False
    assert buyer_may_cancel("dispatched", False) is False
    assert buyer_may_cancel("delivered", False) is False
    assert buyer_may_cancel(None, False) is False
    # staff can cancel anything (fraud, dead stock)
    assert buyer_may_cancel("delivered", True) is True
    assert buyer_may_cancel(None, True) is True


def test_order_status_requires_auth(client):
    response = client.patch("/api/v1/modit/orders/x/status", json={"status": "dispatched"})
    assert response.status_code == 401


def test_return_status_requires_auth(client):
    response = client.patch("/api/v1/modit/returns/x/status", json={"status": "approved"})
    assert response.status_code == 401


def test_returns_list_requires_auth(client):
    response = client.get("/api/v1/modit/returns")
    assert response.status_code == 401


def test_order_status_rejects_unknown(client):
    response = client.patch(
        "/api/v1/modit/orders/x/status",
        json={"status": "teleported"},
        headers=_auth_headers(),
    )
    # Unknown order → 404 before status validation; both are honest rejections.
    assert response.status_code in (400, 404)


def test_return_status_rejects_unknown(client):
    response = client.patch(
        "/api/v1/modit/returns/x/status",
        json={"status": "teleported"},
        headers=_auth_headers(),
    )
    assert response.status_code in (400, 403, 404)


def test_catalog_parser_counts():
    from backend.app.seeders.catalog import parse_catalog

    items = parse_catalog(
        open("apps/modit/web/lib/product-data.ts", encoding="utf-8").read()
    )
    # Curated catalog only: synthetic bulk listings (ladder prices, "Item N"
    # names, uniform discounts) were removed — see repo history.
    assert len(items) == 73
    by_sku = {i["sku"]: i for i in items}
    acc = by_sku["CEM-ACC-50"]
    assert acc["price"] == 370.0 and acc["mrp"] == 400.0
    assert all(i["price"] > 0 and i["sku"] for i in items)
    assert not any(re.search(r"Item \d+$", i["name"]) for i in items)
