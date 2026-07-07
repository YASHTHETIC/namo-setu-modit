import re
import ssl as _ssl
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from backend.app.core.config import get_settings
from backend.app.core.database import Base
from backend.app.models import *  # noqa: F401,F403

config = context.config
settings = get_settings()

db_url = settings.database_url
db_url = re.sub(r'[\r\n\r\t\x00-\x08\x0b\x0c\x0e-\x1f\x7f]+', '', db_url)
db_url = db_url.strip().strip('"').strip("'")

_needs_ssl = False
if 'postgresql' in db_url or 'postgres' in db_url:
    _needs_ssl = 'neon.tech' in db_url or 'sslmode=require' in db_url or 'sslmode=verify' in db_url
    db_url = re.sub(r'\?sslmode=[^&\s]*', '', db_url)
    db_url = re.sub(r'&sslmode=[^&\s]*', '', db_url)
    db_url = re.sub(r'\?ssl=require', '', db_url)
    db_url = re.sub(r'&ssl=require', '', db_url)
    db_url = re.sub(r'\?prepare_threshold=[^&\s]*', '', db_url)
    db_url = re.sub(r'&prepare_threshold=[^&\s]*', '', db_url)
    db_url = db_url.rstrip('?&')
    if _needs_ssl:
        db_url = f"{db_url}?ssl=require"

config.set_main_option("sqlalchemy.url", db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = db_url

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    import asyncio
    asyncio.run(run_migrations_online())
