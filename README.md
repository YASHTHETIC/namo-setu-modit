# MODIT — construction-materials marketplace (modit.in)

B2B/B2C storefront for cement, paint, steel, tiles and electricals with
pincode-based delivery. Buyers browse, estimate and order; suppliers apply,
quote RFQs and fulfill; staff run catalog, orders and payouts from the admin
console.

Live: **https://modit.in** · API: **https://api.modit.in**

## Stack

| Layer    | Choice                                                       |
| -------- | ------------------------------------------------------------ |
| Frontend | Next.js 15 + React 19 + Tailwind (`apps/modit/web`)         |
| Backend  | FastAPI + SQLAlchemy (async) + asyncpg (`backend/`)         |
| Data     | PostgreSQL 16, Redis (graceful degradation on cache failure) |
| Hosting  | Single Hostinger VPS, nginx reverse proxy, PM2 (`modit-api`, `modit-web`) |

One VPS is a deliberate choice: solo team, low ops overhead. Two uvicorn
workers x (10 pool + 20 overflow) stay under Postgres `max_connections`.

## Quickstart

```bash
npm install --legacy-peer-deps          # workspaces: web + packages/*
npm run dev --workspace=@modit/web      # http://localhost:3001

python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest backend/tests -q
```

Local infra (optional): `docker-compose.yml` provides Postgres 16 + Redis 7.
The backend test suite is fully hermetic (194 tests, no live Postgres or
Redis required). The frontend builds against its bundled catalog, so it
renders with zero backend running.

API docs (local): `http://localhost:8000/docs` · ReDoc at `/redoc`
(docs are disabled in production).

## Repo map

```
apps/modit/web/        storefront, admin console (/admin), supplier hub (/supplier)
packages/api-client/   typed API client shared by web
packages/ui/ packages/utils/  shared primitives
backend/app/           FastAPI routers, services, seeders
backend/alembic/       migrations — every schema change lands here, no exceptions
backend/seeds/         foundation data (users, orgs, brands, categories, GST… ~50 core SKUs)
deploy/setup.sh        idempotent VPS provisioner (Postgres, Redis, nginx, PM2)
.github/workflows/    CI gates + production deploy + nightly prod smoke
```

## Seed data

Two stages, two jobs — both idempotent, safe to re-run after every deploy:

| Stage | Command | Loads |
| ----- | ------- | ----- |
| Foundation | `python -m seeds.runner` (from `backend/`) | Demo accounts, orgs, brands, categories, units, GST, suppliers, ~50 core SKUs |
| Catalog | `python -m backend.app.seeders.catalog` | 1300+ SKU storefront catalog from `apps/modit/web/lib/product-data.ts` |

## Checks (run before every push — CI enforces the same)

```bash
.venv/bin/python -m pytest backend/tests -q
npm run test:unit --workspace=@modit/web
npm run lint --workspace=@modit/web        # zero warnings tolerated
npm run typecheck --workspace=@modit/web
npm run check-images
npm run build --workspace=@modit/web
bash -n deploy/setup.sh
```

## Deploy

Push to `main` → CI gates → SSH deploy to the VPS (migrate, seed,
build, restart, health-gate). Rollback is `git revert` + push.
Server runbook: `DEPLOY.md`. Working agreements: `AGENTS.md`.

## Demo accounts

| Role     | Email               | Password     |
| -------- | ------------------- | ------------ |
| Buyer    | demo@modit.in       | Demo@1234    |
| Supplier | supplier@modit.in   | Supplier@1234 |

Staff access is granted by an existing admin in `/admin` (Users tab).

## License

Private — all rights reserved.
