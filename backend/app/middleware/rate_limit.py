"""
Global rate limiting middleware for FastAPI.
Applies rate limits to all endpoints with configurable exclusions.
"""
import logging
from typing import Optional, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.rate_limiter import get_rate_limiter, RateLimitExceeded, RateLimitInfo, close_rate_limiter
from app.core.config import settings

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Global rate limiting middleware.
    
    Features:
    - Configurable default rate limits
    - Path exclusion patterns (e.g., health checks)
    - Custom rate limit headers
    - Graceful degradation if Redis is down
    """
    
    def __init__(
        self,
        app: ASGIApp,
        default_requests: int = 100,
        default_window: int = 60,
        excluded_paths: Optional[list[str]] = None,
        excluded_prefixes: Optional[list[str]] = None,
        use_fingerprint: bool = True,
        graceful_degradation: bool = True
    ):
        super().__init__(app)
        self.default_requests = default_requests
        self.default_window = default_window
        self.excluded_paths = set(excluded_paths or [])
        self.excluded_prefixes = excluded_prefixes or []
        self.use_fingerprint = use_fingerprint
        self.graceful_degradation = graceful_degradation
    
    def _is_excluded(self, path: str) -> bool:
        """Check if the path should be excluded from rate limiting."""
        # Exact match
        if path in self.excluded_paths:
            return True
        
        # Prefix match
        for prefix in self.excluded_prefixes:
            if path.startswith(prefix):
                return True
        
        return False
    
    def _get_rate_limit_headers(self, info: Optional[RateLimitInfo]) -> dict:
        """Generate rate limit headers from info."""
        if info is None:
            return {}
        
        return {
            "X-RateLimit-Limit": str(info.limit),
            "X-RateLimit-Remaining": str(info.remaining),
            "X-RateLimit-Reset": str(info.reset_at),
            "X-RateLimit-Window": str(info.window),
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process the request with rate limiting."""
        path = request.url.path
        
        # Check if path is excluded
        if self._is_excluded(path):
            return await call_next(request)
        
        # Get rate limiter
        try:
            limiter = await get_rate_limiter()
        except Exception as e:
            if self.graceful_degradation:
                logger.warning(f"Rate limiter unavailable, allowing request: {e}")
                return await call_next(request)
            raise
        
        # Check rate limit
        try:
            info = await limiter.check(
                request=request,
                requests=self.default_requests,
                window=self.default_window,
                key_prefix="global",
                use_fingerprint=self.use_fingerprint
            )
            
            # Store info for potential use by dependencies
            request.state.rate_limit_info = info
            
        except RateLimitExceeded as e:
            logger.warning(f"Rate limit exceeded for {path}: {e}")
            
            import time
            return Response(
                content=self._format_error_response(e),
                status_code=429,
                headers={
                    "Content-Type": "application/json",
                    "Retry-After": str(e.retry_after),
                    "X-RateLimit-Limit": str(e.limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + e.retry_after),
                }
            )
        except Exception as e:
            if self.graceful_degradation:
                logger.warning(f"Rate limit check failed, allowing request: {e}")
                return await call_next(request)
            raise
        
        # Process the request
        response = await call_next(request)
        
        # Add rate limit headers to response
        headers = self._get_rate_limit_headers(info)
        for header, value in headers.items():
            response.headers[header] = value
        
        return response
    
    def _format_error_response(self, e: RateLimitExceeded) -> str:
        """Format the rate limit error as JSON."""
        import json
        return json.dumps({
            "error": "Rate limit exceeded",
            "message": f"Too many requests. Please try again in {e.retry_after} seconds.",
            "retry_after": e.retry_after,
            "limit": e.limit,
            "window": e.window,
        })


def create_rate_limit_middleware(
    app: ASGIApp,
    config: Optional[dict] = None
) -> RateLimitMiddleware:
    """
    Factory function to create rate limit middleware with configuration.
    
    Args:
        app: The ASGI application
        config: Optional configuration dictionary with keys:
            - default_requests: Default requests per window (default: 100)
            - default_window: Default window in seconds (default: 60)
            - excluded_paths: List of exact paths to exclude
            - excluded_prefixes: List of path prefixes to exclude
            - use_fingerprint: Whether to use IP+UA fingerprint (default: True)
            - graceful_degradation: Allow requests if rate limiter fails (default: True)
    
    Returns:
        Configured RateLimitMiddleware instance
    """
    config = config or {}
    
    # Default exclusions for health checks and static files
    default_excluded_paths = {"/", "/health", "/health/", "/health/live", "/health/ready"}
    default_excluded_prefixes = [
        "/health/",
        "/static/",
        "/docs",
        "/openapi.json",
        "/redoc",
    ]
    
    # Merge with user config
    excluded_paths = config.get("excluded_paths", set()) | default_excluded_paths
    excluded_prefixes = list(set(config.get("excluded_prefixes", []) + default_excluded_prefixes))
    
    # Get settings from config or use defaults
    default_requests = getattr(settings, "RATE_LIMIT_DEFAULT_REQUESTS", config.get("default_requests", 100))
    default_window = getattr(settings, "RATE_LIMIT_DEFAULT_WINDOW", config.get("default_window", 60))
    
    return RateLimitMiddleware(
        app=app,
        default_requests=default_requests,
        default_window=default_window,
        excluded_paths=list(excluded_paths),
        excluded_prefixes=excluded_prefixes,
        use_fingerprint=config.get("use_fingerprint", True),
        graceful_degradation=config.get("graceful_degradation", True)
    )


# Pre-configured middleware instances for common scenarios

def get_default_rate_limit_middleware(app: ASGIApp) -> RateLimitMiddleware:
    """Get default rate limit middleware with standard settings."""
    return create_rate_limit_middleware(app)


def get_strict_rate_limit_middleware(app: ASGIApp) -> RateLimitMiddleware:
    """Get strict rate limit middleware for high-security scenarios."""
    return create_rate_limit_middleware(
        app,
        config={
            "default_requests": 30,
            "default_window": 60,
            "use_fingerprint": True,
            "graceful_degradation": False
        }
    )


def get_lenient_rate_limit_middleware(app: ASGIApp) -> RateLimitMiddleware:
    """Get lenient rate limit middleware for trusted environments."""
    return create_rate_limit_middleware(
        app,
        config={
            "default_requests": 1000,
            "default_window": 60,
            "use_fingerprint": False,
            "graceful_degradation": True
        }
    )
