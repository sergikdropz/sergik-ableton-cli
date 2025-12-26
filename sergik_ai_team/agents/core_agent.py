"""
SergikCore Agent - Master Orchestrator
Enhanced with knowledge base routing
"""

import logging
from typing import Dict, Any
from ..models import Message, AgentResponse
from ..bridge import is_available
from ..utils.knowledge_base import get_knowledge_base

logger = logging.getLogger(__name__)


async def sergik_core_handler(msg: Message, agent_map: Dict) -> str:
    """
    Master orchestrator - routes to appropriate agents.
    
    Args:
        msg: Message to route
        agent_map: Map of available agents
        
    Returns:
        Response from routed agent or help message
    """
    content = msg.content.lower()
    
    try:
        # Route to appropriate agent
        if "generate" in content or "create" in content or "chord" in content or "bass" in content or "drum" in content:
            if "VSTCraft" in agent_map:
                vst_msg = Message(
                    sender="SergikCore",
                    receiver="VSTCraft",
                    content=msg.content
                )
                agent = agent_map["VSTCraft"]
                return await agent.handle(vst_msg)
        
        elif "ableton" in content or "live" in content or "tempo" in content or "track" in content:
            if "AbleAgent" in agent_map:
                able_msg = Message(
                    sender="SergikCore",
                    receiver="AbleAgent",
                    content=msg.content
                )
                agent = agent_map["AbleAgent"]
                return await agent.handle(able_msg)
        
        elif "analyze" in content or "bpm" in content or "key" in content:
            if "GrooveSense" in agent_map:
                groove_msg = Message(
                    sender="SergikCore",
                    receiver="GrooveSense",
                    content=msg.content
                )
                agent = agent_map["GrooveSense"]
                return await agent.handle(groove_msg)
        
        elif "controller" in content or "code" in content or "develop" in content:
            if "ControllerDev" in agent_map:
                dev_msg = Message(
                    sender="SergikCore",
                    receiver="ControllerDev",
                    content=msg.content
                )
                agent = agent_map["ControllerDev"]
                return await agent.handle(dev_msg)
        
        elif "max" in content or "m4l" in content or "device" in content:
            if "MaxNode" in agent_map:
                max_msg = Message(
                    sender="SergikCore",
                    receiver="MaxNode",
                    content=msg.content
                )
                agent = agent_map["MaxNode"]
                return await agent.handle(max_msg)
        
        elif "train" in content or "fine-tune" in content:
            if "AuralBrain" in agent_map:
                aural_msg = Message(
                    sender="SergikCore",
                    receiver="AuralBrain",
                    content=msg.content
                )
                agent = agent_map["AuralBrain"]
                return await agent.handle(aural_msg)
            return "Training orchestration: AuralBrain loading fine-tune dataset, Memoria providing context."
        
        elif "knowledge" in content or "memoria" in content or "search" in content:
            if "Memoria" in agent_map:
                memoria_msg = Message(
                    sender="SergikCore",
                    receiver="Memoria",
                    content=msg.content
                )
                agent = agent_map["Memoria"]
                return await agent.handle(memoria_msg)
        
        elif "sergik" in content or "style" in content or "dna" in content:
            # Provide quick SERGIK overview
            kb = get_knowledge_base()
            style = kb.get_style_signature()
            dna = kb.get_musical_dna()
            return f"""SERGIK AI Overview:
🎵 Style: {style.get('production_philosophy', 'N/A')}
🎹 BPM: {style.get('bpm_sweet_spot', 'N/A')}
🎨 Keys: {', '.join(style.get('primary_keys', [])[:3])}
📊 DNA: {dna.get('genre_fusion', 'N/A')}
⚡ Energy: {dna.get('energy_profile', {}).get('peak_range', 'N/A')}"""
        
        return """SergikCore orchestrating - specify:
- generate [chords/bass/drums]: Music generation (VSTCraft)
- ableton [command]: Ableton control (AbleAgent)
- analyze [audio]: Audio analysis (GrooveSense)
- controller [analyze/generate]: Controller development (ControllerDev)
- max [schema/analyze]: Max for Live development (MaxNode)
- knowledge/search: Knowledge base (Memoria)
- sergik/style: SERGIK overview"""
    
    except Exception as e:
        logger.error(
            "sergik_core_error",
            error_type=type(e).__name__,
            error_message=str(e),
            content=msg.content[:100],
            exc_info=True
        )
        return f"❌ Error in SergikCore routing: {str(e)}. Please try again or contact support."

