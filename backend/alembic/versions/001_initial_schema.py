"""initial schema with all tables

Revision ID: 001_initial
Revises:
Create Date: 2026-04-16
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Users ─────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("picture", sa.String(500), nullable=True),
        sa.Column("google_id", sa.String(255), nullable=False),
        sa.Column("enrollment_year", sa.Integer(), nullable=True),
        sa.Column("course_type", sa.String(50), nullable=True),
        sa.Column("is_enrolled", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_admin", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("last_login", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("google_id"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # ── Lessons ───────────────────────────────
    op.create_table(
        "lessons",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("order", sa.Integer(), nullable=True),
        sa.Column("category", sa.String(50), nullable=False, server_default="nentang"),
        sa.Column("subject", sa.String(100), nullable=True),
        sa.Column("video_drive_id", sa.String(255), nullable=True),
        sa.Column("pdf_drive_id", sa.String(255), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("is_published", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_free", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_lessons_title", "lessons", ["title"])
    op.create_index("ix_lessons_category", "lessons", ["category"])
    op.create_index("ix_lessons_subject", "lessons", ["subject"])

    # ── User Progress ─────────────────────────
    op.create_table(
        "user_progress",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("lesson_id", sa.Integer(), nullable=False),
        sa.Column("completed", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── Exam Settings ─────────────────────────
    op.create_table(
        "exam_settings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("exam_id", sa.String(100), nullable=False),
        sa.Column("is_free", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("exam_id"),
    )


def downgrade() -> None:
    op.drop_table("exam_settings")
    op.drop_table("user_progress")
    op.drop_index("ix_lessons_subject", table_name="lessons")
    op.drop_index("ix_lessons_category", table_name="lessons")
    op.drop_index("ix_lessons_title", table_name="lessons")
    op.drop_table("lessons")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
