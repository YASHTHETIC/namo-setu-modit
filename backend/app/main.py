from contextlib import asynccontextmanager
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import get_settings
from backend.app.core.exceptions import register_exception_handlers
from backend.app.core.logging import configure_logging

settings = get_settings()

print("[startup] backend.app.main module loaded", file=sys.stderr)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from backend.app.core.database import engine
    from backend.app.core.redis import get_redis_client

    print("[startup] lifespan starting", file=sys.stderr)
    configure_logging(settings.log_level)
    try:
        yield
    finally:
        print("[shutdown] disposing resources", file=sys.stderr)
        try:
            await engine.dispose()
        except Exception as e:
            print(f"[shutdown] engine.dispose error: {e}", file=sys.stderr)
        try:
            await get_redis_client().aclose()
        except Exception as e:
            print(f"[shutdown] redis.aclose error: {e}", file=sys.stderr)


def create_app() -> FastAPI:
    print(f"[startup] creating app, CORS origins: {settings.backend_cors_origins}", file=sys.stderr)

    app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)

    try:
        from backend.app.api.v1.router import api_router
        app.include_router(api_router, prefix=settings.api_v1_prefix)
        print(f"[startup] router loaded, total routes: {len(app.routes)}", file=sys.stderr)
    except Exception as e:
        print(f"[startup] ERROR loading router: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)

    return app


app = create_app()
