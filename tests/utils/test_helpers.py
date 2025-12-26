"""
Test Helpers

Utility functions and fixtures for testing.
"""

from typing import Dict, Any
from unittest.mock import Mock, MagicMock
import json


def create_mock_response(status_code: int = 200, data: Dict[str, Any] = None) -> Mock:
    """Create a mock HTTP response."""
    response = Mock()
    response.status_code = status_code
    response.json.return_value = data or {}
    response.text = json.dumps(data or {})
    return response


def create_mock_request(
    method: str = "GET",
    path: str = "/",
    headers: Dict[str, str] = None,
    body: Dict[str, Any] = None
) -> Mock:
    """Create a mock FastAPI request."""
    request = Mock()
    request.method = method
    request.url.path = path
    request.headers = headers or {}
    request.client.host = "127.0.0.1"
    request.state = Mock()
    if body:
        request.json = Mock(return_value=body)
    return request

