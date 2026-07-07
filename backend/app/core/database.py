import re
import ssl as _ssl
from collections.abc import AsyncGenerator
import logging

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from backend.app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

db_url = settings.database_url
db_url = re.sub(r'[\r\n\r\t\x00-\x08\x0b\x0c\x0e-\x1f\x7f]+', '', db_url)
db_url = db_url.strip()
db_url = db_url.strip('"').strip("'")

_needs_ssl = False
if 'postgresql' in db_url or 'postgres' in db_url:
    _needs_ssl = 'neon.tech' in db_url or 'sslmode=require' in db_url or 'sslmode=verify' in db_url or '/cloudsql/' not in db_url
    db_url = re.sub(r'\?sslmode=[^&\s]*', '', db_url)
    db_url = re.sub(r'&sslmode=[^&\s]*', '', db_url)
    db_url = re.sub(r'\?ssl=require', '', db_url)
    db_url = re.sub(r'&ssl=require', '', db_url)
    db_url = re.sub(r'\?prepare_threshold=[^&\s]*', '', db_url)
    db_url = re.sub(r'&prepare_threshold=[^&\s]*', '', db_url)
    db_url = db_url.rstrip('?&')
    if _needs_ssl:
        db_url = f"{db_url}?ssl=require"

logger.info("Database URL (sanitized): %s", db_url.split('@')[-1] if '@' in db_url else db_url)

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

engine = create_async_engine(
    db_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=5,
)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base(metadata=MetaData(naming_convention=NAMING_CONVENTION))


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
