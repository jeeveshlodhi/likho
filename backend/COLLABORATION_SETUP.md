# Collaboration System Setup Guide

## Overview

The enhanced collaboration system provides:
- **Real-time editing** with Yjs CRDT
- **Permission enforcement** (viewers cannot edit)
- **Role-based access** (viewer, commenter, editor, admin, owner)
- **Comments** with threading
- **Redis-backed** room management for horizontal scaling
- **Activity logging** for audit trails

## Prerequisites

1. **PostgreSQL** - For data persistence
2. **Redis** - For cross-server room management

### Installing Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

## Environment Variables

Add to your `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/likho

# Redis
REDIS_URL=redis://localhost:6379/0

# Collaboration Settings
COLLAB_PERSIST_INTERVAL_SECONDS=30
COLLAB_SESSION_TIMEOUT_MINUTES=5
```

## Database Migration

Run the migration to add new tables:

```bash
# Using psql
psql -d likho -f migrations/add_collaboration_v2.sql

# Or using your migration tool
alembic upgrade head  # if using alembic
```

## Running the Server

```bash
cd backend
pip install -e ".[dev]"
uvicorn main:app --reload
```

## WebSocket Protocol

### Connection

Connect to: `ws://localhost:8000/ws/collab/{page_id}`

**Headers:**
```
Authorization: Bearer {jwt_token}
```

### Message Types

**Binary Messages (Yjs updates):**
- Only editors can send updates
- Viewers and commenters will receive `permission_denied` error

**JSON Control Messages:**

```json
// Comment
{
  "type": "comment",
  "content": { /* BlockNote JSON */ },
  "block_id": "uuid",
  "parent_id": "uuid"  // for replies
}

// Awareness (cursor position, etc)
{
  "type": "awareness",
  "cursor": { "blockId": "...", "index": 0 }
}

// Ping/Pong
{ "type": "ping" }
{ "type": "pong" }
```

### Permission Matrix

| Role | Connect | Send Updates | Receive Updates | Comment |
|------|---------|--------------|-----------------|---------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ | ✅ |
| Commenter | ✅ | ❌ | ✅ | ✅ |
| Viewer | ✅ | ❌ | ✅ | ❌ |

## API Endpoints

### Sharing
- `POST /api/v1/pages/{page_id}/share` - Share with user
- `GET /api/v1/pages/{page_id}/permissions` - List permissions
- `DELETE /api/v1/pages/{page_id}/permissions/{user_id}` - Remove access
- `POST /api/v1/pages/{page_id}/share-link` - Create share link
- `GET /api/v1/pages/{page_id}/share-links` - List share links

### Comments
- `POST /api/v1/pages/{page_id}/comments` - Create comment
- `GET /api/v1/pages/{page_id}/comments` - List comments
- `POST /api/v1/comments/{comment_id}/resolve` - Resolve comment
- `DELETE /api/v1/comments/{comment_id}` - Delete comment

### Activity
- `GET /api/v1/pages/{page_id}/activity` - Get activity log
- `GET /api/v1/my/activity` - Get user's activity

## Architecture

```
┌─────────────┐     WebSocket      ┌──────────────┐
│   Client    │◄──────────────────►│   FastAPI    │
│  (BlockNote)│   Authorization:   │   WebSocket  │
│   + Yjs     │   Bearer {token}   │    Handler   │
└─────────────┘                    └──────┬───────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
              ┌─────▼─────┐        ┌──────▼──────┐       ┌─────▼─────┐
              │  Redis    │        │  Permission │       │PostgreSQL │
              │  Rooms    │        │   Check     │       │   (Yjs    │
              │  Pub/Sub  │        │             │       │  State)   │
              └───────────┘        └─────────────┘       └───────────┘
```

## Troubleshooting

### WebSocket Connection Issues
1. Check JWT token is valid and not expired
2. Verify user has access to the page
3. Check Redis is running: `redis-cli ping`

### Permission Errors
- Viewers cannot send Yjs updates (this is enforced server-side)
- Commenters can only send comment messages
- Check role with: `GET /api/v1/pages/{page_id}/my-role`

### Data Not Persisting
1. Check Redis connection
2. Verify YjsDocument table exists
3. Check logs for persistence errors

## Monitoring

Check active collaboration sessions:
```sql
SELECT page_id, COUNT(*) as active_users
FROM collaboration_sessions
WHERE disconnected_at IS NULL
GROUP BY page_id;
```

Check recent activity:
```sql
SELECT action, COUNT(*) 
FROM collaboration_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY action;
```
