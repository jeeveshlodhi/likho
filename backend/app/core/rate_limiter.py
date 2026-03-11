"""
Rate limiting utilities with token bucket algorithm.
Supports Redis-based distributed rate limiting with in-memory fallback.
"""
import asyncio
import hashlib
import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from fastapi import Request

from app.core.config import settings

logger = logging.getLogger(__name__)


class RateLimitExceeded(Exception):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, retry_after: int, limit: int, window: int, remaining: int = 0):
        self.retry_after = retry_after
        self.limit = limit
        self.window = window
        self.remaining = remaining
        super().__init__(f"Rate limit exceeded. Retry after {retry_after} seconds.")


@dataclass
class RateLimitInfo:
    """Rate limit status information."""
    limit: int
    remaining: int
    reset_at: int
    window: int


class RateLimiterBackend(ABC):
    """Abstract base class for rate limiter backends."""
    
    @abstractmethod
    async def check_rate_limit(
        self, 
        key: str, 
        requests: int, 
        window: int
    ) -> RateLimitInfo:
        """
        Check if the request is within rate limit.
        
        Args:
            key: Unique identifier for the client
            requests: Maximum number of requests allowed in the window
            window: Time window in seconds
            
        Returns:
            RateLimitInfo with current status
            
        Raises:
            RateLimitExceeded: If rate limit is exceeded
        """
        pass
    
    @abstractmethod
    async def is_available(self) -> bool:
        """Check if the backend is available."""
        pass


