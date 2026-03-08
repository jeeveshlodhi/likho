"""
CRUD operations for page permissions and share links.
"""
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.modules.sharing.models import PagePermission, ShareLink, MemberRole
from app.modules.workspaces.models import Page
from app.modules.users.models import User


# ── Permissions ──

def share_with_user(
    db: Session, page_id: UUID, user_id: UUID, role: str, granted_by: UUID
) -> PagePermission:
    """Grant a user access to a page."""
    # Check if permission already exists
    existing = db.query(PagePermission).filter(
        PagePermission.page_id == page_id,
        PagePermission.user_id == user_id,
    ).first()
    if existing:
        existing.role = role
        db.commit()
        db.refresh(existing)
        return existing

    perm = PagePermission(
        page_id=page_id,
        user_id=user_id,
        role=role,
        granted_by=granted_by,
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
        user = db.query(User).filter(User.id == p.user_id).first() if p.user_id else None
        result.append({
            "id": p.id,
            "page_id": p.page_id,
            "user_id": p.user_id,
            "role": p.role.value if hasattr(p.role, "value") else p.role,
            "granted_by": p.granted_by,
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


def check_access(db: Session, user_id: UUID, page_id: UUID, required_role: str = "viewer") -> bool:
    """Check if a user has at least the required role on a page."""
    # Page owner always has access
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        return False
    from app.modules.workspaces.models import Workspace
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

    perm_role = perm.role.value if hasattr(perm.role, "value") else perm.role
    perm_level = role_hierarchy.index(perm_role) if perm_role in role_hierarchy else 0
    return perm_level >= required_level


# ── Share Links ──

def create_share_link(db: Session, page_id: UUID, role: str, created_by: UUID) -> ShareLink:
    """Create a public share link for a page."""
    link = ShareLink(
        page_id=page_id,
        role=role,
        created_by=created_by,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def get_share_link(db: Session, token: str) -> ShareLink | None:
    """Get a share link by token."""
    link = db.query(ShareLink).filter(
        ShareLink.token == token,
        ShareLink.revoked_at.is_(None),
    ).first()
    if link and link.expires_at and link.expires_at < datetime.utcnow():
        return None
    return link


def get_page_share_links(db: Session, page_id: UUID) -> list[ShareLink]:
    """Get all active share links for a page."""
    return db.query(ShareLink).filter(
        ShareLink.page_id == page_id,
        ShareLink.revoked_at.is_(None),
    ).all()


def revoke_share_link(db: Session, link_id: UUID) -> bool:
    link = db.query(ShareLink).filter(ShareLink.id == link_id).first()
    if link:
        link.revoked_at = datetime.utcnow()
        db.commit()
        return True
    return False
