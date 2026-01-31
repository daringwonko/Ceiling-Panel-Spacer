#!/usr/bin/env python3
"""
Construction Ceiling Panel Calculator
Generates optimized panel layouts with DXF export, measurements, and material specs.

Algorithm Version: 2.0 (with practical panel constraints)
"""

import json
import math
from dataclasses import dataclass, asdict
from typing import List, Tuple, Dict, Optional, Any
from pathlib import Path
from datetime import datetime

from core.algorithm_config import AlgorithmConfig
from core.svg_config import SVGConfig


@dataclass
class CeilingDimensions:
    """Ceiling dimensions in millimeters"""

    length_mm: float  # X-axis
    width_mm: float  # Y-axis

    def to_meters(self) -> Tuple[float, float]:
        return self.length_mm / 1000, self.width_mm / 1000


@dataclass
class PanelSpacing:
    """Gap specifications in millimeters"""

    perimeter_gap_mm: float  # Gap around ceiling edge
    panel_gap_mm: float  # Gap between panels


@dataclass
class Material:
    """Material/finish specification"""

    name: str
    category: str  # 'lighting', 'acoustic', 'drywall', 'metal', 'custom'
    color: str
    reflectivity: float  # 0.0 to 1.0
    cost_per_sqm: float
    notes: str = ""


@dataclass
class PanelLayout:
    """Calculated panel layout"""

    panel_width_mm: float
    panel_length_mm: float
    panels_per_row: int
    panels_per_column: int
    total_panels: int
    total_coverage_sqm: float
    gap_area_sqm: float

    def to_dict(self) -> Dict:
        return asdict(self)


