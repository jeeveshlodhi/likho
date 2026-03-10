"""Cloud temp notes CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.deps import get_current_active_user
from app.core.database import get_db
from app.modules.users.models import User

from . import crud
from .schemas import TempNoteCreate, TempNoteUpdate, TempNoteOut

router = APIRouter()


@router.get("/", response_model=list[TempNoteOut])
def list_notes(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List all temp notes for the current user."""
    return crud.list_user_notes(db, current_user.id)


@router.post("/", response_model=TempNoteOut, status_code=status.HTTP_201_CREATED)
def create_or_sync_note(
    data: TempNoteCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create or upsert a temp note (idempotent — safe to call on sync)."""
    return crud.upsert_note(db, data, current_user.id)


@router.patch("/{note_id}", response_model=TempNoteOut)
def update_note(
    note_id: str,
    data: TempNoteUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    note = crud.get_note(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return crud.update_note(db, note, data)


@router.patch("/{note_id}/keep", response_model=TempNoteOut)
def keep_note(
    note_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Mark a temp note as permanent (keep it)."""
    note = crud.get_note(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return crud.update_note(db, note, TempNoteUpdate(is_permanent=True))


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    note = crud.get_note(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    crud.delete_note(db, note)


@router.delete("/", status_code=status.HTTP_200_OK)
def purge_expired(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete all expired non-permanent temp notes for the current user."""
    count = crud.purge_expired(db, current_user.id)
    return {"deleted": count}
