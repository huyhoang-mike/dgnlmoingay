"""add answer pdf attachment field to lessons

Revision ID: 005_add_answer_pdf_to_lessons
Revises: 004_progress_tracking_alignment
Create Date: 2026-05-09
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "005_add_answer_pdf_to_lessons"
down_revision: Union[str, None] = "004_progress_tracking_alignment"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {col["name"] for col in inspector.get_columns(table_name)}


def upgrade() -> None:
    columns = _get_columns("lessons")
    if "answer_pdf_drive_id" not in columns:
        op.add_column("lessons", sa.Column("answer_pdf_drive_id", sa.String(length=255), nullable=True))


def downgrade() -> None:
    columns = _get_columns("lessons")
    if "answer_pdf_drive_id" in columns:
        op.drop_column("lessons", "answer_pdf_drive_id")
