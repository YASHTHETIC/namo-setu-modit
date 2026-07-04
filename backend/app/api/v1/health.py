from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.redis import get_redis

router = APIRouter()


@router.get("/healthz")
async def healthz(db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    redis_client = await get_redis()
    db_status = True
    redis_status = True

    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = False

    try:
        await redis_client.ping()
    except Exception:
        redis_status = False

    status_value = "ok" if db_status and redis_status else "degraded"
    return {
        "status": status_value,
        "dependencies": {"database": db_status, "redis": redis_status},
    }
