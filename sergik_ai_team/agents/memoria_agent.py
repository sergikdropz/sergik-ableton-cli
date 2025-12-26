"""
Memoria Agent - Knowledge Base Specialist (RAG)
"""

import re
from typing import Dict, Any
from ..models import Message
from ..utils.knowledge_base import get_knowledge_base
from ..utils.plugin_knowledge import get_plugin_knowledge_base


async def memoria_handler(msg: Message) -> str:
    """Handle Memoria requests - knowledge base RAG."""
    kb = get_knowledge_base()
    content = msg.content.lower()
    
    if "style" in content or "signature" in content:
        style = kb.get_style_signature()
        return f"""SERGIK Style Signature:
- BPM Sweet Spot: {style.get('bpm_sweet_spot', 'N/A')}
- Primary Keys: {', '.join(style.get('primary_keys', []))}
- Philosophy: {style.get('production_philosophy', 'N/A')}
- Characteristics: {', '.join(style.get('characteristics', [])[:3])}"""
    
    elif "quality" in content or "standards" in content:
        quality = kb.get_quality_standards()
        master = quality.get('master_quality', {})
        return f"""Quality Standards:
- Format: {master.get('format', 'N/A')}
- Sample Rate: {master.get('sample_rate', 'N/A')}
- Bit Depth: {master.get('bit_depth', 'N/A')}
- Loudness Target: {quality.get('loudness_target', 'N/A')}
- Optimal Duration: {quality.get('duration_optimal', 'N/A')}"""
    
    elif "workflow" in content or "template" in content:
        workflow = kb.get_workflow_info()
        return f"""Workflow Information:
- Templates: {', '.join(workflow.get('templates', []))}
- Default Instrument: {workflow.get('default_instrument', 'N/A')}
- Stem Count: {workflow.get('stem_count', 'N/A')}
- Processing Chain: {' → '.join(workflow.get('processing_chain', []))}"""
    
    elif "dna" in content or "musical" in content:
        dna = kb.get_musical_dna()
        return f"""Musical DNA:
- BPM Zones: {dna.get('bpm_zones', {}).get('primary_2', 'N/A')}
- Top Keys: {dna.get('top_keys', {}).get('10B', 'N/A')}
- Energy Profile: {dna.get('energy_profile', {}).get('peak_range', 'N/A')}
- Genre Fusion: {dna.get('genre_fusion', 'N/A')}"""
    
    elif "search" in content or "find" in content:
        # Extract search query
        query_match = re.search(r'search\s+(.+)|find\s+(.+)', content)
        if query_match:
            query = query_match.group(1) or query_match.group(2)
            results = kb.search(query, limit=3)
            if results:
                summaries = []
                for result in results:
                    text = result.get('text', '')[:200]
                    summaries.append(f"- {text}...")
                return f"Found {len(results)} results:\n" + "\n".join(summaries)
            return "No results found"
    
    elif "plugin" in content or "device" in content:
        plugin_kb = get_plugin_knowledge_base()
        
        if "search" in content or "find" in content:
            query_match = re.search(r'(?:plugin|device)\s+(?:search|find)\s+(.+)|search\s+(?:plugin|device)\s+(.+)', content)
            if query_match:
                query = (query_match.group(1) or query_match.group(2)).strip()
                results = plugin_kb.search_plugins(query)
                if results:
                    return f"Found {len(results)} plugins:\n" + "\n".join([
                        f"- {p.name} ({p.manufacturer}): {p.description[:60]}..."
                        for p in results[:10]
                    ])
                return f"No plugins found matching '{query}'"
        
        # Show plugin info
        plugin_match = re.search(r'(?:plugin|device)\s+([A-Za-z0-9\s]+)', content)
        if plugin_match:
            plugin_name = plugin_match.group(1).strip()
            plugin = plugin_kb.get_plugin(plugin_name)
            if plugin:
                return f"""Plugin: {plugin.name}
🏭 {plugin.manufacturer} | {plugin.type} | {plugin.category}
📝 {plugin.description}
🎛️ Parameters: {', '.join(plugin.parameters[:5])}
💡 Uses: {', '.join(plugin.common_uses[:3])}
{f'🎯 SERGIK: {plugin.sergik_usage}' if plugin.sergik_usage else ''}"""
        
        # Show critical plugins
        critical = plugin_kb.get_critical_plugins()
        return f"""Critical SERGIK Plugins ({len(critical)}):
{chr(10).join([f'- {p.name}: {p.sergik_usage}' for p in critical])}"""
    
    return """Memoria ready - commands:
- style: Get style signature
- quality: Get quality standards
- workflow: Get workflow information
- dna: Get musical DNA
- search [query]: Search knowledge base
- plugin [name]: Get plugin information
- plugin search [query]: Search plugins"""

