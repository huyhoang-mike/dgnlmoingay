"""student pre-registration + exam attempts

Revision ID: 002_attempts_and_preregister
Revises: 001_initial
Create Date: 2026-04-18
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002_attempts_and_preregister"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Allow pre-registered users (no Google login yet) ──
    # Admins can now create a user record from just an email; google_id
    # gets populated on first successful Google sign-in.
    op.alter_column(
        "users",
        "google_id",
        existing_type=sa.String(255),
        nullable=True,
    )

    # ── Exam attempts: stores answers + score per attempt ──
    op.create_table(
        "exam_attempts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("exam_id", sa.String(100), nullable=False),
        sa.Column("exam_title", sa.String(255), nullable=True),
        sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("correct_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("wrong_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("unanswered_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("time_spent_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("meta", sa.JSON(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_exam_attempts_user_id", "exam_attempts", ["user_id"])
    op.create_index("ix_exam_attempts_exam_id", "exam_attempts", ["exam_id"])


def downgrade() -> None:
    op.drop_index("ix_exam_attempts_exam_id", table_name="exam_attempts")
    op.drop_index("ix_exam_attempts_user_id", table_name="exam_attempts")
    op.drop_table("exam_attempts")
    op.alter_column(
        "users",
        "google_id",
        existing_type=sa.String(255),
        nullable=False,
    )
