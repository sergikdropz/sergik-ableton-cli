#!/bin/bash
# Helper script to open SERGIK AI Controller in Max for conversion to .amxd

MAX_APP="/Applications/Max.app"
MAXPAT_FILE="$HOME/sergik_custom_gpt/maxforlive/SERGIK_AI_Controller.maxpat"
TARGET_DIR="$HOME/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect"

echo "🎛️  SERGIK AI Controller - Device Converter"
echo "=========================================="
echo ""
echo "This script will open Max with the SERGIK AI Controller patch."
echo "You'll need to manually save it as .amxd format."
echo ""
echo "Steps after Max opens:"
echo "1. The patch should open automatically"
echo "2. Go to File → Save As"
echo "3. Navigate to: $TARGET_DIR"
echo "4. Change format to 'Max for Live Device'"
echo "5. Save as: SERGIK_AI_Controller.amxd"
echo ""
read -p "Press Enter to open Max..."

if [ -d "$MAX_APP" ]; then
    open -a "$MAX_APP" "$MAXPAT_FILE"
    echo ""
    echo "✅ Max should now be opening with the patch..."
    echo ""
    echo "After saving as .amxd, restart Ableton Live to see the device."
else
    echo "❌ Max.app not found at $MAX_APP"
    echo "Please install Max for Live or update the path in this script."
    exit 1
fi

