"""Tests for notification endpoints."""
import pytest


def test_list_notifications_requires_auth(client):
    response = client.get("/api/v1/notifications")
    assert response.status_code == 401


def test_unread_count_requires_auth(client):
    response = client.get("/api/v1/notifications/unread-count")
    assert response.status_code == 401


def test_create_notification_requires_auth(client):
    response = client.post("/api/v1/notifications", params={"title": "Test", "message": "Test msg"})
    assert response.status_code == 401


def test_mark_read_requires_auth(client):
    response = client.post("/api/v1/notifications/fake-id/read")
    assert response.status_code == 401


def test_read_all_requires_auth(client):
    response = client.post("/api/v1/notifications/read-all")
    assert response.status_code == 401


def test_delete_notification_requires_auth(client):
    response = client.delete("/api/v1/notifications/fake-id")
    assert response.status_code == 401


def test_notification_preferences_requires_auth(client):
    response = client.patch("/api/v1/notifications/preferences", json={"notification_preferences_json": "{}"})
    assert response.status_code == 401
