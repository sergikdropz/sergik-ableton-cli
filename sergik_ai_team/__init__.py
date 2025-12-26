"""
SERGIK AI Team - Multi-Agent Orchestration System
Integrated with SERGIK ML Backend
"""

__version__ = "1.0.0"
__all__ = [
    "main",
    "bridge",
    "models",
    "dev_helper",
    "dev_orchestrator",
]

# Development helpers - always available (lazy import to avoid circular deps)
def _get_dev_exports():
    """Lazy import dev helpers."""
    try:
        from .dev_helper import (
            get_dev_helper,
            ask_agent,
            ask_agent_sync,
            DevHelper,
        )
        from .dev_orchestrator import (
            get_orchestrator,
            develop,
            develop_sync,
            code_review,
            generate_code,
            best_practices,
            auto_help,
            DevOrchestrator,
        )
        return {
            "get_dev_helper": get_dev_helper,
            "ask_agent": ask_agent,
            "ask_agent_sync": ask_agent_sync,
            "DevHelper": DevHelper,
            "get_orchestrator": get_orchestrator,
            "develop": develop,
            "develop_sync": develop_sync,
            "code_review": code_review,
            "generate_code": generate_code,
            "best_practices": best_practices,
            "auto_help": auto_help,
            "DevOrchestrator": DevOrchestrator,
        }
    except ImportError:
        # Graceful degradation if dependencies not available
        return {}

# Export dev helpers
_dev_exports = _get_dev_exports()
globals().update(_dev_exports)

__all__.extend([
    "get_dev_helper",
    "ask_agent",
    "ask_agent_sync",
    "DevHelper",
    "get_orchestrator",
    "develop",
    "develop_sync",
    "code_review",
    "generate_code",
    "best_practices",
    "auto_help",
    "DevOrchestrator",
])

