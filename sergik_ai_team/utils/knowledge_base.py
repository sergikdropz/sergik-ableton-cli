"""
Knowledge Base Accessor
Loads and queries SERGIK knowledge base for agent context
"""

import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from functools import lru_cache
from cachetools import TTLCache
import re
from ..config import KNOWLEDGE_PATH, BASE_DIR

# Lazy import to avoid circular dependencies
def _get_plugin_kb():
    from .plugin_knowledge import get_plugin_knowledge_base
    return get_plugin_knowledge_base()


class KnowledgeBase:
    """Knowledge base accessor for SERGIK AI."""
    
    def __init__(self):
        """Initialize knowledge base."""
        self.chunks: List[Dict[str, Any]] = []
        self.markdown_files: Dict[str, str] = {}
        # Cache for search results (TTL: 5 minutes)
        self._search_cache: TTLCache = TTLCache(maxsize=100, ttl=300)
        # Cache for domain knowledge (TTL: 1 hour)
        self._domain_cache: TTLCache = TTLCache(maxsize=50, ttl=3600)
        self._load_knowledge()
    
    def _load_knowledge(self):
        """Load knowledge chunks and markdown files."""
        # Load JSONL chunks
        if KNOWLEDGE_PATH.exists():
            with open(KNOWLEDGE_PATH, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        try:
                            chunk = json.loads(line)
                            self.chunks.append(chunk)
                        except json.JSONDecodeError:
                            continue
        
        # Load markdown files
        knowledge_dir = BASE_DIR / "knowledge"
        if knowledge_dir.exists():
            for md_file in knowledge_dir.glob("*.md"):
                try:
                    content = md_file.read_text(encoding='utf-8')
                    self.markdown_files[md_file.stem] = content
                except Exception:
                    continue
    
    def search(self, query: str, limit: int = 5, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Search knowledge base for relevant chunks with caching.
        
        Args:
            query: Search query
            limit: Maximum number of results
            use_cache: Use cached results if available
            
        Returns:
            List of matching chunks
        """
        # Check cache
        cache_key = f"{query.lower()}:{limit}"
        if use_cache and cache_key in self._search_cache:
            return self._search_cache[cache_key]
        
        query_lower = query.lower()
        results = []
        
        for chunk in self.chunks:
            score = 0
            text = chunk.get("text", "").lower()
            tags = [t.lower() for t in chunk.get("tags", [])]
            
            # Score by tag matches
            for tag in tags:
                if tag in query_lower:
                    score += 3
            
            # Score by text matches
            if query_lower in text:
                score += 2
            
            # Score by word matches
            query_words = query_lower.split()
            for word in query_words:
                if word in text:
                    score += 1
            
            if score > 0:
                results.append((score, chunk))
        
        # Sort by score and return top results
        results.sort(key=lambda x: x[0], reverse=True)
        final_results = [chunk for _, chunk in results[:limit]]
        
        # Cache results
        if use_cache:
            self._search_cache[cache_key] = final_results
        
        return final_results
    
    def get_domain_knowledge(self, domain: str, use_cache: bool = True) -> str:
        """
        Get domain-specific knowledge with caching.
        
        Args:
            domain: Domain name (style, quality, workflow, etc.)
            use_cache: Use cached result if available
            
        Returns:
            Domain knowledge content
        """
        # Check cache
        if use_cache and domain.lower() in self._domain_cache:
            return self._domain_cache[domain.lower()]
        
        domain_map = {
            "style": "01_style_signature",
            "quality": "02_quality_standards",
            "workflow": "03_workflow_templates",
            "dna": "05_musical_dna",
            "architecture": "06_system_architecture",
            "overview": "00_overview",
        }
        
        file_key = domain_map.get(domain.lower())
        result = ""
        if file_key and file_key in self.markdown_files:
            result = self.markdown_files[file_key]
        
        # Cache result
        if use_cache:
            self._domain_cache[domain.lower()] = result
        
        return result
    
    def get_style_signature(self) -> Dict[str, Any]:
        """Get SERGIK style signature."""
        content = self.get_domain_knowledge("style")
        if not content:
            return {}
        
        return {
            "bpm_sweet_spot": "120-127 BPM",
            "primary_keys": ["10B (D major)", "11B (A major)", "7A (D minor)", "8A (A minor)"],
            "production_philosophy": "Groove-first with multi-layer melodic architecture",
            "characteristics": [
                "Groove-first philosophy",
                "Multi-layer melodic architecture (3+ layers)",
                "Spectral separation processing",
                "Gate-tight transients",
                "Send/Return as compositional elements",
                "Stem-ready architecture (7 stems)"
            ]
        }
    
    def get_quality_standards(self) -> Dict[str, Any]:
        """Get quality standards."""
        content = self.get_domain_knowledge("quality")
        if not content:
            return {}
        
        return {
            "master_quality": {
                "format": "WAV PCM uncompressed",
                "sample_rate": "44.1 kHz or 48 kHz",
                "bit_depth": "24-bit",
                "channels": "Stereo (2-channel)"
            },
            "loudness_target": "-14 to -10 LUFS integrated",
            "duration_optimal": "2:00 - 8:00 minutes",
            "dynamic_range": "> 6 dB"
        }
    
    def get_workflow_info(self) -> Dict[str, Any]:
        """Get workflow information."""
        content = self.get_domain_knowledge("workflow")
        if not content:
            return {}
        
        return {
            "templates": [
                "SERGIK Template V2",
                "SERG 12.3",
                "SERG 12.3-1"
            ],
            "default_instrument": "Cut Rugs Sampler Cheats2",
            "default_effect": "Sergik IO channel strip",
            "stem_count": 7,
            "stem_types": ["Vocals", "Drums", "Bass", "Guitars", "Keys", "Percussion", "Other"],
            "processing_chain": ["Simpler/Sampler", "Gate", "Multiband Dynamics"]
        }
    
    def get_musical_dna(self) -> Dict[str, Any]:
        """Get musical DNA profile."""
        content = self.get_domain_knowledge("dna")
        if not content:
            return {}
        
        return {
            "bpm_zones": {
                "primary_1": "80-88 BPM (Downtempo/Hip-Hop) - 41%",
                "primary_2": "122-126 BPM (House/Tech) - 32%"
            },
            "top_keys": {
                "10B": "D major - 31%",
                "11B": "A major - 21%",
                "7A": "D minor - 13%",
                "8A": "A minor - 12%"
            },
            "energy_profile": {
                "peak_range": "Level 5-7 (91% of tracks)",
                "average": "6/10",
                "style": "Mid-energy groove focus"
            },
            "genre_fusion": "Hip-Hop foundation + House energy + Funk/Soul textures"
        }
    
    def get_plugin_info(self, plugin_name: str) -> Optional[Dict[str, Any]]:
        """Get plugin information."""
        plugin_kb = _get_plugin_kb()
        plugin = plugin_kb.get_plugin(plugin_name)
        if plugin:
            return {
                "name": plugin.name,
                "manufacturer": plugin.manufacturer,
                "type": plugin.type,
                "category": plugin.category,
                "description": plugin.description,
                "parameters": plugin.parameters,
                "common_uses": plugin.common_uses,
                "sergik_usage": plugin.sergik_usage
            }
        return None
    
    def search_plugins(self, query: str) -> List[Dict[str, Any]]:
        """Search plugins."""
        plugin_kb = _get_plugin_kb()
        plugins = plugin_kb.search_plugins(query)
        return [
            {
                "name": p.name,
                "manufacturer": p.manufacturer,
                "type": p.type,
                "category": p.category,
                "description": p.description,
                "sergik_usage": p.sergik_usage
            }
            for p in plugins
        ]


# Global knowledge base instance
_kb: Optional[KnowledgeBase] = None


def get_knowledge_base() -> KnowledgeBase:
    """Get global knowledge base instance."""
    global _kb
    if _kb is None:
        _kb = KnowledgeBase()
    return _kb

