"""live delivery tracking, warehouse geo, support chat

Revision ID: 20261001_0001
Revises: 20260707_0001
Create Date: 2026-10-01 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20261001_0001"
down_revision = "20260707_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("warehouses", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("warehouses", sa.Column("longitude", sa.Float(), nullable=True))

    op.add_column("delivery", sa.Column("last_lat", sa.Float(), nullable=True))
    op.add_column("delivery", sa.Column("last_lng", sa.Float(), nullable=True))
    op.add_column("delivery", sa.Column("last_ping_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("delivery", sa.Column("dest_lat", sa.Float(), nullable=True))
    op.add_column("delivery", sa.Column("dest_lng", sa.Float(), nullable=True))

    op.create_table(
        "delivery_pings",
        sa.Column("delivery_id", sa.String(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["delivery_id"], ["delivery.id"], name=op.f("fk_delivery_id_delivery"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_delivery_pings")),
    )
    op.create_index("ix_delivery_pings_delivery_time", "delivery_pings", ["delivery_id", "recorded_at"])

    op.create_table(
        "support_conversations",
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("order_id", sa.String(), nullable=True),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], name=op.f("fk_order_id_orders"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_support_conversations")),
    )
    op.create_index("ix_support_conversations_user_status", "support_conversations", ["user_id", "status"])

    op.create_table(
        "support_messages",
        sa.Column("conversation_id", sa.String(), nullable=False),
        sa.Column("sender", sa.String(length=10), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["support_conversations.id"],
            name=op.f("fk_conversation_id_support_conversations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_support_messages")),
    )
    op.create_index("ix_support_messages_conversation_time", "support_messages", ["conversation_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_support_messages_conversation_time", table_name="support_messages")
    op.drop_table("support_messages")
    op.drop_index("ix_support_conversations_user_status", table_name="support_conversations")
    op.drop_table("support_conversations")
    op.drop_index("ix_delivery_pings_delivery_time", table_name="delivery_pings")
    op.drop_table("delivery_pings")

    op.drop_column("delivery", "dest_lng")
    op.drop_column("delivery", "dest_lat")
    op.drop_column("delivery", "last_ping_at")
    op.drop_column("delivery", "last_lng")
    op.drop_column("delivery", "last_lat")

    op.drop_column("warehouses", "longitude")
    op.drop_column("warehouses", "latitude")
