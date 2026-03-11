"""
Custom exception handler for rate limit errors.
"""
import logging
from typing import Union

from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import http_exception_handler
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.rate_limiter import RateLimitExceeded

logger = logging.getLogger(__name__)


class RateLimitHTTPException(StarletteHTTPException):
    """
    HTTP exception for rate limiting with additional metadata.
    
    This can be used when you want to raise rate limit exceptions
    directly from your endpoint code.
    """
    
    def __init__(
        self,
        retry_after: int,
        limit: int,
        window: int,
        detail: str = "Rate limit exceeded",
    ):
        self.retry_after = retry_after
        self.limit = limit
        self.window = window
        
        headers = {
            "Retry-After": str(retry_after),
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": "0",
        }
        
        super().__init__(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "message": detail,
                "retry_after": retry_after,
                "limit": limit,
                "window": window,
            },
            headers=headers
        )


def setup_rate_limit_exception_handler(app: FastAPI) -> None:
    """
    Register the rate limit exception handler with the FastAPI app.
    
    Args:
        app: The FastAPI application instance
    """
    
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_exceeded_handler(
        request: Request,
        exc: RateLimitExceeded
    ) -> JSONResponse:
        """Handle RateLimitExceeded exceptions."""
        import time
        
        logger.warning(
            f"Rate limit exceeded for {request.method} {request.url.path}: "
            f"retry_after={exc.retry_after}, limit={exc.limit}"
        )
        
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "message": f"Too many requests. Please try again in {exc.retry_after} seconds.",
                "retry_after": exc.retry_after,
                "limit": exc.limit,
                "window": exc.window,
            },
            headers={
                "Retry-After": str(exc.retry_after),
                "X-RateLimit-Limit": str(exc.limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(time.time()) + exc.retry_after),
            }
        )
    
    @app.exception_handler(RateLimitHTTPException)
    async def rate_limit_http_exception_handler(
        request: Request,
        exc: RateLimitHTTPException
    ) -> JSONResponse:
        """Handle RateLimitHTTPException."""
        import time
        
        logger.warning(
            f"Rate limit HTTP exception for {request.method} {request.url.path}: "
            f"retry_after={exc.retry_after}"
        )
        
        # Ensure headers are set
        headers = dict(exc.headers or {})
        headers.setdefault("Retry-After", str(exc.retry_after))
        headers.setdefault("X-RateLimit-Limit", str(exc.limit))
        headers.setdefault("X-RateLimit-Remaining", "0")
        headers.setdefault("X-RateLimit-Reset", str(int(time.time()) + exc.retry_after))
        
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail if isinstance(exc.detail, dict) else {"error": exc.detail},
            headers=headers
        )


def rate_limit_error_response(
    retry_after: int,
    limit: int,
    window: int
) -> dict:
    """
    Create a standard rate limit error response dictionary.
    
    Args:
        retry_after: Seconds until the client can retry
        limit: The rate limit that was exceeded
        window: The time window for the rate limit
        
    Returns:
        Dictionary with error details
    """
    return {
        "error": "Rate limit exceeded",
        "message": f"Too many requests. Please try again in {retry_after} seconds.",
        "retry_after": retry_after,
        "limit": limit,
        "window": window,
    }


def get_rate_limit_headers(
    limit: int,
    remaining: int,
    reset_at: int
) -> dict:
    """
    Get standard rate limit headers.
    
    Args:
        limit: The request limit
        remaining: Remaining requests in the current window
        reset_at: Unix timestamp when the limit resets
        
    Returns:
        Dictionary of headers
    """
    return {
        "X-RateLimit-Limit": str(limit),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": str(reset_at),
    }
