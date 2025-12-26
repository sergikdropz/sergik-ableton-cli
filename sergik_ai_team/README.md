# SERGIK AI Team - Multi-Agent Orchestration

Multi-agent system integrated with SERGIK ML backend for controller development.

**🚀 Now Integrated into Development Workflow** - Use agents to help with coding!

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Start agent system (port 8001)
python sergik_ai_team/main.py

# In another terminal, start SERGIK ML API (port 8000)
python run_server.py
```

## Use in Development

**Always use SERGIK AI Team agents during development:**

```python
from sergik_ai_team import auto_help, develop_sync, code_review

# Get guidance before coding
guidance = auto_help("implement error handling for API endpoints")

# Get help during coding
help_text = develop_sync("create async function with proper error handling")

# Review code after writing
review = code_review("sergik_ai_team/main.py")
```

See `DEVELOPMENT_WORKFLOW.md` for complete integration guide.

## Usage

### Send message to agent
```bash
curl -X POST http://localhost:8001/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "Developer",
    "receiver": "ControllerDev",
    "content": "analyze controller code"
  }'
```

### Generate music
```bash
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "VSTCraft", "content": "generate chords in 10B"}'
```

### Control Ableton
```bash
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "AbleAgent", "content": "set tempo to 128"}'
```

## Agents

- **SergikCore**: Master orchestrator - routes messages to appropriate agents
- **VSTCraft**: Music generation - chords, bass, drums, arpeggios
- **AbleAgent**: Ableton Live control - tempo, transport, tracks, devices
- **GrooveSense**: Audio analysis - BPM, key, energy, similarity search
- **MaxNode**: Max for Live development - device schemas, patch structures
- **ControllerDev**: Controller development helper - code analysis, generation, suggestions
- **Memoria**: Knowledge base (RAG) - optional
- **AuralBrain**: Training specialist - optional

## Controller Development

The ControllerDev agent helps develop the Max for Live controller:

```bash
# Analyze controller code
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "ControllerDev", "content": "analyze"}'

# Generate code for feature
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "ControllerDev", "content": "generate code chord"}'

# Get suggestions
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "ControllerDev", "content": "suggest improvements"}'

# List features
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "ControllerDev", "content": "features"}'
```

## Architecture

The agent system uses a **direct service bridge** approach:
- Agents import and use SERGIK ML services directly (no HTTP overhead)
- FastAPI endpoints expose agent functionality via HTTP
- Max for Live controller remains unchanged (uses port 8000)
- Agents run on port 8001

## Integration

- **Service Bridge**: Direct access to SERGIK ML services via dependency injection container
- **OSC Communication**: Agents can send OSC messages to Ableton Live
- **Code Analysis**: Analyzes `maxforlive/SERGIK_AI_Controller.js`
- **Code Generation**: Generates JavaScript snippets for controller development

## Environment Variables

- `AGENT_PORT`: Port for agent system (default: 8001)
- `AGENT_HOST`: Host for agent system (default: 0.0.0.0)
- `SERGIK_ML_API_URL`: SERGIK ML API URL (default: http://127.0.0.1:8000)
- `CONTROLLER_DEV_MODE`: Enable controller development mode (default: true)

## Examples

### Music Generation
```bash
# Generate chords
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "VSTCraft", "content": "generate chords in 10B 8 bars"}'

# Generate bass
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "VSTCraft", "content": "generate bass house style in 11B"}'

# Generate drums
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "VSTCraft", "content": "generate drums tech_house"}'
```

### Ableton Control
```bash
# Set tempo
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "AbleAgent", "content": "set tempo to 128"}'

# Get session state
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "AbleAgent", "content": "get state"}'

# Create track
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "AbleAgent", "content": "create track midi"}'
```

### Audio Analysis
```bash
# Analyze URL
curl -X POST http://localhost:8001/agent/message \
  -d '{"receiver": "GrooveSense", "content": "analyze https://example.com/audio.mp3"}'
```

## Health Check

```bash
curl http://localhost:8001/health
```

## List Agents

```bash
curl http://localhost:8001/agent/list
```

