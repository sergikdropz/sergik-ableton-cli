# Quick Start - Using SERGIK AI Team for Coding

## Simple Usage

### In Your Python Code

```python
from sergik_ai_team.dev_helper import ask_agent_sync

# Ask for help
result = ask_agent_sync("help", "DevAssistant")
print(result)

# Get code suggestions
result = ask_agent_sync("suggest", "DevAssistant")
print(result)

# Analyze a file
result = ask_agent_sync("analyze code sergik_ai_team/main.py", "DevAssistant")
print(result)

# Generate function template
result = ask_agent_sync("generate function my_function", "DevAssistant")
print(result)
```

### In Terminal

```bash
# Start the agent system first
cd sergik_ai_team
python main.py

# In another terminal, use curl
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "DevAssistant", "content": "help"}'
```

### In Cursor/VS Code

Create a file `ask_agent.py`:

```python
#!/usr/bin/env python3
import sys
from sergik_ai_team.dev_helper import ask_agent_sync

if __name__ == "__main__":
    question = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "help"
    result = ask_agent_sync(question, "DevAssistant")
    print(result)
```

Then use it:

```bash
python ask_agent.py "analyze code my_file.py"
python ask_agent.py "suggest improvements"
python ask_agent.py "generate function process_data"
```

## Available Commands

- `help` - Show all commands
- `analyze code [file]` - Analyze a code file
- `generate function [name]` - Generate function template
- `generate class [name]` - Generate class template
- `suggest` - Get improvement suggestions
- `test` - Testing best practices
- `debug` - Debugging tips
- `architecture` - Architecture overview
- `import` - Common imports
- `pattern` - Coding patterns

## Example Workflow

```python
from sergik_ai_team.dev_helper import get_dev_helper

helper = get_dev_helper()

# 1. Get suggestions before coding
suggestions = helper.ask_sync("suggest", "DevAssistant")
print(suggestions)

# 2. Generate function template
function_code = helper.ask_sync("generate function process_audio", "DevAssistant")
print(function_code)

# 3. Analyze your code after writing
analysis = helper.ask_sync("analyze code my_file.py", "DevAssistant")
print(analysis)

# 4. Get testing advice
testing = helper.ask_sync("test", "DevAssistant")
print(testing)
```
