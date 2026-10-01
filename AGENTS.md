# Project: MODIT — construction-materials marketplace (modit.in)

## What this product does
B2B/B2C storefront for cement, paint, lighting, tiles etc. with delivery.
Buyers browse/search/order (login-gated checkout); admin manages catalog,
orders, suppliers. No redesign of the existing look without asking.

## Stack (do not change without asking)
- Frontend: Next.js 15 + React 19 + Tailwind (`apps/modit/web`, workspace `@modit/web`)
- Backend: FastAPI + SQLAlchemy async + asyncpg (`backend/`, `uvicorn --workers 2`)
- DB: PostgreSQL (local on VPS, `modit` db) · Cache: Redis · Reverse proxy: nginx
- Hosting: Hostinger VPS KVM 2 Ubuntu (`/opt/modit`, PM2 `modit-api`/`modit-web`)
- Live: https://modit.in (+ https://api.modit.in) · Repo: private `YASHTHETIC/modit`

## Rules
- Never commit secrets. Server `.env` files are created by `deploy/setup.sh`
  only (chmod 600); repo carries `.env.example`. History has no secrets — keep it so.
- Every DB change = alembic migration (`backend/alembic`), never hand-edit prod DB.
- Product images: URL-safe names only (`[A-Za-z0-9 ._-]`) — `npm run check-images` enforces.
- Backend perf budget: healthz single-digit ms, list endpoints <100ms server-side.
- Verify before saying done: `pytest backend/tests -q`, `npm run build --workspace=@modit/web`.
- Small commits, deploy via server pull + rebuild + `pm2 restart` (see DEPLOY.md).

## Commands
- Frontend dev/build: `npm run dev|build --workspace=@modit/web`
- Backend tests: `pytest backend/tests -q` (from repo root)
- Image audit: `npm run check-images`
- Deploy script check: `bash -n deploy/setup.sh`
- Server update: `cd /opt/modit && git pull && npm run build --workspace=@modit/web && pm2 restart modit-web modit-api`

## Architecture decisions
- Modular monolith on one VPS (solo team, low ops). No microservices/K8s at this scale.
- Pool math: 2 uvicorn workers × (10 pool + 20 overflow) = 60 max < PG `max_connections` 100.
- Redis degrades gracefully (circuit breaker); Postgres tuned for shared 8GB box.
- Nightly pg_dump (7-day retention) + 5-min self-heal cron + pm2-logrotate on server.
