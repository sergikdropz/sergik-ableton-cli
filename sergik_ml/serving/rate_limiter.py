"""
SERGIK ML Rate Limiter

Protect API endpoints from abuse:
  - Per-IP rate limiting
  - Per-command rate limiting
  - Burst allowance
  - Cost-based limits

Usage:
    from sergik_ml.serving.rate_limiter import RateLimiter, rate_limit_middleware

    # In FastAPI app
    app.add_middleware(RateLimitMiddleware)
"""

import logging
import time
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from collections import defaultdict
from functools import wraps
import asyncio

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting."""
    # General limits
    requests_per_minute: int = 60
    requests_per_hour: int = 1000

    # Per-command limits
    command_limits: Dict[str, int] = field(default_factory=lambda: {
        "pack.create": 10,      # 10 per hour
        "stems.separate": 5,    # 5 per hour
        "gen.generate_loop": 20,  # 20 per hour
        "train.preference": 2,  # 2 per hour
    })

    # Burst allowance
    burst_size: int = 10

    # Whitelist (exempt from limits)
    whitelisted_ips: set = field(default_factory=lambda: {"127.0.0.1", "::1"})


class TokenBucket:
    """Token bucket rate limiter."""

    def __init__(self, rate: float, capacity: int):
        """
        Initialize token bucket.

        Args:
            rate: Tokens per second
            capacity: Maximum tokens
        """
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.last_update = time.time()

    def consume(self, tokens: int = 1) -> bool:
        """
        Try to consume tokens.

        Returns True if allowed, False if rate limited.
        """
        now = time.time()
        elapsed = now - self.last_update
        self.last_update = now

        # Add tokens based on time elapsed
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)

        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

    def time_until_available(self, tokens: int = 1) -> float:
        """Get seconds until tokens are available."""
        if self.tokens >= tokens:
            return 0
        return (tokens - self.tokens) / self.rate


class RateLimiter:
    """
    Multi-level rate limiter.

    Tracks:
      - Per-IP request rates
      - Per-command rates
      - Global rates
    """

    def __init__(self, config: Optional[RateLimitConfig] = None):
        """Initialize rate limiter."""
        self.config = config or RateLimitConfig()

        # Per-IP buckets
        self.ip_buckets: Dict[str, TokenBucket] = {}

        # Per-command buckets (per IP)
        self.command_buckets: Dict[str, Dict[str, TokenBucket]] = defaultdict(dict)

        # Request history for sliding window
        self.request_history: Dict[str, list] = defaultdict(list)

        # Cleanup task
        self._last_cleanup = time.time()

    def _get_ip_bucket(self, ip: str) -> TokenBucket:
        """Get or create token bucket for IP."""
        if ip not in self.ip_buckets:
            # Rate: requests_per_minute / 60 tokens per second
            rate = self.config.requests_per_minute / 60
            self.ip_buckets[ip] = TokenBucket(rate, self.config.burst_size)
        return self.ip_buckets[ip]

    def _get_command_bucket(self, ip: str, command: str) -> Optional[TokenBucket]:
        """Get or create token bucket for command."""
        if command not in self.config.command_limits:
            return None

        if command not in self.command_buckets[ip]:
            # Rate: limit per hour / 3600 tokens per second
            limit = self.config.command_limits[command]
            rate = limit / 3600
            self.command_buckets[ip][command] = TokenBucket(rate, max(1, limit // 10))

        return self.command_buckets[ip][command]

    def is_whitelisted(self, ip: str) -> bool:
        """Check if IP is whitelisted."""
        return ip in self.config.whitelisted_ips

    def check_rate_limit(
        self,
        ip: str,
        command: Optional[str] = None,
    ) -> tuple[bool, Optional[str], float]:
        """
        Check if request is rate limited.

        Args:
            ip: Client IP address
            command: Optional command being executed

        Returns:
            Tuple of (allowed, reason, retry_after)
        """
        if self.is_whitelisted(ip):
            return True, None, 0

        # Periodic cleanup
        self._maybe_cleanup()

        # Check IP rate
        ip_bucket = self._get_ip_bucket(ip)
        if not ip_bucket.consume():
            retry = ip_bucket.time_until_available()
            return False, "Too many requests", retry

        # Check command rate
        if command:
            cmd_bucket = self._get_command_bucket(ip, command)
            if cmd_bucket and not cmd_bucket.consume():
                retry = cmd_bucket.time_until_available()
                return False, f"Too many {command} requests", retry

        # Check hourly limit
        now = time.time()
        hour_ago = now - 3600
        self.request_history[ip] = [t for t in self.request_history[ip] if t > hour_ago]

        if len(self.request_history[ip]) >= self.config.requests_per_hour:
            return False, "Hourly limit exceeded", 3600

        self.request_history[ip].append(now)
        return True, None, 0

    def _maybe_cleanup(self):
        """Cleanup old buckets periodically."""
        now = time.time()
        if now - self._last_cleanup < 300:  # Every 5 minutes
            return

        self._last_cleanup = now
        cutoff = now - 3600

        # Cleanup old request history
        for ip in list(self.request_history.keys()):
            self.request_history[ip] = [t for t in self.request_history[ip] if t > cutoff]
            if not self.request_history[ip]:
                del self.request_history[ip]

    def get_stats(self) -> Dict[str, Any]:
        """Get rate limiter statistics."""
        return {
            "active_ips": len(self.ip_buckets),
            "total_tracked_requests": sum(
                len(h) for h in self.request_history.values()
            ),
            "config": {
                "requests_per_minute": self.config.requests_per_minute,
                "requests_per_hour": self.config.requests_per_hour,
                "burst_size": self.config.burst_size,
            },
        }


# Global rate limiter instance
_rate_limiter: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    """Get or create global rate limiter."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for rate limiting.

    Usage:
        app.add_middleware(RateLimitMiddleware)
    """

    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting."""
        limiter = get_rate_limiter()

        # Get client IP
        ip = request.client.host if request.client else "unknown"

        # Extract command from body for action endpoints
        command = None
        if request.url.path == "/action" and request.method == "POST":
            try:
                body = await request.body()
                import json
                data = json.loads(body)
                command = data.get("cmd")
                # Reset body for downstream handlers
                # (FastAPI will re-read it)
            except Exception:
                pass

        # Check rate limit
        allowed, reason, retry_after = limiter.check_rate_limit(ip, command)

        if not allowed:
            logger.warning(f"Rate limited: {ip} - {reason}")
            return JSONResponse(
                status_code=429,
                content={
                    "status": "error",
                    "error": reason,
                    "retry_after": retry_after,
                },
                headers={"Retry-After": str(int(retry_after))},
            )

        return await call_next(request)


def rate_limit(command: Optional[str] = None):
    """
    Decorator for rate limiting specific functions.

    Usage:
        @rate_limit("pack.create")
        async def create_pack(...):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get request from kwargs or first arg
            request = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if request:
                limiter = get_rate_limiter()
                ip = request.client.host if request.client else "unknown"

                allowed, reason, retry_after = limiter.check_rate_limit(ip, command)
                if not allowed:
                    raise HTTPException(
                        status_code=429,
                        detail={"error": reason, "retry_after": retry_after},
                    )

            return await func(*args, **kwargs)
        return wrapper
    return decorator
