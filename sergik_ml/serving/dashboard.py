"""
SERGIK ML Web Dashboard

Simple web UI for:
  - Track management
  - Rating interface
  - Model training status
  - System health

Served as part of the FastAPI app at /dashboard/*
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
from typing import Dict, Any, List, Optional
import json
from datetime import datetime

from ..stores.sql_store import list_tracks, get_action_history
from ..models.model_versioning import list_preference_versions, get_registry

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# ============================================================================
# HTML Templates
# ============================================================================

BASE_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SERGIK ML Dashboard</title>
    <style>
        :root {{
            --bg-primary: #0a0a0a;
            --bg-secondary: #1a1a1a;
            --bg-tertiary: #2a2a2a;
            --text-primary: #ffffff;
            --text-secondary: #a0a0a0;
            --accent: #00ff88;
            --accent-dim: #00aa55;
            --error: #ff4444;
            --warning: #ffaa00;
        }}

        * {{ box-sizing: border-box; margin: 0; padding: 0; }}

        body {{
            font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
        }}

        .container {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }}

        header {{
            background: var(--bg-secondary);
            padding: 20px;
            border-bottom: 1px solid var(--accent);
            margin-bottom: 30px;
        }}

        header h1 {{
            color: var(--accent);
            font-size: 24px;
            letter-spacing: 2px;
        }}

        header .subtitle {{
            color: var(--text-secondary);
            font-size: 12px;
            margin-top: 5px;
        }}

        nav {{
            display: flex;
            gap: 20px;
            margin-top: 15px;
        }}

        nav a {{
            color: var(--text-secondary);
            text-decoration: none;
            padding: 8px 16px;
            border: 1px solid var(--bg-tertiary);
            border-radius: 4px;
            transition: all 0.2s;
        }}

        nav a:hover, nav a.active {{
            color: var(--accent);
            border-color: var(--accent);
        }}

        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}

        .stat-card {{
            background: var(--bg-secondary);
            padding: 20px;
            border-radius: 8px;
            border-left: 3px solid var(--accent);
        }}

        .stat-card .label {{
            color: var(--text-secondary);
            font-size: 12px;
            text-transform: uppercase;
        }}

        .stat-card .value {{
            font-size: 32px;
            color: var(--accent);
            margin-top: 5px;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }}

        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--bg-tertiary);
        }}

        th {{
            background: var(--bg-secondary);
            color: var(--accent);
            font-size: 12px;
            text-transform: uppercase;
        }}

        tr:hover {{
            background: var(--bg-secondary);
        }}

        .badge {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            text-transform: uppercase;
        }}

        .badge-success {{ background: var(--accent-dim); color: white; }}
        .badge-error {{ background: var(--error); color: white; }}
        .badge-warning {{ background: var(--warning); color: black; }}

        .rating {{
            color: #ffd700;
        }}

        .btn {{
            display: inline-block;
            padding: 8px 16px;
            background: var(--accent);
            color: var(--bg-primary);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: 12px;
            text-transform: uppercase;
            text-decoration: none;
        }}

        .btn:hover {{
            background: var(--accent-dim);
        }}

        .section {{
            background: var(--bg-secondary);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }}

        .section h2 {{
            color: var(--accent);
            margin-bottom: 15px;
            font-size: 18px;
        }}

        .empty {{
            text-align: center;
            padding: 40px;
            color: var(--text-secondary);
        }}

        .dna-bar {{
            height: 8px;
            background: var(--bg-tertiary);
            border-radius: 4px;
            overflow: hidden;
        }}

        .dna-bar .fill {{
            height: 100%;
            background: var(--accent);
            transition: width 0.3s;
        }}
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>SERGIK ML</h1>
            <div class="subtitle">100% PROPRIETARY MACHINE LEARNING</div>
            <nav>
                <a href="/dashboard" class="{nav_home}">Overview</a>
                <a href="/dashboard/tracks" class="{nav_tracks}">Tracks</a>
                <a href="/dashboard/models" class="{nav_models}">Models</a>
                <a href="/dashboard/actions" class="{nav_actions}">Actions</a>
                <a href="/docs" target="_blank">API Docs</a>
            </nav>
        </div>
    </header>
    <div class="container">
        {content}
    </div>
</body>
</html>
"""


