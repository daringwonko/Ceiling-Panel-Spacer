"""
Plan View Generator for 2D Architectural Drawings

Generates top-down orthographic projections from BIM models with
cut geometry, hatching patterns, and architectural conventions.

Author: BIM Workbench
Version: 0.1.0
"""

from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Dict, Any, Set
from enum import Enum
from abc import ABC, abstractmethod

import numpy as np

from .projection import (
    OrthographicProjection,
    ProjectionResult,
    ProjectedVertex,
    ProjectedEdge,
    ProjectedFace,
    ViewDirection,
)


class HatchPattern(Enum):
    """Standard architectural hatching patterns."""

    CONCRETE = "concrete"
    STEEL = "steel"
    WOOD = "wood"
    INSULATION = "insulation"
    MASONRY = "masonry"
    GLASS = "glass"
    BRICK = "brick"
    DIAGONAL = "diagonal"
    CROSSHATCH = "crosshatch"


@dataclass
class CutSurface:
    """Represents a cut surface with hatching information."""

    polygon: List[Tuple[float, float]]  # 2D polygon coordinates
    material_type: str
    hatch_pattern: HatchPattern
    hatch_scale: float = 1.0
    hatch_angle: float = 45.0


@dataclass
class Opening:
    """Door/window opening in a wall."""

    polygon: List[Tuple[float, float]]  # Opening outline
    opening_type: str  # door, window, etc.
    width: float
    height: float
    sill_height: float = 0.0


@dataclass
class PlanViewResult:
    """Complete result of plan view generation."""

    projection: ProjectionResult
    cut_surfaces: List[CutSurface]
    openings: List[Opening]
    walls: List[Dict[str, Any]]
    doors: List[Dict[str, Any]]
    windows: List[Dict[str, Any]]
    furniture: List[Dict[str, Any]]
    dimensions: Dict[str, Tuple[float, float, float, float]]  # room_name -> bounds
    scale: float = 1.0
    cut_level: float = 1.2  # Standard cut height in meters


class HatchPatternGenerator(ABC):
    """Base class for hatch pattern generators."""

    @abstractmethod
    def generate_pattern(
        self,
        bounds: Tuple[float, float, float, float],
        scale: float = 1.0,
        angle: float = 45.0,
    ) -> List[Tuple[Tuple[float, float], Tuple[float, float]]]:
        """
        Generate pattern lines within bounds.

        Args:
            bounds: (min_x, min_y, max_x, max_y) of area
            scale: Pattern scale factor
            angle: Rotation angle in degrees

        Returns:
            List of line segments as ((x1, y1), (x2, y2))
        """
        pass


class ConcreteHatch(HatchPatternGenerator):
    """Concrete hatch pattern - random dots and short lines."""

    def generate_pattern(
        self,
        bounds: Tuple[float, float, float, float],
        scale: float = 1.0,
        angle: float = 45.0,
    ) -> List[Tuple[Tuple[float, float], Tuple[float, float]]]:
        min_x, min_y, max_x, max_y = bounds
        width = max_x - min_x
        height = max_y - min_y
        lines = []

        # Base diagonal lines
        spacing = 15 * scale
        angle_rad = np.radians(angle)

        # Generate parallel lines
        for offset in np.arange(-height, width, spacing):
            x1 = min_x + offset * np.cos(angle_rad)
            y1 = min_y + offset * np.sin(angle_rad)
            x2 = x1 + width * np.cos(angle_rad) - height * np.sin(angle_rad)
            y2 = y1 + width * np.sin(angle_rad) + height * np.cos(angle_rad)
            lines.append(((x1, y1), (x2, y2)))

        # Add cross hatching at wider spacing
        cross_spacing = 30 * scale
        angle_rad = np.radians(angle + 90)

        for offset in np.arange(-height, width, cross_spacing):
            x1 = min_x + offset * np.cos(angle_rad)
            y1 = min_y + offset * np.sin(angle_rad)
            x2 = x1 + width * np.cos(angle_rad) - height * np.sin(angle_rad)
            y2 = y1 + width * np.sin(angle_rad) + height * np.cos(angle_rad)
            lines.append(((x1, y1), (x2, y2)))

        return lines


class SteelHatch(HatchPatternGenerator):
    """Steel hatch pattern - close parallel lines."""

    def generate_pattern(
        self,
        bounds: Tuple[float, float, float, float],
        scale: float = 1.0,
        angle: float = 45.0,
    ) -> List[Tuple[Tuple[float, float], Tuple[float, float]]]:
        min_x, min_y, max_x, max_y = bounds
        width = max_x - min_x
        height = max_y - min_y
        lines = []

        spacing = 5 * scale  # Close spacing for steel
        angle_rad = np.radians(angle)

        for offset in np.arange(-height, width, spacing):
            x1 = min_x + offset * np.cos(angle_rad)
            y1 = min_y + offset * np.sin(angle_rad)
            x2 = x1 + width * np.cos(angle_rad) - height * np.sin(angle_rad)
            y2 = y1 + width * np.sin(angle_rad) + height * np.cos(angle_rad)
            lines.append(((x1, y1), (x2, y2)))

        return lines


