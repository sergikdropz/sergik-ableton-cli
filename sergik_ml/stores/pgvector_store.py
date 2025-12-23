"""
SERGIK ML PostgreSQL + pgvector Store

Production-grade vector similarity search using PostgreSQL with pgvector.

Setup:
    1. Install PostgreSQL with pgvector extension
    2. Set SERGIK_DB_URL=postgresql://user:pass@localhost/sergik
    3. Run init_pgvector() to create tables and indices

Features:
    - Approximate nearest neighbor (ANN) search
    - HNSW index for fast similarity queries
    - Hybrid search (vector + metadata filters)
    - Automatic embedding storage
"""

import logging
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

from ..config import CFG

logger = logging.getLogger(__name__)

# Check for pgvector availability
try:
    from pgvector.sqlalchemy import Vector
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False
    Vector = None
    logger.warning("pgvector not installed. Install: pip install pgvector")


# ============================================================================
# pgvector Table Definitions
# ============================================================================

def get_pgvector_tables(meta):
    """Create pgvector-enabled table definitions."""
    if not PGVECTOR_AVAILABLE:
        return None

    from sqlalchemy import Table, Column, String, Float, Text, JSON, DateTime, Index

    # Track embeddings table with vector column
    track_embeddings = Table(
        "track_embeddings", meta,
        Column("track_id", String(255), primary_key=True),
        Column("embedding", Vector(256)),  # 256-dim embedding vector
        Column("embedding_model", String(50), default="sergik_v1"),
        Column("bpm", Float),
        Column("key", String(10)),
        Column("energy", Float),
        Column("style_source", String(50)),
        Column("metadata", JSON),
        Column("updated_at", DateTime),
    )

    # Create HNSW index for fast similarity search
    # Note: Index is created in init_pgvector()

    return track_embeddings


# ============================================================================
# pgvector Operations
# ============================================================================

