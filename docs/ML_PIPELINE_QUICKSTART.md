# ML Pipeline Quick Start

## 🚀 Get Started in 3 Steps

### Step 1: Start Backend Server

```bash
python run_server.py
```

### Step 2: Start ML Pipeline

```bash
# Option A: Via API (recommended)
curl -X POST http://127.0.0.1:8000/pipeline/start

# Option B: Via script
python scripts/start_pipeline.py
```

### Step 3: Monitor Health

```bash
# Check health
curl http://127.0.0.1:8000/pipeline/health/summary

# Get status
curl http://127.0.0.1:8000/pipeline/status
```

## 📊 What the Pipeline Does

1. **Monitors Controller Health** - Every 60 seconds
2. **Collects Usage Data** - From controller interactions
3. **Collects Feedback** - User ratings and preferences
4. **Trains Models** - When enough new data (50+ samples)
5. **Deploys Improvements** - Safely with canary deployments

## 🔍 Health Monitoring

The pipeline continuously monitors:
- Connection status
- Response times
- Error rates
- Latency (avg, p95, p99)

**Health Score**: 0.0 - 1.0
- **0.9+**: Healthy ✅
- **0.7-0.9**: Degraded ⚠️
- **0.5-0.7**: Unhealthy ❌
- **<0.5**: Critical 🚨

## 📈 Data Collection

### Collect Feedback

```bash
curl -X POST http://127.0.0.1:8000/pipeline/collect/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "type": "chord_progression",
    "notes": "Great progression!"
  }'
```

### Collect Usage Data

```bash
curl -X POST http://127.0.0.1:8000/pipeline/collect/data \
  -H "Content-Type: application/json" \
  -d '{
    "type": "generation",
    "command": "generate_chords",
    "key": "10B",
    "success": true
  }'
```

## 🎯 Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/pipeline/status` | GET | Get pipeline status |
| `/pipeline/start` | POST | Start pipeline |
| `/pipeline/stop` | POST | Stop pipeline |
| `/pipeline/health` | GET | Get current health |
| `/pipeline/health/summary` | GET | Get health summary |
| `/pipeline/health/history` | GET | Get health history |
| `/pipeline/train` | POST | Trigger training |
| `/pipeline/collect/feedback` | POST | Collect feedback |
| `/pipeline/collect/data` | POST | Collect usage data |

## 🔧 Configuration

Default configuration:
- Health check: Every 60 seconds
- Auto-retrain: When 50+ new samples
- Retrain interval: 24 hours minimum
- Health alert: When score < 0.8

## 📚 Full Documentation

See `docs/ML_PIPELINE_GUIDE.md` for complete documentation.

## 🆘 Troubleshooting

**Pipeline not starting?**
```bash
# Check status
curl http://127.0.0.1:8000/pipeline/status

# Check logs
# Look for errors in server output
```

**Health checks failing?**
```bash
# Verify backend is running
curl http://127.0.0.1:8000/health

# Check health directly
curl http://127.0.0.1:8000/pipeline/health
```

**Training not triggering?**
```bash
# Check data count
curl http://127.0.0.1:8000/pipeline/status

# Manually trigger
curl -X POST http://127.0.0.1:8000/pipeline/train
```

---

The ML Pipeline keeps your SERGIK AI Controller healthy and continuously improving! 🎵

