"""Delivery-day hardening: legacy template writes and PII/financial reads
require login. Auth runs before body validation, so {} suffices."""

import pytest

CASES = [
    # unauthenticated writes (were open)
    ("POST", "/api/v1/modit/suppliers"),
    ("POST", "/api/v1/modit/suppliers/x/vendors"),
    ("POST", "/api/v1/modit/warehouses"),
    ("POST", "/api/v1/modit/inventory"),
    ("POST", "/api/v1/modit/invoices"),
    ("POST", "/api/v1/modit/purchase-orders"),
    ("POST", "/api/v1/modit/quotations"),
    ("POST", "/api/v1/modit/projects"),
    ("POST", "/api/v1/modit/projects/x/sites"),
    ("POST", "/api/v1/modit/returns"),
    ("POST", "/api/v1/modit/boq"),
    ("POST", "/api/v1/modit/boq/x/items"),
    ("POST", "/api/v1/modit/cart"),
    ("POST", "/api/v1/modit/deliveries"),
    ("POST", "/api/v1/modit/drivers"),
    ("POST", "/api/v1/modit/vehicles"),
    ("POST", "/api/v1/modit/products/x/images"),
    ("PATCH", "/api/v1/modit/inventory/x"),
    ("PATCH", "/api/v1/modit/projects/x"),
    ("POST", "/api/v1/modit/rfq/x/items"),
    ("POST", "/api/v1/modit/rfq/x/award"),
    ("GET", "/api/v1/supplier/rfqs"),
    # PII / financial reads
    ("GET", "/api/v1/modit/drivers"),
    ("GET", "/api/v1/modit/vehicles"),
    ("GET", "/api/v1/modit/invoices"),
    ("GET", "/api/v1/modit/purchase-orders"),
    ("GET", "/api/v1/modit/quotations/x"),
    ("GET", "/api/v1/modit/rfq/x/quotations"),
]


@pytest.mark.parametrize("method,path", CASES)
def test_legacy_routes_require_login(client, method, path):
    if method == "PATCH":
        r = client.patch(path, json={})
    elif method == "GET":
        r = client.get(path)
    else:
        r = client.post(path, json={})
    assert r.status_code == 401, (method, path, r.status_code)


def test_designed_public_stays_open(client):
    assert client.get("/api/v1/healthz").status_code == 200
    assert client.get("/api/v1/modit/products?page_size=1").status_code == 200
    assert client.get("/api/v1/modit/categories").status_code == 200
    assert client.post("/api/v1/supplier/apply", json={}).status_code == 422
    # shareable tracking link stays public (unguessable UUID deep links)
    assert client.get("/api/v1/modit/deliveries/x/track").status_code in (200, 404)
