"""
CRUD operations for workspaces, spaces, and pages.
"""
from sqlalchemy.orm import Session
from uuid import UUID
import re

from app.modules.workspaces.models import Workspace, Space, Page, SpaceType
from app.modules.workspaces.schemas import PageCreate, PageUpdate


# ── Workspace ──

def get_workspace(db: Session, workspace_id: UUID) -> Workspace | None:
    return db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.deleted_at.is_(None),
    ).first()


def get_user_personal_workspace(db: Session, user_id: UUID) -> Workspace | None:
    return db.query(Workspace).filter(
        Workspace.owner_id == user_id,
        Workspace.type == "personal",
        Workspace.deleted_at.is_(None),
    ).first()


def create_personal_workspace(db: Session, user_id: UUID, user_name: str) -> Workspace:
    """Create a personal workspace with default online and offline spaces."""
    slug = re.sub(r"[^a-z0-9]+", "-", (user_name or "user").lower()).strip("-")
    # Ensure uniqueness
    existing = db.query(Workspace).filter(Workspace.slug == slug).first()
    if existing:
        slug = f"{slug}-{str(user_id)[:8]}"

    workspace = Workspace(
        name=f"{user_name or 'My'}'s Workspace",
        slug=slug,
        owner_id=user_id,
        type="personal",
    )
    db.add(workspace)
    db.flush()

    # Create default spaces
    online_space = Space(
        workspace_id=workspace.id,
        name="Online Space",
        type=SpaceType.ONLINE,
        is_default=True,
        sort_order=0,
        created_by=user_id,
    )
    offline_space = Space(
        workspace_id=workspace.id,
        name="Offline Space",
        type=SpaceType.OFFLINE,
        is_default=True,
        sort_order=1,
        created_by=user_id,
    )
    db.add(online_space)
    db.add(offline_space)
    db.commit()
    db.refresh(workspace)
    return workspace


def get_or_create_personal_workspace(db: Session, user_id: UUID, user_name: str) -> Workspace:
    """Get or auto-create the user's personal workspace."""
    workspace = get_user_personal_workspace(db, user_id)
    if workspace:
        return workspace
    return create_personal_workspace(db, user_id, user_name)


# ── Spaces ──

def list_spaces(db: Session, workspace_id: UUID) -> list[Space]:
    return db.query(Space).filter(
        Space.workspace_id == workspace_id,
        Space.deleted_at.is_(None),
    ).order_by(Space.sort_order).all()


def get_space(db: Session, space_id: UUID) -> Space | None:
    return db.query(Space).filter(
        Space.id == space_id,
        Space.deleted_at.is_(None),
    ).first()


# ── Pages ──

def create_page(db: Session, data: PageCreate, workspace_id: UUID, user_id: UUID) -> Page:
    # Calculate sort order
    siblings_count = db.query(Page).filter(
        Page.space_id == data.space_id,
        Page.parent_id == data.parent_id,
        Page.deleted_at.is_(None),
    ).count()

    page = Page(
        workspace_id=workspace_id,
        space_id=data.space_id,
        parent_id=data.parent_id,
        title=data.title,
        icon=data.icon,
        content=data.content,
        page_type=data.page_type,
        is_folder=data.is_folder,
        sort_order=siblings_count,
        created_by=user_id,
        last_edited_by=user_id,
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


def get_page(db: Session, page_id: UUID) -> Page | None:
    return db.query(Page).filter(
        Page.id == page_id,
        Page.deleted_at.is_(None),
    ).first()


def list_pages(
    db: Session,
    workspace_id: UUID,
    space_id: UUID | None = None,
    parent_id: UUID | None = None,
) -> list[Page]:
    """List pages, optionally filtered by space and/or parent."""
    query = db.query(Page).filter(
        Page.workspace_id == workspace_id,
        Page.deleted_at.is_(None),
    )
    if space_id is not None:
        query = query.filter(Page.space_id == space_id)
    if parent_id is not None:
        query = query.filter(Page.parent_id == parent_id)
    else:
        # If no parent specified, get root-level pages
        query = query.filter(Page.parent_id.is_(None))
    return query.order_by(Page.sort_order).all()


def list_all_pages_in_space(db: Session, workspace_id: UUID, space_id: UUID) -> list[Page]:
    """List ALL pages in a space (for building the full tree on the frontend)."""
    return db.query(Page).filter(
        Page.workspace_id == workspace_id,
        Page.space_id == space_id,
        Page.deleted_at.is_(None),
    ).order_by(Page.sort_order).all()


def update_page(db: Session, page: Page, data: PageUpdate, user_id: UUID) -> Page:
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(page, key, value)
    page.last_edited_by = user_id
    page.version += 1
    db.commit()
    db.refresh(page)
    return page


def delete_page(db: Session, page: Page) -> None:
    """Soft delete a page."""
    from datetime import datetime
    page.deleted_at = datetime.utcnow()
    db.commit()


def move_page(db: Session, page: Page, new_parent_id: UUID | None, new_space_id: UUID | None = None) -> Page:
    page.parent_id = new_parent_id
    if new_space_id:
        page.space_id = new_space_id
    db.commit()
    db.refresh(page)
    return page