class CeilingPanelCalculator:
    """Core calculation engine for ceiling panel layouts"""

    def __init__(self, ceiling: CeilingDimensions, spacing: PanelSpacing):
        self.ceiling = ceiling
        self.spacing = spacing
        self.layouts: List[Tuple[PanelLayout, float]] = []  # (layout, efficiency score)

    def _validate_inputs(self, config: AlgorithmConfig) -> None:
        """Validate ceiling dimensions against gap constraints."""
        available_length = self.ceiling.length_mm - (2 * self.spacing.perimeter_gap_mm)
        available_width = self.ceiling.width_mm - (2 * self.spacing.perimeter_gap_mm)

        if available_length <= 0:
            raise ValueError(
                f"Perimeter gap ({self.spacing.perimeter_gap_mm}mm x 2) exceeds "
                f"ceiling length ({self.ceiling.length_mm}mm)"
            )
        if available_width <= 0:
            raise ValueError(
                f"Perimeter gap ({self.spacing.perimeter_gap_mm}mm x 2) exceeds "
                f"ceiling width ({self.ceiling.width_mm}mm)"
            )

        # Pre-check: can we fit at least one panel?
        if (
            available_length < config.min_panel_dimension_mm
            or available_width < config.min_panel_dimension_mm
        ):
            raise ValueError(
                f"Available space ({available_length:.0f}x{available_width:.0f}mm) too small for minimum "
                f"panel size ({config.min_panel_dimension_mm}mm)"
            )

    def calculate_optimal_layout(
        self, target_aspect_ratio: float = 1.0, config: AlgorithmConfig = None
    ) -> PanelLayout:
        """
        Calculate optimal panel size with practical constraints.

        Args:
            target_aspect_ratio: Panel width/length ratio (1.0 = square)
            config: Algorithm configuration with constraints (default: AlgorithmConfig)

        Returns:
            Optimized PanelLayout with practical panel sizes
        """
        config = config or AlgorithmConfig()
        config.validate()

        # Validate inputs
        self._validate_inputs(config)

        # Available space (ceiling minus perimeter gaps)
        available_length = self.ceiling.length_mm - (2 * self.spacing.perimeter_gap_mm)
        available_width = self.ceiling.width_mm - (2 * self.spacing.perimeter_gap_mm)

        best_layout = None
        best_score = -1

        # SCORING FORMULA EXPLANATION:
        # - coverage_score: Higher coverage = less wasted space
        # - ratio_score: Closer to target aspect ratio = better aesthetics
        # - panel_count_penalty: Slight preference for fewer panels (less labor/seams)
        #   but NOT strong enough to prefer single oversized panels
        #
        # This replaces the old formula which maximized panel_area/(available_area),
        # inadvertently rewarding single oversized panels.

        # Try different numbers of panels per dimension
        for panels_length in range(1, config.max_panels_per_dimension + 1):
            for panels_width in range(1, config.max_panels_per_dimension + 1):
                # Calculate panel size with gaps
                panel_length = (
                    available_length - (panels_length - 1) * self.spacing.panel_gap_mm
                ) / panels_length
                panel_width = (
                    available_width - (panels_width - 1) * self.spacing.panel_gap_mm
                ) / panels_width

                # HARD CONSTRAINT: Skip oversized panels
                if (
                    panel_length > config.max_panel_dimension_mm
                    or panel_width > config.max_panel_dimension_mm
                ):
                    continue

                # HARD CONSTRAINT: Skip too-small panels
                if (
                    panel_length < config.min_panel_dimension_mm
                    or panel_width < config.min_panel_dimension_mm
                ):
                    continue

                # Calculate score (higher = better)
                actual_ratio = panel_width / panel_length
                ratio_error = abs(actual_ratio - target_aspect_ratio)

                # Coverage (more coverage = better)
                panel_area = panel_length * panel_width
                total_area = available_length * available_width
                coverage_score = (
                    panel_area * panels_length * panels_width
                ) / total_area

                # Prefer fewer panels (less labor) but not oversized
                panel_count = panels_length * panels_width
                panel_count_penalty = 1 / (1 + panel_count * 0.02)

                # Aspect ratio closeness
                ratio_score = 1 / (1 + ratio_error)

                # Combined score
                score = coverage_score * ratio_score * panel_count_penalty

                if score > best_score:
                    best_score = score
                    best_layout = PanelLayout(
                        panel_width_mm=panel_width,
                        panel_length_mm=panel_length,
                        panels_per_row=panels_width,
                        panels_per_column=panels_length,
                        total_panels=panel_count,
                        total_coverage_sqm=(panel_length * panel_width * panel_count)
                        / 1_000_000,
                        gap_area_sqm=(
                            self.ceiling.length_mm * self.ceiling.width_mm
                            - panel_length * panel_width * panel_count
                        )
                        / 1_000_000,
                    )
                    self.layouts.append((best_layout, score))

        if best_layout is None:
            raise ValueError(
                f"No valid layout found for ceiling {self.ceiling.length_mm}x{self.ceiling.width_mm}mm "
                f"with constraints (max panel: {config.max_panel_dimension_mm}mm, "
                f"min panel: {config.min_panel_dimension_mm}mm)"
            )

        return best_layout

    def get_alternate_layouts(self, count: int = 5) -> List[Tuple[PanelLayout, float]]:
        """Get top N alternative layouts ranked by efficiency"""
        sorted_layouts = sorted(self.layouts, key=lambda x: x[1], reverse=True)
        return sorted_layouts[:count]

    def validate_layout(self, layout: PanelLayout) -> bool:
        """Verify layout fits ceiling with specified gaps"""
        total_length = (
            layout.panel_length_mm * layout.panels_per_column
            + (layout.panels_per_column - 1) * self.spacing.panel_gap_mm
            + 2 * self.spacing.perimeter_gap_mm
        )

        total_width = (
            layout.panel_width_mm * layout.panels_per_row
            + (layout.panels_per_row - 1) * self.spacing.panel_gap_mm
            + 2 * self.spacing.perimeter_gap_mm
        )

        length_ok = abs(total_length - self.ceiling.length_mm) < 1  # 1mm tolerance
        width_ok = abs(total_width - self.ceiling.width_mm) < 1

        return length_ok and width_ok


