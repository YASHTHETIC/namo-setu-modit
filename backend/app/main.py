from contextlib import asynccontextmanager
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.app.core.config import get_settings
from backend.app.core.exceptions import register_exception_handlers
from backend.app.core.logging import configure_logging
from backend.app.core.middleware import (
    ValidationMiddleware,
    ContentTypeMiddleware,
    SecurityHeadersMiddleware,
    RateLimitMiddleware,
    GZipMiddleware,
    RequestTimeoutMiddleware,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    from backend.app.core.database import engine
    from backend.app.core.redis import get_redis_client

    configure_logging(settings.log_level)
    logger = __import__("logging").get.getLogger(__name__)
    logger.info("Starting MODIT backend...")
    logger.info(f"Environment: {settings.environment}")

    try:
        yield
    finally:
        logger.info("Shutting down MODIT backend...")
        try:
            await engine.dispose()
        except Exception:
            pass
        try:
            await get_redis_client().aclose()
        except Exception:
            pass


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url="/redoc" if settings.environment != "production" else None,
    )

    # GZip compression (reduces bandwidth 60-80%)
    app.add_middleware(GZipMiddleware)

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Request timeout (prevents resource exhaustion)
    app.add_middleware(RequestTimeoutMiddleware)

    # Rate limiting (Redis-backed, 120 req/min per IP)
    app.add_middleware(RateLimitMiddleware, requests_per_minute=120, burst=30)

    # Security headers
    app.add_middleware(SecurityHeadersMiddleware)

    # Content type + request tracking
    app.add_middleware(ContentTypeMiddleware)
    app.add_middleware(ValidationMiddleware)

    # Register exception handlers
    register_exception_handlers(app)

    @app.get("/healthz")
    @app.get("/api/v1/healthz")
    async def healthz():
        from backend.app.core.database import AsyncSessionLocal
        from backend.app.core.redis import get_redis_client

        db_ok = True
        redis_ok = True
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
        except Exception:
            db_ok = False
        try:
            rc = get_redis_client()
            await rc.ping()
        except Exception:
            redis_ok = False
        return {
            "status": "ok" if db_ok and redis_ok else "degraded",
            "dependencies": {"database": db_ok, "redis": redis_ok},
        }

    @app.get("/readyz")
    async def readyz():
        return {"status": "ready"}

    try:
        from backend.app.api.v1.router import api_router
        app.include_router(api_router, prefix=settings.api_v1_prefix)
        print(f"[startup] Router loaded. Total routes: {len(app.routes)}", file=sys.stderr)
    except Exception as e:
        import traceback
        print(f"[ERROR] Failed to load router: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)

    return app


app = create_app()
