"""
Development Orchestrator
Automatically uses SERGIK AI Team agents to help with development
"""

import asyncio
import sys
from pathlib import Path
from typing import Optional, Dict, Any, List
import inspect

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from .models import Message
from .dev_helper import get_dev_helper, DevHelper


class DevOrchestrator:
    """Orchestrates development using SERGIK AI Team agents."""
    
    def __init__(self):
        """Initialize orchestrator."""
        self.helper = get_dev_helper()
        self.context: Dict[str, Any] = {}
    
    async def develop(self, task: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Orchestrate development for a task."""
        if context:
            self.context.update(context)
        
        # Analyze the task and route to appropriate agents
        task_lower = task.lower()
        
        # Route to appropriate agent based on task
        if any(word in task_lower for word in ["analyze", "review", "check", "examine"]):
            return await self._handle_analysis(task)
        elif any(word in task_lower for word in ["generate", "create", "write", "implement"]):
            return await self._handle_generation(task)
        elif any(word in task_lower for word in ["fix", "debug", "error", "issue"]):
            return await self._handle_debugging(task)
        elif any(word in task_lower for word in ["test", "testing", "coverage"]):
            return await self._handle_testing(task)
        elif any(word in task_lower for word in ["refactor", "improve", "optimize"]):
            return await self._handle_refactoring(task)
        else:
            # General development assistance
            return await self.helper.ask(task, "DevAssistant")
    
    async def _handle_analysis(self, task: str) -> str:
        """Handle code analysis tasks."""
        # Check if file path is mentioned
        import re
        file_match = re.search(r'([a-zA-Z0-9_/\.]+\.(py|js|ts|tsx|md))', task)
        if file_match:
            file_path = file_match.group(1)
            return await self.helper.ask(f"analyze code {file_path}", "DevAssistant")
        else:
            return await self.helper.ask("suggest", "DevAssistant")
    
    async def _handle_generation(self, task: str) -> str:
        """Handle code generation tasks."""
        import re
        
        # Check for function generation
        func_match = re.search(r'function\s+(\w+)|def\s+(\w+)', task)
        if func_match:
            func_name = func_match.group(1) or func_match.group(2)
            return await self.helper.ask(f"generate function {func_name}", "DevAssistant")
        
        # Check for class generation
        class_match = re.search(r'class\s+(\w+)', task)
        if class_match:
            class_name = class_match.group(1)
            return await self.helper.ask(f"generate class {class_name}", "DevAssistant")
        
        # General generation
        return await self.helper.ask(f"generate code {task}", "DevAssistant")
    
    async def _handle_debugging(self, task: str) -> str:
        """Handle debugging tasks."""
        result = await self.helper.ask("debug", "DevAssistant")
        # Could also analyze error messages if provided
        return result
    
    async def _handle_testing(self, task: str) -> str:
        """Handle testing tasks."""
        return await self.helper.ask("test", "DevAssistant")
    
    async def _handle_refactoring(self, task: str) -> str:
        """Handle refactoring tasks."""
        suggestions = await self.helper.ask("suggest", "DevAssistant")
        patterns = await self.helper.ask("pattern", "DevAssistant")
        return f"{suggestions}\n\n{patterns}"
    
    def develop_sync(self, task: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Synchronous wrapper for develop."""
        return asyncio.run(self.develop(task, context))
    
    async def code_review(self, file_path: str) -> str:
        """Perform code review on a file."""
        analysis = await self.helper.ask(f"analyze code {file_path}", "DevAssistant")
        suggestions = await self.helper.ask("suggest", "DevAssistant")
        return f"""Code Review: {file_path}

{analysis}

Improvement Suggestions:
{suggestions}"""
    
    async def generate_with_context(self, what: str, context: str = "") -> str:
        """Generate code with context."""
        query = f"generate {what}"
        if context:
            query += f" {context}"
        return await self.helper.ask(query, "DevAssistant")
    
    async def get_best_practices(self, topic: str = "") -> str:
        """Get best practices for a topic."""
        if topic:
            return await self.helper.ask(f"{topic} best practices", "DevAssistant")
        else:
            suggestions = await self.helper.ask("suggest", "DevAssistant")
            patterns = await self.helper.ask("pattern", "DevAssistant")
            return f"{suggestions}\n\n{patterns}"


# Global orchestrator instance
_orchestrator: Optional[DevOrchestrator] = None


def get_orchestrator() -> DevOrchestrator:
    """Get global orchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = DevOrchestrator()
    return _orchestrator


# Convenience functions for development
async def develop(task: str, context: Optional[Dict[str, Any]] = None) -> str:
    """Orchestrate development for a task."""
    return await get_orchestrator().develop(task, context)


def develop_sync(task: str, context: Optional[Dict[str, Any]] = None) -> str:
    """Orchestrate development for a task (synchronous)."""
    return get_orchestrator().develop_sync(task, context)


async def code_review(file_path: str) -> str:
    """Perform code review."""
    return await get_orchestrator().code_review(file_path)


async def generate_code(what: str, context: str = "") -> str:
    """Generate code with context."""
    return await get_orchestrator().generate_with_context(what, context)


async def best_practices(topic: str = "") -> str:
    """Get best practices."""
    return await get_orchestrator().get_best_practices(topic)


# Auto-invoke helper for development prompts
def auto_help(task_description: str) -> str:
    """
    Automatically get help from SERGIK AI Team for a development task.
    Use this in development prompts to get agent assistance.
    
    This function is designed to be called automatically during development
    to provide agent-guided assistance.
    """
    try:
        orchestrator = get_orchestrator()
        result = orchestrator.develop_sync(task_description)
        return f"""🤖 SERGIK AI Team Assistance:

{result}

---
💡 Tip: Use this guidance to complete the task.
"""
    except Exception as e:
        # Graceful degradation - don't fail if agents unavailable
        return f"""⚠️ SERGIK AI Team temporarily unavailable: {e}

Proceeding with standard development approach.
You can still use agents via HTTP API at http://localhost:8001/agent/message
"""


# Example: Use in development
if __name__ == "__main__":
    # Example usage
    result = develop_sync("analyze code sergik_ai_team/main.py")
    print(result)

