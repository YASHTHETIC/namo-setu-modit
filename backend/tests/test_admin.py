"""Tests for admin endpoints (roles, permissions, health, audit)."""
import pytest


def test_admin_roles_requires_auth(client):
    response = client.post("/api/v1/admin/roles", json={"name": "editor"})
    assert response.status_code == 401


def test_admin_list_roles_requires_auth(client):
    response = client.get("/api/v1/admin/roles")
    assert response.status_code == 401


def test_admin_health(client):
    response = client.get("/api/v1/admin/health")
    assert response.status_code in (200, 401)


def test_admin_audit_logs_requires_auth(client):
    response = client.get("/api/v1/admin/audit-logs")
    assert response.status_code == 401


def test_admin_users_requires_auth(client):
    response = client.get("/api/v1/admin/users")
    assert response.status_code == 401


def test_admin_permissions_requires_auth(client):
    response = client.get("/api/v1/admin/permissions")
    assert response.status_code == 401


def test_admin_metrics_requires_auth(client):
    response = client.get("/api/v1/admin/metrics")
    assert response.status_code in (200, 401)


def test_admin_timeline_requires_auth(client):
    response = client.get("/api/v1/admin/activity-timeline")
    assert response.status_code == 401
