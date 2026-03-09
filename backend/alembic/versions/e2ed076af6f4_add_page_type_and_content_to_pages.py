"""add_page_type_and_content_to_pages

Revision ID: e2ed076af6f4
Revises: 001
Create Date: 2026-03-09 18:47:06.966532

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e2ed076af6f4'
down_revision: Union[str, Sequence[str], None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add page_type column to pages table."""
    # Add page_type column (VARCHAR for 'note', 'canvas', 'kanban')
    op.add_column(
        'pages',
        sa.Column('page_type', sa.String(length=50), nullable=False, server_default='note')
    )


def downgrade() -> None:
    """Remove page_type column from pages table."""
    op.drop_column('pages', 'page_type')
