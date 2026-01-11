# Ceiling Panel Calculator - Quick Start Guide

## Installation & Setup

### Prerequisites
- Python 3.8+
- No external dependencies required (optional: `ezdxf` for DXF export)

### Quick Install
```bash
# Just use the Python files directly!
python3 ceiling_panel_calc.py
```

---

## Usage Methods

### 1. Using CLI Arguments (Simplest)

```bash
# Calculate 5m × 4m ceiling with standard gaps
python3 ceiling_panel_calc.py

# Custom dimensions
python3 ceiling_panel_calc.py --length 6000 --width 5000

# Add cost parameters
python3 ceiling_panel_calc.py --length 6000 --width 5000 --waste 0.20 --labor 0.25

# Change optimization strategy
python3 ceiling_panel_calc.py --length 6000 --width 5000 --strategy minimize_seams

# Full control
python3 ceiling_panel_calc.py \
  --length 8000 \
  --width 6000 \
  --perim-gap 300 \
  --panel-gap 200 \
  --material led_panel_white \
  --waste 0.15 \
  --labor 0.25 \
  --output-dir ./output \
  --strategy balanced
```

### 2. Using Config File

```bash
# Create config file
cat > my_project.json << 'EOF'
{
  "ceiling_length_mm": 6000,
  "ceiling_width_mm": 5000,
  "perimeter_gap_mm": 200,
  "panel_gap_mm": 200,
  "material_name": "led_panel_white",
  "waste_factor": 0.15,
  "labor_multiplier": 0.25,
  "export_dxf": true,
  "export_svg": true,
  "export_json": true,
  "export_report": true,
  "output_dir": ".",
  "optimization_strategy": "balanced"
}
EOF

# Run with config
python3 ceiling_panel_calc.py --config my_project.json
```

### 3. Interactive Mode (Most User-Friendly)

```bash
# Start interactive setup
python3 ceiling_panel_calc.py --interactive

# Follow prompts for:
# - Ceiling dimensions (length, width)
# - Spacing (perimeter gap, panel gap)
# - Material selection
# - Cost parameters
# - Export options
```

### 4. Python API (For Developers)

```python
from ceiling_panel_calc import (
    CeilingDimensions,
    PanelSpacing,
    CeilingPanelCalculator,
    ProjectExporter,
    MaterialLibrary
)

# Define ceiling
ceiling = CeilingDimensions(length_mm=6000, width_mm=5000)

# Define spacing
spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

# Calculate layout
calc = CeilingPanelCalculator(ceiling, spacing)
layout = calc.calculate_optimal_layout(optimization_strategy='balanced')

# Get material
material = MaterialLibrary.get_material('led_panel_white')

# Export with costs
exporter = ProjectExporter(
    ceiling=ceiling,
    spacing=spacing,
    layout=layout,
    material=material,
    waste_factor=0.15,
    labor_multiplier=0.25
)

# Generate output
print(exporter.generate_report())
exporter.export_json('project.json')
exporter.export_dxf('layout.dxf')
exporter.export_svg('layout.svg')
```

---

## Output Files

### Text Report (Auto-generated)

```
╔════════════════════════════════════════════════════════════╗
║          CEILING PANEL LAYOUT CALCULATION REPORT          ║
╚════════════════════════════════════════════════════════════╝

CEILING DIMENSIONS
  Length: 6000mm (6.0m)
  Width:  5000mm (5.0m)
  Area:   30.0 m²

SPACING
  Perimeter Gap: 200mm
  Panel Gap:     200mm

OPTIMAL PANEL LAYOUT
  Panels per Row:     4
  Panels per Column:  4
  Total Panels:       16
  
  Individual Panel Size
    Width:  875mm
    Length: 1250mm

MATERIAL: LED Panel White
  Cost per m²: $450.00
  Category:    Lighting

COST BREAKDOWN
Material Coverage:      20.0 m²  @ $450.00/m²  = $9,000.00
Waste Allowance (15%):   3.0 m²  @ $450.00/m²  = $1,350.00
Subtotal Material Cost:                            $10,350.00
Labor Multiplier (25%):                              $2,587.50
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL PROJECT COST:                                 $12,937.50
```

### JSON Export (project.json)

```json
{
  "metadata": {
    "version": "2.0",
    "timestamp": "2024-01-15T10:30:00",
    "calculator_version": "1.0"
  },
  "ceiling": {
    "length_mm": 6000,
    "width_mm": 5000,
    "area_sqm": 30.0
  },
  "layout": {
    "panel_width_mm": 875,
    "panel_length_mm": 1250,
    "panels_per_row": 4,
    "panels_per_column": 4,
    "total_panels": 16,
    "coverage_sqm": 20.0
  },
  "costs": {
    "material_cost": 9000.0,
    "waste_cost": 1350.0,
    "total_material_cost": 10350.0,
    "labor_cost": 2587.5,
    "total_cost": 12937.5
  }
}
```

