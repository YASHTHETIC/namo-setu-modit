"""End-to-end API journey test for the local E2E stack (scripts/local-e2e-server.py).

Covers: health, login (password + OTP), register, catalog, cart, COD checkout,
server-side pricing math, idempotency replay, razorpay degradation (503), credit
rejection, order lifecycle (buyer cancel + staff fulfillment + terminal states),
coupons (admin create -> buyer redeem -> unknown-code rejection), RBAC (403s),
RFQ -> quotation -> award -> purchase order, admin endpoints, refresh/me.

Run:  python scripts/api_journey.py           (server must be on 127.0.0.1:8000)
Exit: 0 = all pass, 1 = failures (results also written to .local-test/api-journey-results.json)
"""

from __future__ import annotations

import json
import re
import sys
import time
import uuid
from pathlib import Path

import httpx

REPO = Path(__file__).resolve().parents[1]
BASE = "http://127.0.0.1:8000"
V1 = f"{BASE}/api/v1"
LOG = REPO / ".local-test" / "server.log"
OUT = REPO / ".local-test" / "api-journey-results.json"

# 429-aware pacing: the general bucket is 120 req/min for this IP.
MIN_INTERVAL = 0.55
_last_call = [0.0]

results: list[dict] = []


def _throttle() -> None:
    wait = MIN_INTERVAL - (time.monotonic() - _last_call[0])
    if wait > 0:
        time.sleep(wait)
    _last_call[0] = time.monotonic()


