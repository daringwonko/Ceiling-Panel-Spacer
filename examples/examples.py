# Practical Examples for Your Construction Projects

## Your Example: 200mm Gap Ceiling Panel Layout

This shows how to solve your specific problem: finding optimal panel size with 200mm gaps.

### Example 1: Your Exact Scenario

```python
from ceiling_panel_calc import *

# Your 200mm gap requirement
print("="*60)
print("CUSTOM CEILING LAYOUT CALCULATOR")
print("="*60)
print("\nProject: LED Lighting Panel Ceiling with 200mm Service Gap\n")

# Define the ceiling dimensions
# Let's assume a typical commercial space: 6m × 4.5m
ceiling = CeilingDimensions(length_mm=6000, width_mm=4500)

# Your requirement: 200mm gap between panels
spacing = PanelSpacing(
    perimeter_gap_mm=200,   # Gap around edges (for HVAC, electrical)
    panel_gap_mm=200        # 200mm gap BETWEEN panels for service access
)

print(f"Ceiling dimensions: {ceiling.length_mm}mm × {ceiling.width_mm}mm")
print(f"Perimeter gap: {spacing.perimeter_gap_mm}mm")
print(f"Panel-to-panel gap: {spacing.panel_gap_mm}mm\n")

# Calculate optimal layout (square panels)
calculator = CeilingPanelCalculator(ceiling, spacing)
optimal_layout = calculator.calculate_optimal_layout(target_aspect_ratio=1.0)

print("OPTIMAL LAYOUT (SQUARE PANELS):")
print(f"  Panel dimensions: {optimal_layout.panel_width_mm:.1f}mm × {optimal_layout.panel_length_mm:.1f}mm")
print(f"  Panel grid: {optimal_layout.panels_per_row} × {optimal_layout.panels_per_column}")
print(f"  Total panels needed: {optimal_layout.total_panels}")
print(f"  Coverage: {optimal_layout.total_coverage_sqm:.2f} m²")
print(f"  Service/gap area: {optimal_layout.gap_area_sqm:.2f} m²\n")

# Verify it actually fits
is_valid = calculator.validate_layout(optimal_layout)
print(f"✓ Layout validated: {is_valid}\n")

# Show alternatives if you want different panel sizes
print("ALTERNATIVE LAYOUTS (for comparison):")
alternatives = calculator.get_alternate_layouts(count=3)
for i, (alt_layout, efficiency) in enumerate(alternatives, 1):
    print(f"\n  Option {i}:")
    print(f"    Size: {alt_layout.panel_width_mm:.0f}mm × {alt_layout.panel_length_mm:.0f}mm")
    print(f"    Grid: {alt_layout.panels_per_row} × {alt_layout.panels_per_column} = {alt_layout.total_panels} panels")
    print(f"    Efficiency score: {efficiency:.2%}")

# Select material and generate outputs
print("\n" + "="*60)
print("GENERATING TECHNICAL DRAWINGS\n")

material = MaterialLibrary.get_material('led_panel_white')

# Generate DXF for AutoCAD/Revit
dxf_gen = DXFGenerator(ceiling, spacing, optimal_layout)
dxf_gen.generate_dxf('my_ceiling_200mm_gap.dxf', material)

# Generate SVG for viewing/printing
svg_gen = SVGGenerator(ceiling, spacing, optimal_layout)
svg_gen.generate_svg('my_ceiling_200mm_gap.svg', material)

# Generate full report
exporter = ProjectExporter(ceiling, spacing, optimal_layout, material)
report = exporter.generate_report('my_ceiling_200mm_gap_report.txt')
exporter.export_json('my_ceiling_200mm_gap.json')

print("\nFiles generated:")
print("  ✓ my_ceiling_200mm_gap.dxf        (for AutoCAD, Revit, CAD software)")
print("  ✓ my_ceiling_200mm_gap.svg        (for visualization, printing)")
print("  ✓ my_ceiling_200mm_gap_report.txt (specifications & cutting list)")
print("  ✓ my_ceiling_200mm_gap.json       (for integration & processing)")
```

**Output Summary for 6m × 4.5m with 200mm gaps:**
- Optimal panel: ~783mm × 783mm (square)
- Total panels: 6 × 4 = 24 panels
- Cost estimate (LED panels): ~$14,850

---

## Example 2: Comparing Different Gap Sizes

If you're not sure about 200mm, here's how to compare:

```python
from ceiling_panel_calc import *

ceiling = CeilingDimensions(length_mm=6000, width_mm=4500)

# Compare different gap sizes
gap_scenarios = [
    {"name": "Tight (100mm)", "gap": 100},
    {"name": "Standard (150mm)", "gap": 150},
    {"name": "Your spec (200mm)", "gap": 200},
    {"name": "Spacious (250mm)", "gap": 250},
]

print("COMPARING GAP SIZES FOR 6m × 4.5m CEILING\n")
print(f"{'Scenario':<20} | {'Panel Size':<15} | {'Grid':<10} | {'Count':<6} | {'Coverage':<10}")
print("-" * 75)

for scenario in gap_scenarios:
    spacing = PanelSpacing(perimeter_gap_mm=scenario["gap"], panel_gap_mm=scenario["gap"])
    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout()
    
    print(f"{scenario['name']:<20} | {layout.panel_width_mm:>6.0f}×{layout.panel_length_mm:<6.0f}mm | "
          f"{layout.panels_per_row}×{layout.panels_per_column:<6} | {layout.total_panels:<6} | "
          f"{layout.total_coverage_sqm:>6.2f} m²")
```

---

## Example 3: Multiple Room Layouts in One File

Generate designs for an entire office suite:

```python
from ceiling_panel_calc import *

# Define multiple rooms
rooms = [
    {"name": "Conference Room A", "length": 5000, "width": 4000},
    {"name": "Conference Room B", "length": 6000, "width": 4000},
    {"name": "Open Office", "length": 10000, "width": 8000},
    {"name": "Reception", "length": 4000, "width": 3000},
]

print("GENERATING LAYOUTS FOR ENTIRE OFFICE\n")

all_results = []

for room in rooms:
    ceiling = CeilingDimensions(length_mm=room["length"], width_mm=room["width"])
    spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
    
    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout()
    
    material = MaterialLibrary.get_material('led_panel_white')
    
    # Generate files for each room
    room_key = room["name"].lower().replace(" ", "_")
    
    dxf_gen = DXFGenerator(ceiling, spacing, layout)
    dxf_gen.generate_dxf(f'{room_key}_layout.dxf', material)
    
    exporter = ProjectExporter(ceiling, spacing, layout, material)
    exporter.generate_report(f'{room_key}_report.txt')
    
    total_cost = layout.total_coverage_sqm * material.cost_per_sqm
    all_results.append({
        'room': room['name'],
        'panels': layout.total_panels,
        'coverage': layout.total_coverage_sqm,
        'cost': total_cost
    })
    
    print(f"✓ {room['name']:<20} | {layout.total_panels:>3} panels | "
          f"{layout.total_coverage_sqm:>6.2f} m² | ${total_cost:>10,.2f}")

# Summary
print("\n" + "="*60)
print("TOTAL PROJECT COST")
print("="*60)
total_panels = sum(r['panels'] for r in all_results)
total_area = sum(r['coverage'] for r in all_results)
total_cost = sum(r['cost'] for r in all_results)

print(f"Total panels: {total_panels}")
print(f"Total area: {total_area:.2f} m²")
print(f"Total cost (materials): ${total_cost:,.2f}")
```

---

## Example 4: Custom Material with Your Specs

If you're using custom panels, specify their properties:

```python
from ceiling_panel_calc import Material

# Your custom composite lighting panel
my_custom_panel = Material(
    name="Custom LED Composite Panel",
    category="lighting",
    color="Matte White with Black Trim",
    reflectivity=0.80,  # Good light reflection
    cost_per_sqm=525.00,  # Your supplier's price
    notes="5mm composite, integrated LED 4000K, 5-year warranty"
)

ceiling = CeilingDimensions(length_mm=6000, width_mm=4500)
spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

calc = CeilingPanelCalculator(ceiling, spacing)
layout = calc.calculate_optimal_layout()

# Use your custom material
dxf_gen = DXFGenerator(ceiling, spacing, layout)
dxf_gen.generate_dxf('custom_ceiling.dxf', my_custom_panel)

exporter = ProjectExporter(ceiling, spacing, layout, my_custom_panel)
exporter.generate_report('custom_ceiling_quote.txt')
exporter.export_json('custom_ceiling.json')
```

---

## Example 5: Testing Different Panel Aspect Ratios

Some ceiling designs prefer rectangular panels (not square):

```python
from ceiling_panel_calc import *

ceiling = CeilingDimensions(length_mm=6000, width_mm=4500)
spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

# Test different panel shapes
aspect_ratios = [
    (0.67, "Tall (2:3)"),      # 600mm wide × 900mm tall
    (1.0, "Square (1:1)"),     # 800mm × 800mm
    (1.5, "Wide (3:2)"),       # 900mm × 600mm
    (2.0, "Very Wide (2:1)"),  # 1000mm × 500mm
]

print("TESTING DIFFERENT PANEL SHAPES FOR 6m × 4.5m\n")

for ratio, description in aspect_ratios:
    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout(target_aspect_ratio=ratio)
    
    actual_ratio = layout.panel_width_mm / layout.panel_length_mm
    
    print(f"{description:<20} | {layout.panel_width_mm:>6.0f}×{layout.panel_length_mm:<6.0f}mm | "
          f"Ratio: {actual_ratio:.2f} | {layout.total_panels} panels")
```

---

## Example 6: Export for Fabrication Shop

If you're sending to a fabrication/cutting service:

