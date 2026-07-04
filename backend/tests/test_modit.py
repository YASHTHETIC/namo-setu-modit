"""Tests for MODIT API endpoints."""
import pytest


def test_list_products(client):
    """Test listing products."""
    response = client.get("/api/v1/modit/products")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "page" in data
    assert "total" in data


def test_list_categories(client):
    """Test listing categories."""
    response = client.get("/api/v1/modit/categories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_list_suppliers(client):
    """Test listing suppliers."""
    response = client.get("/api/v1/modit/suppliers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_list_rfqs(client):
    """Test listing RFQs."""
    response = client.get("/api/v1/modit/rfq")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_list_orders(client):
    """Test listing orders."""
    response = client.get("/api/v1/modit/orders")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_list_projects(client):
    """Test listing projects."""
    response = client.get("/api/v1/modit/projects")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_list_inventory(client):
    """Test listing inventory."""
    response = client.get("/api/v1/modit/inventory")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_inventory_alerts(client):
    """Test inventory alerts."""
    response = client.get("/api/v1/modit/inventory/alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_inventory_analytics(client):
    """Test inventory analytics."""
    response = client.get("/api/v1/modit/inventory/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "total_products" in data
    assert "low_stock_count" in data
    assert "out_of_stock_count" in data


def test_analytics_summary(client):
    """Test MODIT analytics summary - requires admin auth, so expect 401."""
    response = client.get("/api/v1/modit/analytics/summary")
    assert response.status_code == 401


def test_ai_material_recommendation(client):
    """Test AI material recommendation."""
    response = client.post(
        "/api/v1/modit/ai/material-recommendation",
        json={"project_type": "residential", "budget": 1000000, "requirements": "Cement and steel"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert "estimated_cost" in data


def test_ai_procurement_assistant(client):
    """Test AI procurement assistant."""
    response = client.post(
        "/api/v1/modit/ai/procurement-assistant",
        json={"message": "What materials do I need for a residential project?"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "suggested_actions" in data
