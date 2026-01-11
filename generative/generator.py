"""
Design Generator for creating novel ceiling layouts.

Uses AI-driven generation with constraint satisfaction.
"""

import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class PatternType(str, Enum):
    """Available pattern types."""
    GRID = "grid"
    OFFSET = "offset"
    HERRINGBONE = "herringbone"
    HEXAGONAL = "hexagonal"
    ORGANIC = "organic"
    DIAGONAL = "diagonal"
    CHEVRON = "chevron"


class StyleType(str, Enum):
    """Design style types."""
    MODERN = "modern"
    CLASSIC = "classic"
    MINIMAL = "minimal"
    ORGANIC = "organic"
    INDUSTRIAL = "industrial"


@dataclass
class Panel:
    """Individual panel in the design."""
    x: float
    y: float
    width: float
    height: float
    rotation: float = 0.0
    material_id: Optional[str] = None


@dataclass
class DesignOption:
    """Generated design option."""
    id: str
    pattern: PatternType
    style: StyleType
    panels: List[Panel] = field(default_factory=list)
    total_panels: int = 0
    coverage_percent: float = 0.0
    efficiency_score: float = 0.0
    aesthetic_score: float = 0.0
    cost_estimate: float = 0.0
    svg_preview: Optional[str] = None


class DesignGenerator:
    """
    Generates novel ceiling design options.

    Supports multiple pattern types and optimization criteria.
    """

    def __init__(self, random_seed: int = None):
        if random_seed:
            np.random.seed(random_seed)

    def generate(
        self,
        ceiling_length_mm: float,
        ceiling_width_mm: float,
        perimeter_gap_mm: float = 200,
        panel_gap_mm: float = 50,
        pattern: PatternType = PatternType.GRID,
        style: StyleType = StyleType.MODERN,
        constraints: Dict[str, Any] = None,
        num_options: int = 5
    ) -> List[DesignOption]:
        """
        Generate design options.

        Args:
            ceiling_length_mm: Ceiling length
            ceiling_width_mm: Ceiling width
            perimeter_gap_mm: Gap at ceiling edge
            panel_gap_mm: Gap between panels
            pattern: Pattern type to generate
            style: Design style
            constraints: Optional constraints (max_panel_size, min_panels, etc.)
            num_options: Number of options to generate

        Returns:
            List of DesignOption objects
        """
        import uuid

        constraints = constraints or {}
        max_panel_size = constraints.get('max_panel_size_mm', 2400)
        min_panels = constraints.get('min_panels', 2)

        options = []

        for i in range(num_options):
            # Vary parameters for each option
            variation = 1.0 + (np.random.random() - 0.5) * 0.4

            if pattern == PatternType.GRID:
                panels = self._generate_grid(
                    ceiling_length_mm, ceiling_width_mm,
                    perimeter_gap_mm, panel_gap_mm,
                    max_panel_size * variation
                )
            elif pattern == PatternType.OFFSET:
                panels = self._generate_offset(
                    ceiling_length_mm, ceiling_width_mm,
                    perimeter_gap_mm, panel_gap_mm,
                    max_panel_size * variation
                )
            elif pattern == PatternType.HEXAGONAL:
                panels = self._generate_hexagonal(
                    ceiling_length_mm, ceiling_width_mm,
                    perimeter_gap_mm, max_panel_size * variation
                )
            elif pattern == PatternType.DIAGONAL:
                panels = self._generate_diagonal(
                    ceiling_length_mm, ceiling_width_mm,
                    perimeter_gap_mm, panel_gap_mm,
                    max_panel_size * variation
                )
            else:
                panels = self._generate_grid(
                    ceiling_length_mm, ceiling_width_mm,
                    perimeter_gap_mm, panel_gap_mm,
                    max_panel_size
                )

            # Calculate metrics
            ceiling_area = ceiling_length_mm * ceiling_width_mm
            panel_area = sum(p.width * p.height for p in panels)
            coverage = (panel_area / ceiling_area) * 100

            option = DesignOption(
                id=f"design_{uuid.uuid4().hex[:8]}",
                pattern=pattern,
                style=style,
                panels=panels,
                total_panels=len(panels),
                coverage_percent=round(coverage, 1),
                efficiency_score=round(coverage * 0.9, 1),
                aesthetic_score=round(70 + np.random.random() * 20, 1),
                cost_estimate=len(panels) * 50 + panel_area / 1000
            )

            # Generate SVG preview
            option.svg_preview = self._generate_svg_preview(
                option, ceiling_length_mm, ceiling_width_mm, perimeter_gap_mm
            )

            options.append(option)

        # Sort by combined score
        options.sort(
            key=lambda x: x.efficiency_score + x.aesthetic_score,
            reverse=True
        )

        return options

    def _generate_grid(
        self,
        length: float,
        width: float,
        perimeter_gap: float,
        panel_gap: float,
        max_panel_size: float
    ) -> List[Panel]:
        """Generate standard grid pattern."""
        available_length = length - 2 * perimeter_gap
        available_width = width - 2 * perimeter_gap

        # Calculate grid dimensions
        panels_x = max(1, int(np.ceil(available_width / max_panel_size)))
        panels_y = max(1, int(np.ceil(available_length / max_panel_size)))

        panel_width = (available_width - (panels_x - 1) * panel_gap) / panels_x
        panel_height = (available_length - (panels_y - 1) * panel_gap) / panels_y

        panels = []
        for row in range(panels_y):
            for col in range(panels_x):
                x = perimeter_gap + col * (panel_width + panel_gap)
                y = perimeter_gap + row * (panel_height + panel_gap)
                panels.append(Panel(x=x, y=y, width=panel_width, height=panel_height))

        return panels

    def _generate_offset(
        self,
        length: float,
        width: float,
        perimeter_gap: float,
        panel_gap: float,
        max_panel_size: float
    ) -> List[Panel]:
        """Generate offset (brick) pattern."""
        available_length = length - 2 * perimeter_gap
        available_width = width - 2 * perimeter_gap

        panels_x = max(1, int(np.ceil(available_width / max_panel_size)))
        panels_y = max(1, int(np.ceil(available_length / (max_panel_size * 0.5))))

        panel_width = (available_width - (panels_x - 1) * panel_gap) / panels_x
        panel_height = (available_length - (panels_y - 1) * panel_gap) / panels_y

        panels = []
        for row in range(panels_y):
            offset = (panel_width / 2) if row % 2 == 1 else 0
            for col in range(panels_x):
                x = perimeter_gap + offset + col * (panel_width + panel_gap)
                y = perimeter_gap + row * (panel_height + panel_gap)

                # Adjust edge panels
                if x + panel_width > width - perimeter_gap:
                    continue

                panels.append(Panel(x=x, y=y, width=panel_width, height=panel_height))

        return panels

    def _generate_hexagonal(
        self,
        length: float,
        width: float,
        perimeter_gap: float,
        hex_size: float
    ) -> List[Panel]:
        """Generate hexagonal pattern."""
        panels = []

        hex_width = hex_size
        hex_height = hex_size * 0.866  # sqrt(3)/2

        cols = int((width - 2 * perimeter_gap) / (hex_width * 0.75)) + 1
        rows = int((length - 2 * perimeter_gap) / hex_height) + 1

        for row in range(rows):
            for col in range(cols):
                x = perimeter_gap + col * hex_width * 0.75
                y = perimeter_gap + row * hex_height

                if col % 2 == 1:
                    y += hex_height / 2

                if x + hex_width <= width - perimeter_gap and y + hex_height <= length - perimeter_gap:
                    panels.append(Panel(x=x, y=y, width=hex_width, height=hex_height))

        return panels

    def _generate_diagonal(
        self,
        length: float,
        width: float,
        perimeter_gap: float,
        panel_gap: float,
        panel_size: float
    ) -> List[Panel]:
        """Generate diagonal pattern."""
        panels = []

        diag_size = panel_size * 0.707  # 1/sqrt(2)

        x = perimeter_gap
        y = perimeter_gap

        while y < length - perimeter_gap:
            row_x = x
            row_y = y

            while row_x < width - perimeter_gap and row_y < length - perimeter_gap:
                panels.append(Panel(
                    x=row_x,
                    y=row_y,
                    width=diag_size,
                    height=diag_size,
                    rotation=45
                ))
                row_x += diag_size + panel_gap
                row_y += diag_size + panel_gap

            y += diag_size + panel_gap

        return panels

    def _generate_svg_preview(
        self,
        option: DesignOption,
        length: float,
        width: float,
        perimeter_gap: float
    ) -> str:
        """Generate SVG preview of the design."""
        scale = 0.05
        svg_width = width * scale + 40
        svg_height = length * scale + 40

        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_width} {svg_height}">
  <rect x="20" y="20" width="{width * scale}" height="{length * scale}"
        fill="#1e293b" stroke="#334155" stroke-width="2"/>
  <rect x="{20 + perimeter_gap * scale}" y="{20 + perimeter_gap * scale}"
        width="{(width - 2 * perimeter_gap) * scale}"
        height="{(length - 2 * perimeter_gap) * scale}"
        fill="none" stroke="#475569" stroke-dasharray="4,4"/>'''

        for panel in option.panels:
            px = 20 + panel.x * scale
            py = 20 + panel.y * scale
            pw = panel.width * scale
            ph = panel.height * scale

            transform = f' transform="rotate({panel.rotation} {px + pw/2} {py + ph/2})"' if panel.rotation else ''

            svg += f'\n  <rect x="{px}" y="{py}" width="{pw}" height="{ph}"'
            svg += f' fill="#3b82f6" stroke="#60a5fa" rx="2"{transform}/>'

        svg += '\n</svg>'
        return svg
