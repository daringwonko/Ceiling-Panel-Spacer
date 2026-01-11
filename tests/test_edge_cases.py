#!/usr/bin/env python3
"""
Test edge cases and error handling
"""

from ceiling_panel_calc import *

def test_edge_cases():
    """Test edge cases and error handling"""
    
    print("Testing Edge Cases and Error Handling")
    print("=" * 50)
    
    # Test 1: Very small ceiling
    print("\nTest 1: Very small ceiling (1m x 1m)")
    try:
        ceiling = CeilingDimensions(length_mm=1000, width_mm=1000)
        spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout()
        print(f"  Result: {layout.panel_width_mm:.1f}mm × {layout.panel_length_mm:.1f}mm")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test 2: Gaps larger than ceiling
    print("\nTest 2: Gaps larger than ceiling")
    try:
        ceiling = CeilingDimensions(length_mm=1000, width_mm=1000)
        spacing = PanelSpacing(perimeter_gap_mm=600, panel_gap_mm=200)
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout()
        print(f"  Result: {layout.panel_width_mm:.1f}mm × {layout.panel_length_mm:.1f}mm")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test 3: Zero gaps
    print("\nTest 3: Zero gaps")
    try:
        ceiling = CeilingDimensions(length_mm=3000, width_mm=2000)
        spacing = PanelSpacing(perimeter_gap_mm=0, panel_gap_mm=0)
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout()
        print(f"  Result: {layout.panel_width_mm:.1f}mm × {layout.panel_length_mm:.1f}mm")
        print(f"  Layout: {layout.panels_per_row} × {layout.panels_per_column}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test 4: Invalid material
    print("\nTest 4: Invalid material")
    try:
        material = MaterialLibrary.get_material('nonexistent_material')
        print(f"  Material: {material.name}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Test 5: Very large aspect ratio
    print("\nTest 5: Very large aspect ratio")
    try:
        ceiling = CeilingDimensions(length_mm=4000, width_mm=3000)
        spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout(target_aspect_ratio=5.0)
        print(f"  Result: {layout.panel_width_mm:.1f}mm × {layout.panel_length_mm:.1f}mm")
        print(f"  Aspect ratio: {layout.panel_width_mm/layout.layout.panel_length_mm:.2f}")
    except Exception as e:
        print(f"  Error: {e}")

if __name__ == '__main__':
    test_edge_cases()