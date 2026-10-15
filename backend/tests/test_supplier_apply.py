"""Supplier onboarding: public apply -> verified gate -> staff approve."""

import pytest
from fastapi import HTTPException

from conftest import FakeDatabaseSession, FakeORMObject, FakeResult
from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.main import app

BASE = "/api/v1/supplier"

GOOD = {
    "business_name": "Sharma Building Mart",
    "contact_name": "Ravi Sharma",
    "email": "ravi@sharmabuilding.in",
    "phone": "9810012345",
    "password": "Supplier@1234",
    "gstin": "07ABCDE1234F1Z5",
    "pan": "ABCDE1234F",
    "city": "Noida",
    "pincode": "201301",
    "categories": ["cement", "painting"],
    "brands": ["UltraTech"],
}


class ApplyFakeDB(FakeDatabaseSession):
    """Empty lookups (no dup) unless rows are provided."""

    def __init__(self, users=None, orgs=None, roles=None, suppliers=None):
        super().__init__()
        self._users = users or []
        self._orgs = orgs or []
        self._roles = roles or []
        self._suppliers = suppliers or []

    async def execute(self, statement):
        s = str(statement)
        if "users" in s and "user_roles" not in s:
            return FakeResult(list(self._users))
        if "modit_organizations" in s:
            return FakeResult(list(self._orgs))
        if "roles" in s and "user_roles" not in s:
            return FakeResult(list(self._roles))
        if "suppliers" in s:
            return FakeResult(list(self._suppliers))
        return await super().execute(statement)

    async def get(self, model, ident):
        name = getattr(model, "__name__", "")
        if name == "Supplier":
            return next((o for o in self._suppliers if str(o.id) == str(ident)), None)
        if name == "Organization":
            return next((o for o in self._orgs if str(o.id) == str(ident)), None)
        if name == "User":
            return next((o for o in self._users if str(o.id) == str(ident)), None)
        return None


def _override_db(db):
    prev = app.dependency_overrides.get(get_db)

    async def _db():
        yield db

    app.dependency_overrides[get_db] = _db
    return prev


@pytest.fixture()
def anon_client(client):
    app.dependency_overrides.pop(get_current_user, None)
    yield client


def test_apply_validation(anon_client):
    prev = _override_db(ApplyFakeDB())
    try:
        bad = dict(GOOD, gstin="nope")
        assert anon_client.post(f"{BASE}/apply", json=bad).status_code == 422
        bad = dict(GOOD, pan="nope")
        assert anon_client.post(f"{BASE}/apply", json=bad).status_code == 422
        bad = dict(GOOD, phone="123")
        assert anon_client.post(f"{BASE}/apply", json=bad).status_code == 422
        bad = dict(GOOD, categories=[])
        assert anon_client.post(f"{BASE}/apply", json=bad).status_code == 422
        bad = dict(GOOD, password="short")
        assert anon_client.post(f"{BASE}/apply", json=bad).status_code == 422
    finally:
        if prev is not None:
            app.dependency_overrides[get_db] = prev


def test_apply_happy_path(anon_client):
    prev = _override_db(ApplyFakeDB())
    try:
        r = anon_client.post(f"{BASE}/apply", json=GOOD)
        assert r.status_code == 201, r.text[:300]
        data = r.json()
        assert data["supplier_code"].startswith("SUP-")
        assert data["status"] == "pending"
        assert data["supplier_id"]
    finally:
        if prev is not None:
            app.dependency_overrides[get_db] = prev


def test_apply_dup_email(anon_client):
    prev = _override_db(ApplyFakeDB(users=[FakeORMObject(id="u1", email=GOOD["email"])]))
    try:
        r = anon_client.post(f"{BASE}/apply", json=GOOD)
        assert r.status_code == 409
    finally:
        if prev is not None:
            app.dependency_overrides[get_db] = prev


def test_apply_dup_gstin(anon_client):
    org = FakeORMObject(id="org1", gst_number=GOOD["gstin"], settings_json="{}")
    prev = _override_db(ApplyFakeDB(orgs=[org]))
    try:
        payload = dict(GOOD, email="other@example.com")
        r = anon_client.post(f"{BASE}/apply", json=payload)
        assert r.status_code == 409
    finally:
        if prev is not None:
            app.dependency_overrides[get_db] = prev


def _supplier_user():
    return FakeORMObject(id="user-pending", is_active=True,
                         roles=[FakeORMObject(name="supplier")])


def _staff_user():
    return FakeORMObject(id="user-admin", is_active=True,
                         roles=[FakeORMObject(name="admin")])


def _pending_supplier():
    return FakeORMObject(id="sup-pend", supplier_code="SUP-PEND",
                         organization_id="org-pend", is_verified=False,
                         user_id="user-pending")


def _pending_org():
    return FakeORMObject(
        id="org-pend", name="Sharma Building Mart", gst_number=GOOD["gstin"],
        pan_number=GOOD["pan"], is_active=False,
        settings_json='{"phone": "9810012345", "city": "Noida", "pincode": "201301",'
                      ' "categories": ["cement"], "brands": [], "status": "pending"}',
    )


