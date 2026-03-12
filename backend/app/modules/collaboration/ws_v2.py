"""
Enhanced WebSocket handler for Yjs real-time collaboration with:
- Proper permission enforcement (viewers cannot edit)
- Redis-based room management for horizontal scaling
- Periodic persistence
- Activity logging
- Rate limiting for connections and messages
"""
import asyncio
import json
import logging
import uuid
from enum import IntEnum
from typing import Optional
from datetime import datetime

import jwt
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import ALGORITHM
from app.core.database import SessionLocal
from app.core.redis.client import get_redis, RedisRoomManager
from app.modules.users.models import User
from app.modules.sharing.crud import get_user_page_permission
from app.modules.collaboration.models import YjsDocument, CollaborationSession, CollaborationLog
from app.dependencies.rate_limit import get_websocket_rate_limiter

logger = logging.getLogger(__name__)

# ── Yjs / y-websocket sync protocol helpers ───────────────────────────────────
# y-websocket frames every binary message as:
#   [MSG_SYNC(varint)] [syncSubtype(varint)] [payloadLen(varint)] [...payload]
# These helpers let the server extract pure Yjs update bytes from incoming
# messages and re-wrap them in the correct envelope when sending to new clients.
_MSG_SYNC = 0       # outer message type for all Yjs sync messages
_SYNC_STEP1 = 0     # client → server: "here is my state vector" (request only)
_SYNC_STEP2 = 1     # server → client: "here is what you're missing" (carries state)
_SYNC_UPDATE = 2    # bidirectional: incremental update (carries state)


def _read_varint(data: bytes, pos: int) -> tuple[int, int]:
    """Decode a lib0 variable-length uint. Returns (value, new_pos)."""
    result, shift = 0, 0
    while pos < len(data):
        b = data[pos]
        pos += 1
        result |= (b & 0x7F) << shift
        if not (b & 0x80):
            break
        shift += 7
    return result, pos


def _write_varint(n: int) -> bytes:
    """Encode an integer as a lib0 variable-length uint."""
    buf = bytearray()
    while n > 127:
        buf.append((n & 0x7F) | 0x80)
        n >>= 7
    buf.append(n)
    return bytes(buf)


def extract_yjs_update(raw_msg: bytes) -> bytes | None:
    """
    Extract the raw Yjs update bytes from a y-websocket binary message.

    Returns the payload bytes for SYNC_STEP2 and SYNC_UPDATE messages.
    Returns None for SYNC_STEP1 (state-vector requests carry no document state)
    and for awareness / unknown message types.
    """
    if len(raw_msg) < 2:
        return None
    pos = 0
    msg_type, pos = _read_varint(raw_msg, pos)
    if msg_type != _MSG_SYNC:
        return None  # e.g. awareness message — not a state-carrying sync message
    sync_type, pos = _read_varint(raw_msg, pos)
    if sync_type not in (_SYNC_STEP2, _SYNC_UPDATE):
        return None  # SYNC_STEP1 is a request, not state
    payload_len, pos = _read_varint(raw_msg, pos)
    return raw_msg[pos: pos + payload_len]


def make_sync_step2(update_bytes: bytes) -> bytes:
    """
    Wrap raw Yjs update bytes in a y-websocket sync step 2 envelope.

    This is what the server sends to a newly connected client so it receives
    the full document state in a format y-websocket knows how to apply.
    Format: [MSG_SYNC] [SYNC_STEP2] [varint(len)] [...update_bytes]
    """
    return bytes([_MSG_SYNC, _SYNC_STEP2]) + _write_varint(len(update_bytes)) + update_bytes


# ── End Yjs helpers ───────────────────────────────────────────────────────────

# Track active (accepted) WebSocket connections per IP — resets with every process restart.
# This is intentionally a plain dict (not Redis) so a server restart always clears it.
_active_ws_connections: dict[str, int] = {}
MAX_WS_CONNECTIONS_PER_IP = 10


class PermissionLevel(IntEnum):
    VIEWER = 0
    COMMENTER = 1
    EDITOR = 2
    ADMIN = 3
    OWNER = 4


