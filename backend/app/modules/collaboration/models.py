"""
Models for collaboration features: Yjs documents, sessions, comments, and activity logs.
"""
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, LargeBinary, Text, Integer, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.base import Base


class YjsDocument(Base):
    """
    Stores the serialized Yjs document state for each page.
    """
    __tablename__ = "yjs_documents"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id = Column(PG_UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Yjs state
    state_vector = Column(LargeBinary, nullable=True)
    last_update = Column(LargeBinary, nullable=True)
    
    # Metadata
    version = Column(Integer, default=1)
    client_count = Column(Integer, default=0)
    last_modified_by = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    page = relationship("Page", foreign_keys=[page_id])
    modifier = relationship("User", foreign_keys=[last_modified_by])


class CollaborationSession(Base):
    """
    Tracks active WebSocket connections for real-time collaboration.
    """
    __tablename__ = "collaboration_sessions"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id = Column(PG_UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Session info
    client_id = Column(Text, nullable=False)
    connection_id = Column(Text, nullable=False, unique=True)
    
    # Permissions at connection time
    role = Column(Text, nullable=False)
    can_edit = Column(Boolean, default=False)
    can_comment = Column(Boolean, default=False)
    
    # Activity
    connected_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    last_activity_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    disconnected_at = Column(DateTime(timezone=True), nullable=True)
    
    # Device info
    ip_address = Column(Text, nullable=True)
    user_agent = Column(Text, nullable=True)

    # Relationships
    page = relationship("Page", foreign_keys=[page_id])
    user = relationship("User", foreign_keys=[user_id])


class Comment(Base):
    """
    Threaded comments on pages and blocks.
    """
    __tablename__ = "comments"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id = Column(PG_UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    
    # Location
    block_id = Column(PG_UUID(as_uuid=True), nullable=True)  # Optional reference to blocks table
    yjs_mark_id = Column(Text, nullable=True)
    
    # Threading
    parent_id = Column(PG_UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    thread_order = Column(Integer, default=0)
    
    # Content
    author_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(JSON, nullable=False, default=dict)
    
    # Resolution
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    edited_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    page = relationship("Page", foreign_keys=[page_id])
    author = relationship("User", foreign_keys=[author_id], backref="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")
    resolver = relationship("User", foreign_keys=[resolved_by])


class CommentReaction(Base):
    """
    Emoji reactions on comments.
    """
    __tablename__ = "comment_reactions"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    comment_id = Column(PG_UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    emoji = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    comment = relationship("Comment", foreign_keys=[comment_id])
    user = relationship("User", foreign_keys=[user_id])


class CollaborationLog(Base):
    """
    Audit log for collaboration activities.
    """
    __tablename__ = "collaboration_logs"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id = Column(PG_UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    action = Column(Text, nullable=False)
    meta_data = Column(JSON, default=dict)
    update_size = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    page = relationship("Page", foreign_keys=[page_id])
    user = relationship("User", foreign_keys=[user_id])
