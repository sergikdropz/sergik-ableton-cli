"""
Analysis Service

Orchestrates audio analysis operations.
"""

from typing import Dict, Any, Optional
import logging

from .base import BaseService
from ..pipelines.audio_analysis import analyze_audio
from ..utils.errors import AnalysisError, FileNotFoundError
from ..utils.audio import validate_audio_file

logger = logging.getLogger(__name__)


class AnalysisService(BaseService):
    """Service for audio analysis operations."""
    
    def analyze_audio(
        self,
        file_path: Optional[str] = None,
        url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze audio file.
        
        Args:
            file_path: Path to local audio file
            url: URL to audio file (for download)
            
        Returns:
            Analysis results dictionary
            
        Raises:
            ValidationError: If neither file_path nor url is provided
            FileNotFoundError: If file doesn't exist
            AnalysisError: If analysis fails
        """
        if not file_path and not url:
            raise ValueError("Either file_path or url must be provided")
        
        if file_path:
            # Validate file
            is_valid, error_msg = validate_audio_file(file_path)
            if not is_valid:
                raise FileNotFoundError(error_msg or "Invalid audio file")
        
        try:
            result = analyze_audio(file_path=file_path, url=url)
            
            self.logger.info(f"Analyzed audio: {file_path or url}")
            return result
            
        except Exception as e:
            self.logger.error(f"Audio analysis failed: {e}")
            raise AnalysisError(f"Analysis failed: {e}")

