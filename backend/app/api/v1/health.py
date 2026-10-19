import logging

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text

from backend.app.core.database import AsyncSessionLocal
from backend.app.core.redis import get_redis_client

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/healthz")
async def healthz():
    """K8s/PM2/cron self-heal probe.

    Never leaks internal error text (a public endpoint must not hand over
    driver strings/DSNs); PM2 self-heal acts on the status/HTTP code alone.
    """
    db_status = True
    redis_status = True

    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception as e:
        db_status = False
        logger.error("DB health check failed: %s", e)

    try:
        redis_client = get_redis_client()
        await redis_client.ping()
    except Exception as e:
        redis_status = False
        logger.error("Redis health check failed: %s", e)

    # Redis is an optimization (cache/rate-limit), not a hard dependency:
    # only the database gates overall health.
    if not db_status:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "degraded",
                "dependencies": {"database": False, "redis": redis_status},
            },
        )
    return {
        "status": "ok",
        "dependencies": {
            "database": True,
            "redis": redis_status,
        },
    }
