"""
Cloud AI service layer using Anthropic Claude.
Falls back gracefully when ANTHROPIC_API_KEY is not set.
"""
import json
import os
import re
from datetime import datetime, timezone, timedelta

import anthropic
from sqlalchemy.orm import Session

from .schemas import (
    WriteAction,
    WriteAssistResponse,
    TagSuggestion,
    SuggestTagsResponse,
    ActionItem,
    MeetingExtractResponse,
    ClassifyTempNoteResponse,
    HealthReportItem,
    HealthReportResponse,
    LinkSuggestion,
    SuggestLinksResponse,
    RagSource,
    RagQueryResponse,
    DigestResponse,
    JournalTheme,
    SentimentEntry,
    JournalInsightsResponse,
)

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY is not set. Add it to your .env file."
            )
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


MODEL = "claude-haiku-4-5-20251001"  # fast + cheap for these tasks


def _strip_fences(raw: str) -> str:
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


# ── Write Assist ──────────────────────────────────────────────────────────────

_WRITE_PROMPTS: dict[WriteAction, str] = {
    "improve": (
        "Improve the following text. Make it clearer, more concise, and better structured. "
        "Preserve the original meaning and tone. Return only the improved text, no commentary."
    ),
    "expand": (
        "Expand the following text into a more detailed, well-structured paragraph or section. "
        "Keep the same voice. Return only the expanded text."
    ),
    "summarize": (
        "Summarise the following text into 2–4 concise bullet points that capture the key ideas. "
        "Return only the bullet points."
    ),
    "continue": (
        "Continue writing from where the following text ends. Write 1–3 natural paragraphs "
        "that flow seamlessly. Return only the new text."
    ),
    "fix_grammar": (
        "Fix all grammar, spelling, and punctuation errors in the following text. "
        "Do not change the wording or meaning. Return only the corrected text."
    ),
    "formal": (
        "Rewrite the following text in a formal, professional tone. "
        "Keep the meaning intact. Return only the rewritten text."
    ),
    "casual": (
        "Rewrite the following text in a friendly, casual tone. "
        "Keep the meaning intact. Return only the rewritten text."
    ),
}


async def write_assist(
    action: WriteAction,
    content: str,
    selection: str | None,
    page_type: str,
) -> WriteAssistResponse:
    client = _get_client()
    system = _WRITE_PROMPTS[action]
    target = selection if selection and selection.strip() else content
    context = (
        f"\n\nNote context (full document):\n{content[:2000]}"
        if selection and selection.strip()
        else ""
    )

    message = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=system,
        messages=[
            {
                "role": "user",
                "content": f"{target}{context}",
            }
        ],
    )
    result = message.content[0].text.strip()
    return WriteAssistResponse(result=result, action=action)


# ── Auto-tagging ──────────────────────────────────────────────────────────────

_TAG_SYSTEM = """\
You are a note categorization assistant. Given a note title and body, return up to 6 concise tags \
that best describe the content. Each tag should be 1–3 words, lowercase, hyphenated if multi-word.

Respond ONLY with a JSON array, e.g.:
[{"label": "project-planning", "confidence": 0.95}, {"label": "meeting", "confidence": 0.88}]

Do not include any other text outside the JSON."""


