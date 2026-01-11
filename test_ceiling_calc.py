#!/usr/bin/env python3
"""
Test script to verify ceiling panel calculator functionality
"""

from ceiling_panel_calc import *

def test_basic_functionality():
    """Test the basic functionality with different parameters"""
    
    print("Testing Ceiling Panel Calculator")
    print("=" * 50)
    
    # Test 1: Small ceiling with tight gaps
    print("\nTest 1: Small ceiling (3m x 2m) with 100mm gaps")
    ceiling1 = CeilingDimensions(length_mm=3000, width_mm=2000)
    spacing1 = PanelSpacing(perimeter_gap_mm=100, panel_gap_mm=100)
    
    calc1 = CeilingPanelCalculator(ceiling1, spacing1)
    layout1 = calc1.calculate_optimal_layout(target_aspect_ratio=1.0)
    
    print(f"  Panel size: {layout1.panel_width_mm:.1f}mm × {layout1.panel_length_mm:.1f}mm")
    print(f"  Layout: {layout1.panels_per_row} × {layout1.panels_per_column} = {layout1.total_panels} panels")
    print(f"  Coverage: {layout1.total_coverage_sqm:.2f} m²")
    
    # Test 2: Large ceiling with standard gaps
    print("\nTest 2: Large ceiling (8m x 6m) with 200mm gaps")
    ceiling2 = CeilingDimensions(length_mm=8000, width_mm=6000)
    spacing2 = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
    
    calc2 = CeilingPanelCalculator(ceiling2, spacing2)
    layout2 = calc2.calculate_optimal_layout(target_aspect_ratio=1.0)
    
    print(f"  Panel size: {layout2.panel_width_mm:.1f}mm × {layout2.panel_length_mm:.1f}mm")
    print(f"  Layout: {layout2.panels_per_row} × {layout2.panels_per_column} = {layout2.total_panels} panels")
    print(f"  Coverage: {layout2.total_coverage_sqm:.2f} m²")
    
    # Test 3: Check validation
    print("\nTest 3: Layout validation")
    is_valid1 = calc1.validate_layout(layout1)
    is_valid2 = calc2.validate_layout(layout2)
    print(f"  Layout 1 valid: {is_valid1}")
    print(f"  Layout 2 valid: {is_valid2}")
    
    # Test 4: Alternative layouts
    print("\nTest 4: Alternative layouts for Test 2")
    alternatives = calc2.get_alternate_layouts(count=3)
    for i, (alt_layout, efficiency) in enumerate(alternatives, 1):
        print(f"  Option {i}: {alt_layout.panels_per_row}×{alt_layout.panels_per_column} panels "
              f"({alt_layout.panel_width_mm:.0f}×{alt_layout.panel_length_mm:.0f}mm) - efficiency: {efficiency:.2%}")
    
    # Test 5: Material library
    print("\nTest 5: Material library")
    try:
        material = MaterialLibrary.get_material('led_panel_white')
        print(f"  Material: {material.name} - {material.color} - ${material.cost_per_sqm}/m²")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test 6: File generation
    print("\nTest 6: File generation")
    try:
        # Generate DXF
        dxf_gen = DXFGenerator(ceiling2, spacing2, layout2)
        dxf_gen.generate_dxf('test_layout.dxf', material)
        
        # Generate SVG
        svg_gen = SVGGenerator(ceiling2, spacing2, layout2)
        svg_gen.generate_svg('test_layout.svg', material)
        
        # Generate reports
        exporter = ProjectExporter(ceiling2, spacing2, layout2, material)
        exporter.generate_report('test_report.txt')
        exporter.export_json('test_project.json')
        
        print("  ✓ All files generated successfully")
        
    except Exception as e:
        print(f"  Error generating files: {e}")

if __name__ == '__main__':
    test_basic_functionality()