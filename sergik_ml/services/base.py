"""
Base Service Class

Abstract base class for all services.
"""

from abc import ABC
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class BaseService(ABC):
    """Base class for all services."""
    
    def __init__(self):
        """Initialize service."""
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def validate_input(self, data: Dict[str, Any], required_fields: List[str]) -> None:
        """
        Validate that required fields are present.
        
        Args:
            data: Input data dictionary
            required_fields: List of required field names
            
        Raises:
            ValueError: If any required field is missing
        """
        missing = [field for field in required_fields if field not in data]
        if missing:
            raise ValueError(f"Missing required fields: {missing}")

