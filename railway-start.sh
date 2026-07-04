#!/bin/sh
# Railway startup script: run migrations, seed, then start server
set -e

echo "Running Alembic migrations..."
PYTHONPATH=. alembic -c backend/alembic.ini upgrade head

echo "Seeding demo data..."
PYTHONPATH=. python -m backend.seeds.runner

echo "Starting FastAPI server..."
exec uvicorn backend.app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
