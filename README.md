# Namo Setu + MODIT Monorepo

Two independent full-stack products in a single monorepo:

- **Namo Setu** — Pilgrimage tourism and devotee assistance platform (port 3000)
- **MODIT** — B2B building material marketplace and procurement platform (port 3001)

## Architecture

```
apps/
  namo-setu/web/        Next.js 15 + React 19 (basePath: /namo)
  modit/web/            Next.js 15 + React 19 (basePath: /modit)
backend/
  app/
    api/v1/             FastAPI routers — 136 endpoints, 186 schemas
    core/               Config, async DB, Redis, JWT auth, RBAC, logging
    models/             SQLAlchemy async ORM — 76+ tables, UUID PKs, soft delete
    schemas/            Pydantic v2 request/response models
    services/           Business logic (no ORM in routes)
packages/
  api-client/           Typed fetch wrappers (createNamoApi, createModitApi)
  ui/                   Shared React components
  utils/                Shared TypeScript utilities
docker-compose.yml      PostgreSQL 16, Redis 7, backend, 2 frontends
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

# 3. Namo Setu (separate terminal)
cd apps/namo-setu/web
npm install && npm run dev                       # http://localhost:3000/namo

# 4. MODIT (separate terminal)
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
| Namo Setu | http://localhost:3000/namo |
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

### Namo Setu
| Method | Path | Description |
|--------|------|-------------|
| GET | /namo/search/popular | Top temples |
| GET | /namo/search/temples | Full-text search |
| GET | /namo/temples/{id} | Temple detail |
| GET | /namo/temples/{id}/darshan/slots | Available slots |
| POST | /namo/darshan/bookings | Book darshan |
| POST | /namo/donations | Make donation |
| GET | /namo/accommodation/hotels | Browse hotels |
| GET | /namo/travel/packages | Travel packages |
| POST | /namo/travel/planner | AI trip planner |
| POST | /namo/ai/spiritual-guide | AI spiritual guide |
| POST | /namo/ai/nearby | Nearby places |
| GET | /namo/analytics/summary | Dashboard metrics |

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

- **Inter font** (single consistent typeface across both apps)
- **CSS custom properties** — 20+ design tokens for colors, shadows, radii
- **Framer Motion** stagger animations on all pages
- **Empty states** with Lucide icons on every list page
- **Error states** with retry buttons on all MODIT pages
- **Temple selector fallback** on Namo Setu booking/donation/travel/accommodation
- **Skeleton loading** for progressive data loading
- **focus-visible** rings for keyboard accessibility

## Seed Data

Loaded via `PYTHONPATH=".." python -m seeds.runner`:

| Table | Count |
|-------|-------|
| Temples | 10 |
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
