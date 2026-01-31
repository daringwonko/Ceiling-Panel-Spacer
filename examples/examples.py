#!/usr/bin/env python3
"""
Ceiling Panel Calculator - Practical Examples

This module contains executable examples demonstrating how to use
the Ceiling Panel Calculator for various construction scenarios.

Usage:
    python examples/examples.py                 # Run all examples
    python examples/examples.py --example 1    # Run specific example
    python examples/examples.py --list         # List available examples
"""

import sys
import os
import argparse
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.ceiling_panel_calc import (
    CeilingDimensions,
    PanelSpacing,
    CeilingPanelCalculator,
    DXFGenerator,
    SVGGenerator,
    MaterialLibrary,
    ProjectExporter,
    PanelLayout,
)


def example_1_basic_calculation():
    """Example 1: Basic ceiling panel layout calculation.

    Demonstrates the core calculation workflow for a standard room.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 1: Basic Calculation")
    print("=" * 60)

    # Define ceiling dimensions (6m x 4.5m commercial space)
    ceiling = CeilingDimensions(
        length_mm=6000,  # 6 meters
        width_mm=4500,  # 4.5 meters
    )

    # Define spacing requirements
    spacing = PanelSpacing(
        perimeter_gap_mm=200,  # 200mm edge gap for services
        panel_gap_mm=200,  # 200mm between panels
    )

    print(f"\nInput:")
    print(f"  Ceiling: {ceiling.length_mm}mm x {ceiling.width_mm}mm")
    print(
        f"  Spacing: {spacing.perimeter_gap_mm}mm perimeter, {spacing.panel_gap_mm}mm between panels"
    )

    # Calculate optimal layout
    calculator = CeilingPanelCalculator(ceiling, spacing)
    layout = calculator.calculate_optimal_layout(target_aspect_ratio=1.0)

    print(f"\nResult:")
    print(
        f"  Panel size: {layout.panel_width_mm:.1f}mm x {layout.panel_length_mm:.1f}mm"
    )
    print(
        f"  Layout: {layout.panels_per_row}x{layout.panels_per_column} = {layout.total_panels} panels"
    )
    print(f"  Coverage: {layout.total_coverage_sqm:.2f} m²")
    print(f"  Gap area: {layout.gap_area_sqm:.2f} m²")

    # Verify constraints
    assert layout.panel_width_mm <= 2400, "Panel too wide"
    assert layout.panel_length_mm <= 2400, "Panel too long"
    print(f"\n✓ All panels within 2400mm constraint")


def example_2_comparing_gaps():
    """Example 2: Comparing different gap sizes.

    Shows how gap size affects panel dimensions and count.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Comparing Gap Sizes")
    print("=" * 60)

    ceiling = CeilingDimensions(length_mm=6000, width_mm=4500)

    gap_scenarios = [
        {"name": "Tight (100mm)", "gap": 100},
        {"name": "Standard (150mm)", "gap": 150},
        {"name": "Wide (200mm)", "gap": 200},
        {"name": "Spacious (250mm)", "gap": 250},
    ]

    print(f"\nCeiling: 6m x 4.5m")
    print(f"\n{'Scenario':<20} | {'Panel Size':<18} | {'Grid':<10} | {'Count':<6}")
    print("-" * 65)

    for scenario in gap_scenarios:
        spacing = PanelSpacing(
            perimeter_gap_mm=scenario["gap"], panel_gap_mm=scenario["gap"]
        )
        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout()

        print(
            f"{scenario['name']:<20} | "
            f"{layout.panel_width_mm:>6.0f}x{layout.panel_length_mm:<9.0f}mm | "
            f"{layout.panels_per_row}x{layout.panels_per_column:<7} | "
            f"{layout.total_panels:<6}"
        )


