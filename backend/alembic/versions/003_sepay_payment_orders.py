"""add SePay payment orders

Revision ID: 003_sepay_payment_orders
Revises: 002_attempts_and_preregister
Create Date: 2026-04-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "003_sepay_payment_orders"
down_revision: Union[str, None] = "002_attempts_and_preregister"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "payment_orders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_code", sa.String(length=64), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False, server_default="sepay"),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("google_email", sa.String(length=255), nullable=True),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("expected_amount", sa.Integer(), nullable=False),
        sa.Column("paid_amount", sa.Integer(), nullable=True),
        sa.Column("transfer_content", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("provider_transaction_id", sa.String(length=255), nullable=True),
        sa.Column("provider_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("access_granted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_code"),
        sa.UniqueConstraint("transfer_content"),
        sa.UniqueConstraint("provider_transaction_id"),
    )
    op.create_index("ix_payment_orders_order_code", "payment_orders", ["order_code"])
    op.create_index("ix_payment_orders_google_email", "payment_orders", ["google_email"])
    op.create_index("ix_payment_orders_user_id", "payment_orders", ["user_id"])
    op.create_index("ix_payment_orders_status", "payment_orders", ["status"])


def downgrade() -> None:
    op.drop_index("ix_payment_orders_status", table_name="payment_orders")
    op.drop_index("ix_payment_orders_user_id", table_name="payment_orders")
    op.drop_index("ix_payment_orders_google_email", table_name="payment_orders")
    op.drop_index("ix_payment_orders_order_code", table_name="payment_orders")
    op.drop_table("payment_orders")
