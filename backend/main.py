"""
Application entry point. Run with: uvicorn main:app --reload (from backend/)
"""
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.modules.users.router import router as users_router
from app.modules.auth.router import router as auth_router
from app.modules.workspaces.router import workspace_router, pages_router
from app.modules.sharing.router import router as sharing_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(workspace_router, prefix=f"{settings.API_V1_STR}/workspaces", tags=["workspaces"])
app.include_router(pages_router, prefix=f"{settings.API_V1_STR}/pages", tags=["pages"])
app.include_router(sharing_router, prefix=f"{settings.API_V1_STR}", tags=["sharing"])


@app.get("/")
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}


# ── WebSocket for Yjs collaboration ──
from app.modules.collaboration.ws import collab_websocket  # noqa: E402


@app.websocket("/ws/collab/{page_id}")
async def websocket_collab(websocket: WebSocket, page_id: str):
    await collab_websocket(websocket, page_id)
