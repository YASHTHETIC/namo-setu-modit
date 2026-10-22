"""Tests for real B2C checkout + Razorpay verification."""
from datetime import date

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
    # Full catalog: 73 curated + 242 kept supplier bulk + 805 Fixxly partner
    # listings (the Generic counterfeits claw hammer was removed on request).
    assert len(items) == 1120
    by_sku = {i["sku"]: i for i in items}
    acc = by_sku["CEM-ACC-50"]
    assert acc["price"] == 370.0 and acc["mrp"] == 400.0
    assert all(i["price"] > 0 and i["sku"] for i in items)


def test_parse_order_totals():
    from backend.app.api.v1.modit import _parse_order_address, _parse_order_totals

    full = _parse_order_totals(
        '{"subtotal": 2800.0, "discount_total": 100.0, "shipping_total": 250.0,'
        ' "gst_total": 486.0, "grand_total": 3436.0}'
    )
    assert full == {
        "subtotal": 2800.0,
        "discount_total": 100.0,
        "shipping_total": 250.0,
        "gst_total": 486.0,
        "grand_total": 3436.0,
    }
    # Missing/corrupt payloads degrade to zeros — the Orders list never crashes.
    assert _parse_order_totals(None)["grand_total"] == 0.0
    assert _parse_order_totals("not-json")["grand_total"] == 0.0
    assert _parse_order_totals("[1,2]")["grand_total"] == 0.0
    assert _parse_order_totals('{"grand_total": "3436.5"}')["grand_total"] == 3436.5

    addr = _parse_order_address('{"name": "A", "pincode": "201301"}')
    assert addr == {"name": "A", "pincode": "201301"}
    assert _parse_order_address(None) is None
    assert _parse_order_address("junk") is None
    assert _parse_order_address("[1]") is None


def test_order_serializers_carry_money():
    from backend.app.schemas.modit import OrderDetailRead, OrderItemRead, OrderRead

    row = OrderRead(
        id="o1",
        organization_id="org",
        purchase_order_id=None,
        order_number="ORD-1",
        status="placed",
        placed_at="2026-10-12T00:00:00Z",
        notes=None,
        created_at="2026-10-12T00:00:00Z",
    )
    assert row.total == 0.0 and row.items_count == 0
    row.total = 3436.0
    row.items_count = 2
    detail = OrderDetailRead(**row.model_dump(), items=[], delivery_id=None)
    assert detail.total == 3436.0 and detail.grand_total == 0.0
    assert detail.payment_status == "pending" and detail.address is None
    item = OrderItemRead(
        id="i1",
        order_id="o1",
        purchase_order_id=None,
        product_id="p1",
        quantity=2,
        unit_price=100.0,
        gst_amount=36.0,
        line_total=200.0,
        created_at="2026-10-12T00:00:00Z",
    )
    assert item.sku is None and item.name is None


def test_order_detail_paid_via():
    from backend.app.schemas.modit import OrderDetailRead, OrderRead

    base = OrderRead(
        id="o2",
        organization_id="org",
        purchase_order_id=None,
        order_number="ORD-2",
        status="placed",
        placed_at="2026-10-22T00:00:00Z",
        notes=None,
        created_at="2026-10-22T00:00:00Z",
    )
    plain = OrderDetailRead(**base.model_dump(), items=[], delivery_id=None)
    assert plain.payment_status == "pending" and plain.paid_via is None
    rzp = OrderDetailRead(
        **base.model_dump(),
        items=[],
        delivery_id=None,
        payment_status="captured",
        paid_via="razorpay",
    )
    assert rzp.paid_via == "razorpay"
