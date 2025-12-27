# Why Saving is Disabled in Max

## The Issue
When you open a `.maxpat` file directly in Max (not as a Max for Live device), Max disables the "Save" menu item. This is normal behavior - Max treats external patches as read-only.

## Solution: Use "Save As"

**In Max:**
1. **File → Save As** (NOT "Save" - that will be disabled)
2. Navigate to: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/`
3. **Change the format dropdown** to **"Max for Live Device"**
4. **Save as:** `SERGIK_AI_Controller.amxd`
5. Click **Save**

## Alternative: Unlock the Patch

If you want to edit and save the original `.maxpat` file:

1. In Max, go to **File → Unlock** (or check if there's an unlock option)
2. Or use **File → Save As** to save a copy with a new name

## Why This Happens

Max disables saving for patches that are:
- Opened from outside Max's search path
- Not currently "owned" by Max
- Opened as external files

This is a safety feature to prevent accidental overwrites of source files.

## Best Practice

Always use **"Save As"** when converting to `.amxd` format - this is the correct workflow for creating Max for Live devices.

