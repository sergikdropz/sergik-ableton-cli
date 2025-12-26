---
name: SERGIK AI Team Integration
overview: Create a complete multi-agent orchestration system integrated with SERGIK ML backend. Agents use direct service bridge for low-latency access to services, while exposing HTTP endpoints for external access. The system helps engineer and develop the Max for Live controller without modifying the frontend.
todos:
  - id: create_structure
    content: Create sergik_ai_team/ directory structure with all subdirectories and __init__.py files
    status: completed
  - id: create_bridge
    content: Create bridge.py - service bridge to SERGIK ML with lazy-loaded service accessors
    status: completed
    dependencies:
      - create_structure
  - id: create_models
    content: Create models.py - Pydantic models for Message, AgentResponse, ControllerFeature, ControllerAnalysis
    status: completed
    dependencies:
      - create_structure
  - id: create_config
    content: Create config.py - configuration with paths, ports, and SERGIK ML integration settings
    status: completed
    dependencies:
      - create_structure
  - id: create_analyzer
    content: Create utils/controller_analyzer.py - analyzes Max for Live JavaScript code
    status: completed
    dependencies:
      - create_structure
      - create_models
  - id: create_generator
    content: Create utils/code_generator.py - generates JavaScript code snippets for controller
    status: completed
    dependencies:
      - create_structure
      - create_models
  - id: create_core_agent
    content: Create agents/core_agent.py - master orchestrator that routes messages
    status: completed
    dependencies:
      - create_bridge
      - create_models
  - id: create_generation_agent
    content: Create agents/generation_agent.py - VSTCraft agent for music generation
    status: completed
    dependencies:
      - create_bridge
      - create_models
  - id: create_ableton_agent
    content: Create agents/ableton_agent.py - AbleAgent for Ableton Live control
    status: completed
    dependencies:
      - create_bridge
      - create_models
  - id: create_analysis_agent
    content: Create agents/analysis_agent.py - GrooveSense agent for audio analysis
    status: completed
    dependencies:
      - create_bridge
      - create_models
  - id: create_maxnode_agent
    content: Create agents/maxnode_agent.py - MaxNode agent for M4L device development
    status: completed
    dependencies:
      - create_analyzer
      - create_models
  - id: create_dev_agent
    content: Create agents/controller_dev_agent.py - ControllerDev agent for development assistance
    status: completed
    dependencies:
      - create_analyzer
      - create_generator
      - create_models
  - id: create_main
    content: Create main.py - FastAPI application with agent registry and HTTP endpoints
    status: completed
    dependencies:
      - create_core_agent
      - create_generation_agent
      - create_ableton_agent
      - create_analysis_agent
      - create_maxnode_agent
      - create_dev_agent
  - id: create_requirements
    content: Create requirements.txt with FastAPI, uvicorn, pydantic dependencies
    status: completed
    dependencies:
      - create_structure
  - id: create_readme
    content: Create README.md with quick start guide, agent descriptions, and usage examples
    status: completed
    dependencies:
      - create_main
---

# SERGIK AI Team Integration Plan

## Architecture Overview

The agent system integrates with SERGIK ML using a **direct service bridge** approach:

- Agents import and use SERGIK ML services directly (no HTTP overhead)
- FastAPI endpoints expose agent functionality via HTTP
- Max for Live controller remains unchanged
- Agents can analyze, generate code, and assist with controller development

## Integration Approach: Direct Service Bridge + HTTP API

**Why this approach:**

1. **Low latency** - Direct service calls, no network overhead
2. **Deep integration** - Agents can access internal service methods
3. **Development-friendly** - Single process, easier debugging
4. **Flexible access** - HTTP endpoints for external tools (Max for Live, CLI, etc.)
5. **Simple deployment** - One service to run

## File Structure

```javascript
sergik_ai_team/
├── __init__.py                 # Package init
├── main.py                     # FastAPI app + agent orchestration
├── bridge.py                   # Service bridge to SERGIK ML
├── models.py                   # Pydantic models
├── config.py                   # Configuration
├── requirements.txt            # Dependencies
├── README.md                   # Documentation
├── agents/
│   ├── __init__.py
│   ├── core_agent.py          # SergikCore orchestrator
│   ├── generation_agent.py    # VSTCraft - music generation
│   ├── ableton_agent.py       # AbleAgent - Ableton control
│   ├── analysis_agent.py      # GrooveSense - audio analysis
│   ├── maxnode_agent.py       # MaxNode - M4L device specialist
│   └── controller_dev_agent.py # ControllerDev - development helper
└── utils/
    ├── __init__.py
    ├── controller_analyzer.py # Analyzes controller JS code
    └── code_generator.py      # Generates controller code snippets
```



## Implementation Steps

### Phase 1: Core Infrastructure

1. **Create `sergik_ai_team/` directory structure**

- All directories and `__init__.py` files

2. **Create `bridge.py`** - Service bridge

- Imports SERGIK ML container and services
- Provides lazy-loaded service accessors
- Handles graceful degradation if SERGIK ML unavailable
- Location: `sergik_ai_team/bridge.py`

