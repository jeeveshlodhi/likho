"""CRUD for cloud temp notes."""
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from .models import TempNote
from .schemas import TempNoteCreate, TempNoteUpdate


def list_user_notes(db: Session, user_id: UUID) -> list[TempNote]:
    return (
        db.query(TempNote)
        .filter(TempNote.user_id == user_id)
        .order_by(TempNote.created_at.desc())
        .all()
    )


def get_note(db: Session, note_id: str, user_id: UUID) -> TempNote | None:
    return (
        db.query(TempNote)
        .filter(TempNote.id == note_id, TempNote.user_id == user_id)
        .first()
    )


def create_note(db: Session, data: TempNoteCreate, user_id: UUID) -> TempNote:
    import uuid as uuid_mod
    note = TempNote(
        id=data.id or str(uuid_mod.uuid4()),
        user_id=user_id,
        content=data.content,
        expires_at=data.expires_at,
        is_permanent=data.is_permanent,
        suggested_folder=data.suggested_folder,
        ai_confidence=data.ai_confidence,
        tags=data.tags,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def upsert_note(db: Session, data: TempNoteCreate, user_id: UUID) -> TempNote:
    """Create or update a note (idempotent sync)."""
    if data.id:
        existing = get_note(db, data.id, user_id)
        if existing:
            existing.content = data.content
            existing.expires_at = data.expires_at
            existing.is_permanent = data.is_permanent
            existing.suggested_folder = data.suggested_folder
            existing.ai_confidence = data.ai_confidence
            existing.tags = data.tags or []
            db.commit()
            db.refresh(existing)
            return existing
    return create_note(db, data, user_id)


def update_note(db: Session, note: TempNote, data: TempNoteUpdate) -> TempNote:
    if data.content is not None:
        note.content = data.content
    if data.is_permanent is not None:
        note.is_permanent = data.is_permanent
    if data.suggested_folder is not None:
        note.suggested_folder = data.suggested_folder
    if data.ai_confidence is not None:
        note.ai_confidence = data.ai_confidence
    if data.tags is not None:
        note.tags = data.tags
    db.commit()
    db.refresh(note)
    return note


def delete_note(db: Session, note: TempNote) -> None:
    db.delete(note)
    db.commit()


def purge_expired(db: Session, user_id: UUID) -> int:
    """Delete expired, non-permanent notes. Returns count deleted."""
    now = datetime.now(timezone.utc)
    result = (
        db.query(TempNote)
        .filter(
            TempNote.user_id == user_id,
            TempNote.is_permanent.is_(False),
            TempNote.expires_at < now,
        )
        .delete(synchronize_session=False)
    )
    db.commit()
    return result
