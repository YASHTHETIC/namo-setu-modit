import pytest


def test_healthz(client):
    response = client.get("/api/v1/healthz")

    assert response.status_code == 200
    body = response.json()
    assert "status" in body
    assert "dependencies" in body
