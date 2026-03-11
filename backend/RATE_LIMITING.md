# Rate Limiting Implementation

This document describes the rate limiting system implemented for the Likho FastAPI backend.

## Overview

The rate limiting system provides:

- **Token bucket algorithm** for smooth request handling
- **Redis-based distributed rate limiting** for horizontal scaling
- **In-memory fallback** for development environments
- **Multiple rate limit strategies**: IP-based, user-based, custom key-based
- **WebSocket rate limiting** for connections and messages
- **Graceful degradation** when Redis is unavailable

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Rate Limiting System                      │
├─────────────────────────────────────────────────────────────────┤
│  Middleware Layer  │  Dependency Layer   │  Direct Usage       │
│  ───────────────── │  ────────────────── │  ─────────────      │
│  Global limits     │  Per-endpoint       │  WebSocket          │
│  Excluded paths    │  Tier-based         │  Custom logic       │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │    Redis     │    │   In-Memory  │
            │   Backend    │◄──►│   Backend    │
            │  (Production)│    │  (Fallback)  │
            └──────────────┘    └──────────────┘
```

## Components

### 1. Core Rate Limiter (`app/core/rate_limiter.py`)

#### Classes:

- **`RateLimiter`**: Main class with Redis + memory fallback
- **`MemoryRateLimiter`**: Token bucket implementation in memory
- **`RedisRateLimiter`**: Distributed rate limiting with Redis
- **`RateLimitExceeded`**: Exception raised when limit is exceeded
- **`RateLimitInfo`**: Rate limit status information

#### Key Features:

- **IP + User-Agent fingerprinting**: Prevents simple IP rotation attacks
- **Configurable whitelist**: Allow specific IPs/ranges to bypass limits
- **Automatic failover**: Falls back to memory if Redis is down

### 2. Dependencies (`app/dependencies/rate_limit.py`)

#### Predefined Rate Limit Tiers:

| Tier | Requests | Window | Use Case |
|------|----------|--------|----------|
| `ANONYMOUS` | 30 | 60s | Unauthenticated users |
| `AUTHENTICATED` | 100 | 60s | Regular users |
| `PREMIUM` | 300 | 60s | Premium users |
| `AUTH` | 5 | 60s | Login/signup (brute force protection) |
| `AI` | 10 | 60s | AI endpoints (expensive ops) |
| `FEEDBACK` | 5 | 3600s | Feedback submission (spam protection) |
| `INTERNAL` | 1000 | 60s | Admin/internal endpoints |

#### Dependency Functions:

```python
# IP-based rate limiting
@router.get("/items")
async def get_items(_: None = Depends(rate_limit(requests=100, window=60))):
    pass

# User-based rate limiting
@router.get("/items")
async def get_items(_: None = Depends(rate_limit_by_user(requests=100, window=60))):
    pass

# Custom key-based
@router.get("/items")
async def get_items(_: None = Depends(rate_limit_by_key(key="custom", requests=50, window=60))):
    pass

# Predefined tiers
@router.post("/login")
async def login(_: None = Depends(rate_limit_auth)):
    pass

@router.post("/ai/assist")
async def assist(_: None = Depends(rate_limit_ai)):
    pass
```

### 3. Middleware (`app/middleware/rate_limit.py`)

Global rate limiting middleware that applies to all endpoints:

```python
# Add to main.py
from app.middleware.rate_limit import create_rate_limit_middleware

app = create_rate_limit_middleware(app)
```

#### Features:

- **Default limits**: 100 requests/minute for all endpoints
- **Path exclusions**: Health checks, docs, static files
- **Rate limit headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Graceful degradation**: Allows requests if rate limiter fails

### 4. Exception Handler (`app/exceptions/rate_limit.py`)

Handles `RateLimitExceeded` exceptions and returns proper HTTP 429 responses:

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 30 seconds.",
  "retry_after": 30,
  "limit": 5,
  "window": 60
}
```

## Configuration

Add to your `.env` file:

```bash
# Rate Limiting
RATE_LIMIT_DEFAULT_REQUESTS=100
RATE_LIMIT_DEFAULT_WINDOW=60
RATE_LIMIT_WHITELIST=127.0.0.1,10.0.0.0/8
RATE_LIMIT_ENABLED=true
RATE_LIMIT_GRACEFUL_DEGRADATION=true
```

### Environment Variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_DEFAULT_REQUESTS` | 100 | Default requests per window |
| `RATE_LIMIT_DEFAULT_WINDOW` | 60 | Default window in seconds |
| `RATE_LIMIT_WHITELIST` | (empty) | Comma-separated IPs/CIDR ranges |
| `RATE_LIMIT_ENABLED` | true | Enable/disable rate limiting |
| `RATE_LIMIT_GRACEFUL_DEGRADATION` | true | Allow requests if Redis down |

## Applied Rate Limits

