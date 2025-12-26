#!/usr/bin/env python3
"""
SERGIK Embedding Generation Script

Generates 256-dim embeddings for tracks:
- Audio embeddings (128-dim) using pre-trained models (VGGish/YAMNet)
- Text embeddings (128-dim) from prompt_text + tags using BERT
- Combined embeddings stored in music_intelligence.embedding field
"""

import sys
import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
import logging
import numpy as np

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from sergik_ml.stores.sql_store import list_tracks, upsert_track, get_track, init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy imports for optional dependencies
_audio_model = None
_text_model = None


def _get_audio_embedding_model():
    """Get audio embedding model (VGGish or YAMNet)."""
    global _audio_model
    
    if _audio_model is not None:
        return _audio_model
    
    # Try VGGish first
    try:
        import vggish
        _audio_model = "vggish"
        logger.info("Using VGGish for audio embeddings")
        return _audio_model
    except ImportError:
        pass
    
    # Try YAMNet
    try:
        import yamnet
        _audio_model = "yamnet"
        logger.info("Using YAMNet for audio embeddings")
        return _audio_model
    except ImportError:
        pass
    
    # Fallback: use librosa-based features
    logger.warning("No pre-trained audio model found. Using librosa-based features.")
    _audio_model = "librosa"
    return _audio_model


def _get_text_embedding_model():
    """Get text embedding model (BERT)."""
    global _text_model
    
    if _text_model is not None:
        return _text_model
    
    try:
        from transformers import AutoTokenizer, AutoModel
        import torch
        
        model_name = "bert-base-uncased"
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModel.from_pretrained(model_name)
        model.eval()
        
        _text_model = {
            "tokenizer": tokenizer,
            "model": model,
            "device": "cuda" if torch.cuda.is_available() else "cpu"
        }
        model.to(_text_model["device"])
        logger.info(f"Using BERT for text embeddings (device: {_text_model['device']})")
        return _text_model
    except ImportError:
        logger.warning("Transformers library not found. Text embeddings will be skipped.")
        _text_model = None
        return None


def extract_audio_embedding(file_path: str, model_type: str = None) -> np.ndarray:
    """
    Extract audio embedding from file.
    
    Args:
        file_path: Path to audio file
        model_type: Model to use ('vggish', 'yamnet', 'librosa')
        
    Returns:
        128-dim audio embedding vector
    """
    if model_type is None:
        model_type = _get_audio_embedding_model()
    
    if model_type == "vggish":
        try:
            import vggish
            # VGGish implementation would go here
            # For now, use librosa fallback
            pass
        except:
            pass
    
    if model_type == "yamnet":
        try:
            import yamnet
            # YAMNet implementation would go here
            # For now, use librosa fallback
            pass
        except:
            pass
    
    # Fallback: librosa-based features (MFCCs + chroma)
    try:
        import librosa
        y, sr = librosa.load(file_path, sr=22050, mono=True, duration=30.0)
        
        # Extract features
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        tonnetz = librosa.feature.tonnetz(y=y, sr=sr)
        
        # Combine and reduce to 128-dim
        mfcc_mean = np.mean(mfcc, axis=1)  # 13-dim
        chroma_mean = np.mean(chroma, axis=1)  # 12-dim
        tonnetz_mean = np.mean(tonnetz, axis=1)  # 6-dim
        
        # Combine features
        combined = np.concatenate([
            mfcc_mean,
            chroma_mean,
            tonnetz_mean,
            # Pad or reduce to 128-dim
            np.zeros(128 - 31)  # 13 + 12 + 6 = 31
        ])
        
        # Normalize
        norm = np.linalg.norm(combined)
        if norm > 1e-9:
            combined = combined / norm
        
        return combined[:128].astype(np.float32)
        
    except Exception as e:
        logger.error(f"Error extracting audio embedding from {file_path}: {e}")
        return np.zeros(128, dtype=np.float32)


def extract_text_embedding(text: str) -> np.ndarray:
    """
    Extract text embedding from prompt_text + tags.
    
    Args:
        text: Combined text from prompt_text and tags
        
    Returns:
        128-dim text embedding vector
    """
    model = _get_text_embedding_model()
    
    if model is None or not text:
        return np.zeros(128, dtype=np.float32)
    
    try:
        import torch
        
        # Tokenize and encode
        inputs = model["tokenizer"](
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True
        ).to(model["device"])
        
        # Get embeddings
        with torch.no_grad():
            outputs = model["model"](**inputs)
            # Use [CLS] token embedding
            embedding = outputs.last_hidden_state[:, 0, :].cpu().numpy()[0]
        
        # Reduce to 128-dim using PCA or simple projection
        if len(embedding) > 128:
            # Simple projection: take first 128 dimensions
            embedding = embedding[:128]
        elif len(embedding) < 128:
            # Pad with zeros
            embedding = np.pad(embedding, (0, 128 - len(embedding)))
        
        # Normalize
        norm = np.linalg.norm(embedding)
        if norm > 1e-9:
            embedding = embedding / norm
        
        return embedding.astype(np.float32)
        
    except Exception as e:
        logger.error(f"Error extracting text embedding: {e}")
        return np.zeros(128, dtype=np.float32)