class WoodHatch(HatchPatternGenerator):
    """Wood grain hatch pattern - wavy lines."""

    def generate_pattern(
        self,
        bounds: Tuple[float, float, float, float],
        scale: float = 1.0,
        angle: float = 45.0,
    ) -> List[Tuple[Tuple[float, float], Tuple[float, float]]]:
        min_x, min_y, max_x, max_y = bounds
        width = max_x - min_x
        height = max_y - min_y
        lines = []

        spacing = 12 * scale
        amplitude = 3 * scale
        frequency = 0.1

        angle_rad = np.radians(angle)

        for offset in np.arange(0, height, spacing):
            points = []
            for i in range(int(width * 2) + 1):
                x = min_x + i * 0.5
                y = min_y + offset + amplitude * np.sin(frequency * i)
                # Rotate to angle
                rx = (
                    (x - min_x) * np.cos(angle_rad)
                    - (y - min_y) * np.sin(angle_rad)
                    + min_x
                )
                ry = (
                    (x - min_x) * np.sin(angle_rad)
                    + (y - min_y) * np.cos(angle_rad)
                    + min_y
                )
                points.append((rx, ry))

            # Create line segments from points
            for j in range(len(points) - 1):
                if min_x <= points[j][0] <= max_x and min_y <= points[j][1] <= max_y:
                    lines.append((points[j], points[j + 1]))

        return lines


class DiagonalHatch(HatchPatternGenerator):
    """Simple diagonal hatching."""

    def generate_pattern(
        self,
        bounds: Tuple[float, float, float, float],
        scale: float = 1.0,
        angle: float = 45.0,
    ) -> List[Tuple[Tuple[float, float], Tuple[float, float]]]:
        min_x, min_y, max_x, max_y = bounds
        width = max_x - min_x
        height = max_y - min_y
        lines = []

        spacing = 10 * scale
        angle_rad = np.radians(angle)

        # One direction
        for offset in np.arange(-height, width, spacing):
            x1 = min_x + offset * np.cos(angle_rad)
            y1 = min_y + offset * np.sin(angle_rad)
            x2 = x1 + width * np.cos(angle_rad) - height * np.sin(angle_rad)
            y2 = y1 + width * np.sin(angle_rad) + height * np.cos(angle_rad)
            lines.append(((x1, y1), (x2, y2)))

        return lines


class CrossHatch(HatchPatternGenerator):
    """Cross hatching at 45 and 135 degrees."""

    def generate_pattern(
        self,
        bounds: Tuple[float, float, float, float],
        scale: float = 1.0,
        angle: float = 45.0,
    ) -> List[Tuple[Tuple[float, float], Tuple[float, float]]]:
        min_x, min_y, max_x, max_y = bounds
        width = max_x - min_x
        height = max_y - min_y
        lines = []

        spacing = 10 * scale

        # 45 degree
        angle_rad = np.radians(angle)
        for offset in np.arange(-height, width, spacing):
            x1 = min_x + offset * np.cos(angle_rad)
            y1 = min_y + offset * np.sin(angle_rad)
            x2 = x1 + width * np.cos(angle_rad) - height * np.sin(angle_rad)
            y2 = y1 + width * np.sin(angle_rad) + height * np.cos(angle_rad)
            lines.append(((x1, y1), (x2, y2)))

        # 135 degree
        angle_rad = np.radians(angle + 90)
        for offset in np.arange(-width, height, spacing):
            x1 = min_x + offset * np.cos(angle_rad)
            y1 = min_y + offset * np.sin(angle_rad)
            x2 = x1 + width * np.cos(angle_rad) - height * np.sin(angle_rad)
            y2 = y1 + width * np.sin(angle_rad) + height * np.cos(angle_rad)
            lines.append(((x1, y1), (x2, y2)))

        return lines


class HatchPatternFactory:
    """Factory for creating hatch patterns."""

    _patterns: Dict[HatchPattern, type] = {
        HatchPattern.CONCRETE: ConcreteHatch,
        HatchPattern.STEEL: SteelHatch,
        HatchPattern.WOOD: WoodHatch,
        HatchPattern.DIAGONAL: DiagonalHatch,
        HatchPattern.CROSSHATCH: CrossHatch,
    }

    @classmethod
    def create_pattern(cls, pattern_type: HatchPattern) -> HatchPatternGenerator:
        """Create hatch pattern generator instance."""
        pattern_class = cls._patterns.get(pattern_type)
        if pattern_class is None:
            raise ValueError(f"Unknown hatch pattern: {pattern_type}")
        return pattern_class()


