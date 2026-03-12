"""fix collaboration schema: add yjs_documents.created_at

Revision ID: fix_collab_schema
Revises: add_notifications_tables
Create Date: 2026-03-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "fix_collab_schema"
down_revision: Union[str, None] = "add_notifications_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing created_at column to yjs_documents
    op.add_column(
        "yjs_documents",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_column("yjs_documents", "created_at")
