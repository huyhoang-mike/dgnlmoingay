"""add qa community question system

Revision ID: 006_qa_system
Revises: 005_add_answer_pdf_to_lessons
Create Date: 2026-05-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "006_qa_system"
down_revision: Union[str, None] = "005_add_answer_pdf_to_lessons"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    if not _table_exists("qa_questions"):
        op.create_table(
            "qa_questions",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("images", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("visibility", sa.String(length=20), nullable=False, server_default="public"),
            sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
            sa.Column("subject", sa.String(length=100), nullable=True),
            sa.Column("tags", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("is_priority", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("answer_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("last_activity_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_qa_questions_author_id", "qa_questions", ["author_id"])
        op.create_index("ix_qa_questions_visibility", "qa_questions", ["visibility"])
        op.create_index("ix_qa_questions_status", "qa_questions", ["status"])
        op.create_index("ix_qa_questions_subject", "qa_questions", ["subject"])
        op.create_index("ix_qa_questions_is_priority", "qa_questions", ["is_priority"])
        op.create_index("ix_qa_questions_is_pinned", "qa_questions", ["is_pinned"])
        op.create_index("ix_qa_questions_created_at", "qa_questions", ["created_at"])
        op.create_index("ix_qa_questions_last_activity_at", "qa_questions", ["last_activity_at"])

    if not _table_exists("qa_answers"):
        op.create_table(
            "qa_answers",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("question_id", sa.Integer(), sa.ForeignKey("qa_questions.id", ondelete="CASCADE"), nullable=False),
            sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("images", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("is_admin_answer", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("is_accepted", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_qa_answers_question_id", "qa_answers", ["question_id"])
        op.create_index("ix_qa_answers_author_id", "qa_answers", ["author_id"])
        op.create_index("ix_qa_answers_is_admin_answer", "qa_answers", ["is_admin_answer"])
        op.create_index("ix_qa_answers_is_accepted", "qa_answers", ["is_accepted"])
        op.create_index("ix_qa_answers_created_at", "qa_answers", ["created_at"])


def downgrade() -> None:
    if _table_exists("qa_answers"):
        op.drop_table("qa_answers")
    if _table_exists("qa_questions"):
        op.drop_table("qa_questions")
