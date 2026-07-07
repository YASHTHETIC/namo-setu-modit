import logging
from fastapi import APIRouter
from sqlalchemy import text

from backend.app.core.database import AsyncSessionLocal
from backend.app.core.redis import get_redis_client

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/healthz")
async def healthz():
    db_status = True
    redis_status = True
    db_error = None
    redis_error = None

    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception as e:
        db_status = False
        db_error = str(e)[:200]
        logger.error("DB health check failed: %s", e)

    try:
        redis_client = get_redis_client()
        await redis_client.ping()
    except Exception as e:
        redis_status = False
        redis_error = str(e)[:200]
        logger.error("Redis health check failed: %s", e)

    status_value = "ok" if db_status and redis_status else "degraded"
    return {
        "status": status_value,
        "dependencies": {
            "database": db_status,
            "redis": redis_status,
        },
        "db_error": db_error,
        "redis_error": redis_error,
    }