def render_page(content: str, active_nav: str = "home") -> str:
    """Render page with navigation."""
    return BASE_TEMPLATE.format(
        content=content,
        nav_home="active" if active_nav == "home" else "",
        nav_tracks="active" if active_nav == "tracks" else "",
        nav_models="active" if active_nav == "models" else "",
        nav_actions="active" if active_nav == "actions" else "",
    )


# ============================================================================
# Dashboard Routes
# ============================================================================

@router.get("", response_class=HTMLResponse)
async def dashboard_home():
    """Dashboard home/overview."""
    # Get stats
    tracks = list_tracks(limit=10000)
    rated_tracks = [t for t in tracks if t.get("rating")]
    actions = get_action_history(limit=100)

    total_tracks = len(tracks)
    total_rated = len(rated_tracks)
    avg_rating = sum(t["rating"] for t in rated_tracks) / max(1, total_rated)
    total_actions = len(actions)

    # Get model versions
    versions = list_preference_versions()
    latest_version = versions[0]["version"] if versions else 0

    content = f"""
    <div class="stats-grid">
        <div class="stat-card">
            <div class="label">Total Tracks</div>
            <div class="value">{total_tracks:,}</div>
        </div>
        <div class="stat-card">
            <div class="label">Rated Tracks</div>
            <div class="value">{total_rated:,}</div>
        </div>
        <div class="stat-card">
            <div class="label">Avg Rating</div>
            <div class="value">{avg_rating:.1f}<span style="font-size: 16px;">★</span></div>
        </div>
        <div class="stat-card">
            <div class="label">Actions Logged</div>
            <div class="value">{total_actions:,}</div>
        </div>
        <div class="stat-card">
            <div class="label">Model Version</div>
            <div class="value">v{latest_version}</div>
        </div>
    </div>

    <div class="section">
        <h2>Recent Actions</h2>
        <table>
            <tr>
                <th>Time</th>
                <th>Command</th>
                <th>Status</th>
            </tr>
            {"".join(f'''
            <tr>
                <td>{a.get("timestamp", "")[:19]}</td>
                <td>{a.get("cmd", "N/A")}</td>
                <td><span class="badge badge-{"success" if a.get("status") == "ok" else "error"}">{a.get("status", "N/A")}</span></td>
            </tr>
            ''' for a in actions[:10])}
        </table>
    </div>

    <div class="section">
        <h2>Top Rated Tracks</h2>
        <table>
            <tr>
                <th>Track ID</th>
                <th>BPM</th>
                <th>Key</th>
                <th>Rating</th>
                <th>SERGIK DNA</th>
            </tr>
            {"".join(f'''
            <tr>
                <td>{t.get("track_id", "")[:40]}</td>
                <td>{t.get("bpm", "N/A")}</td>
                <td>{t.get("key", "N/A")}</td>
                <td class="rating">{"★" * int(t.get("rating", 0))}</td>
                <td>
                    <div class="dna-bar">
                        <div class="fill" style="width: {min(100, int(float(t.get("energy", 0)) * 1000))}%"></div>
                    </div>
                </td>
            </tr>
            ''' for t in sorted(rated_tracks, key=lambda x: x.get("rating", 0), reverse=True)[:10])}
        </table>
    </div>
    """

    return render_page(content, "home")


@router.get("/tracks", response_class=HTMLResponse)
async def dashboard_tracks(page: int = 1, per_page: int = 50):
    """Tracks listing."""
    tracks = list_tracks(limit=per_page * page)
    start = (page - 1) * per_page
    page_tracks = tracks[start:start + per_page]

    rows = ""
    for t in page_tracks:
        rating_str = "★" * int(t.get("rating", 0)) if t.get("rating") else "-"
        rows += f"""
        <tr>
            <td title="{t.get("track_id", "")}">{t.get("track_id", "")[:50]}</td>
            <td>{t.get("bpm", "-")}</td>
            <td>{t.get("key", "-")}</td>
            <td>{t.get("energy", "-")}</td>
            <td>{t.get("lufs", "-")}</td>
            <td class="rating">{rating_str}</td>
            <td>{t.get("style_source", "-")}</td>
        </tr>
        """

    content = f"""
    <div class="section">
        <h2>Music Intelligence Database</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
            Showing {len(page_tracks)} of {len(tracks)} tracks
        </p>
        <table>
            <tr>
                <th>Track ID</th>
                <th>BPM</th>
                <th>Key</th>
                <th>Energy</th>
                <th>LUFS</th>
                <th>Rating</th>
                <th>Source</th>
            </tr>
            {rows}
        </table>
        <div style="margin-top: 20px; text-align: center;">
            <a href="/dashboard/tracks?page={max(1, page-1)}" class="btn">← Previous</a>
            <span style="margin: 0 20px; color: var(--text-secondary);">Page {page}</span>
            <a href="/dashboard/tracks?page={page+1}" class="btn">Next →</a>
        </div>
    </div>
    """

    return render_page(content, "tracks")


