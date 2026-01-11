#!/bin/bash
# Ceiling Panel Calculator - GUI Launcher

echo "🏢 Ceiling Panel Calculator - Professional 3D GUI"
echo "=================================================="
echo ""

# Check if Flask is installed
python3 -c "import flask" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Installing dependencies..."
    pip install -r gui_requirements.txt
    echo ""
fi

echo "🚀 Starting GUI server..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ GUI is running at: http://localhost:5000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Features:"
echo "  • 3D interactive ceiling visualization"
echo "  • Real-time layout calculation"
echo "  • Cost breakdown and analysis"
echo "  • Multiple export formats (DXF, SVG, JSON)"
echo ""
echo "Controls:"
echo "  • Drag to rotate view"
echo "  • Scroll to zoom"
echo "  • Right-click drag to pan"
echo ""

python3 gui_server.py
