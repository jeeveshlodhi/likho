"""
API endpoints for collaboration features: comments, activity logs, sessions.
"""
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db, SessionLocal
from app.core.deps import get_current_active_user
from app.modules.users.models import User
from app.modules.workspaces import crud as workspace_crud
from app.modules.sharing import crud as sharing_crud
from app.modules.collaboration import crud
from app.modules.collaboration.schemas import (
    CommentCreate,
    CommentResponse,
    CommentUpdate,
    ReactionCreate,
    ActivityLogResponse,
)

router = APIRouter()


def check_page_access(db: Session, user_id: UUID, page_id: UUID, required_role: str = "viewer"):
    """Helper to check page access."""
    if not sharing_crud.check_access(db, user_id, page_id, required_role):
        raise HTTPException(status_code=403, detail="Not authorized to access this page")


# =============================================================================
# Comments
# =============================================================================

@router.post("/pages/{page_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    page_id: UUID,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new comment on a page."""
    page = workspace_crud.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Check access (commenter or above)
    check_page_access(db, current_user.id, page_id, "commenter")
    
    comment = crud.create_comment(
        db=db,
        page_id=page_id,
        author_id=current_user.id,
        content=data.content,
        block_id=data.block_id,
        parent_id=data.parent_id,
        yjs_mark_id=data.yjs_mark_id
    )
    
    return _comment_to_response(comment)


@router.get("/pages/{page_id}/comments", response_model=list[CommentResponse])
def list_comments(
    page_id: UUID,
    include_resolved: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all comments on a page."""
    page = workspace_crud.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    check_page_access(db, current_user.id, page_id, "viewer")
    
    comments = crud.list_page_comments(db, page_id, include_resolved)
    return [_comment_to_response(c) for c in comments]


@router.get("/comments/{comment_id}", response_model=CommentResponse)
def get_comment(
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific comment."""
    comment = crud.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    check_page_access(db, current_user.id, comment.page_id, "viewer")
    
    return _comment_to_response(comment)


@router.patch("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: UUID,
    data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a comment. Only author can edit."""
    comment = crud.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the author can edit this comment")
    
    updated = crud.update_comment(db, comment_id, data.content, current_user.id)
    return _comment_to_response(updated)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a comment. Author or page owner can delete."""
    comment = crud.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user is author or page owner
    page = workspace_crud.get_page(db, comment.page_id)
    workspace = workspace_crud.get_workspace(db, page.workspace_id)
    
    if comment.author_id != current_user.id and workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    crud.delete_comment(db, comment_id, current_user.id)


@router.post("/comments/{comment_id}/resolve", response_model=CommentResponse)
def resolve_comment(
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Mark a comment as resolved."""
    comment = crud.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    check_page_access(db, current_user.id, comment.page_id, "editor")
    
    resolved = crud.resolve_comment(db, comment_id, current_user.id)
    return _comment_to_response(resolved)


# =============================================================================
# Reactions
# =============================================================================

@router.post("/comments/{comment_id}/reactions", status_code=status.HTTP_201_CREATED)
def add_reaction(
    comment_id: UUID,
    data: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add a reaction to a comment."""
    comment = crud.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    check_page_access(db, current_user.id, comment.page_id, "viewer")
    
    reaction = crud.add_reaction(db, comment_id, current_user.id, data.emoji)
    return {"id": reaction.id, "emoji": reaction.emoji, "created_at": reaction.created_at}


@router.delete("/comments/{comment_id}/reactions/{emoji}", status_code=status.HTTP_204_NO_CONTENT)
def remove_reaction(
    comment_id: UUID,
    emoji: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove a reaction from a comment."""
    comment = crud.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    crud.remove_reaction(db, comment_id, current_user.id, emoji)


# =============================================================================
# Activity Logs
# =============================================================================

@router.get("/pages/{page_id}/activity", response_model=list[ActivityLogResponse])
def get_page_activity(
    page_id: UUID,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get activity log for a page."""
    page = workspace_crud.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    check_page_access(db, current_user.id, page_id, "viewer")
    
    logs = crud.get_page_activity(db, page_id, limit, offset)
    return [_log_to_response(l) for l in logs]


@router.get("/my/activity", response_model=list[ActivityLogResponse])
def get_my_activity(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get current user's activity log."""
    logs = crud.get_user_activity(db, current_user.id, limit)
    return [_log_to_response(l) for l in logs]


# =============================================================================
# Helper Functions
# =============================================================================

def _comment_to_response(comment) -> CommentResponse:
    """Convert Comment model to response schema."""
    from app.modules.users.crud import get_user
    
    db = SessionLocal()
    try:
        author = get_user(db, comment.author_id)
        resolver = get_user(db, comment.resolved_by) if comment.resolved_by else None
        
        # Get reactions
        reactions = crud.list_comment_reactions(db, comment.id)
        reaction_counts = {}
        for r in reactions:
            reaction_counts[r.emoji] = reaction_counts.get(r.emoji, 0) + 1
        
        return CommentResponse(
            id=comment.id,
            page_id=comment.page_id,
            block_id=comment.block_id,
            yjs_mark_id=comment.yjs_mark_id,
            parent_id=comment.parent_id,
            author={
                "id": str(author.id) if author else str(comment.author_id),
                "name": author.full_name if author else "Unknown",
                "avatar_url": author.avatar_url if author else None
            },
            content=comment.content,
            resolved_at=comment.resolved_at,
            resolved_by={
                "id": str(resolver.id),
                "name": resolver.full_name
            } if resolver else None,
            reactions=reaction_counts,
            edited_at=comment.edited_at,
            created_at=comment.created_at
        )
    finally:
        db.close()


def _log_to_response(log) -> ActivityLogResponse:
    """Convert CollaborationLog model to response schema."""
    return ActivityLogResponse(
        id=log.id,
        page_id=log.page_id,
        user_id=log.user_id,
        action=log.action,
        meta_data=log.meta_data,
        created_at=log.created_at
    )


