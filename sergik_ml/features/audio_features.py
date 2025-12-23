"""
SERGIK ML Audio Feature Extraction

Extracts ML-ready features from audio files using librosa.

Features:
  - Tempo/BPM
  - Energy (RMS)
  - Brightness (spectral centroid)
  - LUFS loudness
  - Harmonic/Percussive ratio
  - Stereo width
  - Key estimation
  - Structure detection
"""

from typing import Dict, Any, Optional, Tuple
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Lazy imports for optional heavy dependencies
_librosa = None
_pyln = None


def _get_librosa():
    global _librosa
    if _librosa is None:
        import librosa
        _librosa = librosa
    return _librosa


def _get_pyloudnorm():
    global _pyln
    if _pyln is None:
        import pyloudnorm as pyln
        _pyln = pyln
    return _pyln


def extract_audio_features(wav_path: str, sr: Optional[int] = None) -> Dict[str, Any]:
    """
    Extract core audio features from a WAV file.

    Args:
        wav_path: Path to audio file
        sr: Sample rate (None = use file's native rate)

    Returns:
        Dictionary of extracted features
    """
    librosa = _get_librosa()
    pyln = _get_pyloudnorm()

    try:
        y, sr = librosa.load(wav_path, sr=sr, mono=True)
        duration = librosa.get_duration(y=y, sr=sr)

        # Tempo
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        tempo = float(np.atleast_1d(tempo)[0])

        # Energy (RMS)
        rms = librosa.feature.rms(y=y)[0]
        energy = float(np.mean(rms))
        energy_std = float(np.std(rms))

        # Brightness (spectral centroid)
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        brightness = float(np.mean(centroid))

        # Harmonic/Percussive separation
        y_harmonic = librosa.effects.harmonic(y)
        y_percussive = librosa.effects.percussive(y)

        harmonic_energy = float(np.mean(np.abs(y_harmonic)))
        percussive_energy = float(np.mean(np.abs(y_percussive)))
        total_energy = float(np.mean(np.abs(y))) + 1e-9

        harmonic_ratio = harmonic_energy / total_energy
        percussive_ratio = percussive_energy / total_energy

        # LUFS loudness
        meter = pyln.Meter(sr)
        lufs = float(meter.integrated_loudness(y))

        # Stereo width (placeholder for mono)
        stereo_width = 0.0

        return {
            "bpm": tempo,
            "energy": energy,
            "energy_std": energy_std,
            "brightness": brightness,
            "lufs": lufs,
            "harmonic_ratio": harmonic_ratio,
            "percussive_ratio": percussive_ratio,
            "stereo_width": stereo_width,
            "duration": duration,
            "sample_rate": sr,
        }

    except Exception as e:
        logger.error(f"Feature extraction failed for {wav_path}: {e}")
        return {}


def extract_full_features(wav_path: str, sr: Optional[int] = None) -> Dict[str, Any]:
    """
    Extract comprehensive features including MFCCs and structure.
    """
    librosa = _get_librosa()

    # Get basic features
    features = extract_audio_features(wav_path, sr)
    if not features:
        return {}

    try:
        y, sr = librosa.load(wav_path, sr=sr, mono=True)

        # MFCCs for timbral fingerprint
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1).tolist()
        mfcc_std = np.std(mfcc, axis=1).tolist()

        # Chroma for key/harmony
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_mean = np.mean(chroma, axis=1)

        # Key estimation
        keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        key_idx = int(np.argmax(chroma_mean))
        estimated_key = keys[key_idx]

        # Spectral features
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
        zcr = librosa.feature.zero_crossing_rate(y)[0]

        features.update({
            "key": estimated_key,
            "mfcc_mean": mfcc_mean,
            "mfcc_std": mfcc_std,
            "chroma_profile": chroma_mean.tolist(),
            "spectral_rolloff": float(np.mean(rolloff)),
            "spectral_bandwidth": float(np.mean(bandwidth)),
            "zero_crossing_rate": float(np.mean(zcr)),
        })

        return features

    except Exception as e:
        logger.error(f"Full feature extraction failed: {e}")
        return features


def estimate_key(wav_path: str) -> Tuple[str, str]:
    """
    Estimate musical key of audio file.

    Returns:
        Tuple of (key, mode) e.g., ("C", "major")
    """
    librosa = _get_librosa()

    try:
        y, sr = librosa.load(wav_path, sr=22050, mono=True)
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_mean = np.mean(chroma, axis=1)

        keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

        # Simple major/minor detection using Krumhansl-Schmuckler profiles
        major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
        minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

        major_corrs = [np.corrcoef(np.roll(major_profile, i), chroma_mean)[0, 1] for i in range(12)]
        minor_corrs = [np.corrcoef(np.roll(minor_profile, i), chroma_mean)[0, 1] for i in range(12)]

        major_best = max(range(12), key=lambda i: major_corrs[i])
        minor_best = max(range(12), key=lambda i: minor_corrs[i])

        if major_corrs[major_best] > minor_corrs[minor_best]:
            return keys[major_best], "major"
        else:
            return keys[minor_best], "minor"

    except Exception as e:
        logger.error(f"Key estimation failed: {e}")
        return "C", "minor"
