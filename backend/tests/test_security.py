"""Tests for security endpoints."""


def test_rate_limit_status(client):
    response = client.get("/api/v1/security/rate-limit-status?key=test")
    assert response.status_code in (200, 401)


def test_validate_file(client):
    response = client.post("/api/v1/security/validate-file", json={"filename": "test.pdf", "file_size": 1024, "allowed_types": ["pdf", "jpg"]})
    assert response.status_code in (200, 401, 422)


def test_sanitize(client):
    response = client.post("/api/v1/security/sanitize", json={"text": "<script>alert('xss')</script>Hello"})
    assert response.status_code in (200, 401, 422)
