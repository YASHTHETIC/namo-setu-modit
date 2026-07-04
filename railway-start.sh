#!/bin/sh
set -e

export PYTHONPATH=/repo

echo "[startup] Running Alembic migrations..."
alembic -c backend/alembic.ini upgrade head || echo "[startup] Migration skipped (tables may already exist)"

echo "[startup] Seeding demo data..."
python -m backend.seeds.runner || echo "[startup] Seeding skipped"

echo "[startup] Starting FastAPI server..."
exec uvicorn backend.app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
