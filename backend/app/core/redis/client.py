"""
Redis client configuration for collaboration and caching.
"""
import redis.asyncio as redis
from app.core.config import settings

# Global Redis client
_redis_client: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    """Get or create Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=False,  # We need binary for Yjs updates
            socket_keepalive=True,
            socket_keepalive_options={},
            health_check_interval=30,
        )
    return _redis_client


async def close_redis():
    """Close Redis connection."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None


class RedisRoomManager:
    """
    Manages room state across multiple servers using Redis.
    """
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self._pubsub = None
    
    async def join_room(self, room_id: str, connection_id: str, user_id: str, role: str) -> bool:
        """Add connection to room."""
        pipe = self.redis.pipeline()
        
        # Add to room set
        room_key = f"room:{room_id}:connections"
        pipe.sadd(room_key, connection_id)
        
        # Store connection info
        conn_key = f"conn:{connection_id}"
        pipe.hset(conn_key, mapping={
            "user_id": user_id,
            "room_id": room_id,
            "role": role,
            "joined_at": str(redis.utils.datetime.now().timestamp())
        })
        pipe.expire(conn_key, 3600)  # 1 hour TTL
        
        # Increment client count
        doc_key = f"yjs:doc:{room_id}"
        pipe.hincrby(doc_key, "client_count", 1)
        
        await pipe.execute()
        return True
    
    async def leave_room(self, room_id: str, connection_id: str) -> int:
        """Remove connection from room, return remaining connections."""
        pipe = self.redis.pipeline()
        
        # Remove from room set
        room_key = f"room:{room_id}:connections"
        pipe.srem(room_key, connection_id)
        
        # Delete connection info
        conn_key = f"conn:{connection_id}"
        pipe.delete(conn_key)
        
        # Decrement client count
        doc_key = f"yjs:doc:{room_id}"
        pipe.hincrby(doc_key, "client_count", -1)
        
        # Get remaining count
        pipe.scard(room_key)
        
        results = await pipe.execute()
        return results[-1]  # Return remaining connections
    
    async def broadcast_update(self, room_id: str, update: bytes, exclude_conn: str | None = None):
        """Broadcast Yjs update to all connections in room."""
        channel = f"yjs:room:{room_id}"
        message = {
            "type": "update",
            "exclude": exclude_conn,
            "data": update.hex()  # Binary as hex for JSON
        }
        await self.redis.publish(channel, str(message))
    
    async def queue_update(self, room_id: str, update: bytes):
        """Queue update for persistence."""
        key = f"yjs:updates:{room_id}"
        await self.redis.rpush(key, update)
        # Set expiry to prevent unbounded growth
        await self.redis.expire(key, 86400)  # 24 hours
    
    async def get_pending_updates(self, room_id: str) -> list[bytes]:
        """Get and clear pending updates for persistence."""
        key = f"yjs:updates:{room_id}"
        # Get all updates
        updates = await self.redis.lrange(key, 0, -1)
        # Clear the list
        await self.redis.delete(key)
        return updates
    
    async def get_room_connections(self, room_id: str) -> list[str]:
        """Get all connection IDs in a room."""
        room_key = f"room:{room_id}:connections"
        connections = await self.redis.smembers(room_key)
        return [c.decode() if isinstance(c, bytes) else c for c in connections]
    
    async def update_activity(self, connection_id: str):
        """Update last activity timestamp."""
        conn_key = f"conn:{connection_id}"
        await self.redis.hset(conn_key, "last_activity", str(redis.utils.datetime.now().timestamp()))
    
    async def cleanup_stale_connections(self, max_idle_seconds: int = 300):
        """Remove connections that haven't been active."""
        # This would be called by a background task
        pass
