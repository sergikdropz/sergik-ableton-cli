"""
Track Service

Orchestrates track management and similarity operations.
"""

from typing import Dict, Any, List, Optional
import logging

from .base import BaseService
from ..stores.sql_store import get_track, list_tracks, upsert_track
from ..stores.vector_store import similar as vector_similar
from ..pipelines.pack_pipeline import create_pack, rate_track
from ..connectors.ableton_osc import osc_status, osc_similar_results
from ..utils.errors import ValidationError

logger = logging.getLogger(__name__)


class TrackService(BaseService):
    """Service for track management operations."""
    
    def get_track(self, track_id: str) -> Optional[Dict[str, Any]]:
        """
        Get track by ID.
        
        Args:
            track_id: Track identifier
            
        Returns:
            Track data or None if not found
        """
        return get_track(track_id)
    
    def list_tracks(
        self,
        limit: int = 100,
        rated_only: bool = False
    ) -> List[Dict[str, Any]]:
        """
        List tracks in database.
        
        Args:
            limit: Maximum number of tracks to return
            rated_only: Only return rated tracks
            
        Returns:
            List of track dictionaries
        """
        return list_tracks(limit=limit, rated_only=rated_only)
    
    def find_similar(
        self,
        track_id: str,
        k: int = 10,
        style_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Find similar tracks using vector similarity.
        
        Args:
            track_id: Source track ID
            k: Number of similar tracks to return
            style_filter: Optional style filter
            
        Returns:
            Dictionary with similar tracks
            
        Raises:
            ValidationError: If track_id is missing
        """
        if not track_id:
            raise ValidationError("track_id is required for similarity search")
        
        try:
            results = vector_similar(
                track_id=track_id,
                k=k,
                style_filter=style_filter
            )
            
            osc_status(f"Found {len(results)} similar tracks")
            osc_similar_results(track_id, results)
            
            self.logger.info(f"Found {len(results)} similar tracks for {track_id}")
            return {
                "track_id": track_id,
                "similar": results,
                "count": len(results)
            }
            
        except Exception as e:
            self.logger.error(f"Similarity search failed: {e}")
            raise
    
    def create_pack(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create sample pack from audio files.
        
        Args:
            args: Pack creation arguments
            
        Returns:
            Pack metadata dictionary
            
        Raises:
            ValidationError: If required arguments are missing
        """
        try:
            result = create_pack(args)
            osc_status(f"Pack created: {result['track_count']} files", **result)
            
            self.logger.info(f"Created pack: {result.get('pack_id')}")
            return result
            
        except Exception as e:
            self.logger.error(f"Pack creation failed: {e}")
            raise
    
    def rate_track(
        self,
        track_id: str,
        rating: float,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Rate a track for preference learning.
        
        Args:
            track_id: Track identifier
            rating: Rating (1-5)
            context: Optional rating context
            
        Returns:
            Rating result dictionary
            
        Raises:
            ValidationError: If track_id is missing or rating is invalid
        """
        if not track_id:
            raise ValidationError("track_id is required")
        
        if not (1 <= rating <= 5):
            raise ValidationError("Rating must be between 1 and 5")
        
        try:
            result = rate_track({
                "track_id": track_id,
                "rating": rating,
                "context": context
            })
            
            osc_status(f"Rated {track_id}: {rating} stars")
            
            self.logger.info(f"Rated track {track_id}: {rating} stars")
            return result
            
        except Exception as e:
            self.logger.error(f"Track rating failed: {e}")
            raise

