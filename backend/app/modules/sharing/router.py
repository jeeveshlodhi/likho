"""
API endpoints for sharing and permissions.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.modules.users.models import User
from app.modules.workspaces import crud as workspace_crud
from app.modules.sharing import crud
from app.modules.sharing.schemas import (
    ShareRequest,
    PermissionResponse,
    ShareLinkCreate,
    ShareLinkResponse,
    SharedPageResponse,
    SharedPageUpdate,
    ShareLinkUpdate,
)
from app.modules.collaboration.crud import log_activity

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post("/pages/{page_id}/share", response_model=PermissionResponse)
def share_page(
    page_id: UUID,
    data: ShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Share a page with a user by email."""
    # Verify page exists and user owns it
    page = workspace_crud.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    workspace = workspace_crud.get_workspace(db, page.workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to share this page")

    # Find target user by email
    from app.modules.users.crud import get_user_by_email
    target_user = get_user_by_email(db, data.email)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found with this email")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot share with yourself")

    # Parse expires_at if provided
    expires_at = None
    if data.expires_at:
        expires_at = datetime.fromisoformat(data.expires_at.replace('Z', '+00:00'))

    perm = crud.share_with_user(
        db, page_id, target_user.id, data.role, current_user.id, expires_at
    )
    
    # Log activity
    try:
        log_activity(db, page_id, current_user.id, "share", {
            "target_user_id": str(target_user.id),
            "role": data.role
        })
    except Exception as _log_err:
        logger.warning(f"Failed to log share activity: {_log_err}")
    
    return {
        "id": perm.id,
        "page_id": perm.page_id,
        "user_id": perm.user_id,
        "role": perm.role.value if hasattr(perm.role, "value") else perm.role,
        "granted_by": perm.granted_by,
        "expires_at": perm.expires_at,
        "created_at": perm.created_at,
        "user_email": target_user.email,
        "user_name": target_user.full_name,
    }


@router.get("/pages/{page_id}/permissions", response_model=list[PermissionResponse])
def list_permissions(
    page_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all permissions for a page."""
    page = workspace_crud.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    if not crud.check_access(db, current_user.id, page_id, "viewer"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.list_permissions(db, page_id)


@router.delete("/pages/{page_id}/permissions/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_permission(
    page_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove a user's access to a page."""
    page = workspace_crud.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    workspace = workspace_crud.get_workspace(db, page.workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    crud.remove_permission(db, page_id, user_id)
    
    # Log activity
    try:
        log_activity(db, page_id, current_user.id, "unshare", {
            "target_user_id": str(user_id)
        })
    except Exception as _log_err:
        logger.warning(f"Failed to log unshare activity: {_log_err}")


@router.post("/pages/{page_id}/share-link", response_model=ShareLinkResponse)
def create_share_link(
    page_id: UUID,
    data: ShareLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a public share link for a page."""
    page = workspace_crud.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    workspace = workspace_crud.get_workspace(db, page.workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Parse settings
    expires_at = None
    if data.expires_at:
        expires_at = datetime.fromisoformat(data.expires_at.replace('Z', '+00:00'))

    link = crud.create_share_link(
        db=db,
        page_id=page_id,
        role=data.role,
        created_by=current_user.id,
        expires_at=expires_at,
        max_views=data.max_views,
        require_email=data.require_email,
        allow_comments=data.allow_comments,
        allow_export=data.allow_export
    )
    
    # Log activity
    try:
        log_activity(db, page_id, current_user.id, "create_share_link", {
            "role": data.role,
            "expires_at": str(expires_at) if expires_at else None
        })
    except Exception as _log_err:
        logger.warning(f"Failed to log create_share_link activity: {_log_err}")
    
    return link


@router.get("/pages/{page_id}/share-links", response_model=list[ShareLinkResponse])
def list_share_links(
    page_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all share links for a page."""
    page = workspace_crud.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    workspace = workspace_crud.get_workspace(db, page.workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    links = crud.get_page_share_links(db, page_id)
    return links


@router.patch("/share-links/{link_id}", response_model=ShareLinkResponse)
def update_share_link(
    link_id: UUID,
    data: ShareLinkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a share link."""
    from app.modules.sharing.models import ShareLink
    
    link = db.query(ShareLink).filter(ShareLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Share link not found")
    
    # Verify ownership
    page = workspace_crud.get_page(db, link.page_id)
    workspace = workspace_crud.get_workspace(db, page.workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    expires_at = None
    if data.expires_at:
        expires_at = datetime.fromisoformat(data.expires_at.replace('Z', '+00:00'))
    
    updated = crud.update_share_link(
        db, link_id, data.role, expires_at, data.max_views
    )
    return updated


@router.delete("/share-links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_share_link(
    link_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Revoke a share link."""
    from app.modules.sharing.models import ShareLink
    
    link = db.query(ShareLink).filter(ShareLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Share link not found")
    
    # Verify ownership
    page = workspace_crud.get_page(db, link.page_id)
    workspace = workspace_crud.get_workspace(db, page.workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    crud.revoke_share_link(db, link_id, current_user.id)


@router.get("/shared/{token}", response_model=SharedPageResponse)
def get_shared_page(
    token: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """Access a page via a public share link (no auth required)."""
    link = crud.get_share_link(db, token)
    if not link:
        raise HTTPException(status_code=404, detail="Share link not found or expired")

    page = workspace_crud.get_page(db, link.page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    # Record view
    client_ip = request.client.host if request.client else None
    crud.record_share_link_view(db, link, client_ip)

    return SharedPageResponse(
        id=page.id,
        title=page.title,
        icon=page.icon,
        cover_url=page.cover_url,
        content=page.content,
        role=link.role.value if hasattr(link.role, "value") else link.role,
        allow_comments=link.allow_comments,
        allow_export=link.allow_export,
        created_at=page.created_at,
        updated_at=page.updated_at,
    )


@router.patch("/shared/{token}", response_model=SharedPageResponse)
def update_shared_page(
    token: str,
    data: SharedPageUpdate,
    db: Session = Depends(get_db),
):
    """Update page content via a share link (editor+ roles only, no auth required)."""
    link = crud.get_share_link(db, token)
    if not link:
        raise HTTPException(status_code=404, detail="Share link not found or expired")

    link_role = link.role.value if hasattr(link.role, "value") else link.role
    if link_role not in ("editor", "admin", "owner"):
        raise HTTPException(status_code=403, detail="This link does not allow editing")

    page = workspace_crud.get_page(db, link.page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    if data.content is not None:
        page.content = data.content
    if data.title is not None:
        page.title = data.title
    page.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(page)

    return SharedPageResponse(
        id=page.id,
        title=page.title,
        icon=page.icon,
        cover_url=page.cover_url,
        content=page.content,
        role=link_role,
        allow_comments=link.allow_comments,
        allow_export=link.allow_export,
        created_at=page.created_at,
        updated_at=page.updated_at,
    )


@router.get("/pages/{page_id}/my-role")
def get_my_page_role(
    page_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get current user's role for a specific page."""
    role = crud.get_user_role(db, current_user.id, page_id)
    if not role:
        raise HTTPException(status_code=403, detail="No access to this page")
    return {"role": role}
