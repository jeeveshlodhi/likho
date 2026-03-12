"""
Pydantic schemas for sharing and permissions.
"""
from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional


class ShareRequest(BaseModel):
    email: EmailStr
    role: str = "viewer"  # viewer, commenter, editor, admin
    expires_at: Optional[str] = None  # ISO datetime string


class PermissionResponse(BaseModel):
    id: UUID
    page_id: UUID
    user_id: UUID | None
    role: str
    granted_by: UUID | None
    expires_at: datetime | None
    created_at: datetime
    # Populated user info
    user_email: str | None = None
    user_name: str | None = None

    model_config = {"from_attributes": True}


class ShareLinkCreate(BaseModel):
    role: str = "viewer"
    expires_at: Optional[str] = None  # ISO datetime string
    max_views: Optional[int] = None
    require_email: bool = False
    allow_comments: bool = True
    allow_export: bool = True


class ShareLinkUpdate(BaseModel):
    role: Optional[str] = None
    expires_at: Optional[str] = None
    max_views: Optional[int] = None


class ShareLinkResponse(BaseModel):
    id: UUID
    page_id: UUID
    token: str
    role: str
    view_count: int
    max_views: Optional[int]
    require_email: bool
    allow_comments: bool
    allow_export: bool
    expires_at: datetime | None
    created_at: datetime
    revoked_at: datetime | None

    model_config = {"from_attributes": True}


class SharedPageUpdate(BaseModel):
    content: dict | list | None = None
    title: str | None = None


class SharedPageResponse(BaseModel):
    id: UUID
    title: str
    icon: str | None = None
    cover_url: str | None = None
    content: dict | list | None = None
    role: str  # The role granted by the share link
    allow_comments: bool = True
    allow_export: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PageRoleResponse(BaseModel):
    role: str


class SharedWithMeItem(BaseModel):
    page_id: UUID
    page_title: str
    page_icon: Optional[str] = None
    page_type: str = "note"
    role: str
    granted_by_name: Optional[str] = None
    granted_by_email: Optional[str] = None
    granted_at: datetime
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
