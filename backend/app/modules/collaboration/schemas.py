"""
Pydantic schemas for collaboration features.
"""
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any


# =============================================================================
# Comments
# =============================================================================

class CommentCreate(BaseModel):
    content: Dict[str, Any]  # BlockNote JSON
    block_id: Optional[UUID] = None
    parent_id: Optional[UUID] = None  # For threaded replies
    yjs_mark_id: Optional[str] = None  # For inline comments


class CommentUpdate(BaseModel):
    content: Dict[str, Any]


class AuthorInfo(BaseModel):
    id: str
    name: str
    avatar_url: Optional[str] = None


class CommentResponse(BaseModel):
    id: UUID
    page_id: UUID
    block_id: Optional[UUID]
    yjs_mark_id: Optional[str]
    parent_id: Optional[UUID]
    author: AuthorInfo
    content: Dict[str, Any]
    resolved_at: Optional[datetime]
    resolved_by: Optional[AuthorInfo]
    reactions: Dict[str, int]  # emoji -> count
    edited_at: Optional[datetime]
    created_at: datetime


class ReactionCreate(BaseModel):
    emoji: str


# =============================================================================
# Activity Logs
# =============================================================================

class ActivityLogResponse(BaseModel):
    id: UUID
    page_id: UUID
    user_id: Optional[UUID]
    action: str
    meta_data: Dict[str, Any]
    created_at: datetime


# =============================================================================
# Sessions
# =============================================================================

class SessionResponse(BaseModel):
    id: UUID
    page_id: UUID
    user_id: UUID
    role: str
    can_edit: bool
    can_comment: bool
    connected_at: datetime
    last_activity_at: datetime


# =============================================================================
# WebSocket Messages
# =============================================================================

class WSMessage(BaseModel):
    type: str  # 'comment', 'awareness', 'ping', 'error'


class CommentWSMessage(WSMessage):
    content: Dict[str, Any]
    block_id: Optional[str] = None
    parent_id: Optional[str] = None


class ErrorWSMessage(WSMessage):
    code: str
    message: str
