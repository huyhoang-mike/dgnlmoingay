"""add open materials repository

Revision ID: 007_open_materials
Revises: 006_qa_system
Create Date: 2026-05-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "007_open_materials"
down_revision: Union[str, None] = "006_qa_system"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    if not _table_exists("open_materials"):
        op.create_table(
            "open_materials",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("category", sa.String(length=100), nullable=True),
            sa.Column("subject", sa.String(length=100), nullable=True),
            sa.Column("tags", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("file_type", sa.String(length=30), nullable=False, server_default="pdf"),
            sa.Column("drive_url", sa.String(length=1000), nullable=False),
            sa.Column("preview_image_url", sa.String(length=1000), nullable=True),
            sa.Column("source_name", sa.String(length=255), nullable=True),
            sa.Column("copyright_note", sa.Text(), nullable=True),
            sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("download_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_open_materials_category", "open_materials", ["category"])
        op.create_index("ix_open_materials_subject", "open_materials", ["subject"])
        op.create_index("ix_open_materials_file_type", "open_materials", ["file_type"])
        op.create_index("ix_open_materials_is_published", "open_materials", ["is_published"])
        op.create_index("ix_open_materials_is_featured", "open_materials", ["is_featured"])
        op.create_index("ix_open_materials_created_by_id", "open_materials", ["created_by_id"])
        op.create_index("ix_open_materials_created_at", "open_materials", ["created_at"])

    if not _table_exists("material_submissions"):
        op.create_table(
            "material_submissions",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("contributor_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("category", sa.String(length=100), nullable=True),
            sa.Column("subject", sa.String(length=100), nullable=True),
            sa.Column("tags", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("file_urls", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("file_types", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("original_filenames", sa.JSON(), nullable=False, server_default="[]"),
            sa.Column("source_name", sa.String(length=255), nullable=True),
            sa.Column("copyright_attestation", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("copyright_note", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
            sa.Column("admin_notes", sa.Text(), nullable=True),
            sa.Column("reviewed_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("reviewed_at", sa.DateTime(), nullable=True),
            sa.Column("published_material_id", sa.Integer(), sa.ForeignKey("open_materials.id", ondelete="SET NULL"), nullable=True),
            sa.Column("is_priority", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_material_submissions_contributor_id", "material_submissions", ["contributor_id"])
        op.create_index("ix_material_submissions_category", "material_submissions", ["category"])
        op.create_index("ix_material_submissions_subject", "material_submissions", ["subject"])
        op.create_index("ix_material_submissions_status", "material_submissions", ["status"])
        op.create_index("ix_material_submissions_is_priority", "material_submissions", ["is_priority"])
        op.create_index("ix_material_submissions_created_at", "material_submissions", ["created_at"])


def downgrade() -> None:
    if _table_exists("material_submissions"):
        op.drop_table("material_submissions")
    if _table_exists("open_materials"):
        op.drop_table("open_materials")
