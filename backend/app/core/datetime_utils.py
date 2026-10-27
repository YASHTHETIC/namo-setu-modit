"""Datetime helpers shared across services.

DB timestamps can come back naive depending on the dialect (SQLite stores
DateTime(timezone=True) as naive UTC); Postgres/asyncpg returns aware values.
Comparisons against timezone-aware "now" must normalise first or they raise
TypeError — this helper makes them dialect-proof.
"""

from __future__ import annotations

from datetime import datetime, timezone


def as_aware(value: datetime) -> datetime:
    """Return `value` as a timezone-aware UTC datetime."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def is_expired(expires_at: datetime, now: datetime | None = None) -> bool:
    """True when `expires_at` (DB timestamp of any dialect) has passed."""
    return as_aware(expires_at) <= (now or datetime.now(timezone.utc))
