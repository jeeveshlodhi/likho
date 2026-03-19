from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal


class TempNoteCreate(BaseModel):
    id: str | None = Field(None, max_length=64)  # client-generated nanoid (for idempotent sync)
    content: str = Field(..., max_length=50000)
    expires_at: datetime
    is_permanent: bool = False
    suggested_folder: str | None = Field(None, max_length=200)
    ai_confidence: Literal["high", "medium", "low", "uncertain"] | None = None
    tags: list[str] = Field(default_factory=list, max_length=20)


class TempNoteUpdate(BaseModel):
    content: str | None = Field(None, max_length=50000)
    is_permanent: bool | None = None
    suggested_folder: str | None = Field(None, max_length=200)
    ai_confidence: Literal["high", "medium", "low", "uncertain"] | None = None
    tags: list[str] | None = Field(None, max_length=20)


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
