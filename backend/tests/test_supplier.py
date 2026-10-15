"""Supplier surface: sellers see ONLY their own catalog/orders/payouts."""

import pytest
from fastapi import HTTPException

from conftest import FakeDatabaseSession, FakeORMObject, FakeResult
from backend.app.api.deps import get_current_user, is_supplier, require_supplier
from backend.app.core.database import get_db
from backend.app.main import app

BASE = "/api/v1/supplier"
PATHS = ["/me", "/products", "/orders", "/summary", "/payouts"]

SUPPLIER = FakeORMObject(
    id="sup-1", supplier_code="SUP-TEST", organization_id="org-1",
    is_verified=True, user_id="user-sup",
)
PRODUCTS = [
    FakeORMObject(id="p1", sku="A-1", name="Cement 50kg", slug="cement", list_price=370.0,
                  mrp=410.0, is_active=True, approval_status="approved", supplier_id="sup-1"),
    FakeORMObject(id="p2", sku="A-2", name="Paint 10L", slug="paint", list_price=950.0,
                  mrp=1100.0, is_active=True, approval_status="approved", supplier_id="sup-1"),
    FakeORMObject(id="p9", sku="B-9", name="Rival Tiles", slug="tiles", list_price=500.0,
                  mrp=600.0, is_active=True, approval_status="approved", supplier_id="sup-OTHER"),
]
ITEMS = [
    FakeORMObject(id="i1", order_id="o1", product_id="p1", quantity=10.0,
                  unit_price=370.0, line_total=3700.0),
    FakeORMObject(id="i2", order_id="o2", product_id="p2", quantity=2.0,
                  unit_price=950.0, line_total=1900.0),
    FakeORMObject(id="i3", order_id="o2", product_id="p9", quantity=1.0,
                  unit_price=500.0, line_total=500.0),
    FakeORMObject(id="i4", order_id="o-cancel", product_id="p1", quantity=5.0,
                  unit_price=370.0, line_total=1850.0),
]
ORDERS = {
    "o1": FakeORMObject(id="o1", order_number="PO-1", status="placed", placed_at=None),
    "o2": FakeORMObject(id="o2", order_number="PO-2", status="delivered", placed_at=None),
    "o-cancel": FakeORMObject(id="o-cancel", order_number="PO-X", status="cancelled", placed_at=None),
}
BY_ID = {p.id: p for p in PRODUCTS} | ORDERS


class SupplierFakeDB(FakeDatabaseSession):
    async def execute(self, statement):
        s = str(statement)
        if "order_items" in s:
            return FakeResult(list(ITEMS))
        if "count(" in s.lower():
            return FakeResult([], scalar_value=2)
        if "suppliers" in s:
            return FakeResult([SUPPLIER])
        if "products" in s:
            return FakeResult([p for p in PRODUCTS if p.supplier_id == "sup-1"])
        return await super().execute(statement)

    async def get(self, model, ident):
        return BY_ID.get(str(ident))


def _supplier_user():
    return FakeORMObject(id="user-sup", is_active=True,
                         roles=[FakeORMObject(name="supplier")])


def _buyer_user():
    return FakeORMObject(id="user-1", is_active=True,
                         roles=[FakeORMObject(name="user")])


@pytest.fixture()
def supplier_client(client):
    prev_db = app.dependency_overrides.get(get_db)
    prev_user = app.dependency_overrides.get(get_current_user)

    async def _db():
        yield SupplierFakeDB()

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = _supplier_user
    yield client
    if prev_db is not None:
        app.dependency_overrides[get_db] = prev_db
    if prev_user is not None:
        app.dependency_overrides[get_current_user] = prev_user
    else:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture()
def buyer_client(client):
    prev_user = app.dependency_overrides.get(get_current_user)
    app.dependency_overrides[get_current_user] = _buyer_user
    yield client
    if prev_user is not None:
        app.dependency_overrides[get_current_user] = prev_user
    else:
        app.dependency_overrides.pop(get_current_user, None)


def test_supplier_endpoints_require_auth(client):
    # One runtime probe (/me) + structural gate test below for all paths.
    assert client.get(f"{BASE}/me").status_code == 401


def test_supplier_endpoints_forbid_buyers(buyer_client):
    assert buyer_client.get(f"{BASE}/me").status_code == 403


def test_all_supplier_routes_are_role_gated():
    """Every supplier path exists; all but the public intake carry an auth dependency."""
    routes = {
        getattr(route, "path", ""): route
        for route in app.routes
        if getattr(route, "path", "").startswith(f"{BASE}/")
    }
    assert set(routes) == {f"{BASE}{p}" for p in PATHS + ["/apply", "/applications", "/applications/{supplier_id}", "/rfqs", "/rfq/{rfq_id}/quote"]}
    public = {f"{BASE}/apply"}  # deliberate: anyone may apply to sell
    for path, route in routes.items():
        if path in public:
            continue
        dependant = getattr(route, "dependant", None)
        assert dependant is not None and getattr(dependant, "dependencies", None), route.path


def test_apply_is_public_and_lists_are_staff_gated(client):
    assert client.post(f"{BASE}/apply", json={}).status_code == 422  # validation, no auth needed
    assert client.get(f"{BASE}/applications").status_code in (401, 403)


def test_is_supplier_helper():
    assert is_supplier(_supplier_user()) is True
    assert is_supplier(_buyer_user()) is False
    assert is_supplier(None) is False


async def test_require_supplier_rejects_buyer():
    with pytest.raises(HTTPException) as exc:
        await require_supplier()(user=_buyer_user())
    assert exc.value.status_code == 403


def test_supplier_me(supplier_client):
    data = supplier_client.get(f"{BASE}/me").json()
    assert data["supplier_code"] == "SUP-TEST"
    assert data["is_verified"] is True
    assert data["product_count"] == 2


def test_supplier_products_scoped(supplier_client):
    data = supplier_client.get(f"{BASE}/products").json()
    assert data["total"] == 2
    assert {p["sku"] for p in data["items"]} == {"A-1", "A-2"}


def test_supplier_orders_scoped_and_cancelled_excluded(supplier_client):
    data = supplier_client.get(f"{BASE}/orders").json()
    numbers = {o["order_number"] for o in data}
    assert numbers == {"PO-1", "PO-2"}
    o2 = next(o for o in data if o["order_number"] == "PO-2")
    # Rival supplier's line must not leak into my order view.
    assert {line["sku"] for line in o2["lines"]} == {"A-2"}
    assert o2["my_total"] == 1900.0


def test_supplier_summary_math(supplier_client):
    data = supplier_client.get(f"{BASE}/summary").json()
    assert data["product_count"] == 2
    assert data["order_count"] == 2
    assert data["revenue"] == 5600.0
    assert data["payable"] == 1900.0


def test_supplier_payouts_states(supplier_client):
    data = supplier_client.get(f"{BASE}/payouts").json()
    by_number = {p["order_number"]: p for p in data}
    assert set(by_number) == {"PO-1", "PO-2"}
    assert by_number["PO-1"]["state"] == "pending"
    assert by_number["PO-2"]["state"] == "paid"
    assert by_number["PO-2"]["amount"] == 1900.0
