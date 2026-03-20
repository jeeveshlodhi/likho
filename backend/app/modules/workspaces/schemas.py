"""
Pydantic schemas for workspaces, spaces, and pages.
"""
from pydantic import BaseModel, Field, field_serializer
from uuid import UUID
from datetime import datetime
from typing import Any, Literal
import enum


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

    @field_serializer("type")
    @staticmethod
    def serialize_type(v: str | enum.Enum) -> str:
        return v.value if isinstance(v, enum.Enum) else v


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
    title: str = Field("Untitled", max_length=500)
    space_id: UUID
    parent_id: UUID | None = None
    is_folder: bool = False
    icon: str | None = Field(None, max_length=100)
    content: Any | None = None
    page_type: Literal["note", "canvas", "kanban", "journal", "meeting", "project", "documentation", "brainstorm", "pdf"] = "note"


class PageUpdate(BaseModel):
    title: str | None = Field(None, max_length=500)
    icon: str | None = Field(None, max_length=100)
    cover_url: str | None = Field(None, max_length=2048)
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
