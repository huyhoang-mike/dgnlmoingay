"""add deep practice attempts

Revision ID: 008_deep_practice_attempts
Revises: 007_open_materials
Create Date: 2026-05-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "008_deep_practice_attempts"
down_revision: Union[str, None] = "007_open_materials"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    if _table_exists("deep_practice_attempts"):
        return

    op.create_table(
        "deep_practice_attempts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quiz_id", sa.String(length=150), nullable=False),
        sa.Column("quiz_title", sa.String(length=255), nullable=True),
        sa.Column("subject", sa.String(length=100), nullable=True),
        sa.Column("score_percent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("correct_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("wrong_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("unanswered_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("time_spent_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("answers", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("meta", sa.JSON(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_deep_practice_attempts_user_id", "deep_practice_attempts", ["user_id"])
    op.create_index("ix_deep_practice_attempts_quiz_id", "deep_practice_attempts", ["quiz_id"])
    op.create_index("ix_deep_practice_attempts_subject", "deep_practice_attempts", ["subject"])
    op.create_index("ix_deep_practice_attempts_submitted_at", "deep_practice_attempts", ["submitted_at"])


def downgrade() -> None:
    if _table_exists("deep_practice_attempts"):
        op.drop_table("deep_practice_attempts")