### DXF Export (layout.dxf)

- AutoCAD-compatible format
- Shows panel layout as rectangles
- Includes dimensions and gaps
- Can be opened in AutoCAD, LibreCAD, or any CAD viewer

### SVG Export (layout.svg)

- Web-friendly vector format
- Shows visual representation of layout
- Can be opened in browsers, Inkscape, or any SVG viewer
- Useful for presentations and quick visualization

---

## Real-World Examples

### Example 1: Small Office

```bash
python3 ceiling_panel_calc.py \
  --length 3000 \
  --width 4000 \
  --perim-gap 150 \
  --panel-gap 150 \
  --material led_panel_white \
  --waste 0.15
```

**Result:**
- 4 panels (2×2)
- Panel size: 1275×1775mm
- Material cost: ~$5,734
- Layout visualization saved to SVG

---

### Example 2: Large Conference Room

```bash
python3 ceiling_panel_calc.py \
  --length 8000 \
  --width 6000 \
  --perim-gap 250 \
  --panel-gap 200 \
  --material led_panel_white \
  --waste 0.15 \
  --labor 0.30
```

**Result:**
- 16 panels (4×4)
- Panel size: 1250×1750mm
- Material cost: ~$13,125
- Labor cost: ~$3,938 (30%)
- Total: ~$17,063

---

### Example 3: Retail Space

```bash
python3 ceiling_panel_calc.py \
  --length 10000 \
  --width 15000 \
  --perim-gap 300 \
  --panel-gap 200 \
  --material led_panel_neutral \
  --waste 0.20 \
  --labor 0.25 \
  --strategy minimize_seams
```

**Result:**
- 36 panels (6×6 or optimized fewer)
- Panel size: ~1400×2233mm
- Minimized seams/connections
- Complete cost breakdown exported to JSON

---

## Available Materials

### Built-in Materials

```
1. led_panel_white
   Category: Lighting
   Color: White
   Cost: $450/m²
   
2. led_panel_neutral
   Category: Lighting
   Color: Neutral White
   Cost: $500/m²
   
3. acoustic_panel
   Category: Acoustic
   Color: White
   Cost: $300/m²
   
4. drywall
   Category: Drywall
   Color: White
   Cost: $50/m²
   
5. metal_grid
   Category: Metal
   Color: Silver
   Cost: $200/m²
```

### Using Custom Materials

```python
from ceiling_panel_calc import Material, MaterialLibrary

custom = Material(
    name="custom_acoustic",
    category="acoustic",
    color="off_white",
    reflectivity=0.5,
    cost_per_sqm=250.0,
    notes="Fire rated, 0.85 NRC"
)

MaterialLibrary.add_custom_material(custom)
```

---

## Optimization Strategies

### Strategy 1: "balanced" (DEFAULT)

**Use when:** You want a good balance of everything

**Optimizes for:**
- Reasonable number of panels (not too few, not too many)
- Similar panel sizes (balanced aspect ratio)
- Good ceiling coverage

**Example:**
```bash
python3 ceiling_panel_calc.py --length 8000 --width 6000 --strategy balanced
# Result: 16 panels (1250×1750mm each)
```

---

### Strategy 2: "minimize_seams"

**Use when:** You want fewer connections and seams

**Optimizes for:**
- Minimum number of panels
- Fewer installation connections
- Simpler layout

**Example:**
```bash
python3 ceiling_panel_calc.py --length 8000 --width 6000 --strategy minimize_seams
# Result: Fewer larger panels
```

---

## Cost Parameters

### Waste Factor

Default: `0.15` (15%)

Accounts for:
- Cutting waste
- Breakage during installation
- Installation tolerances
- Material shrinkage

Adjust based on:
- Material type (fragile materials = higher waste)
- Panel size (smaller panels = higher waste %)
- Installation complexity

```bash
# Conservative estimate (custom materials, complex cuts)
python3 ceiling_panel_calc.py --waste 0.25

# Optimistic estimate (standard materials, simple cuts)
python3 ceiling_panel_calc.py --waste 0.10
```

### Labor Multiplier

Default: `None` (no labor cost)

Typical values:
- `0.15` - 15% of material cost (simple installation)
- `0.25` - 25% of material cost (standard installation)
- `0.50` - 50% of material cost (complex installation)
- `1.0` - 100% of material cost (highly specialized)

