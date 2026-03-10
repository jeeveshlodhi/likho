"""
SQLAlchemy model for cloud-synced temp notes.
"""
from datetime import datetime
from sqlalchemy import Boolean, Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.core.base import Base


class TempNote(Base):
    __tablename__ = "temp_notes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_permanent = Column(Boolean, default=False)
    suggested_folder = Column(String(255), nullable=True)
    ai_confidence = Column(String(20), nullable=True)  # high/medium/low/uncertain
    tags = Column(JSONB, default=[])
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
