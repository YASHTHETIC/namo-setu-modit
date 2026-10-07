"""link B2C checkout: order address/gstin + payment.order_id

Revision ID: 20261002_0001
Revises: 20261001_0001
Create Date: 2026-10-02 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20261002_0001"
down_revision = "20261001_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("shipping_address_json", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("gstin", sa.String(length=20), nullable=True))
    op.add_column("modit_payments", sa.Column("order_id", sa.String(), nullable=True))
    op.create_foreign_key(
        op.f("fk_order_id_orders"),
        "modit_payments",
        "orders",
        ["order_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_modit_payments_order", "modit_payments", ["order_id"])


def downgrade() -> None:
    op.drop_index("ix_modit_payments_order", table_name="modit_payments")
    op.drop_constraint(op.f("fk_order_id_orders"), "modit_payments", type_="foreignkey")
    op.drop_column("modit_payments", "order_id")
    op.drop_column("orders", "gstin")
    op.drop_column("orders", "shipping_address_json")