class MemoryRateLimiter(RateLimiterBackend):
    """In-memory rate limiter using token bucket algorithm."""
    
    def __init__(self):
        # key -> {"tokens": float, "last_update": float}
        self._buckets: dict[str, dict] = {}
        self._lock = asyncio.Lock()
        self._cleanup_task: Optional[asyncio.Task] = None
        self._start_cleanup_task()
    
    def _start_cleanup_task(self):
        """Start background task to clean up expired buckets."""
        async def cleanup():
            while True:
                try:
                    await asyncio.sleep(60)  # Cleanup every minute
                    await self._cleanup_expired()
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"Rate limiter cleanup error: {e}")
        
        self._cleanup_task = asyncio.create_task(cleanup())
    
    async def _cleanup_expired(self):
        """Remove expired buckets to prevent memory leak."""
        current_time = time.time()
        async with self._lock:
            expired_keys = [
                key for key, bucket in self._buckets.items()
                if current_time - bucket["last_update"] > 3600  # 1 hour
            ]
            for key in expired_keys:
                del self._buckets[key]
            if expired_keys:
                logger.debug(f"Cleaned up {len(expired_keys)} expired rate limit buckets")
    
    async def check_rate_limit(
        self, 
        key: str, 
        requests: int, 
        window: int
    ) -> RateLimitInfo:
        """
        Token bucket algorithm implementation.
        
        Each client has a bucket with a certain capacity (requests).
        Tokens are added at a constant rate (requests/window).
        Each request consumes 1 token.
        """
        current_time = time.time()
        
        async with self._lock:
            bucket = self._buckets.get(key)
            
            if bucket is None:
                # New client: start with full bucket minus 1 for current request
                bucket = {
                    "tokens": requests - 1,
                    "last_update": current_time
                }
                self._buckets[key] = bucket
                
                return RateLimitInfo(
                    limit=requests,
                    remaining=requests - 1,
                    reset_at=int(current_time + window),
                    window=window
                )
            
            # Calculate tokens to add based on elapsed time
            elapsed = current_time - bucket["last_update"]
            tokens_to_add = elapsed * (requests / window)
            
            # Update bucket
            bucket["tokens"] = min(requests, bucket["tokens"] + tokens_to_add)
            bucket["last_update"] = current_time
            
            # Check if we can process the request
            if bucket["tokens"] >= 1:
                bucket["tokens"] -= 1
                remaining = int(bucket["tokens"])
                
                return RateLimitInfo(
                    limit=requests,
                    remaining=remaining,
                    reset_at=int(current_time + window),
                    window=window
                )
            else:
                # Rate limit exceeded
                retry_after = int((1 - bucket["tokens"]) / (requests / window)) + 1
                raise RateLimitExceeded(
                    retry_after=retry_after,
                    limit=requests,
                    window=window,
                    remaining=0
                )
    
    async def is_available(self) -> bool:
        """Memory backend is always available."""
        return True
    
    async def close(self):
        """Close the rate limiter and cleanup resources."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass


class RedisRateLimiter(RateLimiterBackend):
    """Redis-based distributed rate limiter using sliding window algorithm."""
    
    def __init__(self, redis_client=None):
        self._redis = redis_client
        self._script_sha: Optional[str] = None
        self._lock = asyncio.Lock()
    
    async def _get_redis(self):
        """Get or create Redis client."""
        if self._redis is None:
            from app.core.redis.client import get_redis
            self._redis = await get_redis()
        return self._redis
    
    async def _load_script(self) -> str:
        """Load the rate limiting Lua script."""
        if self._script_sha is not None:
            return self._script_sha
        
        async with self._lock:
            if self._script_sha is not None:
                return self._script_sha
            
            # Lua script for atomic rate limit check
            # Uses Redis sorted sets for sliding window
            script = """
                local key = KEYS[1]
                local window = tonumber(ARGV[1])
                local limit = tonumber(ARGV[2])
                local now = tonumber(ARGV[3])
                
                -- Remove old entries outside the window
                local clear_before = now - window
                redis.call('ZREMRANGEBYSCORE', key, 0, clear_before)
                
                -- Count current entries
                local current = redis.call('ZCARD', key)
                
                -- Check if we can add new entry
                if current < limit then
                    -- Add new entry with current timestamp
                    redis.call('ZADD', key, now, now)
                    -- Set expiry on the key
                    redis.call('EXPIRE', key, window)
                    
                    return {limit - current - 1, now + window}
                else
                    -- Get the oldest entry to calculate retry_after
                    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
                    local retry_after = math.ceil(oldest[2] + window - now)
                    return {-1, retry_after}
                end
            """
            
            redis = await self._get_redis()
            self._script_sha = await redis.script_load(script)
            return self._script_sha
    
    async def check_rate_limit(
        self, 
        key: str, 
        requests: int, 
        window: int
    ) -> RateLimitInfo:
        """Check rate limit using Redis sliding window."""
        redis = await self._get_redis()
        script_sha = await self._load_script()
        
        current_time = time.time()
        rate_limit_key = f"ratelimit:{key}"
        
        try:
            result = await redis.evalsha(
                script_sha,
                1,  # Number of keys
                rate_limit_key,
                window,
                requests,
                current_time
            )
            
            remaining, reset_or_retry = result
            
            if remaining >= 0:
                return RateLimitInfo(
                    limit=requests,
                    remaining=remaining,
                    reset_at=int(reset_or_retry),
                    window=window
                )
            else:
                # Rate limit exceeded
                raise RateLimitExceeded(
                    retry_after=int(reset_or_retry),
                    limit=requests,
                    window=window,
                    remaining=0
                )
        
        except Exception as e:
            if "NOSCRIPT" in str(e):
                # Script was flushed from Redis, reload it
                self._script_sha = None
                return await self.check_rate_limit(key, requests, window)
            raise
    
    async def is_available(self) -> bool:
        """Check if Redis is available."""
        try:
            redis = await self._get_redis()
            await redis.ping()
            return True
        except Exception as e:
            logger.warning(f"Redis not available for rate limiting: {e}")
            return False


class RateLimiter:
    """
    Main rate limiter class with Redis primary and memory fallback.
    """
    
    def __init__(self):
        self._redis_backend: Optional[RedisRateLimiter] = None
        self._memory_backend = MemoryRateLimiter()
        self._use_redis = True
        self._redis_failed_at: Optional[float] = None
        self._redis_fail_cooldown = 30  # Seconds before retrying Redis
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        # Check for forwarded headers (common in proxy setups)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Get the first IP in the chain (client IP)
            return forwarded.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-Ip")
        if real_ip:
            return real_ip
        
        # Fall back to direct connection IP
        if request.client:
            return request.client.host
        
        return "unknown"
    
    def _get_user_agent(self, request: Request) -> str:
        """Extract user agent from request."""
        return request.headers.get("User-Agent", "unknown")
    
    def _generate_fingerprint(self, request: Request) -> str:
        """
        Generate a fingerprint based on IP and User-Agent.
        This helps prevent simple IP rotation attacks.
        """
        ip = self._get_client_ip(request)
        user_agent = self._get_user_agent(request)
        
        # Create a hash of IP + User-Agent prefix
        # We use only the prefix of User-Agent to handle minor variations
        ua_prefix = user_agent[:50] if len(user_agent) > 50 else user_agent
        fingerprint_data = f"{ip}:{ua_prefix}"
        
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:16]
    
    def _is_whitelisted(self, request: Request) -> bool:
        """Check if the request IP is whitelisted."""
        whitelist = getattr(settings, "RATE_LIMIT_WHITELIST", [])
        if not whitelist:
            return False
        
        ip = self._get_client_ip(request)
        
        # Support IP ranges (simple implementation)
        for allowed in whitelist:
            if ip == allowed:
                return True
            # Handle CIDR notation (simple case: /24, /16, /8)
            if "/" in allowed:
                try:
                    ip_parts = ip.split(".")
                    allowed_parts = allowed.split("/")[0].split(".")
                    prefix_len = int(allowed.split("/")[1])
                    
                    # Calculate how many octets to check
                    octets_to_check = prefix_len // 8
                    if ip_parts[:octets_to_check] == allowed_parts[:octets_to_check]:
                        return True
                except (ValueError, IndexError):
                    continue
        
        return False
    
    async def _get_backend(self) -> RateLimiterBackend:
        """Get the appropriate backend (Redis or memory)."""
        if not self._use_redis:
            # Check if we should retry Redis
            if self._redis_failed_at:
                elapsed = time.time() - self._redis_failed_at
                if elapsed < self._redis_fail_cooldown:
                    return self._memory_backend
                # Retry Redis after cooldown
                self._use_redis = True
        
        if self._use_redis and self._redis_backend is None:
            self._redis_backend = RedisRateLimiter()
        
        if self._use_redis and self._redis_backend:
            try:
                if await self._redis_backend.is_available():
                    return self._redis_backend
            except Exception as e:
                logger.warning(f"Redis rate limiter unavailable: {e}")
        
        # Fall back to memory
        self._use_redis = False
        self._redis_failed_at = time.time()
        logger.info("Falling back to memory-based rate limiting")
        return self._memory_backend
    
    async def check(
        self,
        request: Request,
        requests: int,
        window: int,
        key_prefix: str = "",
        use_fingerprint: bool = True
    ) -> RateLimitInfo:
        """
        Check rate limit for a request.
        
        Args:
            request: FastAPI request object
            requests: Maximum number of requests allowed
            window: Time window in seconds
            key_prefix: Optional prefix for the rate limit key
            use_fingerprint: Whether to include User-Agent in the key
            
        Returns:
            RateLimitInfo with current status
            
        Raises:
            RateLimitExceeded: If rate limit is exceeded
        """
        # Check whitelist
        if self._is_whitelisted(request):
            return RateLimitInfo(
                limit=requests,
                remaining=requests,
                reset_at=int(time.time() + window),
                window=window
            )
        
        # Generate rate limit key
        if use_fingerprint:
            identifier = self._generate_fingerprint(request)
        else:
            identifier = self._get_client_ip(request)
        
        if key_prefix:
            key = f"{key_prefix}:{identifier}"
        else:
            key = identifier
        
        backend = await self._get_backend()
        return await backend.check_rate_limit(key, requests, window)
    
    async def check_by_user(
        self,
        request: Request,
        user_id: str,
        requests: int,
        window: int,
        key_prefix: str = "user"
    ) -> RateLimitInfo:
        """
        Check rate limit for a specific user.
        
        Args:
            request: FastAPI request object
            user_id: User identifier
            requests: Maximum number of requests allowed
            window: Time window in seconds
            key_prefix: Optional prefix for the rate limit key
            
        Returns:
            RateLimitInfo with current status
        """
        # Check whitelist
        if self._is_whitelisted(request):
            return RateLimitInfo(
                limit=requests,
                remaining=requests,
                reset_at=int(time.time() + window),
                window=window
            )
        
        key = f"{key_prefix}:{user_id}"
        backend = await self._get_backend()
        return await backend.check_rate_limit(key, requests, window)
    
    async def check_by_key(
        self,
        key: str,
        requests: int,
        window: int
    ) -> RateLimitInfo:
        """
        Check rate limit for a custom key.
        
        Args:
            key: Custom rate limit key
            requests: Maximum number of requests allowed
            window: Time window in seconds
            
        Returns:
            RateLimitInfo with current status
        """
        backend = await self._get_backend()
        return await backend.check_rate_limit(key, requests, window)
    
    async def close(self):
        """Close the rate limiter and cleanup resources."""
        await self._memory_backend.close()


# Global rate limiter instance
_rate_limiter: Optional[RateLimiter] = None


async def get_rate_limiter() -> RateLimiter:
    """Get or create the global rate limiter instance."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter


async def close_rate_limiter():
    """Close the global rate limiter."""
    global _rate_limiter
    if _rate_limiter:
        await _rate_limiter.close()
        _rate_limiter = None
