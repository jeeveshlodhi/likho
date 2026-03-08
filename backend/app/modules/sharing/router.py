"""
API endpoints for sharing and permissions.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

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
)

router = APIRouter()


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

    perm = crud.share_with_user(db, page_id, target_user.id, data.role, current_user.id)
    return {
        "id": perm.id,
        "page_id": perm.page_id,
        "user_id": perm.user_id,
        "role": perm.role.value if hasattr(perm.role, "value") else perm.role,
        "granted_by": perm.granted_by,
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
    link = crud.create_share_link(db, page_id, data.role, current_user.id)
    return link


@router.get("/shared/{token}", response_model=SharedPageResponse)
def get_shared_page(token: str, db: Session = Depends(get_db)):
    """Access a page via a public share link (no auth required)."""
    link = crud.get_share_link(db, token)
    if not link:
        raise HTTPException(status_code=404, detail="Share link not found or expired")

    page = workspace_crud.get_page(db, link.page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    # Increment view count
    link.view_count += 1
    db.commit()

    return SharedPageResponse(
        id=page.id,
        title=page.title,
        icon=page.icon,
        cover_url=page.cover_url,
        content=page.content,
        role=link.role.value if hasattr(link.role, "value") else link.role,
        created_at=page.created_at,
        updated_at=page.updated_at,
    )
