"""
Controller Development Agent
Helps engineer and develop the SERGIK AI Controller
Enhanced with SERGIK API knowledge
"""

import re
from typing import Dict, Any
from pathlib import Path
from ..bridge import get_bridge, is_available
from ..models import Message
from ..config import CONTROLLER_CODE_PATH
from ..utils.controller_analyzer import ControllerAnalyzer
from ..utils.code_generator import ControllerCodeGenerator
from ..utils.knowledge_base import get_knowledge_base


async def controller_dev_handler(msg: Message) -> str:
    """Handle controller development requests with SERGIK knowledge."""
    content = msg.content.lower()
    
    analyzer = ControllerAnalyzer(CONTROLLER_CODE_PATH)
    generator = ControllerCodeGenerator()
    kb = get_knowledge_base()
    workflow = kb.get_workflow_info()
    
    if "analyze" in content or "status" in content:
        analysis = analyzer.analyze()
        return f"""Controller Analysis:
- Total Commands: {analysis.total_commands}
- Implemented Features: {len(analysis.implemented_features)}
- Missing Features: {len(analysis.missing_features)}
- Suggestions: {len(analysis.code_suggestions)}

Implemented: {', '.join(analysis.implemented_features[:5])}
Missing: {', '.join(analysis.missing_features[:5])}

📊 SERGIK Integration:
- API Endpoint: http://127.0.0.1:8000
- OSC Port: 9000
- Default Tempo: 125 BPM (SERGIK sweet spot)
- Primary Keys: 10B, 11B, 7A, 8A"""
    
    elif "generate" in content and "code" in content:
        # Extract feature name
        feature_match = re.search(r'(chord|bass|drum|track)', content)
        if feature_match:
            feature_type = feature_match.group(1)
            if feature_type == "chord":
                code = generator._generate_chord_function()
            elif feature_type == "bass":
                code = generator._generate_bass_function()
            elif feature_type == "drum":
                code = generator._generate_drum_function()
            elif feature_type == "track":
                code = generator._generate_track_function()
            else:
                return "Unknown feature type"
            
            return f"Generated code for {feature_type}:\n```javascript\n{code}\n```"
    
    elif "suggest" in content or "improve" in content:
        analysis = analyzer.analyze()
        suggestions = "\n".join([f"- {s}" for s in analysis.code_suggestions[:5]])
        return f"Code Improvement Suggestions:\n{suggestions}"
    
    elif "features" in content:
        features = analyzer.get_feature_list()
        feature_list = "\n".join([
            f"- {f.name}: {f.status} ({len(f.commands)} commands)"
            for f in features
        ])
        return f"Controller Features:\n{feature_list}"
    
    elif "test" in content:
        return """Controller Testing Suggestions:
1. Test each command with valid inputs
2. Test error handling with invalid inputs
3. Test API connectivity (http://127.0.0.1:8000)
4. Test OSC communication (port 9000)
5. Test MIDI output
6. Test SERGIK defaults (10B key, 125 BPM, tech_house style)
7. Test multi-layer generation (SERGIK signature)"""
    
    elif "api" in content or "endpoints" in content:
        return """SERGIK ML API Endpoints:
🎵 Generation:
  POST /generate/chord_progression
  POST /generate/walking_bass
  POST /generate/drums
  POST /generate/arpeggios

🎛️ Ableton Control:
  POST /live/tracks/create
  POST /live/tracks/{index}/update
  POST /live/devices/add
  POST /live/clips/fire

📊 Analysis:
  POST /analyze/upload
  POST /analyze/url
  GET /tracks/similar/{track_id}

🔧 Defaults:
  Tempo: 125 BPM (SERGIK sweet spot)
  Key: 10B (D major - SERGIK's primary)
  Style: tech_house"""
    
    elif "sergik" in content or "integration" in content:
        return f"""SERGIK Integration Guide:
🎛️ Workflow: {workflow.get('default_instrument', 'N/A')}
📊 Stem Architecture: {workflow.get('stem_count', 7)} stems
🔧 Processing: {' → '.join(workflow.get('processing_chain', []))}
📁 Templates: {', '.join(workflow.get('templates', [])[:2])}

🎵 Style Defaults:
- BPM: 125 (sweet spot: 122-126)
- Key: 10B (D major - 31% of catalog)
- Style: tech_house (primary genre)"""
    
    return """ControllerDev ready - commands:
- analyze: Analyze controller code with SERGIK context
- generate code [chord/bass/drum/track]: Generate code snippet
- suggest: Get improvement suggestions
- features: List all features
- test: Get testing suggestions
- api: Show SERGIK API endpoints
- sergik integration: Show integration guide"""