def example_3_generate_outputs():
    """Example 3: Generate all output formats.

    Creates DXF, SVG, report, and JSON files.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 3: Generate Output Files")
    print("=" * 60)

    # Setup
    ceiling = CeilingDimensions(length_mm=4800, width_mm=3600)
    spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout()

    material = MaterialLibrary.get_material("led_panel_white")

    print(f"\nGenerating files for {ceiling.length_mm}x{ceiling.width_mm}mm ceiling...")
    print(f"Material: {material.name} - {material.color}")

    # Create output directory
    output_dir = Path("output/examples")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Generate DXF
    dxf_gen = DXFGenerator(ceiling, spacing, layout)
    dxf_file = dxf_gen.generate_dxf(str(output_dir / "example_layout.dxf"), material)

    # Generate SVG
    svg_gen = SVGGenerator(ceiling, spacing, layout)
    svg_file = svg_gen.generate_svg(str(output_dir / "example_layout.svg"), material)

    # Generate report and JSON
    exporter = ProjectExporter(ceiling, spacing, layout, material)
    exporter.generate_report(str(output_dir / "example_report.txt"))
    json_data = exporter.export_json(str(output_dir / "example_project.json"))

    print(f"\nFiles created in {output_dir}/:")
    print(f"  - example_layout.dxf  (for CAD software)")
    print(f"  - example_layout.svg  (for viewing/printing)")
    print(f"  - example_report.txt  (specifications)")
    print(f"  - example_project.json (data export)")

    # Verify JSON was returned
    assert json_data is not None, "JSON export should return data"
    print(f"\nJSON contains {len(json_data)} sections: {list(json_data.keys())}")


def example_4_material_options():
    """Example 4: List and select materials.

    Shows available materials and cost calculations.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Material Options")
    print("=" * 60)

    print("\nAvailable materials:")
    print("-" * 60)
    MaterialLibrary.list_materials()

    # Calculate costs for different materials
    ceiling = CeilingDimensions(length_mm=6000, width_mm=4500)
    spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout()

    print(f"\nCost comparison for {layout.total_coverage_sqm:.2f} m² coverage:")
    print("-" * 60)

    for key in [
        "acoustic_white",
        "drywall_white",
        "led_panel_white",
        "aluminum_brushed",
    ]:
        material = MaterialLibrary.get_material(key)
        cost = layout.total_coverage_sqm * material.cost_per_sqm
        print(f"  {material.name:<20} ({material.color}): ${cost:,.2f}")


def example_5_batch_rooms():
    """Example 5: Calculate layouts for multiple rooms.

    Demonstrates batch processing for an office suite.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 5: Batch Room Processing")
    print("=" * 60)

    rooms = [
        {"name": "Conference Room A", "length": 5000, "width": 4000},
        {"name": "Conference Room B", "length": 6000, "width": 4000},
        {"name": "Open Office", "length": 10000, "width": 8000},
        {"name": "Reception", "length": 4000, "width": 3000},
    ]

    material = MaterialLibrary.get_material("led_panel_white")
    total_panels = 0
    total_cost = 0

    print(f"\nProcessing {len(rooms)} rooms with 200mm gaps...")
    print(f"\n{'Room':<20} | {'Ceiling':<12} | {'Panels':<8} | {'Cost':<12}")
    print("-" * 60)

    for room in rooms:
        ceiling = CeilingDimensions(length_mm=room["length"], width_mm=room["width"])
        spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

        calc = CeilingPanelCalculator(ceiling, spacing)
        layout = calc.calculate_optimal_layout()

        cost = layout.total_coverage_sqm * material.cost_per_sqm
        total_panels += layout.total_panels
        total_cost += cost

        print(
            f"{room['name']:<20} | "
            f"{room['length'] / 1000:.1f}x{room['width'] / 1000:.1f}m    | "
            f"{layout.total_panels:<8} | "
            f"${cost:>10,.2f}"
        )

    print("-" * 60)
    print(f"{'TOTAL':<20} |              | {total_panels:<8} | ${total_cost:>10,.2f}")


def list_examples():
    """List all available examples."""
    examples = [
        (1, "Basic Calculation", "Core workflow for a standard room"),
        (2, "Comparing Gaps", "How gap size affects layout"),
        (3, "Generate Outputs", "Create DXF, SVG, report, JSON"),
        (4, "Material Options", "List materials and costs"),
        (5, "Batch Rooms", "Process multiple rooms"),
    ]

    print("\nAvailable Examples:")
    print("-" * 60)
    for num, name, desc in examples:
        print(f"  {num}. {name:<25} - {desc}")
    print("\nRun with: python examples/examples.py --example <number>")


def main():
    """Main entry point for examples."""
    parser = argparse.ArgumentParser(
        description="Ceiling Panel Calculator - Executable Examples",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python examples/examples.py              # Run all examples
  python examples/examples.py --example 1  # Run example 1 only
  python examples/examples.py --list       # List available examples
        """,
    )
    parser.add_argument(
        "--example",
        "-e",
        type=int,
        choices=[1, 2, 3, 4, 5],
        help="Run a specific example (1-5)",
    )
    parser.add_argument(
        "--list", "-l", action="store_true", help="List available examples"
    )

    args = parser.parse_args()

    if args.list:
        list_examples()
        return

    example_funcs = {
        1: example_1_basic_calculation,
        2: example_2_comparing_gaps,
        3: example_3_generate_outputs,
        4: example_4_material_options,
        5: example_5_batch_rooms,
    }

    if args.example:
        # Run single example
        example_funcs[args.example]()
    else:
        # Run all examples
        print("=" * 60)
        print("CEILING PANEL CALCULATOR - ALL EXAMPLES")
        print("=" * 60)

        for num in sorted(example_funcs.keys()):
            try:
                example_funcs[num]()
            except Exception as e:
                print(f"\n⚠ Example {num} failed: {e}")

        print("\n" + "=" * 60)
        print("All examples complete!")
        print("=" * 60)


if __name__ == "__main__":
    main()
