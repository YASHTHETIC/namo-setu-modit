"""Regression: concurrent checkout with the same client_reference must not 500.

Reproduces the double-tap race found by browser testing: three parallel POST
/checkout calls sharing one idempotency key. Expected: exactly one order
created, every response 201 (winner) or replay of the winner — never a 500
IntegrityError, never a duplicate order.
"""
from __future__ import annotations

import concurrent.futures
import json
import sys
import time
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000/api/v1"


def _req(method: str, path: str, body: dict | None = None, token: str | None = None) -> tuple[int, dict]:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")


def main() -> int:
    time.sleep(1)
    status, auth = _req("POST", "/auth/login", {"email": "demo@modit.in", "password": "Demo@1234"})
    if status != 200:
        print(f"FAIL login {status} {auth}")
        return 1
    token = auth["access_token"]

    ref = f"racer-{int(time.time() * 1000)}"
    payload = {
        "items": [{"sku": "CEM-ACC-50", "quantity": 1}],
        "payment_method": "cod",
        "client_reference": ref,
        "address_snapshot": {
            "name": "Race Tester", "phone": "9876543210", "line1": "1 Race St",
            "city": "Noida", "state": "Uttar Pradesh", "pincode": "201301",
        },
    }

    n = 3
    with concurrent.futures.ThreadPoolExecutor(max_workers=n) as pool:
        results = list(pool.map(lambda _: _req("POST", "/modit/checkout", payload, token), range(n)))

    statuses = [s for s, _ in results]
    ok = True
    print(f"responses: {statuses}")
    if any(s == 500 for s in statuses):
        print(f"FAIL: 500 among responses: {results}")
        ok = False
    order_ids = {r.get("order_id") or r.get("id") for s, r in results if s in (200, 201)}
    order_ids.discard(None)
    print(f"distinct order ids: {order_ids}")
    if len(order_ids) != 1:
        print(f"FAIL: expected exactly 1 distinct order, got {len(order_ids)}: {results}")
        ok = False
    if not all(s in (200, 201) for s in statuses):
        print(f"FAIL: non-2xx response among results: {results}")
        ok = False

    # Confirm on the server side too: the buyer's order count grows by
    # exactly one (OrderRead does not expose client_reference).
    _, before = _req("GET", "/modit/orders?page_size=200", token=token)
    before_n = len(before) if isinstance(before, list) else len(before.get("items", []))
    ref2 = f"racer2-{int(time.time() * 1000)}"
    payload2 = dict(payload, client_reference=ref2)
    with concurrent.futures.ThreadPoolExecutor(max_workers=n) as pool:
        results2 = list(pool.map(lambda _: _req("POST", "/modit/checkout", payload2, token), range(n)))
    _, after = _req("GET", "/modit/orders?page_size=200", token=token)
    after_n = len(after) if isinstance(after, list) else len(after.get("items", []))
    delta = after_n - before_n
    print(f"orders before/after second race: {before_n}->{after_n} (delta {delta})")
    statuses2 = [s for s, _ in results2]
    print(f"second race responses: {statuses2}")
    if delta != 1 or any(s == 500 for s in statuses2):
        print(f"FAIL: expected delta 1 with no 500s, got delta {delta}, statuses {statuses2}")
        ok = False

    print("PASS concurrent double-tap checkout is idempotent" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
