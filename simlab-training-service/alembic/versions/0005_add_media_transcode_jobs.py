"""add durable media transcode jobs and HLS version

Revision ID: 0005_media_jobs
Revises: 0004_encrypted_hls
Create Date: 2026-07-14
"""

from alembic import op
import sqlalchemy as sa


revision = "0005_media_jobs"
down_revision = "0004_encrypted_hls"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "media_resources",
        "file_size",
        existing_type=sa.Integer(),
        type_=sa.BigInteger(),
        existing_nullable=False,
    )
    op.add_column("media_resources", sa.Column("hls_transcode_version", sa.Integer(), nullable=True))
    op.create_table(
        "media_transcode_jobs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "media_id",
            sa.String(length=32),
            sa.ForeignKey("media_resources.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="queued"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("available_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("lease_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("worker_id", sa.String(length=255), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_media_transcode_jobs_claim",
        "media_transcode_jobs",
        ["status", "available_at", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_media_transcode_jobs_claim", table_name="media_transcode_jobs")
    op.drop_table("media_transcode_jobs")
    op.drop_column("media_resources", "hls_transcode_version")
    op.alter_column(
        "media_resources",
        "file_size",
        existing_type=sa.BigInteger(),
        type_=sa.Integer(),
        existing_nullable=False,
    )