```bash
# Include labor costs
python3 ceiling_panel_calc.py --labor 0.25

# Complex project with high labor costs
python3 ceiling_panel_calc.py --labor 0.50
```

---

## Troubleshooting

### "Perimeter gap exceeds ceiling space"

**Problem:** Gap too large relative to ceiling size

**Solution:**
```bash
# Option 1: Reduce gap
python3 ceiling_panel_calc.py --length 3000 --width 2000 --perim-gap 100

# Option 2: Increase ceiling size
python3 ceiling_panel_calc.py --length 5000 --width 4000 --perim-gap 300
```

---

### "Layout impossible with given constraints"

**Problem:** Can't find valid panel layout

**Solution:**
```bash
# Option 1: Reduce panel gap
python3 ceiling_panel_calc.py --panel-gap 100

# Option 2: Increase ceiling size
python3 ceiling_panel_calc.py --length 8000 --width 6000

# Option 3: Change optimization strategy
python3 ceiling_panel_calc.py --strategy minimize_seams
```

---

### "Material not found"

**Problem:** Material name doesn't exist

**Solution:**
```bash
# Use built-in material
python3 ceiling_panel_calc.py --material led_panel_white

# Or create custom material in code (see Python API section)
```

---

## Performance Tips

### For Large Ceilings (>500 m²)

```bash
# Use minimize_seams strategy for faster calculation
python3 ceiling_panel_calc.py --length 50000 --width 30000 --strategy minimize_seams
```

### For Quick Estimates

```bash
# Use default parameters, no exports
python3 ceiling_panel_calc.py --no-dxf --no-svg --no-json
```

### For Batch Processing

```bash
# Create config files for multiple projects
python3 ceiling_panel_calc.py --config project1.json
python3 ceiling_panel_calc.py --config project2.json
python3 ceiling_panel_calc.py --config project3.json
```

---

## Output Directory

Default: Current directory (`.`)

```bash
# Save all files to specific directory
python3 ceiling_panel_calc.py --output-dir ./projects/my_project

# Creates:
# ./projects/my_project/ceiling_report.txt
# ./projects/my_project/ceiling_project.json
# ./projects/my_project/ceiling_layout.dxf
# ./projects/my_project/ceiling_layout.svg
```

---

## Documentation References

For more detailed information:

- **Algorithm Details:** See [ALGORITHM.md](ALGORITHM.md)
- **Complete API Reference:** See [API.md](API.md)
- **Known Limitations:** See [LIMITATIONS.md](LIMITATIONS.md)
- **Development Guide:** See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Phase 1 Summary:** See [PHASE1_WEEK1_SUMMARY.md](PHASE1_WEEK1_SUMMARY.md)

---

## Support

### Test Your Installation

```bash
# Run test suite to verify everything works
python3 test_algorithm_correctness.py
```

**Expected output:**
```
======================================================================
CEILING PANEL CALCULATOR - COMPREHENSIVE ALGORITHM TESTS
======================================================================
... (test output)

Total: 6/6 tests passed
======================================================================
```

All tests passing = installation working correctly ✅

---

## Tips & Best Practices

### 1. Always Validate Gap Sizes

```bash
# For 5m ceiling:
# Maximum perimeter gap = 2500mm (half ceiling)
# Recommended: 150-300mm

python3 ceiling_panel_calc.py --length 5000 --perim-gap 250
```

### 2. Match Material to Use Case

| Use Case | Material | Cost |
|----------|----------|------|
| Office lighting | led_panel_white | $450/m² |
| Sound control | acoustic_panel | $300/m² |
| Budget option | drywall | $50/m² |
| Modern aesthetic | metal_grid | $200/m² |

### 3. Account for Real-World Waste

- LED panels: 15-20% waste
- Acoustic tiles: 10-15% waste
- Custom materials: 20-30% waste

### 4. Include Labor Costs

- DIY installation: Skip labor multiplier
- Professional installation: 15-30% multiplier
- Complex installation: 50%+ multiplier

### 5. Export in Multiple Formats

```bash
# Always export JSON for archival
python3 ceiling_panel_calc.py --export-json true

# Export DXF for CAD work
python3 ceiling_panel_calc.py --export-dxf true

# Export SVG for presentations
python3 ceiling_panel_calc.py --export-svg true
```

---

## Version Information

- **Product:** Ceiling Panel Calculator v2.0
- **Release Date:** January 2024
- **Status:** Production Ready ✅
- **Python:** 3.8+

---

**Last Updated:** January 12, 2024

For the latest information, check the documentation files and README.md
