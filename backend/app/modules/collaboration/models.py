"""
Model for persisting Yjs document state.
"""
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, LargeBinary
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.base import Base


class YjsDocument(Base):
    """
    Stores the serialized Yjs document state for each page.
    When the last collaborator disconnects, the Yjs state is
    persisted here. When a new collaborator joins, this is
    loaded and sent as the initial sync state.
    """
    __tablename__ = "yjs_documents"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id = Column(PG_UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), unique=True, nullable=False)
    yjs_state = Column(LargeBinary, nullable=True)  # Y.Doc encoded state
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    page = relationship("Page", foreign_keys=[page_id])
