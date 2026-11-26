"""Regression tests for critical end-to-end fixes across auth, billing, media, RFQ, and analytics."""

from __future__ import annotations

import time
from datetime import datetime, timezone
from types import SimpleNamespace

import pyotp
import pytest
from fastapi import HTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse

from conftest import FakeORMObject, FakeResult, NOW


@pytest.mark.asyncio()
async def test_rate_limit_middleware_returns_429_without_nameerror(monkeypatch):
    from backend.app.core.middleware import RateLimitMiddleware
    import backend.app.core.redis as redis_mod

    monkeypatch.setattr(redis_mod, "redis_circuit_open", lambda: True)

    async def ok_app(request):
        return JSONResponse({"ok": True})

    mw = RateLimitMiddleware(app=ok_app, requests_per_minute=1, browse_rpm=10)
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/v1/modit/checkout",
        "headers": [],
        "client": ("127.0.0.1", 12345),
    }

    async def call_next(req):
        return JSONResponse({"ok": True})

    r1 = await mw.dispatch(Request(scope), call_next)
    assert r1.status_code == 200
    r2 = await mw.dispatch(Request(scope), call_next)
    assert r2.status_code == 429

    # Cleanup evicts wall-clock timestamps older than 60s
    mw._last_cleanup = time.monotonic() - 120
    mw._local_counts["general"]["9.9.9.9"] = [time.time() - 120]
    mw._cleanup_local()
    assert "9.9.9.9" not in mw._local_counts["general"]


def test_2fa_secret_encrypt_decrypt_roundtrip():
    from backend.app.api.v1.auth_extended import _decrypt_mfa_secret, _encrypt_mfa_secret

    raw = pyotp.random_base32()
    enc = _encrypt_mfa_secret(raw)
    assert enc != raw
    dec = _decrypt_mfa_secret(enc)
    assert dec == raw
    code = pyotp.TOTP(raw).now()
    assert pyotp.TOTP(dec).verify(code, valid_window=1)
    assert _decrypt_mfa_secret("$2b$12$invalidhashvalue") is None


def test_media_static_routes_before_media_id(client):
    from backend.app.api.deps import get_current_user
    from backend.app.core.database import get_db
    from backend.app.main import app

    class EmptyMediaDB:
        async def execute(self, stmt):
            return FakeResult([], scalar_value=0)

    async def override_empty_db():
        yield EmptyMediaDB()

    async def override_user():
        return FakeORMObject(id="1", is_active=True)

    prev_db = app.dependency_overrides.get(get_db)
    prev_user = app.dependency_overrides.get(get_current_user)
    app.dependency_overrides[get_db] = override_empty_db
    app.dependency_overrides[get_current_user] = override_user
    try:
        r_assets = client.get("/api/v1/media/assets")
        r_docs = client.get("/api/v1/media/documents")
    finally:
        if prev_db is not None:
            app.dependency_overrides[get_db] = prev_db
        else:
            app.dependency_overrides.pop(get_db, None)
        if prev_user is not None:
            app.dependency_overrides[get_current_user] = prev_user
        else:
            app.dependency_overrides.pop(get_current_user, None)

    assert r_assets.status_code == 200, r_assets.text
    assert r_assets.json() == {"assets": [], "total": 0}
    assert r_docs.status_code == 200, r_docs.text
    assert r_docs.json() == {"documents": [], "total": 0}


def test_email_verification_request_accepts_email_payload(client):
    from backend.app.core.database import get_db
    from backend.app.main import app

    class VerifyReqDB:
        async def execute(self, stmt):
            return FakeResult([FakeORMObject(id="u-1", email="buyer@modit.in")])

        def add(self, obj):
            return None

        async def commit(self):
            return None

    async def override_db():
        yield VerifyReqDB()

    prev_db = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = override_db
    try:
        res = client.post(
            "/api/v1/users/email-verification/request",
            json={"email": "buyer@modit.in"},
        )
    finally:
        if prev_db is not None:
            app.dependency_overrides[get_db] = prev_db
        else:
            app.dependency_overrides.pop(get_db, None)

    assert res.status_code == 200, res.text


@pytest.mark.asyncio()
async def test_validate_coupon_db_deactivated_blocks_builtin():
    from backend.app.services.checkout import validate_coupon_db

    class CouponFakeDB:
        async def execute(self, stmt):
            disabled = FakeORMObject(
                id="c1",
                code="FREESHIP",
                discount_type="ship",
                discount_value=0.0,
                max_discount=None,
                min_order=0.0,
                valid_till=None,
                category=None,
                usage_limit=None,
                used_count=0,
                is_active=False,
                deleted_at=None,
            )
            return FakeResult([disabled])

    with pytest.raises(HTTPException) as exc:
        await validate_coupon_db(CouponFakeDB(), "FREESHIP", 1200.0, ["cement"])
    assert exc.value.status_code == 400


