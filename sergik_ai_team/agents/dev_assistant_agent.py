"""
DevAssistant Agent - Code Development Specialist
Helps with coding, debugging, and development tasks
"""

import re
import ast
from typing import Dict, Any, List
from pathlib import Path
from ..models import Message
from ..config import BASE_DIR
from ..utils.knowledge_base import get_knowledge_base
from ..utils.plugin_knowledge import get_plugin_knowledge_base


async def dev_assistant_handler(msg: Message) -> str:
    """Handle development assistant requests."""
    content = msg.content.lower()
    kb = get_knowledge_base()
    
    if "analyze" in content and ("code" in content or "file" in content):
        # Extract file path
        path_match = re.search(r'(?:file|path|analyze)\s+([^\s]+)', msg.content)
        if path_match:
            file_path = Path(path_match.group(1))
            if not file_path.is_absolute():
                file_path = BASE_DIR / file_path
            
            if file_path.exists():
                try:
                    code = file_path.read_text(encoding='utf-8')
                    analysis = _analyze_code(code, file_path.suffix)
                    return f"""Code Analysis: {file_path.name}
📊 Lines: {len(code.splitlines())}
🔍 Type: {file_path.suffix}
{analysis}"""
                except Exception as e:
                    return f"❌ Error analyzing file: {e}"
            else:
                return f"❌ File not found: {file_path}"
    
    elif "generate" in content and "code" in content:
        # Extract what to generate
        if "function" in content:
            func_match = re.search(r'function\s+(\w+)', content)
            if func_match:
                func_name = func_match.group(1)
                return _generate_function_template(func_name, content)
        
        elif "class" in content:
            class_match = re.search(r'class\s+(\w+)', content)
            if class_match:
                class_name = class_match.group(1)
                return _generate_class_template(class_name, content)
        
        return """Code Generation - specify:
- generate function [name]: Generate function template
- generate class [name]: Generate class template
- generate test [name]: Generate test template"""
    
    elif "suggest" in content or "improve" in content:
        return """Code Improvement Suggestions:
1. Add type hints for better IDE support
2. Add docstrings following Google/NumPy style
3. Add error handling with specific exceptions
4. Use dependency injection for testability
5. Add logging for debugging
6. Follow PEP 8 style guidelines
7. Add unit tests for critical functions"""
    
    elif "test" in content:
        return """Testing Best Practices:
1. Use pytest for Python testing
2. Test edge cases and error conditions
3. Mock external dependencies
4. Aim for >80% code coverage
5. Use fixtures for test data
6. Test async functions properly
7. Use parameterized tests for multiple inputs"""
    
    elif "debug" in content or "error" in content:
        return """Debugging Tips:
1. Use structured logging (logger.info/debug/error)
2. Add breakpoints in IDE
3. Use print() for quick debugging
4. Check error stack traces carefully
5. Use try-except with specific exceptions
6. Validate inputs before processing
7. Check type hints match actual types"""
    
    elif "architecture" in content or "structure" in content:
        return f"""SERGIK AI Team Architecture:
📁 Structure:
- agents/ - Agent implementations
- utils/ - Utility modules (knowledge_base, plugin_knowledge)
- bridge.py - Service bridge to SERGIK ML
- main.py - FastAPI application

🔧 Key Components:
- Knowledge Base: {len(kb.chunks)} chunks loaded
- Plugin Database: {len(get_plugin_knowledge_base().plugins)} plugins
- Agents: 8 active agents

💡 Design Principles:
- Dependency injection for services
- Structured error handling
- Type hints throughout
- Comprehensive logging"""
    
    elif "import" in content or "dependency" in content:
        return """Common Imports for SERGIK AI Team:
```python
from typing import Dict, Any, List, Optional
from pathlib import Path
from ..models import Message
from ..bridge import get_bridge, is_available
from ..utils.knowledge_base import get_knowledge_base
from ..utils.plugin_knowledge import get_plugin_knowledge_base
```"""
    
    elif "pattern" in content or "best practice" in content:
        return """SERGIK AI Team Patterns:
1. Agent Handler Pattern:
   async def agent_handler(msg: Message) -> str:
       content = msg.content.lower()
       # Handle request
       return response

2. Knowledge Base Access:
   kb = get_knowledge_base()
   info = kb.get_style_signature()

3. Plugin Lookup:
   plugin_kb = get_plugin_knowledge_base()
   plugin = plugin_kb.get_plugin("Serum")

4. Error Handling:
   try:
       # operation
   except SpecificError as e:
       return f"❌ Error: {e}"
"""
    
    elif "help" in content or "commands" in content:
        return """DevAssistant Commands:
- analyze code [file]: Analyze code file
- generate function [name]: Generate function template
- generate class [name]: Generate class template
- suggest: Get improvement suggestions
- test: Testing best practices
- debug: Debugging tips
- architecture: Show architecture overview
- import: Common imports
- pattern: Coding patterns"""
    
    return """DevAssistant ready - I can help with:
- Code analysis and review
- Code generation templates
- Best practices and patterns
- Debugging assistance
- Architecture guidance
- Testing strategies

Say 'help' for all commands."""


