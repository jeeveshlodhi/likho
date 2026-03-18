from typing import List, Optional, Any, Dict
from pydantic import BaseModel


class OnboardingCompleteRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    intent: List[str] = []
    dev_tasks: List[str] = []
    team_size: Optional[str] = None
    source: Optional[str] = None
    workspace_mode: str = "blank"   # blank | template | ai
    workspace_prompt: Optional[str] = None
    default_space: str = "online"   # online | offline
    sync_mode: str = "auto"         # always auto (manual mode removed)


class WorkspaceGenerateRequest(BaseModel):
    prompt: str


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
