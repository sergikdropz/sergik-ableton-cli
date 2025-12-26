"""
Tracks Router

Track management and similarity search endpoints.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List

from ...schemas import ActionIn, ActionOut, RateTrackRequest
from ...api.dependencies import get_track_service
from ...services.track_service import TrackService
from ...utils.errors import ValidationError as SergikValidationError, DatabaseError
from ...stores.sql_store import get_track, list_tracks
from ...stores.vector_store import similar as vector_similar
from ...pipelines.pack_pipeline import rate_track as rate_track_pipeline

router = APIRouter(prefix="/tracks", tags=["tracks"])


@router.get("")
def get_tracks(
    limit: int = Query(100, ge=1, le=5000),
    rated_only: bool = Query(False),
    track_service: TrackService = Depends(get_track_service)
):
    """List tracks in database."""
    tracks = track_service.list_tracks(limit=limit, rated_only=rated_only)
    return {"tracks": tracks, "count": len(tracks)}


@router.get("/{track_id}")
def get_track_detail(
    track_id: str,
    track_service: TrackService = Depends(get_track_service)
):
    """Get track details by ID."""
    track = track_service.get_track(track_id)
    if not track:
        raise HTTPException(status_code=404, detail=f"Track not found: {track_id}")
    return track


@router.get("/similar/{track_id}")
def get_similar(
    track_id: str,
    k: int = Query(10, ge=1, le=100),
    style: Optional[str] = Query(None),
    track_service: TrackService = Depends(get_track_service)
):
    """Find similar tracks."""
    result = track_service.find_similar(
        track_id=track_id,
        k=k,
        style_filter=style
    )
    return result


@router.post("/{track_id}/rate")
def rate_track_endpoint(
    track_id: str,
    request: RateTrackRequest,
    track_service: TrackService = Depends(get_track_service)
):
    """Rate a track for preference learning."""
    if track_id != request.track_id:
        raise HTTPException(status_code=400, detail="Track ID mismatch")
    
    result = track_service.rate_track(
        track_id=request.track_id,
        rating=request.rating,
        context=request.context
    )
    return result


@router.post("/rate_batch")
def rate_tracks_batch(
    ratings: List[RateTrackRequest],
    track_service: TrackService = Depends(get_track_service)
):
    """Rate multiple tracks in batch."""
    results = []
    for rating_request in ratings:
        try:
            result = track_service.rate_track(
                track_id=rating_request.track_id,
                rating=rating_request.rating,
                context=rating_request.context
            )
            results.append({"status": "success", "track_id": rating_request.track_id, **result})
        except (SergikValidationError, DatabaseError) as e:
            results.append({"status": "error", "track_id": rating_request.track_id, "error": str(e)})
        except Exception as e:
            results.append({"status": "error", "track_id": rating_request.track_id, "error": str(e)})
    
    return {
        "total": len(ratings),
        "success": sum(1 for r in results if r["status"] == "success"),
        "errors": sum(1 for r in results if r["status"] == "error"),
        "results": results
    }


@router.get("/ratings/stats")
def get_rating_stats():
    """Get rating statistics."""
    from ...stores.sql_store import engine, music_intelligence
    from sqlalchemy import select, func
    from collections import Counter
    
    with engine.begin() as conn:
        # Total tracks
        total = conn.execute(select(func.count()).select_from(music_intelligence)).scalar()
        
        # Rated tracks
        rated = conn.execute(
            select(func.count()).select_from(music_intelligence).where(
                music_intelligence.c.rating.isnot(None)
            )
        ).scalar()
        
        # Average rating
        avg_rating = conn.execute(
            select(func.avg(music_intelligence.c.rating)).where(
                music_intelligence.c.rating.isnot(None)
            )
        ).scalar()
        
        # Rating distribution
        rating_rows = conn.execute(
            select(music_intelligence.c.rating).where(
                music_intelligence.c.rating.isnot(None)
            )
        ).fetchall()
        ratings = [int(float(r[0])) for r in rating_rows if r[0] is not None]
        distribution = dict(Counter(ratings))
    
    return {
        "total_tracks": total,
        "rated_tracks": rated,
        "rated_percentage": (rated / total * 100) if total > 0 else 0,
        "avg_rating": float(avg_rating) if avg_rating else None,
        "rating_distribution": distribution,
    }

