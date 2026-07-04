import re
from collections.abc import AsyncGenerator
from urllib.parse import urlparse, urlunparse

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from backend.app.core.config import get_settings

settings = get_settings()

raw_url = settings.database_url.strip()
parsed = urlparse(raw_url)
clean_query = "&".join(
    kv for kv in parsed.query.split("&")
    if kv.strip() and not kv.strip().lower().startswith("sslmode=")
)
db_url = urlunparse(parsed._replace(query=clean_query))

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

engine = create_async_engine(
    db_url,
    echo=False,
    pool_pre_ping=True,
    connect_args={"ssl": True},
)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base(metadata=MetaData(naming_convention=NAMING_CONVENTION))


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
