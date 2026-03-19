from typing import List, Optional, Any, Dict, Literal
from pydantic import BaseModel, Field


class OnboardingCompleteRequest(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    username: Optional[str] = Field(None, max_length=50)
    intent: List[str] = Field(default_factory=list, max_length=20)
    dev_tasks: List[str] = Field(default_factory=list, max_length=20)
    team_size: Optional[str] = Field(None, max_length=50)
    source: Optional[str] = Field(None, max_length=100)
    workspace_mode: Literal["blank", "template", "ai"] = "blank"
    workspace_prompt: Optional[str] = Field(None, max_length=1000)
    default_space: Literal["online", "offline"] = "online"
    sync_mode: Literal["auto"] = "auto"


class WorkspaceGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)


class GeneratedFolder(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None


class GeneratedNote(BaseModel):
    title: str
    folder: Optional[str] = None
    content: Optional[str] = None


class WorkspaceGenerateResponse(BaseModel):
    folders: List[GeneratedFolder] = []
    notes: List[GeneratedNote] = []
    templates: List[str] = []
    summary: Optional[str] = None
