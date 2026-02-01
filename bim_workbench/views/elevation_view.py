"""
Elevation View Generator for 2D Architectural Drawings

Generates orthographic elevation views from BIM models showing
external faces visible from specified cardinal directions.

Author: BIM Workbench
Version: 0.1.0
"""

from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Dict, Any, Set
from enum import Enum

import numpy as np

from .projection import (
    OrthographicProjection,
    ProjectionResult,
    ProjectedVertex,
    ProjectedEdge,
    ProjectedFace,
)
from .section_view import (
    SectionViewGenerator,
    SectionViewResult,
)


class CardinalDirection(Enum):
    """Cardinal directions for elevation views."""

    NORTH = "north"  # View from +Y direction
    SOUTH = "south"  # View from -Y direction
    EAST = "east"  # View from +X direction
    WEST = "west"  # View from -X direction


@dataclass
class ElevationElement:
    """An element visible in elevation view."""

    element_id: str
    element_type: str  # wall, window, door, column, etc.
    outline: List[Tuple[float, float]]  # 2D outline projection
    height_range: Tuple[float, float]  # min_z, max_z
    visible: bool = True
    exterior: bool = True  # True if exterior face
    material: str = "concrete"


@dataclass
class ElevationViewResult:
    """Complete result of elevation view generation."""

    projection: ProjectionResult
    elements: List[ElevationElement]
    direction: CardinalDirection
    ground_line: float  # Y-position of ground line
    total_height: float  # Total view height
    width: float  # View width
    scale: float = 1.0
    direction_indicator: Optional[Dict[str, Any]] = None


class VisibilityAnalyzer:
    """
    Analyzes face visibility from a given view direction.

    Determines which faces of 3D geometry are visible (front-facing)
    and classifies them as exterior or interior.
    """

    def __init__(self, view_direction: Tuple[float, float, float]):
        """
        Initialize analyzer with view direction.

        Args:
            view_direction: (x, y, z) direction vector pointing toward viewer
        """
        self.view_direction = np.array(view_direction, dtype=np.float64)
        norm = np.linalg.norm(self.view_direction)
        if norm > 0:
            self.view_direction = self.view_direction / norm

    def is_visible(self, face_normal: Tuple[float, float, float]) -> bool:
        """
        Determine if a face is visible from view direction.

        Args:
            face_normal: Face normal vector

        Returns:
            True if face is front-facing (visible)
        """
        normal = np.array(face_normal, dtype=np.float64)
        norm = np.linalg.norm(normal)
        if norm > 0:
            normal = normal / norm

        # Face is visible if normal points toward viewer
        dot = np.dot(normal, self.view_direction)
        return dot > 1e-10  # Small tolerance for near-parallel faces

    def is_exterior(
        self,
        face_normal: Tuple[float, float, float],
        view_direction: Tuple[float, float, float],
    ) -> bool:
        """
        Classify face as exterior or interior.

        Exterior faces have normals that point away from building center,
        interior faces point inward.

        Args:
            face_normal: Face normal vector
            view_direction: View direction vector

        Returns:
            True if face is exterior
        """
        # Exterior faces are visible faces that are not occluded
        # This is a simplified check - real implementation would
        # compare against building bounding box or center point
        return self.is_visible(face_normal)

    def get_visible_faces(
        self,
        vertices: np.ndarray,
        faces: List[List[int]],
        normals: List[Tuple[float, float, float]],
    ) -> List[int]:
        """
        Get indices of visible faces.

        Args:
            vertices: Mesh vertices
            faces: Face definitions
            normals: Pre-computed face normals

        Returns:
            List of visible face indices
        """
        visible = []
        for i, normal in enumerate(normals):
            if self.is_visible(normal):
                visible.append(i)
        return visible

    def filter_exterior_faces(
        self,
        faces: List[List[int]],
        normals: List[Tuple[float, float, float]],
        vertices: np.ndarray,
        building_center: np.ndarray,
    ) -> List[int]:
        """
        Filter faces to only exterior ones.

        Args:
            faces: Face definitions
            normals: Face normals
            vertices: Mesh vertices
            building_center: Center point of building

        Returns:
            List of exterior face indices
        """
        exterior = []

        for i, (face, normal) in enumerate(zip(faces, normals)):
            if not self.is_visible(normal):
                continue

            # Check if face points outward from building center
            face_center = np.mean(vertices[face], axis=0)
            to_face = face_center - building_center
            to_face = to_face / np.linalg.norm(to_face)

            # If face normal and vector to face are aligned, it's exterior
            alignment = np.dot(normal, to_face)
            if alignment > 0:
                exterior.append(i)

        return exterior


