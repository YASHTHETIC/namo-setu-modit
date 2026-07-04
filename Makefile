.PHONY: help backend-dev frontend-namo-dev frontend-modit-dev test lint build compose-up compose-down migrate

help:
	@echo "backend-dev        Run the FastAPI backend"
	@echo "frontend-namo-dev  Run the Namo Setu frontend"
	@echo "frontend-modit-dev Run the MODIT frontend"
	@echo "test               Run backend tests"
	@echo "lint               Run workspace linting"
	@echo "build              Run workspace builds"
	@echo "compose-up         Start Docker Compose stack"
	@echo "compose-down       Stop Docker Compose stack"
	@echo "migrate            Run Alembic migrations"

backend-dev:
	python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

frontend-namo-dev:
	npm run dev --workspace @namo-setu/web

frontend-modit-dev:
	npm run dev --workspace @modit/web

test:
	pytest

lint:
	npm run lint --workspaces --if-present

build:
	npm run build --workspaces --if-present

compose-up:
	docker compose up --build

compose-down:
	docker compose down

migrate:
	python -m alembic upgrade head