### Authentication Endpoints (`/api/v1/auth/*`)

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| POST `/signup` | 5 | 60s | Prevent account creation spam |
| POST `/login` | 5 | 60s | Prevent brute force attacks |
| GET `/me` | 100 | 60s | Standard authenticated limit |

### AI Endpoints (`/api/v1/ai/*`)

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| All AI endpoints | 10 | 60s | Protect expensive AI operations |
| Anonymous AI | 3 | 60s | Stricter for unauthenticated |

### Feedback Endpoints (`/api/v1/feedback/*`)

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| POST `/feedback` | 5 | 3600s | Prevent spam |
| POST `/errors` | 30 | 60s | Error reporting (anonymous) |
| POST `/analytics/events` | 30 | 60s | Analytics tracking |

### WebSocket Connections (`/ws/collab/*`)

| Resource | Limit | Window | Purpose |
|----------|-------|--------|---------|
| Connections per IP | 10 | 3600s | Prevent connection exhaustion |
| Messages per IP | 100 | 60s | Prevent message flooding |

## Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709654400
X-RateLimit-Window: 60
```

When rate limit is exceeded:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1709654430
```

## Usage Examples

### Custom Rate Limit on Endpoint

```python
from fastapi import APIRouter, Depends
from app.dependencies.rate_limit import rate_limit

router = APIRouter()

@router.post("/special-action")
async def special_action(
    _: None = Depends(rate_limit(requests=10, window=300))  # 10 per 5 minutes
):
    return {"message": "Action completed"}
```

### User-Based with Fallback

```python
from app.dependencies.rate_limit import rate_limit_by_user

@router.get("/user-data")
async def get_user_data(
    _: None = Depends(rate_limit_by_user(
        requests=1000, 
        window=60,
        fallback_to_ip=True  # Use IP if not authenticated
    ))
):
    return {"data": "user data"}
```

### WebSocket Rate Limiting

```python
from app.dependencies.rate_limit import get_websocket_rate_limiter

ws_limiter = get_websocket_rate_limiter(
    max_connections=10,
    message_rate=100,
    window=60
)

@app.websocket("/ws/endpoint")
async def websocket_endpoint(websocket: WebSocket):
    client_ip = websocket.client.host
    
    if not await ws_limiter.check_connection_allowed(client_ip):
        await websocket.close(code=4008, reason="Too many connections")
        return
    
    await websocket.accept()
    
    while True:
        if not await ws_limiter.check_message_allowed(client_ip):
            await websocket.send_json({"error": "Rate limited"})
            continue
        
        message = await websocket.receive_text()
        # Process message...
```

## Testing Rate Limits

### Using curl:

```bash
# Test auth rate limit (5 per minute)
for i in {1..10}; do
    curl -X POST http://localhost:8000/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"wrong"}' \
        -w "Status: %{http_code}\n"
done

# Check rate limit headers
curl -I http://localhost:8000/api/v1/health
```

### Expected Behavior:

1. **First 5 requests**: HTTP 401 (wrong password)
2. **Requests 6+**: HTTP 429 with `Retry-After` header
3. **After 60 seconds**: Counter resets, requests allowed again

## Troubleshooting

### Rate Limiting Not Working

1. Check if `RATE_LIMIT_ENABLED=true` in `.env`
2. Verify Redis connection: `redis-cli ping`
3. Check whitelist: Your IP might be whitelisted
4. Review logs for errors

### Redis Connection Issues

The system automatically falls back to memory-based rate limiting if Redis is unavailable. Check logs for:

```
⚠️ Redis not available for rate limiting: <error>
Falling back to memory-based rate limiting
```

### High Memory Usage

The in-memory rate limiter cleans up expired buckets every 60 seconds. If you have many unique clients:

1. Ensure Redis is running (distributed mode)
2. Reduce `RATE_LIMIT_DEFAULT_WINDOW` to expire buckets faster
3. Consider using IP-only mode (`use_fingerprint=False`)

## Best Practices

1. **Different limits per endpoint type**: Auth (strict), AI (moderate), General (lenient)
2. **Use fingerprinting**: Combines IP + User-Agent for better identification
3. **Whitelist internal services**: Prevent rate limiting your own infrastructure
4. **Monitor rate limit hits**: Log 429 responses to detect abuse
5. **Graceful degradation**: Allow requests if rate limiter fails (configurable)

## Security Considerations

1. **IP spoofing**: Use `X-Forwarded-For` handling only behind trusted proxies
2. **User-Agent rotation**: Fingerprinting helps but determined attackers can rotate UAs
3. **Distributed attacks**: Per-IP limits don't protect against botnets (use user-based limits)
4. **Redis security**: Ensure Redis is not exposed to the internet

## Future Enhancements

- [ ] Sliding window log algorithm for stricter limits
- [ ] Per-user custom limits (premium tiers)
- [ ] Rate limit analytics dashboard
- [ ] Dynamic rate limiting based on load
- [ ] Integration with external DDoS protection
