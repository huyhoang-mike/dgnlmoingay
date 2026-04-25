"""align user_progress schema with current progress model

Revision ID: 004_progress_tracking_alignment
Revises: 003_sepay_payment_orders
Create Date: 2026-04-26
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "004_progress_tracking_alignment"
down_revision: Union[str, None] = "003_sepay_payment_orders"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_columns(table_name: str) -> dict[str, dict]:
    inspector = sa.inspect(op.get_bind())
    return {col["name"]: col for col in inspector.get_columns(table_name)}


def _get_unique_names(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {c["name"] for c in inspector.get_unique_constraints(table_name) if c.get("name")}


def _get_index_names(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {idx["name"] for idx in inspector.get_indexes(table_name) if idx.get("name")}


def upgrade() -> None:
    columns = _get_columns("user_progress")

    added_is_completed = False
    added_progress_percent = False
    added_last_accessed = False

    if "is_completed" not in columns:
        op.add_column(
            "user_progress",
            sa.Column("is_completed", sa.Boolean(), nullable=True),
        )
        added_is_completed = True

    if "progress_percent" not in columns:
        op.add_column(
            "user_progress",
            sa.Column("progress_percent", sa.Float(), nullable=True),
        )
        added_progress_percent = True

    if "last_accessed" not in columns:
        op.add_column(
            "user_progress",
            sa.Column("last_accessed", sa.DateTime(), nullable=True),
        )
        added_last_accessed = True

    columns = _get_columns("user_progress")
    legacy_completed_exists = "completed" in columns

    if legacy_completed_exists:
        op.execute("UPDATE user_progress SET is_completed = completed")

    if added_is_completed:
        op.execute("UPDATE user_progress SET is_completed = COALESCE(is_completed, false)")
        op.alter_column(
            "user_progress",
            "is_completed",
            existing_type=sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        )

    if added_progress_percent:
        op.execute(
            "UPDATE user_progress SET progress_percent = CASE WHEN COALESCE(is_completed, false) THEN 100 ELSE 0 END"
        )
        op.alter_column(
            "user_progress",
            "progress_percent",
            existing_type=sa.Float(),
            nullable=False,
            server_default=sa.text("0"),
        )

    if added_last_accessed:
        op.execute(
            "UPDATE user_progress SET last_accessed = COALESCE(completed_at, CURRENT_TIMESTAMP)"
        )
        op.alter_column(
            "user_progress",
            "last_accessed",
            existing_type=sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        )

    if legacy_completed_exists:
        op.drop_column("user_progress", "completed")

    columns = _get_columns("user_progress")
    user_id_type = str(columns["user_id"]["type"]).lower()
    if "integer" in user_id_type or "bigint" in user_id_type:
        # Old schema used FK to users.id (integer). Current model stores user_id as string.
        op.execute("ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey")
        op.alter_column(
            "user_progress",
            "user_id",
            existing_type=sa.Integer(),
            type_=sa.String(length=255),
            postgresql_using="user_id::text",
            nullable=False,
        )

    unique_names = _get_unique_names("user_progress")
    if "uq_user_lesson" not in unique_names:
        op.create_unique_constraint(
            "uq_user_lesson",
            "user_progress",
            ["user_id", "lesson_id"],
        )

    index_names = _get_index_names("user_progress")
    if "ix_user_progress_user_id" not in index_names:
        op.create_index("ix_user_progress_user_id", "user_progress", ["user_id"])
    if "ix_user_progress_lesson_id" not in index_names:
        op.create_index("ix_user_progress_lesson_id", "user_progress", ["lesson_id"])


def downgrade() -> None:
    columns = _get_columns("user_progress")

    if "completed" not in columns:
        op.add_column("user_progress", sa.Column("completed", sa.Boolean(), nullable=True))

    columns = _get_columns("user_progress")
    if "is_completed" in columns:
        op.execute("UPDATE user_progress SET completed = is_completed")

    unique_names = _get_unique_names("user_progress")
    if "uq_user_lesson" in unique_names:
        op.drop_constraint("uq_user_lesson", "user_progress", type_="unique")

    index_names = _get_index_names("user_progress")
    if "ix_user_progress_user_id" in index_names:
        op.drop_index("ix_user_progress_user_id", table_name="user_progress")
    if "ix_user_progress_lesson_id" in index_names:
        op.drop_index("ix_user_progress_lesson_id", table_name="user_progress")

    columns = _get_columns("user_progress")
    if "last_accessed" in columns:
        op.drop_column("user_progress", "last_accessed")
    if "progress_percent" in columns:
        op.drop_column("user_progress", "progress_percent")
    if "is_completed" in columns:
        op.drop_column("user_progress", "is_completed")

    op.alter_column(
        "user_progress",
        "completed",
        existing_type=sa.Boolean(),
        nullable=False,
        server_default=sa.text("false"),
    )
