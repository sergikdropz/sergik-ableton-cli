"""
Service Bridge - Connects Agents to SERGIK ML Services
"""

import sys
import time
from pathlib import Path
from typing import Optional, Dict, Any
import logging
from functools import wraps

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from sergik_ml.core.container import get_container
    from sergik_ml.services.generation_service import GenerationService
    from sergik_ml.services.ableton_service import AbletonService
    from sergik_ml.services.analysis_service import AnalysisService
    from sergik_ml.services.track_service import TrackService
    from sergik_ml.services.voice_service import VoiceService
    from sergik_ml.services.state_service import StateService
    from sergik_ml.connectors.ableton_osc import osc_send, osc_status, osc_error
    from sergik_ml.config import CFG
    SERGIK_ML_AVAILABLE = True
except ImportError as e:
    SERGIK_ML_AVAILABLE = False
    logging.warning(f"SERGIK ML not available: {e}")

logger = logging.getLogger(__name__)


def retry_on_failure(max_attempts: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """
    Retry decorator for service calls.
    
    Args:
        max_attempts: Maximum number of retry attempts
        delay: Initial delay between retries (seconds)
        backoff: Multiplier for delay on each retry
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            current_delay = delay
            
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        logger.warning(
                            f"Service call failed (attempt {attempt + 1}/{max_attempts}): {e}. "
                            f"Retrying in {current_delay}s..."
                        )
                        time.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        logger.error(f"Service call failed after {max_attempts} attempts: {e}")
            
            raise last_exception
        return wrapper
    return decorator


class SergikServiceBridge:
    """Bridge to access SERGIK ML services from agents."""
    
    def __init__(self):
        """Initialize bridge with service container."""
        if not SERGIK_ML_AVAILABLE:
            raise RuntimeError("SERGIK ML services not available")
        
        self.container = get_container()
        self._services: Dict[str, Any] = {}
        self._health_cache: Dict[str, tuple] = {}  # (status, timestamp)
        self._health_cache_ttl = 30  # seconds
        logger.info("Service bridge initialized")
    
    @retry_on_failure(max_attempts=3, delay=1.0)
    def get_generation_service(self) -> "GenerationService":
        """Get generation service with retry logic."""
        if "generation" not in self._services:
            self._services["generation"] = self.container.get("generation_service")
        return self._services["generation"]

    @retry_on_failure(max_attempts=3, delay=1.0)
    def get_ableton_service(self) -> "AbletonService":
        """Get Ableton service with retry logic."""
        if "ableton" not in self._services:
            self._services["ableton"] = self.container.get("ableton_service")
        return self._services["ableton"]

    @retry_on_failure(max_attempts=3, delay=1.0)
    def get_analysis_service(self) -> "AnalysisService":
        """Get analysis service with retry logic."""
        if "analysis" not in self._services:
            self._services["analysis"] = self.container.get("analysis_service")
        return self._services["analysis"]

    @retry_on_failure(max_attempts=3, delay=1.0)
    def get_track_service(self) -> "TrackService":
        """Get track service with retry logic."""
        if "track" not in self._services:
            self._services["track"] = self.container.get("track_service")
        return self._services["track"]

    @retry_on_failure(max_attempts=3, delay=1.0)
    def get_voice_service(self) -> "VoiceService":
        """Get voice service with retry logic."""
        if "voice" not in self._services:
            self._services["voice"] = self.container.get("voice_service")
        return self._services["voice"]

    @retry_on_failure(max_attempts=3, delay=1.0)
    def get_state_service(self) -> "StateService":
        """Get state service with retry logic."""
        if "state" not in self._services:
            self._services["state"] = self.container.get("state_service")
        return self._services["state"]
    
    def send_osc(self, address: str, payload: Dict[str, Any]) -> bool:
        """Send OSC message to Ableton."""
        try:
            result = osc_send(address, payload)
            if not result:
                logger.warning(f"OSC send returned False for {address}")
            return result
        except Exception as e:
            logger.error(f"OSC send failed for {address}: {e}", exc_info=True)
            return False
    
    def get_config(self) -> Dict[str, Any]:
        """Get SERGIK ML configuration."""
        return {
            "osc_host": CFG.ableton_osc_host,
            "osc_port": CFG.ableton_osc_port,
            "api_host": CFG.host,
            "api_port": CFG.port,
        }
    
    def _check_service_health(self, service_name: str) -> bool:
        """Check if a specific service is healthy."""
        try:
            service = self.container.get(service_name)
            # Basic health check - service exists and is not None
            return service is not None
        except Exception as e:
            logger.debug(f"Health check failed for {service_name}: {e}")
            return False
    
    def check_health(self, use_cache: bool = True) -> Dict[str, Any]:
        """
        Check health of all services.
        
        Args:
            use_cache: Use cached health results if available
            
        Returns:
            Dict with health status for each service
        """
        current_time = time.time()
        service_names = [
            "generation_service",
            "ableton_service",
            "analysis_service",
            "track_service",
            "voice_service",
            "state_service",
        ]
        
        health_status = {}
        all_healthy = True
        
        for service_name in service_names:
            cache_key = service_name
            
            # Check cache
            if use_cache and cache_key in self._health_cache:
                status, timestamp = self._health_cache[cache_key]
                if current_time - timestamp < self._health_cache_ttl:
                    health_status[service_name] = status
                    if not status:
                        all_healthy = False
                    continue
            
            # Perform health check
            try:
                is_healthy = self._check_service_health(service_name)
                health_status[service_name] = is_healthy
                self._health_cache[cache_key] = (is_healthy, current_time)
                if not is_healthy:
                    all_healthy = False
            except Exception as e:
                logger.error(f"Error checking health for {service_name}: {e}")
                health_status[service_name] = False
                self._health_cache[cache_key] = (False, current_time)
                all_healthy = False
        
        return {
            "healthy": all_healthy,
            "services": health_status,
            "timestamp": current_time
        }


# Global bridge instance
_bridge: Optional[SergikServiceBridge] = None


def get_bridge() -> SergikServiceBridge:
    """Get global service bridge."""
    global _bridge
    if _bridge is None:
        _bridge = SergikServiceBridge()
    return _bridge


def is_available() -> bool:
    """Check if SERGIK ML is available."""
    return SERGIK_ML_AVAILABLE