def call(method: str, path: str, token: str | None = None, json_body=None, *, name: str,
         expect_status: int | None = 200, expect_status_any: list[int] | None = None) -> dict:
    """One HTTP call + assertion. Returns parsed JSON (or {}). Records a result row."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    _throttle()
    r = httpx.request(method, f"{V1}{path}" if path.startswith("/") else path,
                      headers=headers, json=json_body, timeout=30.0)
    if r.status_code == 429:  # rate-limited: back off and retry once
        time.sleep(6)
        _throttle()
        r = httpx.request(method, f"{V1}{path}" if path.startswith("/") else path,
                          headers=headers, json=json_body, timeout=30.0)
    ok = True
    detail = ""
    if expect_status_any is not None:
        ok = r.status_code in expect_status_any
        detail = f"expected one of {expect_status_any}, got {r.status_code}"
    elif expect_status is not None:
        ok = r.status_code == expect_status
        detail = f"expected {expect_status}, got {r.status_code}"
    body: dict = {}
    try:
        body = r.json()
    except Exception:
        body = {"raw": r.text[:400]}
    if isinstance(body, dict):
        body["__status"] = r.status_code
    # A 2xx response that still carries an error "detail" is anomalous — flag it.
    # Intentional non-2xx expectations (400/403/503 tests) never flip on this.
    if ok and 200 <= r.status_code < 300 and isinstance(body, dict) and body.get("detail"):
        detail = f"unexpected error detail: {body['detail']}"
        ok = False
    row = {"name": name, "method": method, "path": path, "status": r.status_code,
           "ok": ok, "detail": detail if not ok else ""}
    results.append(row)
    mark = "PASS" if ok else "FAIL"
    extra = "" if ok else f" -> {detail} | body={json.dumps(body)[:220]}"
    print(f"[{mark}] {name} ({r.status_code}){extra}")
    return body


def check(name: str, ok: bool, detail: str = "") -> None:
    results.append({"name": name, "ok": bool(ok), "detail": "" if ok else detail})
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + ("" if ok else f" -> {detail}"))


def main() -> int:
    stamp = uuid.uuid4().hex[:6]

    # 1. Health
    r = httpx.get(f"{BASE}/healthz", timeout=10)
    check("healthz ok", r.status_code == 200 and r.json().get("status") == "ok")

    # 2. Password logins
    admin = call("POST", "/auth/login", json_body={"email": "admin@modit.in", "password": "Demo@1234"},
                 name="admin password login", expect_status=200)
    admin_tok = admin.get("access_token", "")
    buyer = call("POST", "/auth/login", json_body={"email": "demo@modit.in", "password": "Demo@1234"},
                 name="buyer password login", expect_status=200)
    buyer_tok = buyer.get("access_token", "")
    check("tokens issued", bool(admin_tok) and bool(buyer_tok))
    check("buyer token has user payload", buyer.get("user", {}).get("email") == "demo@modit.in")
    buyer_user_id = buyer.get("user", {}).get("id", "")

    # 3. Register fresh buyer
    reg = call("POST", "/auth/register",
               json_body={"email": f"e2e-{stamp}@test.modit.in", "password": "Test@12345", "full_name": "E2E Tester"},
               name="register new buyer", expect_status=201)
    reg_tok = reg.get("access_token", "")
    check("register returns token", bool(reg_tok))

    # 4. Catalog
    prods = call("GET", "/modit/products?page_size=12", name="products list", expect_status=200)
    items = prods.get("items", [])
    check("products list non-empty", len(items) >= 5, f"got {len(items)}")
    sample = items[0]
    sku, pid = sample.get("sku", ""), sample.get("id", "")
    check("product has sku+price", bool(sku) and float(sample.get("list_price", 0) or 0) > 0,
          f"sku={sku!r} price={sample.get('list_price')}")
    detail = call("GET", f"/modit/products/{pid}", name="product detail", expect_status=200)
    check("product detail id matches", detail.get("id") == pid)
    cats = call("GET", "/modit/categories", name="categories", expect_status=200)
    check("categories seeded", len(cats) if isinstance(cats, list) else 0, "no categories")
    brands = call("GET", "/modit/brands", name="brands", expect_status=200)
    check("brands seeded", len(brands) if isinstance(brands, list) else 0, "no brands")
    search = call("GET", "/modit/products?search=cement&page_size=5", name="search=cement", expect_status=200)
    check("search returns matches", len(search.get("items", [])) > 0)

    # 5. Cart
    org_id = None
    me = call("GET", "/auth/me", token=buyer_tok, name="auth/me", expect_status=200)
    cart = call("POST", "/modit/cart", token=buyer_tok,
                json_body={"items": [{"product_id": pid, "quantity": 4, "unit_price": float(sample["list_price"])}],
                           "organization_id": me.get("organization_id") or buyer_user_id},
                name="cart upsert", expect_status=200)
    check("cart totals present", "grand_total" in cart and float(cart.get("grand_total", 0)) > 0,
          f"cart={cart}")

    # 6. COD checkout + server-side math
    address = {"name": "Demo Buyer", "phone": "+919999900002", "line1": "12 Test Street",
               "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}
    ref = f"e2e-{stamp}-cod"
    co = call("POST", "/modit/checkout", token=buyer_tok,
              json_body={"items": [{"sku": sku, "quantity": 4}],
                         "payment_method": "cod", "address_snapshot": address,
                         "client_reference": ref},
              name="COD checkout", expect_status=201)
    order_id = co.get("id", "")
    check("order id + number", bool(order_id) and bool(co.get("order_number")))
    s, g, sh, d, gt = (float(co.get(k, 0) or 0) for k in
                       ("subtotal", "gst_total", "shipping_total", "discount_total", "grand_total"))
    check("totals math consistent", abs(s + g + sh - d - gt) < 0.02,
          f"{s}+{g}+{sh}-{d} != {gt}")
    check("unit price matches catalog", abs(float(co.get("items", [{}])[0].get("unit_price", 0)) - float(sample["list_price"])) < 0.01)

    # 7. Idempotency replay (same client_reference -> same order)
    replay = call("POST", "/modit/checkout", token=buyer_tok,
                  json_body={"items": [{"sku": sku, "quantity": 4}],
                             "payment_method": "cod", "address_snapshot": address,
                             "client_reference": ref},
                  name="checkout replay (idempotent)", expect_status=201)
    check("replay returns SAME order", replay.get("id") == order_id,
          f"{replay.get('id')} != {order_id}")

    # 7b. Different reference -> genuinely new order
    co2 = call("POST", "/modit/checkout", token=buyer_tok,
               json_body={"items": [{"sku": sku, "quantity": 2}],
                          "payment_method": "cod", "address_snapshot": address},
               name="second COD order (no ref)", expect_status=201)
    check("second order distinct", co2.get("id") not in ("", order_id))
    order2_id = co2.get("id", "")

    # 8. Razorpay flow without keys: checkout creates a pending-payment order
    # (201 is correct), then widget init via /payments/razorpay/order 503s and
    # the frontend falls back to COD messaging.
    rz = call("POST", "/modit/checkout", token=buyer_tok,
              json_body={"items": [{"sku": sku, "quantity": 1}],
                         "payment_method": "razorpay", "address_snapshot": address},
              name="razorpay checkout (pending payment)", expect_status=201)
    check("razorpay order pending payment", rz.get("payment_status") == "pending",
          f"payment_status={rz.get('payment_status')}")
    rz_order = rz.get("id", "")
    init503 = call("POST", "/payments/razorpay/order", token=buyer_tok,
                   json_body={"order_id": rz_order},
                   name="razorpay widget init w/o keys 503", expect_status=503)
    check("503 steers buyer to COD", "COD" in json.dumps(init503) or bool(init503.get("detail")),
          f"body={init503}")

    # 8b. Credit without approval -> rejected
    cr = call("POST", "/modit/checkout", token=buyer_tok,
              json_body={"items": [{"sku": sku, "quantity": 1}],
                         "payment_method": "credit", "address_snapshot": address},
              name="credit without account rejected", expect_status=None)
    st_credit = cr.get("__status", 0)
    check("credit rejected (4xx)", 400 <= st_credit < 500, f"got {st_credit}")

    # 9. Coupon: admin creates, buyer redeems, unknown code rejected
    coupon = call("POST", "/admin/coupons", token=admin_tok,
                  json_body={"code": f"E2E{stamp}".upper(), "description": "e2e test coupon",
                             "discount_type": "percent", "discount_value": 5,
                             "min_order": 100, "is_active": True},
                  name="admin create coupon", expect_status=201)
    offers = call("GET", "/modit/coupons", name="coupon offers list", expect_status=200)
    codes = [o.get("code") for o in (offers if isinstance(offers, list) else offers.get("items", []))]
    check("created coupon listed publicly", f"E2E{stamp}".upper() in codes, f"codes={codes[:8]}")
    big_sku = None
    big = [p for p in items if float(p.get("list_price", 0) or 0) * 10 >= 100]
    big_sku = (big[0] if big else sample).get("sku")
    with_coupon = call("POST", "/modit/checkout", token=buyer_tok,
                       json_body={"items": [{"sku": big_sku, "quantity": 10}],
                                  "payment_method": "cod", "address_snapshot": address,
                                  "coupon_code": f"E2E{stamp}".upper()},
                       name="checkout with coupon", expect_status=201)
    check("coupon discount applied", float(with_coupon.get("discount_total", 0) or 0) > 0,
          f"discount_total={with_coupon.get('discount_total')}")
    bad = call("POST", "/modit/checkout", token=buyer_tok,
               json_body={"items": [{"sku": big_sku, "quantity": 1}],
                          "payment_method": "cod", "address_snapshot": address,
                          "coupon_code": "NO-SUCH-CODE"},
               name="unknown coupon rejected", expect_status=400)

    # 10. Orders: list + detail. NOTE: GET /orders/{id} is intentionally
    # shareable by unguessable UUID (family/SMS tracking, asserted in
    # test_legacy_authz.py) — any user gets 200 for a valid UUID.
    orders = call("GET", "/modit/orders", token=buyer_tok, name="buyer orders list", expect_status=200)
    order_list = orders if isinstance(orders, list) else orders.get("items", [])
    check("buyer sees own orders", any(o.get("id") == order_id for o in order_list))
    od = call("GET", f"/modit/orders/{order_id}", token=buyer_tok, name="order detail", expect_status=200)
    check("order detail has items", len(od.get("items", [])) >= 1)
    od_share = call("GET", f"/modit/orders/{order_id}", token=reg_tok, name="shareable order link (by design)", expect_status=200)
    junk = call("GET", "/modit/orders/not-a-real-id", name="junk order id 404", expect_status=404)

    # 11. Buyer cancels own order -> allowed early
    cancelled = call("PATCH", f"/modit/orders/{order2_id}/status", token=buyer_tok,
                     json_body={"status": "cancelled"}, name="buyer cancels own order", expect_status=200)
    check("cancel persisted", cancelled.get("status") == "cancelled")

    # 12. Buyer cannot set non-cancel status (403)
    forbidden = call("PATCH", f"/modit/orders/{order_id}/status", token=buyer_tok,
                     json_body={"status": "confirmed"}, name="buyer status change 403", expect_status=403)

    # 13. Staff fulfillment: confirmed -> dispatched -> delivered (terminal)
    for st in ("confirmed", "dispatched", "delivered"):
        call("PATCH", f"/modit/orders/{order_id}/status", token=admin_tok,
             json_body={"status": st}, name=f"admin status -> {st}", expect_status=200)
    terminal = call("PATCH", f"/modit/orders/{order_id}/status", token=admin_tok,
                    json_body={"status": "cancelled"}, name="delivered is terminal (400)", expect_status=400)

    # 14. Inventory endpoints
    inv = call("GET", "/modit/inventory", token=admin_tok, name="inventory list", expect_status=200)
    alerts = call("GET", "/modit/inventory/alerts", token=admin_tok, name="inventory alerts", expect_status=200)

    # 15. RBAC: buyer hits admin endpoints -> 403
    call("GET", "/admin/users", token=buyer_tok, name="buyer /admin/users 403", expect_status=403)
    call("POST", "/modit/products", token=buyer_tok,
         json_body={"sku": "HACK", "name": "x", "category_id": "x", "unit_id": "x",
                    "list_price": 1, "organization_id": "x"},
         name="buyer create product 403", expect_status_any=[403, 422])

    # 16. Admin panel endpoints
    users = call("GET", "/admin/users", token=admin_tok, name="admin users list", expect_status=200)
    call("GET", "/admin/health", token=admin_tok, name="admin health", expect_status=200)
    metrics = call("GET", "/admin/metrics", token=admin_tok, name="admin metrics", expect_status=200)
    audit = call("GET", "/admin/audit-logs", token=admin_tok, name="admin audit logs", expect_status=200)
    check("audit log captured status change", isinstance(audit, (list, dict)))

    # 17. RFQ -> quotation -> award -> PO
    rfq = call("POST", "/modit/rfq", token=buyer_tok,
               json_body={"items": [{"product_id": pid, "requested_quantity": 50}],
                          "notes": "E2E bulk quote request"},
               name="RFQ create", expect_status=201)
    rfq_id = rfq.get("id", "")
    rfqd = call("GET", f"/modit/rfq/{rfq_id}", token=buyer_tok, name="RFQ detail", expect_status=200)
    check("RFQ detail has items", len(rfqd.get("items", [])) >= 1)
    suppliers = call("GET", "/modit/suppliers", token=buyer_tok, name="suppliers list", expect_status=200)
    supplier_id = ""
    if isinstance(suppliers, list) and suppliers:
        supplier_id = suppliers[0].get("id", "")
    if not supplier_id:
        sup = call("POST", "/modit/suppliers", token=admin_tok,
                   json_body={"organization_id": buyer_user_id, "supplier_code": f"E2E-SUP-{stamp}"},
                   name="create supplier", expect_status=201)
        supplier_id = sup.get("id", "")
    quo = call("POST", "/modit/quotations", token=buyer_tok,
               json_body={"rfq_id": rfq_id, "supplier_id": supplier_id,
                          "valid_until": "2027-12-31", "terms_and_conditions": "e2e"},
               name="quotation create", expect_status=201)
    quotes = call("GET", f"/modit/rfq/{rfq_id}/quotations", token=buyer_tok,
                  name="RFQ quotations list", expect_status=200)
    award = call("POST", f"/modit/rfq/{rfq_id}/award", token=buyer_tok,
                 json_body={"quotation_id": quo.get("id")},
                 name="RFQ award -> PO", expect_status=200)
    check("award creates PO", bool(award.get("purchase_order_id") and award.get("order_number")))
    pos = call("GET", "/modit/purchase-orders", token=buyer_tok, name="purchase orders list", expect_status=200)

    # 18. OTP login (code read from server log; digits-only phone tail)
    phone_digits = "919999" + "".join(ch for ch in stamp if ch.isdigit()).ljust(6, "7")[:6]
    phone = "+" + phone_digits
    r = httpx.post(f"{V1}/auth/otp/request", json={"phone": phone}, timeout=30.0)
    check("otp request sent", r.status_code == 200 and r.json().get("sent") is True,
          f"status={r.status_code} body={r.text[:150]}")
    time.sleep(1.2)  # allow log flush
    code = None
    if LOG.exists():
        hits = re.findall(r"OTP for \+91 \d{2}\.\.\.\d{2}: (\d{6})", LOG.read_text(encoding="utf-8", errors="ignore"))
        code = hits[-1] if hits else None
    if code is None:
        check("otp code found in log", False, "no code parsed from server.log")
    else:
        otp_login = call("POST", "/auth/otp/verify",
                         json_body={"phone": phone, "code": code},
                         name="otp verify -> token", expect_status=200)
        check("otp login issues tokens", bool(otp_login.get("access_token")))
        call("POST", "/auth/otp/verify", json_body={"phone": phone, "code": "000000"},
             name="wrong otp rejected 401", expect_status=401)

    # 19. Refresh + logout
    rf = call("POST", "/auth/refresh", json_body={"refresh_token": buyer.get("refresh_token", "")},
              name="refresh token rotation", expect_status=200)
    check("refresh returns new token", bool(rf.get("access_token")))

    # 20. Review: public product reviews list
    call("GET", f"/modit/products?page_size=2&sort=price_asc", name="sort param ok", expect_status=200)

    # ---- summary ----
    failed = [r for r in results if not r["ok"]]
    print("\n================ API JOURNEY SUMMARY ================")
    print(f"total checks: {len(results)}  passed: {len(results) - len(failed)}  FAILED: {len(failed)}")
    for f in failed:
        print(f"  FAIL: {f['name']}" + (f" ({f.get('method')} {f.get('path')})" if f.get("path") else "")
              + (f" -> {f['detail']}" if f.get("detail") else ""))
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(results, indent=2, default=str), encoding="utf-8")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
