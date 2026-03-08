"""
Pydantic schemas for sharing and permissions.
"""
from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime


class ShareRequest(BaseModel):
    email: EmailStr
    role: str = "viewer"  # viewer, editor, commenter


class PermissionResponse(BaseModel):
    id: UUID
    page_id: UUID
    user_id: UUID | None
    role: str
    granted_by: UUID | None
    created_at: datetime
    # Populated user info
    user_email: str | None = None
    user_name: str | None = None

    model_config = {"from_attributes": True}


class ShareLinkCreate(BaseModel):
    role: str = "viewer"


class ShareLinkResponse(BaseModel):
    id: UUID
    page_id: UUID
    token: str
    role: str
    view_count: int
    expires_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SharedPageResponse(BaseModel):
    id: UUID
    title: str
    icon: str | None = None
    cover_url: str | None = None
    content: dict | list | None = None
    role: str  # The role granted by the share link
    created_at: datetime
    updated_at: datetime
