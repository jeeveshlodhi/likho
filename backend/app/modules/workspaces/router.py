"""
API endpoints for workspaces, spaces, and pages.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.modules.users.models import User
from app.modules.workspaces import crud
from app.modules.workspaces.schemas import (
    WorkspaceResponse,
    SpaceResponse,
    PageCreate,
    PageUpdate,
    PageMove,
    PageResponse,
    PageDetailResponse,
    PageListResponse,
)

logger = logging.getLogger(__name__)

workspace_router = APIRouter()
pages_router = APIRouter()


# ── Workspace Endpoints ──

@workspace_router.get("/me", response_model=WorkspaceResponse)
def get_my_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get or create the user's personal workspace."""
    try:
        workspace = crud.get_or_create_personal_workspace(
            db, current_user.id, current_user.full_name or current_user.email
        )
        return workspace
    except Exception as e:
        logger.exception("GET /workspaces/me failed: %s", e)
        raise


@workspace_router.get("/{workspace_id}/spaces", response_model=list[SpaceResponse])
def list_spaces(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all spaces in a workspace."""
    workspace = crud.get_workspace(db, workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return crud.list_spaces(db, workspace_id)


# ── Page Endpoints ──

@pages_router.post("", response_model=PageDetailResponse, status_code=status.HTTP_201_CREATED)
def create_page(
    data: PageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new page or folder."""
    space = crud.get_space(db, data.space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    # Verify user owns the workspace
    workspace = crud.get_workspace(db, space.workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.create_page(db, data, workspace.id, current_user.id)


@pages_router.get("", response_model=list[PageResponse])
def list_pages(
    space_id: UUID,
    parent_id: UUID | None = Query(default=None),
    all: bool = Query(default=False, description="If true, return all pages in the space"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List pages in a space, optionally filtered by parent."""
    space = crud.get_space(db, space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    workspace = crud.get_workspace(db, space.workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if all:
        return crud.list_all_pages_in_space(db, workspace.id, space_id)
    return crud.list_pages(db, workspace.id, space_id, parent_id)


@pages_router.get("/{page_id}", response_model=PageDetailResponse)
def get_page(
    page_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a page with its content."""
    page = crud.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    workspace = crud.get_workspace(db, page.workspace_id)
    is_owner = workspace and workspace.owner_id == current_user.id

    if not is_owner:
        # Check whether the user has been explicitly shared this page
        from app.modules.sharing import crud as sharing_crud
        if not sharing_crud.check_access(db, current_user.id, page_id, "viewer"):
            raise HTTPException(status_code=403, detail="Not authorized")

    return page


@pages_router.patch("/{page_id}", response_model=PageDetailResponse)
def update_page(
    page_id: UUID,
    data: PageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a page's title, content, icon, etc."""
    page = crud.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    workspace = crud.get_workspace(db, page.workspace_id)
    is_owner = workspace and workspace.owner_id == current_user.id
    if not is_owner:
        from app.modules.sharing import crud as sharing_crud
        if not sharing_crud.check_access(db, current_user.id, page_id, "editor"):
            raise HTTPException(status_code=403, detail="Not authorized")
    return crud.update_page(db, page, data, current_user.id)


@pages_router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(
    page_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Soft-delete a page."""
    page = crud.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    workspace = crud.get_workspace(db, page.workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    crud.delete_page(db, page)


@pages_router.patch("/{page_id}/move", response_model=PageResponse)
def move_page(
    page_id: UUID,
    data: PageMove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Move a page to a different parent or space."""
    page = crud.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    workspace = crud.get_workspace(db, page.workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.move_page(db, page, data.parent_id, data.space_id)