class DXFGenerator:
    """Generate DXF files for CAD integration.

    Requires ezdxf library: pip install ezdxf
    """

    def __init__(
        self, ceiling: CeilingDimensions, spacing: PanelSpacing, layout: PanelLayout
    ):
        self.ceiling = ceiling
        self.spacing = spacing
        self.layout = layout

        # Verify ezdxf is available at init time
        try:
            import ezdxf

            self._ezdxf = ezdxf
        except ImportError:
            raise ImportError(
                "ezdxf is required for DXF generation. Install with: pip install ezdxf"
            )

    def generate_dxf(self, filename: str, material: Optional[Material] = None) -> str:
        """
        Generate a DXF file with ceiling layout.

        Args:
            filename: Output file path
            material: Optional material specification for annotations

        Returns:
            Path to generated file
        """
        doc = self._ezdxf.new(dxfversion="R2010")

        # Create layers for organization
        doc.layers.add("CEILING_BOUNDARY", color=7)  # White
        doc.layers.add("PANELS", color=1)  # Red
        doc.layers.add("PERIMETER_GAP", color=2)  # Yellow
        doc.layers.add("ANNOTATIONS", color=3)  # Green

        msp = doc.modelspace()

        # Draw ceiling boundary
        msp.add_lwpolyline(
            [
                (0, 0),
                (self.ceiling.length_mm, 0),
                (self.ceiling.length_mm, self.ceiling.width_mm),
                (0, self.ceiling.width_mm),
                (0, 0),
            ],
            close=True,
            dxfattribs={"layer": "CEILING_BOUNDARY"},
        )

        # Draw perimeter gap indicator
        perimeter = self.spacing.perimeter_gap_mm
        msp.add_lwpolyline(
            [
                (perimeter, perimeter),
                (self.ceiling.length_mm - perimeter, perimeter),
                (
                    self.ceiling.length_mm - perimeter,
                    self.ceiling.width_mm - perimeter,
                ),
                (perimeter, self.ceiling.width_mm - perimeter),
                (perimeter, perimeter),
            ],
            close=True,
            dxfattribs={"layer": "PERIMETER_GAP"},
        )

        # Draw panels
        start_x = self.spacing.perimeter_gap_mm
        start_y = self.spacing.perimeter_gap_mm

        for row in range(self.layout.panels_per_column):
            for col in range(self.layout.panels_per_row):
                x = start_x + col * (
                    self.layout.panel_width_mm + self.spacing.panel_gap_mm
                )
                y = start_y + row * (
                    self.layout.panel_length_mm + self.spacing.panel_gap_mm
                )

                # Draw panel rectangle
                msp.add_lwpolyline(
                    [
                        (x, y),
                        (x + self.layout.panel_width_mm, y),
                        (
                            x + self.layout.panel_width_mm,
                            y + self.layout.panel_length_mm,
                        ),
                        (x, y + self.layout.panel_length_mm),
                        (x, y),
                    ],
                    close=True,
                    dxfattribs={"layer": "PANELS"},
                )

                # Add panel label at center
                panel_num = row * self.layout.panels_per_row + col + 1
                label_x = x + self.layout.panel_width_mm / 2
                label_y = y + self.layout.panel_length_mm / 2
                msp.add_text(
                    f"P{panel_num}",
                    dxfattribs={
                        "layer": "ANNOTATIONS",
                        "height": min(50, self.layout.panel_width_mm / 10),
                        "insert": (label_x, label_y),
                    },
                )

        # Add title block annotations
        title_y = self.ceiling.width_mm + 100
        msp.add_text(
            f"Ceiling: {self.ceiling.length_mm}mm x {self.ceiling.width_mm}mm",
            dxfattribs={"layer": "ANNOTATIONS", "height": 80, "insert": (0, title_y)},
        )
        msp.add_text(
            f"Panels: {self.layout.total_panels} ({self.layout.panels_per_row}x{self.layout.panels_per_column})",
            dxfattribs={
                "layer": "ANNOTATIONS",
                "height": 80,
                "insert": (0, title_y + 100),
            },
        )
        msp.add_text(
            f"Panel Size: {self.layout.panel_width_mm:.1f}mm x {self.layout.panel_length_mm:.1f}mm",
            dxfattribs={
                "layer": "ANNOTATIONS",
                "height": 80,
                "insert": (0, title_y + 200),
            },
        )

        if material:
            msp.add_text(
                f"Material: {material.name} - {material.color}",
                dxfattribs={
                    "layer": "ANNOTATIONS",
                    "height": 80,
                    "insert": (0, title_y + 300),
                },
            )

        doc.saveas(filename)
        print(f"✓ DXF saved: {filename}")
        return filename


