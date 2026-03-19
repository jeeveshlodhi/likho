"""
AI feature endpoints — P0: Write Assist, Auto-tagging
                      P1: Meeting Intelligence, Temp Note Classification, Health Report
                      P2: AI Link Suggestions, Workspace RAG, Note Digest, Journal Insights
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import get_current_active_user
from app.core.database import get_db
from app.dependencies.rate_limit import rate_limit_ai
from app.modules.users.models import User
from sqlalchemy.orm import Session

from .schemas import (
    WriteAssistRequest,
    WriteAssistResponse,
    SuggestTagsRequest,
    SuggestTagsResponse,
    MeetingExtractRequest,
    MeetingExtractResponse,
    ClassifyTempNoteRequest,
    ClassifyTempNoteResponse,
    HealthReportResponse,
    SuggestLinksRequest,
    SuggestLinksResponse,
    RagQueryRequest,
    RagQueryResponse,
    DigestRequest,
    DigestResponse,
    JournalInsightsResponse,
    PlanProjectRequest,
    PlanProjectResponse,
    JournalSummaryRequest,
    JournalSummaryResponse,
)
from . import service

router = APIRouter()


# ── Write Assist ──────────────────────────────────────────────────────────────


@router.post("/write-assist", response_model=WriteAssistResponse)
async def write_assist(
    req: WriteAssistRequest,
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_ai),
):
    """Cloud AI writing assistance — improve, expand, summarise, continue, etc."""
    try:
        return await service.write_assist(
            action=req.action,
            content=req.content,
            selection=req.selection,
            page_type=req.page_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ── Auto-tagging ──────────────────────────────────────────────────────────────


@router.post("/suggest-tags", response_model=SuggestTagsResponse)
async def suggest_tags(
    req: SuggestTagsRequest,
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_ai),
):
    """Suggest semantic tags for a note using Claude."""
    try:
        return await service.suggest_tags(
            title=req.title,
            content=req.content,
            existing_tags=req.existing_tags,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ── Meeting Intelligence ──────────────────────────────────────────────────────


@router.post("/meeting-extract", response_model=MeetingExtractResponse)
async def meeting_extract(
    req: MeetingExtractRequest,
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_ai),
):
    """Extract structured insights from meeting notes."""
    try:
        return await service.meeting_extract(
            content=req.content,
            title=req.title,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ── Temp Note Cloud Classification ───────────────────────────────────────────


@router.post("/classify-temp-note", response_model=ClassifyTempNoteResponse)
async def classify_temp_note(
    req: ClassifyTempNoteRequest,
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_ai),
):
    """Classify a temp note using a stronger cloud model."""
    try:
        return await service.classify_temp_note(
            content=req.content,
            existing_folders=req.existing_folders,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ── Note Health Report ────────────────────────────────────────────────────────


@router.get("/health-report", response_model=HealthReportResponse)
def health_report(
    workspace_id: str = Query(..., description="Workspace UUID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_ai),
):
    """Rule-based workspace health scan — stale, orphan, incomplete pages."""
    try:
        return service.health_report(workspace_id=workspace_id, db=db)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ── AI Link Suggestions ───────────────────────────────────────────────────────


@router.post("/suggest-links", response_model=SuggestLinksResponse)
async def suggest_links(
    req: SuggestLinksRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_ai),
):
    """Suggest related notes to link from the current note using Claude."""
    try:
        return await service.suggest_links(
            title=req.title,
            content=req.content,
            workspace_id=req.workspace_id,
            current_page_id=req.current_page_id,
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ── Workspace RAG Q&A ─────────────────────────────────────────────────────────


@router.post("/rag-query", response_model=RagQueryResponse)
async def rag_query(
    req: RagQueryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_ai),
):
    """Answer a question grounded in the user's workspace notes."""
    try:
        return await service.rag_query(
            workspace_id=req.workspace_id,
            question=req.question,
            top_k=req.top_k,
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ── Note Digest ───────────────────────────────────────────────────────────────


@router.post("/digest", response_model=DigestResponse)
async def generate_digest(
    req: DigestRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_ai),
):
    """Generate a digest summary of recent workspace activity."""
    try:
        return await service.generate_digest(
            workspace_id=req.workspace_id,
            period=req.period,
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ── Journal Insights ──────────────────────────────────────────────────────────


@router.get("/journal-insights", response_model=JournalInsightsResponse)
async def journal_insights(
    workspace_id: str = Query(..., description="Workspace UUID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _: None = Depends(rate_limit_ai),
):
    """Analyse journal entries — themes, sentiment trend, reflection prompt."""
    try:
        return await service.journal_insights(
            workspace_id=workspace_id,
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ── Project Planning ───────────────────────────────────────────────────────────


@router.post("/plan-project", response_model=PlanProjectResponse)
async def plan_project(
    req: PlanProjectRequest,
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_ai),
):
    """AI-generated project plan: milestones, tasks, and timeline from project context."""
    try:
        return await service.plan_project(title=req.title, context=req.context)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ── Journal Summary ────────────────────────────────────────────────────────────


@router.post("/journal-summary", response_model=JournalSummaryResponse)
async def journal_summary(
    req: JournalSummaryRequest,
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(rate_limit_ai),
):
    """Summarise a single journal entry — mood insight, productivity, tomorrow suggestions."""
    try:
        return await service.journal_summary(
            content=req.content,
            date=req.date,
            title=req.title,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
