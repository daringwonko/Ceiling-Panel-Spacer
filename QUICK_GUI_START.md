# ⚡ Quick GUI Start (60 Seconds)

## 🚀 Launch in 3 Steps

```bash
# Step 1: Install dependencies (first time only)
pip install -r gui_requirements.txt

# Step 2: Start the server
python3 gui_server.py

# Step 3: Open your browser
# Go to: http://localhost:5000
```

**Done! 🎉** Your professional 3D GUI is ready!

---

## 🎯 Quick Example (2 minutes)

Once the GUI loads:

1. **Enter Ceiling Dimensions**
   - Length: `6000` mm
   - Width: `5000` mm

2. **Set Material**
   - Select: `led_panel_white`

3. **Click Calculate**
   - Watch the 3D preview render
   - See cost breakdown appear

4. **Explore**
   - Click and drag to rotate the 3D view
   - Scroll to zoom in/out
   - Right-click and drag to pan

5. **Export Results**
   - Click any export button (JSON, DXF, SVG, Report)
   - Download your ceiling design!

---

## 🎨 Interface Overview

```
┌─────────────────────────────────────────────────┐
│  LEFT PANEL          │  CENTER PANEL  │ RIGHT   │
│  Controls            │  3D Viewport   │ Props   │
├─────────────────────────────────────────────────┤
│ Length/Width fields  │                │ Layout  │
│ Material selector    │   [3D Panel     │ info    │
│ Spacing controls     │   Layout        │         │
│ Cost parameters      │   Preview]      │ Costs   │
│ Export buttons       │                │ Breakdown
└─────────────────────────────────────────────────┘
```

---

## ⚙️ What You Can Control

### Ceiling Dimensions
- **Length:** 100-50,000 mm
- **Width:** 100-50,000 mm

### Panel Configuration
- **Perimeter Gap:** Space around edges (0-2,000 mm)
- **Panel Gap:** Space between panels (0-1,000 mm)

### Material Selection
- LED Panel White (premium)
- Acoustic Tile (sound absorption)
- Drywall Sheet (standard)
- Aluminum Panel (durability)
- Fabric Panel (aesthetic)
- And more!

### Cost Analysis
- **Waste Factor:** 0-100% (material waste)
- **Labor Multiplier:** 0-200% (installation cost)

---

## 🎮 3D Viewport Controls

| Action | Control |
|--------|---------|
| **Rotate** | Click + Drag |
| **Zoom** | Scroll wheel |
| **Pan** | Right-click + Drag |
| **Reset** | Refresh page |

---

## 📊 Cost Breakdown Explained

```
MATERIAL COST: $9,000
├─ Panel Cost: Length × Width × Material Cost
└─ Total Coverage Area: Calculated automatically

WASTE COST: $1,350 (15% of material)
├─ Accounts for cutting, installation loss
└─ Adjustable percentage

LABOR COST: $2,250 (25% multiplier)
├─ Installation/assembly costs
└─ Adjustable multiplier

TOTAL: $12,600
```

---

## 💾 Export Your Design

### JSON Export
- Complete project data
- All parameters saved
- Re-importable for future edits

### DXF Export
- CAD software compatible
- AutoCAD, LibreCAD, etc.
- Professional fabrication use

### SVG Export
- Web-friendly vector graphics
- Perfect for presentations
- Can be edited in Illustrator

### Report Export
- Professional text document
- Dimensions and specifications
- Cost summary
- Ready to share with clients

---

## ✅ Troubleshooting

### "Connection refused" error
- Check if server is running: `python3 gui_server.py`
- Make sure port 5000 is available
- Try: `python3 gui_server.py --port 8000`, then visit `http://localhost:8000`

### "Flask not found" error
- Install dependencies: `pip install -r gui_requirements.txt`
- Use launcher script: `bash run_gui.sh`

### 3D view not showing (WebGL issue)
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- Update your graphics drivers
- Try a different browser

### Calculations seem slow
- Disable browser extensions (may slow JavaScript)
- Close other tabs/programs
- Clear browser cache
- Normal: <5ms per calculation

### Export not working
- Check browser's download folder
- Make sure you have disk space
- Try a different export format
- Check browser console (F12) for errors

---

## 🎓 Full Documentation

For more details:
- **GUI.md** - Complete feature guide
- **GUI_STARTUP.md** - Detailed startup instructions
- **GUI_OVERVIEW.md** - Technical architecture
- **API.md** - REST API documentation

---

## 🚨 Common Issues

| Problem | Solution |
|---------|----------|
| Port 5000 in use | `python3 gui_server.py --port 8000` |
| CSS not loading | Refresh (Ctrl+Shift+R or Cmd+Shift+R) |
| 3D frozen | Click viewport, refresh page |
| Numbers wrong | Double-check units (mm), refresh |
| Export empty | Wait for "Export complete" message |

---

## 💡 Pro Tips

1. **Try Different Materials** - Each has different costs, see the breakdown change
2. **Experiment with Gaps** - Smaller gaps = more panels = higher cost
3. **Use Templates** - The defaults work for most standard ceilings
4. **Export to CAD** - Use DXF export to integrate with larger projects
5. **Share Reports** - Export as Report format to send to clients

---

## 🔧 Advanced Features

### REST API (For Developers)
```bash
# Calculate layout via curl
curl -X POST http://localhost:5000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "ceiling": {"length": 6000, "width": 5000},
    "spacing": {"perimeter": 50, "gap": 200},
    "material": "led_panel_white",
    "waste_factor": 0.15
  }'
```

### Modifying the Code
- Backend: Edit `gui_server.py`
- Frontend: Edit `templates/index.html`
- Restart server for changes to take effect

---

## 📞 Support

### If Something Doesn't Work:
1. Check the troubleshooting section above
2. Read GUI.md for detailed documentation
3. Check browser console (F12 → Console tab)
4. Verify all dependencies: `pip list | grep -E 'Flask|ezdxf'`

### Running on Different Port
```bash
# Instead of default port 5000, use 8000
python3 gui_server.py --port 8000

# Then visit: http://localhost:8000
```

---

## 🎉 You're Ready!

```bash
python3 gui_server.py
```

**Visit:** http://localhost:5000

**Enjoy designing!** 🚀

---

*Professional 3D Ceiling Panel Calculator GUI*
*Production Ready ✅*
