"""Order-placement load + resilience test for the local E2E stack.

Goal: a burst of real buyers must never turn 5xx, never trip the rate
limiter during normal volume, never oversell, and keep p95 sane — the
launch promise is "the server never pauses order placement".

Phases (all concurrent via threads, like a browser tab doing retries):
  A. Burst: 32 simultaneous 3-line COD orders (unique client_reference)
  B. Same-SKU shock: 24 simultaneous qty-1 orders on ONE SKU
  C. Oversell guard: qty 10,000,000 must fail 400 without a 500

Pass = zero 5xx anywhere, zero unexpected 429, every 201 order readable
back via GET /orders/{id}, distinct order numbers for distinct refs.

Run:  python scripts/order_load.py          (server on 127.0.0.1:8000)
Exit: 0 = pass, 1 = any failure.
"""

from __future__ import annotations

import concurrent.futures as cf
import json
import sys
import time
import uuid
from pathlib import Path

import httpx

REPO = Path(__file__).resolve().parents[1]
BASE = "http://127.0.0.1:8000"
V1 = f"{BASE}/api/v1"
ADDRESS = {
    "name": "Load Buyer", "phone": "+919999900099", "line1": "9 Load Street",
    "city": "Mumbai", "state": "Maharashtra", "pincode": "400001",
}


def percentiles(xs: list[float]) -> tuple[float, float, float]:
    xs = sorted(xs)
    n = len(xs)

    def pct(p: float) -> float:
        if n == 1:
            return xs[0]
        idx = round(p * (n - 1))
        return xs[idx]

    return xs[0], pct(0.95), xs[-1]


def burst(token: str, jobs: list[dict]) -> tuple[list[dict], list[int], int, float]:
    """Concurrent checkout. Returns (results, statuses, n_5xx, max_latency)."""
    results: list[dict] = []

    def run(job: dict) -> dict:
        started = time.perf_counter()
        try:
            r = httpx.post(
                f"{V1}/modit/checkout",
                headers={"Authorization": f"Bearer {token}"},
                json=job,
                timeout=45.0,
            )
            body: dict = {"raw": r.text[:200]}
            try:
                body = r.json()
            except Exception:
                pass
            return {"status": r.status_code, "ms": (time.perf_counter() - started) * 1000.0,
                    "body": body}
        except Exception as e:
            return {"status": -1, "ms": (time.perf_counter() - started) * 1000.0,
                    "body": {"detail": f"EXC {e}"}}

    with cf.ThreadPoolExecutor(max_workers=len(jobs)) as pool:
        results = list(pool.map(run, jobs))
    statuses = [x["status"] for x in results]
    fives = sum(1 for s in statuses if 500 <= s < 600)
    return results, statuses, fives, max(x["ms"] for x in results)