@pytest.mark.asyncio()
async def test_credit_approval_deducts_balance_atomically():
    from backend.app.services.checkout import _require_credit_approval

    account = SimpleNamespace(available_credit=1000.0)

    class CreditDB:
        async def execute(self, stmt):
            return FakeResult([account])

    db = CreditDB()
    await _require_credit_approval(db, "org-1", 600.0, deduct=True)
    assert account.available_credit == 400.0

    with pytest.raises(HTTPException) as exc:
        await _require_credit_approval(db, "org-1", 600.0, deduct=True)
    assert exc.value.status_code == 400


@pytest.mark.asyncio()
async def test_track_analytics_event_fields():
    from backend.app.services.modit import track_analytics_event

    added = []

    class TrackDB:
        def add(self, obj):
            added.append(obj)

    event = await track_analytics_event(TrackDB(), "u-1", "search_used", {"q": "cement"})
    assert event.event_type == "custom"
    assert event.payload_json == '{"q": "cement"}'
    assert added == [event]


@pytest.mark.asyncio()
async def test_rfq_to_detail_maps_two_column_product_names():
    from backend.app.services.modit import rfq_to_detail

    rfq = FakeORMObject(
        id="rfq-1",
        organization_id="org-1",
        project_id=None,
        rfq_number="RFQ-2026-01",
        status="open",
        requested_by_user_id="u-1",
        due_date=None,
        notes="Test RFQ",
        created_at=NOW,
        items=[
            FakeORMObject(
                id="ri-1",
                rfq_id="rfq-1",
                product_id="p-1",
                requested_quantity=10,
                unit_id="unit-1",
                unit_price_hint=350.0,
                target_price=350.0,
                notes=None,
                created_at=NOW,
            )
        ],
        quotations=[],
    )

    class RfqDB:
        async def refresh(self, obj, attrs):
            return None

        async def execute(self, stmt):
            return FakeResult([("p-1", "Ultratech Cement 50kg")])

    detail = await rfq_to_detail(RfqDB(), rfq)
    assert detail.items[0].product_name == "Ultratech Cement 50kg"


@pytest.mark.asyncio()
async def test_supplier_search_query_runs_without_mapper_c_crash():
    from backend.app.services.search_service import SearchService

    class SupplierSearchDB:
        async def execute(self, stmt):
            return FakeResult([], scalar_value=0)

    res = await SearchService().search_suppliers(SupplierSearchDB(), query="acc")
    assert res == {"items": [], "total": 0, "page": 1, "page_size": 20, "pages": 0}


@pytest.mark.asyncio()
async def test_claim_staff_logs_full_name_without_attribute_error(monkeypatch):
    from backend.app.api.v1 import auth as auth_mod

    monkeypatch.setattr(auth_mod, "_claim_first_staff", lambda db, user: __import__("asyncio").sleep(0, result=True))
    captured = []

    async def fake_audit(db, **kwargs):
        captured.append(kwargs)

    monkeypatch.setattr(auth_mod, "create_audit_log", fake_audit)

    class CommitDB:
        async def commit(self):
            return None

    user = SimpleNamespace(id="u-1", email="admin@modit.in", full_name="Site Admin")
    res = await auth_mod.claim_staff(user=user, db=CommitDB())
    assert res.claimed is True
    assert captured[0]["after"] == {"email": "admin@modit.in", "full_name": "Site Admin"}


@pytest.mark.asyncio()
async def test_logout_commits_refresh_revocation_without_sid():
    from backend.app.api.v1 import auth as auth_mod
    from backend.app.core.security import create_refresh_token
    from backend.app.schemas.auth import LogoutRequest

    token = create_refresh_token(subject="u-1")
    token_row = FakeORMObject(revoked=False)

    class LogoutDB:
        def __init__(self):
            self.committed = False

        async def execute(self, stmt):
            return FakeResult([token_row])

        async def commit(self):
            self.committed = True

    db = LogoutDB()
    res = await auth_mod.logout(LogoutRequest(refresh_token=token), db=db)
    assert res == {"detail": "Logged out"}
    assert token_row.revoked is True
    assert db.committed is True


def test_layout_service_product_images_exist_exact_case():
    import pathlib
    import re

    repo_root = pathlib.Path(__file__).resolve().parents[2]
    src = (repo_root / "backend" / "app" / "services" / "layout_service.py").read_text(encoding="utf-8")
    pub_dir = repo_root / "apps" / "modit" / "web" / "public"
    urls = sorted(set(re.findall(r'["\'](/products/[^"\']+)["\']', src)))
    assert urls, "Expected layout_service.py to reference product images"
    for url in urls:
        cur = pub_dir
        for part in url.strip("/").split("/"):
            entries = cur.iterdir()
            assert any(e.name == part for e in entries), f"Missing exact-case asset for {url}"
            cur = cur / part
        assert cur.is_file()

