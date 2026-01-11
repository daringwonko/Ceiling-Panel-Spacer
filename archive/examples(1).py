#!/usr/bin/env python3
"""
Practical examples demonstrating the Ceiling Panel Calculator.

This module contains runnable examples showing how to:
1. Calculate optimal panel layouts for different ceiling scenarios
2. Compare different gap sizes and their impact
3. Generate CAD files and reports
4. Explore alternative layouts
"""

from ceiling_panel_calc import (
    CeilingDimensions,
    PanelSpacing,
    CeilingPanelCalculator,
    DXFGenerator,
    SVGGenerator,
    ProjectExporter,
    MaterialLibrary,
)


def example_1_custom_200mm_gap():
    """
    Example 1: Your Exact Scenario - 200mm Gap Ceiling Panel Layout
    
    This shows how to solve the specific problem: finding optimal panel size 
    with 200mm gaps between panels for service access.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 1: CUSTOM 200mm GAP CEILING")
    print("=" * 60)
    print("\nProject: LED Lighting Panel Ceiling with 200mm Service Gap\n")

    # Define the ceiling dimensions
    # Typical commercial space: 6m × 4.5m
    ceiling = CeilingDimensions(length_mm=6000, width_mm=4500)

    # Requirement: 200mm gap between panels
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

    # Verify layout actually fits
    is_valid = calculator.validate_layout(optimal_layout)
    print(f"✓ Layout validated: {is_valid}\n")

    # Show alternatives
    print("ALTERNATIVE LAYOUTS (for comparison):")
    alternatives = calculator.get_alternate_layouts(count=3)
    for i, (alt_layout, efficiency) in enumerate(alternatives, 1):
        print(f"\n  Option {i}:")
        print(f"    Size: {alt_layout.panel_width_mm:.0f}mm × {alt_layout.panel_length_mm:.0f}mm")
        print(f"    Grid: {alt_layout.panels_per_row} × {alt_layout.panels_per_column} = {alt_layout.total_panels} panels")
        print(f"    Efficiency score: {efficiency:.2%}")

    # Select material and generate outputs
    print("\n" + "=" * 60)
    print("GENERATING TECHNICAL DRAWINGS\n")

    material = MaterialLibrary.get_material('led_panel_white')

    # Generate DXF for AutoCAD/Revit
    dxf_gen = DXFGenerator(ceiling, spacing, optimal_layout)
    dxf_gen.generate_dxf('example_1_ceiling_200mm.dxf', material)

    # Generate SVG for viewing/printing
    svg_gen = SVGGenerator(ceiling, spacing, optimal_layout)
    svg_gen.generate_svg('example_1_ceiling_200mm.svg', material)

    # Generate full report
    exporter = ProjectExporter(ceiling, spacing, optimal_layout, material)
    report = exporter.generate_report('example_1_ceiling_200mm_report.txt')
    exporter.export_json('example_1_ceiling_200mm.json')

    print("\nFiles generated:")
    print("  ✓ example_1_ceiling_200mm.dxf        (for AutoCAD, Revit, CAD software)")
    print("  ✓ example_1_ceiling_200mm.svg        (for visualization, printing)")
    print("  ✓ example_1_ceiling_200mm_report.txt (specifications & cutting list)")
    print("  ✓ example_1_ceiling_200mm.json       (for integration & processing)")

    return optimal_layout, material


def example_2_compare_gap_sizes():
    """
    Example 2: Comparing Different Gap Sizes
    
    If you're not sure about 200mm, this shows how to compare different 
    gap sizes and their impact on panel count and size.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 2: COMPARING DIFFERENT GAP SIZES")
    print("=" * 60 + "\n")

    ceiling = CeilingDimensions(length_mm=6000, width_mm=4500)

    # Compare different gap sizes
    gap_scenarios = [
        {"name": "Tight (100mm)", "gap": 100},
        {"name": "Standard (150mm)", "gap": 150},
        {"name": "Wide (200mm)", "gap": 200},
        {"name": "Extra Wide (250mm)", "gap": 250},
    ]

    print(f"Ceiling: {ceiling.length_mm}mm × {ceiling.width_mm}mm")
    print(f"\nComparing gap sizes:\n")

    results = []
    for scenario in gap_scenarios:
        spacing = PanelSpacing(
            perimeter_gap_mm=100,  # Fixed perimeter gap
            panel_gap_mm=scenario['gap']
        )

        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout(target_aspect_ratio=1.0)

        print(f"{scenario['name']}:")
        print(f"  Panel size: {layout.panel_width_mm:.0f}mm × {layout.panel_length_mm:.0f}mm")
        print(f"  Panel count: {layout.total_panels}")
        print(f"  Grid: {layout.panels_per_row} × {layout.panels_per_column}")
        print()

        results.append({
            'gap': scenario['gap'],
            'layout': layout,
            'spacing': spacing
        })

    return results


