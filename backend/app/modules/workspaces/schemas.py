"""
Pydantic schemas for workspaces, spaces, and pages.
"""
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Any


# ── Workspace ──

class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    icon: str | None = None
    type: str
    owner_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Space ──

class SpaceResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    icon: str | None = None
    type: str
    is_default: bool
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Page ──

class PageCreate(BaseModel):
    title: str = "Untitled"
    space_id: UUID
    parent_id: UUID | None = None
    is_folder: bool = False
    icon: str | None = None
    content: Any | None = None
    page_type: str = "note"  # 'note', 'canvas', 'kanban'


class PageUpdate(BaseModel):
    title: str | None = None
    icon: str | None = None
    cover_url: str | None = None
    content: Any | None = None
    is_locked: bool | None = None


class PageMove(BaseModel):
    parent_id: UUID | None = None
    space_id: UUID | None = None


class PageResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    space_id: UUID | None = None
    parent_id: UUID | None = None
    created_by: UUID | None = None
    last_edited_by: UUID | None = None
    title: str
    icon: str | None = None
    cover_url: str | None = None
    page_type: str = "note"
    is_folder: bool
    sort_order: float
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PageDetailResponse(PageResponse):
    """Full page response including content."""
    content: Any | None = None


class PageListResponse(BaseModel):
    pages: list[PageResponse]
