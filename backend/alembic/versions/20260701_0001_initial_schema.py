"""initial schema

Revision ID: 20260701_0001
Revises:
Create Date: 2026-07-01 00:01:00.000000
"""

from __future__ import annotations

from backend._alembic_schema_ops import downgrade as _downgrade_impl
from backend._alembic_schema_ops import upgrade as _upgrade_impl

# revision identifiers, used by Alembic.
revision = "20260701_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    _upgrade_impl()


def downgrade() -> None:
    _downgrade_impl()
