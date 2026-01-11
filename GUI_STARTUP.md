# GUI Startup Guide

## Quick Start (30 seconds)

### 1. Install Dependencies
```bash
pip install -r gui_requirements.txt
```

### 2. Start the Server
```bash
python3 gui_server.py
```

### 3. Open in Browser
Visit: **http://localhost:5000**

That's it! You now have a professional 3D GUI running.

---

## What You'll See

When you open the GUI in your browser, you'll see:

### Left Panel - Controls
- Ceiling dimensions (length, width)
- Spacing configuration (gaps)
- Material selection
- Optimization strategy
- Cost parameters (waste, labor)
- Export options

### Center - Interactive 3D View
- Real-time 3D ceiling visualization
- Professional lighting and shadows
- Interactive camera control

### Right Panel - Properties
- Real-time layout information
- Material specifications
- Cost breakdown
- Project metrics

---

## How to Use

### 1. Enter Ceiling Dimensions
```
Length: 6000 mm (6 meters)
Width:  5000 mm (5 meters)
```

### 2. Set Spacing
```
Perimeter Gap: 200 mm
Panel Gap: 200 mm
```

### 3. Choose Material
Select from:
- LED Panel White ($450/m²)
- LED Panel Black ($450/m²)
- Acoustic White ($35/m²)
- Drywall White ($15/m²)

### 4. Click "Calculate"
The layout will calculate instantly and render in 3D.

### 5. Explore the 3D View
- **Drag**: Rotate view
- **Scroll**: Zoom in/out
- **Right-click + Drag**: Pan

### 6. Export Your Results
Click any export button:
- 📄 **JSON**: Project data
- 📐 **DXF**: CAD software
- 🖼️ **SVG**: Vector graphics
- 📋 **Report**: Text specs

---

## Features

✅ **3D Visualization**
- Real-time interactive preview
- Professional rendering

✅ **Intelligent Algorithm**
- Practical multi-panel layouts
- 2400mm constraint enforcement
- Multiple optimization strategies

✅ **Cost Analysis**
- Material cost calculation
- Waste allowance (15% default)
- Optional labor multiplier
- Detailed breakdown

✅ **Multiple Exports**
- JSON (data interchange)
- DXF (CAD software)
- SVG (web/presentations)
- TXT (specifications)

✅ **Professional UI**
- Modern design
- Responsive layout
- Real-time feedback
- Intuitive controls

---

## System Requirements

- **Python:** 3.8 or higher
- **Browser:** Modern browser with WebGL
  - Chrome, Firefox, Safari, Edge all supported
- **Network:** Localhost (no internet needed)

---

## Troubleshooting

### Port 5000 already in use?

Kill the process or use a different port:
```python
# In gui_server.py, change:
app.run(debug=True, host='0.0.0.0', port=5001)  # Use 5001 instead
```

Then visit: http://localhost:5001

### WebGL not supported?

Check at: https://get.webgl.org/

Solutions:
- Use a different browser
- Update your graphics drivers
- Use a machine with dedicated GPU

### Dependencies not installing?

```bash
# Upgrade pip first
pip install --upgrade pip

# Then install requirements
pip install -r gui_requirements.txt
```

---

## Next Steps

1. **Try Example Layouts:**
   - Small office: 3m × 4m
   - Conference room: 6m × 5m
   - Retail space: 10m × 15m

2. **Explore Export Formats:**
   - Export as JSON for data analysis
   - Export as DXF to open in AutoCAD
   - Export as SVG for presentations

3. **Adjust Parameters:**
   - Try different optimization strategies
   - Experiment with waste factors
   - Compare costs with/without labor

4. **Read Full Documentation:**
   - [GUI.md](GUI.md) - Complete GUI guide
   - [QUICK_START.md](QUICK_START.md) - Usage examples
   - [API.md](API.md) - Technical reference

---

## Tips

### For Best Performance
- Use a modern browser (Chrome or Firefox)
- Ensure hardware acceleration is enabled
- Close other heavy applications

### For Professional Use
- Always export to multiple formats for backup
- DXF format best for CAD integration
- JSON best for data archival

### For Presentations
- Export to SVG for clean vector graphics
- Screenshots of 3D view for reports
- Use 3D rotations for impressive demos

---

## API Endpoints Reference

The GUI uses these REST API endpoints:

```
GET  /api/materials           - List available materials
GET  /api/material/<name>     - Get material details
POST /api/calculate           - Calculate layout
POST /api/export/<format>     - Export project
GET  /api/strategies          - Get strategies
GET  /api/config/default      - Get defaults
```

All endpoints documented in [API.md](API.md)

---

## Architecture

```
┌─────────────────────┐
│  Web Browser        │
│  HTML/CSS/JS/3D     │
└──────────┬──────────┘
           │ HTTP/REST
           ↓
┌─────────────────────┐
│  Flask Web Server   │
│  gui_server.py      │
└──────────┬──────────┘
           │ Python
           ↓
┌─────────────────────┐
│  Core Calculator    │
│  ceiling_panel_     │
│  calc.py            │
└─────────────────────┘
```

---

## Performance

Typical performance on modern hardware:
- **Calculation time:** <5ms
- **3D rendering:** 60 FPS
- **Browser startup:** <2 seconds
- **Export time:** <500ms

---

## Keyboard/Mouse Controls

| Action | Control |
|--------|---------|
| Rotate 3D view | Click + drag |
| Zoom | Mouse wheel |
| Pan view | Right-click + drag |
| Adjust values | Type in inputs |
| Calculate | Click Calculate button |
| Export | Click export buttons |

---

Enjoy your professional 3D ceiling panel design experience! 🎉

For more information, see [GUI.md](GUI.md)
