# ML Pipeline Guide - SERGIK AI Team

## Overview

The ML Pipeline system provides a complete machine learning workflow for the SERGIK AI Team, ensuring the controller stays healthy and models improve over time.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ML Pipeline System                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Data       │    │   Model      │    │   Health     │  │
│  │ Collection   │───▶│   Training   │───▶│  Monitoring  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Validation  │    │  Evaluation  │    │   Alerts     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │          │
│         └───────────────────┴───────────────────┘          │
│                            │                                │
│                            ▼                                │
│                   ┌──────────────┐                          │
│                   │  Deployment  │                          │
│                   └──────────────┘                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Data Collection

**Purpose**: Collect usage data and feedback from controller

**Features**:
- Automatic data collection from controller usage
- User feedback collection (ratings, preferences)
- Data validation and cleaning
- Data retention policies

**Usage**:
```python
from sergik_ml.pipelines.ml_pipeline import get_pipeline

pipeline = get_pipeline()

# Collect controller data
pipeline.collect_controller_data({
    "type": "generation",
    "command": "generate_chords",
    "key": "10B",
    "bars": 8,
    "success": True
})

# Collect feedback
pipeline.collect_feedback({
    "rating": 5,
    "type": "chord_progression",
    "notes": "Great progression!"
})
```

### 2. Health Monitoring

**Purpose**: Monitor controller health continuously

**Metrics Tracked**:
- Connection status
- Response time
- Error rate
- Latency (avg, p95, p99)
- Request success/failure counts

**Health Score Calculation**:
```
health_score = (
    connection_score * 0.4 +
    error_score * 0.4 +
    latency_score * 0.2
)
```

**Usage**:
```python
from sergik_ml.pipelines.controller_health import get_health_monitor

monitor = get_health_monitor()

# Check health
health = monitor.check_health()
print(f"Health score: {health.score}")
print(f"Status: {health.status}")
print(f"Issues: {health.issues}")
print(f"Recommendations: {health.recommendations}")

# Get summary
summary = monitor.get_health_summary()
```

### 3. Model Training

**Purpose**: Train and retrain models based on collected data

**Auto-Retraining**:
- Triggers when enough new data collected (default: 50 samples)
- Respects minimum interval (default: 24 hours)
- Can be triggered manually

**Usage**:
```python
# Automatic (when conditions met)
pipeline = get_pipeline()
# Training happens automatically when:
# - training_data_count >= retrain_threshold
# - Enough time passed since last training

# Manual trigger
result = pipeline.train_model("preference")
```

### 4. Model Evaluation

**Purpose**: Evaluate model performance

**Metrics**:
- Accuracy
- Precision
- Recall
- F1 Score
- Custom metrics

**Usage**:
```python
result = pipeline.evaluate_model(model_version=2)
print(result["metrics"])
```

### 5. Model Deployment

**Purpose**: Deploy new model versions safely

**Features**:
- Canary deployments (gradual rollout)
- Automatic rollback on failure
- Version management

**Usage**:
```python
# Deploy with canary (10% traffic)
result = pipeline.deploy_model(model_version=2, canary=True)

# Full deployment
result = pipeline.deploy_model(model_version=2, canary=False)
```

## Configuration

### Pipeline Configuration

```python
from sergik_ml.pipelines.ml_pipeline import PipelineConfig

config = PipelineConfig(
    # Data collection
    collect_controller_data=True,
    collect_feedback=True,
    data_retention_days=90,
    
    # Training
    auto_retrain=True,
    retrain_threshold=50,  # New data points needed
    retrain_interval_hours=24,
    
    # Evaluation
    min_eval_samples=100,
    eval_metrics=["accuracy", "precision", "recall", "f1_score"],
    
    # Deployment
    auto_deploy=False,  # Manual approval recommended
    deployment_rollback=True,
    canary_percentage=0.1,
    
    # Health monitoring
    health_check_interval_seconds=60,
    health_alert_threshold=0.8,
    
    # Performance tracking
    track_latency=True,
    track_accuracy=True,
    track_user_satisfaction=True
)

pipeline = get_pipeline(config)
```