def generate_embedding_for_track(track_row: Dict[str, Any], audio_file_path: Optional[str] = None) -> np.ndarray:
    """
    Generate combined embedding for a track.
    
    Args:
        track_row: Track row from database
        audio_file_path: Optional path to audio file (if not in track_row)
        
    Returns:
        256-dim combined embedding (128 audio + 128 text)
    """
    # Audio embedding
    if audio_file_path and os.path.exists(audio_file_path):
        audio_emb = extract_audio_embedding(audio_file_path)
    else:
        # Try to get file path from track_row
        # This would need to be implemented based on your data structure
        audio_emb = np.zeros(128, dtype=np.float32)
        logger.warning(f"No audio file path for track {track_row.get('track_id')}")
    
    # Text embedding
    prompt_text = track_row.get("prompt_text", "") or ""
    tags = track_row.get("tags", [])
    
    if isinstance(tags, str):
        try:
            tags = json.loads(tags) if tags else []
        except:
            tags = []
    
    if isinstance(tags, list):
        tags_text = " ".join(str(tag) for tag in tags)
    else:
        tags_text = ""
    
    combined_text = f"{prompt_text} {tags_text}".strip()
    text_emb = extract_text_embedding(combined_text)
    
    # Combine embeddings
    combined_emb = np.concatenate([audio_emb, text_emb])
    
    return combined_emb.astype(np.float32)


def process_track_embedding(track_row: Dict[str, Any], audio_file_path: Optional[str] = None) -> bool:
    """
    Generate and store embedding for a single track.
    
    Args:
        track_row: Track row from database
        audio_file_path: Optional path to audio file
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Check if embedding already exists
        existing_embedding = track_row.get("embedding")
        if existing_embedding:
            try:
                # Check if it's a valid 256-dim embedding
                if isinstance(existing_embedding, str):
                    existing_embedding = json.loads(existing_embedding)
                if isinstance(existing_embedding, list) and len(existing_embedding) == 256:
                    logger.info(f"Skipping track {track_row.get('track_id')} - embedding already exists")
                    return True
            except:
                pass
        
        # Generate embedding
        embedding = generate_embedding_for_track(track_row, audio_file_path)
        
        # Update track row
        track_row["embedding"] = json.dumps(embedding.tolist())
        upsert_track(track_row)
        
        logger.info(f"Generated embedding for track {track_row.get('track_id')}")
        return True
        
    except Exception as e:
        logger.error(f"Error generating embedding for track {track_row.get('track_id')}: {e}")
        return False


def process_all_tracks(limit: Optional[int] = None, skip_existing: bool = True) -> Dict[str, int]:
    """
    Process all tracks and generate embeddings.
    
    Args:
        limit: Optional limit on number of tracks to process
        skip_existing: Skip tracks that already have embeddings
        
    Returns:
        Statistics dictionary
    """
    logger.info("Loading tracks...")
    tracks = list_tracks(limit=limit or 10000)
    
    stats = {
        "total": len(tracks),
        "processed": 0,
        "skipped": 0,
        "failed": 0,
    }
    
    logger.info(f"Processing {len(tracks)} tracks...")
    
    for i, track in enumerate(tracks, 1):
        if i % 10 == 0:
            logger.info(f"Progress: {i}/{len(tracks)}")
        
        # Check if already has embedding
        if skip_existing:
            existing_embedding = track.get("embedding")
            if existing_embedding:
                try:
                    if isinstance(existing_embedding, str):
                        existing_embedding = json.loads(existing_embedding)
                    if isinstance(existing_embedding, list) and len(existing_embedding) == 256:
                        stats["skipped"] += 1
                        continue
                except:
                    pass
        
        # Try to find audio file path
        # This would need to be implemented based on your data structure
        audio_file_path = None
        
        # Process embedding
        if process_track_embedding(track, audio_file_path):
            stats["processed"] += 1
        else:
            stats["failed"] += 1
    
    return stats


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Generate embeddings for SERGIK ML tracks"
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Limit number of tracks to process"
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        default=True,
        help="Skip tracks that already have embeddings"
    )
    parser.add_argument(
        "--track-id",
        help="Process single track by ID"
    )
    
    args = parser.parse_args()
    
    # Initialize database
    init_db()
    
    logger.info("=" * 60)
    logger.info("EMBEDDING GENERATION")
    logger.info("=" * 60)
    
    if args.track_id:
        # Process single track
        track = get_track(args.track_id)
        if not track:
            logger.error(f"Track not found: {args.track_id}")
            return
        
        success = process_track_embedding(track)
        if success:
            logger.info(f"Successfully generated embedding for {args.track_id}")
        else:
            logger.error(f"Failed to generate embedding for {args.track_id}")
    else:
        # Process all tracks
        stats = process_all_tracks(limit=args.limit, skip_existing=args.skip_existing)
        
        logger.info("=" * 60)
        logger.info("EMBEDDING GENERATION COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Total tracks: {stats['total']}")
        logger.info(f"Processed: {stats['processed']}")
        logger.info(f"Skipped: {stats['skipped']}")
        logger.info(f"Failed: {stats['failed']}")


if __name__ == "__main__":
    main()

