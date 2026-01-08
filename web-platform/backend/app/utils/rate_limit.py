"""
Rate limiting middleware using Redis.
"""
import time
from typing import Optional, Callable
from functools import wraps

from fastapi import HTTPException, Request, status
from redis import asyncio as aioredis

from app.core.config import settings


class RateLimiter:
    """
    Token bucket rate limiter using Redis.
    """

    def __init__(
        self,
        redis_url: str = None,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
    ):
        self.redis_url = redis_url or settings.REDIS_URL
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self._redis: Optional[aioredis.Redis] = None

    async def get_redis(self) -> aioredis.Redis:
        """Get Redis connection."""
        if self._redis is None:
            self._redis = await aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._redis

    async def close(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None

    async def is_rate_limited(
        self,
        key: str,
        limit: int,
        window_seconds: int,
    ) -> tuple[bool, int, int]:
        """
        Check if request is rate limited using sliding window.

        Args:
            key: Unique identifier (e.g., user_id, IP)
            limit: Maximum requests allowed
            window_seconds: Time window in seconds

        Returns:
            Tuple of (is_limited, remaining_requests, reset_time)
        """
        redis = await self.get_redis()
        now = time.time()
        window_start = now - window_seconds

        # Use sorted set for sliding window
        redis_key = f"rate_limit:{key}"

        # Remove old entries
        await redis.zremrangebyscore(redis_key, 0, window_start)

        # Count current requests
        current_count = await redis.zcard(redis_key)

        if current_count >= limit:
            # Get oldest entry to calculate reset time
            oldest = await redis.zrange(redis_key, 0, 0, withscores=True)
            reset_time = int(oldest[0][1] + window_seconds - now) if oldest else window_seconds
            return True, 0, reset_time

        # Add current request
        await redis.zadd(redis_key, {str(now): now})
        await redis.expire(redis_key, window_seconds)

        remaining = limit - current_count - 1
        return False, remaining, window_seconds

    async def check_rate_limit(
        self,
        identifier: str,
        request_type: str = "api",
    ) -> dict:
        """
        Check rate limits for a request.

        Args:
            identifier: User ID or IP address
            request_type: Type of request for different limits

        Returns:
            Dict with rate limit info
        """
        # Check per-minute limit
        minute_key = f"{request_type}:minute:{identifier}"
        minute_limited, minute_remaining, minute_reset = await self.is_rate_limited(
            minute_key, self.requests_per_minute, 60
        )

        if minute_limited:
            return {
                "limited": True,
                "remaining": 0,
                "reset_seconds": minute_reset,
                "limit_type": "minute",
            }

        # Check per-hour limit
        hour_key = f"{request_type}:hour:{identifier}"
        hour_limited, hour_remaining, hour_reset = await self.is_rate_limited(
            hour_key, self.requests_per_hour, 3600
        )

        if hour_limited:
            return {
                "limited": True,
                "remaining": 0,
                "reset_seconds": hour_reset,
                "limit_type": "hour",
            }

        return {
            "limited": False,
            "remaining": min(minute_remaining, hour_remaining),
            "reset_seconds": 60,
            "limit_type": None,
        }


# Global rate limiter instance
rate_limiter = RateLimiter()


async def get_client_identifier(request: Request) -> str:
    """
    Get unique identifier for rate limiting.
    Uses user ID if authenticated, otherwise IP address.
    """
    # Try to get user from request state (set by auth middleware)
    user = getattr(request.state, "user", None)
    if user and hasattr(user, "id"):
        return f"user:{user.id}"

    # Fall back to IP address
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"

    return f"ip:{ip}"


def rate_limit(
    requests_per_minute: int = 60,
    requests_per_hour: int = 1000,
):
    """
    Rate limit decorator for endpoints.

    Usage:
        @router.get("/endpoint")
        @rate_limit(requests_per_minute=30)
        async def endpoint():
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, request: Request = None, **kwargs):
            if request is None:
                # Try to find request in args
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if request:
                identifier = await get_client_identifier(request)

                # Create custom limiter with specified limits
                limiter = RateLimiter(
                    requests_per_minute=requests_per_minute,
                    requests_per_hour=requests_per_hour,
                )

                result = await limiter.check_rate_limit(identifier)

                if result["limited"]:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail={
                            "message": "Rate limit exceeded",
                            "retry_after": result["reset_seconds"],
                            "limit_type": result["limit_type"],
                        },
                        headers={
                            "Retry-After": str(result["reset_seconds"]),
                            "X-RateLimit-Remaining": "0",
                        },
                    )

            return await func(*args, request=request, **kwargs)

        return wrapper
    return decorator


class RateLimitMiddleware:
    """
    ASGI middleware for rate limiting all requests.
    """

    def __init__(
        self,
        app,
        requests_per_minute: int = 100,
        requests_per_hour: int = 2000,
        exclude_paths: list = None,
    ):
        self.app = app
        self.limiter = RateLimiter(
            requests_per_minute=requests_per_minute,
            requests_per_hour=requests_per_hour,
        )
        self.exclude_paths = exclude_paths or ["/health", "/docs", "/openapi.json"]

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Check if path is excluded
        path = scope.get("path", "")
        if any(path.startswith(p) for p in self.exclude_paths):
            await self.app(scope, receive, send)
            return

        # Get client identifier
        request = Request(scope)
        identifier = await get_client_identifier(request)

        # Check rate limit
        result = await self.limiter.check_rate_limit(identifier)

        if result["limited"]:
            # Return 429 response
            response_body = b'{"detail": "Rate limit exceeded"}'
            await send({
                "type": "http.response.start",
                "status": 429,
                "headers": [
                    [b"content-type", b"application/json"],
                    [b"retry-after", str(result["reset_seconds"]).encode()],
                ],
            })
            await send({
                "type": "http.response.body",
                "body": response_body,
            })
            return

        await self.app(scope, receive, send)
