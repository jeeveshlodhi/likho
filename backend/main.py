"""
Application entry point. Run with: uvicorn main:app --reload (from backend/)
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.core.redis.client import close_redis
from app.core.rate_limiter import close_rate_limiter
from app.exceptions.rate_limit import setup_rate_limit_exception_handler
from app.middleware.rate_limit import RateLimitMiddleware
from app.modules.users.router import router as users_router
from app.modules.auth.router import router as auth_router
from app.modules.workspaces.router import workspace_router, pages_router
from app.modules.sharing.router import router as sharing_router
from app.modules.collaboration.router import router as collaboration_router
from app.modules.ai.router import router as ai_router
from app.modules.temp_notes.router import router as temp_notes_router
from app.modules.remote_config.router import public_router as remote_config_public_router
from app.modules.remote_config.router import admin_router as remote_config_admin_router
from app.modules.notifications.router import router as notifications_router
from app.modules.temp_notes import models as _temp_notes_models  # noqa: F401 — register model
from app.modules.remote_config import models as _remote_config_models  # noqa: F401 — register model
from app.modules.feedback import models as _feedback_models  # noqa: F401 — register model
from app.modules.notifications import models as _notifications_models  # noqa: F401 — register model
from app.modules.feedback.router import router as feedback_router
from app.api.routes import health as health_router

# Create database tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup
    yield
    # Shutdown
    await close_redis()
    await close_rate_limiter()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Setup exception handlers
setup_rate_limit_exception_handler(app)

# Add CORS middleware (must be before rate limiting)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware using add_middleware with proper factory
# We need to use a different approach since RateLimitMiddleware takes app in __init__
# Create the middleware with default settings

# Default exclusions for health checks and static files
excluded_paths = {"/", "/health", "/health/", "/health/live", "/health/ready"}
excluded_prefixes = ["/health/", "/static/", "/docs", "/openapi.json", "/redoc"]

default_requests = getattr(settings, "RATE_LIMIT_DEFAULT_REQUESTS", 100)
default_window = getattr(settings, "RATE_LIMIT_DEFAULT_WINDOW", 60)

# Create and add the middleware
# Note: We need to use the middleware differently since BaseHTTPMiddleware
# expects the app in __init__ but FastAPI's add_middleware doesn't pass it
# So we manually wrap the app

# API Routers - these must be added BEFORE middleware wrapping
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(workspace_router, prefix=f"{settings.API_V1_STR}/workspaces", tags=["workspaces"])
app.include_router(pages_router, prefix=f"{settings.API_V1_STR}/pages", tags=["pages"])
app.include_router(sharing_router, prefix=f"{settings.API_V1_STR}", tags=["sharing"])
app.include_router(collaboration_router, prefix=f"{settings.API_V1_STR}", tags=["collaboration"])
app.include_router(ai_router, prefix=f"{settings.API_V1_STR}/ai", tags=["ai"])
app.include_router(temp_notes_router, prefix=f"{settings.API_V1_STR}/temp-notes", tags=["temp-notes"])
app.include_router(remote_config_public_router, prefix=f"{settings.API_V1_STR}", tags=["remote-config"])
app.include_router(remote_config_admin_router, prefix=f"{settings.API_V1_STR}", tags=["remote-config-admin"])
app.include_router(feedback_router, prefix=f"{settings.API_V1_STR}", tags=["feedback"])
app.include_router(notifications_router, prefix=f"{settings.API_V1_STR}", tags=["notifications"])
app.include_router(health_router.router, tags=["health"])


@app.get("/")
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}


# ── WebSocket for Yjs collaboration ──
from app.modules.collaboration.ws_v2 import collab_websocket_v2  # noqa: E402


@app.websocket("/ws/collab/{page_id}")
async def websocket_collab(websocket: WebSocket, page_id: str):
    """WebSocket endpoint for real-time Yjs collaboration."""
    await collab_websocket_v2(websocket, page_id)


# Wrap the app with rate limiting middleware AFTER all routes are registered
# This is done by replacing the app with the middleware-wrapped version
# But we keep a reference to the original FastAPI app for any future route additions

# Import the ASGI app
original_app = app

# Create the rate limiting middleware wrapping the original app
rate_limit_middleware = RateLimitMiddleware(
    app=original_app,
    default_requests=default_requests,
    default_window=default_window,
    excluded_paths=list(excluded_paths),
    excluded_prefixes=excluded_prefixes,
)

# Replace the app module-level reference with the middleware
# The middleware is callable (ASGI app) so it will handle requests
app = rate_limit_middleware