@router.get("/models", response_class=HTMLResponse)
async def dashboard_models():
    """Model versions listing."""
    versions = list_preference_versions()

    rows = ""
    for v in versions:
        meta = v.get("metadata", {})
        metrics = v.get("metrics", {})
        rows += f"""
        <tr>
            <td>v{v["version"]}</td>
            <td>{meta.get("created_at", "-")[:19] if meta.get("created_at") else "-"}</td>
            <td>{meta.get("training_samples", "-")}</td>
            <td>{metrics.get("mse", "-"):.4f if isinstance(metrics.get("mse"), (int, float)) else "-"}</td>
            <td>{metrics.get("mae", "-"):.4f if isinstance(metrics.get("mae"), (int, float)) else "-"}</td>
            <td>{metrics.get("r2", "-"):.4f if isinstance(metrics.get("r2"), (int, float)) else "-"}</td>
        </tr>
        """

    if not rows:
        rows = '<tr><td colspan="6" class="empty">No models trained yet. Rate some tracks and run training.</td></tr>'

    content = f"""
    <div class="section">
        <h2>Preference Model Versions</h2>
        <table>
            <tr>
                <th>Version</th>
                <th>Created</th>
                <th>Training Samples</th>
                <th>MSE</th>
                <th>MAE</th>
                <th>R²</th>
            </tr>
            {rows}
        </table>
    </div>

    <div class="section">
        <h2>Training</h2>
        <p style="color: var(--text-secondary); margin-bottom: 15px;">
            Train a new preference model version from rated tracks.
        </p>
        <form action="/action" method="POST" style="display: inline;">
            <input type="hidden" name="cmd" value="train.preference">
            <button type="button" class="btn" onclick="trainModel()">Train New Model</button>
        </form>
        <script>
            async function trainModel() {{
                const resp = await fetch('/action', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{cmd: 'train.preference', args: {{}}}})
                }});
                const data = await resp.json();
                alert(data.status === 'ok' ? 'Training complete!' : 'Training failed: ' + data.error);
                location.reload();
            }}
        </script>
    </div>
    """

    return render_page(content, "models")


@router.get("/actions", response_class=HTMLResponse)
async def dashboard_actions(limit: int = 100):
    """Action history."""
    actions = get_action_history(limit=limit)

    rows = ""
    for a in actions:
        status_class = "success" if a.get("status") == "ok" else "error"
        rows += f"""
        <tr>
            <td>{a.get("timestamp", "")[:19]}</td>
            <td>{a.get("cmd", "N/A")}</td>
            <td><span class="badge badge-{status_class}">{a.get("status", "N/A")}</span></td>
            <td>{a.get("duration_ms", "-")}ms</td>
            <td title='{json.dumps(a.get("args", {}))}'>
                {str(a.get("args", {}))[:50]}...
            </td>
        </tr>
        """

    if not rows:
        rows = '<tr><td colspan="5" class="empty">No actions logged yet.</td></tr>'

    content = f"""
    <div class="section">
        <h2>Action History</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
            Showing last {len(actions)} actions for ML training data.
        </p>
        <table>
            <tr>
                <th>Timestamp</th>
                <th>Command</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Arguments</th>
            </tr>
            {rows}
        </table>
    </div>
    """

    return render_page(content, "actions")


# ============================================================================
# API Endpoints for Dashboard
# ============================================================================

@router.get("/api/stats")
async def get_stats() -> Dict[str, Any]:
    """Get dashboard statistics as JSON."""
    tracks = list_tracks(limit=10000)
    rated_tracks = [t for t in tracks if t.get("rating")]
    versions = list_preference_versions()

    return {
        "total_tracks": len(tracks),
        "rated_tracks": len(rated_tracks),
        "avg_rating": sum(t["rating"] for t in rated_tracks) / max(1, len(rated_tracks)),
        "model_versions": len(versions),
        "latest_version": versions[0]["version"] if versions else 0,
    }
