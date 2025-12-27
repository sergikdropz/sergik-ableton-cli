# Installing SERGIK AI Controller as Max for Live Device

## The Issue
The `.maxpat` file is the source file, but Ableton Live needs a `.amxd` (Ableton Max Device) file to recognize it as a device.

## Solution: Convert .maxpat to .amxd

### Method 1: Using Ableton Live (Recommended)

1. **Open Ableton Live**
2. **Create a new MIDI track**
3. **Add Max MIDI Effect:**
   - Go to **Max for Live → Max MIDI Effect**
   - This creates an empty Max for Live device
4. **Open the device for editing:**
   - Double-click the device to open it in Max
5. **Import the patch:**
   - In Max, go to **File → Open**
   - Navigate to: `~/sergik_custom_gpt/maxforlive/SERGIK_AI_Controller.maxpat`
   - Open the file
6. **Save as device:**
   - In Max, go to **File → Save As**
   - Navigate to: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/`
   - Save as: `SERGIK_AI_Controller.amxd`
   - Make sure "Save as Max for Live Device" is checked

### Method 2: Using Max (Standalone)

1. **Open Max (standalone application)**
2. **Open the patch:**
   - File → Open
   - Navigate to: `~/sergik_custom_gpt/maxforlive/SERGIK_AI_Controller.maxpat`
3. **Save as Max for Live Device:**
   - File → Save As
   - Navigate to: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/`
   - In the save dialog, select "Max for Live Device" format
   - Save as: `SERGIK_AI_Controller.amxd`

### Method 3: Quick Copy Method

If you already have the device open in Max:

1. **In Max, with the device open:**
   - File → Save As
   - Change format to "Max for Live Device" 
   - Save to: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/SERGIK_AI_Controller.amxd`

## Verification

After saving as `.amxd`:

1. **Restart Ableton Live** (or refresh the browser)
2. **Check the device appears:**
   - Create a MIDI track
   - Go to **Max for Live → Max MIDI Effect**
   - You should see **SERGIK AI Controller** in the list

## Troubleshooting

### Device still not showing:
1. Make sure the file is named `SERGIK_AI_Controller.amxd` (not `.maxpat`)
2. Check it's in: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/`
3. Restart Ableton Live
4. Check Max console for errors when loading

### JavaScript file not found:
- The device references: `/Users/machd/sergik_custom_gpt/maxforlive/SERGIK_AI_Controller.js`
- Make sure this file exists and is accessible
- You may need to update the path in the device if your username is different

## Alternative: Use the .maxpat directly

You can also:
1. In Ableton Live, create a Max MIDI Effect
2. Double-click to edit
3. File → Open → Select `SERGIK_AI_Controller.maxpat`
4. The device will load (but won't appear in presets until saved as .amxd)

