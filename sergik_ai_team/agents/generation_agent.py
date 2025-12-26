"""
VSTCraft Agent - Music Generation Specialist
Enhanced with SERGIK style knowledge
"""

import re
from typing import Dict, Any
from ..bridge import get_bridge, is_available
from ..models import Message
from ..utils.knowledge_base import get_knowledge_base


def extract_key(text: str) -> str:
    """Extract musical key from text - defaults to SERGIK's primary key."""
    keys = ["10B", "11B", "7A", "8A", "C", "D", "E", "F", "G", "A", "B"]
    for key in keys:
        if key.lower() in text.lower():
            return key
    # Default to SERGIK's most common key (D major / 10B)
    return "10B"


def extract_bars(text: str) -> int:
    """Extract bar count from text."""
    match = re.search(r'(\d+)\s*bars?', text)
    return int(match.group(1)) if match else 8


def extract_style(text: str) -> str:
    """Extract style from text - defaults to SERGIK's primary style."""
    styles = ["house", "tech_house", "techno", "jazz", "hiphop", "trap", "dnb", "funk", "disco"]
    for style in styles:
        if style in text.lower():
            return style
    # Default to SERGIK's primary style (tech house)
    return "tech_house"


def get_sergik_tempo() -> float:
    """Get SERGIK's preferred tempo from knowledge base."""
    kb = get_knowledge_base()
    dna = kb.get_musical_dna()
    # SERGIK's sweet spot is 122-126 BPM for house/tech house
    return 125.0


async def vstcraft_handler(msg: Message) -> str:
    """Handle VSTCraft requests - leverages GenerationService with SERGIK knowledge."""
    if not is_available():
        return "SERGIK ML services not available"
    
    bridge = get_bridge()
    gen_service = bridge.get_generation_service()
    kb = get_knowledge_base()
    
    content = msg.content.lower()
    
    # Get SERGIK style knowledge
    style_info = kb.get_style_signature()
    dna = kb.get_musical_dna()
    
    try:
        if "chord" in content or "progression" in content:
            key = extract_key(msg.content)
            bars = extract_bars(msg.content)
            tempo = get_sergik_tempo()
            
            # Use SERGIK's preferred voicing (stabs for tech house)
            voicing = "stabs" if "pad" not in content else "pads"
            
            notes = gen_service.generate_chords(
                key=key,
                progression_type="i-VI-III-VII",  # SERGIK's common progression
                bars=bars,
                voicing=voicing,
                tempo=tempo
            )
            
            # Send status to Ableton
            bridge.send_osc("/scp/status", {
                "text": f"Generated {len(notes)} chord notes in {key} ({tempo} BPM)"
            })
            
            return f"""✅ Generated {len(notes)} chord notes in {key} ({bars} bars, {tempo} BPM)
📊 SERGIK Style: {style_info.get('production_philosophy', 'Groove-first')}
🎹 Key {key} is {'primary' if key in ['10B', '11B'] else 'compatible'} in SERGIK's catalog"""
        
        elif "bass" in content:
            key = extract_key(msg.content)
            style = extract_style(msg.content)
            bars = extract_bars(msg.content)
            tempo = get_sergik_tempo()
            
            notes = gen_service.generate_bass(
                key=key,
                chord_progression_type="i-VI-III-VII",
                style=style,
                bars=bars,
                tempo=tempo
            )
            
            return f"""✅ Generated {len(notes)} {style} bass notes in {key}
🎵 Style: {style} aligns with SERGIK's {'tech house' if style == 'tech_house' else 'groove-first'} approach"""
        
        elif "drum" in content:
            genre = extract_style(msg.content) or "tech_house"
            tempo = get_sergik_tempo()
            
            result = gen_service.generate_drums(
                genre=genre,
                bars=4,
                tempo=tempo,
                swing=0,
                humanize=0,
                density=1.0
            )
            
            return f"""✅ Generated {genre} drum pattern at {tempo} BPM
🥁 SERGIK's sweet spot: 120-127 BPM (tech house primary)"""
        
        elif "arpeggio" in content or "arp" in content:
            key = extract_key(msg.content)
            pattern = "up" if "up" in content else "down" if "down" in content else "random"
            tempo = get_sergik_tempo()
            
            notes = gen_service.generate_arpeggios(
                key=key,
                chord_progression_type="i-VI-III-VII",
                pattern=pattern,
                speed=0.25,
                octaves=2,
                bars=4,
                tempo=tempo
            )
            
            return f"""✅ Generated {pattern} arpeggios in {key}
🎹 Multi-layer melodic architecture (SERGIK signature)"""
        
        elif "sergik" in content or "style" in content or "signature" in content:
            return f"""SERGIK Style Signature:
🎵 BPM Sweet Spot: {style_info.get('bpm_sweet_spot', '120-127 BPM')}
🎹 Primary Keys: {', '.join(style_info.get('primary_keys', [])[:4])}
🎨 Philosophy: {style_info.get('production_philosophy', 'Groove-first')}
📊 Characteristics: {', '.join(style_info.get('characteristics', [])[:3])}"""
        
        else:
            return """VSTCraft ready - specify:
- chords [in key] [bars]: Generate chord progression (default: 10B, SERGIK's primary key)
- bass [style] [in key]: Generate bass line (default: tech_house, 10B)
- drums [genre]: Generate drum pattern (default: tech_house, 125 BPM)
- arpeggios [pattern] [in key]: Generate arpeggios
- sergik style: Show SERGIK's style signature"""
    
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        error_type = type(e).__name__
        error_msg = str(e)
        
        logger.error(
            "vstcraft_error",
            error_type=error_type,
            error_message=error_msg,
            content=msg.content[:100],  # Log first 100 chars
            exc_info=True
        )
        
        # Provide more helpful error messages
        if "not available" in error_msg.lower() or "unavailable" in error_msg.lower():
            return f"❌ SERGIK ML services are currently unavailable. Please ensure the SERGIK ML API is running."
        elif "timeout" in error_msg.lower():
            return f"❌ Request timed out. The generation service may be overloaded. Please try again."
        elif "key" in error_msg.lower() or "invalid" in error_msg.lower():
            return f"❌ Invalid input: {error_msg}. Please check your request parameters."
        else:
            return f"❌ Error generating music: {error_msg}. Please try again or contact support."

