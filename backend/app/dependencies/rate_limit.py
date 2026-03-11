"""
FastAPI dependencies for rate limiting.
Provides different rate limit tiers and strategies.
"""
from functools import wraps
from typing import Optional, Callable

from fastapi import Request, Depends, HTTPException, status

from app.core.rate_limiter import get_rate_limiter, RateLimitExceeded, RateLimitInfo
from app.core.deps import get_current_user_optional
from app.modules.users.models import User


class RateLimitTier:
    """Predefined rate limit tiers."""
    
    # Anonymous users - most restrictive
    ANONYMOUS = {"requests": 30, "window": 60}  # 30 requests per minute
    
    # Authenticated users - standard limits
    AUTHENTICATED = {"requests": 100, "window": 60}  # 100 requests per minute
    
    # Premium users - higher limits
    PREMIUM = {"requests": 300, "window": 60}  # 300 requests per minute
    
    # Auth endpoints - strict to prevent brute force
    AUTH = {"requests": 5, "window": 60}  # 5 requests per minute
    
    # AI endpoints - expensive operations
    AI = {"requests": 10, "window": 60}  # 10 requests per minute
    
    # Feedback - prevent spam
    FEEDBACK = {"requests": 5, "window": 3600}  # 5 per hour
    
    # Admin/internal - very high limits
    INTERNAL = {"requests": 1000, "window": 60}  # 1000 per minute


def _set_rate_limit_headers(request: Request, info: RateLimitInfo):
    """Store rate limit info in request state for middleware to pick up."""
    if not hasattr(request.state, "rate_limit_info"):
        request.state.rate_limit_info = info


def _create_rate_limit_exception(e: RateLimitExceeded) -> HTTPException:
    """Create HTTP exception for rate limit exceeded."""
    import time
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={
            "error": "Rate limit exceeded",
            "message": f"Too many requests. Please try again in {e.retry_after} seconds.",
            "retry_after": e.retry_after,
            "limit": e.limit,
            "window": e.window,
        },
        headers={
            "Retry-After": str(e.retry_after),
            "X-RateLimit-Limit": str(e.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": str(int(time.time()) + e.retry_after),
        }
    )


async def rate_limit(
    requests: int,
    window: int,
    key_prefix: str = "ip",
    use_fingerprint: bool = True
) -> Callable:
    """
    Dependency factory for IP-based rate limiting.
    
    Args:
        requests: Maximum number of requests allowed
        window: Time window in seconds
        key_prefix: Prefix for the rate limit key
        use_fingerprint: Whether to use IP+User-Agent fingerprint
        
    Usage:
        @router.get("/items")
        async def get_items(
            _: None = Depends(rate_limit(requests=100, window=60))
        ):
            return {"items": []}
    """
    async def check_rate_limit(request: Request) -> None:
        limiter = await get_rate_limiter()
        
        try:
            info = await limiter.check(
                request=request,
                requests=requests,
                window=window,
                key_prefix=key_prefix,
                use_fingerprint=use_fingerprint
            )
            _set_rate_limit_headers(request, info)
        except RateLimitExceeded as e:
            raise _create_rate_limit_exception(e)
    
    return check_rate_limit


async def rate_limit_by_user(
    requests: int,
    window: int,
    key_prefix: str = "user",
    fallback_to_ip: bool = True
) -> Callable:
    """
    Dependency factory for user-based rate limiting.
    Falls back to IP-based limiting for anonymous users if enabled.
    
    Args:
        requests: Maximum number of requests allowed
        window: Time window in seconds
        key_prefix: Prefix for the rate limit key
        fallback_to_ip: Whether to use IP limiting for anonymous users
        
    Usage:
        @router.get("/items")
        async def get_items(
            _: None = Depends(rate_limit_by_user(requests=100, window=60))
        ):
            return {"items": []}
    """
    async def check_rate_limit(
        request: Request,
        current_user: Optional[User] = Depends(get_current_user_optional)
    ) -> None:
        limiter = await get_rate_limiter()
        
        try:
            if current_user:
                # User is authenticated - use user-based limiting
                info = await limiter.check_by_user(
                    request=request,
                    user_id=str(current_user.id),
                    requests=requests,
                    window=window,
                    key_prefix=key_prefix
                )
            elif fallback_to_ip:
                # Anonymous user - fall back to IP-based limiting
                info = await limiter.check(
                    request=request,
                    requests=RateLimitTier.ANONYMOUS["requests"],
                    window=RateLimitTier.ANONYMOUS["window"],
                    key_prefix="anonymous",
                    use_fingerprint=True
                )
            else:
                # Anonymous users not allowed
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            _set_rate_limit_headers(request, info)
            
        except RateLimitExceeded as e:
            raise _create_rate_limit_exception(e)
    
    return check_rate_limit


