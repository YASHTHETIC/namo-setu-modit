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


@pytest.mark.asyncio()
async def test_seed_catalog_async_safe_without_missing_greenlet():
    """Real AsyncSession run must never raise MissingGreenlet on user role checks."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from backend.app.core.database import Base
    import backend.app.models  # noqa: F401

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

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
    async with session_factory() as s:
        stats1 = await seed.seed_catalog(s, sample)
        await s.commit()
    async with session_factory() as s:
        stats2 = await seed.seed_catalog(s, sample)
        await s.commit()
    await engine.dispose()

    assert stats1["products_created"] == 1
    assert stats2["products_updated"] == 1
