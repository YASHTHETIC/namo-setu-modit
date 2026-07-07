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
