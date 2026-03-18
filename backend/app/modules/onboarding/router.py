"""
Onboarding module — handles post-signup wizard data collection and
AI-powered workspace generation.
"""
import json
import os
import re
from datetime import datetime, timezone
from typing import Any

import anthropic
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.modules.users.models import User, UserPreference
from app.modules.onboarding.schemas import (
    OnboardingCompleteRequest,
    WorkspaceGenerateRequest,
    WorkspaceGenerateResponse,
    GeneratedFolder,
    GeneratedNote,
)

router = APIRouter()

MODEL = "claude-haiku-4-5-20251001"

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY is not configured.")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def _strip_fences(raw: str) -> str:
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


def _upsert_preference(db: Session, user_id: Any, key: str, value: str) -> None:
    pref = db.query(UserPreference).filter(
        UserPreference.user_id == user_id,
        UserPreference.key == key,
    ).first()
    if pref:
        pref.value = value
    else:
        db.add(UserPreference(user_id=user_id, key=key, value=value))


@router.post("/complete", status_code=status.HTTP_200_OK)
def complete_onboarding(
    body: OnboardingCompleteRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Store onboarding wizard data and mark the user as onboarded.
    Idempotent — can be called again to update preferences.
    """
    # Update profile fields if provided
    if body.full_name:
        current_user.full_name = body.full_name
    if body.username:
        # Only set if not already taken
        existing = db.query(User).filter(
            User.username == body.username,
            User.id != current_user.id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username is already taken.",
            )
        current_user.username = body.username

    # Persist onboarding metadata as user preferences (KV store).
    # All values must be valid JSON because user_preferences.value is JSONB.
    prefs: dict[str, str] = {
        "onboarding_intent":           json.dumps(body.intent),
        "onboarding_dev_tasks":        json.dumps(body.dev_tasks),
        "onboarding_team_size":        json.dumps(body.team_size or ""),
        "onboarding_source":           json.dumps(body.source or ""),
        "onboarding_workspace_mode":   json.dumps(body.workspace_mode),
        "onboarding_workspace_prompt": json.dumps(body.workspace_prompt or ""),
        "onboarding_default_space":    json.dumps(body.default_space),
        "onboarding_sync_mode":        json.dumps("auto"),  # always auto
    }
    for key, value in prefs.items():
        _upsert_preference(db, current_user.id, key, value)

    # Mark user as onboarded
    current_user.onboarded_at = datetime.now(timezone.utc)

    db.commit()
    return {"success": True, "onboarded_at": current_user.onboarded_at.isoformat()}


@router.post("/generate-workspace", response_model=WorkspaceGenerateResponse)
def generate_workspace(
    body: WorkspaceGenerateRequest,
    current_user: User = Depends(get_current_active_user),
):
    """
    Use Claude to generate a personalized folder + note structure
    based on the user's natural-language description.
    Falls back to a sensible default if AI is unavailable.
    """
    if not body.prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Prompt cannot be empty.",
        )

    system_prompt = """You are a workspace architect for a note-taking app called Likho.
Given the user's description, generate a practical, well-organized workspace structure.

Return ONLY valid JSON with this exact shape:
{
  "folders": [
    {"name": "string", "description": "string", "icon": "string (emoji)"}
  ],
  "notes": [
    {"title": "string", "folder": "folder name it belongs to", "content": "brief starter content"}
  ],
  "templates": ["template name 1", "template name 2"],
  "summary": "One sentence describing the workspace"
}

Rules:
- 3-6 folders maximum
- 4-8 starter notes spread across folders
- 2-3 template suggestions
- Keep names concise and actionable
- Icons should be single emoji characters"""

    try:
        client = _get_client()
        message = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": f"Create a workspace for: {body.prompt}",
                }
            ],
        )
        raw = _strip_fences(message.content[0].text)
        parsed = json.loads(raw)

        folders = [GeneratedFolder(**f) for f in parsed.get("folders", [])]
        notes = [GeneratedNote(**n) for n in parsed.get("notes", [])]
        templates = parsed.get("templates", [])
        summary = parsed.get("summary")

        return WorkspaceGenerateResponse(
            folders=folders,
            notes=notes,
            templates=templates,
            summary=summary,
        )

    except Exception:
        # Graceful fallback — return a sensible default structure
        return WorkspaceGenerateResponse(
            folders=[
                GeneratedFolder(name="Notes", description="General notes", icon="📝"),
                GeneratedFolder(name="Projects", description="Active projects", icon="🚀"),
                GeneratedFolder(name="Resources", description="Reference material", icon="📚"),
            ],
            notes=[
                GeneratedNote(title="Welcome", folder="Notes", content="# Welcome\nStart writing here."),
                GeneratedNote(title="Project Overview", folder="Projects", content="# Project Overview"),
            ],
            templates=["Meeting Notes", "Daily Journal", "Project Brief"],
            summary="Your personal workspace, ready to go.",
        )
