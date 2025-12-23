"""
SERGIK ML SQL Store - SQLAlchemy-based persistence.

Tables:
  - music_intelligence: Track features and metadata
  - pack_manifests: Sample pack exports
  - emotion_intelligence: Preference/emotion signals
  - action_log: All command executions for ML training
"""

from sqlalchemy import create_engine, MetaData, Table, Column, Index
from sqlalchemy import String, Float, Text, JSON, DateTime, Integer
from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from typing import Any, Dict, List, Optional
import datetime
import uuid
import logging

from ..config import CFG

logger = logging.getLogger(__name__)

# Engine and metadata
engine = create_engine(CFG.db_url, future=True, echo=False)
meta = MetaData()

# ============================================================================
# Table Definitions
# ============================================================================

music_intelligence = Table(
    "music_intelligence", meta,
    Column("track_id", String(255), primary_key=True),
    Column("bpm", Float),
    Column("key", String(10)),
    Column("energy", Float),
    Column("brightness", Float),
    Column("lufs", Float),
    Column("harmonic_ratio", Float),
    Column("percussive_ratio", Float),
    Column("stereo_width", Float),
    Column("source_pack", String(255)),
    Column("rating", Float),
    Column("style_source", String(50)),
    Column("prompt_text", Text),
    Column("tags", JSON),
    Column("structure_json", JSON),
    Column("embedding", JSON),  # Store embeddings as JSON array
    Column("updated_at", DateTime),
)

pack_manifests = Table(
    "pack_manifests", meta,
    Column("pack_id", String(36), primary_key=True),
    Column("pack_name", String(255)),
    Column("export_dir", Text),
    Column("zip_path", Text),
    Column("cloud_url", Text),
    Column("manifest_json", JSON),
    Column("track_count", Integer),
    Column("total_duration_sec", Float),
    Column("created_at", DateTime),
)

emotion_intelligence = Table(
    "emotion_intelligence", meta,
    Column("emotion_id", String(36), primary_key=True),
    Column("track_id", String(255), index=True),
    Column("valence", Float),
    Column("arousal", Float),
    Column("dominance", Float),
    Column("source", String(50)),
    Column("payload", JSON),
    Column("timestamp", DateTime),
)

action_log = Table(
    "action_log", meta,
    Column("event_id", String(36), primary_key=True),
    Column("cmd", String(100), index=True),
    Column("args", JSON),
    Column("meta", JSON),
    Column("result", JSON),
    Column("status", String(20)),
    Column("error", Text),
    Column("duration_ms", Integer),
    Column("timestamp", DateTime, index=True),
)


# ============================================================================
# Database Operations
# ============================================================================

def init_db() -> None:
    """Initialize database tables."""
    meta.create_all(engine)
    logger.info(f"Database initialized: {CFG.db_url}")


def now_utc() -> datetime.datetime:
    """Get current UTC timestamp."""
    return datetime.datetime.utcnow()


def log_action(
    cmd: str,
    args: Dict[str, Any],
    meta_in: Dict[str, Any],
    status: str,
    result: Dict[str, Any],
    error: Optional[str],
    duration_ms: int = 0
) -> str:
    """Log an action execution for ML training."""
    event_id = str(uuid.uuid4())
    with engine.begin() as conn:
        conn.execute(action_log.insert().values(
            event_id=event_id,
            cmd=cmd,
            args=args,
            meta=meta_in,
            result=result,
            status=status,
            error=error,
            duration_ms=duration_ms,
            timestamp=now_utc(),
        ))
    return event_id


def upsert_track(row: Dict[str, Any]) -> None:
    """Insert or update a track in music_intelligence."""
    if "updated_at" not in row or row["updated_at"] is None:
        row["updated_at"] = now_utc()

    stmt = sqlite_insert(music_intelligence).values(**row)
    stmt = stmt.on_conflict_do_update(index_elements=["track_id"], set_=row)

    with engine.begin() as conn:
        conn.execute(stmt)


def insert_pack_manifest(row: Dict[str, Any]) -> None:
    """Insert a pack manifest."""
    with engine.begin() as conn:
        conn.execute(pack_manifests.insert().values(**row))


def insert_emotion(ev: Dict[str, Any]) -> None:
    """Insert an emotion/preference event."""
    with engine.begin() as conn:
        conn.execute(emotion_intelligence.insert().values(**ev))


def get_track(track_id: str) -> Optional[Dict[str, Any]]:
    """Get a single track by ID."""
    with engine.begin() as conn:
        r = conn.execute(
            select(music_intelligence).where(music_intelligence.c.track_id == track_id)
        ).mappings().first()
    return dict(r) if r else None


def list_tracks(limit: int = 5000, rated_only: bool = False) -> List[Dict[str, Any]]:
    """List tracks from music_intelligence."""
    stmt = select(music_intelligence).limit(limit)
    if rated_only:
        stmt = stmt.where(music_intelligence.c.rating.isnot(None))

    with engine.begin() as conn:
        rows = conn.execute(stmt).mappings().all()
    return [dict(r) for r in rows]


def get_action_history(cmd: Optional[str] = None, limit: int = 1000) -> List[Dict[str, Any]]:
    """Get action history for training."""
    stmt = select(action_log).order_by(action_log.c.timestamp.desc()).limit(limit)
    if cmd:
        stmt = stmt.where(action_log.c.cmd == cmd)

    with engine.begin() as conn:
        rows = conn.execute(stmt).mappings().all()
    return [dict(r) for r in rows]
