"""client_reference idempotency scope: per-org instead of global

The global UNIQUE let two different buyer orgs collide on the same client
reference (their separate retries could 500 the loser). Scope uniqueness to
(organization_id, client_reference) so each org has its own idempotency space.

Revision ID: 20261011_0002
Revises: 20261011_0001
Create Date: 2026-10-20 00:00:00.000000
"""

from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "20261011_0002"
down_revision = "20261011_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint(op.f("uq_orders_client_reference"), "orders", type_="unique")
    op.create_unique_constraint(
        op.f("uq_orders_org_client_reference"), "orders", ["organization_id", "client_reference"]
    )


def downgrade() -> None:
    op.drop_constraint(op.f("uq_orders_org_client_reference"), "orders", type_="unique")
    op.create_unique_constraint(op.f("uq_orders_client_reference"), "orders", ["client_reference"])