@pytest.fixture()
def pending_client(client):
    prev_db = app.dependency_overrides.get(get_db)
    prev_user = app.dependency_overrides.get(get_current_user)

    async def _db():
        yield ApplyFakeDB(suppliers=[_pending_supplier()])

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = _supplier_user
    yield client
    if prev_db is not None:
        app.dependency_overrides[get_db] = prev_db
    if prev_user is not None:
        app.dependency_overrides[get_current_user] = prev_user
    else:
        app.dependency_overrides.pop(get_current_user, None)


def test_unverified_supplier_sees_me_but_not_data(pending_client):
    me = pending_client.get(f"{BASE}/me")
    assert me.status_code == 200
    assert me.json()["is_verified"] is False
    assert pending_client.get(f"{BASE}/products").status_code == 403
    assert pending_client.get(f"{BASE}/orders").status_code == 403
    assert pending_client.get(f"{BASE}/summary").status_code == 403
    assert pending_client.get(f"{BASE}/payouts").status_code == 403


@pytest.fixture()
def staff_client(client):
    prev_db = app.dependency_overrides.get(get_db)
    prev_user = app.dependency_overrides.get(get_current_user)
    state = {"sup": _pending_supplier(), "org": _pending_org(),
             "user": FakeORMObject(id="user-pending", email=GOOD["email"],
                                   full_name="Ravi Sharma")}

    class StaffDB(ApplyFakeDB):
        async def get(self, model, ident):
            name = getattr(model, "__name__", "")
            if name == "Supplier":
                return state["sup"] if str(ident) == "sup-pend" else None
            if name == "Organization":
                return state["org"] if str(ident) == "org-pend" else None
            if name == "User":
                return state["user"]
            return None

        async def execute(self, statement):
            s = str(statement)
            if "suppliers" in s:
                return FakeResult([state["sup"]])
            return await super().execute(statement)

    async def _db():
        yield StaffDB()

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = _staff_user
    yield client
    if prev_db is not None:
        app.dependency_overrides[get_db] = prev_db
    if prev_user is not None:
        app.dependency_overrides[get_current_user] = prev_user
    else:
        app.dependency_overrides.pop(get_current_user, None)


def test_staff_lists_pending_applications(staff_client):
    r = staff_client.get(f"{BASE}/applications")
    assert r.status_code == 200, r.text[:300]
    rows = r.json()
    assert len(rows) == 1
    assert rows[0]["business_name"] == "Sharma Building Mart"
    assert rows[0]["email"] == GOOD["email"]
    assert rows[0]["status"] == "pending"


def test_staff_approves_application(staff_client):
    r = staff_client.patch(f"{BASE}/applications/sup-pend", json={"action": "approve"})
    assert r.status_code == 200, r.text[:300]
    assert r.json()["status"] == "approved"


def test_staff_rejects_application(staff_client):
    r = staff_client.patch(f"{BASE}/applications/sup-pend", json={"action": "reject"})
    assert r.status_code == 200, r.text[:300]
    assert r.json()["status"] == "rejected"


def test_staff_application_unknown(staff_client):
    r = staff_client.patch(f"{BASE}/applications/nope", json={"action": "approve"})
    assert r.status_code == 404


def test_supplier_cannot_list_applications(pending_client):
    assert pending_client.get(f"{BASE}/applications").status_code == 403


def _product_row():
    from datetime import datetime, timezone

    return FakeORMObject(
        id="prod-1", organization_id="org-1", supplier_id=None, brand_id=None,
        category_id="cat-1", sub_category_id=None, unit_id="unit-1", gst_id=None,
        sku="TST-1", name="Test Product", slug="test-product", description=None,
        specification_json=None, mrp=100.0, list_price=90.0,
        approval_status="approved", is_active=True,
        created_at=datetime.now(timezone.utc),
    )


def _assign_client(client, product, supplier):
    from backend.app.core.database import get_db as _get_db

    prev_db = app.dependency_overrides.get(_get_db)
    prev_user = app.dependency_overrides.get(get_current_user)

    class AssignDB(FakeDatabaseSession):
        async def get(self, model, ident):
            name = getattr(model, "__name__", "")
            if name == "Product":
                return product
            if name == "Supplier":
                return supplier
            return None

    async def _db():
        yield AssignDB()

    app.dependency_overrides[_get_db] = _db
    app.dependency_overrides[get_current_user] = _staff_user
    yield client
    if prev_db is not None:
        app.dependency_overrides[_get_db] = prev_db
    if prev_user is not None:
        app.dependency_overrides[get_current_user] = prev_user
    else:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture()
def assign_client(client):
    yield from _assign_client(client, _product_row(), FakeORMObject(id="sup-1"))


@pytest.fixture()
def assign_client_no_supplier(client):
    yield from _assign_client(client, _product_row(), None)


def test_admin_can_assign_product_to_supplier(assign_client):
    r = assign_client.patch(
        "/api/v1/modit/products/prod-1", json={"supplier_id": "sup-1"})
    assert r.status_code == 200, r.text[:300]
    assert r.json()["supplier_id"] == "sup-1"


def test_admin_assign_unknown_supplier_404(assign_client_no_supplier):
    r = assign_client_no_supplier.patch(
        "/api/v1/modit/products/prod-1", json={"supplier_id": "nope"})
    assert r.status_code == 404
