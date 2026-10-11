"""supplier login link: suppliers.user_id

Revision ID: 20261011_0001
Revises: 20261010_0002
Create Date: 2026-10-11 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20261011_0001"
down_revision = "20261010_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("suppliers", sa.Column("user_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_suppliers_user_id", "suppliers", "users", ["user_id"], ["id"], ondelete="SET NULL"
    )
    op.create_unique_constraint("uq_suppliers_user", "suppliers", ["user_id"])
    op.create_index("ix_suppliers_user_id", "suppliers", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_suppliers_user_id", table_name="suppliers")
    op.drop_constraint("uq_suppliers_user", "suppliers", type_="unique")
    op.drop_constraint("fk_suppliers_user_id", "suppliers", type_="foreignkey")
    op.drop_column("suppliers", "user_id")
