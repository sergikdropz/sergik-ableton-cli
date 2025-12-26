"""
Authentication Middleware

Provides authentication and authorization for API endpoints.
"""

import logging
from typing import Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from ...config import CFG
from ...utils.errors import AuthenticationError, AuthorizationError

logger = logging.getLogger(__name__)


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """
    Authentication middleware for API endpoints.
    
    Currently supports API key authentication.
    Can be extended to support JWT tokens, OAuth, etc.
    """
    
    def __init__(self, app, require_auth: bool = False):
        """
        Initialize authentication middleware.
        
        Args:
            app: FastAPI application
            require_auth: Whether to require authentication (default: False for backward compatibility)
        """
        super().__init__(app)
        self.require_auth = require_auth
        self.api_key = CFG.openai_api_key  # Can be extended to use dedicated API key config
    
    async def dispatch(self, request: Request, call_next):
        """Process request with authentication."""
        # Skip authentication for certain paths
        skip_paths = ["/health", "/docs", "/openapi.json", "/redoc"]
        if any(request.url.path.startswith(path) for path in skip_paths):
            return await call_next(request)
        
        # Check if authentication is required
        if self.require_auth:
            # Extract API key from header
            api_key = request.headers.get("Authorization") or request.headers.get("X-API-Key")
            
            if not api_key:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                    headers={"WWW-Authenticate": "ApiKey"},
                )
            
            # Remove "Bearer " prefix if present
            if api_key.startswith("Bearer "):
                api_key = api_key[7:]
            
            # Validate API key
            if not self._validate_api_key(api_key):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid API key",
                    headers={"WWW-Authenticate": "ApiKey"},
                )
            
            # Add user context to request state
            request.state.authenticated = True
            request.state.api_key = api_key
        else:
            # Optional authentication - set context if key is provided
            api_key = request.headers.get("Authorization") or request.headers.get("X-API-Key")
            if api_key and api_key.startswith("Bearer "):
                api_key = api_key[7:]
            
            request.state.authenticated = api_key is not None and self._validate_api_key(api_key) if api_key else False
            request.state.api_key = api_key if request.state.authenticated else None
        
        # Process request
        response = await call_next(request)
        return response
    
    def _validate_api_key(self, api_key: str) -> bool:
        """
        Validate API key.
        
        Args:
            api_key: API key to validate
            
        Returns:
            True if valid
        """
        # For now, check against configured API key
        # In production, this should check against a database or external service
        if not self.api_key:
            # If no API key is configured, allow all requests (dev mode)
            return True
        
        return api_key == self.api_key


class RequestSizeMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce request size limits."""
    
    def __init__(self, app, max_size: int = 10 * 1024 * 1024):  # 10 MB default
        """
        Initialize request size middleware.
        
        Args:
            app: FastAPI application
            max_size: Maximum request size in bytes
        """
        super().__init__(app)
        self.max_size = max_size
    
    async def dispatch(self, request: Request, call_next):
        """Check request size before processing."""
        content_length = request.headers.get("content-length")
        
        if content_length:
            try:
                size = int(content_length)
                if size > self.max_size:
                    return Response(
                        content=f"Request too large. Maximum size: {self.max_size / (1024 * 1024):.1f} MB",
                        status_code=413,  # Payload Too Large
                    )
            except ValueError:
                pass  # Invalid content-length, let FastAPI handle it
        
        response = await call_next(request)
        return response

