"""
SQLAlchemy models for Workspaces, Spaces, and Pages.
Mirrors the schema.sql definitions for these tables.
"""
from datetime import datetime
from sqlalchemy import (
    Boolean, Column, String, Text, Float, Integer, DateTime,
    Enum as SQLEnum, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
import uuid
import enum

from app.core.base import Base


# ── Enums ──

class WorkspaceType(str, enum.Enum):
    PERSONAL = "personal"
    TEAM = "team"
    ENTERPRISE = "enterprise"


class SpaceType(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"


class SyncStatus(str, enum.Enum):
    SYNCED = "synced"
    PENDING = "pending"
    CONFLICT = "conflict"
    LOCAL_ONLY = "local_only"


# ── Models ──

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    icon = Column(String(255), nullable=True)
    cover_url = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    type = Column(SQLEnum(WorkspaceType), default=WorkspaceType.PERSONAL)
    owner_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    settings = Column(JSONB, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    spaces = relationship("Space", back_populates="workspace", cascade="all, delete-orphan")
    pages = relationship("Page", back_populates="workspace", cascade="all, delete-orphan")


class Space(Base):
    __tablename__ = "spaces"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    icon = Column(String(255), nullable=True)
    type = Column(SQLEnum(SpaceType), nullable=False, default=SpaceType.ONLINE)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    settings = Column(JSONB, default={})
    created_by = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="spaces")
    pages = relationship("Page", back_populates="space")


class Page(Base):
    """
    Represents both pages (notes) and folders.
    A folder is a page with is_folder=True.
    Content is stored as JSONB (BlockNote document).
    """
    __tablename__ = "pages"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    space_id = Column(PG_UUID(as_uuid=True), ForeignKey("spaces.id", ondelete="SET NULL"), nullable=True)
    parent_id = Column(PG_UUID(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), nullable=True)
    created_by = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    last_edited_by = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    title = Column(Text, nullable=False, default="Untitled")
    icon = Column(String(255), nullable=True)
    cover_url = Column(Text, nullable=True)
    content = Column(JSONB, nullable=True)  # BlockNote document JSON
    page_type = Column(String(50), nullable=False, default="note")  # 'note', 'canvas', 'kanban'

    is_folder = Column(Boolean, default=False)
    is_template = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)

    sort_order = Column(Float, default=0)
    depth = Column(Integer, default=0)
    version = Column(Integer, default=1)

    sync_status = Column(SQLEnum(SyncStatus), default=SyncStatus.SYNCED)
    local_id = Column(String(255), nullable=True)

    metadata_ = Column("metadata", JSONB, default={})
    settings = Column(JSONB, default={})

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="pages")
    space = relationship("Space", back_populates="pages")
    parent = relationship("Page", remote_side=[id], backref="children")
    creator = relationship("User", foreign_keys=[created_by])
    editor = relationship("User", foreign_keys=[last_edited_by])

    __table_args__ = (
        Index("idx_pages_workspace", "workspace_id"),
        Index("idx_pages_space", "space_id"),
        Index("idx_pages_parent", "parent_id"),
        Index("idx_pages_created_by", "created_by"),
    )
