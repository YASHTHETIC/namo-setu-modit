# syntax=docker/dockerfile:1.7

FROM python:3.12-slim AS backend-base
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /repo
ARG CACHEBUST=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential libpq-dev gcc \
  && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir -r requirements.txt

FROM backend-base AS backend-runtime
ENV PYTHONPATH=/repo
COPY backend ./backend
COPY backend/alembic.ini ./alembic.ini
COPY pyproject.toml ./pyproject.toml
EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