class PlanViewGenerator:
    """
    Generates top-down plan views from BIM models.

    Creates orthographic projections showing cut geometry at a
    specified height level, with proper hatching and annotations.

    Attributes:
        cut_level: Height at which to cut for plan view (meters)
        hatch_patterns: Dictionary of material -> hatch pattern
    """

    def __init__(self, cut_level: float = 1.2, hidden_line_removal: bool = True):
        """
        Initialize plan view generator.

        Args:
            cut_level: Height for cut plane (meters above floor)
            hidden_line_removal: Enable occlusion detection
        """
        self.cut_level = cut_level
        self.hidden_line_removal = hidden_line_removal

        # Create projection looking down
        self.projection = OrthographicProjection(
            view_direction=(0, 0, -1),
            up_vector=(0, 1, 0),
            hidden_line_removal=hidden_line_removal,
        )

        # Configure hatch patterns
        self._init_hatch_patterns()

    def _init_hatch_patterns(self):
        """Initialize hatch pattern mappings."""
        self.hatch_patterns = {
            "concrete": HatchPattern.CONCRETE,
            "steel": HatchPattern.STEEL,
            "wood": HatchPattern.WOOD,
            "masonry": HatchPattern.MASONRY,
            "glass": HatchPattern.GLASS,
            "brick": HatchPattern.BRICK,
            "insulation": HatchPattern.INSULATION,
        }

        self.pattern_generators: Dict[HatchPattern, HatchPatternGenerator] = {}
        for pattern_type in HatchPattern:
            self.pattern_generators[pattern_type] = HatchPatternFactory.create_pattern(
                pattern_type
            )

    def generate(self, model, cut_level: Optional[float] = None) -> PlanViewResult:
        """
        Generate plan view from BIM model.

        Args:
            model: BIM model containing elements
            cut_level: Override cut level (uses default if None)

        Returns:
            PlanViewResult with projected geometry and annotations
        """
        if cut_level is not None:
            self.cut_level = cut_level

        # Extract geometry from model
        # This is a placeholder - actual implementation would query model

        # Get walls at cut level
        walls = self._get_walls_at_level(model, self.cut_level)

        # Get doors and windows
        doors = self._get_doors(model)
        windows = self._get_windows(model)

        # Get furniture
        furniture = self._get_furniture(model)

        # Get room boundaries
        rooms = self._get_rooms(model)

        # Compute cut surfaces for walls
        cut_surfaces = self._compute_cut_surfaces(walls)

        # Compute openings
        openings = self._compute_openings(walls, doors, windows)

        # Get overall projection
        # This would extract actual geometry from model

        # Create placeholder projection result
        projection_result = ProjectionResult(
            vertices=[],
            edges=[],
            faces=[],
            view_direction=(0, 0, -1),
            up_vector=(0, 1, 0),
            bounding_box=(0, 0, 0, 0),
        )

        return PlanViewResult(
            projection=projection_result,
            cut_surfaces=cut_surfaces,
            openings=openings,
            walls=walls,
            doors=doors,
            windows=windows,
            furniture=furniture,
            dimensions=self._compute_room_dimensions(rooms),
            cut_level=self.cut_level,
        )

    def _get_walls_at_level(self, model, level: float) -> List[Dict[str, Any]]:
        """Extract walls that intersect cut level."""
        # Placeholder - actual implementation would query model store
        return []

    def _get_doors(self, model) -> List[Dict[str, Any]]:
        """Extract door elements from model."""
        return []

    def _get_windows(self, model) -> List[Dict[str, Any]]:
        """Extract window elements from model."""
        return []

    def _get_furniture(self, model) -> List[Dict[str, Any]]:
        """Extract furniture elements from model."""
        return []

    def _get_rooms(self, model) -> List[Dict[str, Any]]:
        """Extract room boundaries from model."""
        return []

    def _compute_cut_surfaces(self, walls: List[Dict[str, Any]]) -> List[CutSurface]:
        """
        Compute cut surfaces from walls at cut level.

        Args:
            walls: Wall elements from model

        Returns:
            List of cut surfaces with hatching
        """
        cut_surfaces = []

        for wall in walls:
            # Get wall geometry at cut level
            polygon = self._get_wall_polygon_at_level(wall, self.cut_level)
            if not polygon or len(polygon) < 3:
                continue

            # Determine material and hatch pattern
            material = wall.get("material", "concrete")
            pattern_type = self.hatch_patterns.get(
                material.lower(), HatchPattern.DIAGONAL
            )

            # Create cut surface
            bounds = self._get_polygon_bounds(polygon)
            cut_surface = CutSurface(
                polygon=polygon,
                material_type=material,
                hatch_pattern=pattern_type,
                hatch_scale=1.0,
                hatch_angle=45.0,
            )
            cut_surfaces.append(cut_surface)

        return cut_surfaces

    def _get_wall_polygon_at_level(
        self, wall: Dict[str, Any], level: float
    ) -> Optional[List[Tuple[float, float]]]:
        """
        Get wall cross-section polygon at specified level.

        Args:
            wall: Wall element
            level: Cut level height

        Returns:
            Polygon as list of (x, y) points, or None if wall doesn't intersect level
        """
        # Placeholder - would extract actual wall geometry
        return None

    def _compute_openings(
        self,
        walls: List[Dict[str, Any]],
        doors: List[Dict[str, Any]],
        windows: List[Dict[str, Any]],
    ) -> List[Opening]:
        """
        Compute door and window openings.

        Args:
            walls: Wall elements
            doors: Door elements
            windows: Window elements

        Returns:
            List of opening polygons
        """
        openings = []

        for door in doors:
            opening = self._create_door_opening(door)
            if opening:
                openings.append(opening)

        for window in windows:
            opening = self._create_window_opening(window)
            if opening:
                openings.append(opening)

        return openings

    def _create_door_opening(self, door: Dict[str, Any]) -> Optional[Opening]:
        """Create door opening polygon."""
        # Placeholder - would calculate actual opening geometry
        return None

    def _create_window_opening(self, window: Dict[str, Any]) -> Optional[Opening]:
        """Create window opening polygon."""
        # Placeholder - would calculate actual opening geometry
        return None

    def _compute_room_dimensions(
        self, rooms: List[Dict[str, Any]]
    ) -> Dict[str, Tuple[float, float, float, float]]:
        """Compute room boundary dimensions."""
        dimensions = {}
        for room in rooms:
            bounds = self._get_room_bounds(room)
            dimensions[room.get("name", "Room")] = bounds
        return dimensions

    def _get_room_bounds(
        self, room: Dict[str, Any]
    ) -> Tuple[float, float, float, float]:
        """Get room bounding box."""
        return (0, 0, 0, 0)

    def _get_polygon_bounds(
        self, polygon: List[Tuple[float, float]]
    ) -> Tuple[float, float, float, float]:
        """Get bounding box of polygon."""
        if not polygon:
            return (0, 0, 0, 0)

        xs = [p[0] for p in polygon]
        ys = [p[1] for p in polygon]
        return (min(xs), min(ys), max(xs), max(ys))

    def apply_hatching(
        self, cut_surface: CutSurface
    ) -> List[Tuple[Tuple[float, float], Tuple[float, float]]]:
        """
        Generate hatching lines for a cut surface.

        Args:
            cut_surface: Surface to hatch

        Returns:
            List of hatching line segments
        """
        pattern_gen = self.pattern_generators.get(cut_surface.hatch_pattern)
        if pattern_gen is None:
            return []

        bounds = self._get_polygon_bounds(cut_surface.polygon)
        return pattern_gen.generate_pattern(
            bounds=bounds, scale=cut_surface.hatch_scale, angle=cut_surface.hatch_angle
        )

    def add_room_labels(self, result: PlanViewResult) -> List[Dict[str, Any]]:
        """
        Add room name and area labels.

        Args:
            result: Plan view generation result

        Returns:
            List of text labels to render
        """
        labels = []

        for room_name, bounds in result.dimensions.items():
            center_x = (bounds[0] + bounds[2]) / 2
            center_y = (bounds[1] + bounds[3]) / 2

            # Calculate area (placeholder)
            area = (bounds[2] - bounds[0]) * (bounds[3] - bounds[1])

            labels.append(
                {
                    "type": "room_label",
                    "text": room_name,
                    "position": (center_x, center_y),
                    "font_size": 3.5,
                    "layer": "annotations",
                }
            )

            labels.append(
                {
                    "type": "area_label",
                    "text": f"{area:.1f} m²",
                    "position": (center_x, center_y - 2),
                    "font_size": 2.5,
                    "layer": "annotations",
                }
            )

        return labels

    def generate_multi_level(
        self, model, levels: List[float]
    ) -> Dict[float, PlanViewResult]:
        """
        Generate plan views for multiple floor levels.

        Args:
            model: BIM model
            levels: List of cut levels (heights)

        Returns:
            Dictionary mapping level to PlanViewResult
        """
        results = {}
        for level in levels:
            results[level] = self.generate(model, cut_level=level)
        return results


# Export public classes
__all__ = [
    "PlanViewGenerator",
    "PlanViewResult",
    "CutSurface",
    "Opening",
    "HatchPattern",
    "HatchPatternGenerator",
    "ConcreteHatch",
    "SteelHatch",
    "WoodHatch",
    "DiagonalHatch",
    "CrossHatch",
]
