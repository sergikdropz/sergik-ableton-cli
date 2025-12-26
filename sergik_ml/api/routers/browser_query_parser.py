"""
Browser Query Parser

Parses structured browser search queries like:
  - BPM:120
  - key:C
  - name:kick
  - genre:house
  - BPM:120, key:C, name:kick
"""

import re
from typing import Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


def parse_browser_query(query: str) -> Dict[str, Any]:
    """
    Parse structured browser query into filter dictionary.
    
    Supports:
    - BPM:120 or BPM:120-140 (range)
    - key:C or key:10B (Camelot notation)
    - name:kick (name pattern)
    - genre:house (genre filter)
    - Multiple filters separated by commas
    
    Args:
        query: Search query string
        
    Returns:
        Dictionary with parsed filters:
        {
            "text": "free text search",
            "bpm_min": 120,
            "bpm_max": 140,
            "key": "C",
            "name_pattern": "kick",
            "genre": "house"
        }
    """
    parsed = {
        "text": "",
        "bpm_min": None,
        "bpm_max": None,
        "key": None,
        "name_pattern": None,
        "genre": None,
    }
    
    # Remove leading/trailing whitespace
    query = query.strip()
    
    # Pattern for structured filters: KEY:VALUE
    filter_pattern = r'(\w+):([^\s,]+)'
    
    # Find all structured filters
    filters = re.findall(filter_pattern, query)
    
    # Remove filter parts from query to get free text
    free_text = query
    for key, value in filters:
        free_text = re.sub(rf'\b{key}:{value}\b', '', free_text, flags=re.IGNORECASE)
    
    # Clean up free text (remove extra commas/spaces)
    free_text = re.sub(r'[,\s]+', ' ', free_text).strip()
    parsed["text"] = free_text
    
    # Process each filter
    for key, value in filters:
        key_lower = key.lower()
        value_lower = value.lower()
        
        if key_lower == "bpm":
            # Parse BPM (single value or range)
            if '-' in value:
                # Range: BPM:120-140
                parts = value.split('-')
                try:
                    parsed["bpm_min"] = float(parts[0])
                    parsed["bpm_max"] = float(parts[1]) if len(parts) > 1 else None
                except ValueError:
                    logger.warning(f"Invalid BPM range: {value}")
            else:
                # Single value: BPM:120 (allow ±5 BPM tolerance)
                try:
                    bpm = float(value)
                    parsed["bpm_min"] = bpm - 5
                    parsed["bpm_max"] = bpm + 5
                except ValueError:
                    logger.warning(f"Invalid BPM value: {value}")
        
        elif key_lower == "key":
            # Parse key (C, 10B, etc.)
            parsed["key"] = value.upper()
        
        elif key_lower == "name":
            # Name pattern
            parsed["name_pattern"] = value_lower
        
        elif key_lower == "genre":
            # Genre filter
            parsed["genre"] = value_lower
    
    return parsed


def build_sql_filters(parsed: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
    """
    Build SQL WHERE clause and parameters from parsed query.
    
    Args:
        parsed: Parsed query dictionary
        
    Returns:
        Tuple of (WHERE clause, parameters dict)
    """
    where_clauses = []
    params = {}
    
    # Free text search (name/pattern)
    if parsed.get("text"):
        where_clauses.append("(track_id LIKE :text_pattern OR prompt_text LIKE :text_pattern)")
        params["text_pattern"] = f"%{parsed['text']}%"
    
    # Name pattern
    if parsed.get("name_pattern"):
        where_clauses.append("(track_id LIKE :name_pattern OR prompt_text LIKE :name_pattern)")
        params["name_pattern"] = f"%{parsed['name_pattern']}%"
    
    # BPM range
    if parsed.get("bpm_min") is not None:
        where_clauses.append("bpm >= :bpm_min")
        params["bpm_min"] = parsed["bpm_min"]
    
    if parsed.get("bpm_max") is not None:
        where_clauses.append("bpm <= :bpm_max")
        params["bpm_max"] = parsed["bpm_max"]
    
    # Key
    if parsed.get("key"):
        where_clauses.append("key = :key")
        params["key"] = parsed["key"]
    
    # Genre (style_source)
    if parsed.get("genre"):
        where_clauses.append("style_source = :genre")
        params["genre"] = parsed["genre"]
    
    where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    return where_clause, params

