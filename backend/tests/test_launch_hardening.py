"""Launch-hardening regression tests.

Covers the money-path rework (Razorpay charges the stored server grand total,
verify is bound to OUR razorpay order + remote amount check), org-trust
scoping on staff-write endpoints, and half-up ledger rounding.
"""
import hashlib
import hmac as hmac_mod
from datetime import date
from typing import Any

import pytest
from fastapi import HTTPException

from backend.app.services import razorpay as rzp
from backend.app.services.checkout import money, validate_coupon
from backend.app.services.checkout import verify_razorpay_signature as _sig


def _auth_headers():
    from backend.app.core.security import create_access_token

    return {"Authorization": f"Bearer {create_access_token('1')}"}


def _staff_headers():
    from backend.app.core.security import create_access_token

    return {"Authorization": f"Bearer {create_access_token('staff-1')}"}


# ---------------------------------------------------------------------------
# money(): half-up ledger rounding (Python round() is banker's — wrong for ₹)
# ---------------------------------------------------------------------------
def test_money_half_up():
    assert money(2.675) == 2.68
    assert money(1.005) == 1.01
    assert money(0.125) == 0.13
    assert money(4385.994999) == 4385.99
    assert money(10.0) == 10.0


def test_coupon_discount_rounds_half_up():
    # 15% of ₹1333.50 = ₹200.025 → half-up = 200.03 (round() would
    # return 200.02 because 200.025 stores just below the midpoint).
    disc, ship = validate_coupon("PAINT15", 1333.5, {"painting"}, date(2026, 10, 1))
    assert (disc, ship) == (200.03, False)


# ---------------------------------------------------------------------------
# Razorpay: charge the stored server grand total (payment.amount)
# ---------------------------------------------------------------------------
class FakeScalar:
    def __init__(self, data):
        self._data = data

    def first(self):
        return self._data[0] if self._data else None

    def all(self):
        return self._data


class FakeResult:
    def __init__(self, data):
        self._data = data

    def scalars(self):
        return FakeScalar(self._data)


class FakeSession:
    """Pops a canned result in call order; records added rows."""

    def __init__(self, results):
        self._results = list(results)
        self.added: list[Any] = []

    async def execute(self, stmt):
        return self._results.pop(0)

    async def get(self, model, ident):
        return self._results.pop(0)

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        pass

    async def refresh(self, obj, attribute_names=None):
        pass


class _Resp:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


def _hmac(order_id: str, payment_id: str, secret: str) -> str:
    return hmac_mod.new(
        secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256
    ).hexdigest()


@pytest.fixture
def rzp_keys(monkeypatch):
    monkeypatch.setattr(rzp, "_require_keys", lambda: ("key_id_test", "key_secret_test"))
    return "key_secret_test"


class FakeHttpClient:
    def __init__(self, responses):
        self._responses = responses

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    async def post(self, url, **kw):
        return _Resp(*self._responses.pop(0))

    async def get(self, url, **kw):
        return _Resp(*self._responses.pop(0))


def test_razorpay_order_charges_pending_payment_total(monkeypatch, rzp_keys):
    order = type("O", (), {"id": "o1", "organization_id": "org-1", "order_number": "ORD-X"})()
    member = type("M", (), {"organization_id": "org-1"})()
    payment = type("P", (), {"amount": 4386.0, "id": "pay-1"})()
    session = FakeSession([order, FakeResult([member]), FakeResult([payment])])

    # Only the session's item sum must NOT be used: payment.amount (GST+ship
    # included) is what Razorpay is told to collect.
    created: dict[str, Any] = {}

    class _PostClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        async def post(self, url, headers=None, json=None):
            created.update(json or {})
            return _Resp(200, {"id": "order_remote_1"})

    monkeypatch.setattr(rzp.httpx, "AsyncClient", lambda timeout: _PostClient())

    out = asyncio_run(rzp.create_razorpay_order(session, "user-1", "o1"))
    assert created.get("amount") == 438600
    assert out["amount_paise"] == 438600
    assert out["razorpay_order_id"] == "order_remote_1"
    txn = session.added[0]
    assert txn.amount == 4386.0
    assert txn.external_id == "order_remote_1"


def asyncio_run(coro):
    import asyncio

    return asyncio.run(coro)


