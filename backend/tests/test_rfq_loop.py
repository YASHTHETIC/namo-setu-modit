"""RFQ end-to-end: create with items -> supplier quotes -> compare -> award -> PO."""

from datetime import datetime, timezone
from uuid import uuid4

import re

import pytest

from conftest import FakeDatabaseSession, FakeORMObject, FakeResult
from backend.app.api.deps import get_current_user
from backend.app.core.database import get_db
from backend.app.main import app

BASE = "/api/v1/modit"
SUP = "/api/v1/supplier"
NOW = datetime(2026, 10, 14, tzinfo=timezone.utc)

PROD = FakeORMObject(id="prod-1", list_price=370.0)
RFQ = FakeORMObject(
    id="rfq-1", organization_id="org-1", project_id=None,
    rfq_number="RFQ-TEST-1", status="open", requested_by_user_id="buyer-1",
    due_date=None, notes="50 bags cement", created_at=NOW,
    items=[FakeORMObject(id="ri-1", rfq_id="rfq-1", product_id="prod-1",
                         requested_quantity=50.0, unit_price_hint=None,
                         notes=None, created_at=NOW)],
    quotations=[],
)


def _buyer(uid="buyer-1"):
    return FakeORMObject(id=uid, is_active=True, roles=[FakeORMObject(name="user")])


def _supplier_user():
    return FakeORMObject(id="sup-user-1", is_active=True, roles=[FakeORMObject(name="supplier")])


def _staff():
    return FakeORMObject(id="staff-1", is_active=True, roles=[FakeORMObject(name="admin")])


SUP_PROFILE = FakeORMObject(id="sup-1", supplier_code="SUP-1",
                            organization_id="org-sup", is_verified=True,
                            user_id="sup-user-1")


class LoopFakeDB(FakeDatabaseSession):
    """In-memory registries; flush applies id/created_at like the DB would."""

    def __init__(self):
        super().__init__()
        self.products = {"prod-1": PROD}
        self.rfqs = {"rfq-1": RFQ}
        self.quotes = {}
        self.suppliers = {"sup-1": SUP_PROFILE}
        self.created_pos = []
        self._added = []

    async def execute(self, statement):
        s = str(statement)
        if "user_roles" in s:
            class _Empty:
                def first(self):
                    return None
            return _Empty()

        def _rfq_id():
            try:
                lit = str(statement.compile(compile_kwargs={"literal_binds": True}))
            except Exception:
                return None
            m = re.search(r"rfq_id\s*=\s*'([^']+)'", lit)
            return m.group(1) if m else None

        if "rfq_items" in s:
            rid = _rfq_id()
            rows = []
            for r in list(self.rfqs.values()):
                for it in getattr(r, "items", []):
                    if rid is None or str(getattr(it, "rfq_id", None)) == rid:
                        rows.append(it)
            return FakeResult(rows)
        if "quotation_items" in s:
            return FakeResult([])
        if "quotation" in s:
            rid = _rfq_id()
            rows = [q for q in self.quotes.values()
                    if rid is None or str(getattr(q, "rfq_id", None)) == rid]
            return FakeResult(rows)
        if "suppliers" in s and "vendors" not in s:
            return FakeResult(list(self.suppliers.values()))
        if "products" in s:
            return FakeResult(list(self.products.values()))
        if re.search(r"\brfq\b", s):
            return FakeResult(list(self.rfqs.values()))
        return FakeResult([])

    async def get(self, model, ident):
        name = getattr(model, "__name__", "")
        if name == "RFQ":
            return self.rfqs.get(str(ident))
        if name == "Product":
            return self.products.get(str(ident))
        if name == "Quotation":
            return self.quotes.get(str(ident))
        if name == "Supplier":
            for s in self.suppliers.values():
                if str(s.id) == str(ident):
                    return s
            return None
        if name == "Organization":
            return FakeORMObject(id="org-1", name="O", is_active=True, settings_json="{}")
        if name == "GST":
            return None
        if name == "User":
            return None
        return None

    def add(self, instance):
        self._added.append(instance)

    def _apply_defaults(self):
        # Mirror DB defaults, then index (endpoints rely on get-after-add).
        for o in self._added:
            if getattr(o, "id", None) is None:
                try:
                    o.id = str(uuid4())
                except Exception:
                    pass
            if hasattr(o, "created_at") and getattr(o, "created_at") is None:
                try:
                    o.created_at = NOW
                except Exception:
                    pass
            tname = type(o).__name__
            if tname == "Quotation":
                self.quotes[str(o.id)] = o
            elif tname == "RFQ":
                self.rfqs[str(o.id)] = o
            elif tname == "PurchaseOrder":
                if o not in self.created_pos:
                    self.created_pos.append(o)

    async def flush(self):
        self._apply_defaults()

    async def commit(self):
        self._apply_defaults()


