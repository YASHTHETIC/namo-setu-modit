"""Tests for security endpoints."""

from backend.app.core.middleware import RateLimitMiddleware


def _mw():
    # App instance is unused by bucket_for; place a dummy.
    return RateLimitMiddleware(app=object())


def test_rate_limit_status(client):
    response = client.get("/api/v1/security/rate-limit-status?key=test")
    assert response.status_code in (200, 401)


def test_rate_limit_buckets():
    mw = _mw()
    # Credential flows: tightest window.
    bucket, _, limit = mw.bucket_for("POST", "/api/v1/auth/login")
    assert (bucket, limit) == ("auth", 10)
    # Catalog browsing: thousands-shared-IP-friendly window.
    bucket, _, limit = mw.bucket_for("GET", "/api/v1/modit/products")
    assert (bucket, limit) == ("browse", mw.browse_rpm)
    assert limit > 1000  # a sales rush must not count browsing as abuse
    bucket, _, limit = mw.bucket_for("GET", "/api/v1/modit/products/1")
    assert (bucket, limit) == ("browse", mw.browse_rpm)
    # Everything else (writes, admin, staff): general window.
    bucket, _, limit = mw.bucket_for("POST", "/api/v1/modit/checkout")
    assert (bucket, limit) == ("general", mw.rpm)
    bucket, _, limit = mw.bucket_for("GET", "/api/v1/admin/users")
    assert (bucket, limit) == ("general", mw.rpm)
    # Prefix-spoof trap: a fake path starting with products must NOT get the
    # browse bucket.
    bucket, _, limit = mw.bucket_for("GET", "/api/v1/modit/productsfoo/bar")
    assert bucket == "general"


def test_validate_file(client):
    response = client.post("/api/v1/security/validate-file", json={"filename": "test.pdf", "file_size": 1024, "allowed_types": ["pdf", "jpg"]})
    assert response.status_code in (200, 401, 422)


def test_sanitize(client):
    response = client.post("/api/v1/security/sanitize", json={"text": "<script>alert('xss')</script>Hello"})
    assert response.status_code in (200, 401, 422)
