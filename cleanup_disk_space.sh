#!/bin/bash
# Quick disk space cleanup script for SERGIK AI project
# Run with: bash cleanup_disk_space.sh

echo "SERGIK AI - Disk Space Cleanup"
echo "================================"
echo ""

# Check current disk space
echo "Current disk usage:"
df -h /Users/machd | tail -1
echo ""

# Clean pip cache (safe, can be re-downloaded)
echo "Cleaning pip cache..."
pip cache purge 2>/dev/null || echo "  pip cache already clean or not available"
echo ""

# Clean Python cache files in project
echo "Cleaning Python __pycache__ directories..."
find /Users/machd/sergik_custom_gpt -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find /Users/machd/sergik_custom_gpt -name "*.pyc" -delete 2>/dev/null
echo "  ✓ Python cache cleaned"
echo ""

# Show large cache directories (user can manually clean if needed)
echo "Large cache directories you can clean manually:"
echo "  ~/Library/Caches/Ableton: $(du -sh ~/Library/Caches/Ableton 2>/dev/null | cut -f1)"
echo "  ~/Library/Caches/pip: $(du -sh ~/Library/Caches/pip 2>/dev/null | cut -f1)"
echo "  ~/Library/Caches/Google: $(du -sh ~/Library/Caches/Google 2>/dev/null | cut -f1)"
echo ""
echo "To clean Ableton cache (5.7GB):"
echo "  rm -rf ~/Library/Caches/Ableton/*"
echo ""
echo "To clean Google cache (1.2GB):"
echo "  rm -rf ~/Library/Caches/Google/*"
echo ""

# Check disk space after cleanup
echo "Disk usage after cleanup:"
df -h /Users/machd | tail -1
echo ""
echo "Done!"

