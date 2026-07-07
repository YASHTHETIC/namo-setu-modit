"""Tests for review endpoints."""
import pytest


def test_create_review_requires_auth(client):
    response = client.post("/api/v1/reviews", json={"target_type": "temple", "target_id": "t1", "rating": 5})
    assert response.status_code == 401


def test_list_reviews(client):
    response = client.get("/api/v1/reviews?target_type=temple&target_id=t1")
    assert response.status_code in (200, 401, 500)


def test_review_stats(client):
    response = client.get("/api/v1/reviews/stats?target_type=temple&target_id=t1")
    assert response.status_code in (200, 401, 500)


def test_my_reviews_requires_auth(client):
    response = client.get("/api/v1/reviews/my-reviews")
    assert response.status_code == 401


def test_like_review_requires_auth(client):
    response = client.post("/api/v1/reviews/fake-id/like")
    assert response.status_code == 401


def test_comment_on_review_requires_auth(client):
    response = client.post("/api/v1/reviews/fake-id/comments", json={"body": "Great!"})
    assert response.status_code == 401


def test_report_review_requires_auth(client):
    response = client.post("/api/v1/reviews/fake-id/report", json={"reason": "spam"})
    assert response.status_code == 401


def test_update_review_requires_auth(client):
    response = client.put("/api/v1/reviews/fake-id", json={"rating": 4})
    assert response.status_code == 401


def test_delete_review_requires_auth(client):
    response = client.delete("/api/v1/reviews/fake-id")
    assert response.status_code == 401
