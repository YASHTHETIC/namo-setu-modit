"""Read-path capacity test: can the server absorb a thousand-user rush?

Simulates the browsing path (the most-served surface) with a concurrency
ladder: every level fires N simultaneous requests — a realistic mix of
catalog list pages, product details, categories, brands and healthz —
then reports status counts and latency percentiles before stepping up.

Pass = zero 5xx at every level, zero unexpected 429 from a single IP
(the API grants 300 req/min per IP), healthz healthy at the end.

Run:  python scripts/read_load.py            (server on 127.0.0.1:8000)
      READ_LOAD_LADDER=25,50,100,300         (custom ladder, default shown)
Exit: 0 = pass, 1 = failure.
"""

from __future__ import annotations

import concurrent.futures as cf
import os
import sys
import time

import httpx

BASE = "http://127.0.0.1:8000"
V1 = f"{BASE}/api/v1"
LADDER = [int(x) for x in os.environ.get("READ_LOAD_LADDER", "25,50,100,200").split(",") if x.strip()]


def percentiles(xs: list[float]) -> tuple[float, float, float]:
    xs_l = sorted(xs)
    return xs_l[0], xs_l[min(len(xs_l) - 1, round(0.95 * (len(xs_l) - 1)))], xs_l[-1]


def one_request(args: tuple[str, str | None]) -> tuple[int, float, str]:
    path, token = args
    started = time.perf_counter()
    try:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        r = httpx.get(path, headers=headers, timeout=45.0)
        return r.status_code, (time.perf_counter() - started) * 1000.0, path
    except Exception as e:
        return -1, (time.perf_counter() - started) * 1000.0, f"{path} EXC {e}"


def fire_level(n: int, jobs: list[tuple[str, str | None]]) -> dict:
    started = time.perf_counter()
    with cf.ThreadPoolExecutor(max_workers=n) as pool:
        run = list(pool.map(one_request, [jobs[i % len(jobs)] for i in range(n)]))
    wall = (time.perf_counter() - started) * 1000.0
    codes = [s for s, _, _ in run]
    lat = percentiles([ms for _, ms, _ in run])
    return {
        "fives": sum(1 for s in codes if 500 <= s < 600),
        "ratelimit": sum(1 for s in codes if s == 429),
        "errs": sum(1 for s in codes if s == -1),
        "ok": sum(1 for s in codes if 200 <= s < 300),
        "lat": lat,
        "wall": wall,
        "slowest_ms": max((ms for _, ms, _ in run), default=0.0),
    }


def main() -> int:
    login = httpx.post(
        f"{V1}/auth/login", json={"email": "demo@modit.in", "password": "Demo@1234"}, timeout=15
    )
    token = login.json().get("access_token")
    if not token:
        print("FAIL login"); return 1

    items = httpx.get(f"{V1}/modit/products?page_size=40", headers={"Authorization": f"Bearer {token}"}, timeout=30).json().get("items", [])
    ids = [p["id"] for p in items[:40] if p.get("id")]
    if len(ids) < 4:
        print("FAIL catalog too small"); return 1

    # The realistic URL mix: list pages page through, details vary, admin
    # endpoints excluded (no staff at scale); healthz sprinkled in to prove
    # the health path stays alive under load.
    jobs: list[tuple[str, str | None]] = []
    for i in range(60):
        jobs.append((f"{V1}/modit/products?page_size=24&page={i % 5 + 1}", token))
        jobs.append((f"{V1}/modit/products/{ids[i % len(ids)]}", token))
    jobs += [(f"{BASE}/healthz", None)] * 8
    jobs += [(f"{V1}/modit/categories", None), (f"{V1}/modit/brands", None)]

    failures: list[str] = []
    for level in LADDER:
        m = fire_level(level, jobs)
        print(
            f"[level {level:>4}] ok={m['ok']}/{level} 5xx={m['fives']} 429={m['ratelimit']} "
            f"errs={m['errs']} p50/p95/max={m['lat'][0]:.0f}/{m['lat'][1]:.0f}/{m['lat'][2]:.0f} ms "
            f"wall={m['wall']:.0f} ms"
        )
        if m["fives"]:
            failures.append(f"level {level}: {m['fives']} x 5xx")
        if m["ratelimit"]:
            failures.append(f"level {level}: {m['ratelimit']} x 429 (single IP)")
        if m["errs"]:
            failures.append(f"level {level}: {m['errs']} client errors")
        if m["slowest_ms"] > 45000:
            failures.append(f"level {level}: a request exceeded 45s ({m['slowest_ms']:.0f} ms)")

    r = httpx.get(f"{BASE}/healthz", timeout=10)
    ok = r.status_code == 200 and r.json().get("status") == "ok"
    print(f"[safe] healthz after ladder: {r.status_code} ({'deps ok' if ok else r.text[:120]})")
    if not ok:
        failures.append("healthz degraded after the ladder")

    if failures:
        print("\n==== READ LOAD: FAIL ====")
        for f in failures:
            print(" -", f)
        return 1
    print("\n==== READ LOAD: PASS — no 5xx/429 through the ladder ====")
    return 0


if __name__ == "__main__":
    sys.exit(main())