@pytest.fixture()
def loop_client(client):
    state = {"db": LoopFakeDB(), "user": _buyer()}
    prev_db = app.dependency_overrides.get(get_db)
    prev_user = app.dependency_overrides.get(get_current_user)

    async def _db():
        yield state["db"]

    def _user():
        return state["user"]

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = _user
    yield state
    if prev_db is not None:
        app.dependency_overrides[get_db] = prev_db
    if prev_user is not None:
        app.dependency_overrides[get_current_user] = prev_user
    else:
        app.dependency_overrides.pop(get_current_user, None)


def _quote_payload():
    return {"lines": [{"product_id": "prod-1", "quantity": 50, "unit_price": 360.0}]}


def test_full_loop(client, loop_client):
    state = loop_client
    # buyer creates RFQ with items (no org -> personal org path)
    r = client.post(f"{BASE}/rfq", json={
        "notes": "50 bags cement", "items": [{"product_id": "prod-1", "requested_quantity": 50}],
    })
    assert r.status_code == 201, r.text[:300]
    body = r.json()
    assert body["status"] == "open"
    rfq_id = body["id"]
    assert len(body["items"]) == 1

    # buyer (not supplier) cannot quote
    q = client.post(f"{SUP}/rfq/{rfq_id}/quote", json=_quote_payload())
    assert q.status_code == 403

    # supplier inbox lists it as quotable
    state["user"] = _supplier_user()
    inbox = client.get(f"{SUP}/rfqs")
    assert inbox.status_code == 200
    assert any(row["id"] == rfq_id and row["items_count"] == 1 for row in inbox.json())

    # supplier quotes: 50 x 360 = 18000 + 18% GST 3240 = 21240
    state["user"] = _supplier_user()
    q = client.post(f"{SUP}/rfq/{rfq_id}/quote", json=_quote_payload())
    assert q.status_code == 201, q.text[:300]
    quote = q.json()
    assert quote["subtotal"] == 18000.0
    assert quote["gst_total"] == 3240.0
    assert quote["grand_total"] == 21240.0
    assert quote["status"] == "sent"

    # partial quote rejected
    q = client.post(f"{SUP}/rfq/{rfq_id}/quote",
                    json={"lines": [{"product_id": "prod-1", "quantity": 10, "unit_price": 360.0}]})
    assert q.status_code == 422

    # supplier cannot award
    a = client.post(f"{BASE}/rfq/{rfq_id}/award", json={"quotation_id": quote["id"]})
    assert a.status_code == 403

    # owner awards: statuses flip + PO created
    state["user"] = _buyer()
    a = client.post(f"{BASE}/rfq/{rfq_id}/award", json={"quotation_id": quote["id"]})
    assert a.status_code == 200, a.text[:300]
    awarded = a.json()
    assert awarded["grand_total"] == 21240.0
    assert awarded["purchase_order_id"]
    assert len(state["db"].created_pos) == 1
    assert float(state["db"].created_pos[0].total_amount) == 21240.0

    # awarded RFQ rejects new quotes and re-awards
    state["user"] = _supplier_user()
    q = client.post(f"{SUP}/rfq/{rfq_id}/quote", json=_quote_payload())
    assert q.status_code == 409
    state["user"] = _buyer()
    a = client.post(f"{BASE}/rfq/{rfq_id}/award", json={"quotation_id": quote["id"]})
    assert a.status_code == 409


def test_quote_unknown_product(client, loop_client):
    loop_client["user"] = _supplier_user()
    q = client.post(f"{SUP}/rfq/rfq-1/quote",
                    json={"lines": [{"product_id": "nope", "quantity": 1, "unit_price": 10.0}]})
    assert q.status_code in (404, 422)


def test_award_unknown_quote(client, loop_client):
    a = client.post(f"{BASE}/rfq/rfq-1/award", json={"quotation_id": "nope"})
    assert a.status_code == 404


def test_add_items_owner_only(client, loop_client):
    ok = client.post(f"{BASE}/rfq/rfq-1/items",
                     json=[{"product_id": "prod-1", "requested_quantity": 5}])
    assert ok.status_code == 200
    assert len(ok.json()["items"]) == 2
    loop_client["user"] = _buyer("buyer-2")
    denied = client.post(f"{BASE}/rfq/rfq-1/items",
                         json=[{"product_id": "prod-1", "requested_quantity": 5}])
    assert denied.status_code == 403
