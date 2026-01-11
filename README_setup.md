# Ceiling Panel Calculator - Setup & Usage Guide

## Overview

A professional Python application for construction lighting panel ceiling design that generates:
- **Optimized panel layouts** with precise measurements
- **DXF files** for CAD integration (AutoCAD, LibreCAD, etc.)
- **SVG blueprints** for visualization and printing
- **Material specifications** and cost calculations
- **JSON exports** for downstream processing and integration

## Installation

### Requirements
- Python 3.8+
- Optional: `ezdxf` for enhanced DXF support

### Setup

```bash
# 1. Save the script
# Place ceiling_panel_calc.py in your project directory

# 2. (Optional) Install ezdxf for better DXF support
pip install ezdxf

# 3. Run the example
python ceiling_panel_calc.py
```

This will generate:
- `ceiling_layout.dxf` - CAD-ready drawing
- `ceiling_layout.svg` - Visual blueprint
- `ceiling_report.txt` - Detailed specifications
- `ceiling_project.json` - Structured project data

## Quick Start

### Basic Usage

```python
from ceiling_panel_calc import (
    CeilingDimensions, PanelSpacing, CeilingPanelCalculator,
    DXFGenerator, SVGGenerator, ProjectExporter, MaterialLibrary
)

# Define your ceiling
ceiling = CeilingDimensions(length_mm=4800, width_mm=3600)  # 4.8m × 3.6m

# Define gaps (e.g., 200mm for HVAC/electrical service)
spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

# Calculate optimal panel layout
calculator = CeilingPanelCalculator(ceiling, spacing)
layout = calculator.calculate_optimal_layout(target_aspect_ratio=1.0)

print(f"Optimal panel size: {layout.panel_width_mm:.1f}mm × {layout.panel_length_mm:.1f}mm")
print(f"Total panels: {layout.total_panels}")

# Select a material
material = MaterialLibrary.get_material('led_panel_white')

# Generate files
dxf_gen = DXFGenerator(ceiling, spacing, layout)
dxf_gen.generate_dxf('my_ceiling.dxf', material)

svg_gen = SVGGenerator(ceiling, spacing, layout)
svg_gen.generate_svg('my_ceiling.svg', material)
```

## Core Classes

### CeilingDimensions
Defines the ceiling area in millimeters.

```python
ceiling = CeilingDimensions(
    length_mm=4800,  # X-axis
    width_mm=3600    # Y-axis
)
```

### PanelSpacing
Defines gap requirements in millimeters.

```python
spacing = PanelSpacing(
    perimeter_gap_mm=200,   # Gap around edges (for HVAC, electrical, etc.)
    panel_gap_mm=200        # Gap between panels (for service access)
)
```

### CeilingPanelCalculator
Core engine that calculates optimal panel layouts.

```python
calc = CeilingPanelCalculator(ceiling, spacing)

# Get the most efficient layout (square panels preferred)
optimal = calc.calculate_optimal_layout(target_aspect_ratio=1.0)

# Get top N alternatives
alternatives = calc.get_alternate_layouts(count=5)

# Validate a layout
is_valid = calc.validate_layout(optimal)
```

**Parameters:**
- `target_aspect_ratio`: 1.0 for square panels, >1.0 for rectangular (width/height ratio)

**Returns:** `PanelLayout` object with:
- `panel_width_mm`, `panel_length_mm` - Individual panel dimensions
- `panels_per_row`, `panels_per_column` - Grid layout
- `total_panels` - Total number of panels
- `total_coverage_sqm` - Panel surface area
- `gap_area_sqm` - Service space area

### DXFGenerator
Generates CAD-compatible DXF files.

```python
dxf_gen = DXFGenerator(ceiling, spacing, layout)
dxf_gen.generate_dxf('filename.dxf', material=material)
```

**Output:**
- DXF file compatible with AutoCAD, LibreCAD, Revit, SketchUp
- Color coding: Red=perimeter, White=panels, Blue=gaps
- Labeled panels with dimensions

### SVGGenerator
Generates SVG blueprints (vector graphics).

```python
svg_gen = SVGGenerator(ceiling, spacing, layout)
svg_gen.generate_svg('filename.svg', material=material)
```

**Output:**
- Scalable vector graphics (viewable in browsers, printing friendly)
- Top-down view with labeled panels
- Specifications embedded in the drawing

### MaterialLibrary
Pre-defined construction materials with specs.

```python
# List available materials
MaterialLibrary.list_materials()

# Get a specific material
material = MaterialLibrary.get_material('led_panel_white')

# Access properties
print(material.name)           # "LED Panel"
print(material.color)          # "White"
print(material.cost_per_sqm)  # 450.00
```

**Available Materials:**
- `led_panel_white` - Integrated LED, 4000K, $450/m²
- `led_panel_black` - Integrated LED, 4000K, $450/m²
- `acoustic_white` - Sound absorbing, $35/m²
- `acoustic_grey` - Sound absorbing, $35/m²
- `drywall_white` - Standard gypsum, $15/m²
- `aluminum_brushed` - Anodized finish, $120/m²
- `aluminum_polished` - Mirror polish, $140/m²

### ProjectExporter
Generates reports and structured exports.

```python
exporter = ProjectExporter(ceiling, spacing, layout, material)

# Generate text report
exporter.generate_report('report.txt')

# Export as JSON (for integration, APIs, etc.)
exporter.export_json('project.json')
```

## Advanced Workflows

### 1. Find Best Layout for Multiple Aspect Ratios

