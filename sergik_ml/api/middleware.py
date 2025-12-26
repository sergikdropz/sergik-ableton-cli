"""
API Middleware

Custom middleware for the SERGIK ML API.
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware.
    
    Simple rate limiter - can be enhanced with Redis or similar.
    """
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_times = {}
    
    async def dispatch(self, request: Request, call_next):
        # Simple rate limiting (per IP)
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean old entries
        if client_ip in self.request_times:
            self.request_times[client_ip] = [
                t for t in self.request_times[client_ip]
                if current_time - t < 60
            ]
        else:
            self.request_times[client_ip] = []
        
        # Check rate limit
        if len(self.request_times[client_ip]) >= self.requests_per_minute:
            return Response(
                content="Rate limit exceeded",
                status_code=429,
                headers={"Retry-After": "60"}
            )
        
        # Record request
        self.request_times[client_ip].append(current_time)
        
        # Process request
        response = await call_next(request)
        return response

