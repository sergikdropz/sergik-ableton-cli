"""
Controller Code Analyzer
Analyzes Max for Live controller code and provides insights
"""

import re
from pathlib import Path
from typing import List, Dict, Any
from ..models import ControllerAnalysis, ControllerFeature


class ControllerAnalyzer:
    """Analyzes controller JavaScript code."""
    
    def __init__(self, code_path: Path):
        """Initialize analyzer with code path."""
        self.code_path = code_path
        self.code = ""
        if code_path.exists():
            self.code = code_path.read_text(encoding='utf-8')
    
    def analyze(self) -> ControllerAnalysis:
        """Analyze controller code."""
        commands = self._extract_commands()
        functions = self._extract_functions()
        implemented = self._find_implemented_features()
        missing = self._find_missing_features(commands)
        suggestions = self._generate_suggestions()
        
        return ControllerAnalysis(
            total_commands=len(commands),
            implemented_features=implemented,
            missing_features=missing,
            code_suggestions=suggestions,
            test_coverage=0.0  # Could calculate from test files
        )
    
    def _extract_commands(self) -> List[str]:
        """Extract command names from code."""
        # Look for function definitions like: function generate_chords()
        pattern = r'function\s+(\w+)\s*\('
        return re.findall(pattern, self.code)
    
    def _extract_functions(self) -> List[str]:
        """Extract all function names."""
        pattern = r'(\w+)\s*[:=]\s*function|function\s+(\w+)'
        matches = re.findall(pattern, self.code)
        return [m[0] or m[1] for m in matches]
    
    def _find_implemented_features(self) -> List[str]:
        """Find implemented features."""
        features = []
        
        # Check for generation features
        if 'generate_chords' in self.code:
            features.append("Chord Generation")
        if 'generate_bass' in self.code:
            features.append("Bass Generation")
        if 'generate_drums' in self.code:
            features.append("Drum Generation")
        
        # Check for Ableton control
        if 'create_track' in self.code:
            features.append("Track Management")
        if 'load_device' in self.code:
            features.append("Device Control")
        if 'fire_clip' in self.code:
            features.append("Clip Management")
        
        return features
    
    def _find_missing_features(self, commands: List[str]) -> List[str]:
        """Find missing features based on expected commands."""
        expected = [
            "generate_chords", "generate_bass", "generate_arps",
            "create_track", "delete_track", "load_device",
            "fire_clip", "set_tempo", "search_library"
        ]
        return [cmd for cmd in expected if cmd not in commands]
    
    def _generate_suggestions(self) -> List[str]:
        """Generate code improvement suggestions."""
        suggestions = []
        
        # Check for error handling
        if 'try' not in self.code or 'catch' not in self.code:
            suggestions.append("Add error handling with try-catch blocks")
        
        # Check for logging
        if 'post(' not in self.code.lower():
            suggestions.append("Add logging/debugging output")
        
        # Check for API error handling
        if 'status' not in self.code.lower() or 'error' not in self.code.lower():
            suggestions.append("Add API response status checking")
        
        return suggestions
    
    def get_feature_list(self) -> List[ControllerFeature]:
        """Get list of features with status."""
        features = []
        implemented = self._find_implemented_features()
        
        feature_map = {
            "Chord Generation": ["generate_chords"],
            "Bass Generation": ["generate_bass"],
            "Drum Generation": ["generate_drums", "drums"],
            "Track Management": ["create_track", "delete_track", "get_tracks"],
            "Device Control": ["load_device", "set_param", "get_devices"],
            "Clip Management": ["fire_clip", "create_clip", "get_clip_notes"],
        }
        
        for feature_name, commands in feature_map.items():
            status = "implemented" if feature_name in implemented else "pending"
            features.append(ControllerFeature(
                name=feature_name,
                description=f"Controller feature: {feature_name}",
                commands=commands,
                status=status
            ))
        
        return features