def example_3_small_office():
    """
    Example 3: Small Office Space
    
    Calculate panel layout for a smaller commercial space (3m × 4m office).
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 3: SMALL OFFICE SPACE")
    print("=" * 60 + "\n")

    # Smaller office space
    ceiling = CeilingDimensions(length_mm=4000, width_mm=3000)
    spacing = PanelSpacing(
        perimeter_gap_mm=150,
        panel_gap_mm=150
    )

    print(f"Ceiling dimensions: {ceiling.length_mm}mm × {ceiling.width_mm}mm")
    print(f"Gaps: {spacing.perimeter_gap_mm}mm perimeter, {spacing.panel_gap_mm}mm between panels\n")

    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout(target_aspect_ratio=1.0)

    print(f"Panel size: {layout.panel_width_mm:.0f}mm × {layout.panel_length_mm:.0f}mm")
    print(f"Layout: {layout.panels_per_row} × {layout.panels_per_column} = {layout.total_panels} panels")
    print(f"Coverage: {layout.total_coverage_sqm:.2f} m²")

    return layout, spacing


def example_4_material_cost_comparison():
    """
    Example 4: Material Cost Comparison
    
    Calculate costs for different material options in the same space.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 4: MATERIAL COST COMPARISON")
    print("=" * 60 + "\n")

    ceiling = CeilingDimensions(length_mm=5000, width_mm=4000)
    spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout()

    print(f"Ceiling: {ceiling.length_mm}mm × {ceiling.width_mm}mm")
    print(f"Panel size: {layout.panel_width_mm:.0f}mm × {layout.panel_length_mm:.0f}mm")
    print(f"Total area to cover: {layout.total_coverage_sqm:.2f} m²\n")

    # Compare different materials
    material_names = [
        'standard_tiles',
        'acoustic_tiles',
        'led_panel_white',
        'led_panel_color',
        'metal_grid',
    ]

    print("MATERIAL COST COMPARISON:")
    print(f"{'Material':<25} {'Cost/m²':<10} {'Total Cost':<12}")
    print("-" * 50)

    for mat_name in material_names:
        try:
            material = MaterialLibrary.get_material(mat_name)
            total_cost = layout.total_coverage_sqm * material.cost_per_sqm
            print(f"{material.name:<25} ${material.cost_per_sqm:<9.2f} ${total_cost:<11.2f}")
        except KeyError:
            print(f"{mat_name:<25} (not found)")

    print()


def example_5_rectangular_panels():
    """
    Example 5: Rectangular Panels
    
    Calculate layout for rectangular panels instead of square (aspect ratio > 1.0).
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 5: RECTANGULAR PANELS")
    print("=" * 60 + "\n")

    ceiling = CeilingDimensions(length_mm=8000, width_mm=4000)
    spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

    calc = CeilingPanelCalculator(ceiling, spacing)

    # Try different aspect ratios
    aspect_ratios = [1.0, 1.5, 2.0]

    print(f"Ceiling: {ceiling.length_mm}mm × {ceiling.width_mm}mm\n")

    for ratio in aspect_ratios:
        layout = calc.calculate_optimal_layout(target_aspect_ratio=ratio)
        actual_ratio = layout.panel_width_mm / layout.panel_length_mm

        print(f"Target aspect ratio: {ratio:.1f}")
        print(f"  Panel size: {layout.panel_width_mm:.0f}mm × {layout.panel_length_mm:.0f}mm (actual ratio: {actual_ratio:.2f})")
        print(f"  Layout: {layout.panels_per_row} × {layout.panels_per_column}")
        print()


def example_6_error_handling():
    """
    Example 6: Error Handling
    
    Demonstrate what happens when invalid inputs are provided and how 
    the calculator handles edge cases.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 6: ERROR HANDLING")
    print("=" * 60 + "\n")

    # Valid inputs first
    print("1. Valid ceiling dimensions:")
    try:
        ceiling = CeilingDimensions(length_mm=5000, width_mm=4000)
        spacing = PanelSpacing(perimeter_gap_mm=100, panel_gap_mm=100)
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout()
        print(f"   ✓ Success: {layout.panels_per_row}×{layout.panels_per_column} = {layout.total_panels} panels\n")
    except ValueError as e:
        print(f"   ✗ Error: {e}\n")

    # Invalid input: negative dimensions
    print("2. Negative ceiling dimensions:")
    try:
        ceiling = CeilingDimensions(length_mm=-5000, width_mm=4000)
        spacing = PanelSpacing(perimeter_gap_mm=100, panel_gap_mm=100)
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout()
        print(f"   ✓ Success\n")
    except ValueError as e:
        print(f"   ✗ Error caught: {e}\n")

    # Invalid input: gap too large
    print("3. Gap larger than half ceiling:")
    try:
        ceiling = CeilingDimensions(length_mm=2000, width_mm=4000)
        spacing = PanelSpacing(perimeter_gap_mm=1500, panel_gap_mm=100)  # 1500mm > 1000mm (half)
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout()
        print(f"   ✓ Success\n")
    except ValueError as e:
        print(f"   ✗ Error caught: {e}\n")

    # Invalid input: negative gaps
    print("4. Negative gap size:")
    try:
        ceiling = CeilingDimensions(length_mm=5000, width_mm=4000)
        spacing = PanelSpacing(perimeter_gap_mm=-100, panel_gap_mm=100)
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout()
        print(f"   ✓ Success\n")
    except ValueError as e:
        print(f"   ✗ Error caught: {e}\n")


def main():
    """Run all examples"""
    print("\n" + "=" * 70)
    print("CEILING PANEL CALCULATOR - PRACTICAL EXAMPLES")
    print("=" * 70)

    # Run all examples
    example_1_custom_200mm_gap()
    example_2_compare_gap_sizes()
    example_3_small_office()
    example_4_material_cost_comparison()
    example_5_rectangular_panels()
    example_6_error_handling()

    print("\n" + "=" * 70)
    print("ALL EXAMPLES COMPLETED")
    print("=" * 70 + "\n")


if __name__ == '__main__':
    main()
