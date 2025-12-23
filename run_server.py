#!/usr/bin/env python3
"""
SERGIK ML Server Runner

Start the ML service:
    python run_server.py

Or with uvicorn directly:
    uvicorn sergik_ml.serving.api:app --host 127.0.0.1 --port 8000 --reload

Environment variables:
    SERGIK_HOST         - Bind host (default: 127.0.0.1)
    SERGIK_PORT         - Bind port (default: 8000)
    SERGIK_DB_URL       - Database URL (default: sqlite:///sergik_ml.db)
    SERGIK_ABLETON_OSC_PORT - OSC port for Ableton (default: 9000)
"""

import uvicorn
from sergik_ml.config import CFG


def main():
    print("=" * 60)
    print("SERGIK ML Service")
    print("=" * 60)
    print(f"Host:     {CFG.host}")
    print(f"Port:     {CFG.port}")
    print(f"Database: {CFG.db_url}")
    print(f"OSC Port: {CFG.ableton_osc_port}")
    print("=" * 60)
    print()
    print("Endpoints:")
    print("  POST /action  - Execute command")
    print("  POST /voice   - Process voice")
    print("  GET  /tracks  - List tracks")
    print("  GET  /similar/{id} - Find similar")
    print("  GET  /docs    - API documentation")
    print()
    print("Press Ctrl+C to stop")
    print("=" * 60)

    uvicorn.run(
        "sergik_ml.serving.api:app",
        host=CFG.host,
        port=CFG.port,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()
