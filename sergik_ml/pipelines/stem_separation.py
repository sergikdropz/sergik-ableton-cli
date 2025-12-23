"""
SERGIK ML Stem Separation Engine

Demucs-powered audio source separation for isolating:
  - Drums
  - Bass
  - Vocals
  - Other (keys, synths, fx)

Usage:
    from sergik_ml.pipelines.stem_separation import separate_stems
    stems = separate_stems("/path/to/mix.wav", output_dir="/path/to/stems")
"""

import logging
import shutil
from pathlib import Path
from typing import Dict, Any, Optional, List
import subprocess
import json

logger = logging.getLogger(__name__)

# Demucs model options
DEMUCS_MODELS = {
    "htdemucs": "High-quality 4-stem (drums, bass, vocals, other)",
    "htdemucs_ft": "Fine-tuned version, best quality",
    "htdemucs_6s": "6-stem (drums, bass, vocals, guitar, piano, other)",
    "mdx_extra": "MDX competition model, fast",
}

DEFAULT_MODEL = "htdemucs"


class StemSeparator:
    """
    Demucs-based stem separation engine.

    Separates audio into component stems for sample pack creation.
    """

    def __init__(self, model: str = DEFAULT_MODEL, device: str = "auto"):
        """
        Initialize stem separator.

        Args:
            model: Demucs model name
            device: 'cuda', 'cpu', or 'auto'
        """
        self.model = model
        self.device = device
        self._demucs_available = None

    def is_available(self) -> bool:
        """Check if Demucs is installed and available."""
        if self._demucs_available is None:
            try:
                import demucs
                self._demucs_available = True
                logger.info(f"Demucs available: {demucs.__version__}")
            except ImportError:
                self._demucs_available = False
                logger.warning("Demucs not installed. Install with: pip install demucs")
        return self._demucs_available

    def separate(
        self,
        audio_path: str,
        output_dir: Optional[str] = None,
        stems: Optional[List[str]] = None,
        sample_rate: int = 44100,
        mp3: bool = False,
        float32: bool = True,
    ) -> Dict[str, Any]:
        """
        Separate audio into stems.

        Args:
            audio_path: Path to input audio file
            output_dir: Output directory (default: same as input)
            stems: List of stems to extract (default: all)
            sample_rate: Output sample rate
            mp3: Output as MP3 instead of WAV
            float32: Use 32-bit float output

        Returns:
            Dict with stem paths and metadata
        """
        audio_path = Path(audio_path)
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        if output_dir is None:
            output_dir = audio_path.parent / f"{audio_path.stem}_stems"
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        if not self.is_available():
            return self._separate_fallback(audio_path, output_dir)

        return self._separate_demucs(
            audio_path, output_dir, stems, sample_rate, mp3, float32
        )

    def _separate_demucs(
        self,
        audio_path: Path,
        output_dir: Path,
        stems: Optional[List[str]],
        sample_rate: int,
        mp3: bool,
        float32: bool,
    ) -> Dict[str, Any]:
        """Separate using Demucs library."""
        try:
            import torch
            from demucs.pretrained import get_model
            from demucs.apply import apply_model
            from demucs.audio import AudioFile, save_audio

            logger.info(f"Loading Demucs model: {self.model}")
            model = get_model(self.model)

            # Determine device
            if self.device == "auto":
                device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            else:
                device = torch.device(self.device)
            model.to(device)

            logger.info(f"Loading audio: {audio_path}")
            wav = AudioFile(audio_path).read(
                streams=0,
                samplerate=model.samplerate,
                channels=model.audio_channels,
            )
            ref = wav.mean(0)
            wav = (wav - ref.mean()) / ref.std()

            logger.info("Separating stems...")
            with torch.no_grad():
                sources = apply_model(
                    model,
                    wav[None].to(device),
                    device=device,
                    progress=True,
                )[0]
            sources = sources * ref.std() + ref.mean()

            # Save stems
            stem_names = model.sources
            result = {
                "input": str(audio_path),
                "output_dir": str(output_dir),
                "model": self.model,
                "stems": {},
            }

            for i, stem_name in enumerate(stem_names):
                if stems and stem_name not in stems:
                    continue

                ext = "mp3" if mp3 else "wav"
                stem_path = output_dir / f"{audio_path.stem}_{stem_name}.{ext}"

                save_audio(
                    sources[i],
                    stem_path,
                    samplerate=sample_rate,
                    bitrate=320 if mp3 else None,
                    as_float=float32,
                )

                result["stems"][stem_name] = str(stem_path)
                logger.info(f"Saved: {stem_path}")

            return result

        except Exception as e:
            logger.error(f"Demucs separation failed: {e}")
            return self._separate_fallback(audio_path, output_dir)

    def _separate_fallback(
        self,
        audio_path: Path,
        output_dir: Path,
    ) -> Dict[str, Any]:
        """
        Fallback: Use CLI demucs if available, otherwise return stub.
        """
        # Try CLI approach
        try:
            cmd = [
                "demucs",
                "--out", str(output_dir.parent),
                "--name", output_dir.name,
                "-n", self.model,
                str(audio_path),
            ]

            logger.info(f"Running CLI: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

            if result.returncode == 0:
                # Find output stems
                stems = {}
                for stem_name in ["drums", "bass", "vocals", "other"]:
                    stem_path = output_dir / f"{stem_name}.wav"
                    if stem_path.exists():
                        stems[stem_name] = str(stem_path)

                return {
                    "input": str(audio_path),
                    "output_dir": str(output_dir),
                    "model": self.model,
                    "stems": stems,
                    "method": "cli",
                }
            else:
                logger.error(f"Demucs CLI failed: {result.stderr}")

        except FileNotFoundError:
            logger.warning("Demucs CLI not found")
        except subprocess.TimeoutExpired:
            logger.error("Demucs CLI timed out")
        except Exception as e:
            logger.error(f"Demucs CLI error: {e}")

        # Return stub result
        logger.warning("Returning stub stem separation result")
        return {
            "input": str(audio_path),
            "output_dir": str(output_dir),
            "model": self.model,
            "stems": {},
            "error": "Demucs not available. Install with: pip install demucs",
            "method": "stub",
        }


# Convenience functions
_separator = None


def get_separator(model: str = DEFAULT_MODEL) -> StemSeparator:
    """Get or create global separator instance."""
    global _separator
    if _separator is None or _separator.model != model:
        _separator = StemSeparator(model=model)
    return _separator


def separate_stems(
    audio_path: str,
    output_dir: Optional[str] = None,
    model: str = DEFAULT_MODEL,
    stems: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Separate audio file into stems.

    Args:
        audio_path: Input audio file path
        output_dir: Output directory for stems
        model: Demucs model to use
        stems: Specific stems to extract (default: all)

    Returns:
        Dict with stem paths and metadata
    """
    separator = get_separator(model)
    return separator.separate(audio_path, output_dir, stems)


def batch_separate(
    audio_paths: List[str],
    output_base_dir: str,
    model: str = DEFAULT_MODEL,
) -> List[Dict[str, Any]]:
    """
    Batch separate multiple audio files.

    Args:
        audio_paths: List of input audio file paths
        output_base_dir: Base directory for all outputs
        model: Demucs model to use

    Returns:
        List of separation results
    """
    separator = get_separator(model)
    results = []

    for audio_path in audio_paths:
        audio_path = Path(audio_path)
        output_dir = Path(output_base_dir) / f"{audio_path.stem}_stems"

        try:
            result = separator.separate(str(audio_path), str(output_dir))
            results.append(result)
        except Exception as e:
            logger.error(f"Failed to separate {audio_path}: {e}")
            results.append({
                "input": str(audio_path),
                "error": str(e),
            })

    return results
