"""
SQLAlchemy models for page permissions and share links.
"""
from datetime import datetime
from sqlalchemy import (
    Boolean, Column, String, Text, Integer, DateTime,
    Enum as SQLEnum, ForeignKey, Index, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid
import enum
import secrets

from app.core.base import Base


class MemberRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    COMMENTER = "commenter"
    VIEWER = "viewer"


class PagePermission(Base):
    __tablename__ = "page_permissions"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id = Column(PG_UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    role = Column(SQLEnum(MemberRole), nullable=False, default=MemberRole.VIEWER)
    granted_by = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    page = relationship("Page", foreign_keys=[page_id])
    user = relationship("User", foreign_keys=[user_id])
    granter = relationship("User", foreign_keys=[granted_by])

    __table_args__ = (
        Index("idx_page_permissions_page", "page_id"),
        Index("idx_page_permissions_user", "user_id"),
    )


class ShareLink(Base):
    __tablename__ = "share_links"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id = Column(PG_UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(64), unique=True, nullable=False, default=lambda: secrets.token_hex(16))
    role = Column(SQLEnum(MemberRole), default=MemberRole.VIEWER)
    password_hash = Column(Text, nullable=True)
    allow_duplicate = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    page = relationship("Page", foreign_keys=[page_id])
    creator = relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        Index("idx_share_links_page", "page_id"),
        Index("idx_share_links_token", "token"),
    )
