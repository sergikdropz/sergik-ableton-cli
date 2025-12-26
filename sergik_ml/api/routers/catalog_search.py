"""
Catalog Search

Search SERGIK catalog database for tracks/samples matching browser queries.
"""

from typing import Dict, Any, List, Optional
import logging

from ...stores.sql_store import list_tracks
from ...schemas import BrowserItem
from .browser_query_parser import parse_browser_query, build_sql_filters

logger = logging.getLogger(__name__)


def search_catalog(
    parsed_query: Dict[str, Any],
    limit: int = 20,
    category: Optional[str] = None
) -> List[BrowserItem]:
    """
    Search SERGIK catalog for tracks matching parsed query.
    
    Args:
        parsed_query: Parsed query dictionary from parse_browser_query()
        limit: Maximum number of results
        category: Optional category filter (not used for catalog search)
        
    Returns:
        List of BrowserItem objects
    """
    try:
        # Get all tracks (catalog search)
        all_tracks = list_tracks(limit=10000)  # Get large set for filtering
        
        # Apply filters
        filtered = []
        for track in all_tracks:
            # BPM filter
            if parsed_query.get("bpm_min") is not None:
                track_bpm = track.get("bpm")
                if track_bpm is None or track_bpm < parsed_query["bpm_min"]:
                    continue
            if parsed_query.get("bpm_max") is not None:
                track_bpm = track.get("bpm")
                if track_bpm is None or track_bpm > parsed_query["bpm_max"]:
                    continue
            
            # Key filter
            if parsed_query.get("key"):
                track_key = track.get("key", "").upper()
                if track_key != parsed_query["key"].upper():
                    continue
            
            # Name/Text pattern
            text_pattern = parsed_query.get("text") or parsed_query.get("name_pattern")
            if text_pattern:
                track_id_lower = (track.get("track_id") or "").lower()
                prompt_lower = (track.get("prompt_text") or "").lower()
                pattern_lower = text_pattern.lower()
                if pattern_lower not in track_id_lower and pattern_lower not in prompt_lower:
                    continue
            
            # Genre filter
            if parsed_query.get("genre"):
                style_source = (track.get("style_source") or "").lower()
                if style_source != parsed_query["genre"].lower():
                    continue
            
            # Track matches all filters
            filtered.append(track)
        
        # Convert to BrowserItem format
        results = []
        for track in filtered[:limit]:
            track_id = track.get("track_id", "")
            
            # Try to extract file path from track_id or metadata
            # Track IDs are often file paths or basenames
            path = track_id
            if not path.startswith("/") and not path.startswith("http"):
                # Assume it's a basename, construct path
                # In real implementation, this would come from metadata
                path = f"/catalog/{track_id}"
            
            # Determine item type (audio by default)
            item_type = "audio"
            if track_id.lower().endswith((".mid", ".midi")):
                item_type = "midi"
            
            browser_item = BrowserItem(
                name=track_id.split("/")[-1] if "/" in track_id else track_id,
                path=path,
                item_type=item_type,
                is_folder=False,
                is_loadable=True
            )
            results.append(browser_item)
        
        logger.info(f"Catalog search returned {len(results)} results")
        return results
        
    except Exception as e:
        logger.error(f"Catalog search failed: {e}")
        return []


def search_catalog_simple(
    query: str,
    limit: int = 20
) -> List[BrowserItem]:
    """
    Simple catalog search with query string.
    
    Args:
        query: Search query (will be parsed)
        limit: Maximum results
        
    Returns:
        List of BrowserItem objects
    """
    parsed = parse_browser_query(query)
    return search_catalog(parsed, limit=limit)