class SVGGenerator:
    """Generate SVG blueprints for visualization"""

    def __init__(
        self,
        ceiling: CeilingDimensions,
        spacing: PanelSpacing,
        layout: PanelLayout,
        scale: float = 0.5,
    ):
        """
        Initialize SVG generator.

        Args:
            ceiling: Ceiling dimensions
            spacing: Panel spacing configuration
            layout: Calculated panel layout
            scale: mm to pixel conversion factor (default: 0.5)
                   Adjust based on output target:
                   - 0.5: Screen display (96 DPI)
                   - 1.0: Print quality (72 DPI)
                   - 2.0: High resolution print (300 DPI simulation)
        """
        self.ceiling = ceiling
        self.spacing = spacing
        self.layout = layout
        self.scale = scale

    def generate_svg(self, filename: str, material: Optional[Material] = None) -> str:
        """Generate SVG blueprint with top-down view.

        Args:
            filename: Output file path
            material: Optional material for annotations

        Returns:
            Path to generated file
        """
        cfg = self.config
        scale = cfg.scale

        # Calculate dimensions
        width_px = self.ceiling.length_mm * scale
        height_px = self.ceiling.width_mm * scale

        # Build SVG with proper viewBox
        svg_lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            f'<svg width="{width_px:.1f}px" height="{height_px:.1f}px"',
            f'     viewBox="0 0 {self.ceiling.length_mm} {self.ceiling.width_mm}"',
            '     xmlns="http://www.w3.org/2000/svg">',
            "<defs>",
            "<style>",
            f".ceiling {{ fill: {cfg.ceiling_fill}; stroke: {cfg.ceiling_stroke}; stroke-width: {cfg.stroke_width * 2}; }}",
            f".panel {{ fill: {cfg.panel_fill}; stroke: {cfg.panel_stroke}; stroke-width: {cfg.stroke_width}; }}",
            f".gap {{ fill: none; stroke: {cfg.gap_stroke}; stroke-width: {cfg.stroke_width / 2}; stroke-dasharray: 10,5; }}",
            f".text {{ font-family: {cfg.font_family}; font-size: {cfg.font_size * 5}px; fill: {cfg.text_color}; }}",
            f".text-small {{ font-family: {cfg.font_family}; font-size: {cfg.font_size * 3}px; fill: {cfg.text_color}; }}",
            "</style>",
            "</defs>",
            "",
            "<!-- Ceiling boundary -->",
            f'<rect class="ceiling" x="0" y="0" width="{self.ceiling.length_mm}" height="{self.ceiling.width_mm}"/>',
        ]

        # Perimeter gap indicator
        perim = self.spacing.perimeter_gap_mm
        svg_lines.append(
            f'<rect class="gap" x="{perim}" y="{perim}" '
            f'width="{self.ceiling.length_mm - 2 * perim}" height="{self.ceiling.width_mm - 2 * perim}"/>'
        )

        # Draw panels (using mm coordinates, viewBox handles scaling)
        start_x = self.spacing.perimeter_gap_mm
        start_y = self.spacing.perimeter_gap_mm
        panel_w = self.layout.panel_width_mm
        panel_h = self.layout.panel_length_mm
        gap = self.spacing.panel_gap_mm

        svg_lines.append("")
        svg_lines.append("<!-- Panels -->")
        svg_lines.append('<g id="panels">')

        for row in range(self.layout.panels_per_column):
            for col in range(self.layout.panels_per_row):
                x = start_x + col * (panel_w + gap)
                y = start_y + row * (panel_h + gap)
                panel_num = row * self.layout.panels_per_row + col + 1

                svg_lines.append(
                    f'  <rect class="panel" x="{x:.1f}" y="{y:.1f}" '
                    f'width="{panel_w:.1f}" height="{panel_h:.1f}"/>'
                )

                # Panel label (centered)
                label_x = x + panel_w / 2
                label_y = y + panel_h / 2
                svg_lines.append(
                    f'  <text class="text-small" x="{label_x:.1f}" y="{label_y:.1f}" '
                    f'text-anchor="middle" dominant-baseline="middle">P{panel_num}</text>'
                )

        svg_lines.append("</g>")

        # Annotations
        svg_lines.append("")
        svg_lines.append("<!-- Annotations -->")
        svg_lines.append('<g id="annotations">')
        svg_lines.append(
            f'<text class="text" x="50" y="100" font-weight="bold">'
            f"Ceiling: {self.ceiling.length_mm}mm x {self.ceiling.width_mm}mm</text>"
        )
        svg_lines.append(
            f'<text class="text" x="50" y="180">'
            f"Panels: {self.layout.panel_width_mm:.0f}mm x {self.layout.panel_length_mm:.0f}mm "
            f"({self.layout.panels_per_row}x{self.layout.panels_per_column})</text>"
        )
        svg_lines.append(
            f'<text class="text" x="50" y="260">'
            f"Gap: {self.spacing.panel_gap_mm}mm | Perimeter: {self.spacing.perimeter_gap_mm}mm</text>"
        )

        if material:
            svg_lines.append(
                f'<text class="text" x="50" y="340">'
                f"Material: {material.name} - {material.color}</text>"
            )

        svg_lines.append("</g>")
        svg_lines.append("</svg>")

        with open(filename, "w") as f:
            f.write("\n".join(svg_lines))

        print(f"✓ SVG saved: {filename}")
        return filename


