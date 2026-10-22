"""server-managed coupons: platform_coupons table

Admin coupon console now writes to validation truth. The seven seeded
built-in storefront coupons are backfilled so checkout behavior is unchanged
from day one.

Revision ID: 20261022_0001
Revises: 20261011_0002
Create Date: 2026-10-22 00:00:00.000000
"""

from __future__ import annotations

from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20261022_0001"
down_revision = "20261011_0002"
branch_labels = None
depends_on = None

_NOW = datetime.now(timezone.utc).replace(tzinfo=None)

_BUILT_IN_COUPONS = [
    ("FIRST100", "₹100 off on first order", "flat", 100.0, None, 1000.0, "2026-12-31", 1, None),
    ("BULK10", "10% off on orders above ₹5000", "percent", 10.0, 500.0, 5000.0, "2026-12-31", 5, None),
    ("CEMENT50", "₹50 off on cement orders", "flat", 50.0, None, 2000.0, "2026-12-31", 3, "cement"),
    ("PAINT15", "15% off on paints", "percent", 15.0, 300.0, 1000.0, "2026-12-31", 3, "painting"),
    ("FREESHIP", "Free delivery on all orders", "ship", 0.0, None, 0.0, "2026-12-31", 10, None),
    ("DIWALI20", "20% off on tiles — festive sale", "percent", 20.0, 400.0, 1500.0, "2026-11-30", 2, "tiling"),
    ("LIGHT200", "₹200 off on lighting above ₹3000", "flat", 200.0, None, 3000.0, "2026-12-31", 2, "lighting"),
]


def upgrade() -> None:
    op.create_table(
        "platform_coupons",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("code", sa.String(length=40), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("discount_type", sa.String(length=20), nullable=False),
        sa.Column("discount_value", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0"),
        sa.Column("max_discount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("min_order", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0"),
        sa.Column("valid_till", sa.Date(), nullable=True),
        sa.Column("usage_limit", sa.Integer(), nullable=True),
        sa.Column("used_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("category", sa.String(length=64), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_platform_coupons_code"),
    )
    op.create_index("ix_platform_coupons_active", "platform_coupons", ["is_active", "deleted_at"])

    rows = [
        {
            "id": f"coupon-{code.lower()}",
            "code": code,
            "description": description,
            "discount_type": dtype,
            "discount_value": value,
            "max_discount": max_disc,
            "min_order": min_order,
            "valid_till": till,
            "usage_limit": usage_limit,
            "used_count": 0,
            "category": category,
            "is_active": True,
            "created_at": _NOW,
            "updated_at": _NOW,
            "deleted_at": None,
        }
        for code, description, dtype, value, max_disc, min_order, till, usage_limit, category in _BUILT_IN_COUPONS
    ]
    table = sa.table(
        "platform_coupons",
        sa.column("id", sa.String()),
        sa.column("code", sa.String(length=40)),
        sa.column("description", sa.String(length=255)),
        sa.column("discount_type", sa.String(length=20)),
        sa.column("discount_value", sa.Numeric(precision=12, scale=2)),
        sa.column("max_discount", sa.Numeric(precision=12, scale=2)),
        sa.column("min_order", sa.Numeric(precision=12, scale=2)),
        sa.column("valid_till", sa.Date()),
        sa.column("usage_limit", sa.Integer()),
        sa.column("used_count", sa.Integer()),
        sa.column("category", sa.String(length=64)),
        sa.column("is_active", sa.Boolean()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
        sa.column("deleted_at", sa.DateTime(timezone=True)),
    )
    op.bulk_insert(table, rows)


def downgrade() -> None:
    op.drop_index("ix_platform_coupons_active", table_name="platform_coupons")
    op.drop_table("platform_coupons")