3. **Create `models.py`** - Data models

- `Message` - Agent communication
- `AgentResponse` - API responses
- `ControllerFeature` - Feature tracking
- `ControllerAnalysis` - Code analysis results
- Location: `sergik_ai_team/models.py`

4. **Create `config.py`** - Configuration

- Paths to controller code, knowledge files
- SERGIK ML integration settings
- Agent system port/host
- Location: `sergik_ai_team/config.py`

### Phase 2: Utility Modules

5. **Create `utils/controller_analyzer.py`**

- Analyzes Max for Live JavaScript code
- Extracts commands, functions, features
- Identifies missing features
- Generates improvement suggestions
- Location: `sergik_ai_team/utils/controller_analyzer.py`

6. **Create `utils/code_generator.py`**

- Generates JavaScript code snippets
- Templates for common controller functions
- Chord/bass/drum/track generation code
- Location: `sergik_ai_team/utils/code_generator.py`

### Phase 3: Agent Implementations

7. **Create `agents/core_agent.py`**

- Master orchestrator
- Routes messages to appropriate agents
- Handles coordination logic
- Location: `sergik_ai_team/agents/core_agent.py`

8. **Create `agents/generation_agent.py`** (VSTCraft)

- Uses `GenerationService` via bridge
- Handles chord/bass/drum/arpeggio generation
- Sends OSC messages to Ableton
- Location: `sergik_ai_team/agents/generation_agent.py`

9. **Create `agents/ableton_agent.py`** (AbleAgent)

- Uses `AbletonService` via bridge
- Controls tempo, transport, tracks, devices
- Accesses `StateService` for session state
- Location: `sergik_ai_team/agents/ableton_agent.py`

10. **Create `agents/analysis_agent.py`** (GrooveSense)

    - Uses `AnalysisService` via bridge
    - Analyzes audio URLs/files
    - Uses `TrackService` for similarity search
    - Location: `sergik_ai_team/agents/analysis_agent.py`

11. **Create `agents/maxnode_agent.py`** (MaxNode)

    - M4L device specialist
    - Provides device schemas
    - Analyzes controller code
    - Generates patch structures
    - Location: `sergik_ai_team/agents/maxnode_agent.py`

12. **Create `agents/controller_dev_agent.py`** (ControllerDev)

    - Development helper agent
    - Uses `ControllerAnalyzer` and `CodeGenerator`
    - Analyzes controller code
    - Generates code snippets
    - Provides suggestions
    - Location: `sergik_ai_team/agents/controller_dev_agent.py`

### Phase 4: Main Application

13. **Create `main.py`** - FastAPI application

    - Agent registry and routing
    - HTTP endpoints:
    - `POST /agent/message` - Send message to agent
    - `GET /agent/list` - List all agents
    - `GET /health` - Health check
    - `GET /` - Root endpoint
    - Startup initialization
    - Error handling
    - Location: `sergik_ai_team/main.py`

### Phase 5: Documentation & Dependencies

14. **Create `requirements.txt`**

    - FastAPI, uvicorn, pydantic
    - python-osc (already in main requirements.txt)
    - Location: `sergik_ai_team/requirements.txt`

15. **Create `README.md`**

    - Quick start guide
    - Agent descriptions
    - Usage examples
    - Controller development workflow
    - Location: `sergik_ai_team/README.md`

## Integration Points

### Service Bridge Integration

- Imports from `sergik_ml.core.container.get_container()`
- Accesses services: `GenerationService`, `AbletonService`, `AnalysisService`, `TrackService`, `VoiceService`, `StateService`
- Uses OSC functions: `osc_send`, `osc_status`, `osc_error` from `sergik_ml.connectors.ableton_osc`
- Reads config from `sergik_ml.config.CFG`

### Controller Code Analysis

- Reads from `maxforlive/SERGIK_AI_Controller.js`
- Analyzes JavaScript functions and commands
- Generates code snippets for missing features

### HTTP API Integration

- Runs on port 8001 (configurable via `AGENT_PORT`)
- SERGIK ML API runs on port 8000 (unchanged)
- Max for Live controller continues using port 8000
- Agents can be accessed via HTTP for external tools

## Key Features

1. **Controller Development Assistance**

- Code analysis and suggestions
- Code generation for common patterns
- Feature tracking and status

2. **Music Generation**

- Natural language interface
- Direct service integration
- OSC communication with Ableton

3. **Ableton Control**

- Tempo, transport, tracks, devices
- Session state management
- Real-time control

4. **Audio Analysis**

- URL and file analysis
- Similarity search
- DNA matching

## Testing Strategy

- Test bridge initialization with/without SERGIK ML
- Test agent message routing
- Test code analysis on actual controller file
- Test HTTP endpoints with curl/Postman
- Verify OSC messages sent correctly

## Deployment

- Run independently: `python sergik_ai_team/main.py`
- Or integrate into existing server startup
- Environment variables for configuration
- Graceful degradation if SERGIK ML unavailable

## Future Enhancements

- Optional agents: Memoria (RAG), AuralBrain (training)