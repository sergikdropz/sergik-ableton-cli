"""
Tests for AbletonService transform methods
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from sergik_ml.services.ableton_service import AbletonService


@pytest.fixture
def ableton_service():
    """Create AbletonService instance for testing."""
    service = AbletonService()
    service.logger = Mock()
    return service


@pytest.mark.asyncio
async def test_quantize_clip(ableton_service):
    """Test quantize_clip method."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.return_value = {
            "status": "ok",
            "routed": "ableton_osc",
            "address": "/scp/quantize_clip"
        }
        
        result = await ableton_service.quantize_clip(
            track_index=0,
            clip_slot=0,
            grid="1/16",
            strength=100
        )
        
        assert result["status"] == "ok"
        assert "Quantized" in result["message"]
        mock_exec.assert_called_once_with(
            "live.quantize_clip",
            {
                "track_index": 0,
                "clip_slot": 0,
                "grid": "1/16",
                "strength": 100
            }
        )


@pytest.mark.asyncio
async def test_transpose_clip(ableton_service):
    """Test transpose_clip method."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.return_value = {"status": "ok"}
        
        result = await ableton_service.transpose_clip(
            track_index=0,
            clip_slot=0,
            semitones=12
        )
        
        assert result["status"] == "ok"
        assert "Transposed" in result["message"]
        assert "12 semitones up" in result["message"]


@pytest.mark.asyncio
async def test_adjust_velocity(ableton_service):
    """Test adjust_velocity method."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.return_value = {"status": "ok"}
        
        result = await ableton_service.adjust_velocity(
            track_index=0,
            clip_slot=0,
            operation="set",
            value=100
        )
        
        assert result["status"] == "ok"
        assert "Velocity" in result["message"]


@pytest.mark.asyncio
async def test_make_legato(ableton_service):
    """Test make_legato method."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.return_value = {"status": "ok"}
        
        result = await ableton_service.make_legato(
            track_index=0,
            clip_slot=0
        )
        
        assert result["status"] == "ok"
        assert "legato" in result["message"].lower()


@pytest.mark.asyncio
async def test_remove_overlaps(ableton_service):
    """Test remove_overlaps method."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.return_value = {"status": "ok"}
        
        result = await ableton_service.remove_overlaps(
            track_index=0,
            clip_slot=0
        )
        
        assert result["status"] == "ok"
        assert "Overlapping" in result["message"]


@pytest.mark.asyncio
async def test_apply_fade(ableton_service):
    """Test apply_fade method."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.return_value = {"status": "ok"}
        
        result = await ableton_service.apply_fade(
            track_index=0,
            clip_slot=0,
            fade_type="in",
            duration=0.5
        )
        
        assert result["status"] == "ok"
        assert "Fade" in result["message"]


@pytest.mark.asyncio
async def test_normalize_audio(ableton_service):
    """Test normalize_audio method."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.return_value = {"status": "ok"}
        
        result = await ableton_service.normalize_audio(
            track_index=0,
            clip_slot=0,
            target_level=-0.1
        )
        
        assert result["status"] == "ok"
        assert "Normalized" in result["message"]


@pytest.mark.asyncio
async def test_time_stretch(ableton_service):
    """Test time_stretch method."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.return_value = {"status": "ok"}
        
        result = await ableton_service.time_stretch(
            track_index=0,
            clip_slot=0,
            factor=1.5
        )
        
        assert result["status"] == "ok"
        assert "Time stretched" in result["message"]


@pytest.mark.asyncio
async def test_pitch_shift(ableton_service):
    """Test pitch_shift method."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.return_value = {"status": "ok"}
        
        result = await ableton_service.pitch_shift(
            track_index=0,
            clip_slot=0,
            semitones=7
        )
        
        assert result["status"] == "ok"
        assert "Pitch shifted" in result["message"]


@pytest.mark.asyncio
async def test_time_shift(ableton_service):
    """Test time_shift method."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.return_value = {"status": "ok"}
        
        result = await ableton_service.time_shift(
            track_index=0,
            clip_slot=0,
            direction="right",
            amount=0.25
        )
        
        assert result["status"] == "ok"
        assert "Time shifted" in result["message"]


@pytest.mark.asyncio
async def test_export_track(ableton_service):
    """Test export_track method."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.return_value = {"status": "ok"}
        
        result = await ableton_service.export_track(
            track_index=0,
            clip_slot=None,
            format="wav",
            location="/tmp",
            export_stems=False
        )
        
        assert result["status"] == "ok"
        assert "export" in result["message"].lower()
        assert "file_path" in result


@pytest.mark.asyncio
async def test_batch_export(ableton_service):
    """Test batch_export method."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.return_value = {"status": "ok"}
        
        result = await ableton_service.batch_export(
            format="wav",
            location="/tmp",
            export_stems=False,
            tracks=[0, 1, 2]
        )
        
        assert result["status"] == "ok"
        assert result["files_exported"] == 3


@pytest.mark.asyncio
async def test_export_stems(ableton_service):
    """Test export_stems method."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.return_value = {"status": "ok"}
        
        result = await ableton_service.export_stems(
            track_index=0,
            format="wav",
            location="/tmp"
        )
        
        assert result["status"] == "ok"
        assert "Stem export" in result["message"]


@pytest.mark.asyncio
async def test_quantize_clip_error_handling(ableton_service):
    """Test quantize_clip error handling."""
    with patch.object(ableton_service, 'execute_command') as mock_exec:
        mock_exec.side_effect = Exception("OSC connection failed")
        
        result = await ableton_service.quantize_clip(
            track_index=0,
            clip_slot=0,
            grid="1/16",
            strength=100
        )
        
        assert result["status"] == "error"
        assert "error" in result or "OSC" in result["message"]

