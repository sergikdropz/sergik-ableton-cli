"""
Dependency Injection Container

Thread-safe dependency injection container for SERGIK ML services with lifecycle management.
"""

from typing import Dict, Any, Type, TypeVar, Callable, Optional, List
import logging
import threading
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

T = TypeVar('T')


class LifecycleHook(ABC):
    """Abstract base class for services with lifecycle hooks."""
    
    @abstractmethod
    def startup(self) -> None:
        """Called when service is started."""
        pass
    
    @abstractmethod
    def shutdown(self) -> None:
        """Called when service is shut down."""
        pass


class Container:
    """
    Thread-safe dependency injection container with lifecycle management.
    
    Supports:
    - Singleton registration
    - Factory registration
    - Dependency resolution
    - Lifecycle hooks (startup/shutdown)
    - Thread-safe access
    """
    
    def __init__(self):
        """Initialize container."""
        self._singletons: Dict[str, Any] = {}
        self._factories: Dict[str, Callable] = {}
        self._types: Dict[str, Type] = {}
        self._lifecycle_hooks: List[str] = []  # Services with lifecycle hooks
        self._lock = threading.RLock()  # Reentrant lock for thread safety
        self._initialized = False
    
    def register_singleton(self, name: str, instance: Any) -> None:
        """
        Register a singleton instance.
        
        Args:
            name: Service name
            instance: Service instance
        """
        with self._lock:
            self._singletons[name] = instance
            # Check if instance has lifecycle hooks
            if isinstance(instance, LifecycleHook):
                self._lifecycle_hooks.append(name)
            logger.debug(f"Registered singleton: {name}")
    
    def register_factory(self, name: str, factory: Callable) -> None:
        """
        Register a factory function.
        
        Args:
            name: Service name
            factory: Factory function that returns service instance
        """
        self._factories[name] = factory
        logger.debug(f"Registered factory: {name}")
    
    def register_type(self, name: str, service_type: Type) -> None:
        """
        Register a service type (will be instantiated on first access).
        
        Args:
            name: Service name
            service_type: Service class
        """
        with self._lock:
            self._types[name] = service_type
            # Check if type implements lifecycle hooks
            if issubclass(service_type, LifecycleHook):
                self._lifecycle_hooks.append(name)
            logger.debug(f"Registered type: {name}")
    
    def get(self, name: str) -> Any:
        """
        Get service instance by name (thread-safe).
        
        Args:
            name: Service name
            
        Returns:
            Service instance
            
        Raises:
            ValueError: If service not found
        """
        with self._lock:
            # Check singletons first
            if name in self._singletons:
                return self._singletons[name]
            
            # Check factories
            if name in self._factories:
                instance = self._factories[name]()
                # Cache as singleton
                self._singletons[name] = instance
                # Check for lifecycle hooks
                if isinstance(instance, LifecycleHook) and name not in self._lifecycle_hooks:
                    self._lifecycle_hooks.append(name)
                return instance
            
            # Check types
            if name in self._types:
                instance = self._types[name]()
                # Cache as singleton
                self._singletons[name] = instance
                # Check for lifecycle hooks
                if isinstance(instance, LifecycleHook) and name not in self._lifecycle_hooks:
                    self._lifecycle_hooks.append(name)
                return instance
            
            raise ValueError(f"Service not found: {name}")
    
    def has(self, name: str) -> bool:
        """
        Check if service is registered (thread-safe).
        
        Args:
            name: Service name
            
        Returns:
            True if service is registered
        """
        with self._lock:
            return name in self._singletons or name in self._factories or name in self._types
    
    def startup(self) -> None:
        """Start all services with lifecycle hooks."""
        with self._lock:
            if self._initialized:
                logger.warning("Container already initialized")
                return
            
            for service_name in self._lifecycle_hooks:
                try:
                    service = self.get(service_name)
                    if isinstance(service, LifecycleHook):
                        service.startup()
                        logger.info(f"Started service: {service_name}")
                except Exception as e:
                    logger.error(f"Failed to start service {service_name}: {e}", exc_info=True)
                    raise
            
            self._initialized = True
            logger.info("Container startup complete")
    
    def shutdown(self) -> None:
        """Shutdown all services with lifecycle hooks."""
        with self._lock:
            if not self._initialized:
                return
            
            # Shutdown in reverse order
            for service_name in reversed(self._lifecycle_hooks):
                try:
                    service = self._singletons.get(service_name)
                    if service and isinstance(service, LifecycleHook):
                        service.shutdown()
                        logger.info(f"Shutdown service: {service_name}")
                except Exception as e:
                    logger.error(f"Failed to shutdown service {service_name}: {e}", exc_info=True)
            
            self._initialized = False
            logger.info("Container shutdown complete")
    
    def clear(self) -> None:
        """Clear all registrations."""
        with self._lock:
            self._singletons.clear()
            self._factories.clear()
            self._types.clear()
            self._lifecycle_hooks.clear()
            self._initialized = False
            logger.debug("Container cleared")


# Global container instance
_container: Optional[Container] = None


def get_container() -> Container:
    """
    Get global container instance.
    
    Returns:
        Container instance
    """
    global _container
    if _container is None:
        _container = Container()
        _setup_default_services(_container)
    return _container


def _setup_default_services(container: Container) -> None:
    """
    Setup default service registrations.
    
    Args:
        container: Container to setup
    """
    from ..services.generation_service import GenerationService
    from ..services.ableton_service import AbletonService
    from ..services.analysis_service import AnalysisService
    from ..services.track_service import TrackService
    from ..services.voice_service import VoiceService
    from ..services.state_service import StateService
    
    # Register service types
    container.register_type("generation_service", GenerationService)
    container.register_type("ableton_service", AbletonService)
    container.register_type("analysis_service", AnalysisService)
    container.register_type("track_service", TrackService)
    container.register_type("voice_service", VoiceService)
    container.register_type("state_service", StateService)
    
    logger.info("Default services registered in container")

