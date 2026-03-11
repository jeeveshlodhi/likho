"""
CRUD operations for collaboration features.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.modules.collaboration.models import Comment, CommentReaction, CollaborationLog, CollaborationSession
from app.modules.sharing.models import MemberRole


# =============================================================================
# Comments
# =============================================================================

def create_comment(
    db: Session,
    page_id: UUID,
    author_id: UUID,
    content: dict,
    block_id: Optional[UUID] = None,
    parent_id: Optional[UUID] = None,
    yjs_mark_id: Optional[str] = None
) -> Comment:
    """Create a new comment."""
    # Calculate thread order for replies
    thread_order = 0
    if parent_id:
        last_reply = db.query(Comment).filter(
            Comment.parent_id == parent_id
        ).order_by(desc(Comment.thread_order)).first()
        if last_reply:
            thread_order = last_reply.thread_order + 1
    
    comment = Comment(
        page_id=page_id,
        author_id=author_id,
        content=content,
        block_id=block_id,
        parent_id=parent_id,
        yjs_mark_id=yjs_mark_id,
        thread_order=thread_order
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def get_comment(db: Session, comment_id: UUID) -> Optional[Comment]:
    """Get a comment by ID."""
    return db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.deleted_at.is_(None)
    ).first()


def list_page_comments(
    db: Session, 
    page_id: UUID,
    include_resolved: bool = True
) -> list[Comment]:
    """List all comments on a page."""
    query = db.query(Comment).filter(
        Comment.page_id == page_id,
        Comment.deleted_at.is_(None),
        Comment.parent_id.is_(None)  # Only top-level comments
    )
    
    if not include_resolved:
        query = query.filter(Comment.resolved_at.is_(None))
    
    return query.order_by(Comment.created_at.desc()).all()


def list_comment_replies(db: Session, parent_id: UUID) -> list[Comment]:
    """List all replies to a comment."""
    return db.query(Comment).filter(
        Comment.parent_id == parent_id,
        Comment.deleted_at.is_(None)
    ).order_by(Comment.thread_order).all()


def update_comment(
    db: Session,
    comment_id: UUID,
    content: dict,
    user_id: UUID
) -> Optional[Comment]:
    """Update a comment. Only author can edit."""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.author_id == user_id,
        Comment.deleted_at.is_(None)
    ).first()
    
    if not comment:
        return None
    
    comment.content = content
    comment.edited_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(db: Session, comment_id: UUID, user_id: UUID) -> bool:
    """Soft delete a comment. Author or admin can delete."""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.deleted_at.is_(None)
    ).first()
    
    if not comment:
        return False
    
    # TODO: Check if user is admin
    if comment.author_id != user_id:
        return False
    
    comment.deleted_at = datetime.utcnow()
    db.commit()
    return True


def resolve_comment(
    db: Session,
    comment_id: UUID,
    user_id: UUID
) -> Optional[Comment]:
    """Mark a comment as resolved."""
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.deleted_at.is_(None)
    ).first()
    
    if not comment:
        return None
    
    comment.resolved_at = datetime.utcnow()
    comment.resolved_by = user_id
    db.commit()
    db.refresh(comment)
    return comment


# =============================================================================
# Comment Reactions
# =============================================================================

def add_reaction(
    db: Session,
    comment_id: UUID,
    user_id: UUID,
    emoji: str
) -> CommentReaction:
    """Add a reaction to a comment."""
    # Check if already exists
    existing = db.query(CommentReaction).filter(
        CommentReaction.comment_id == comment_id,
        CommentReaction.user_id == user_id,
        CommentReaction.emoji == emoji
    ).first()
    
    if existing:
        return existing
    
    reaction = CommentReaction(
        comment_id=comment_id,
        user_id=user_id,
        emoji=emoji
    )
    db.add(reaction)
    db.commit()
    db.refresh(reaction)
    return reaction


def remove_reaction(
    db: Session,
    comment_id: UUID,
    user_id: UUID,
    emoji: str
) -> bool:
    """Remove a reaction from a comment."""
    reaction = db.query(CommentReaction).filter(
        CommentReaction.comment_id == comment_id,
        CommentReaction.user_id == user_id,
        CommentReaction.emoji == emoji
    ).first()
    
    if reaction:
        db.delete(reaction)
        db.commit()
        return True
    return False


def list_comment_reactions(db: Session, comment_id: UUID) -> list[CommentReaction]:
    """List all reactions on a comment."""
    return db.query(CommentReaction).filter(
        CommentReaction.comment_id == comment_id
    ).all()


# =============================================================================
# Collaboration Sessions
# =============================================================================

def get_active_sessions(db: Session, page_id: UUID) -> list[CollaborationSession]:
    """Get all active sessions for a page."""
    return db.query(CollaborationSession).filter(
        CollaborationSession.page_id == page_id,
        CollaborationSession.disconnected_at.is_(None)
    ).all()


def get_user_session(db: Session, connection_id: str) -> Optional[CollaborationSession]:
    """Get session by connection ID."""
    return db.query(CollaborationSession).filter(
        CollaborationSession.connection_id == connection_id
    ).first()


def disconnect_session(db: Session, connection_id: str) -> bool:
    """Mark a session as disconnected."""
    session = db.query(CollaborationSession).filter(
        CollaborationSession.connection_id == connection_id,
        CollaborationSession.disconnected_at.is_(None)
    ).first()
    
    if session:
        session.disconnected_at = datetime.utcnow()
        db.commit()
        return True
    return False


def cleanup_stale_sessions(db: Session, max_age_minutes: int = 5) -> int:
    """Disconnect sessions that haven't been active."""
    from sqlalchemy import func
    
    cutoff = datetime.utcnow() - func.interval(f'{max_age_minutes} minutes')
    
    sessions = db.query(CollaborationSession).filter(
        CollaborationSession.disconnected_at.is_(None),
        CollaborationSession.last_activity_at < cutoff
    ).all()
    
    count = 0
    for session in sessions:
        session.disconnected_at = datetime.utcnow()
        count += 1
    
    db.commit()
    return count


# =============================================================================
# Activity Logs
# =============================================================================

def log_activity(
    db: Session,
    page_id: UUID,
    user_id: Optional[UUID],
    action: str,
    metadata: dict = None,
    update_size: Optional[int] = None
) -> CollaborationLog:
    """Log a collaboration activity."""
    log = CollaborationLog(
        page_id=page_id,
        user_id=user_id,
        action=action,
        meta_data=metadata or {},
        update_size=update_size
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_page_activity(
    db: Session,
    page_id: UUID,
    limit: int = 50,
    offset: int = 0
) -> list[CollaborationLog]:
    """Get activity log for a page."""
    return db.query(CollaborationLog).filter(
        CollaborationLog.page_id == page_id
    ).order_by(desc(CollaborationLog.created_at)).offset(offset).limit(limit).all()


def get_user_activity(
    db: Session,
    user_id: UUID,
    limit: int = 50
) -> list[CollaborationLog]:
    """Get activity log for a user."""
    return db.query(CollaborationLog).filter(
        CollaborationLog.user_id == user_id
    ).order_by(desc(CollaborationLog.created_at)).limit(limit).all()
