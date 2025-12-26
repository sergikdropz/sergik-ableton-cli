#!/usr/bin/env python3
"""
SERGIK ML Server Runner

Start the ML service:
    python run_server.py

Or with uvicorn directly:
    uvicorn sergik_ml.serving.api:app --host 127.0.0.1 --port 8000 --reload

Environment variables:
    SERGIK_HOST              - Bind host (default: 127.0.0.1)
    SERGIK_PORT              - Bind port (default: 8000)
    SERGIK_DB_URL            - Database URL (default: sqlite:///sergik_ml.db)
    SERGIK_ABLETON_OSC_PORT  - OSC port for Ableton (default: 8001)
    SERGIK_ARTIFACT_DIR      - Model artifacts directory (default: artifacts)
    SERGIK_DATA_DIR          - Data directory (default: data)
"""

import uvicorn
from sergik_ml.config import CFG


BANNER = """
================================================================================
   _____ ______ _____   _____ _____ _  __    __  __ _
  / ____|  ____|  __ \\ / ____|_   _| |/ /   |  \\/  | |
 | (___ | |__  | |__) | |  __  | | | ' /    | \\  / | |
  \\___ \\|  __| |  _  /| | |_ | | | |  <     | |\\/| | |
  ____) | |____| | \\ \\| |__| |_| |_| . \\    | |  | | |____
 |_____/|______|_|  \\_\\\\_____|_____|_|\\_\\   |_|  |_|______|

             100% PROPRIETARY MACHINE LEARNING
================================================================================
"""


def main():
    print(BANNER)
    print(f"  Host:          {CFG.host}")
    print(f"  Port:          {CFG.port}")
    print(f"  Database:      {CFG.db_url}")
    print(f"  OSC Port:      {CFG.ableton_osc_port}")
    print(f"  Artifacts:     {CFG.artifact_dir}")
    print(f"  Data Dir:      {CFG.data_dir}")
    print()
    print("  SERGIK DNA Configuration:")
    print("    BPM Sweet Spot:  122-127 BPM")
    print("    Primary Keys:    C, G, D, Am, Em")
    print("    Style Focus:     Tech-House (45%), House (25%), Disco (15%)")
    print()
    print("================================================================================")
    print("  API Endpoints:")
    print("    POST /action       Execute command (pack.create, pack.rate, etc.)")
    print("    POST /voice        Process voice command (STT -> Intent -> Action)")
    print("    GET  /health       Health check")
    print("    GET  /tracks       List music intelligence database")
    print("    GET  /similar/{id} Find similar tracks via vector similarity")
    print("    GET  /docs         OpenAPI documentation")
    print()
    print("  OSC Messages (to Ableton M4L):")
    print("    /scp/status          Status updates")
    print("    /scp/similar_results Similarity search results")
    print("    /scp/tts_ready       TTS audio ready notification")
    print("================================================================================")
    print()
    print("  Press Ctrl+C to stop")
    print()

    uvicorn.run(
        "sergik_ml.api.main:app",
        host=CFG.host,
        port=CFG.port,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()