class MaterialLibrary:
    """Pre-defined material finishes"""

    MATERIALS = {
        "led_panel_white": Material(
            name="LED Panel",
            category="lighting",
            color="White",
            reflectivity=0.85,
            cost_per_sqm=450.00,
            notes="Integrated LED lighting, 4000K",
        ),
        "led_panel_black": Material(
            name="LED Panel",
            category="lighting",
            color="Black",
            reflectivity=0.15,
            cost_per_sqm=450.00,
            notes="Integrated LED lighting, 4000K",
        ),
        "acoustic_white": Material(
            name="Acoustic Panel",
            category="acoustic",
            color="White",
            reflectivity=0.70,
            cost_per_sqm=35.00,
            notes="Sound absorbing, Class A",
        ),
        "acoustic_grey": Material(
            name="Acoustic Panel",
            category="acoustic",
            color="Grey",
            reflectivity=0.50,
            cost_per_sqm=35.00,
            notes="Sound absorbing, Class A",
        ),
        "drywall_white": Material(
            name="Drywall",
            category="drywall",
            color="White",
            reflectivity=0.75,
            cost_per_sqm=15.00,
            notes="Standard gypsum board",
        ),
        "aluminum_brushed": Material(
            name="Aluminum",
            category="metal",
            color="Brushed Silver",
            reflectivity=0.60,
            cost_per_sqm=120.00,
            notes="Anodized aluminum, brushed finish",
        ),
        "aluminum_polished": Material(
            name="Aluminum",
            category="metal",
            color="Polished Silver",
            reflectivity=0.90,
            cost_per_sqm=140.00,
            notes="Anodized aluminum, mirror polish",
        ),
    }

    @classmethod
    def get_material(cls, key: str) -> Material:
        if key not in cls.MATERIALS:
            raise ValueError(
                f"Unknown material: {key}. Available: {list(cls.MATERIALS.keys())}"
            )
        return cls.MATERIALS[key]

    @classmethod
    def list_materials(cls):
        for key, material in cls.MATERIALS.items():
            print(
                f"  {key}: {material.name} ({material.category}) - ${material.cost_per_sqm}/sqm"
            )