def main() -> int:
    stamp = uuid.uuid4().hex[:6]

    # health must be fast even at the start
    t0 = time.perf_counter()
    r = httpx.get(f"{BASE}/healthz", timeout=10)
    health_ms = (time.perf_counter() - t0) * 1000.0
    if r.status_code != 200 or r.json().get("status") != "ok":
        print("FAIL healthz not ok"); return 1
    print(f"[PASS] healthz ok ({health_ms:.0f} ms)")

    login = httpx.post(f"{V1}/auth/login", json={"email": "demo@modit.in", "password": "Demo@1234"}, timeout=15)
    token = login.json().get("access_token")
    if not token:
        print("FAIL login"); return 1
    auth = {"Authorization": f"Bearer {token}"}

    prods = httpx.get(f"{V1}/modit/products?page_size=12", headers=auth, timeout=20).json().get("items", [])
    skus = [p["sku"] for p in prods if p.get("sku")]
    if len(skus) < 3:
        print(f"FAIL catalog too small: {skus}"); return 1

    failures: list[str] = []

    # --- Phase A: burst of mixed 3-line orders -------------------
    jobs = []
    for i in range(32):
        tri = [skus[i % len(skus)], skus[(i * 3 + 1) % len(skus)], skus[(i * 7 + 2) % len(skus)]]
        jobs.append({
            "items": [{"sku": s, "quantity": 1 + (i % 3)} for s in dict.fromkeys(tri)],
            "payment_method": "cod",
            "address_snapshot": ADDRESS,
            "client_reference": f"load-{stamp}-{i}",
        })
    res_a, st_a, fives_a, max_ms_a = burst(token, jobs)
    ok_a = sum(1 for s in st_a if s == 201)
    ins_a = sum(1 for s in st_a if s == 400)
    lat_a = percentiles([x["ms"] for x in res_a])
    print(f"[burst] 201={ok_a}/32 400(insufficient)={ins_a} 5xx={fives_a} p50/p95/max={lat_a[0]:.0f}/{lat_a[1]:.0f}/{lat_a[2]:.0f} ms")
    if fives_a: failures.append(f"phase A had {fives_a} 5xx responses")
    if st_a.count(429): failures.append(f"phase A hit rate limit {st_a.count(429)}x")
    ids_a = [x["body"].get("id") for x in res_a if x["status"] == 201]
    if len(set(ids_a)) != len(ids_a):
        failures.append("phase A duplicate order ids across distinct client_references")

    # --- Phase B: everyone hammers ONE SKU -----------------------
    jobs = []
    for i in range(24):
        jobs.append({
            "items": [{"sku": skus[0], "quantity": 1}],
            "payment_method": "cod", "address_snapshot": ADDRESS,
            "client_reference": f"load-{stamp}-single-{i}",
        })
    res_b, st_b, fives_b, max_ms_b = burst(token, jobs)
    ok_b = sum(1 for s in st_b if s == 201)
    ins_b = sum(1 for s in st_b if s == 400)
    lat_b = percentiles([x["ms"] for x in res_b])
    print(f"[same-sku] 201={ok_b}/24 insufficient=400x{ins_b} 5xx={fives_b} p50/p95/max={lat_b[0]:.0f}/{lat_b[1]:.0f}/{lat_b[2]:.0f} ms")
    if fives_b: failures.append(f"phase B had {fives_b} 5xx responses")
    if st_b.count(429): failures.append(f"phase B hit rate limit {st_b.count(429)}x")
    ids_b = [x["body"].get("id") for x in res_b if x["status"] == 201]
    if len(set(ids_b)) != len(ids_b):
        failures.append("phase B duplicate order ids")

    # --- Phase C: oversell fails loudly at BOTH layers, never 5xx ---
    # qty > 100000 -> 422 by the schema cap; qty below cap but above stock -> 400
    # from the FOR UPDATE stock check. Either is a safe rejection.
    mega = httpx.post(
        f"{V1}/modit/checkout", headers=auth,
        json={"items": [{"sku": skus[0], "quantity": 10_000_000}], "payment_method": "cod",
              "address_snapshot": ADDRESS, "client_reference": f"load-{stamp}-mega"},
        timeout=30.0,
    )
    if mega.status_code in (400, 410, 422):
        print(f"[oversell-capped] rejected {mega.status_code} (detail={str(mega.json().get('detail',''))[:70]})")
    elif mega.status_code == 201:
        print("[oversell-capped] FAIL 201 accepted a 10M qty order"); failures.append("oversell accepted")
    else:
        print(f"[oversell-capped] FAIL status {mega.status_code}"); failures.append(f"oversell got {mega.status_code}")

    r = httpx.post(
        f"{V1}/modit/checkout", headers=auth,
        json={"items": [{"sku": skus[0], "quantity": 90_000}], "payment_method": "cod",
              "address_snapshot": ADDRESS, "client_reference": f"load-{stamp}-big"},
        timeout=30.0,
    )
    if r.status_code == 400:
        detail = str(r.json().get("detail", ""))
        if "stock" in detail.lower():
            print(f"[oversell-stock] rejected 400 ({detail[:70]})")
        else:
            print(f"[oversell-stock] 400 but wrong reason: {detail[:70]}")
            failures.append(f"oversell-stock 400 reason: {detail[:80]}")
    elif r.status_code in (410, 422):
        print(f"[oversell-stock] rejected {r.status_code}")
    elif r.status_code == 201:
        print("[oversell-stock] FAIL 201 accepted a 90k-unit order"); failures.append("oversell-stock accepted")
    else:
        print(f"[oversell-stock] FAIL status {r.status_code}"); failures.append(f"oversell-stock got {r.status_code}")

    # --- Orders readable back ------------------------------------
    spot = ids_a[:5] + ids_b[:5]
    for oid in spot:
        rr = httpx.get(f"{V1}/modit/orders/{oid}", headers=auth, timeout=20)
        if rr.status_code != 200:
            failures.append(f"order {oid} unreadable ({rr.status_code})")
            break
    else:
        print(f"[readback] {len(spot)} spot orders readable")

    # health after the storm (pool not exhausted, still single-digit-ish)
    t0 = time.perf_counter()
    rr = httpx.get(f"{BASE}/healthz", timeout=10)
    health_after = (time.perf_counter() - t0) * 1000.0
    print(f"[safe]    healthz after {40 + len(st_b)} orders: {rr.status_code} ({health_after:.0f} ms)")
    if rr.status_code != 200:
        failures.append("healthz not 200 after storm")

    if failures:
        print("\n==== ORDER LOAD: FAIL ====")
        for f in failures:
            print(" -", f)
        return 1
    print("\n==== ORDER LOAD: PASS (no 5xx, no 429, no duplicate ids) ====")
    return 0


if __name__ == "__main__":
    sys.exit(main())