## API Endpoints

### Pipeline Management

```bash
# Get pipeline status
GET /pipeline/status

# Start pipeline
POST /pipeline/start

# Stop pipeline
POST /pipeline/stop

# Trigger training
POST /pipeline/train?model_type=preference
```

### Health Monitoring

```bash
# Get current health
GET /pipeline/health

# Get health summary
GET /pipeline/health/summary

# Get health history
GET /pipeline/health/history?hours=24
```

### Data Collection

```bash
# Collect feedback
POST /pipeline/collect/feedback
{
  "rating": 5,
  "type": "chord_progression",
  "notes": "Great!"
}

# Collect usage data
POST /pipeline/collect/data
{
  "type": "generation",
  "command": "generate_chords",
  "success": true
}
```

## Integration with SERGIK AI Team

### Agent Integration

The ML pipeline integrates with SERGIK AI Team agents:

```python
from sergik_ai_team import get_orchestrator
from sergik_ml.pipelines.ml_pipeline import get_pipeline

# Agents can use pipeline
pipeline = get_pipeline()

# DevAssistant can check health
health = pipeline.check_controller_health()

# ControllerDev can collect data
pipeline.collect_controller_data({
    "agent": "ControllerDev",
    "action": "code_analysis",
    "success": True
})
```

### Health-Based Actions

Agents can take actions based on health:

```python
from sergik_ml.pipelines.controller_health import get_health_monitor

monitor = get_health_monitor()
health = monitor.check_health()

if health.status == HealthStatus.CRITICAL:
    # Take emergency actions
    # - Alert administrators
    # - Switch to fallback models
    # - Reduce load
    pass
```

## Workflow

### 1. Startup

```python
from sergik_ml.pipelines.ml_pipeline import get_pipeline

# Initialize pipeline
pipeline = get_pipeline()

# Start monitoring
pipeline.start()
```

### 2. Continuous Operation

The pipeline runs continuously:
- Collects data from controller
- Monitors health every 60 seconds
- Checks if retraining needed
- Evaluates models
- Deploys improvements

### 3. Health Alerts

When health degrades:
- Alerts are triggered
- Recommendations are generated
- Agents can take corrective action

### 4. Model Improvement

1. Collect data and feedback
2. When threshold reached, trigger training
3. Evaluate new model
4. Deploy if better than current
5. Monitor performance

## Best Practices

### 1. Health Monitoring

- Monitor continuously (every 60s)
- Set appropriate alert thresholds
- Review health history regularly
- Act on recommendations promptly

### 2. Data Collection

- Collect meaningful data
- Validate data quality
- Respect privacy
- Retain data appropriately

### 3. Model Training

- Don't retrain too frequently
- Ensure sufficient data
- Validate before deployment
- Use canary deployments

### 4. Deployment

- Always test before full deployment
- Use canary for risky changes
- Monitor closely after deployment
- Have rollback plan ready

## Monitoring Dashboard

Access pipeline status via API:

```bash
# Full status
curl http://127.0.0.1:8000/pipeline/status

# Health summary
curl http://127.0.0.1:8000/pipeline/health/summary

# Health history
curl http://127.0.0.1:8000/pipeline/health/history?hours=24
```

## Troubleshooting

### Pipeline Not Starting

1. Check configuration
2. Verify dependencies
3. Check logs for errors
4. Ensure database is accessible

### Health Checks Failing

1. Verify backend is running
2. Check network connectivity
3. Review error logs
4. Check service health

### Training Not Triggering

1. Check data collection
2. Verify threshold settings
3. Check training data count
4. Review interval settings

## Next Steps

1. **Start Pipeline**: `POST /pipeline/start`
2. **Monitor Health**: `GET /pipeline/health/summary`
3. **Collect Feedback**: Integrate feedback collection in controller
4. **Review Metrics**: Check pipeline status regularly
5. **Iterate**: Adjust configuration based on results

---

The ML Pipeline ensures your SERGIK AI Controller stays healthy and improves over time through continuous learning and monitoring.

