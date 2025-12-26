# Quick Development Reference

## Always Use SERGIK AI Team for Development

### Import Once, Use Everywhere

```python
from sergik_ai_team import auto_help, develop_sync, code_review, best_practices
```

### Common Patterns

#### 1. Before Coding - Get Guidance
```python
guidance = auto_help("implement error handling for API endpoints")
# Use guidance to inform your implementation
```

#### 2. During Coding - Get Help
```python
help_text = develop_sync("create async function with proper error handling")
# Use help_text for implementation guidance
```

#### 3. After Coding - Review
```python
review = code_review("sergik_ai_team/main.py")
# Apply suggestions from review
```

#### 4. Get Best Practices
```python
practices = best_practices("API development")
# Follow practices when implementing
```

## One-Liner Examples

```python
# Quick help
from sergik_ai_team import auto_help
print(auto_help("your task here"))

# Code review
from sergik_ai_team import code_review
print(code_review("file.py"))

# Generate code
from sergik_ai_team import generate_code
print(generate_code("function name", "description"))
```

## In Development Prompts

When you ask me to develop something, I'll automatically use:

```python
from sergik_ai_team import auto_help

# I'll call this to get agent assistance
assistance = auto_help("your development request")
# Then use the assistance to guide implementation
```

## Available Functions

- `auto_help(task)` - Get automatic help for any task
- `develop_sync(task)` - Orchestrate development
- `code_review(file_path)` - Review code
- `generate_code(what, context)` - Generate code templates
- `best_practices(topic)` - Get best practices
- `ask_agent_sync(question, agent)` - Direct agent query