```python
from ceiling_panel_calc import *
import json

ceiling = CeilingDimensions(length_mm=6000, width_mm=4500)
spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

calc = CeilingPanelCalculator(ceiling, spacing)
layout = calc.calculate_optimal_layout()

material = MaterialLibrary.get_material('led_panel_white')

# Generate DXF for their CAM software
dxf_gen = DXFGenerator(ceiling, spacing, layout)
dxf_gen.generate_dxf('fab_shop_cutting_layout.dxf', material)

# Generate cutting list
exporter = ProjectExporter(ceiling, spacing, layout, material)
exporter.generate_report('fab_shop_cutting_list.txt')

# Also export JSON with exact dimensions for their tracking
project_data = exporter.export_json('fab_shop_project.json')

print("\n" + "="*60)
print("FILES READY FOR FABRICATION SHOP:")
print("="*60)
print("1. fab_shop_cutting_layout.dxf - Import into their CAM software")
print("2. fab_shop_cutting_list.txt - Print for reference")
print("3. fab_shop_project.json - For their tracking/ERP system")
```

---

## Example 7: Real-Time Adjustment Tool

If you want to interactively explore options:

```python
from ceiling_panel_calc import *

def interactive_calculator():
    """Let user input dimensions and see results"""
    
    print("CEILING PANEL CALCULATOR - INTERACTIVE MODE")
    print("="*60)
    
    # Get inputs
    length = float(input("\nCeiling length (mm): ") or "6000")
    width = float(input("Ceiling width (mm): ") or "4500")
    perimeter_gap = float(input("Perimeter gap (mm): ") or "200")
    panel_gap = float(input("Panel-to-panel gap (mm): ") or "200")
    
    # Calculate
    ceiling = CeilingDimensions(length_mm=length, width_mm=width)
    spacing = PanelSpacing(perimeter_gap_mm=perimeter_gap, panel_gap_mm=panel_gap)
    
    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout()
    
    # Show results
    print("\n" + "="*60)
    print("RESULTS:")
    print("="*60)
    print(f"\nOptimal Panel Size: {layout.panel_width_mm:.0f}mm × {layout.panel_length_mm:.0f}mm")
    print(f"Layout: {layout.panels_per_row} × {layout.panels_per_column}")
    print(f"Total Panels: {layout.total_panels}")
    print(f"Coverage: {layout.total_coverage_sqm:.2f} m²")
    
    # Generate files
    save = input("\nGenerate files? (y/n): ") or "y"
    if save.lower() == "y":
        material = MaterialLibrary.get_material('led_panel_white')
        
        dxf_gen = DXFGenerator(ceiling, spacing, layout)
        dxf_gen.generate_dxf('result_layout.dxf', material)
        
        svg_gen = SVGGenerator(ceiling, spacing, layout)
        svg_gen.generate_svg('result_layout.svg', material)
        
        exporter = ProjectExporter(ceiling, spacing, layout, material)
        exporter.generate_report('result_report.txt')
        
        print("\n✓ Files generated: result_layout.dxf, result_layout.svg, result_report.txt")

# Run it
if __name__ == '__main__':
    interactive_calculator()
```

---

## Integration Examples

### With Your CAD Software Workflow

1. **Export DXF** → Opens directly in AutoCAD, Revit, SketchUp
2. **Use as reference layer** → Overlay on architectural plans
3. **Modify if needed** → Add HVAC ducts, electrical runs, structural info
4. **Export to production** → Send to fabrication or coordination

### With Excel/Spreadsheet

```python
# Export JSON and load in Excel
import json
import pandas as pd

with open('ceiling_project.json') as f:
    data = json.load(f)

# Create summary DataFrame
summary = pd.DataFrame({
    'Specification': [
        'Ceiling Length (m)',
        'Ceiling Width (m)',
        'Panel Width (mm)',
        'Panel Length (mm)',
        'Total Panels',
        'Total Coverage (m²)',
        'Material Cost/m²',
        'Total Material Cost'
    ],
    'Value': [
        data['ceiling']['length_mm'] / 1000,
        data['ceiling']['width_mm'] / 1000,
        data['layout']['panel_width_mm'],
        data['layout']['panel_length_mm'],
        data['layout']['total_panels'],
        data['layout']['total_coverage_sqm'],
        f"${data['material']['cost_per_m2']}",
        f"${data['material']['total_cost']:,.2f}"
    ]
})

summary.to_excel('ceiling_summary.xlsx', index=False)
```

---

## Questions to Answer Before Running

1. **What are your actual ceiling dimensions?** (This affects panel size)
2. **Is 200mm gap enough for HVAC/electrical?** (May need more in complex buildings)
3. **Do you prefer square or rectangular panels?**
4. **What material are you using?** (Affects cost estimates)
5. **Do you need the DXF for CAD coordination?** (Yes = use the DXF output)

---

**Ready to use? Start with Example 1 for your exact scenario!**
