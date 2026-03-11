"""
CRUD operations for page permissions and share links.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.sharing.models import PagePermission, ShareLink, MemberRole
from app.modules.workspaces.models import Page, Workspace
from app.modules.users.models import User


# =============================================================================
# Permissions
# =============================================================================

def share_with_user(
    db: Session,
    page_id: UUID,
    user_id: UUID,
    role: str,
    granted_by: UUID,
    expires_at: Optional[datetime] = None
) -> PagePermission:
    """Grant a user access to a page."""
    # Check if permission already exists
    existing = db.query(PagePermission).filter(
        PagePermission.page_id == page_id,
        PagePermission.user_id == user_id,
    ).first()
    
    if existing:
        existing.role = role
        existing.granted_by = granted_by
        existing.expires_at = expires_at
        db.commit()
        db.refresh(existing)
        return existing

    perm = PagePermission(
        page_id=page_id,
        user_id=user_id,
        role=role,
        granted_by=granted_by,
        expires_at=expires_at
    )
    db.add(perm)
    db.commit()
    db.refresh(perm)
    return perm


def list_permissions(db: Session, page_id: UUID) -> list[dict]:
    """List all permissions for a page, including user info."""
    perms = db.query(PagePermission).filter(
        PagePermission.page_id == page_id,
    ).all()

    result = []
    for p in perms:
        # Check if expired
        if p.expires_at and p.expires_at < datetime.utcnow():
            continue
            
        user = db.query(User).filter(User.id == p.user_id).first() if p.user_id else None
        result.append({
            "id": p.id,
            "page_id": p.page_id,
            "user_id": p.user_id,
            "role": p.role.value if hasattr(p.role, "value") else p.role,
            "granted_by": p.granted_by,
            "expires_at": p.expires_at,
            "created_at": p.created_at,
            "user_email": user.email if user else None,
            "user_name": user.full_name if user else None,
        })
    return result


def remove_permission(db: Session, page_id: UUID, user_id: UUID) -> bool:
    """Remove a user's access to a page."""
    perm = db.query(PagePermission).filter(
        PagePermission.page_id == page_id,
        PagePermission.user_id == user_id,
    ).first()
    if perm:
        db.delete(perm)
        db.commit()
        return True
    return False


def get_user_page_permission(
    db: Session, 
    user_id: UUID, 
    page_id: UUID
) -> Optional[PagePermission]:
    """Get a user's specific permission for a page."""
    perm = db.query(PagePermission).filter(
        PagePermission.page_id == page_id,
        PagePermission.user_id == user_id,
    ).first()
    
    # Check if expired
    if perm and perm.expires_at and perm.expires_at < datetime.utcnow():
        return None
    
    return perm


def check_access(
    db: Session, 
    user_id: UUID, 
    page_id: UUID, 
    required_role: str = "viewer"
) -> bool:
    """Check if a user has at least the required role on a page."""
    # Page owner always has access
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        return False
    
    workspace = db.query(Workspace).filter(Workspace.id == page.workspace_id).first()
    if workspace and workspace.owner_id == user_id:
        return True

    # Check explicit permission
    role_hierarchy = ["viewer", "commenter", "editor", "admin", "owner"]
    required_level = role_hierarchy.index(required_role) if required_role in role_hierarchy else 0

    perm = db.query(PagePermission).filter(
        PagePermission.page_id == page_id,
        PagePermission.user_id == user_id,
    ).first()
    
    if not perm:
        return False

    # Check expiration
    if perm.expires_at and perm.expires_at < datetime.utcnow():
        return False

    perm_role = perm.role.value if hasattr(perm.role, "value") else perm.role
    perm_level = role_hierarchy.index(perm_role) if perm_role in role_hierarchy else 0
    return perm_level >= required_level


def get_user_role(db: Session, user_id: UUID, page_id: UUID) -> str:
    """Get user's role for a page. Returns empty string if no access."""
    # Check owner
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        return ""
    
    workspace = db.query(Workspace).filter(Workspace.id == page.workspace_id).first()
    if workspace and workspace.owner_id == user_id:
        return "owner"
    
    # Check permission
    perm = db.query(PagePermission).filter(
        PagePermission.page_id == page_id,
        PagePermission.user_id == user_id,
    ).first()
    
    if perm:
        # Check expiration
        if perm.expires_at and perm.expires_at < datetime.utcnow():
            return ""
        return perm.role.value if hasattr(perm.role, "value") else perm.role
    
    return ""


# =============================================================================
# Share Links
# =============================================================================

def create_share_link(
    db: Session,
    page_id: UUID,
    role: str,
    created_by: UUID,
    expires_at: Optional[datetime] = None,
    password_hash: Optional[str] = None,
    max_views: Optional[int] = None,
    require_email: bool = False,
    allow_comments: bool = True,
    allow_export: bool = True,
    ip_restrictions: Optional[list[str]] = None,
    domain_restrictions: Optional[list[str]] = None
) -> ShareLink:
    """Create a public share link for a page."""
    link = ShareLink(
        page_id=page_id,
        role=role,
        created_by=created_by,
        expires_at=expires_at,
        password_hash=password_hash,
        max_views=max_views,
        require_email=require_email,
        allow_comments=allow_comments,
        allow_export=allow_export,
        ip_restrictions=ip_restrictions or [],
        domain_restrictions=domain_restrictions or []
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def get_share_link(db: Session, token: str) -> Optional[ShareLink]:
    """Get a share link by token."""
    link = db.query(ShareLink).filter(
        ShareLink.token == token,
        ShareLink.revoked_at.is_(None),
    ).first()
    
    if not link:
        return None
    
    # Check expiration
    if link.expires_at and link.expires_at < datetime.utcnow():
        return None
    
    # Check max views
    if link.max_views and link.view_count >= link.max_views:
        return None
    
    return link


def record_share_link_view(db: Session, link: ShareLink, ip_address: Optional[str] = None):
    """Record a view of a share link."""
    link.view_count += 1
    link.last_accessed_at = datetime.utcnow()
    db.commit()


def get_page_share_links(db: Session, page_id: UUID, active_only: bool = True) -> list[ShareLink]:
    """Get all share links for a page."""
    query = db.query(ShareLink).filter(ShareLink.page_id == page_id)
    
    if active_only:
        query = query.filter(ShareLink.revoked_at.is_(None))
    
    return query.order_by(ShareLink.created_at.desc()).all()


def revoke_share_link(db: Session, link_id: UUID, revoked_by: UUID) -> bool:
    """Revoke a share link."""
    link = db.query(ShareLink).filter(ShareLink.id == link_id).first()
    if link:
        link.revoked_at = datetime.utcnow()
        db.commit()
        return True
    return False


def update_share_link(
    db: Session,
    link_id: UUID,
    role: Optional[str] = None,
    expires_at: Optional[datetime] = None,
    max_views: Optional[int] = None
) -> Optional[ShareLink]:
    """Update a share link."""
    link = db.query(ShareLink).filter(ShareLink.id == link_id).first()
    if not link:
        return None
    
    if role:
        link.role = role
    if expires_at is not None:
        link.expires_at = expires_at
    if max_views is not None:
        link.max_views = max_views
    
    db.commit()
    db.refresh(link)
    return link
