"""
GrooveSense Agent - Audio Analysis Specialist
Enhanced with SERGIK DNA knowledge
"""

import re
from ..bridge import get_bridge, is_available
from ..models import Message
from ..utils.knowledge_base import get_knowledge_base

async def groovesense_handler(msg: Message) -> str:
    """Handle GrooveSense requests with SERGIK DNA matching."""
    if not is_available():
        return "SERGIK ML services not available"
    
    bridge = get_bridge()
    analysis_service = bridge.get_analysis_service()
    track_service = bridge.get_track_service()
    kb = get_knowledge_base()
    dna = kb.get_musical_dna()
    
    content = msg.content.lower()
    
    if "analyze" in content:
        url_match = re.search(r'https?://\S+', msg.content)
        if url_match:
            url = url_match.group(0)
            result = analysis_service.analyze_audio(url=url)
            
            bpm = result.get('bpm', 0)
            key = result.get('key', '')
            energy = result.get('energy', 0)
            
            # SERGIK DNA matching
            bpm_match = "✅ In SERGIK sweet spot" if 122 <= bpm <= 126 else "⚠️ Outside sweet spot (122-126 BPM)"
            key_match = "✅ Primary key" if key in ['10B', '11B', '7A', '8A'] else "⚠️ Not primary"
            energy_match = "✅ Optimal" if 5 <= energy <= 7 else "⚠️ Outside optimal range (5-7)"
            
            return f"""Analysis Results:
🎵 BPM: {bpm} - {bpm_match}
🎹 Key: {key} - {key_match}
⚡ Energy: {energy}/10 - {energy_match}

📊 SERGIK DNA Profile:
- BPM Zones: 80-88 (downtempo) or 122-126 (tech house)
- Top Keys: 10B (31%), 11B (21%), 7A (13%), 8A (12%)
- Energy Sweet Spot: 5-7 (91% of catalog)"""
    
    elif "similar" in content:
        track_match = re.search(r'track[_\s]*id[:\s]*(\w+)', content)
        if track_match:
            track_id = track_match.group(1)
            results = track_service.find_similar(track_id=track_id, k=5)
            return f"""Found {len(results.get('similar', []))} similar tracks
🎵 Using SERGIK's vector similarity search
📊 Matching by: BPM, key, energy, style DNA"""
    
    elif "dna" in content or "profile" in content:
        return f"""SERGIK Musical DNA:
🎵 BPM Zones: {dna.get('bpm_zones', {}).get('primary_2', 'N/A')}
🎹 Top Keys: {dna.get('top_keys', {}).get('10B', 'N/A')}
⚡ Energy: {dna.get('energy_profile', {}).get('peak_range', 'N/A')}
🎨 Genre: {dna.get('genre_fusion', 'N/A')}"""
    
    return """GrooveSense ready - commands:
- analyze [url]: Analyze audio with SERGIK DNA matching
- similar [track_id]: Find similar tracks
- dna: Show SERGIK musical DNA profile"""

