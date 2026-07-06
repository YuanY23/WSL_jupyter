"""add media resources

Revision ID: 0003_media_resources
Revises: 0002_tutorial_filename
Create Date: 2026-07-06
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_media_resources"
down_revision = "0002_tutorial_filename"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "media_resources",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("original_filename", sa.Text(), nullable=False),
        sa.Column("mime_type", sa.String(length=255), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("object_key", sa.Text(), nullable=False),
        sa.Column("file_sha256", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="available"),
        sa.Column("created_by", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_media_resources_created_at", "media_resources", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_media_resources_created_at", table_name="media_resources")
    op.drop_table("media_resources")
