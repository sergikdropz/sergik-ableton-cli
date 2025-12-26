# SERGIK AI Design Principles

This document outlines the core design principles that guide the development and architecture of SERGIK AI.

## 1. Fail Fast, Fail Explicitly

**Principle**: Configuration and validation errors should be caught immediately at startup, not during runtime.

**Implementation**:
- Configuration validation raises exceptions instead of warnings
- Type-safe environment variable parsing with clear error messages
- Invalid configuration causes application startup to fail with descriptive errors

**Example**:
```python
# Configuration fails on startup if invalid
CFG = _load_config_from_env()  # Raises ConfigurationError if invalid
```

## 2. Structured Error Handling

**Principle**: All errors should be typed, contextual, and traceable.

**Implementation**:
- Custom exception hierarchy (`SergikError` base class)
- Context tracking (request_id, user_id, operation)
- Error codes for API responses
- No bare `except:` clauses
- Structured error responses

**Exception Hierarchy**:
- `SergikError` (base)
  - `ValidationError`
  - `DatabaseError`
  - `ServiceError`
  - `ConfigurationError`
  - `AbletonConnectionError`
  - `AuthenticationError`
  - `AuthorizationError`
  - `RateLimitError`

## 3. Database Connection Management

**Principle**: Database connections should be pooled, health-checked, and managed with proper transaction handling.

**Implementation**:
- Connection pooling (QueuePool for PostgreSQL/MySQL, StaticPool for SQLite)
- Connection health checks (`pool_pre_ping=True`)
- Retry logic with exponential backoff
- Context managers for transactions
- Proper rollback on errors

**Example**:
```python
with get_db_connection() as conn:
    # Transaction automatically managed
    conn.execute(statement)
```

## 4. Dependency Injection Consistency

**Principle**: Use a single, consistent dependency injection pattern throughout the codebase.

**Implementation**:
- Thread-safe container with lifecycle management
- All services registered through container
- Service interfaces/abstract base classes for testability
- Startup/shutdown hooks for services

**Example**:
```python
# All services accessed through container
container = get_container()
service = container.get("generation_service")
```

## 5. Security by Default

**Principle**: Security should be built-in, not bolted on.

**Implementation**:
- CORS restricted to configured origins (not `*` in production)
- Request size limits (10 MB default)
- Authentication middleware foundation
- No hardcoded secrets (all in environment variables)
- Rate limiting per endpoint

**Configuration**:
```python
# Production requires explicit CORS origins
if CFG.env == "prod":
    assert CFG.allowed_origins != ["*"]
```

## 6. Observability & Monitoring

**Principle**: Every operation should be observable, traceable, and measurable.

**Implementation**:
- Structured logging with correlation IDs
- Request context middleware
- Metrics collection (counters, gauges, histograms)
- Enhanced health checks with dependency status
- Distributed tracing support

**Logging Format**:
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "INFO",
  "correlation_id": "abc-123",
  "message": "Request completed",
  "context": {
    "method": "POST",
    "path": "/drums/generate"
  }
}
```

## 7. State Management

**Principle**: State should be persistent, versioned, and conflict-resolvable.

**Implementation**:
- Database-backed state storage
- Optimistic locking for conflict resolution
- State versioning and snapshots
- State history for audit trail
- Automatic cleanup of old state

**Example**:
```python
# State persists across restarts
state_service = StateService(session_id="session-123")
state_service.update_track_state(0, {"volume": 0.8})
# State saved to database with version increment
```

## 8. Configuration as Code

**Principle**: Configuration should be type-safe, validated, and environment-aware.

**Implementation**:
- Pydantic models for all configuration
- Environment-specific configs (dev/staging/prod)
- Validation on startup (fail fast)
- Type-safe access to configuration values

**Example**:
```python
class ConfigSchema(BaseModel):
    env: str = Field(default="dev")
    host: str = Field(default="127.0.0.1")
    port: int = Field(ge=1, le=65535)
    allowed_origins: List[str] = Field(default_factory=lambda: ["*"])
```

## 9. Testing Strategy

**Principle**: Comprehensive test coverage with clear test categories.

**Implementation**:
- Unit tests for all business logic
- Integration tests for API endpoints
- Performance tests for critical paths
- Test fixtures and utilities
- Coverage reporting

**Test Structure**:
```
tests/
├── unit/          # Fast, isolated tests
├── integration/   # API and database tests
├── performance/   # Load and stress tests
└── fixtures/      # Shared test utilities
```

## 10. Code Organization

**Principle**: Clear module boundaries, consistent patterns, comprehensive documentation.

**Implementation**:
- Single responsibility per module
- Clear separation of concerns (domain/infrastructure/api)
- Consistent naming conventions
- Comprehensive docstrings
- Type hints throughout

**Module Structure**:
```
sergik_ml/
├── domain/          # Business logic
├── infrastructure/  # External dependencies
├── api/            # HTTP layer
├── core/           # Core utilities (logging, metrics, DI)
└── shared/         # Common utilities
```

## Implementation Checklist

When adding new features, ensure:

- [ ] Configuration is type-safe and validated
- [ ] Errors use custom exception types with context
- [ ] Database operations use connection pooling
- [ ] Services are registered in the DI container
- [ ] Security considerations are addressed (CORS, auth, limits)
- [ ] Logging includes correlation IDs
- [ ] Metrics are collected for important operations
- [ ] State is persisted if needed
- [ ] Tests are written (unit + integration)
- [ ] Documentation is updated

## Code Quality Standards

- **Type Hints**: All public functions must have type hints
- **Docstrings**: All public classes and functions must have docstrings
- **Error Handling**: No bare `except:` clauses
- **Logging**: Use structured logging with context
- **Testing**: Aim for 80%+ code coverage
- **Formatting**: Black (100 char line length), isort, ruff

## Security Checklist

- [ ] No hardcoded secrets
- [ ] CORS properly configured
- [ ] Request size limits enforced
- [ ] Authentication enabled in production
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] Error messages don't leak sensitive information

