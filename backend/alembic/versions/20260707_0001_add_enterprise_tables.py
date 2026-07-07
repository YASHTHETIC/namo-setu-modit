"""add enterprise tables

Revision ID: 20260707_0001
Revises: 20260701_0001
Create Date: 2026-07-07 00:01:00.000000
"""

from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260707_0001"
down_revision = "20260701_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    import backend.app.models  # noqa: F401
    from backend.app.models.base import BaseModel

    bind = op.get_bind()
    BaseModel.metadata.create_all(bind=bind)


def downgrade() -> None:
    pass
