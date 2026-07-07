import re
from collections.abc import AsyncGenerator

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from backend.app.core.config import get_settings

settings = get_settings()

db_url = settings.database_url.strip()
db_url = re.sub(r'[\r\n\t\x00-\x1f]+', '', db_url)

# Only add SSL mode for PostgreSQL connections
if 'postgresql' in db_url or 'postgres' in db_url:
    # Remove existing sslmode if present
    db_url = re.sub(r'[?&]sslmode=[^&\s]*', '', db_url)
    # Add sslmode=disable for local development
    if '?' in db_url:
        db_url = f"{db_url}&sslmode=disable"
    else:
        db_url = f"{db_url}?sslmode=disable"

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
)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base(metadata=MetaData(naming_convention=NAMING_CONVENTION))


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
