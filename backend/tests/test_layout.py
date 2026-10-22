"""Layout endpoint contract tests (server-driven home UI).

Covers the corrected mount path (/api/v1/layout/{screen}) and the
graceful-degradation contract: a broken catalog DB must still yield a
valid static layout instead of a 500.
"""
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.core.database import get_db
from backend.app.main import app


@pytest.mark.asyncio
async def test_layout_home_success_shape():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/layout/home")
    assert resp.status_code == 200
    body = resp.json()
    assert body["screen"] == "home"
    types = [section["type"] for section in body["sections"]]
    assert "DeliveryBar" in types
    assert "CategoryGrid" in types
    assert "ProductCarousel" in types
    assert body["meta"]["eta"] == "60 mins"


class _BrokenDBSession:
    async def execute(self, statement: Any):
        raise RuntimeError("db exploded")

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


async def _broken_get_db():
    yield _BrokenDBSession()


@pytest.mark.asyncio
async def test_layout_serves_fallback_when_db_fails():
    saved = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = _broken_get_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/api/v1/layout/home")
    finally:
        if saved is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = saved

    assert resp.status_code == 200, resp.json()
    body = resp.json()
    types = [section["type"] for section in body["sections"]]
    # Static fallback sections survive the DB outage
    assert "DeliveryBar" in types
    assert "AssuredStrip" in types
    assert "CategoryGrid" in types
    assert "ProductCarousel" in types
    carousel = next(s for s in body["sections"] if s["type"] == "ProductCarousel")
    assert len(carousel["data"]["products"]) > 0
