from collections.abc import AsyncGenerator
from urllib.parse import parse_qs, urlparse, urlunparse

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from backend.app.core.config import get_settings

settings = get_settings()

db_url = settings.database_url.strip().strip('"').strip("'").rstrip("\r\n").rstrip("\n").rstrip("\r")

parsed = urlparse(db_url)
params = parse_qs(parsed.query)
if "sslmode" in params:
    params.pop("sslmode")
    new_query = "&".join(f"{k}={v[0]}" for k, v in params.items())
    db_url = urlunparse(parsed._replace(query=new_query))

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
    connect_args={"ssl": "require"},
)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base(metadata=MetaData(naming_convention=NAMING_CONVENTION))


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
