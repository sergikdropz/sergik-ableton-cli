# Quick Install Guide - SERGIK AI Controller

## The Problem
The device file is currently `.maxpat` (source file) but Ableton needs `.amxd` (device file).

## Quick Solution (2 minutes)

### Option 1: Use the Helper Script
```bash
cd ~/sergik_custom_gpt/maxforlive
./convert_to_amxd.sh
```
Then follow the on-screen instructions to save as `.amxd`.

### Option 2: Manual Steps

1. **Open Max** (standalone or from Ableton)
2. **File → Open** → Navigate to:
   ```
   ~/sergik_custom_gpt/maxforlive/SERGIK_AI_Controller.maxpat
   ```
3. **File → Save As**
4. Navigate to:
   ```
   ~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/
   ```
5. **Change format dropdown to "Max for Live Device"**
6. **Save as:** `SERGIK_AI_Controller.amxd`
7. **Restart Ableton Live**

### Option 3: From Within Ableton

1. Create a MIDI track in Ableton
2. Add **Max for Live → Max MIDI Effect**
3. Double-click the device to edit
4. **File → Open** → Select `SERGIK_AI_Controller.maxpat`
5. **File → Save As** → Save as `.amxd` in the presets folder

## Verify Installation

After saving as `.amxd`:
1. Restart Ableton Live
2. Create MIDI track
3. Go to **Max for Live → Max MIDI Effect**
4. You should see **SERGIK AI Controller** in the list

## Troubleshooting

**Still not showing?**
- Check the file is `.amxd` not `.maxpat`
- Verify location: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/`
- Restart Ableton Live
- Check Max console for errors

**JavaScript file error?**
- The device references: `/Users/machd/sergik_custom_gpt/maxforlive/SERGIK_AI_Controller.js`
- Make sure this file exists

---

*SERGIK AI v2.0 - MIDI Generation Controller*
