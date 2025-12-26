# SERGIK AI Team - Improvement Plan

## Quick Wins (Can Do Today)

### 1. Fix Markdown Linting Issues
**File**: `QUICK_START.md`
**Issue**: Missing blank lines around code fences
**Fix**: Add blank lines before/after code blocks

### 2. Add Path Validation
**File**: `config.py`
**Issue**: Paths not validated on startup
**Fix**: Add validation function called on startup

### 3. Improve Error Messages
**File**: All agent handlers
**Issue**: Generic error messages
**Fix**: Add context to error messages

### 4. Add Health Check for Bridge
**File**: `bridge.py`
**Issue**: No way to check if services are actually available
**Fix**: Add `check_health()` method

---

## High Priority Improvements

### 1. Add Request Validation
**Files**: `main.py`
**Priority**: High
**Effort**: 2 hours

```python
from pydantic import validator

class ChatInput(BaseModel):
    sender: str = "User"
    receiver: str
    content: str
    metadata: Dict[str, Any] = {}
    
    @validator('content')
    def content_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        if len(v) > 10000:
            raise ValueError('Content too long (max 10000 chars)')
        return v
    
    @validator('receiver')
    def receiver_valid(cls, v):
        if v not in AGENT_MAP:
            raise ValueError(f'Invalid receiver: {v}')
        return v
```

### 2. Add Structured Logging
**Files**: All files
**Priority**: High
**Effort**: 4 hours

```python
import structlog

logger = structlog.get_logger(__name__)

# Use structured logging
logger.info("agent_request", 
            agent=agent_name, 
            content_length=len(content),
            sender=sender)
```

### 3. Add Retry Logic
**Files**: `bridge.py`, agent handlers
**Priority**: High
**Effort**: 3 hours

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def get_service_with_retry(self, service_name: str):
    return self.container.get(service_name)
```

### 4. Add Health Check Endpoint
**Files**: `bridge.py`, `main.py`
**Priority**: High
**Effort**: 2 hours

```python
async def check_service_health(self) -> Dict[str, bool]:
    """Check health of all services."""
    return {
        "generation": self._check_service("generation_service"),
        "ableton": self._check_service("ableton_service"),
        "analysis": self._check_service("analysis_service"),
    }
```

---

## Medium Priority Improvements

### 1. Improve Code Analysis
**Files**: `controller_analyzer.py`, `dev_assistant_agent.py`
**Priority**: Medium
**Effort**: 8 hours

**Current**: Regex-based parsing
**Improvement**: Use proper parsers

```python
# For JavaScript
import esprima

def analyze_javascript(code: str):
    try:
        ast = esprima.parseScript(code)
        # Analyze AST
    except:
        # Fallback to regex
        pass

# For Python
import ast

def analyze_python(code: str):
    try:
        tree = ast.parse(code)
        # Analyze AST
    except:
        # Fallback to regex
        pass
```

### 2. Add Caching Layer
**Files**: `knowledge_base.py`, `dev_helper.py`
**Priority**: Medium
**Effort**: 4 hours

```python
from functools import lru_cache
from cachetools import TTLCache

# Cache knowledge base queries
@lru_cache(maxsize=100)
def search_cached(self, query: str, limit: int = 5):
    return self._search_uncached(query, limit)

# Cache agent responses
response_cache = TTLCache(maxsize=100, ttl=300)
```

### 3. Add Unit Tests
**Files**: New `tests/` directory
**Priority**: Medium
**Effort**: 16 hours

```python
# tests/test_agents.py
import pytest
from sergik_ai_team.agents.core_agent import sergik_core_handler
from sergik_ai_team.models import Message

@pytest.mark.asyncio
async def test_core_agent_routing():
    msg = Message(
        sender="Test",
        receiver="SergikCore",
        content="generate chords"
    )
    result = await sergik_core_handler(msg, mock_agent_map)
    assert "VSTCraft" in result or "chord" in result.lower()
```

### 4. Improve Error Handling
**Files**: All agent handlers
**Priority**: Medium
**Effort**: 6 hours

```python
class AgentError(Exception):
    """Base agent error."""
    pass

class ServiceUnavailableError(AgentError):
    """Service unavailable."""
    pass

async def agent_handler(msg: Message) -> str:
    try:
        # Handler logic
    except ServiceUnavailableError as e:
        logger.error("service_unavailable", agent=msg.receiver, error=str(e))
        return f"Service temporarily unavailable: {e}"
    except Exception as e:
        logger.error("unexpected_error", agent=msg.receiver, error=str(e), exc_info=True)
        return f"Unexpected error occurred. Please try again."
```

---

## Low Priority Improvements

### 1. Add API Documentation
**Files**: `main.py`
**Priority**: Low
**Effort**: 4 hours

```python
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="SERGIK AI Team API",
        version="1.0.0",
        description="Multi-agent orchestration system",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

### 2. Add Performance Monitoring
**Files**: `main.py`
**Priority**: Low
**Effort**: 6 hours

```python
import time
from fastapi import Request

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

### 3. Refactor Large Files
**Files**: `plugin_knowledge.py` (1192 lines)
**Priority**: Low
**Effort**: 8 hours

**Split into**:
- `plugin_knowledge_base.py` - Base class
- `plugin_database.py` - Plugin data
- `plugin_recommender.py` - Recommendation logic

---

## Implementation Checklist

### Week 1: Foundation
- [ ] Fix markdown linting
- [ ] Add path validation
- [ ] Add structured logging
- [ ] Add health checks

### Week 2: Reliability
- [ ] Add request validation
- [ ] Add retry logic
- [ ] Improve error handling
- [ ] Add basic tests

### Week 3: Quality
- [ ] Improve code analysis
- [ ] Add caching
- [ ] Expand test coverage
- [ ] Add API docs

### Week 4: Polish
- [ ] Performance monitoring
- [ ] Refactor large files
- [ ] Complete documentation
- [ ] Final testing

---

## Success Criteria

### Must Have (MVP)
- ✅ All agents functional
- ✅ Service bridge working
- ✅ Knowledge base integrated
- ✅ Basic error handling

### Should Have (v1.1)
- ✅ Request validation
- ✅ Structured logging
- ✅ Health checks
- ✅ Basic tests

### Nice to Have (v1.2)
- ✅ Advanced code analysis
- ✅ Caching layer
- ✅ Performance monitoring
- ✅ Complete test suite

---

## Quick Reference: Common Patterns

### Agent Handler Pattern
```python
async def agent_handler(msg: Message) -> str:
    """Handle agent request."""
    content = msg.content.lower()
    
    try:
        if "keyword" in content:
            return await handle_keyword(msg)
        else:
            return "Help message"
    except Exception as e:
        logger.error("agent_error", agent=msg.receiver, error=str(e))
        return f"Error: {e}"
```

### Service Access Pattern
```python
from ..bridge import get_bridge, is_available

if not is_available():
    return "Service unavailable"

bridge = get_bridge()
service = bridge.get_generation_service()
result = service.generate(...)
```

### Knowledge Base Pattern
```python
from ..utils.knowledge_base import get_knowledge_base

kb = get_knowledge_base()
style = kb.get_style_signature()
dna = kb.get_musical_dna()
```

---

*Last Updated: 2024*