class PermissionContext:
    """Holds permission information for a connection."""
    
    def __init__(self, user_id: uuid.UUID, level: PermissionLevel, role: str, is_synthetic: bool = False):
        self.user_id = user_id
        self.level = level
        self.role = role
        # True for share-token users whose UUID is not in the `users` table.
        # These users must not be written to FK-constrained DB columns.
        self.is_synthetic = is_synthetic
    
    @property
    def can_edit(self) -> bool:
        return self.level >= PermissionLevel.EDITOR
    
    @property
    def can_comment(self) -> bool:
        return self.level >= PermissionLevel.COMMENTER


def authenticate_ws(token: str) -> Optional[uuid.UUID]:
    """Verify JWT token and return user_id."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        return uuid.UUID(user_id) if user_id else None
    except (jwt.InvalidTokenError, ValueError):
        return None


def get_permission_level(role: str) -> PermissionLevel:
    """Convert role string to permission level."""
    role_map = {
        "viewer": PermissionLevel.VIEWER,
        "commenter": PermissionLevel.COMMENTER,
        "editor": PermissionLevel.EDITOR,
        "admin": PermissionLevel.ADMIN,
        "owner": PermissionLevel.OWNER,
    }
    return role_map.get(role.lower(), PermissionLevel.VIEWER)


def check_page_access(db: Session, user_id: uuid.UUID, page_id: uuid.UUID) -> tuple[bool, str]:
    """
    Check if user has access to page.
    Returns (has_access, role)
    """
    from app.modules.workspaces.models import Page, Workspace
    
    # Get page
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        return False, ""
    
    # Check if workspace owner
    workspace = db.query(Workspace).filter(Workspace.id == page.workspace_id).first()
    if workspace and workspace.owner_id == user_id:
        return True, "owner"
    
    # Check explicit permission
    perm = get_user_page_permission(db, user_id, page_id)
    if perm:
        return True, perm.role.value if hasattr(perm.role, "value") else str(perm.role)
    
    # No permission found
    return False, ""


class YjsRoom:
    """
    Manages a single document's collaboration room.
    Uses in-memory storage with Redis for cross-server sync.
    """
    
    def __init__(self, page_id: str, redis_manager: RedisRoomManager):
        self.page_id = page_id
        self.redis = redis_manager
        self.clients: dict[str, WebSocket] = {}  # connection_id -> websocket
        self.permissions: dict[str, PermissionContext] = {}  # connection_id -> permission
        self.lock = asyncio.Lock()
        self._persist_task: Optional[asyncio.Task] = None
        self._shutdown = False
        # Accumulates *pure* Yjs update bytes (no y-websocket protocol framing).
        # Populated by handle_update; flushed to DB by _persist_to_db.
        self._pending_update_bytes: list[bytes] = []
    
    async def start_persistence_task(self):
        """Start background persistence task."""
        if self._persist_task is None:
            self._persist_task = asyncio.create_task(self._periodic_persistence())
    
    async def stop_persistence_task(self):
        """Stop background persistence."""
        self._shutdown = True
        if self._persist_task:
            self._persist_task.cancel()
            try:
                await self._persist_task
            except asyncio.CancelledError:
                pass
            self._persist_task = None
    
    async def _periodic_persistence(self):
        """Persist state every 30 seconds."""
        while not self._shutdown:
            try:
                await asyncio.sleep(30)
                await self._persist_to_db()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Periodic persistence error: {e}")
    
    async def join(
        self, 
        websocket: WebSocket, 
        connection_id: str, 
        ctx: PermissionContext,
        user_agent: str | None = None,
        ip_address: str | None = None
    ) -> None:
        """Add client to room."""
        async with self.lock:
            self.clients[connection_id] = websocket
            self.permissions[connection_id] = ctx
            
            # Register in Redis (best-effort — in-process clients dict is authoritative)
            try:
                await self.redis.join_room(
                    self.page_id,
                    connection_id,
                    str(ctx.user_id),
                    ctx.role
                )
            except Exception as _redis_err:
                logger.warning(f"Redis join_room error (non-fatal): {_redis_err}")
            
            # Log session start — use None for synthetic share-token users
            # since their UUID doesn't exist in the `users` table.
            log_user_id = None if ctx.is_synthetic else ctx.user_id
            await self._log_activity(log_user_id, "join", {
                "connection_id": connection_id,
                "role": ctx.role,
                "can_edit": ctx.can_edit
            })
            
            # Record in database (skip for synthetic share-token users — their UUID
            # is not present in the `users` table, so the FK constraint would fail).
            if not ctx.is_synthetic:
                db = SessionLocal()
                try:
                    session = CollaborationSession(
                        page_id=uuid.UUID(self.page_id),
                        user_id=ctx.user_id,
                        client_id=connection_id,
                        connection_id=connection_id,
                        role=ctx.role,
                        can_edit=ctx.can_edit,
                        can_comment=ctx.can_comment,
                        ip_address=ip_address,
                        user_agent=user_agent
                    )
                    db.add(session)
                    db.commit()
                except Exception as e:
                    logger.error(f"Failed to record session: {e}")
                finally:
                    db.close()
        
        # Start persistence task if first client
        if len(self.clients) == 1:
            await self.start_persistence_task()
        
        logger.info(f"User {ctx.user_id} joined room {self.page_id} as {ctx.role}")
    
    async def leave(self, connection_id: str) -> int:
        """Remove client from room, return remaining clients."""
        async with self.lock:
            websocket = self.clients.pop(connection_id, None)
            ctx = self.permissions.pop(connection_id, None)
            
            # Update Redis (best-effort)
            try:
                remaining = await self.redis.leave_room(self.page_id, connection_id)
            except Exception as _redis_err:
                logger.warning(f"Redis leave_room error (non-fatal): {_redis_err}")
                remaining = len(self.clients)
            
            # Update database session
            if ctx:
                db = SessionLocal()
                try:
                    # Only look up / update DB session for real (non-synthetic) users.
                    if not ctx.is_synthetic:
                        session = db.query(CollaborationSession).filter(
                            CollaborationSession.connection_id == connection_id
                        ).first()
                        if session:
                            session.disconnected_at = datetime.utcnow()
                            db.commit()
                    
                    # Log leave — pass None for synthetic user IDs so the
                    # nullable FK column is used instead of a non-existent UUID.
                    log_user_id = None if ctx.is_synthetic else ctx.user_id
                    await self._log_activity(log_user_id, "leave", {
                        "connection_id": connection_id
                    }, db=db)
                except Exception as e:
                    logger.error(f"Failed to update session: {e}")
                finally:
                    db.close()
                
                logger.info(f"User {ctx.user_id} left room {self.page_id}")
            
            # If room empty, persist and cleanup
            if remaining == 0:
                await self.stop_persistence_task()
                await self._persist_to_db()
            
            return remaining
    
    async def handle_update(
        self, 
        connection_id: str, 
        update: bytes
    ) -> bool:
        """
        Handle incoming Yjs update with permission check.
        Returns True if update was processed.
        """
        async with self.lock:
            ctx = self.permissions.get(connection_id)
            if not ctx:
                logger.warning(f"Update from unknown connection: {connection_id}")
                return False
            
            # PERMISSION ENFORCEMENT: Only editors can send updates
            if not ctx.can_edit:
                logger.warning(
                    f"User {ctx.user_id} with role {ctx.role} attempted to edit without permission"
                )
                # Send error to client
                ws = self.clients.get(connection_id)
                if ws:
                    await ws.send_json({
                        "type": "permission_denied",
                        "code": "INSUFFICIENT_PERMISSION",
                        "message": f"Your role ({ctx.role}) does not have permission to edit. "
                                   f"Only editors, admins, and owners can modify this document."
                    })
                return False
            
            # Extract pure Yjs update bytes (strips y-websocket protocol framing)
            # and accumulate for persistence.  We only accumulate SYNC_UPDATE and
            # SYNC_STEP2 payloads — SYNC_STEP1 carries no document state.
            pure_bytes = extract_yjs_update(update)
            if pure_bytes:
                self._pending_update_bytes.append(pure_bytes)

            # Queue for Redis so other server instances can broadcast to their clients.
            # Non-fatal: if Redis is unavailable the in-process broadcast below still works.
            try:
                await self.redis.queue_update(self.page_id, update)
            except Exception as _redis_err:
                logger.warning(f"Redis queue error for page {self.page_id} (non-fatal): {_redis_err}")

            # Log edit (throttled) — use None for synthetic share-token users.
            if len(update) > 10:  # Skip tiny updates (cursor movements, etc)
                log_user_id = None if ctx.is_synthetic else ctx.user_id
                await self._log_activity(log_user_id, "edit", {
                    "update_size": len(update)
                })
        
        # Broadcast to other clients (outside lock for performance)
        await self._broadcast(update, exclude=connection_id)
        return True
    
    async def _broadcast(self, message: bytes, exclude: Optional[str] = None):
        """Broadcast message to all clients except excluded one."""
        # Snapshot to avoid RuntimeError if self.clients is modified at an await point
        clients_snapshot = list(self.clients.items())
        disconnected = []

        for conn_id, client in clients_snapshot:
            if conn_id == exclude:
                continue
            try:
                await client.send_bytes(message)
            except Exception:
                disconnected.append(conn_id)

        # Cleanup disconnected clients
        for conn_id in disconnected:
            await self.leave(conn_id)
    
    async def send_state_vector(self, connection_id: str, state: bytes):
        """Send initial state to new client."""
        ws = self.clients.get(connection_id)
        if ws:
            try:
                await ws.send_bytes(state)
            except Exception as e:
                logger.error(f"Failed to send state: {e}")
    
    async def _persist_to_db(self):
        """
        Persist accumulated Yjs update bytes to the database.

        We store *pure* Yjs update bytes (no y-websocket protocol framing).
        On next load, the stored bytes are wrapped in a sync step 2 envelope
        before being sent to connecting clients so y-websocket can parse them.

        Appending new bytes to existing state is valid: Yjs applies updates
        sequentially, so [old_state || new_update_1 || new_update_2 ...] is
        equivalent to applying each update in order to a Y.Doc.
        """
        if not self._pending_update_bytes:
            return

        # Drain the pending list before async DB work so concurrent calls
        # (periodic task + final flush on room close) don't double-persist.
        pending, self._pending_update_bytes = self._pending_update_bytes, []
        new_bytes = b"".join(pending)

        db = SessionLocal()
        try:
            doc = db.query(YjsDocument).filter(
                YjsDocument.page_id == self.page_id
            ).first()

            if doc:
                # Append new updates to existing state so nothing is lost.
                existing = doc.state_vector or b""
                doc.state_vector = existing + new_bytes
                doc.version = (doc.version or 0) + 1
                doc.client_count = len(self.clients)
            else:
                doc = YjsDocument(
                    page_id=uuid.UUID(self.page_id),
                    state_vector=new_bytes,
                    version=1,
                    client_count=len(self.clients),
                )
                db.add(doc)

            db.commit()
            logger.debug(
                f"Persisted {len(pending)} Yjs updates ({len(new_bytes)} bytes) "
                f"for page {self.page_id}"
            )
        except Exception as e:
            logger.error(f"Failed to persist Yjs state for page {self.page_id}: {e}")
            # Put the bytes back so they're not silently lost on transient DB errors.
            self._pending_update_bytes = pending + self._pending_update_bytes
        finally:
            db.close()
    
    async def _log_activity(
        self, 
        user_id: Optional[uuid.UUID], 
        action: str, 
        metadata: dict,
        db: Optional[Session] = None
    ):
        """Log collaboration activity.
        
        user_id may be None for anonymous/synthetic share-token users;
        the CollaborationLog.user_id column is nullable for exactly this reason.
        """
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True
        
        try:
            log = CollaborationLog(
                page_id=uuid.UUID(self.page_id),
                user_id=user_id,  # None is valid — column is nullable
                action=action,
                meta_data=metadata,
                update_size=metadata.get("update_size")
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log activity: {e}")
        finally:
            if should_close:
                db.close()


# In-memory room cache (per-process)
_rooms: dict[str, YjsRoom] = {}


async def get_or_create_room(page_id: str) -> YjsRoom:
    """Get existing room or create new one."""
    if page_id not in _rooms:
        redis = await get_redis()
        manager = RedisRoomManager(redis)
        _rooms[page_id] = YjsRoom(page_id, manager)
    return _rooms[page_id]


async def collab_websocket_v2(
    websocket: WebSocket,
    page_id: str,
    user_agent: Optional[str] = None
):
    """
    Enhanced WebSocket handler with permission enforcement and rate limiting.

    Supports two auth paths:
    1. JWT auth (authenticated users): ?token= or Authorization: Bearer header
    2. Share-token auth (anonymous editors): ?share_token= query param
       — validates the token against share_links, requires editor/admin/owner role

    Protocol:
    1. Client connects with auth credentials
    2. Server validates auth and page permissions
    3. Server sends current Yjs state vector
    4. Binary messages are Yjs updates (editors only)
    5. JSON messages are control messages (comments, awareness, etc)
    """
    # Get client IP
    client_ip = websocket.client.host if websocket.client else "unknown"
    forwarded_for = websocket.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()

    # Check active connection limit per IP using in-process tracking.
    current_connections = _active_ws_connections.get(client_ip, 0)
    if current_connections >= MAX_WS_CONNECTIONS_PER_IP:
        logger.warning(f"Too many active WebSocket connections for IP: {client_ip} ({current_connections})")
        await websocket.close(code=4008, reason="Too many connections from this IP")
        return

    # Message-rate limiter (only applies after connection is accepted)
    ws_rate_limiter = get_websocket_rate_limiter(
        max_connections=MAX_WS_CONNECTIONS_PER_IP,
        message_rate=200,
        window=60
    )

    ctx: Optional[PermissionContext] = None

    # ── Auth path 1: share_token (anonymous editor via share link) ────────────
    share_token = websocket.query_params.get("share_token", "")
    if share_token:
        from app.modules.sharing.crud import get_share_link as _get_share_link
        db = SessionLocal()
        try:
            link = _get_share_link(db, share_token)
            if not link:
                await websocket.close(code=4003, reason="Invalid or expired share link")
                return

            # Ensure the token actually grants access to this specific page
            if str(link.page_id) != page_id:
                await websocket.close(code=4003, reason="Share link does not match this page")
                return

            link_role = link.role.value if hasattr(link.role, "value") else str(link.role)
            if link_role not in ("editor", "admin", "owner"):
                await websocket.close(code=4003, reason="Share link does not grant edit access")
                return

            # Derive a deterministic synthetic user_id from the token so the
            # same link always maps to the same "user" in the room.
            synthetic_user_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"share_token:{share_token}")
            level = get_permission_level(link_role)
            ctx = PermissionContext(synthetic_user_id, level, link_role, is_synthetic=True)
            logger.info(f"Share-token auth for page {page_id}, role={link_role}")
        finally:
            db.close()

    # ── Auth path 2: JWT (authenticated users) ────────────────────────────────
    if ctx is None:
        token = ""
        auth_header = websocket.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
        else:
            token = websocket.query_params.get("token", "")

        user_id = authenticate_ws(token)
        if not user_id:
            await websocket.close(code=4001, reason="Invalid authentication")
            return

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                await websocket.close(code=4001, reason="User not found")
                return

            has_access, role = check_page_access(db, user_id, uuid.UUID(page_id))
            if not has_access:
                await websocket.close(code=4003, reason="Access denied to this page")
                return

            level = get_permission_level(role)
            ctx = PermissionContext(user_id, level, role)
        finally:
            db.close()
    
    # Accept connection
    await websocket.accept()
    _active_ws_connections[client_ip] = _active_ws_connections.get(client_ip, 0) + 1

    # Get room
    room = await get_or_create_room(page_id)
    connection_id = str(uuid.uuid4())
    
    # Join room
    await room.join(
        websocket, 
        connection_id, 
        ctx,
        user_agent=websocket.headers.get("user-agent"),
        ip_address=client_ip
    )
    
    # Send initial state if available.
    # The stored state_vector contains raw Yjs update bytes (no protocol framing).
    # We must wrap them in a sync step 2 envelope so y-websocket can parse them.
    db = SessionLocal()
    try:
        doc = db.query(YjsDocument).filter(YjsDocument.page_id == page_id).first()
        if doc and doc.state_vector:
            sync_msg = make_sync_step2(doc.state_vector)
            await room.send_state_vector(connection_id, sync_msg)
            logger.debug(
                f"Sent initial Yjs state ({len(doc.state_vector)} bytes) "
                f"to connection {connection_id} for page {page_id}"
            )
    finally:
        db.close()
    
    # Message loop
    try:
        while True:
            message = await websocket.receive()

            # raw receive() returns {"type": "websocket.disconnect"} instead of
            # raising WebSocketDisconnect.  Calling receive() again after that
            # raises RuntimeError, so we must break here explicitly.
            if message.get("type") == "websocket.disconnect":
                break

            # Rate limit: Check message rate
            if not await ws_rate_limiter.check_message_allowed(client_ip):
                logger.warning(f"WebSocket message rate limit exceeded for IP: {client_ip}")
                await websocket.send_json({
                    "type": "error",
                    "code": "RATE_LIMITED",
                    "message": "Too many messages. Please slow down."
                })
                continue
            
            if "bytes" in message:
                # Yjs binary update
                await room.handle_update(connection_id, message["bytes"])
                
            elif "text" in message:
                # JSON control message
                try:
                    data = json.loads(message["text"])
                    await handle_control_message(room, connection_id, ctx, data, websocket)
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "code": "INVALID_MESSAGE",
                        "message": "Invalid JSON"
                    })
                    
    except WebSocketDisconnect:
        logger.debug(f"Client {connection_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Decrement active connection count for this IP
        if client_ip in _active_ws_connections:
            _active_ws_connections[client_ip] = max(0, _active_ws_connections[client_ip] - 1)
            if _active_ws_connections[client_ip] == 0:
                del _active_ws_connections[client_ip]

        remaining = await room.leave(connection_id)
        if remaining == 0:
            # Cleanup room
            _rooms.pop(page_id, None)


async def handle_control_message(
    room: YjsRoom,
    connection_id: str,
    ctx: PermissionContext,
    data: dict,
    websocket: WebSocket
):
    """Handle non-Yjs control messages."""
    msg_type = data.get("type")
    
    if msg_type == "comment":
        # Commenters and above can add comments
        if not ctx.can_comment:
            await websocket.send_json({
                "type": "error",
                "code": "INSUFFICIENT_PERMISSION",
                "message": "You need commenter access to add comments"
            })
            return
        
        # Create comment via API
        await create_comment(room.page_id, ctx.user_id, data)
        
        # Notify other clients
        await room._broadcast(
            json.dumps({
                "type": "comment_added",
                "data": data
            }).encode(),
            exclude=connection_id
        )
        
    elif msg_type == "awareness":
        # Awareness updates allowed for all - broadcast to room
        await room._broadcast(
            json.dumps(data).encode(),
            exclude=connection_id
        )
        
    elif msg_type == "ping":
        await websocket.send_json({"type": "pong"})
        
    else:
        await websocket.send_json({
            "type": "error",
            "code": "UNKNOWN_MESSAGE_TYPE",
            "message": f"Unknown message type: {msg_type}"
        })


async def create_comment(page_id: str, user_id: uuid.UUID, data: dict):
    """Create a new comment."""
    from app.modules.collaboration.crud import create_comment as crud_create_comment
    
    db = SessionLocal()
    try:
        comment = crud_create_comment(
            db=db,
            page_id=uuid.UUID(page_id),
            author_id=user_id,
            content=data.get("content", {}),
            block_id=data.get("block_id"),
            parent_id=data.get("parent_id"),
            yjs_mark_id=data.get("yjs_mark_id")
        )
        return comment
    finally:
        db.close()