def test_razorpay_create_requires_pending_payment(monkeypatch, rzp_keys):
    order = type("O", (), {"id": "o1", "organization_id": "org-1", "order_number": "ORD-X"})()
    member = type("M", (), {"organization_id": "org-1"})()
    session = FakeSession([order, FakeResult([member]), FakeResult([])])

    with pytest.raises(HTTPException) as exc:
        asyncio_run(rzp.create_razorpay_order(session, "user-1", "o1"))
    assert exc.value.status_code == 409


def test_razorpay_verify_rejects_unbound_rzp_order(rzp_keys):
    """A signature for someone else's razorpay order must not capture us."""
    order = type("O", (), {"id": "o1", "organization_id": "org-1", "order_number": "ORD-X"})()
    member = type("M", (), {"organization_id": "org-1"})()
    payment = type(
        "P", (), {"amount": 4386.0, "payment_status": "pending", "id": "p1"}
    )()
    session = FakeSession([order, FakeResult([member]), FakeResult([payment]), FakeResult([])])
    sig = _hmac("order_foreign", "pay_x", "key_secret_test")

    with pytest.raises(HTTPException) as exc:
        asyncio_run(
            rzp.verify_razorpay_payment(
                session, "user-1", "o1", "order_foreign", "pay_x", sig
            )
        )
    assert exc.value.status_code == 400
    assert "does not belong" in exc.value.detail.lower()


class _GetClient:
    def __init__(self, payload):
        self._payload = payload

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    async def get(self, url, **kw):
        return _Resp(200, self._payload)


def test_razorpay_verify_amount_mismatch_rejected(monkeypatch, rzp_keys):
    order = type("O", (), {"id": "o1", "organization_id": "org-1", "order_number": "ORD-X"})()
    member = type("M", (), {"organization_id": "org-1"})()
    payment = type(
        "P", (), {"amount": 4386.0, "payment_status": "pending", "id": "p1"}
    )()
    bound = type(
        "T", (), {"external_id": "order_remote_1", "payment_id": "p1", "provider_name": "razorpay"}
    )()
    session = FakeSession(
        [order, FakeResult([member]), FakeResult([payment]), FakeResult([bound])]
    )
    sig = _hmac("order_remote_1", "pay_x", "key_secret_test")
    # Gateway says ₹9.99 was collected, we charged ₹4386 → reject.
    monkeypatch.setattr(
        rzp.httpx,
        "AsyncClient",
        lambda timeout: _GetClient({"status": "captured", "amount": 999}),
    )
    with pytest.raises(HTTPException) as exc:
        asyncio_run(
            rzp.verify_razorpay_payment(
                session, "user-1", "o1", "order_remote_1", "pay_x", sig
            )
        )
    assert exc.value.status_code == 400
    assert payment.payment_status == "pending"


def test_razorpay_verify_captures_on_exact_amount(monkeypatch, rzp_keys):
    order = type("O", (), {"id": "o1", "organization_id": "org-1", "order_number": "ORD-X"})()
    member = type("M", (), {"organization_id": "org-1"})()
    payment = type(
        "P", (), {"amount": 4386.0, "payment_status": "pending", "id": "p1"}
    )()
    bound = type(
        "T", (), {"external_id": "order_remote_1", "payment_id": "p1", "provider_name": "razorpay"}
    )()
    session = FakeSession(
        [order, FakeResult([member]), FakeResult([payment]), FakeResult([bound])]
    )
    sig = _hmac("order_remote_1", "pay_x", "key_secret_test")
    monkeypatch.setattr(
        rzp.httpx,
        "AsyncClient",
        lambda timeout: _GetClient({"status": "captured", "amount": 438600}),
    )
    out = asyncio_run(
        rzp.verify_razorpay_payment(session, "user-1", "o1", "order_remote_1", "pay_x", sig)
    )
    assert out["verified"] is True
    assert payment.payment_status == "captured"
    assert payment.paid_at is not None
    assert session.added[-1].external_id == "pay_x"


def test_razorpay_verify_idempotent_repeat(rzp_keys):
    order = type("O", (), {"id": "o1", "organization_id": "org-1", "order_number": "ORD-X"})()
    member = type("M", (), {"organization_id": "org-1"})()
    payment = type(
        "P", (), {"amount": 4386.0, "payment_status": "captured", "id": "p1"}
    )()
    bound = type(
        "T", (), {"external_id": "order_remote_1", "payment_id": "p1", "provider_name": "razorpay"}
    )()
    session = FakeSession(
        [order, FakeResult([member]), FakeResult([payment]), FakeResult([bound])]
    )
    sig = _hmac("order_remote_1", "pay_x", "key_secret_test")
    before = len(session.added)
    out = asyncio_run(
        rzp.verify_razorpay_payment(session, "user-1", "o1", "order_remote_1", "pay_x", sig)
    )
    assert out["verified"] is True
    assert len(session.added) == before  # no duplicate transaction


