#!/bin/bash
# SERGIK Quick Start Script
# This script helps you get the app running quickly

set -e

echo "=========================================="
echo "🚀 SERGIK Quick Start"
echo "=========================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ Python $PYTHON_VERSION found"

# Check if dependencies are installed
echo ""
echo "📦 Checking dependencies..."
if python3 -c "import fastapi" 2>/dev/null; then
    echo "✅ Dependencies appear to be installed"
else
    echo "⚠️  Dependencies not found. Installing..."
    pip install -r requirements.txt
fi

# Check database
echo ""
echo "💾 Checking database..."
if [ -f "sergik_ml.db" ]; then
    echo "✅ Database exists"
else
    echo "ℹ️  Database will be created on first run"
fi

# Check if server is already running
echo ""
echo "🌐 Checking if server is running..."
if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "✅ Server is already running on port 8000"
    echo ""
    echo "You can now:"
    echo "  1. Load the Max for Live controller in Ableton"
    echo "  2. Test the connection: python test_connection.py"
    echo "  3. Visit API docs: http://127.0.0.1:8000/docs"
    exit 0
else
    echo "ℹ️  Server is not running"
fi

# Start server
echo ""
echo "🚀 Starting SERGIK ML API server..."
echo "   Press Ctrl+C to stop"
echo ""
echo "=========================================="
echo ""

python3 run_server.py

