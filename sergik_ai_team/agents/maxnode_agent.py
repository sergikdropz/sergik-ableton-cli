"""
MaxNode Agent - Max for Live Device Specialist
Enhanced with SERGIK workflow knowledge
"""

from typing import Dict, Any
from ..models import Message
from ..config import CONTROLLER_CODE_PATH
from ..utils.controller_analyzer import ControllerAnalyzer
from ..utils.knowledge_base import get_knowledge_base


async def maxnode_handler(msg: Message) -> str:
    """Handle MaxNode requests - M4L device development with SERGIK knowledge."""
    content = msg.content.lower()
    kb = get_knowledge_base()
    workflow = kb.get_workflow_info()
    
    if "schema" in content or "device" in content:
        return """Max for Live Device Schema:
{
  "device_name": "SERGIK AI Controller",
  "inlets": 6,
  "outlets": 4,
  "parameters": [
    {"name": "key", "type": "symbol", "default": "10B"},
    {"name": "bars", "type": "int", "default": 8},
    {"name": "style", "type": "symbol", "default": "tech_house"},
    {"name": "tempo", "type": "float", "default": 125.0}
  ],
  "commands": ["generate_chords", "generate_bass", "create_track", ...],
  "sergik_defaults": {
    "bpm": 125,
    "key": "10B",
    "style": "tech_house"
  }
}"""
    
    elif "analyze" in content:
        analyzer = ControllerAnalyzer(CONTROLLER_CODE_PATH)
        analysis = analyzer.analyze()
        return f"""M4L Controller Analysis:
- Commands: {analysis.total_commands}
- Features: {len(analysis.implemented_features)}
- Status: {'✅ Ready' if analysis.total_commands > 0 else '⚠️ Needs implementation'}"""
    
    elif "generate" in content and "patch" in content:
        return """Max Patch Structure:
[js SERGIK_AI_Controller.js]
  |
  ├─ [inlet 0] → commands (generate_chords, create_track, etc.)
  ├─ [inlet 1] → key (10B, 11B, 7A, 8A - SERGIK's primary keys)
  ├─ [inlet 2] → bars (default: 8)
  ├─ [inlet 3] → style (tech_house, house, funk - SERGIK styles)
  ├─ [inlet 4] → voicing (stabs, pads)
  ├─ [inlet 5] → pattern (up, down, random)
  |
  └─ [outlet 0] → MIDI notes
  └─ [outlet 1] → status messages
  └─ [outlet 2] → note data
  └─ [outlet 3] → JSON responses"""
    
    elif "sergik" in content or "workflow" in content:
        return f"""SERGIK M4L Workflow:
🎛️ Default Instrument: {workflow.get('default_instrument', 'N/A')}
🎚️ Default Effect: {workflow.get('default_effect', 'N/A')}
📊 Stem Count: {workflow.get('stem_count', 7)}
🔧 Processing: {' → '.join(workflow.get('processing_chain', []))}
📁 Templates: {', '.join(workflow.get('templates', [])[:2])}"""
    
    return """MaxNode ready - commands:
- schema: Get device schema with SERGIK defaults
- analyze: Analyze controller code
- generate patch: Get patch structure
- sergik workflow: Show SERGIK M4L workflow"""

