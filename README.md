# MODIT Monorepo

A B2B building material marketplace and procurement platform.

## Architecture

```
apps/
  modit/web/            Next.js 15 + React 19 (basePath: /modit)
backend/
  app/
    api/v1/             FastAPI routers — 136 endpoints, 186 schemas
    core/               Config, async DB, Redis, JWT auth, RBAC, logging
    models/             SQLAlchemy async ORM — 76+ tables, UUID PKs, soft delete
    schemas/            Pydantic v2 request/response models
    services/           Business logic (no ORM in routes)
packages/
  api-client/           Typed fetch wrappers (createModitApi)
  ui/                   Shared React components
  utils/                Shared TypeScript utilities
docker-compose.yml      PostgreSQL 16, Redis 7, backend, frontend
```

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16+ (or Docker)
- Redis 7+ (or Docker)

### Run locally

```bash
# 1. Start infrastructure
docker-compose up -d postgres redis

# 2. Backend
cd backend
pip install -r ../requirements.txt
PYTHONPATH=".." alembic upgrade head
PYTHONPATH=".." python -m seeds.runner          # seed sample data
PYTHONPATH=".." uvicorn app.main:app --reload --port 8000

# 3. MODIT (separate terminal)
cd apps/modit/web
npm install && npm run dev                       # http://localhost:3001/modit
```

### Run everything with Docker
```bash
docker-compose up --build
```

## URLs

| Service | URL |
|---------|-----|
| MODIT | http://localhost:3001/modit |
| Backend API | http://localhost:8000/api/v1 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

## API — 136 Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Get JWT tokens |
| POST | /auth/refresh | Refresh access token |
| GET | /auth/me | Current user profile |

### MODIT
| Method | Path | Description |
|--------|------|-------------|
| GET | /modit/products | Product catalog (51 seeded) |
| GET | /modit/categories | 12 categories |
| GET | /modit/brands | 20 brands |
| GET | /modit/suppliers | 5 suppliers |
| GET | /modit/rfq | Request for quotations |
| GET | /modit/orders | Purchase orders |
| GET | /modit/inventory | 160 inventory items |
| GET | /modit/projects | Construction projects |
| POST | /modit/ai/material-recommendation | AI material suggestions |
| POST | /modit/ai/boq-reader | Parse bill of quantities |
| POST | /modit/ai/vendor-matching | Find best suppliers |
| POST | /modit/ai/procurement-assistant | AI procurement helper |
| POST | /modit/ai/voice-order | Voice-to-order |
| POST | /modit/ai/smart-reorder | Auto-reorder suggestions |
| GET | /modit/analytics/summary | Dashboard metrics |

## Backend Highlights

- **Async SQLAlchemy 2.0** with Alembic migrations
- **JWT auth** with access/refresh tokens, MFA scaffolding
- **RBAC**: 5 roles, 18 permissions, `require_permission` dependency
- **AI services** query real database (not hardcoded stubs)
- **Soft delete** filtering on all list endpoints
- **19 passing tests** with dependency-overridden fake DB/Redis

## Frontend Highlights

- **Inter font** (single consistent typeface)
- **CSS custom properties** — 20+ design tokens for colors, shadows, radii
- **Framer Motion** stagger animations on all pages
- **Empty states** with Lucide icons on every list page
- **Error states** with retry buttons on all pages
- **Skeleton loading** for progressive data loading
- **focus-visible** rings for keyboard accessibility

## Seed Data

Loaded via `PYTHONPATH=".." python -m seeds.runner`:

| Table | Count |
|-------|-------|
| Products | 51 |
| Categories | 12 |
| Brands | 20 |
| Suppliers | 5 |
| Inventory items | 160 |
| Orders | 3 |

## Testing

```bash
cd backend
python -m pytest tests/ -v       # 19/19 passing
```

## Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| DATABASE_URL | Yes | postgresql+asyncpg://... |
| REDIS_URL | Yes | redis://localhost:6379 |
| SECRET_KEY | Yes | (set in .env) |
| OPENAI_API_KEY | No | (for AI features) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Database | PostgreSQL 16, Redis 7 |
| Auth | JWT (PyJWT), bcrypt, MFA TOTP scaffold |
| AI | OpenAI-compatible endpoints (works without API key via fallback) |
| Testing | pytest, pytest-asyncio, pytest-cov |
| Animation | Framer Motion |
| Icons | Lucide React |

## License

Private — Hiring Assignment Submission
