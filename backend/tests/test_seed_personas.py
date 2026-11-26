"""Demo persona logins: buyer, contractor, architect, rider (all / Demo@1234)."""

import pytest

from conftest import FakeDatabaseSession, FakeORMObject, FakeResult
from backend.app.seeders import catalog as seed


class PersonaFakeDB(FakeDatabaseSession):
    """Empty lookups -> every persona gets created; role-link checks miss."""

    def __init__(self, users=None, role=None):
        super().__init__()
        self._users = {u.email: u for u in (users or [])}
        self._role = role
        self.created = []

    async def execute(self, statement):
        s = str(statement)
        if "user_roles" in s:
            class _Empty:
                def first(self):
                    return None
            return _Empty()
        if "FROM roles" in s or ("roles" in s and "users" not in s):
            return FakeResult([self._role] if self._role else [])
        if "users" in s:
            try:
                lit = str(statement.compile(compile_kwargs={"literal_binds": True}))
            except Exception:
                lit = ""
            for addr, u in self._users.items():
                if addr in lit:
                    return FakeResult([u])
            return FakeResult([])
        return await super().execute(statement)

    def add(self, instance):
        self.created.append(instance)


@pytest.mark.asyncio()
async def test_seed_demo_personas_creates_all():
    db = PersonaFakeDB()
    await seed._seed_demo_personas(db)
    emails = sorted(
        getattr(o, "email", "") for o in db.created
        if getattr(o, "email", "")
    )
    assert emails == [
        "architect@modit.in",
        "contractor@modit.in",
        "demo@modit.in",
        "rider@modit.in",
    ]
    roles = [o for o in db.created if type(o).__name__ == "Role"]
    assert roles and roles[0].name == "user"


@pytest.mark.asyncio()
async def test_seed_demo_personas_never_touches_existing():
    existing = FakeORMObject(id="u9", email="demo@modit.in")
    db = PersonaFakeDB(users=[existing],
                       role=FakeORMObject(id="r1", name="user"))
    await seed._seed_demo_personas(db)
    assert [getattr(o, "email", "") for o in db.created] == [
        "contractor@modit.in", "architect@modit.in", "rider@modit.in",
    ]


class _GuardedUser(FakeORMObject):
    """Raises if lazy User.roles is ever touched (mirrors async MissingGreenlet)."""

    @property
    def roles(self):
        raise AssertionError("lazy User.roles must not be accessed in async session")


class _ScalarList(list):
    """Iterable scalar list stub supporting `for x in res.scalars()`, `.first()`, and `.all()`."""

    def all(self):
        return list(self)

    def first(self):
        return self[0] if self else None


class _RowResult:
    """Minimal SQLAlchemy Result stub for unit tests without a DB driver."""

    def __init__(self, rows=None):
        self._rows = list(rows or [])

    def first(self):
        return self._rows[0] if self._rows else None

    def scalar_one_or_none(self):
        return self._rows[0] if self._rows else None

    def scalars(self):
        return _ScalarList(self._rows)


class _CatalogSeedFakeDB(PersonaFakeDB):
    """Fake async session for seed_catalog that simulates user_roles lookup + IDs on flush."""

    def __init__(self, users=None, role=None, linked=False):
        super().__init__(users=users, role=role)
        self._linked = linked
        self.user_roles_writes = 0

    async def execute(self, statement):
        s = str(statement)
        if "user_roles" in s:
            if s.lstrip().upper().startswith("INSERT"):
                self.user_roles_writes += 1
                self._linked = True
                return _RowResult([])
            return _RowResult([(1,)] if self._linked else [])
        if any(t in s for t in ("FROM products", "FROM product_images", "FROM categories", "FROM brands")):
            return _RowResult([])
        return await super().execute(statement)

    async def flush(self):
        for i, obj in enumerate(self.created, start=1):
            if getattr(obj, "id", None) is None:
                obj.id = f"fake-{i}"


@pytest.mark.asyncio()
async def test_seed_catalog_async_safe_without_missing_greenlet():
    """Catalog seeder role checks must never touch lazy User.roles in async mode."""
    admin = _GuardedUser(id="u-admin", email="admin@modit.in")
    buyer = _GuardedUser(id="u-buyer", email="buyer@modit.in")
    demo = _GuardedUser(id="u-demo", email="demo@modit.in")
    role = FakeORMObject(id="r-admin", name="admin")

    # 1. Unlinked user inserts into user_roles without reading .roles; repeat is idempotent.
    db_link = _CatalogSeedFakeDB(users=[admin, buyer, demo], role=role, linked=False)
    await seed._ensure_user_role(db_link, admin, role)
    assert db_link.user_roles_writes == 1
    await seed._ensure_user_role(db_link, admin, role)
    assert db_link.user_roles_writes == 1

    # 2. Full seed_catalog run with pre-existing users never accesses User.roles.
    sample = [{
        "name": "Test Cement", "sku": "TEST-SKU-1", "slug": "test-cement",
        "description": "OPC 53", "brand": "ACC", "brand_slug": "acc",
        "category": "Cement", "category_slug": "cement",
        "sub_category": None, "sub_category_slug": None,
        "unit": "50 kg", "unit_code": "BAG",
        "images": ["/products/cement/ACC Cement.png"],
        "price": 380.0, "mrp": 420.0, "gst_rate": 18.0, "gst_code": "GST 18%",
        "stock": 50, "in_stock": True, "moq": 1,
    }]
    db_cat = _CatalogSeedFakeDB(users=[admin, buyer, demo], role=role, linked=True)
    stats = await seed.seed_catalog(db_cat, sample)
    assert stats["products_created"] == 1
