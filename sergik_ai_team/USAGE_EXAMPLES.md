# SERGIK AI Team - Usage Examples

## Calling Agents from Code

### Basic Usage

```python
from sergik_ai_team.dev_helper import ask_agent_sync, get_dev_helper

# Quick question
result = ask_agent_sync("help", "DevAssistant")
print(result)

# Using helper instance
helper = get_dev_helper()
result = helper.ask_sync("analyze code sergik_ai_team/main.py", "DevAssistant")
print(result)
```

### Async Usage

```python
import asyncio
from sergik_ai_team.dev_helper import ask_agent, get_dev_helper

async def main():
    # Ask DevAssistant
    result = await ask_agent("suggest improvements", "DevAssistant")
    print(result)
    
    # Analyze code
    helper = get_dev_helper()
    result = await helper.analyze_code("sergik_ai_team/main.py")
    print(result)
    
    # Generate function
    result = await helper.generate_function("process_data", "Process audio data")
    print(result)

asyncio.run(main())
```

### Code Analysis

```python
from sergik_ai_team.dev_helper import get_dev_helper

helper = get_dev_helper()

# Analyze a file
result = helper.ask_sync("analyze code sergik_ai_team/utils/knowledge_base.py", "DevAssistant")
print(result)

# Get architecture overview
result = helper.ask_sync("architecture", "DevAssistant")
print(result)
```

### Code Generation

```python
from sergik_ai_team.dev_helper import get_dev_helper

helper = get_dev_helper()

# Generate function template
result = helper.ask_sync("generate function process_audio", "DevAssistant")
print(result)

# Generate class template
result = helper.ask_sync("generate class AudioProcessor", "DevAssistant")
print(result)
```

### Development Assistance

```python
from sergik_ai_team.dev_helper import get_dev_helper

helper = get_dev_helper()

# Get suggestions
result = helper.ask_sync("suggest", "DevAssistant")
print(result)

# Testing best practices
result = helper.ask_sync("test", "DevAssistant")
print(result)

# Debugging tips
result = helper.ask_sync("debug", "DevAssistant")
print(result)

# Common imports
result = helper.ask_sync("import", "DevAssistant")
print(result)

# Coding patterns
result = helper.ask_sync("pattern", "DevAssistant")
print(result)
```

## HTTP API Usage

### Using curl

```bash
# Ask DevAssistant
curl -X POST http://localhost:8001/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "receiver": "DevAssistant",
    "content": "analyze code sergik_ai_team/main.py"
  }'

# Get suggestions
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "DevAssistant", "content": "suggest"}'

# Generate function
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "DevAssistant", "content": "generate function process_data"}'
```

### Using Python requests

```python
import requests

# Ask DevAssistant
response = requests.post(
    "http://localhost:8001/agent/message",
    json={
        "receiver": "DevAssistant",
        "content": "help"
    }
)
print(response.json()["reply"])
```

## Integration Examples

### In Your Code

```python
# In your development script
from sergik_ai_team.dev_helper import ask_agent_sync

def develop_feature():
    # Ask for help
    suggestions = ask_agent_sync("suggest", "DevAssistant")
    print("Suggestions:", suggestions)
    
    # Generate code
    function_code = ask_agent_sync("generate function my_function", "DevAssistant")
    print("Generated code:", function_code)
    
    # Analyze your code
    analysis = ask_agent_sync("analyze code my_file.py", "DevAssistant")
    print("Analysis:", analysis)
```

### In Jupyter Notebook

```python
# In a Jupyter notebook
from sergik_ai_team.dev_helper import get_dev_helper

helper = get_dev_helper()

# Get help interactively
result = helper.ask_sync("help", "DevAssistant")
display(result)

# Analyze code cell
result = helper.ask_sync("analyze code my_code.py", "DevAssistant")
display(result)
```

### In VS Code / Cursor

You can create a simple script to call agents:

```python
# dev_ask.py
import sys
from sergik_ai_team.dev_helper import ask_agent_sync

if __name__ == "__main__":
    question = " ".join(sys.argv[1:])
    result = ask_agent_sync(question, "DevAssistant")
    print(result)
```

Then use it:
```bash
python dev_ask.py "analyze code my_file.py"
python dev_ask.py "suggest improvements"
```

## Available Agents

- **DevAssistant**: Code development, analysis, generation
- **ControllerDev**: Max for Live controller development
- **VSTCraft**: Music generation
- **AbleAgent**: Ableton Live control
- **GrooveSense**: Audio analysis
- **MaxNode**: Max for Live development
- **Memoria**: Knowledge base queries
- **SergikCore**: Master orchestrator

## Tips

1. **Be specific**: "analyze code sergik_ai_team/main.py" is better than "analyze code"
2. **Use the right agent**: DevAssistant for code, ControllerDev for controller code
3. **Combine agents**: Ask SergikCore to route to the right agent
4. **Use async**: For better performance in async contexts
5. **Check help**: Always start with "help" to see available commands

