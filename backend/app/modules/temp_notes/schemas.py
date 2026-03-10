from pydantic import BaseModel
from datetime import datetime


class TempNoteCreate(BaseModel):
    id: str | None = None  # client-generated nanoid (for idempotent sync)
    content: str
    expires_at: datetime
    is_permanent: bool = False
    suggested_folder: str | None = None
    ai_confidence: str | None = None
    tags: list[str] = []


class TempNoteUpdate(BaseModel):
    content: str | None = None
    is_permanent: bool | None = None
    suggested_folder: str | None = None
    ai_confidence: str | None = None
    tags: list[str] | None = None


class TempNoteOut(BaseModel):
    id: str
    content: str
    expires_at: datetime
    is_permanent: bool
    suggested_folder: str | None
    ai_confidence: str | None
    tags: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}
