from fastapi import APIRouter
from sqlalchemy import text

from backend.app.core.database import AsyncSessionLocal
from backend.app.core.redis import get_redis_client

router = APIRouter()


@router.get("/healthz")
async def healthz() -> dict[str, object]:
    db_status = True
    redis_status = True

    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        db_status = False

    try:
        redis_client = get_redis_client()
        await redis_client.ping()
    except Exception:
        redis_status = False

    status_value = "ok" if db_status and redis_status else "degraded"
    return {
        "status": status_value,
        "dependencies": {"database": db_status, "redis": redis_status},
    }
