from collections.abc import AsyncGenerator
from datetime import date, datetime, timezone

import pytest
import httpx
from httpx import ASGITransport

from backend.app.core.database import get_db
from backend.app.core.redis import get_redis
from backend.app.main import app


NOW = datetime(2024, 1, 1, tzinfo=timezone.utc)
TODAY = date(2024, 1, 1)


class FakeORMObject:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class FakeScalarResult:
    def __init__(self, data=None):
        self._data = data if data is not None else []

    def scalar_one(self):
        return self._data[0] if self._data else 0

    def scalar_one_or_none(self):
        return self._data[0] if self._data else None

    def scalars(self):
        return self

    def all(self):
        return self._data

    def first(self):
        return self._data[0] if self._data else None


class FakeResult:
    def __init__(self, data=None, scalar_value=None):
        self._data = data or []
        self._scalar_value = scalar_value

    def scalar_one(self):
        if self._scalar_value is not None:
            return self._scalar_value
        return self._data[0] if self._data else 0

    def scalar_one_or_none(self):
        if self._scalar_value is not None:
            return self._scalar_value
        return self._data[0] if self._data else None

    def scalars(self):
        return FakeScalarResult(self._data)

    def all(self):
        return self._data

    def scalar(self):
        if self._scalar_value is not None:
            return self._scalar_value
        return self._data[0] if self._data else 0


UNIVERSAL_OBJECT = FakeORMObject(
    # UUIDMixin + TimestampMixin + SoftDeleteMixin
    id="1",
    created_at=NOW,
    updated_at=NOW,
    deleted_at=None,
    is_active=True,

    # Organization fields
    organization_id="1",
    owner_user_id=None,
    legal_name=None,
    organization_type="builder",
    registration_number=None,
    gst_number=None,
    pan_number=None,
    website_url=None,
    billing_email=None,
    settings_json=None,

    # Product fields
    supplier_id=None,
    brand_id=None,
    category_id="1",
    sub_category_id=None,
    unit_id="1",
    gst_id=None,
    sku="SKU-1",
    name="Item 1",
    slug="item-1",
    description=None,
    specification_json=None,
    mrp=None,
    list_price=100.0,
    approval_status="pending",

    # Category/SubCategory/Brand fields
    parent_category_id=None,

    # Unit fields
    code="kg",
    symbol="kg",

    # Supplier fields
    supplier_code="SUP-1",
    is_verified=True,

    # Vendor fields
    vendor_code="VND-1",
    contact_phone=None,
    contact_email=None,

    # Warehouse fields
    city_id="1",
    warehouse_code="WH-1",
    address_line1="123 St",
    address_line2=None,
    pincode="123456",

    # RFQ fields
    project_id=None,
    rfq_number="RFQ-1",
    status="open",
    requested_by_user_id="user-1",
    due_date=None,
    notes=None,

    # Quotation fields
    quotation_number="QT-1",
    valid_until=None,
    subtotal=0.0,
    gst_total=0.0,
    grand_total=0.0,
    terms_and_conditions=None,

    # Order fields
    purchase_order_id=None,
    order_number="ORD-1",
    placed_at=NOW,

    # PurchaseOrder fields
    order_date=TODAY,
    expected_delivery_date=None,
    total_amount=0.0,

    # Invoice fields
    invoice_number="INV-1",
    invoice_date=TODAY,

    # Inventory fields
    warehouse_id="1",
    product_id="1",
    quantity_on_hand=100,
    reserved_quantity=0,
    reorder_level=10,
    last_restocked_at=None,

    # Delivery fields
    delivery_number="DEL-1",
    driver_id=None,
    vehicle_id=None,
    dispatched_at=None,
    delivered_at=None,

    # Driver fields
    full_name="Driver 1",
    phone_number="1234567890",
    license_number=None,

    # Vehicle fields
    vehicle_type="truck",
    capacity_kg=None,

    # Project fields
    project_code="PRJ-1",
    start_date=None,
    end_date=None,
    budget_amount=None,

    # MaterialRequest fields
    request_number="MR-1",
    required_by_date=None,

    # Notification fields
    channel="email",
    title="Test",
    body="Test body",
    scheduled_at=None,

    # Review fields
    rating=5,

    # Product relationships (for inventory alerts/analytics)
    product=None,
    warehouse=None,
    brand=None,
    category=None,
    sub_category=None,
    unit=None,
    gst=None,
    images=None,
)


class FakeDatabaseSession:
    def __init__(self):
        self._call_count = 0

    async def execute(self, statement):
        self._call_count += 1
        stmt_str = str(statement)

        # Count/sum queries: return scalar integers
        if "count(" in stmt_str.lower() or "COUNT(" in stmt_str:
            return FakeResult([], scalar_value=1)
        if "sum(" in stmt_str.lower() or "SUM(" in stmt_str:
            return FakeResult([], scalar_value=0)

        # Name-only queries (suggestions): return list of name strings
        # Detect: select(Product.name) - the SQL will have modit_products.name or products.name
        # but won't have the full table.* columns
        if ".name" in stmt_str and ".id" not in stmt_str:
            return FakeResult(["Item 1"])

        # Return universal ORM object for any model query
        return FakeResult([UNIVERSAL_OBJECT])

    async def get(self, model, ident):
        return UNIVERSAL_OBJECT

    async def refresh(self, instance, attribute_names=None):
        pass

    async def flush(self):
        pass

    async def commit(self):
        pass

    def add(self, instance):
        pass

    def add_all(self, instances):
        pass


class FakeRedisClient:
    async def ping(self) -> bool:
        return True

    async def aclose(self) -> None:
        pass


async def override_get_db() -> AsyncGenerator[FakeDatabaseSession, None]:
    yield FakeDatabaseSession()


async def override_get_redis() -> FakeRedisClient:
    return FakeRedisClient()


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_redis] = override_get_redis


from fastapi.testclient import TestClient


@pytest.fixture()
def client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture()
async def async_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
