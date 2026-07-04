# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS node-deps
WORKDIR /repo
COPY . .
RUN npm install

FROM node-deps AS namo-builder
WORKDIR /repo/apps/namo-setu/web
RUN npm run build

FROM node-deps AS modit-builder
WORKDIR /repo/apps/modit/web
RUN npm run build

FROM node:20-alpine AS namo-runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=namo-builder /repo/apps/namo-setu/web/.next/standalone ./
COPY --from=namo-builder /repo/apps/namo-setu/web/.next/static ./.next/static
COPY --from=namo-builder /repo/apps/namo-setu/web/public ./public
EXPOSE 3000
CMD ["node", "server.js"]

FROM node:20-alpine AS modit-runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=modit-builder /repo/apps/modit/web/.next/standalone ./
COPY --from=modit-builder /repo/apps/modit/web/.next/static ./.next/static
COPY --from=modit-builder /repo/apps/modit/web/public ./public
EXPOSE 3000
CMD ["node", "server.js"]

FROM python:3.12-slim AS backend-base
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /repo
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential libpq-dev gcc \
  && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir -r requirements.txt

FROM backend-base AS backend-runtime
ENV PYTHONPATH=/repo
ENV PYTHONUNBUFFERED=1
COPY backend ./backend
COPY backend/alembic.ini ./alembic.ini
COPY pyproject.toml ./pyproject.toml
RUN python -c "from backend.app.main import app; print(f'Routes: {len(app.routes)}')"
EXPOSE 8000
CMD ["/bin/sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
