"""order idempotency: client_reference + totals_json

Revision ID: 20261010_0001
Revises: 20261002_0001
Create Date: 2026-10-10 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20261010_0001"
down_revision = "20261002_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("client_reference", sa.String(length=64), nullable=True))
    op.add_column("orders", sa.Column("totals_json", sa.Text(), nullable=True))
    op.create_unique_constraint(op.f("uq_orders_client_reference"), "orders", ["client_reference"])


def downgrade() -> None:
    op.drop_constraint(op.f("uq_orders_client_reference"), "orders", type_="unique")
    op.drop_column("orders", "totals_json")
    op.drop_column("orders", "client_reference")
