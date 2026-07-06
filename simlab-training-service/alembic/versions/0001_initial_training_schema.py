"""initial training schema

Revision ID: 0001_initial_training_schema
Revises:
Create Date: 2026-07-05
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_initial_training_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "training_courses",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("slug", sa.String(length=255), nullable=False, unique=True),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_by", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "training_sections",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("course_id", sa.String(length=36), sa.ForeignKey("training_courses.id"), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_by", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_training_sections_course_sort", "training_sections", ["course_id", "sort_order"])
    op.create_table(
        "tutorials",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("public_id", sa.String(length=255), nullable=False, unique=True),
        sa.Column("course_id", sa.String(length=36), sa.ForeignKey("training_courses.id"), nullable=False),
        sa.Column("section_id", sa.String(length=36), sa.ForeignKey("training_sections.id"), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("current_version_id", sa.String(length=36), nullable=True),
        sa.Column("comments_locked", sa.Boolean(), nullable=False),
        sa.Column("created_by", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_tutorials_section_sort", "tutorials", ["section_id", "sort_order"])
    op.create_table(
        "tutorial_versions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("tutorial_id", sa.String(length=36), sa.ForeignKey("tutorials.id"), nullable=False),
        sa.Column("version_label", sa.Text(), nullable=False),
        sa.Column("file_object_key", sa.Text(), nullable=False),
        sa.Column("file_sha256", sa.String(length=64), nullable=False),
        sa.Column("imported_by", sa.String(length=255), nullable=False),
        sa.Column("import_note", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "comments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("tutorial_public_id", sa.String(length=255), sa.ForeignKey("tutorials.public_id"), nullable=False),
        sa.Column("parent_id", sa.String(length=36), sa.ForeignKey("comments.id"), nullable=True),
        sa.Column("author", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_pinned", sa.Boolean(), nullable=False),
        sa.Column("is_official", sa.Boolean(), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_by", sa.String(length=255), nullable=True),
        sa.Column("deleted_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_comments_tutorial_pin_created", "comments", ["tutorial_public_id", "is_pinned", "created_at"])
    op.create_table(
        "comment_likes",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("comment_id", sa.String(length=36), sa.ForeignKey("comments.id"), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("comment_id", "username", name="uq_comment_like_user"),
    )


def downgrade() -> None:
    op.drop_table("comment_likes")
    op.drop_index("ix_comments_tutorial_pin_created", table_name="comments")
    op.drop_table("comments")
    op.drop_table("tutorial_versions")
    op.drop_index("ix_tutorials_section_sort", table_name="tutorials")
    op.drop_table("tutorials")
    op.drop_index("ix_training_sections_course_sort", table_name="training_sections")
    op.drop_table("training_sections")
    op.drop_table("training_courses")