async def suggest_tags(
    title: str, content: str, existing_tags: list[str]
) -> SuggestTagsResponse:
    client = _get_client()
    existing_hint = (
        f"\nAlready tagged: {', '.join(existing_tags)}" if existing_tags else ""
    )
    user_msg = f"Title: {title}\n\nContent:\n{content[:3000]}{existing_hint}"

    message = client.messages.create(
        model=MODEL,
        max_tokens=256,
        system=_TAG_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = _strip_fences(message.content[0].text)

    try:
        parsed = json.loads(raw)
        tags = [
            TagSuggestion(label=t["label"], confidence=t.get("confidence", 0.8))
            for t in parsed
            if isinstance(t, dict) and "label" in t
        ]
    except Exception:
        tags = []

    return SuggestTagsResponse(tags=tags)


# ── Meeting Intelligence ──────────────────────────────────────────────────────

_MEETING_SYSTEM = """\
You are a meeting notes analyst. Extract structured information from meeting notes.

Return ONLY a JSON object with this exact shape:
{
  "action_items": [{"text": "...", "assignee": "name or null", "due_date": "YYYY-MM-DD or null"}],
  "decisions": ["decision text"],
  "open_questions": ["question text"],
  "attendees": ["name"],
  "next_date": "YYYY-MM-DD or null"
}

Rules:
- action_items: concrete tasks with verbs (do, complete, send, etc.)
- decisions: things that were agreed upon / resolved
- open_questions: unresolved items or questions raised
- attendees: people mentioned as present or involved
- next_date: the date of the next meeting if mentioned
- Return empty arrays if nothing found in that category
- Do not include any text outside the JSON object."""


async def meeting_extract(
    content: str,
    title: str = "",
) -> MeetingExtractResponse:
    client = _get_client()
    user_msg = f"Meeting title: {title}\n\nNotes:\n{content[:4000]}" if title else f"Notes:\n{content[:4000]}"

    message = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=_MEETING_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = _strip_fences(message.content[0].text)

    try:
        parsed = json.loads(raw)
        action_items = [
            ActionItem(
                text=a.get("text", ""),
                assignee=a.get("assignee"),
                due_date=a.get("due_date"),
            )
            for a in parsed.get("action_items", [])
            if isinstance(a, dict) and a.get("text")
        ]
        return MeetingExtractResponse(
            action_items=action_items,
            decisions=[d for d in parsed.get("decisions", []) if isinstance(d, str)],
            open_questions=[q for q in parsed.get("open_questions", []) if isinstance(q, str)],
            attendees=[a for a in parsed.get("attendees", []) if isinstance(a, str)],
            next_date=parsed.get("next_date") or None,
        )
    except Exception:
        return MeetingExtractResponse()


# ── Temp Note Cloud Classification ───────────────────────────────────────────

_CLASSIFY_SYSTEM = """\
You are a note classification assistant. Given a short note, suggest the best folder and tags.

Return ONLY a JSON object:
{
  "folder": "folder name or null",
  "confidence": "high" | "medium" | "low" | "uncertain",
  "tags": ["tag1", "tag2"]
}

Confidence guide:
- high: content clearly belongs in one folder
- medium: likely match but some ambiguity
- low: weak signal, multiple folders possible
- uncertain: cannot determine folder

Common folder names: Work, Personal, Ideas, Research, Finance, Journal, Health, Learning

Do not include any text outside the JSON object."""


async def classify_temp_note(
    content: str,
    existing_folders: list[str],
) -> ClassifyTempNoteResponse:
    client = _get_client()
    folder_hint = (
        f"\nAvailable folders: {', '.join(existing_folders)}"
        if existing_folders
        else ""
    )
    user_msg = f"Note content:\n{content[:2000]}{folder_hint}"

    message = client.messages.create(
        model=MODEL,
        max_tokens=128,
        system=_CLASSIFY_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = _strip_fences(message.content[0].text)

    try:
        parsed = json.loads(raw)
        return ClassifyTempNoteResponse(
            folder=parsed.get("folder") or None,
            confidence=parsed.get("confidence", "uncertain"),
            tags=[t for t in parsed.get("tags", []) if isinstance(t, str)],
        )
    except Exception:
        return ClassifyTempNoteResponse(confidence="uncertain")


# ── Note Health Report ────────────────────────────────────────────────────────

def health_report(workspace_id: str, db: Session) -> HealthReportResponse:
    """
    Rule-based health scan — no Claude needed.
    Analyses all pages in the workspace for staleness, orphans, and incomplete content.
    """
    from app.modules.workspaces.models import Page

    import uuid as uuid_mod
    try:
        ws_uuid = uuid_mod.UUID(workspace_id)
    except ValueError:
        return HealthReportResponse()

    pages = (
        db.query(Page)
        .filter(
            Page.workspace_id == ws_uuid,
            Page.deleted_at.is_(None),
            Page.is_folder.is_(False),
        )
        .all()
    )

    now = datetime.now(timezone.utc)
    stale_cutoff = now - timedelta(days=30)

    # Build a set of all page titles for orphan detection (approximate)
    all_titles = {p.title.lower().strip() for p in pages if p.title}

    # Build a flat string of all content for backlink checking
    all_content_text: dict[str, str] = {}
    for p in pages:
        if p.content:
            try:
                # BlockNote JSON → extract text values
                content_str = json.dumps(p.content).lower()
            except Exception:
                content_str = ""
            all_content_text[str(p.id)] = content_str
        else:
            all_content_text[str(p.id)] = ""

    combined_content = " ".join(all_content_text.values())

    stale: list[HealthReportItem] = []
    orphans: list[HealthReportItem] = []
    incomplete: list[HealthReportItem] = []

    for page in pages:
        pid = str(page.id)
        updated = page.updated_at
        if updated and updated.tzinfo is None:
            updated = updated.replace(tzinfo=timezone.utc)

        updated_str = updated.isoformat() if updated else None

        # Stale: not updated in 30+ days
        if updated and updated < stale_cutoff:
            days_old = (now - updated).days
            stale.append(HealthReportItem(
                page_id=pid,
                title=page.title,
                reason=f"Not updated in {days_old} days",
                updated_at=updated_str,
            ))

        # Orphan: no other page references this page's title
        title_lower = page.title.lower().strip()
        if title_lower and title_lower not in combined_content.replace(
            all_content_text.get(pid, ""), "", 1
        ):
            orphans.append(HealthReportItem(
                page_id=pid,
                title=page.title,
                reason="No other page links to this note",
                updated_at=updated_str,
            ))

        # Incomplete: very short content relative to the title
        content_len = len(all_content_text.get(pid, ""))
        if content_len < 80:
            orphans_titles = {o.page_id for o in orphans}
            incomplete.append(HealthReportItem(
                page_id=pid,
                title=page.title,
                reason="Content is very short (likely empty or stub)",
                updated_at=updated_str,
            ))

    return HealthReportResponse(
        stale=stale,
        orphans=orphans,
        incomplete=incomplete,
        total_pages=len(pages),
    )


# ── Shared helpers ────────────────────────────────────────────────────────────

def _extract_text_from_blocknote(content: dict | list | None) -> str:
    """Recursively extract plain text from BlockNote JSONB."""
    if not content:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(_extract_text_from_blocknote(item) for item in content if item)
    if isinstance(content, dict):
        if content.get("type") == "text":
            return content.get("text", "")
        children = content.get("content", [])
        return _extract_text_from_blocknote(children)
    return ""


def _get_workspace_pages(workspace_id: str, db: Session):
    """Fetch all non-folder pages for a workspace (max 200)."""
    from app.modules.workspaces.models import Page
    import uuid as uuid_mod
    ws_uuid = uuid_mod.UUID(workspace_id)
    return (
        db.query(Page)
        .filter(
            Page.workspace_id == ws_uuid,
            Page.deleted_at.is_(None),
            Page.is_folder.is_(False),
        )
        .order_by(Page.updated_at.desc())
        .limit(200)
        .all()
    )


# ── AI Link Suggestions ───────────────────────────────────────────────────────

_LINKS_SYSTEM = """\
You are a knowledge-graph assistant. Given a note and a list of other notes in the workspace, \
identify which notes should be linked from the current note.

Return ONLY a JSON array of up to 5 suggestions:
[
  {
    "index": 0,
    "reason": "one sentence explaining the connection",
    "insert_text": "[[Note Title]]"
  }
]

Rules:
- Only suggest notes that are meaningfully related to the current note's topic
- Skip already-linked notes (those whose [[title]] already appears in the content)
- reason must be one concise sentence
- insert_text must be exactly [[Title]] using the note's real title
- If no strong connections exist, return an empty array []
- Do not include any text outside the JSON."""


async def suggest_links(
    title: str,
    content: str,
    workspace_id: str,
    current_page_id: str | None,
    db: Session,
) -> SuggestLinksResponse:
    client = _get_client()
    try:
        pages = _get_workspace_pages(workspace_id, db)
    except Exception:
        return SuggestLinksResponse()

    # Filter out the current page
    if current_page_id:
        import uuid as uuid_mod
        try:
            cur_uuid = uuid_mod.UUID(current_page_id)
            pages = [p for p in pages if p.id != cur_uuid]
        except ValueError:
            pass

    if not pages:
        return SuggestLinksResponse()

    # Build candidate list
    candidates = []
    for i, p in enumerate(pages[:80]):
        snippet = _extract_text_from_blocknote(p.content)[:150].replace("\n", " ")
        candidates.append(f"[{i}] Title: {p.title} | Snippet: {snippet}")

    candidates_text = "\n".join(candidates)
    user_msg = (
        f"Current note title: {title}\n\n"
        f"Current note content:\n{content[:1500]}\n\n"
        f"Candidate notes:\n{candidates_text}"
    )

    message = client.messages.create(
        model=MODEL,
        max_tokens=512,
        system=_LINKS_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = _strip_fences(message.content[0].text)

    try:
        parsed = json.loads(raw)
        suggestions = []
        for item in parsed:
            idx = item.get("index")
            if not isinstance(idx, int) or idx >= len(pages):
                continue
            page = pages[idx]
            suggestions.append(LinkSuggestion(
                target_page_id=str(page.id),
                title=page.title,
                reason=item.get("reason", ""),
                insert_text=item.get("insert_text", f"[[{page.title}]]"),
            ))
        return SuggestLinksResponse(suggestions=suggestions[:5])
    except Exception:
        return SuggestLinksResponse()


# ── Workspace RAG Q&A ─────────────────────────────────────────────────────────

_RAG_SYSTEM = """\
You are a workspace knowledge assistant. Answer the user's question using ONLY the provided notes. \
If the answer isn't in the notes, say "I couldn't find information about that in your notes."

Format your answer in clear, concise prose. After your answer, list the source notes you used.

Return ONLY a JSON object:
{
  "answer": "your answer here",
  "source_indices": [0, 2]
}

Do not include any text outside the JSON."""


async def rag_query(
    workspace_id: str,
    question: str,
    top_k: int,
    db: Session,
) -> RagQueryResponse:
    client = _get_client()
    try:
        pages = _get_workspace_pages(workspace_id, db)
    except Exception:
        return RagQueryResponse(answer="Unable to access workspace notes.")

    if not pages:
        return RagQueryResponse(answer="Your workspace has no notes yet.")

    # Score pages by keyword overlap with question
    q_words = set(re.sub(r'[^\w\s]', '', question.lower()).split())
    scored: list[tuple[int, object, str]] = []
    for p in pages:
        text = _extract_text_from_blocknote(p.content)
        p_words = set(re.sub(r'[^\w\s]', '', (p.title + " " + text).lower()).split())
        score = len(q_words & p_words)
        scored.append((score, p, text))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:max(top_k, 5)]

    context_parts = []
    for i, (_, p, text) in enumerate(top):
        context_parts.append(f"[{i}] {p.title}\n{text[:600]}")
    context = "\n\n---\n\n".join(context_parts)

    user_msg = f"Question: {question}\n\nNotes:\n{context}"

    message = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=_RAG_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = _strip_fences(message.content[0].text)

    try:
        parsed = json.loads(raw)
        answer = parsed.get("answer", "")
        sources = []
        for idx in parsed.get("source_indices", []):
            if isinstance(idx, int) and idx < len(top):
                _, p, text = top[idx]
                sources.append(RagSource(
                    page_id=str(p.id),
                    title=p.title,
                    excerpt=text[:200],
                ))
        return RagQueryResponse(answer=answer, sources=sources)
    except Exception:
        return RagQueryResponse(answer=message.content[0].text.strip())


# ── Note Digest ───────────────────────────────────────────────────────────────

_DIGEST_SYSTEM = """\
You are a knowledge management assistant. Create a digest summarising recent notes activity.

Return ONLY a JSON object:
{
  "summary": "2-3 sentence overview of recent activity",
  "themes": ["theme1", "theme2", "theme3"],
  "highlights": ["one notable note or insight", "another highlight"],
  "action_items": ["open task or follow-up from the notes"]
}

- themes: 3-5 recurring topics or keywords across the notes
- highlights: 2-4 specific interesting points or noteworthy notes
- action_items: concrete tasks or follow-ups mentioned in the notes
- Return empty arrays if nothing found for a category
- Do not include any text outside the JSON."""


async def generate_digest(
    workspace_id: str,
    period: str,
    db: Session,
) -> DigestResponse:
    client = _get_client()
    try:
        pages = _get_workspace_pages(workspace_id, db)
    except Exception:
        return DigestResponse(period=period, summary="Unable to access workspace.")

    days = 1 if period == "daily" else 7
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    recent_pages = []
    for p in pages:
        updated = p.updated_at
        if updated:
            if updated.tzinfo is None:
                updated = updated.replace(tzinfo=timezone.utc)
            if updated >= cutoff:
                recent_pages.append(p)

    if not recent_pages:
        return DigestResponse(
            period=period,
            summary=f"No notes were updated in the last {'day' if period == 'daily' else 'week'}.",
            page_count=0,
        )

    notes_text = []
    for p in recent_pages[:30]:
        text = _extract_text_from_blocknote(p.content)[:400]
        notes_text.append(f"Title: {p.title}\n{text}")

    user_msg = (
        f"Period: {period} (last {'1 day' if period == 'daily' else '7 days'})\n"
        f"Notes updated ({len(recent_pages)}):\n\n"
        + "\n---\n".join(notes_text)
    )

    message = client.messages.create(
        model=MODEL,
        max_tokens=768,
        system=_DIGEST_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = _strip_fences(message.content[0].text)

    try:
        parsed = json.loads(raw)
        return DigestResponse(
            period=period,
            summary=parsed.get("summary", ""),
            themes=parsed.get("themes", []),
            highlights=parsed.get("highlights", []),
            action_items=parsed.get("action_items", []),
            page_count=len(recent_pages),
        )
    except Exception:
        return DigestResponse(
            period=period,
            summary=message.content[0].text.strip(),
            page_count=len(recent_pages),
        )


# ── Journal Insights ──────────────────────────────────────────────────────────

_JOURNAL_SYSTEM = """\
You are a reflective journaling assistant. Analyse a collection of journal entries \
and identify patterns, themes, and emotional trends.

Return ONLY a JSON object:
{
  "themes": [{"label": "theme name", "count": 3}],
  "sentiment_trend": [
    {"date": "YYYY-MM-DD", "sentiment": "positive"|"neutral"|"negative", "note": "short reason"}
  ],
  "reflection_prompt": "A thoughtful question to prompt deeper reflection based on patterns found"
}

Rules:
- themes: up to 6 recurring topics/keywords, sorted by frequency
- sentiment_trend: one entry per journal entry analysed (use the note's date if available)
- reflection_prompt: one insightful question tailored to the patterns you found
- Do not include any text outside the JSON."""


async def journal_insights(
    workspace_id: str,
    db: Session,
) -> JournalInsightsResponse:
    client = _get_client()
    try:
        from app.modules.workspaces.models import Page
        import uuid as uuid_mod
        ws_uuid = uuid_mod.UUID(workspace_id)
        pages = (
            db.query(Page)
            .filter(
                Page.workspace_id == ws_uuid,
                Page.page_type == "journal",
                Page.deleted_at.is_(None),
                Page.is_folder.is_(False),
            )
            .order_by(Page.updated_at.desc())
            .limit(30)
            .all()
        )
    except Exception:
        return JournalInsightsResponse()

    if not pages:
        return JournalInsightsResponse(
            reflection_prompt="Start writing journal entries to unlock insights.",
        )

    entries = []
    for p in pages:
        text = _extract_text_from_blocknote(p.content)[:500]
        date_str = p.created_at.date().isoformat() if p.created_at else "unknown"
        entries.append(f"[{date_str}] {p.title}: {text}")

    user_msg = "Journal entries:\n\n" + "\n---\n".join(entries)

    message = client.messages.create(
        model=MODEL,
        max_tokens=768,
        system=_JOURNAL_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = _strip_fences(message.content[0].text)

    try:
        parsed = json.loads(raw)
        themes = [
            JournalTheme(label=t["label"], count=t.get("count", 1))
            for t in parsed.get("themes", [])
            if isinstance(t, dict) and t.get("label")
        ]
        sentiment_trend = [
            SentimentEntry(
                date=s.get("date", ""),
                sentiment=s.get("sentiment", "neutral"),
                note=s.get("note", ""),
            )
            for s in parsed.get("sentiment_trend", [])
            if isinstance(s, dict)
        ]
        return JournalInsightsResponse(
            themes=themes,
            sentiment_trend=sentiment_trend,
            reflection_prompt=parsed.get("reflection_prompt", ""),
            entry_count=len(pages),
        )
    except Exception:
        return JournalInsightsResponse(entry_count=len(pages))
