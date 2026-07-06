"""add tutorial notebook filename

Revision ID: 0002_tutorial_filename
Revises: 0001_initial_training_schema
Create Date: 2026-07-06
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_tutorial_filename"
down_revision = "0001_initial_training_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "tutorials",
        sa.Column("notebook_filename", sa.Text(), nullable=False, server_default=""),
    )
    op.alter_column("tutorials", "notebook_filename", server_default=None)


def downgrade() -> None:
    op.drop_column("tutorials", "notebook_filename")
