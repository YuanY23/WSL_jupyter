"""add encrypted HLS media metadata

Revision ID: 0004_encrypted_hls
Revises: 0003_media_resources
Create Date: 2026-07-14
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_encrypted_hls"
down_revision = "0003_media_resources"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("media_resources", sa.Column("hls_playlist_object_key", sa.Text(), nullable=True))
    op.add_column("media_resources", sa.Column("hls_key_id", sa.String(length=64), nullable=True))
    op.add_column("media_resources", sa.Column("hls_iv", sa.String(length=32), nullable=True))
    op.add_column("media_resources", sa.Column("processing_error", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("media_resources", "processing_error")
    op.drop_column("media_resources", "hls_iv")
    op.drop_column("media_resources", "hls_key_id")
    op.drop_column("media_resources", "hls_playlist_object_key")
