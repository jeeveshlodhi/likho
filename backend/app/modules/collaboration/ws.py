"""
WebSocket handler for Yjs real-time collaboration.

This implements a simple Yjs relay server:
- Each page_id is a "room"
- Clients connect with their JWT token
- Yjs binary updates are broadcast to all other clients in the room
- When the last client leaves, the accumulated state is persisted to PostgreSQL
- When the first client joins, persisted state is loaded and sent as initial sync
"""
import logging
from uuid import UUID

from fastapi import WebSocket, WebSocketDisconnect
import jwt

from app.core.config import settings
from app.core.security import ALGORITHM
from app.core.database import SessionLocal
from app.modules.users.models import User
from app.modules.sharing.crud import check_access
from app.modules.collaboration.models import YjsDocument

logger = logging.getLogger(__name__)

# In-memory room management: page_id -> set of connected websockets
rooms: dict[str, set[WebSocket]] = {}


def authenticate_ws(token: str) -> UUID | None:
    """Verify JWT token and return user_id, or None if invalid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        return UUID(user_id) if user_id else None
    except (jwt.InvalidTokenError, ValueError):
        return None


def load_yjs_state(page_id: str) -> bytes | None:
    """Load persisted Yjs state from the database."""
    db = SessionLocal()
    try:
        doc = db.query(YjsDocument).filter(
            YjsDocument.page_id == page_id
        ).first()
        return doc.yjs_state if doc else None
    finally:
        db.close()


def save_yjs_state(page_id: str, state: bytes) -> None:
    """Persist Yjs state to the database."""
    db = SessionLocal()
    try:
        doc = db.query(YjsDocument).filter(
            YjsDocument.page_id == page_id
        ).first()
        if doc:
            doc.yjs_state = state
        else:
            doc = YjsDocument(page_id=page_id, yjs_state=state)
            db.add(doc)
        db.commit()
    finally:
        db.close()


# Track accumulated updates per room for persistence
room_updates: dict[str, list[bytes]] = {}


async def collab_websocket(websocket: WebSocket, page_id: str):
    """
    Handle a WebSocket connection for Yjs collaboration on a page.

    Protocol:
    - Client sends JWT token as query param: ?token=xxx
    - Server verifies auth and page access
    - Binary messages are Yjs updates, relayed to all other clients
    - On disconnect, if room is empty, persist state
    """
    token = websocket.query_params.get("token", "")
    user_id = authenticate_ws(token)

    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Check page access
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=4001, reason="User not found")
            return
        has_access = check_access(db, user_id, UUID(page_id), "viewer")
        if not has_access:
            await websocket.close(code=4003, reason="No access to this page")
            return
    finally:
        db.close()

    await websocket.accept()

    # Join room
    room_key = page_id
    if room_key not in rooms:
        rooms[room_key] = set()
        room_updates[room_key] = []

    rooms[room_key].add(websocket)
    logger.info(f"User {user_id} joined room {page_id}. Room size: {len(rooms[room_key])}")

    # Send persisted state to the new client
    if len(rooms[room_key]) == 1:
        # First client — load from DB
        state = load_yjs_state(page_id)
        if state:
            try:
                await websocket.send_bytes(state)
            except Exception:
                pass

    try:
        while True:
            # Receive Yjs binary update from client
            data = await websocket.receive_bytes()

            # Track updates for persistence
            if room_key in room_updates:
                room_updates[room_key].append(data)

            # Broadcast to all OTHER clients in the room
            disconnected = set()
            for client in rooms.get(room_key, set()):
                if client != websocket:
                    try:
                        await client.send_bytes(data)
                    except Exception:
                        disconnected.add(client)

            # Clean up disconnected clients
            for client in disconnected:
                rooms[room_key].discard(client)

    except WebSocketDisconnect:
        logger.info(f"User {user_id} left room {page_id}")
    except Exception as e:
        logger.error(f"WebSocket error in room {page_id}: {e}")
    finally:
        # Leave room
        if room_key in rooms:
            rooms[room_key].discard(websocket)

            # If room is now empty, persist accumulated state
            if len(rooms[room_key]) == 0:
                del rooms[room_key]
                # Save accumulated updates
                updates = room_updates.pop(room_key, [])
                if updates:
                    # Concatenate all updates as the state
                    # The client will send full state syncs that we can use
                    combined = updates[-1] if updates else b""
                    if combined:
                        save_yjs_state(page_id, combined)
                        logger.info(f"Persisted Yjs state for page {page_id}")
