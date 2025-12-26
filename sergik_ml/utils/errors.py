"""
SERGIK ML Custom Exceptions

Custom exception hierarchy for consistent error handling.
"""

from typing import Optional, Dict, Any


class SergikError(Exception):
    """Base exception for all SERGIK ML errors."""
    
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize SERGIK error.
        
        Args:
            message: Error message
            details: Optional dictionary with additional error details
            error_code: Optional error code for API responses
            context: Optional context (request_id, user_id, operation, etc.)
        """
        super().__init__(message)
        self.message = message
        self.details = details or {}
        self.error_code = error_code or self.__class__.__name__
        self.context = context or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for API responses."""
        return {
            "error": self.error_code,
            "message": self.message,
            "details": self.details,
            "context": self.context
        }


class ValidationError(SergikError):
    """Raised when input validation fails."""
    pass


class GenerationError(SergikError):
    """Raised when music generation fails."""
    pass


class AbletonConnectionError(SergikError):
    """Raised when Ableton Live connection fails."""
    pass


class AnalysisError(SergikError):
    """Raised when audio analysis fails."""
    pass


class ConfigurationError(SergikError):
    """Raised when configuration is invalid."""
    pass


class DatabaseError(SergikError):
    """Raised when database operations fail."""
    pass


class ServiceError(SergikError):
    """Raised when a service operation fails."""
    pass


class FileNotFoundError(SergikError):
    """Raised when required file is not found."""
    pass


class AuthenticationError(SergikError):
    """Raised when authentication fails."""
    pass


class AuthorizationError(SergikError):
    """Raised when authorization fails."""
    pass


class RateLimitError(SergikError):
    """Raised when rate limit is exceeded."""
    pass

