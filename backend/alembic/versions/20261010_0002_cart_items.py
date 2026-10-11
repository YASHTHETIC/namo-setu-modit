"""server cart: cart_items table

Revision ID: 20261010_0002
Revises: 20261010_0001
Create Date: 2026-10-10 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20261010_0002"
down_revision = "20261010_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cart_items",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("variant_key", sa.String(length=100), nullable=False),
        sa.Column("shade", sa.String(length=100), nullable=True),
        sa.Column("quantity", sa.Numeric(precision=12, scale=3), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cart_items_user", "cart_items", ["user_id"])
    op.create_unique_constraint(op.f("uq_cart_items_user_product_variant"), "cart_items", ["user_id", "product_id", "variant_key"])


def downgrade() -> None:
    op.drop_constraint(op.f("uq_cart_items_user_product_variant"), "cart_items", type_="unique")
    op.drop_index("ix_cart_items_user", table_name="cart_items")
    op.drop_table("cart_items")
