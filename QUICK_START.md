# Quick Start - Get SERGIK Running in 3 Steps

## 🎯 Minimum Setup (3 Steps)

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Start Backend
```bash
python run_server.py
```

### Step 3: Load Max for Live Controller
1. Open Ableton Live
2. Load `maxforlive/SERGIK_AI_Controller.js` in a Max for Live device
3. Controller connects automatically to `http://127.0.0.1:8000`

**That's it!** 🎉

---

## 🚀 Even Faster: Use Quick Start Script

```bash
./quick_start.sh
```

This script:
- ✅ Checks Python version
- ✅ Installs dependencies if needed
- ✅ Starts the server
- ✅ Shows connection status

---

## ✅ Verify Everything Works

```bash
# Test connection
python test_connection.py

# Or test manually
curl http://127.0.0.1:8000/health
```

---

## 📋 What You Get

Once running, you can:

- **Generate Music**: Chords, bass, drums, arpeggios
- **Control Ableton**: Tracks, devices, clips, browser
- **Natural Language**: "Generate tech house drums"
- **Full API**: Visit `http://127.0.0.1:8000/docs`

---

## 🆘 Troubleshooting

**Port already in use?**
```bash
export SERGIK_PORT=8002
python run_server.py
```

**Missing dependencies?**
```bash
pip install -r requirements.txt --upgrade
```

**Connection issues?**
```bash
python test_connection.py
```

---

## 📚 More Details

See `SETUP_GUIDE.md` for complete setup instructions.