def _analyze_code(code: str, file_ext: str) -> str:
    """Analyze code and provide insights."""
    lines = code.splitlines()
    non_empty = [l for l in lines if l.strip()]
    
    analysis = []
    analysis.append(f"📝 Non-empty lines: {len(non_empty)}")
    
    # Check for type hints
    has_type_hints = "->" in code or ":" in code and "def" in code
    analysis.append(f"🎯 Type hints: {'✅ Yes' if has_type_hints else '⚠️ Missing'}")
    
    # Check for docstrings
    has_docstrings = '"""' in code or "'''" in code
    analysis.append(f"📚 Docstrings: {'✅ Yes' if has_docstrings else '⚠️ Missing'}")
    
    # Check for error handling
    has_error_handling = "try:" in code or "except" in code
    analysis.append(f"🛡️ Error handling: {'✅ Yes' if has_error_handling else '⚠️ Missing'}")
    
    # Check for logging
    has_logging = "logger" in code or "logging" in code
    analysis.append(f"📊 Logging: {'✅ Yes' if has_logging else '⚠️ Missing'}")
    
    # Count functions/classes
    func_count = code.count("def ")
    class_count = code.count("class ")
    analysis.append(f"🔧 Functions: {func_count} | Classes: {class_count}")
    
    return "\n".join(analysis)


def _generate_function_template(name: str, context: str) -> str:
    """Generate function template."""
    is_async = "async" in context
    has_type_hints = "type" not in context or "hint" in context
    
    template = f"""```python
{'async ' if is_async else ''}def {name}({_get_params(context)}):
    \"\"\"
    {_get_description(context, name)}.
    
    Args:
        # Add parameters here
    
    Returns:
        # Add return type here
    \"\"\"
    try:
        # Implementation here
        pass
    except Exception as e:
        logger.error(f"Error in {name}: {{e}}", exc_info=True)
        raise
```"""
    return template


def _generate_class_template(name: str, context: str) -> str:
    """Generate class template."""
    template = f"""```python
class {name}:
    \"\"\"
    {_get_description(context, name)}.
    \"\"\"
    
    def __init__(self{_get_init_params(context)}):
        \"\"\"Initialize {name}.\"\"\"
        pass
    
    def __repr__(self) -> str:
        return f"{name}(...)"
```"""
    return template


def _get_params(context: str) -> str:
    """Extract parameters from context."""
    # Simple extraction - could be enhanced
    if "param" in context:
        param_match = re.search(r'param[s]?\s+([^:]+)', context)
        if param_match:
            return param_match.group(1)
    return ""


def _get_init_params(context: str) -> str:
    """Get __init__ parameters."""
    return ""


def _get_description(context: str, name: str) -> str:
    """Get description from context or generate default."""
    if "description" in context:
        desc_match = re.search(r'description\s+([^.]+)', context)
        if desc_match:
            return desc_match.group(1)
    return f"Description for {name}"