# ---------------------------------------------------------------------------
# API: staff-gated writes + org-trust on order creation
# ---------------------------------------------------------------------------
class _FakeRole:
    def __init__(self, name):
        self.name = name


class _FakeDepUser:
    def __init__(self, role_names):
        self.id = "user-override-1"
        self.email = "u@t.in"
        self.full_name = "Override"
        self.is_active = True
        self.roles = [_FakeRole(n) for n in role_names]


@pytest.fixture()
def buyer_only():
    from fastapi.testclient import TestClient  # noqa: F401 (ensures app imported)

    from backend.app.api.deps import get_current_user
    from backend.app.main import app

    async def _override():
        return _FakeDepUser(["customer"])

    app.dependency_overrides[get_current_user] = _override
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture()
def staff_user():
    from backend.app.api.deps import get_current_user
    from backend.app.main import app

    async def _override():
        return _FakeDepUser(["super_admin"])

    app.dependency_overrides[get_current_user] = _override
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_product_create_forbidden_for_buyer(client, buyer_only):
    response = client.post(
        "/api/v1/modit/products",
        json={
            "organization_id": "1",
            "category_id": "1",
            "unit_id": "1",
            "sku": "SKU-TEST",
            "name": "T",
            "slug": "t",
            "list_price": 10.0,
        },
        headers=_auth_headers(),
    )
    assert response.status_code == 403


def test_product_create_bad_price_rejected(client, staff_user):
    response = client.post(
        "/api/v1/modit/products",
        json={
            "organization_id": "1",
            "category_id": "1",
            "unit_id": "1",
            "sku": "SKU-TEST",
            "name": "T",
            "slug": "t",
            "list_price": 0,
        },
        headers=_staff_headers(),
    )
    assert response.status_code == 422


def test_inventory_create_forbidden_for_buyer(client, buyer_only):
    response = client.post(
        "/api/v1/modit/inventory",
        json={"warehouse_id": "1", "product_id": "1", "quantity_on_hand": 5},
        headers=_auth_headers(),
    )
    assert response.status_code == 403


def test_inventory_update_forbidden_for_buyer(client, buyer_only):
    response = client.patch(
        "/api/v1/modit/inventory/1",
        json={"quantity_on_hand": 500},
        headers=_auth_headers(),
    )
    assert response.status_code == 403


def test_delivery_create_forbidden_for_buyer(client, buyer_only):
    response = client.post(
        "/api/v1/modit/deliveries", json={"purchase_order_id": "1"}, headers=_auth_headers()
    )
    assert response.status_code == 403


def test_warehouse_create_forbidden_for_buyer(client, buyer_only):
    response = client.post(
        "/api/v1/modit/warehouses", json={"warehouse_code": "W", "city_id": "1"}, headers=_auth_headers()
    )
    assert response.status_code == 403


def test_create_order_blocks_orgs_the_buyer_is_not_in(client, buyer_only):
    # Fake DB membership rows are ORM objects — no orgs resolve for the
    # plain buyer, so create-for-any-org must 404 (existence not leaked).
    response = client.post(
        "/api/v1/modit/orders",
        json={"organization_id": "1", "purchase_order_id": "1"},
        headers=_auth_headers(),
    )
    assert response.status_code == 404
    response2 = client.post(
        "/api/v1/modit/orders",
        json={"organization_id": "org-other", "purchase_order_id": None},
        headers=_auth_headers(),
    )
    assert response2.status_code == 404


def test_create_order_allowed_for_staff(client, staff_user):
    response = client.post(
        "/api/v1/modit/orders",
        json={"organization_id": "1", "purchase_order_id": "1"},
        headers=_staff_headers(),
    )
    assert response.status_code == 201


def test_create_purchase_order_outside_org_blocked(client, buyer_only):
    response = client.post(
        "/api/v1/modit/purchase-orders",
        json={"organization_id": "org-other"},
        headers=_auth_headers(),
    )
    assert response.status_code == 404


def test_healthz_never_leaks_driver_text(client):
    response = client.get("/api/v1/healthz")
    assert response.status_code in (200, 503)
    body = response.json()
    assert set(body["dependencies"]) == {"database", "redis"}
    assert "db_error" not in body
    assert "redis_error" not in body