class ProjectExporter:
    """Export project specifications and reports"""

    def __init__(
        self,
        ceiling: CeilingDimensions,
        spacing: PanelSpacing,
        layout: PanelLayout,
        material: Material,
    ):
        self.ceiling = ceiling
        self.spacing = spacing
        self.layout = layout
        self.material = material

    def generate_report(self, filename: str):
        """Generate comprehensive project report"""
        report = []
        report.append("=" * 60)
        report.append("CEILING PANEL LAYOUT REPORT")
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("=" * 60)
        report.append("")

        report.append("CEILING DIMENSIONS")
        report.append("-" * 60)
        report.append(
            f"Length:  {self.ceiling.length_mm:>10.1f} mm  ({self.ceiling.length_mm / 1000:>6.2f} m)"
        )
        report.append(
            f"Width:   {self.ceiling.width_mm:>10.1f} mm  ({self.ceiling.width_mm / 1000:>6.2f} m)"
        )
        report.append(
            f"Area:    {self.ceiling.length_mm * self.ceiling.width_mm / 1_000_000:>10.2f} m²"
        )
        report.append("")

        report.append("SPACING SPECIFICATIONS")
        report.append("-" * 60)
        report.append(
            f"Perimeter Gap:  {self.spacing.perimeter_gap_mm:>6.1f} mm (all edges)"
        )
        report.append(
            f"Panel Gap:      {self.spacing.panel_gap_mm:>6.1f} mm (between panels)"
        )
        report.append("")

        report.append("PANEL LAYOUT (OPTIMIZED)")
        report.append("-" * 60)
        report.append(
            f"Panel Dimensions:  {self.layout.panel_width_mm:.1f} mm × {self.layout.panel_length_mm:.1f} mm"
        )
        report.append(
            f"Panel Area:        {self.layout.panel_width_mm * self.layout.panel_length_mm / 1_000_000:.4f} m²"
        )
        report.append(f"Panels Per Row:    {self.layout.panels_per_row}")
        report.append(f"Panels Per Column: {self.layout.panels_per_column}")
        report.append(f"Total Panels:      {self.layout.total_panels}")
        report.append("")

        report.append("COVERAGE ANALYSIS")
        report.append("-" * 60)
        report.append(f"Panel Coverage:  {self.layout.total_coverage_sqm:>8.2f} m²")
        report.append(f"Gap/Service Area:{self.layout.gap_area_sqm:>8.2f} m²")
        report.append(
            f"Coverage %:      {100 * self.layout.total_coverage_sqm / (self.ceiling.length_mm * self.ceiling.width_mm / 1_000_000):>8.1f}%"
        )
        report.append("")

        report.append("MATERIAL SPECIFICATION")
        report.append("-" * 60)
        report.append(f"Product:       {self.material.name}")
        report.append(f"Category:      {self.material.category}")
        report.append(f"Color:         {self.material.color}")
        report.append(f"Reflectivity:  {self.material.reflectivity:.0%}")
        report.append(f"Cost/m²:       ${self.material.cost_per_sqm:.2f}")
        report.append(f"Notes:         {self.material.notes}")
        report.append("")

        report.append("MATERIAL REQUIREMENTS & COST")
        report.append("-" * 60)
        total_material_cost = (
            self.layout.total_coverage_sqm * self.material.cost_per_sqm
        )
        report.append(f"Panels Required: {self.layout.total_panels} units")
        report.append(f"Total m²:        {self.layout.total_coverage_sqm:.2f} m²")
        report.append(f"Total Cost:      ${total_material_cost:,.2f}")
        report.append("")

        report.append("CUTTING LIST")
        report.append("-" * 60)
        report.append(
            f"Panel Size: {self.layout.panel_width_mm:.1f} mm × {self.layout.panel_length_mm:.1f} mm"
        )
        report.append(f"Quantity: {self.layout.total_panels} pieces")
        report.append("")

        with open(filename, "w") as f:
            f.write("\n".join(report))

        print(f"✓ Report saved: {filename}")
        return "\n".join(report)

    def export_json(self, filename: str):
        """Export project as JSON for further processing"""
        project_data = {
            "metadata": {
                "generated": datetime.now().isoformat(),
                "application": "Ceiling Panel Calculator",
            },
            "ceiling": {
                "length_mm": self.ceiling.length_mm,
                "width_mm": self.ceiling.width_mm,
                "area_m2": self.ceiling.length_mm * self.ceiling.width_mm / 1_000_000,
            },
            "spacing": {
                "perimeter_gap_mm": self.spacing.perimeter_gap_mm,
                "panel_gap_mm": self.spacing.panel_gap_mm,
            },
            "layout": self.layout.to_dict(),
            "material": {
                "name": self.material.name,
                "category": self.material.category,
                "color": self.material.color,
                "reflectivity": self.material.reflectivity,
                "cost_per_m2": self.material.cost_per_sqm,
                "notes": self.material.notes,
                "total_cost": self.layout.total_coverage_sqm
                * self.material.cost_per_sqm,
            },
        }

        with open(filename, "w") as f:
            json.dump(project_data, f, indent=2)

        print(f"✓ JSON export saved: {filename}")
        return project_data


