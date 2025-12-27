# Troubleshooting Guide

## Common Issues and Solutions

### API Server Issues

#### Server Won't Start

**Symptoms:**
- Error when running `python -m sergik_ml.serving.api`
- Port already in use error

**Solutions:**
1. Check if port 8000 is already in use:
   ```bash
   lsof -i :8000
   ```
2. Kill the process or use a different port:
   ```bash
   export SERGIK_PORT=8001
   python -m sergik_ml.serving.api
   ```
3. Check Python version (requires 3.8+):
   ```bash
   python --version
   ```

#### Import Errors

**Symptoms:**
- `ModuleNotFoundError` when starting server
- Missing dependencies

**Solutions:**
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Check virtual environment is activated
3. Verify all modules are in Python path

### OSC Bridge Issues

#### OSC Bridge Not Connecting

**Symptoms:**
- Max for Live device shows "Not Connected"
- No OSC messages received

**Solutions:**
1. Verify OSC bridge is running:
   ```bash
   python scripts/osc_bridge.py --port 9000
   ```
2. Check port configuration matches:
   - OSC bridge listen port: 9000
   - Max for Live send port: 9000
3. Check firewall settings
4. Verify localhost/127.0.0.1 (not external IP)

#### OSC Messages Not Received

**Symptoms:**
- Commands sent but no response
- Timeout errors

**Solutions:**
1. Check OSC address format:
   - Correct: `/scp/quantize_clip`
   - Wrong: `/quantize_clip`
2. Verify message format (JSON in OSC payload)
3. Check logs for error messages
4. Test with simple message:
   ```bash
   # Use pythonosc to test
   python -c "from pythonosc import udp_client; c = udp_client.SimpleUDPClient('127.0.0.1', 9000); c.send_message('/sergik/test', [])"
   ```

### Editor Functions Not Working

#### Transform Operations Fail

**Symptoms:**
- API returns success but nothing happens in Ableton
- Error messages in logs

**Solutions:**
1. Verify clip is selected in Ableton Live
2. Check track_index and clip_slot are correct (0-based)
3. Ensure clip exists at specified slot
4. Verify OSC connection is active
5. Check Max for Live device is loaded and connected

#### Time Shift Not Working

**Symptoms:**
- Time shift command succeeds but clip doesn't move

**Solutions:**
1. Verify direction is "left" or "right" (case-sensitive)
2. Check amount is positive number (beats)
3. Ensure clip is not locked
4. Try smaller amount (0.25 = 16th note)

#### Rotation Not Working

**Symptoms:**
- Rotation command succeeds but no change

**Solutions:**
1. Check editor type detection:
   - MIDI clips use transpose + time shift
   - Audio clips use pitch shift
2. Verify current editor type is detected correctly
3. Check if clip is MIDI or audio type

### Library Tab Issues

#### Search Not Returning Results

**Symptoms:**
- Search query returns empty results
- Search syntax not working

**Solutions:**
1. Verify search syntax:
   ```
   BPM:120 key:C name:kick
   ```
2. Check API endpoint is accessible:
   ```bash
   curl "http://localhost:8000/api/live/browser/search?query=test"
   ```
3. Verify Ableton Live browser is accessible
4. Check file paths are correct

#### Media Items Not Loading

**Symptoms:**
- Double-click doesn't load sample
- Error when loading

**Solutions:**
1. Verify sample path exists
2. Check file permissions
3. Ensure track_index is valid
4. Check Max for Live device can access file system
5. Verify API endpoint:
   ```bash
   curl -X POST http://localhost:8000/api/live/browser/load \
     -H "Content-Type: application/json" \
     -d '{"track_index": 0, "sample_path": "/path/to/sample.wav"}'
   ```

#### Keyboard Navigation Not Working

**Symptoms:**
- Arrow keys don't navigate
- Enter doesn't load

**Solutions:**
1. Verify Library tab is active
2. Check focus is not on input field
3. Ensure media items are rendered
4. Check browser console for JavaScript errors

### Electron App Issues

#### Intelligence Sub-Options Not Populating

**Symptoms:**
- Dropdown stays empty after selecting category

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify `populateIntelligenceSubOptions` function exists
3. Check category value matches expected values:
   - `emotional`
   - `psychological`
   - `sonic`
   - `intent`

#### Analyze Function Not Working

**Symptoms:**
- File upload fails
- No analysis results

**Solutions:**
1. Verify file is selected
2. Check file format is supported (WAV, AIFF, MP3)
3. Verify API endpoint is accessible
4. Check file size (may be too large)
5. Review network tab for API errors

#### Export Not Working

**Symptoms:**
- Export button does nothing
- No file downloaded

**Solutions:**
1. Verify analysis data exists (`window.currentAnalysisData`)
2. Check browser download permissions
3. Verify JSON is valid
4. Check browser console for errors

### Performance Issues

#### Slow API Responses

**Symptoms:**
- Long delays when calling endpoints
- Timeout errors

**Solutions:**
1. Check server CPU/memory usage
2. Verify database is not locked
3. Check for long-running operations
4. Review logs for bottlenecks
5. Consider increasing timeout values

#### High Memory Usage

**Symptoms:**
- System slows down
- Out of memory errors

**Solutions:**
1. Clear media cache in Library tab
2. Restart API server periodically
3. Check for memory leaks in long-running processes
4. Limit cache sizes in configuration

### Configuration Issues

#### Wrong Port Numbers

**Symptoms:**
- Connections fail
- Wrong services talking to each other

**Solutions:**
1. Check environment variables:
   ```bash
   echo $SERGIK_PORT
   echo $SERGIK_ABLETON_OSC_PORT
   ```
2. Verify configuration files
3. Check Max for Live device settings
4. Ensure all services use same port configuration

#### Database Connection Errors

**Symptoms:**
- Database errors in logs
- Data not persisting

**Solutions:**
1. Verify database file exists and is writable
2. Check database URL in configuration
3. Ensure SQLite is installed
4. Check file permissions

## Debugging Tips

### Enable Debug Logging

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check API Health

```bash
curl http://localhost:8000/health
```

### Test OSC Connection

```python
from pythonosc import udp_client
client = udp_client.SimpleUDPClient('127.0.0.1', 9000)
client.send_message('/sergik/test', [])
```

### View API Documentation

Open in browser: `http://localhost:8000/docs`

### Check Max for Live Device Logs

Look in Max console for error messages

## Getting Help

1. Check logs in `logs/` directory
2. Review API documentation at `/docs`
3. Check Max for Live device status
4. Verify all services are running
5. Test with simple commands first
6. Check network connectivity
7. Review error messages carefully

## Common Error Messages

### "OSC connection failed"
- OSC bridge not running
- Wrong port number
- Firewall blocking

### "Clip not found"
- Invalid track_index or clip_slot
- Clip doesn't exist at that location
- Clip slot is empty

### "Invalid grid value"
- Grid must be: "1/32", "1/16", "1/8", "1/4", "1/2", "1", "triplet", "swing"

### "Track index out of range"
- Track doesn't exist
- Use 0-based indexing
- Check track count first

### "File not found"
- Path is incorrect
- File doesn't exist
- Permission denied

## Prevention

1. Always verify connections before use
2. Check error messages in logs
3. Test with simple operations first
4. Keep services updated
5. Monitor resource usage
6. Regular backups of configuration

