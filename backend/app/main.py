from contextlib import asynccontextmanager
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.app.core.config import get_settings
from backend.app.core.exceptions import register_exception_handlers
from backend.app.core.logging import configure_logging

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    from backend.app.core.database import engine
    from backend.app.core.redis import get_redis_client

    configure_logging(settings.log_level)
    try:
        yield
    finally:
        try:
            await engine.dispose()
        except Exception:
            pass
        try:
            await get_redis_client().aclose()
        except Exception:
            pass


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)

    @app.get("/healthz")
    @app.get("/api/v1/healthz")
    async def healthz():
        from backend.app.core.database import AsyncSessionLocal
        from backend.app.core.redis import get_redis_client

        db_ok = True
        redis_ok = True
        db_err = ""
        redis_err = ""
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
        except Exception as e:
            db_ok = False
            db_err = str(e)[:200]
        try:
            rc = get_redis_client()
            await rc.ping()
        except Exception as e:
            redis_ok = False
            redis_err = str(e)[:200]
        from backend.app.core.database import db_url as engine_url
        return {
            "status": "ok" if db_ok and redis_ok else "degraded",
            "database": db_ok,
            "redis": redis_ok,
            "db_error": db_err,
            "redis_error": redis_err,
            "db_url_set": bool(settings.database_url),
            "redis_url_set": bool(settings.redis_url),
            "engine_url_suffix": engine_url[-60:] if engine_url else "",
        }

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