class ElevationViewGenerator:
    """
    Generates orthographic elevation views from BIM models.

    Creates side projections without cutting, showing only external
    faces visible from specified cardinal directions.

    Attributes:
        direction: Current viewing direction
        ground_level: Ground line elevation
        max_height: Maximum building height to include
    """

    def __init__(
        self,
        direction: CardinalDirection = CardinalDirection.NORTH,
        ground_level: float = 0.0,
        max_height: float = 10.0,
        hidden_line_removal: bool = True,
    ):
        """
        Initialize elevation view generator.

        Args:
            direction: Cardinal viewing direction
            ground_level: Ground line elevation
            max_height: Maximum height to include in view
            hidden_line_removal: Enable occlusion detection
        """
        self.direction = direction
        self.ground_level = ground_level
        self.max_height = max_height
        self.hidden_line_removal = hidden_line_removal

        # Create projection
        self._init_projection()

    def _init_projection(self):
        """Initialize orthographic projection for current direction."""
        direction_map = {
            CardinalDirection.NORTH: (0, -1, 0),  # View from +Y
            CardinalDirection.SOUTH: (0, 1, 0),  # View from -Y
            CardinalDirection.EAST: (-1, 0, 0),  # View from +X
            CardinalDirection.WEST: (1, 0, 0),  # View from -X
        }

        view_dir = direction_map.get(self.direction, (0, -1, 0))

        self.projection = OrthographicProjection(
            view_direction=view_dir,
            up_vector=(0, 0, 1),  # Z is up in elevation views
            hidden_line_removal=self.hidden_line_removal,
        )

        self.view_direction = view_dir

    def set_direction(self, direction: CardinalDirection):
        """
        Set the viewing direction.

        Args:
            direction: New cardinal direction
        """
        self.direction = direction
        self._init_projection()

    def generate(
        self, model, direction: Optional[CardinalDirection] = None
    ) -> ElevationViewResult:
        """
        Generate elevation view from BIM model.

        Args:
            model: BIM model with elements
            direction: Override viewing direction

        Returns:
            ElevationViewResult with projected geometry
        """
        if direction is not None:
            self.set_direction(direction)

        # Get building center for exterior face classification
        building_center = self._get_building_center(model)

        # Get model elements
        walls = self._get_walls(model)
        windows = self._get_windows(model)
        doors = self._get_doors(model)
        columns = self._get_columns(model)
        roofs = self._get_roofs(model)

        # Create visibility analyzer
        analyzer = VisibilityAnalyzer(self.view_direction)

        # Process elements
        elements = []

        # Process walls
        for wall in walls:
            elem = self._create_elevation_element(
                wall, "wall", analyzer, building_center
            )
            if elem:
                elements.append(elem)

        # Process windows
        for window in windows:
            elem = self._create_elevation_element(
                window, "window", analyzer, building_center
            )
            if elem:
                elements.append(elem)

        # Process doors
        for door in doors:
            elem = self._create_elevation_element(
                door, "door", analyzer, building_center
            )
            if elem:
                elements.append(elem)

        # Process columns
        for column in columns:
            elem = self._create_elevation_element(
                column, "column", analyzer, building_center
            )
            if elem:
                elements.append(elem)

        # Process roofs
        for roof in roofs:
            elem = self._create_elevation_element(
                roof, "roof", analyzer, building_center
            )
            if elem:
                elements.append(elem)

        # Compute view bounds
        view_bounds = self._compute_view_bounds(elements)

        # Create direction indicator
        direction_indicator = self._create_direction_indicator()

        # Create projection result placeholder
        projection_result = ProjectionResult(
            vertices=[],
            edges=[],
            faces=[],
            view_direction=self.view_direction,
            up_vector=(0, 0, 1),
            bounding_box=view_bounds,
        )

        total_height = self.max_height - self.ground_level
        width = view_bounds[2] - view_bounds[0]

        return ElevationViewResult(
            projection=projection_result,
            elements=elements,
            direction=self.direction,
            ground_line=0.0,  # Relative to view
            total_height=total_height,
            width=width,
            scale=1.0,
            direction_indicator=direction_indicator,
        )

    def _get_building_center(self, model) -> np.ndarray:
        """Get center point of building for exterior face detection."""
        # Placeholder - would compute actual building center
        return np.array([0, 0, 0], dtype=np.float64)

    def _get_walls(self, model) -> List[Dict[str, Any]]:
        """Extract wall elements from model."""
        return []

    def _get_windows(self, model) -> List[Dict[str, Any]]:
        """Extract window elements from model."""
        return []

    def _get_doors(self, model) -> List[Dict[str, Any]]:
        """Extract door elements from model."""
        return []

    def _get_columns(self, model) -> List[Dict[str, Any]]:
        """Extract column elements from model."""
        return []

    def _get_roofs(self, model) -> List[Dict[str, Any]]:
        """Extract roof elements from model."""
        return []

    def _create_elevation_element(
        self,
        element: Dict[str, Any],
        element_type: str,
        analyzer: VisibilityAnalyzer,
        building_center: np.ndarray,
    ) -> Optional[ElevationElement]:
        """
        Create ElevationElement from model element.

        Args:
            element: Model element data
            element_type: Type classification
            analyzer: Visibility analyzer
            building_center: Building center point

        Returns:
            ElevationElement or None if not visible
        """
        # Placeholder - would extract actual geometry
        return None

    def _compute_view_bounds(
        self, elements: List[ElevationElement]
    ) -> Tuple[float, float, float, float]:
        """Compute view bounding box from elements."""
        if not elements:
            return (0, 0, 10, self.max_height)

        xs = []
        zs = []

        for elem in elements:
            for point in elem.outline:
                xs.append(point[0])
                if len(point) > 1:
                    zs.append(point[1])

        if not xs:
            return (0, 0, 10, self.max_height)

        min_x = min(xs)
        max_x = max(xs)
        min_z = self.ground_level
        max_z = self.max_height

        return (min_x, min_z, max_x, max_z)

    def _create_direction_indicator(self) -> Dict[str, Any]:
        """Create direction indicator (north arrow or label)."""
        direction_names = {
            CardinalDirection.NORTH: "NORTH",
            CardinalDirection.SOUTH: "SOUTH",
            CardinalDirection.EAST: "EAST",
            CardinalDirection.WEST: "WEST",
        }

        return {
            "type": "direction_label",
            "text": f"{direction_names.get(self.direction, 'NORTH')} ELEVATION",
            "position": (0, 0),
            "font_size": 5.0,
            "layer": "annotations",
        }

    def add_dimension_lines(self, result: ElevationViewResult) -> List[Dict[str, Any]]:
        """
        Add elevation dimension lines.

        Args:
            result: Elevation view result

        Returns:
            List of dimension line definitions
        """
        dimensions = []

        # Add height dimensions
        ground_z = result.ground_line
        top_z = result.total_height

        # Floor-to-floor dimensions
        floor_heights = [0, 3, 6, 9]  # Example floor elevations
        for i in range(len(floor_heights) - 1):
            h1 = floor_heights[i]
            h2 = floor_heights[i + 1]

            if h1 >= ground_z and h2 <= top_z:
                dimensions.append(
                    {
                        "type": "elevation_dimension",
                        "start": (result.width + 1, h1),
                        "end": (result.width + 1, h2),
                        "label": f"{h2 - h1:.2f}m",
                        "layer": "dimensions",
                    }
                )

        # Overall height
        dimensions.append(
            {
                "type": "elevation_dimension",
                "start": (result.width + 2, ground_z),
                "end": (result.width + 2, top_z),
                "label": f"{top_z - ground_z:.2f}m",
                "layer": "dimensions",
            }
        )

        return dimensions

    def add_level_markers(
        self, result: ElevationViewResult, levels: List[Tuple[str, float]]
    ) -> List[Dict[str, Any]]:
        """
        Add floor/level markers with names and elevations.

        Args:
            result: Elevation view result
            levels: List of (name, elevation) tuples

        Returns:
            List of level marker definitions
        """
        markers = []

        for name, elevation in levels:
            if elevation < result.ground_line or elevation > result.total_height:
                continue

            markers.append(
                {
                    "type": "level_marker",
                    "text": f"{name} {elevation:.2f}",
                    "position": (result.width + 0.5, elevation),
                    "font_size": 2.5,
                    "layer": "annotations",
                }
            )

        return markers

    def add_grid_lines(
        self, result: ElevationViewResult, spacing: float = 3.0
    ) -> List[Dict[str, Any]]:
        """
        Add horizontal grid lines at specified intervals.

        Args:
            result: Elevation view result
            spacing: Vertical spacing between grid lines

        Returns:
            List of grid line definitions
        """
        grid_lines = []

        ground = result.ground_line
        top = result.total_height

        z = ground + spacing
        while z < top:
            grid_lines.append(
                {
                    "type": "grid_line",
                    "start": (0, z),
                    "end": (result.width, z),
                    "layer": "grid",
                }
            )
            z += spacing

        return grid_lines


def generate_elevation(
    model, direction: str = "north", ground_level: float = 0.0, max_height: float = 10.0
) -> ElevationViewResult:
    """
    Convenience function to generate elevation view.

    Args:
        model: BIM model
        direction: Cardinal direction (north, south, east, west)
        ground_level: Ground line elevation
        max_height: Maximum view height

    Returns:
        ElevationViewResult
    """
    direction_map = {
        "north": CardinalDirection.NORTH,
        "south": CardinalDirection.SOUTH,
        "east": CardinalDirection.EAST,
        "west": CardinalDirection.WEST,
    }

    card_dir = direction_map.get(direction.lower(), CardinalDirection.NORTH)

    generator = ElevationViewGenerator(
        direction=card_dir, ground_level=ground_level, max_height=max_height
    )

    return generator.generate(model)


# Export public classes
__all__ = [
    "ElevationViewGenerator",
    "ElevationViewResult",
    "ElevationElement",
    "CardinalDirection",
    "VisibilityAnalyzer",
    "generate_elevation",
]
