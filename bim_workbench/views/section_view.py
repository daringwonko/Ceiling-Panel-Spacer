"""
Section View Generator for 2D Architectural Drawings

Generates vertical section views from BIM models using section planes,
showing cut geometry with hatching and annotation transfer.

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
from .plan_view import (
    HatchPattern,
    PlanViewResult,
    CutSurface,
    HatchPatternGenerator,
    ConcreteHatch,
    SteelHatch,
    DiagonalHatch,
)


@dataclass
class SectionPlane:
    """Defines a section cutting plane."""

    origin: Tuple[float, float, float]  # Point on plane
    normal: Tuple[float, float, float]  # Normal vector pointing "above" plane
    up_vector: Tuple[float, float, float] = (0, 0, 1)  # View up direction

    def get_normal(self) -> Tuple[float, float, float]:
        """Get normalized normal vector."""
        normal = np.array(self.normal, dtype=np.float64)
        norm = np.linalg.norm(normal)
        if norm > 0:
            normal = normal / norm
        return tuple(normal.tolist())

    def get_origin(self) -> np.ndarray:
        """Get origin as numpy array."""
        return np.array(self.origin, dtype=np.float64)


@dataclass
class SectionElement:
    """Element resulting from section cut."""

    element_id: str
    element_type: str  # wall, floor, column, beam, etc.
    cut_polygon: List[Tuple[float, float]]  # Cross-section outline
    projected_geometry: List[Tuple[Tuple[float, float], Tuple[float, float]]]  # Edges
    visible_faces: List[List[Tuple[float, float]]]  # Visible exterior faces
    cut_surface: Optional[CutSurface] = None
    material: str = "concrete"
    elevation_range: Tuple[float, float] = (0, 0)  # min_z, max_z


@dataclass
class SectionViewResult:
    """Complete result of section view generation."""

    projection: ProjectionResult
    cut_elements: List[SectionElement]
    annotations: List[Dict[str, Any]]  # Transferred 3D annotations
    dimension_lines: List[Dict[str, Any]]  # Section dimensions
    elevation_reference: float  # Floor elevation
    section_height: float  # Total section height shown
    scale: float = 1.0


class SectionMeshSlicer:
    """
    Mesh slicing engine for section plane operations.

    Intersects 3D mesh geometry with section plane to produce
    proper cross-sections and visible edges.
    """

    def __init__(self, section_plane: SectionPlane):
        """
        Initialize slicer with section plane.

        Args:
            section_plane: Cutting plane definition
        """
        self.section_plane = section_plane
        self.plane_normal = np.array(section_plane.get_normal(), dtype=np.float64)
        self.plane_origin = section_plane.get_origin()

    def slice_mesh(
        self, vertices: np.ndarray, faces: List[List[int]]
    ) -> Tuple[np.ndarray, List[List[int]], List[Tuple[int, int]]]:
        """
        Slice mesh geometry with section plane.

        Args:
            vertices: Mesh vertices (N, 3)
            faces: Face definitions as vertex indices

        Returns:
            Tuple of (cut_vertices, cut_faces, new_edges)
        """
        # Compute signed distance of each vertex to plane
        relative_vertices = vertices - self.plane_origin
        distances = np.dot(relative_vertices, self.plane_normal)

        # Classify vertices
        front_mask = distances > 1e-10  # Above plane (visible)
        back_mask = distances < -1e-10  # Below plane (cut away)
        on_plane_mask = np.abs(distances) <= 1e-10  # On plane

        # For each face, determine how it intersects plane
        cut_faces = []
        cut_edges = []

        for face in faces:
            face_distances = distances[face]
            num_front = np.sum(face_distances > 1e-10)
            num_back = np.sum(face_distances < -1e-10)
            num_on = np.sum(np.abs(face_distances) <= 1e-10)

            if num_on >= 3:
                # Entire face is on plane - include as cut face
                cut_faces.append(face)
            elif num_on == 2:
                # Edge is on plane
                on_idx = np.where(np.abs(face_distances) <= 1e-10)[0]
                cut_edges.append((face[on_idx[0]], face[on_idx[1]]))
            elif num_on == 1 and (num_front >= 1 and num_back >= 1):
                # One vertex on plane, one above, one below
                # This is a transition case
                on_idx = np.where(np.abs(face_distances) <= 1e-10)[0]
                front_idx = np.where(face_distances > 1e-10)[0]
                back_idx = np.where(face_distances < -1e-10)[0]

                if len(front_idx) > 0 and len(back_idx) > 0:
                    cut_edges.append((face[on_idx[0]], face[front_idx[0]]))
                    cut_edges.append((face[on_idx[0]], face[back_idx[0]]))
            elif num_front >= 2 and num_back >= 1:
                # Face crosses plane - creates new edge
                front_idx = np.where(face_distances > 1e-10)[0]
                back_idx = np.where(face_distances < -1e-10)[0]

                # Compute intersection points
                v1 = vertices[face[front_idx[0]]]
                v2 = vertices[face[back_idx[0]]]
                v3 = vertices[face[back_idx[1]]]

                # Add intersection edge (this is a simplified approach)
                cut_edges.append((face[front_idx[0]], face[back_idx[0]]))
            elif num_back >= 2 and num_front >= 1:
                # Face crosses plane (other orientation)
                back_idx = np.where(face_distances < -1e-10)[0]
                front_idx = np.where(face_distances > 1e-10)[0]

                cut_edges.append((face[front_idx[0]], face[back_idx[0]]))

        # Return original geometry - proper slicing requires
        # more sophisticated mesh processing libraries
        return vertices, faces, cut_edges

    def compute_cut_polygon(
        self, vertices: np.ndarray, faces: List[List[int]]
    ) -> List[Tuple[float, float]]:
        """
        Compute cross-section polygon from mesh intersection.

        Args:
            vertices: Mesh vertices
            faces: Face definitions

        Returns:
            2D polygon representing cross-section
        """
        # Placeholder - would compute proper intersection polygon
        # using mesh slicing algorithm
        return []

    def compute_visible_exterior(
        self, vertices: np.ndarray, faces: List[List[int]], view_direction: np.ndarray
    ) -> List[List[Tuple[float, float]]]:
        """
        Compute visible exterior faces from view direction.

        Args:
            vertices: Mesh vertices
            faces: Face definitions
            view_direction: View direction vector

        Returns:
            List of visible face outlines as 2D polygons
        """
        visible_faces = []

        for face in faces:
            if len(face) < 3:
                continue

            # Compute face normal
            v0 = vertices[face[0]]
            v1 = vertices[face[1]]
            v2 = vertices[face[2]]

            edge1 = v1 - v0
            edge2 = v2 - v0
            normal = np.cross(edge1, edge2)

            if np.linalg.norm(normal) > 0:
                normal = normal / np.linalg.norm(normal)

            # Check if face is front-facing
            if np.dot(normal, view_direction) > 0:
                # Project face vertices to 2D
                polygon = [(vertices[i][0], vertices[i][2]) for i in face]
                visible_faces.append(polygon)

        return visible_faces


class SectionViewGenerator:
    """
    Generates vertical section views from BIM models.

    Uses section planes to cut through 3D geometry and create
    2D drawings showing interior structure with hatching.

    Attributes:
        section_plane: Current section plane definition
        hatch_patterns: Material to hatch pattern mapping
    """

    def __init__(
        self,
        section_plane: Optional[SectionPlane] = None,
        hidden_line_removal: bool = True,
    ):
        """
        Initialize section view generator.

        Args:
            section_plane: Optional initial section plane
            hidden_line_removal: Enable occlusion detection
        """
        self.section_plane = section_plane
        self.hidden_line_removal = hidden_line_removal

        # Initialize hatch patterns
        self._init_hatch_patterns()

    def _init_hatch_patterns(self):
        """Initialize hatch pattern mappings."""
        self.hatch_patterns = {
            "concrete": HatchPattern.CONCRETE,
            "steel": HatchPattern.STEEL,
            "wood": HatchPattern.WOOD,
            "masonry": HatchPattern.MASONRY,
            "brick": HatchPattern.BRICK,
            "glass": HatchPattern.GLASS,
        }

        self.pattern_generators = {
            HatchPattern.CONCRETE: ConcreteHatch(),
            HatchPattern.STEEL: SteelHatch(),
            HatchPattern.DIAGONAL: DiagonalHatch(),
        }

    def set_section_plane(
        self,
        origin: Tuple[float, float, float],
        normal: Tuple[float, float, float],
        up_vector: Tuple[float, float, float] = (0, 0, 1),
    ):
        """
        Set the section cutting plane.

        Args:
            origin: Point on plane
            normal: Normal vector (points toward viewer)
            up_vector: View up direction
        """
        self.section_plane = SectionPlane(
            origin=origin, normal=normal, up_vector=up_vector
        )

    def generate(
        self, model, section_plane: Optional[SectionPlane] = None
    ) -> SectionViewResult:
        """
        Generate section view from BIM model.

        Args:
            model: BIM model with elements
            section_plane: Override section plane (uses default if None)

        Returns:
            SectionViewResult with cut geometry and annotations
        """
        if section_plane is not None:
            self.section_plane = section_plane

        if self.section_plane is None:
            raise ValueError("Section plane not defined")

        # Create projection from section plane
        view_normal = self.section_plane.get_normal()
        up_vec = self.section_plane.up_vector

        projection = OrthographicProjection(
            view_direction=view_normal,
            up_vector=up_vec,
            hidden_line_removal=self.hidden_line_removal,
        )

        # Slice and project model elements
        cut_elements = self._slice_model_elements(model)

        # Transfer annotations from 3D view
        annotations = self._transfer_annotations(model)

        # Generate dimension lines
        dimension_lines = self._generate_section_dimensions(cut_elements)

        # Create projection result placeholder
        projection_result = ProjectionResult(
            vertices=[],
            edges=[],
            faces=[],
            view_direction=view_normal,
            up_vector=up_vec,
            bounding_box=(0, 0, 0, 0),
        )

        # Determine section height
        elevation_min = (
            min(elem.elevation_range[0] for elem in cut_elements) if cut_elements else 0
        )
        elevation_max = (
            max(elem.elevation_range[1] for elem in cut_elements) if cut_elements else 3
        )

        return SectionViewResult(
            projection=projection_result,
            cut_elements=cut_elements,
            annotations=annotations,
            dimension_lines=dimension_lines,
            elevation_reference=elevation_min,
            section_height=elevation_max - elevation_min,
            scale=1.0,
        )

    def _slice_model_elements(self, model) -> List[SectionElement]:
        """
        Slice all model elements with section plane.

        Args:
            model: BIM model

        Returns:
            List of SectionElement with cut geometry
        """
        elements = []

        # Get model elements by type
        walls = self._get_walls(model)
        floors = self._get_floors(model)
        columns = self._get_columns(model)
        beams = self._get_beams(model)

        # Process each element type
        for wall in walls:
            elem = self._create_section_element(wall, "wall")
            if elem:
                elements.append(elem)

        for floor in floors:
            elem = self._create_section_element(floor, "floor")
            if elem:
                elements.append(elem)

        for column in columns:
            elem = self._create_section_element(column, "column")
            if elem:
                elements.append(elem)

        for beam in beams:
            elem = self._create_section_element(beam, "beam")
            if elem:
                elements.append(elem)

        return elements

    def _get_walls(self, model) -> List[Dict[str, Any]]:
        """Extract wall elements from model."""
        return []

    def _get_floors(self, model) -> List[Dict[str, Any]]:
        """Extract floor elements from model."""
        return []

    def _get_columns(self, model) -> List[Dict[str, Any]]:
        """Extract column elements from model."""
        return []

    def _get_beams(self, model) -> List[Dict[str, Any]]:
        """Extract beam elements from model."""
        return []

    def _create_section_element(
        self, element: Dict[str, Any], element_type: str
    ) -> Optional[SectionElement]:
        """
        Create SectionElement from model element.

        Args:
            element: Model element data
            element_type: Type classification

        Returns:
            SectionElement or None if element doesn't intersect plane
        """
        # Placeholder - would extract actual geometry
        return None

    def _transfer_annotations(self, model) -> List[Dict[str, Any]]:
        """
        Transfer 3D annotations to section view.

        Args:
            model: BIM model with annotations

        Returns:
            List of 2D annotation data
        """
        annotations = []

        # Get 3D annotations
        model_annotations = self._get_annotations(model)

        for annot in model_annotations:
            # Transform 3D position to section view coordinates
            transformed = self._transform_annotation_to_section(annot)
            if transformed:
                annotations.append(transformed)

        return annotations

    def _get_annotations(self, model) -> List[Dict[str, Any]]:
        """Extract annotations from model."""
        return []

    def _transform_annotation_to_section(
        self, annotation: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Transform 3D annotation to section view coordinates.

        Args:
            annotation: 3D annotation data

        Returns:
            Transformed 2D annotation or None if not in view
        """
        return None

    def _generate_section_dimensions(
        self, elements: List[SectionElement]
    ) -> List[Dict[str, Any]]:
        """
        Generate dimension lines for section.

        Args:
            elements: Section elements with geometry

        Returns:
            List of dimension line definitions
        """
        dimensions = []

        # Add elevation dimension
        elevations = set()
        for elem in elements:
            elevations.add(elem.elevation_range[0])
            elevations.add(elem.elevation_range[1])

        sorted_elevations = sorted(elevations)

        for i in range(len(sorted_elevations) - 1):
            dimensions.append(
                {
                    "type": "elevation_dimension",
                    "start": sorted_elevations[i],
                    "end": sorted_elevations[i + 1],
                    "position": (0, 0),
                    "label": f"{sorted_elevations[i + 1] - sorted_elevations[i]:.2f}m",
                }
            )

        return dimensions

    def apply_cut_hatching(
        self, element: SectionElement
    ) -> List[Tuple[Tuple[float, float], Tuple[float, float]]]:
        """
        Generate hatching for cut surface.

        Args:
            element: Section element with cut surface

        Returns:
            List of hatching line segments
        """
        if element.cut_surface is None:
            return []

        pattern = self.hatch_patterns.get(
            element.material.lower(), HatchPattern.CONCRETE
        )

        pattern_gen = self.pattern_generators.get(pattern)
        if pattern_gen is None:
            return []

        polygon = element.cut_polygon
        if len(polygon) < 3:
            return []

        bounds = self._get_polygon_bounds(polygon)
        return pattern_gen.generate_pattern(bounds=bounds, scale=1.0, angle=45)

    def _get_polygon_bounds(
        self, polygon: List[Tuple[float, float]]
    ) -> Tuple[float, float, float, float]:
        """Get bounding box of polygon."""
        if not polygon:
            return (0, 0, 0, 0)

        xs = [p[0] for p in polygon]
        ys = [p[1] for p in polygon]
        return (min(xs), min(ys), max(xs), max(ys))

    def create_elevation_only(
        self, model, direction: str = "south"
    ) -> SectionViewResult:
        """
        Create elevation-style view (no cutting).

        This is useful for creating elevation-like sections that show
        exterior faces without cutting through the building.

        Args:
            model: BIM model
            direction: View direction (north, south, east, west)

        Returns:
            SectionViewResult showing exterior only
        """
        direction_map = {
            "north": (0, -1, 0),
            "south": (0, 1, 0),
            "east": (-1, 0, 0),
            "west": (1, 0, 0),
        }

        normal = direction_map.get(direction.lower(), (0, 1, 0))

        section_plane = SectionPlane(
            origin=(0, 0, 0), normal=normal, up_vector=(0, 0, 1)
        )

        # Generate with slicing disabled (show exterior only)
        result = self.generate(model, section_plane)

        # Filter to show only visible exterior faces
        for elem in result.cut_elements:
            elem.cut_surface = None  # No cut surface in elevation

        return result


# Export public classes
__all__ = [
    "SectionViewGenerator",
    "SectionViewResult",
    "SectionPlane",
    "SectionElement",
    "SectionMeshSlicer",
]
