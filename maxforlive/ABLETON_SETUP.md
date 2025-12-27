# Opening SERGIK AI Controller in Ableton Live

## Quick Steps

### Option 1: Direct Method (Recommended)

1. **Open Ableton Live**
2. **Create a new MIDI track**
3. **Add Max MIDI Effect:**
   - Go to **Max for Live → Max MIDI Effect**
   - This creates an empty device
4. **Edit the device:**
   - Double-click the device to open it in Max
5. **Load the patch:**
   - In Max, go to **File → Open**
   - Navigate to: `~/sergik_custom_gpt/maxforlive/SERGIK_AI_Controller.maxpat`
   - Open it
6. **Save as device:**
   - **File → Save As**
   - Navigate to: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/`
   - Change format dropdown to **"Max for Live Device"**
   - Save as: `SERGIK_AI_Controller.amxd`
7. **Restart Ableton Live** (or refresh browser)
8. **Load the device:**
   - Create MIDI track
   - Go to **Max for Live → Max MIDI Effect**
   - Select **SERGIK AI Controller**

### Option 2: From Max Standalone

1. **Open Max** (standalone)
2. **File → Open** → `~/sergik_custom_gpt/maxforlive/SERGIK_AI_Controller.maxpat`
3. **File → Save As**
4. Navigate to: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/`
5. Change format to **"Max for Live Device"**
6. Save as: `SERGIK_AI_Controller.amxd`
7. **Restart Ableton Live**
8. The device will appear in **Max for Live → Max MIDI Effect**

## Features Available

The device provides complete control over Ableton Live:

- **MIDI Generation**: Chords, bass, arpeggios, drums
- **Track Management**: Create, delete, rename, arm, mute, solo, volume, pan
- **Device Control**: Load devices/VSTs, set parameters, load presets
- **Clip Management**: Create, fire, duplicate clips, set notes
- **Session Control**: Scenes, tempo, quantization, undo/redo
- **Transport Control**: Play, stop, record
- **Natural Language**: Full command support via text input

## Troubleshooting

**Device not showing in Ableton:**
- Make sure it's saved as `.amxd` (not `.maxpat`)
- Check location: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/`
- Restart Ableton Live
- Check Max console for errors

**JavaScript errors:**
- The file has been cleaned of problematic debug code
- Make sure `SERGIK_AI_Controller.js` is at: `/Users/machd/sergik_custom_gpt/maxforlive/`

**Connection issues:**
- Start the API server: `python -m sergik_ml.serving.api`
- Click **HEALTH** button in device to verify connection

**Track/Device/Clip commands not working:**
- Ensure Ableton Live is running
- Check that Live Object Model access is enabled
- Verify indices are correct (0-indexed)
- Check Max console for error messages

---

*SERGIK AI v2.0 - Full Ableton Live Integration*