# ============================================================================
# MAIN USAGE EXAMPLE
# ============================================================================


def main():
    """Interactive example usage"""

    print("\n" + "=" * 60)
    print("CEILING PANEL CALCULATOR")
    print("=" * 60 + "\n")

    # Example: 4.8m × 3.6m ceiling with 200mm gaps
    ceiling = CeilingDimensions(length_mm=4800, width_mm=3600)
    spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

    print(f"Ceiling: {ceiling.length_mm}mm × {ceiling.width_mm}mm")
    print(
        f"Gaps: {spacing.perimeter_gap_mm}mm perimeter, {spacing.panel_gap_mm}mm between panels\n"
    )

    # Calculate optimal layout
    calc = CeilingPanelCalculator(ceiling, spacing)
    optimal_layout = calc.calculate_optimal_layout(
        target_aspect_ratio=1.0
    )  # Square panels

    print("OPTIMAL LAYOUT:")
    print(
        f"  Panel size: {optimal_layout.panel_width_mm:.1f}mm × {optimal_layout.panel_length_mm:.1f}mm"
    )
    print(
        f"  Layout: {optimal_layout.panels_per_row}×{optimal_layout.panels_per_column} = {optimal_layout.total_panels} panels"
    )
    print(
        f"  Coverage: {optimal_layout.total_coverage_sqm:.2f} m² (gaps: {optimal_layout.gap_area_sqm:.2f} m²)\n"
    )

    # Show alternatives
    print("ALTERNATIVE LAYOUTS (top 3):")
    for i, (layout, score) in enumerate(calc.get_alternate_layouts(3), 1):
        print(
            f"  {i}. {layout.panels_per_row}×{layout.panels_per_column} panels "
            f"({layout.panel_width_mm:.0f}×{layout.panel_length_mm:.0f}mm) - efficiency: {score:.2%}"
        )
    print()

    # Select a material
    print("AVAILABLE MATERIALS:")
    MaterialLibrary.list_materials()
    print()

    material = MaterialLibrary.get_material("led_panel_white")
    print(f"Selected: {material.name} - {material.color}\n")

    # Generate outputs
    print("GENERATING OUTPUTS...\n")

    # Create DXF
    dxf_gen = DXFGenerator(ceiling, spacing, optimal_layout)
    dxf_gen.generate_dxf("ceiling_layout.dxf", material)

    # Create SVG
    svg_gen = SVGGenerator(ceiling, spacing, optimal_layout)
    svg_gen.generate_svg("ceiling_layout.svg", material)

    # Generate reports
    exporter = ProjectExporter(ceiling, spacing, optimal_layout, material)
    report = exporter.generate_report("ceiling_report.txt")
    exporter.export_json("ceiling_project.json")

    print("\n" + "=" * 60)
    print("REPORT PREVIEW:")
    print("=" * 60)
    print(report)

    print("\nFILES GENERATED:")
    print("  ✓ ceiling_layout.dxf  (for CAD software)")
    print("  ✓ ceiling_layout.svg  (for viewing/printing)")
    print("  ✓ ceiling_report.txt  (specifications)")
    print("  ✓ ceiling_project.json (for integration)")


if __name__ == "__main__":
    main()
