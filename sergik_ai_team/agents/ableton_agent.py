"""
AbleAgent - Ableton Live Bridge Specialist
Enhanced with SERGIK workflow knowledge
"""

import re
from typing import Dict, Any
from ..bridge import get_bridge, is_available
from ..models import Message
from ..utils.knowledge_base import get_knowledge_base
from ..utils.plugin_knowledge import get_plugin_knowledge_base


async def ableagent_handler(msg: Message) -> str:
    """Handle AbleAgent requests with SERGIK workflow knowledge."""
    if not is_available():
        return "SERGIK ML services not available"
    
    bridge = get_bridge()
    ableton_service = bridge.get_ableton_service()
    state_service = bridge.get_state_service()
    kb = get_knowledge_base()
    workflow = kb.get_workflow_info()
    dna = kb.get_musical_dna()
    
    content = msg.content.lower()
    
    try:
        if "tempo" in content:
            bpm_match = re.search(r'(\d+)', msg.content)
            if bpm_match:
                bpm = float(bpm_match.group(1))
                ableton_service.execute_command("live.set_tempo", {"tempo": bpm})
                bridge.send_osc("/scp/status", {"text": f"Tempo set to {bpm} BPM"})
                
                # Provide SERGIK context
                sweet_spot = "122-126 BPM" if 122 <= bpm <= 126 else "outside SERGIK's sweet spot"
                return f"""✅ Set tempo to {bpm} BPM
📊 SERGIK Sweet Spot: {sweet_spot}
🎵 Primary Zones: 80-88 BPM (downtempo) or 122-126 BPM (tech house)"""
        
        elif "play" in content:
            ableton_service.execute_command("live.play", {})
            return "✅ Started playback"
        
        elif "stop" in content:
            ableton_service.execute_command("live.stop", {})
            return "✅ Stopped playback"
        
        elif "state" in content or "status" in content:
            state = state_service.get_session_state()
            if state:
                return f"""Session State:
- Tempo: {state.tempo} BPM
- Playing: {state.is_playing}
- Recording: {state.is_recording}
- Tracks: {state.track_count}
- Scenes: {state.scene_count}"""
            return "No active session state"
        
        elif "track" in content and "create" in content:
            track_type = "midi" if "midi" in content else "audio"
            ableton_service.execute_command("live.create_track", {
                "track_type": track_type
            })
            
            # SERGIK workflow context
            default_instrument = workflow.get('default_instrument', 'Cut Rugs Sampler Cheats2')
            return f"""✅ Created {track_type} track
🎛️ SERGIK Default: {default_instrument}
📊 Standard Setup: Gate + Multiband Dynamics per stem"""
        
        elif "device" in content and "load" in content:
            # Extract device name
            device_match = re.search(r'load\s+([A-Za-z0-9\s]+)', content)
            if device_match:
                device_name = device_match.group(1).strip()
                ableton_service.execute_command("live.add_device", {
                    "track_index": 0,
                    "device_name": device_name
                })
                
                # Provide plugin info if available
                plugin_kb = get_plugin_knowledge_base()
                plugin = plugin_kb.get_plugin(device_name)
                if plugin:
                    return f"""✅ Loading {device_name} on track 0
📊 {plugin.description}
🎛️ Type: {plugin.type} | Category: {plugin.category}
{f'💡 SERGIK Usage: {plugin.sergik_usage}' if plugin.sergik_usage else ''}"""
                return f"✅ Loading {device_name} on track 0"
        
        elif "template" in content or "workflow" in content:
            templates = workflow.get('templates', [])
            return f"""SERGIK Templates Available:
📁 {chr(10).join(['- ' + t for t in templates])}
🎛️ Default Instrument: {workflow.get('default_instrument', 'N/A')}
🎚️ Default Effect: {workflow.get('default_effect', 'N/A')}
📊 Stem Architecture: {workflow.get('stem_count', 7)} stems"""
        
        elif "stem" in content:
            stem_types = workflow.get('stem_types', [])
            return f"""SERGIK Stem Architecture:
📊 Standard: {workflow.get('stem_count', 7)} stems
🎵 Types: {', '.join(stem_types)}
🔧 Processing: {' → '.join(workflow.get('processing_chain', []))}"""
        
        elif "plugin" in content or "device" in content and "info" in content:
            # Extract plugin name
            plugin_match = re.search(r'(?:plugin|device)\s+([A-Za-z0-9\s]+)', content)
            if plugin_match:
                plugin_name = plugin_match.group(1).strip()
                plugin_kb = get_plugin_knowledge_base()
                plugin = plugin_kb.get_plugin(plugin_name)
                if plugin:
                    return f"""Plugin: {plugin.name}
🏭 Manufacturer: {plugin.manufacturer}
📊 Type: {plugin.type} | Category: {plugin.category}
📝 Description: {plugin.description}
🎛️ Parameters: {', '.join(plugin.parameters[:5])}
💡 Uses: {', '.join(plugin.common_uses[:3])}
{f'🎯 SERGIK Usage: {plugin.sergik_usage}' if plugin.sergik_usage else ''}"""
                else:
                    # Try search
                    results = plugin_kb.search_plugins(plugin_name)
                    if results:
                        return f"Found {len(results)} plugins matching '{plugin_name}':\n" + "\n".join([f"- {p.name} ({p.manufacturer})" for p in results[:5]])
                    return f"Plugin '{plugin_name}' not found in knowledge base"
        
        elif "plugins" in content or "devices" in content:
            plugin_kb = get_plugin_knowledge_base()
            critical = plugin_kb.get_critical_plugins()
            sergik_plugins = plugin_kb.get_sergik_plugins()
            
            return f"""Plugin Knowledge Base:
🎯 Critical SERGIK Plugins ({len(critical)}):
{chr(10).join([f'- {p.name}: {p.description[:50]}...' for p in critical[:5]])}

🎛️ SERGIK Custom Devices ({len(sergik_plugins)}):
{chr(10).join([f'- {p.name}' for p in sergik_plugins if p.manufacturer == 'SERGIK'])}"""
        
        else:
            return """AbleAgent ready - commands:
- tempo [bpm]: Set tempo (SERGIK sweet spot: 122-126 BPM)
- play: Start playback
- stop: Stop playback
- state: Get session state
- create track [midi/audio]: Create track (with SERGIK defaults)
- load device [name]: Load device
- template: Show SERGIK templates
- stem: Show stem architecture"""
    
    except Exception as e:
        return f"❌ Error: {str(e)}"

