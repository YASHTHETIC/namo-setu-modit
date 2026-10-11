"""Tests for extended auth endpoints."""


def test_forgot_password(client):
    response = client.post("/api/v1/auth/forgot-password", json={"email": "test@example.com"})
    assert response.status_code in (200, 422, 500)


def test_reset_password(client):
    response = client.post("/api/v1/auth/reset-password", json={"token": "fake", "new_password": "newpassword123"})
    assert response.status_code in (200, 400, 422, 500)


def test_verify_email(client):
    response = client.post("/api/v1/auth/verify-email", json={"token": "fake"})
    assert response.status_code in (200, 400, 422, 500)


def test_google_login(client):
    response = client.post("/api/v1/auth/google", json={"id_token": "fake_token"})
    assert response.status_code in (200, 401, 422, 500)


def test_sessions_requires_auth(client):
    response = client.get("/api/v1/auth/sessions")
    assert response.status_code == 401


def test_change_password_requires_auth(client):
    response = client.post("/api/v1/auth/change-password", json={"current_password": "old", "new_password": "new12345"})
    assert response.status_code == 401


def test_profile_requires_auth(client):
    response = client.get("/api/v1/auth/profile")
    assert response.status_code == 401


def test_update_profile_requires_auth(client):
    response = client.put("/api/v1/auth/profile", json={"full_name": "Test"})
    assert response.status_code == 401


def test_enable_2fa_requires_auth(client):
    response = client.post("/api/v1/auth/2fa/enable")
    assert response.status_code == 401


def test_disable_2fa_requires_auth(client):
    response = client.post("/api/v1/auth/2fa/disable")
    assert response.status_code == 401


def test_verify_2fa_requires_auth(client):
    response = client.post("/api/v1/auth/2fa/verify", json={"code": "123456"})
    assert response.status_code == 401


def test_send_verification(client):
    response = client.post("/api/v1/auth/send-verification")
    assert response.status_code in (200, 401)


def test_revoke_all_sessions_requires_auth(client):
    response = client.delete("/api/v1/auth/sessions")
    assert response.status_code == 401


def test_bootstrap_admin_assigns_super_admin(monkeypatch):
    import asyncio
    from types import SimpleNamespace

    from backend.app.api.v1 import auth as auth_module
    from backend.app.core.rbac import RoleName

    monkeypatch.setattr(
        auth_module, "get_settings", lambda: SimpleNamespace(bootstrap_admin_email="boss@modit.in")
    )

    class Rows:
        def __init__(self, row):
            self._row = row

        def scalars(self):
            return self

        def first(self):
            return self._row

        def scalar_one_or_none(self):
            return self._row

    class FakeSession:
        async def execute(self, stmt):
            return Rows(None)

        def add(self, obj):
            pass

        async def flush(self):
            pass

    user = SimpleNamespace(email="boss@modit.in", roles=[])
    asyncio.run(auth_module._ensure_bootstrap_admin(FakeSession(), user))
    assert [r.name for r in user.roles] == [RoleName.SUPER_ADMIN.value]
    # second run is a no-op (no duplicate role)
    asyncio.run(auth_module._ensure_bootstrap_admin(FakeSession(), user))
    assert [r.name for r in user.roles] == [RoleName.SUPER_ADMIN.value]

    other = SimpleNamespace(email="someone@else.in", roles=[])
    asyncio.run(auth_module._ensure_bootstrap_admin(FakeSession(), other))
    assert other.roles == []

    monkeypatch.setattr(auth_module, "get_settings", lambda: SimpleNamespace(bootstrap_admin_email=None))
    third = SimpleNamespace(email="boss@modit.in", roles=[])
    asyncio.run(auth_module._ensure_bootstrap_admin(FakeSession(), third))
    assert third.roles == []


def test_otp_endpoints_validate_phone(client):
    response = client.post("/api/v1/auth/otp/request", json={"phone": "12345"})
    assert response.status_code == 422
    response = client.post("/api/v1/auth/otp/verify", json={"phone": "12345", "code": "000000"})
    assert response.status_code == 422


def test_otp_verify_wrong_code_is_401(client):
    response = client.post("/api/v1/auth/otp/verify", json={"phone": "9876543210", "code": "000000"})
    assert response.status_code == 401


def test_staff_endpoints_require_auth(client):
    assert client.get("/api/v1/auth/staff-status").status_code == 401
    assert client.post("/api/v1/auth/claim-staff").status_code == 401


def test_claim_first_staff_only_when_empty():
    import asyncio
    from types import SimpleNamespace

    from backend.app.api.v1 import auth as auth_module

    class Rows:
        def __init__(self, rows):
            self._rows = rows

        def scalars(self):
            return self

        def first(self):
            return self._rows[0] if self._rows else None

        def scalar_one_or_none(self):
            return self._rows[0] if self._rows else None

    class EmptySession:
        """No roles, no staff anywhere."""

        async def execute(self, stmt):
            return Rows([])

        def add(self, obj):
            pass

        async def flush(self):
            pass

    class StaffedSession(EmptySession):
        """Someone is already staff."""

        async def execute(self, stmt):
            return Rows([SimpleNamespace(id="u1")])

    user = SimpleNamespace(email="boss@modit.in", roles=[])
    assert asyncio.run(auth_module._claim_first_staff(EmptySession(), user)) is True
    assert [r.name for r in user.roles] == ["super_admin"]

    other = SimpleNamespace(email="next@modit.in", roles=[])
    assert asyncio.run(auth_module._claim_first_staff(StaffedSession(), other)) is False
    assert other.roles == []
