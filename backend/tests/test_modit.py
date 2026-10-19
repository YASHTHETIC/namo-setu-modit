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
    assert data and isinstance(data[0].get("product_count"), int)


def test_get_product_detail_never_500s_on_partial_data(client):
    """Detail must serialize even when relations are missing (no lazy-load trap)."""
    response = client.get("/api/v1/modit/products/some-id")
    assert response.status_code == 200
    data = response.json()
    assert data["id"]
    assert isinstance(data.get("images"), list)


def test_list_suppliers(client):
    """Supplier directory is internal: login required."""
    response = client.get("/api/v1/modit/suppliers")
    assert response.status_code == 401


def test_list_rfqs(client):
    """RFQ list is internal: login required."""
    response = client.get("/api/v1/modit/rfq")
    assert response.status_code == 401


def test_list_orders(client):
    """Test listing orders."""
    response = client.get("/api/v1/modit/orders")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_list_projects(client):
    """Project list is internal: login required."""
    response = client.get("/api/v1/modit/projects")
    assert response.status_code == 401


def test_list_inventory(client):
    """Inventory list is internal: login required."""
    response = client.get("/api/v1/modit/inventory")
    assert response.status_code == 401


def test_inventory_alerts(client):
    """Inventory alerts are internal: login required."""
    response = client.get("/api/v1/modit/inventory/alerts")
    assert response.status_code == 401


def test_inventory_analytics(client):
    """Inventory analytics are internal: login required."""
    response = client.get("/api/v1/modit/inventory/analytics")
    assert response.status_code == 401


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
    assert response.status_code == 401


def test_ai_procurement_assistant(client):
    """Test AI procurement assistant."""
    response = client.post(
        "/api/v1/modit/ai/procurement-assistant",
        json={"message": "What materials do I need for a residential project?"},
    )
    assert response.status_code == 401


def test_seed_catalog_requires_staff(client):
    """One-click seeding is staff-only."""
    response = client.post("/api/v1/modit/admin/seed-catalog")
    assert response.status_code == 401


def test_category_endpoints_require_staff(client):
    assert client.post("/api/v1/modit/categories", json={"name": "X", "slug": "x"}).status_code == 401
    assert client.patch("/api/v1/modit/categories/x", json={"name": "Y"}).status_code == 401
    assert client.post("/api/v1/modit/subcategories", json={"category_id": "c", "name": "X", "slug": "x"}).status_code == 401
    assert client.patch("/api/v1/modit/subcategories/x", json={"name": "Y"}).status_code == 401


def test_product_mutations_are_staff_gated():
    """Catalog deletes/patches must carry an auth dependency (no silent mass wipes)."""
    from backend.app.main import app

    hits = 0
    for route in app.routes:
        if getattr(route, "path", "") == "/api/v1/modit/products/{product_id}":
            dependant = getattr(route, "dependant", None)
            if getattr(dependant, "dependencies", None):
                hits += 1
    assert hits >= 2, "PATCH + DELETE /products/{id} must be staff-gated"


def test_category_update_schema():
    from backend.app.schemas.modit import CategoryUpdate, SubCategoryUpdate

    assert CategoryUpdate().model_dump(exclude_unset=True) == {}
    assert CategoryUpdate(name="Cement").model_dump(exclude_unset=True) == {"name": "Cement"}
    assert SubCategoryUpdate(is_active=False).model_dump(exclude_unset=True) == {"is_active": False}


def test_cart_endpoints_require_auth(client):
    """Server cart is per-buyer: every route needs login."""
    assert client.get("/api/v1/modit/cart/items").status_code == 401
    assert client.post("/api/v1/modit/cart/items", json={"product_id": "x", "quantity": 1}).status_code == 401
    assert client.patch("/api/v1/modit/cart/items/x", json={"quantity": 2}).status_code == 401
    assert client.delete("/api/v1/modit/cart/items/x").status_code == 401
    assert client.delete("/api/v1/modit/cart").status_code == 401
    assert client.post("/api/v1/modit/cart/merge", json={"items": []}).status_code == 401


def test_cart_variant_key():
    from backend.app.api.v1.modit import _cart_variant_key

    assert _cart_variant_key(None) == ""
    assert _cart_variant_key("  ") == ""
    assert _cart_variant_key("v-123") == "v-123"


def test_cart_schemas_reject_bad_quantities():
    import pytest
    from pydantic import ValidationError

    from backend.app.schemas.modit import CartItemUpsert, CartQuantityUpdate

    with pytest.raises(ValidationError):
        CartItemUpsert(product_id="p", quantity=0)
    with pytest.raises(ValidationError):
        CartQuantityUpdate(quantity=0)
    assert CartItemUpsert(product_id="p", quantity=2).variant_key is None