class PgVectorStore:
    """
    PostgreSQL + pgvector vector store.

    Provides fast approximate nearest neighbor search.
    """

    def __init__(self, embedding_dim: int = 256):
        """
        Initialize pgvector store.

        Args:
            embedding_dim: Dimension of embedding vectors
        """
        self.embedding_dim = embedding_dim
        self._engine = None
        self._table = None
        self._initialized = False

    def _ensure_initialized(self) -> bool:
        """Ensure database connection and tables exist."""
        if self._initialized:
            return True

        if not PGVECTOR_AVAILABLE:
            logger.error("pgvector not available")
            return False

        if "postgresql" not in CFG.db_url:
            logger.warning("pgvector requires PostgreSQL. Current: " + CFG.db_url)
            return False

        try:
            from sqlalchemy import create_engine, MetaData, text

            self._engine = create_engine(CFG.db_url, future=True)
            meta = MetaData()

            # Enable pgvector extension
            with self._engine.begin() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

            self._table = get_pgvector_tables(meta)
            meta.create_all(self._engine)

            # Create HNSW index
            with self._engine.begin() as conn:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS track_embeddings_hnsw_idx
                    ON track_embeddings
                    USING hnsw (embedding vector_cosine_ops)
                    WITH (m = 16, ef_construction = 64)
                """))

            self._initialized = True
            logger.info("pgvector store initialized")
            return True

        except Exception as e:
            logger.error(f"pgvector initialization failed: {e}")
            return False

    def upsert_embedding(
        self,
        track_id: str,
        embedding: np.ndarray,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Insert or update track embedding.

        Args:
            track_id: Track identifier
            embedding: Embedding vector
            metadata: Additional metadata

        Returns:
            Success status
        """
        if not self._ensure_initialized():
            return False

        try:
            from sqlalchemy.dialects.postgresql import insert
            from datetime import datetime

            # Normalize embedding
            embedding = embedding.astype(np.float32)
            embedding = embedding / (np.linalg.norm(embedding) + 1e-9)

            values = {
                "track_id": track_id,
                "embedding": embedding.tolist(),
                "embedding_model": "sergik_v1",
                "bpm": metadata.get("bpm") if metadata else None,
                "key": metadata.get("key") if metadata else None,
                "energy": metadata.get("energy") if metadata else None,
                "style_source": metadata.get("style_source") if metadata else None,
                "metadata": metadata or {},
                "updated_at": datetime.utcnow(),
            }

            stmt = insert(self._table).values(**values)
            stmt = stmt.on_conflict_do_update(
                index_elements=["track_id"],
                set_=values,
            )

            with self._engine.begin() as conn:
                conn.execute(stmt)

            return True

        except Exception as e:
            logger.error(f"Failed to upsert embedding: {e}")
            return False

    def search_similar(
        self,
        query_embedding: np.ndarray,
        k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for similar tracks using approximate nearest neighbor.

        Args:
            query_embedding: Query embedding vector
            k: Number of results
            filters: Optional metadata filters

        Returns:
            List of similar tracks with scores
        """
        if not self._ensure_initialized():
            return []

        try:
            from sqlalchemy import select, text

            # Normalize query
            query_embedding = query_embedding.astype(np.float32)
            query_embedding = query_embedding / (np.linalg.norm(query_embedding) + 1e-9)

            # Build query with cosine distance
            query_str = f"""
                SELECT
                    track_id,
                    1 - (embedding <=> '{query_embedding.tolist()}') as similarity,
                    bpm,
                    key,
                    energy,
                    style_source,
                    metadata
                FROM track_embeddings
            """

            # Add filters
            where_clauses = []
            if filters:
                if "min_bpm" in filters:
                    where_clauses.append(f"bpm >= {filters['min_bpm']}")
                if "max_bpm" in filters:
                    where_clauses.append(f"bpm <= {filters['max_bpm']}")
                if "key" in filters:
                    where_clauses.append(f"key = '{filters['key']}'")
                if "style_source" in filters:
                    where_clauses.append(f"style_source = '{filters['style_source']}'")

            if where_clauses:
                query_str += " WHERE " + " AND ".join(where_clauses)

            query_str += f" ORDER BY embedding <=> '{query_embedding.tolist()}' LIMIT {k}"

            with self._engine.begin() as conn:
                result = conn.execute(text(query_str))
                rows = result.fetchall()

            return [
                {
                    "track_id": row[0],
                    "similarity": float(row[1]),
                    "bpm": row[2],
                    "key": row[3],
                    "energy": row[4],
                    "style_source": row[5],
                    "metadata": row[6],
                }
                for row in rows
            ]

        except Exception as e:
            logger.error(f"Similarity search failed: {e}")
            return []

    def search_by_track_id(
        self,
        track_id: str,
        k: int = 10,
        exclude_self: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Find tracks similar to a given track.

        Args:
            track_id: Source track ID
            k: Number of results
            exclude_self: Exclude source track from results

        Returns:
            List of similar tracks
        """
        if not self._ensure_initialized():
            return []

        try:
            # Get source embedding
            from sqlalchemy import select

            with self._engine.begin() as conn:
                result = conn.execute(
                    select(self._table.c.embedding).where(
                        self._table.c.track_id == track_id
                    )
                ).first()

            if not result:
                logger.warning(f"Track not found: {track_id}")
                return []

            query_embedding = np.array(result[0], dtype=np.float32)

            # Search for similar
            results = self.search_similar(
                query_embedding,
                k=k + 1 if exclude_self else k,
            )

            # Exclude self if requested
            if exclude_self:
                results = [r for r in results if r["track_id"] != track_id][:k]

            return results

        except Exception as e:
            logger.error(f"Search by track_id failed: {e}")
            return []

    def get_embedding(self, track_id: str) -> Optional[np.ndarray]:
        """Get embedding for a track."""
        if not self._ensure_initialized():
            return None

        try:
            from sqlalchemy import select

            with self._engine.begin() as conn:
                result = conn.execute(
                    select(self._table.c.embedding).where(
                        self._table.c.track_id == track_id
                    )
                ).first()

            if result:
                return np.array(result[0], dtype=np.float32)
            return None

        except Exception as e:
            logger.error(f"Failed to get embedding: {e}")
            return None

    def count(self) -> int:
        """Get total number of embeddings."""
        if not self._ensure_initialized():
            return 0

        try:
            from sqlalchemy import func, select

            with self._engine.begin() as conn:
                result = conn.execute(
                    select(func.count()).select_from(self._table)
                ).scalar()

            return result or 0

        except Exception as e:
            logger.error(f"Count failed: {e}")
            return 0


# ============================================================================
# Global Instance
# ============================================================================

_pgvector_store: Optional[PgVectorStore] = None


def get_pgvector_store() -> PgVectorStore:
    """Get or create global pgvector store."""
    global _pgvector_store
    if _pgvector_store is None:
        _pgvector_store = PgVectorStore()
    return _pgvector_store


def init_pgvector() -> bool:
    """Initialize pgvector store."""
    store = get_pgvector_store()
    return store._ensure_initialized()


# ============================================================================
# Hybrid Store (pgvector + in-memory fallback)
# ============================================================================

class HybridVectorStore:
    """
    Hybrid vector store that uses pgvector when available,
    falls back to in-memory cosine similarity.
    """

    def __init__(self):
        self.pgvector = get_pgvector_store() if PGVECTOR_AVAILABLE else None
        self._use_pgvector = False

    def _check_pgvector(self) -> bool:
        """Check if pgvector is usable."""
        if not self._use_pgvector and self.pgvector:
            self._use_pgvector = self.pgvector._ensure_initialized()
        return self._use_pgvector

    def search_similar(
        self,
        track_id: str,
        k: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Search for similar tracks.

        Uses pgvector if available, otherwise falls back to in-memory.
        """
        if self._check_pgvector():
            return self.pgvector.search_by_track_id(track_id, k)

        # Fallback to in-memory
        from .vector_store import similar
        return similar(track_id, k)

    def upsert(
        self,
        track_id: str,
        embedding: np.ndarray,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Upsert embedding.

        Stores in pgvector if available.
        """
        if self._check_pgvector():
            return self.pgvector.upsert_embedding(track_id, embedding, metadata)

        # In-memory store doesn't persist embeddings
        logger.debug(f"Skipping embedding storage (in-memory mode): {track_id}")
        return True


def get_hybrid_store() -> HybridVectorStore:
    """Get hybrid vector store."""
    return HybridVectorStore()
