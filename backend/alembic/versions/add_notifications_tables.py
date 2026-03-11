"""add notifications tables

Revision ID: add_notifications_tables
Revises: e2ed076af6f4
Create Date: 2026-03-11 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_notifications_tables'
down_revision: Union[str, Sequence[str], None] = 'e2ed076af6f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add webhook_configs, notification_logs, and rate_limit_buckets tables."""
    
    # Create webhook_configs table
    op.create_table(
        'webhook_configs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('platform', sa.String(length=20), nullable=False),
        sa.Column('webhook_url_encrypted', sa.Text(), nullable=False),
        sa.Column('webhook_url_hash', sa.String(length=64), nullable=False),
        sa.Column('enabled_events', postgresql.ARRAY(sa.String(length=50)), nullable=False),
        sa.Column('rate_limit_per_minute', sa.Integer(), nullable=True),
        sa.Column('rate_limit_per_hour', sa.Integer(), nullable=True),
        sa.Column('cooldown_seconds', sa.JSON(), nullable=True),
        sa.Column('include_user_info', sa.Boolean(), nullable=True),
        sa.Column('include_stack_traces', sa.Boolean(), nullable=True),
        sa.Column('include_metadata', sa.Boolean(), nullable=True),
        sa.Column('admin_dashboard_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('last_tested_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_error_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for webhook_configs
    op.create_index('idx_webhook_configs_hash', 'webhook_configs', ['webhook_url_hash'])
    op.create_index('idx_webhook_configs_active', 'webhook_configs', ['is_active', 'platform'])
    
    # Create notification_logs table
    op.create_table(
        'notification_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('webhook_config_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('event_id', sa.String(length=255), nullable=True),
        sa.Column('platform', sa.String(length=20), nullable=False),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('response_status', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('summary', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for notification_logs
    op.create_index('idx_notification_logs_config_id', 'notification_logs', ['webhook_config_id'])
    op.create_index('idx_notification_logs_event_type', 'notification_logs', ['event_type'])
    op.create_index('idx_notification_logs_config_created', 'notification_logs', ['webhook_config_id', 'created_at'])
    op.create_index('idx_notification_logs_event_type_created', 'notification_logs', ['event_type', 'created_at'])
    op.create_index('idx_notification_logs_created', 'notification_logs', ['created_at'])
    
    # Create rate_limit_buckets table
    op.create_table(
        'rate_limit_buckets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('event_identifier', sa.String(length=255), nullable=False),
        sa.Column('tokens', sa.Integer(), nullable=True),
        sa.Column('last_refill_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_notification_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for rate_limit_buckets
    op.create_index('idx_rate_limit_buckets_event_type', 'rate_limit_buckets', ['event_type'])
    op.create_index('idx_rate_limit_buckets_lookup', 'rate_limit_buckets', ['event_type', 'event_identifier'])


def downgrade() -> None:
    """Remove webhook_configs, notification_logs, and rate_limit_buckets tables."""
    
    # Drop rate_limit_buckets table
    op.drop_index('idx_rate_limit_buckets_lookup', table_name='rate_limit_buckets')
    op.drop_index('idx_rate_limit_buckets_event_type', table_name='rate_limit_buckets')
    op.drop_table('rate_limit_buckets')
    
    # Drop notification_logs table
    op.drop_index('idx_notification_logs_created', table_name='notification_logs')
    op.drop_index('idx_notification_logs_event_type_created', table_name='notification_logs')
    op.drop_index('idx_notification_logs_config_created', table_name='notification_logs')
    op.drop_index('idx_notification_logs_event_type', table_name='notification_logs')
    op.drop_index('idx_notification_logs_config_id', table_name='notification_logs')
    op.drop_table('notification_logs')
    
    # Drop webhook_configs table
    op.drop_index('idx_webhook_configs_active', table_name='webhook_configs')
    op.drop_index('idx_webhook_configs_hash', table_name='webhook_configs')
    op.drop_table('webhook_configs')
