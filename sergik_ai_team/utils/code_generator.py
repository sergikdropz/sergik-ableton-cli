"""
Code Generator for Controller Development
Generates Max for Live JavaScript code
"""

from typing import Dict, Any, List
from ..models import ControllerFeature


class ControllerCodeGenerator:
    """Generates controller code snippets."""
    
    def generate_function(self, feature: ControllerFeature) -> str:
        """Generate function code for a feature."""
        if feature.name == "Chord Generation":
            return self._generate_chord_function()
        elif feature.name == "Bass Generation":
            return self._generate_bass_function()
        elif feature.name == "Drum Generation":
            return self._generate_drum_function()
        elif feature.name == "Track Management":
            return self._generate_track_function()
        else:
            return f"// TODO: Implement {feature.name}\n"
    
    def _generate_chord_function(self) -> str:
        """Generate chord generation function."""
        return """
function generate_chords() {
    var key = this.patcher.getnamed("key_inlet") ? this.patcher.getnamed("key_inlet").message : "10B";
    var bars = this.patcher.getnamed("bars_inlet") ? this.patcher.getnamed("bars_inlet").message : 8;
    
    var url = apiBase + "/generate/chord_progression";
    var payload = {
        key: key,
        progression_type: "i-VI-III-VII",
        bars: bars,
        voicing: "stabs",
        seventh_chords: true,
        tempo: 125
    };
    
    http_request(url, "POST", JSON.stringify(payload), function(result) {
        try {
            var response = JSON.parse(result);
            if (response.status === "ok" && response.notes) {
                insertNotesToClip(response.notes);
                outlet(1, "Generated " + response.count + " chord notes");
            } else {
                outlet(1, "Error: " + (response.error || "Unknown error"));
            }
        } catch(e) {
            outlet(1, "Parse error: " + e);
        }
    });
}
"""
    
    def _generate_bass_function(self) -> str:
        """Generate bass generation function."""
        return """
function generate_bass() {
    var key = this.patcher.getnamed("key_inlet") ? this.patcher.getnamed("key_inlet").message : "10B";
    var style = this.patcher.getnamed("style_inlet") ? this.patcher.getnamed("style_inlet").message : "house";
    
    var url = apiBase + "/generate/walking_bass";
    var payload = {
        key: key,
        chord_progression_type: "i-VI-III-VII",
        style: style,
        bars: 8,
        tempo: 125
    };
    
    http_request(url, "POST", JSON.stringify(payload), function(result) {
        try {
            var response = JSON.parse(result);
            if (response.status === "ok" && response.notes) {
                insertNotesToClip(response.notes);
                outlet(1, "Generated " + response.count + " bass notes");
            }
        } catch(e) {
            outlet(1, "Error: " + e);
        }
    });
}
"""
    
    def _generate_drum_function(self) -> str:
        """Generate drum generation function."""
        return """
function generate_drums() {
    var genre = currentDrumGenre || "tech_house";
    var url = apiBase + "/generate/drums";
    var payload = {
        genre: genre,
        bars: 4,
        tempo: 125,
        swing: swingAmount,
        humanize: humanizeAmount,
        density: densityAmount
    };
    
    http_request(url, "POST", JSON.stringify(payload), function(result) {
        try {
            var response = JSON.parse(result);
            if (response.status === "ok" && response.pattern) {
                insertDrumPattern(response.pattern);
                outlet(1, "Generated " + genre + " drum pattern");
            }
        } catch(e) {
            outlet(1, "Error: " + e);
        }
    });
}
"""
    
    def _generate_track_function(self) -> str:
        """Generate track management function."""
        return """
function create_track(type, name) {
    type = type || "midi";
    name = name || "New Track";
    
    var url = apiBase + "/live/tracks/create";
    var payload = {
        track_type: type,
        name: name
    };
    
    http_request(url, "POST", JSON.stringify(payload), function(result) {
        try {
            var response = JSON.parse(result);
            if (response.status === "ok") {
                outlet(1, "Created " + type + " track: " + name);
                refreshTracks();
            }
        } catch(e) {
            outlet(1, "Error: " + e);
        }
    });
}
"""