async def rate_limit_by_key(
    key: str,
    requests: int,
    window: int
) -> Callable:
    """
    Dependency factory for custom key-based rate limiting.
    
    Args:
        key: Custom rate limit key
        requests: Maximum number of requests allowed
        window: Time window in seconds
        
    Usage:
        @router.get("/items")
        async def get_items(
            _: None = Depends(rate_limit_by_key(key="my_endpoint", requests=50, window=60))
        ):
            return {"items": []}
    """
    async def check_rate_limit(request: Request) -> None:
        limiter = await get_rate_limiter()
        
        try:
            info = await limiter.check_by_key(
                key=key,
                requests=requests,
                window=window
            )
            _set_rate_limit_headers(request, info)
        except RateLimitExceeded as e:
            raise _create_rate_limit_exception(e)
    
    return check_rate_limit


# Convenience dependencies for common rate limit tiers

async def rate_limit_anonymous(request: Request) -> None:
    """Rate limit for anonymous users."""
    dep = await rate_limit(
        requests=RateLimitTier.ANONYMOUS["requests"],
        window=RateLimitTier.ANONYMOUS["window"],
        key_prefix="anonymous"
    )
    await dep(request)


async def rate_limit_authenticated(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> None:
    """Rate limit for authenticated users."""
    if not current_user:
        # Fall back to anonymous limiting
        await rate_limit_anonymous(request)
        return
    
    dep = await rate_limit_by_user(
        requests=RateLimitTier.AUTHENTICATED["requests"],
        window=RateLimitTier.AUTHENTICATED["window"]
    )
    await dep(request, current_user)


async def rate_limit_auth(request: Request) -> None:
    """Strict rate limit for authentication endpoints (prevent brute force)."""
    dep = await rate_limit(
        requests=RateLimitTier.AUTH["requests"],
        window=RateLimitTier.AUTH["window"],
        key_prefix="auth",
        use_fingerprint=True
    )
    await dep(request)


async def rate_limit_ai(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> None:
    """Rate limit for AI endpoints."""
    tier = RateLimitTier.AI
    
    if not current_user:
        # Anonymous users get even stricter limits
        dep = await rate_limit(
            requests=3,  # Only 3 AI requests per minute for anonymous
            window=60,
            key_prefix="ai:anonymous"
        )
        await dep(request)
        return
    
    # Check if user is premium (would need to implement this check)
    # For now, use standard AI limits
    dep = await rate_limit_by_user(
        requests=tier["requests"],
        window=tier["window"],
        key_prefix="ai"
    )
    await dep(request, current_user)


async def rate_limit_feedback(request: Request) -> None:
    """Rate limit for feedback submission (prevent spam)."""
    dep = await rate_limit(
        requests=RateLimitTier.FEEDBACK["requests"],
        window=RateLimitTier.FEEDBACK["window"],
        key_prefix="feedback"
    )
    await dep(request)


async def rate_limit_internal(request: Request) -> None:
    """Rate limit for internal/admin endpoints."""
    dep = await rate_limit(
        requests=RateLimitTier.INTERNAL["requests"],
        window=RateLimitTier.INTERNAL["window"],
        key_prefix="internal"
    )
    await dep(request)


# WebSocket rate limiting

class WebSocketRateLimiter:
    """Rate limiter for WebSocket connections."""
    
    def __init__(
        self,
        max_connections_per_ip: int = 10,
        message_rate: int = 100,  # messages per minute
        window: int = 60
    ):
        self.max_connections = max_connections_per_ip
        self.message_rate = message_rate
        self.window = window
    
    async def check_connection_allowed(self, ip: str) -> bool:
        """Check if a new WebSocket connection is allowed from this IP."""
        limiter = await get_rate_limiter()
        key = f"ws:conn:{ip}"
        
        try:
            # Use a simple counter for connections
            info = await limiter.check_by_key(
                key=key,
                requests=self.max_connections,
                window=3600  # 1 hour window for connections
            )
            return True
        except RateLimitExceeded:
            return False
    
    async def check_message_allowed(self, ip: str) -> bool:
        """Check if a message is allowed from this IP."""
        limiter = await get_rate_limiter()
        key = f"ws:msg:{ip}"
        
        try:
            info = await limiter.check_by_key(
                key=key,
                requests=self.message_rate,
                window=self.window
            )
            return True
        except RateLimitExceeded:
            return False
    
    async def release_connection(self, ip: str):
        """Release a WebSocket connection slot (not implemented for simplicity)."""
        # In a production system, you'd decrement the connection counter
        pass


def get_websocket_rate_limiter(
    max_connections: int = 10,
    message_rate: int = 100,
    window: int = 60
) -> WebSocketRateLimiter:
    """Get a WebSocket rate limiter instance."""
    return WebSocketRateLimiter(
        max_connections_per_ip=max_connections,
        message_rate=message_rate,
        window=window
    )
