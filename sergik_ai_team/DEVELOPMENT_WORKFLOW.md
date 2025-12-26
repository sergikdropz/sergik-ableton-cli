# SERGIK AI Team - Development Workflow

## Overview

The SERGIK AI Team is now integrated into your development workflow. Use agents to help with coding, analysis, and development tasks.

## Automatic Integration

### In Development Prompts

When you ask for development help, the system automatically uses SERGIK AI Team agents:

```python
from sergik_ai_team.dev_orchestrator import auto_help

# In your development prompt/request:
task = "create a new agent for audio processing"
assistance = auto_help(task)
print(assistance)
```

### Direct Agent Calls

```python
from sergik_ai_team.dev_orchestrator import develop_sync, code_review, generate_code

# Get development assistance
result = develop_sync("implement error handling for API endpoints")
print(result)

# Code review
result = code_review("sergik_ai_team/main.py")
print(result)

# Generate code
result = generate_code("function process_audio", "process audio files")
print(result)
```

## Development Workflow

### 1. Planning Phase

```python
from sergik_ai_team.dev_orchestrator import best_practices

# Get best practices before coding
practices = best_practices("API development")
print(practices)
```

### 2. Implementation Phase

```python
from sergik_ai_team.dev_orchestrator import generate_code, develop_sync

# Generate function template
code = generate_code("function validate_input", "validate user input")
print(code)

# Get implementation guidance
guidance = develop_sync("implement input validation with type checking")
print(guidance)
```

### 3. Review Phase

```python
from sergik_ai_team.dev_orchestrator import code_review

# Review your code
review = code_review("sergik_ai_team/agents/new_agent.py")
print(review)
```

### 4. Testing Phase

```python
from sergik_ai_team.dev_helper import ask_agent_sync

# Get testing guidance
testing = ask_agent_sync("test", "DevAssistant")
print(testing)
```

## Agent Routing

The orchestrator automatically routes tasks to appropriate agents:

- **Analysis tasks** → DevAssistant (code analysis)
- **Generation tasks** → DevAssistant (code generation)
- **Debugging tasks** → DevAssistant (debugging tips)
- **Testing tasks** → DevAssistant (testing best practices)
- **Refactoring tasks** → DevAssistant (suggestions + patterns)
- **Controller development** → ControllerDev
- **Music generation** → VSTCraft
- **Ableton control** → AbleAgent

## Usage in Cursor/VS Code

### Option 1: Direct Import

```python
# In your development script
from sergik_ai_team.dev_orchestrator import auto_help

# When you need help
help_text = auto_help("create a new service for audio processing")
print(help_text)
```

### Option 2: Helper Function

Create a file `dev_ask.py`:

```python
#!/usr/bin/env python3
import sys
from sergik_ai_team.dev_orchestrator import develop_sync

if __name__ == "__main__":
    task = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "help"
    result = develop_sync(task)
    print(result)
```

Use it:
```bash
python dev_ask.py "analyze code my_file.py"
python dev_ask.py "generate function process_data"
```

## Integration Examples

### Example 1: Before Writing Code

```python
from sergik_ai_team.dev_orchestrator import best_practices, generate_code

# Get best practices
practices = best_practices("error handling")
print("Best Practices:", practices)

# Generate template
template = generate_code("function handle_error", "handle exceptions")
print("Template:", template)
```

### Example 2: During Development

```python
from sergik_ai_team.dev_orchestrator import develop_sync

# Get guidance while coding
guidance = develop_sync("implement async function with error handling")
print(guidance)
```

### Example 3: After Writing Code

```python
from sergik_ai_team.dev_orchestrator import code_review

# Review your code
review = code_review("my_new_file.py")
print(review)
```

## Agent Capabilities

### DevAssistant
- Code analysis
- Code generation
- Best practices
- Testing guidance
- Debugging tips
- Architecture overview

### ControllerDev
- Controller code analysis
- Max for Live code generation
- Controller development patterns

### SergikCore
- Routes to appropriate agents
- Provides overview
- Orchestrates multi-agent tasks

## Tips

1. **Be specific**: "analyze code sergik_ai_team/main.py" is better than "analyze code"
2. **Use context**: Provide context when generating code
3. **Review regularly**: Use code_review() after writing code
4. **Get practices first**: Use best_practices() before implementing
5. **Combine agents**: Use SergikCore to route to multiple agents

## Quick Reference

```python
# Import
from sergik_ai_team.dev_orchestrator import (
    develop_sync,
    code_review,
    generate_code,
    best_practices,
    auto_help
)

# Use
help_text = auto_help("your development task")
review = code_review("file.py")
code = generate_code("function name", "description")
practices = best_practices("topic")
```