```python
from ceiling_panel_calc import *

ceiling = CeilingDimensions(4800, 3600)
spacing = PanelSpacing(200, 200)

aspect_ratios = [0.5, 0.75, 1.0, 1.25, 1.5]  # Width/height ratios
results = {}

for ratio in aspect_ratios:
    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout(target_aspect_ratio=ratio)
    results[ratio] = layout
    print(f"Ratio {ratio}: {layout.panel_width_mm:.0f}×{layout.panel_length_mm:.0f}mm")
```

### 2. Batch Generate for Multiple Projects

```python
projects = [
    {"name": "office_a", "length": 5000, "width": 4000, "perimeter": 150, "panel": 200},
    {"name": "office_b", "length": 6000, "width": 5000, "perimeter": 200, "panel": 200},
    {"name": "warehouse", "length": 12000, "width": 10000, "perimeter": 300, "panel": 300},
]

for proj in projects:
    ceiling = CeilingDimensions(proj["length"], proj["width"])
    spacing = PanelSpacing(proj["perimeter"], proj["panel"])
    
    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout()
    
    material = MaterialLibrary.get_material('led_panel_white')
    
    # Generate DXF
    dxf_gen = DXFGenerator(ceiling, spacing, layout)
    dxf_gen.generate_dxf(f'{proj["name"]}_layout.dxf', material)
    
    # Generate report
    exporter = ProjectExporter(ceiling, spacing, layout, material)
    exporter.generate_report(f'{proj["name"]}_report.txt')
```

### 3. Custom Materials

```python
from ceiling_panel_calc import Material

custom_material = Material(
    name="Custom Composite Panel",
    category="custom",
    color="Matte Grey",
    reflectivity=0.40,
    cost_per_sqm=275.00,
    notes="Fire-rated, custom fabrication, 14-day lead time"
)

layout = calc.calculate_optimal_layout()
dxf_gen = DXFGenerator(ceiling, spacing, layout)
dxf_gen.generate_dxf('custom_layout.dxf', custom_material)
```

### 4. Integration with Other Tools

**Load the JSON export for further processing:**

```python
import json

with open('ceiling_project.json', 'r') as f:
    project = json.load(f)

# Use in your workflow
num_panels = project['layout']['total_panels']
material_cost = project['material']['total_cost']
panel_width = project['layout']['panel_width_mm']
```

## Output Files

### DXF Files
- **Format:** AutoCAD Drawing Exchange Format
- **Compatible:** AutoCAD, LibreCAD, Revit, SketchUp, CAM software
- **Contains:** Ceiling boundary, panel grid, dimensions, perimeter reference
- **Use case:** Fabrication, ordering, CNC cutting

### SVG Files
- **Format:** Scalable Vector Graphics
- **Compatible:** Web browsers, Inkscape, Adobe Illustrator
- **Contains:** Top-down layout, labeled panels, specifications
- **Use case:** Documentation, printing, client presentations

### TXT Reports
- **Contains:** All specifications, cutting lists, cost estimates
- **Use case:** Project documentation, quotes, site reference

### JSON Export
- **Format:** Structured data (JSON)
- **Contains:** All dimensions, layout, materials, calculations
- **Use case:** System integration, APIs, downstream processing

## Tips & Best Practices

### Gap Sizing
- **Perimeter Gap:** Usually 150-300mm for HVAC ducts, electrical runs, and access
- **Panel Gap:** Usually 50-200mm for maintenance and mechanical service
- **Rule of thumb:** Larger gaps for complex mechanical ceilings

### Panel Size Optimization
- The algorithm balances:
  - **Coverage efficiency** (minimize material waste)
  - **Aspect ratio** (preference for square or rectangular panels)
  - **Structural requirements** (avoid panels that are too large/small)

### Material Selection
Consider:
- **Reflectivity:** Higher values (>0.80) for lighting applications
- **Cost:** Budget vs. performance
- **Durability:** High-traffic areas need tougher finishes
- **Acoustic properties:** If sound control is needed
- **Thermal:** For climate-controlled spaces

### DXF for Fabrication
If working with a fabrication shop:
1. Export DXF
2. Share with fabricator
3. They can import directly into their CAM software
4. Generate cutting paths and nesting

## Troubleshooting

**"ezdxf not installed"**
- The script falls back to basic DXF generation
- For full features: `pip install ezdxf`

**"Panel layout doesn't fit"**
- Check your gap measurements
- Reduce panel size or gaps
- Increase ceiling dimensions or reduce gaps

**"DXF file is too large/complex"**
- This is normal for large ceilings with many panels
- Most CAD software handles this without issue
- For massive projects, consider breaking into zones

## Performance Notes

- Calculating 20+ panel options: <100ms on modern hardware
- DXF generation: <50ms
- SVG generation: <30ms
- Full project export: <200ms

For very large ceilings (>20m × 20m), consider:
- Breaking into multiple zones
- Using the JSON export for custom processing
- Integrating with database systems

## Extension Ideas

1. **Add 3D rendering** (with Blender/Three.js)
2. **Integration with Revit/BIM** (DXF+JSON export)
3. **Mobile app** (export JSON, use with web UI)
4. **Cost estimation** (material + labor + waste)
5. **Supply chain** (connect to material supplier APIs)
6. **Thermal/acoustic** (add environmental calculations)

## License & Support

This is provided as-is for construction and design professionals.

---

**Next Steps:**
1. Install dependencies: `pip install ezdxf` (optional but recommended)
2. Run the example: `python ceiling_panel_calc.py`
3. Modify the main() function for your specific ceiling dimensions
4. Generate your first DXF!
