"""initial schema

Revision ID: 20260701_0001
Revises:
Create Date: 2026-07-01 00:01:00.000000
"""

from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260701_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    import backend.app.models  # noqa: F401
    from backend.app.models.base import BaseModel

    bind = op.get_bind()
    BaseModel.metadata.create_all(bind=bind)


def downgrade() -> None:
    import backend.app.models  # noqa: F401
    from backend.app.models.base import BaseModel

    bind = op.get_bind()
    BaseModel.metadata.drop_all(bind=bind)
