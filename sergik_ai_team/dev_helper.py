"""
Development Helper - Call SERGIK AI Team Agents from Code
"""

import asyncio
import sys
from pathlib import Path
from typing import Optional, Dict, Any

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from .models import Message
from .agents.dev_assistant_agent import dev_assistant_handler
from .agents.controller_dev_agent import controller_dev_handler
from .agents.core_agent import sergik_core_handler


class DevHelper:
    """Helper class to call SERGIK AI Team agents from code."""
    
    def __init__(self):
        """Initialize dev helper."""
        self.agent_map = {
            "DevAssistant": dev_assistant_handler,
            "ControllerDev": controller_dev_handler,
        }
    
    async def ask(self, question: str, agent: str = "DevAssistant") -> str:
        """Ask a question to an agent."""
        if agent not in self.agent_map:
            return f"❌ Unknown agent: {agent}. Available: {list(self.agent_map.keys())}"
        
        handler = self.agent_map[agent]
        msg = Message(
            sender="Developer",
            receiver=agent,
            content=question
        )
        
        try:
            if agent == "SergikCore":
                # SergikCore needs agent_map
                return await sergik_core_handler(msg, self.agent_map)
            else:
                return await handler(msg)
        except Exception as e:
            return f"❌ Error: {e}"
    
    def ask_sync(self, question: str, agent: str = "DevAssistant") -> str:
        """Synchronous wrapper for ask."""
        return asyncio.run(self.ask(question, agent))
    
    async def analyze_code(self, file_path: str) -> str:
        """Analyze a code file."""
        return await self.ask(f"analyze code {file_path}", "DevAssistant")
    
    async def generate_function(self, name: str, description: str = "") -> str:
        """Generate a function template."""
        query = f"generate function {name}"
        if description:
            query += f" description {description}"
        return await self.ask(query, "DevAssistant")
    
    async def get_suggestions(self) -> str:
        """Get code improvement suggestions."""
        return await self.ask("suggest", "DevAssistant")
    
    async def get_architecture(self) -> str:
        """Get architecture overview."""
        return await self.ask("architecture", "DevAssistant")


# Global instance
_helper: Optional[DevHelper] = None


def get_dev_helper() -> DevHelper:
    """Get global dev helper instance."""
    global _helper
    if _helper is None:
        _helper = DevHelper()
    return _helper


# Convenience functions
async def ask_agent(question: str, agent: str = "DevAssistant") -> str:
    """Ask a question to an agent."""
    return await get_dev_helper().ask(question, agent)


def ask_agent_sync(question: str, agent: str = "DevAssistant") -> str:
    """Ask a question to an agent (synchronous)."""
    return get_dev_helper().ask_sync(question, agent)


# Example usage
if __name__ == "__main__":
    helper = DevHelper()
    
    # Example: Ask for help
    result = helper.ask_sync("help", "DevAssistant")
    print(result)
    
    # Example: Analyze a file
    # result = helper.ask_sync("analyze code sergik_ai_team/main.py", "DevAssistant")
    # print(result)
    
    # Example: Generate function
    # result = helper.ask_sync("generate function process_data", "DevAssistant")
    # print(result)

