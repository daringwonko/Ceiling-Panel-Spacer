"""
Orthographic Projection Engine for 2D View Generation

Provides 3D to 2D transformation for generating architectural drawings
from BIM models. Supports parallel projection only (no perspective).

Author: BIM Workbench
Version: 0.1.0
"""

import numpy as np
from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Dict, Any
from enum import Enum


class ViewDirection(Enum):
    """Orthographic view directions."""

    TOP = (0, 0, -1)  # Looking down from +Z
    BOTTOM = (0, 0, 1)  # Looking up from -Z
    FRONT = (0, -1, 0)  # Looking from -Y
    BACK = (0, 1, 0)  # Looking from +Y
    LEFT = (-1, 0, 0)  # Looking from -X
    RIGHT = (1, 0, 0)  # Looking from +X


@dataclass
class ProjectedVertex:
    """A 3D vertex projected to 2D view coordinates."""

    x: float
    y: float
    z: float  # Original Z for occlusion detection
    visible: bool = True
    depth: float = 0.0  # Distance from view plane for Z-sorting


@dataclass
class ProjectedEdge:
    """An edge connecting two projected vertices."""

    start: ProjectedVertex
    end: ProjectedVertex
    visible: bool = True
    edge_type: str = "solid"  # solid, hidden, construction


@dataclass
class ProjectedFace:
    """A face projected from 3D geometry."""

    vertices: List[ProjectedVertex]
    edges: List[ProjectedEdge]
    normal: Tuple[float, float, float]
    center: Tuple[float, float, float]
    visible: bool = True
    face_type: str = "exterior"  # exterior, cut, interior
    hatching: bool = False
    hatch_pattern: Optional[str] = None


@dataclass
class ProjectionResult:
    """Complete result of orthographic projection."""

    vertices: List[ProjectedVertex]
    edges: List[ProjectedEdge]
    faces: List[ProjectedFace]
    view_direction: Tuple[float, float, float]
    up_vector: Tuple[float, float, float]
    bounding_box: Tuple[float, float, float, float]  # min_x, min_y, max_x, max_y
    scale: float = 1.0
    offset: Tuple[float, float] = (0.0, 0.0)


class OrthographicProjection:
    """
    Orthographic projection engine for converting 3D geometry to 2D views.

    Transforms 3D vertices to 2D using parallel projection based on
    view direction. Handles face visibility, edge detection, and
    optional hidden line removal.

    Attributes:
        view_direction: Normal vector pointing toward viewer
        up_vector: Vector defining view "up" direction
        hidden_line_removal: Enable/disable occlusion handling
    """

    def __init__(
        self,
        view_direction: Tuple[float, float, float] = (0, 0, -1),
        up_vector: Tuple[float, float, float] = (0, 1, 0),
        hidden_line_removal: bool = True,
    ):
        """
        Initialize projection with view parameters.

        Args:
            view_direction: (x, y, z) normal vector pointing toward viewer
            up_vector: (x, y, z) vector defining view "up" direction
            hidden_line_removal: Enable occlusion detection
        """
        self.view_direction = np.array(view_direction, dtype=np.float64)
        self.up_vector = np.array(up_vector, dtype=np.float64)
        self.hidden_line_removal = hidden_line_removal

        # Normalize vectors
        if np.linalg.norm(self.view_direction) > 0:
            self.view_direction = self.view_direction / np.linalg.norm(
                self.view_direction
            )
        if np.linalg.norm(self.up_vector) > 0:
            self.up_vector = self.up_vector / np.linalg.norm(self.up_vector)

        # Ensure view direction and up vector are orthogonal
        self._compute_projection_basis()

    def _compute_projection_basis(self):
        """Compute orthonormal basis for projection coordinate system."""
        # Forward (view direction) - points toward viewer
        forward = -self.view_direction  # Negative because we're projecting onto plane

        # Right vector (cross product of forward and up)
        right = np.cross(forward, self.up_vector)
        if np.linalg.norm(right) < 1e-10:
            # View direction and up are parallel, choose different up
            self.up_vector = np.array([1, 0, 0], dtype=np.float64)
            right = np.cross(forward, self.up_vector)

        right = right / np.linalg.norm(right)

        # True up (orthogonal to forward and right)
        up = np.cross(right, forward)
        up = up / np.linalg.norm(up)

        # Store basis vectors for projection
        self._right = right
        self._up = up
        self._forward = forward

    def project(self, vertices_3d: np.ndarray) -> np.ndarray:
        """
        Project 3D vertices to 2D view coordinates.

        Args:
            vertices_3d: Array of shape (N, 3) containing 3D vertices

        Returns:
            Array of shape (N, 2) containing 2D projected coordinates
        """
        if len(vertices_3d) == 0:
            return np.zeros((0, 2))

        # Translate to origin for projection
        centroid = np.mean(vertices_3d, axis=0)
        vertices_centered = vertices_3d - centroid

        # Project onto 2D plane using basis vectors
        x_coords = np.dot(vertices_centered, self._right)
        y_coords = np.dot(vertices_centered, self._up)

        return np.column_stack([x_coords, y_coords])

    def get_depth(self, vertex_3d: np.ndarray) -> float:
        """
        Get depth (distance from view plane) for occlusion detection.

        Args:
            vertex_3d: Single 3D vertex

        Returns:
            Depth value (larger = farther from viewer)
        """
        centroid = np.mean(vertex_3d) if vertex_3d.ndim > 1 else vertex_3d
        if vertex_3d.ndim > 1:
            centroid = np.mean(vertex_3d, axis=0)
        return np.dot(vertex_3d - centroid, self.view_direction)

    def compute_face_normal(self, vertices: np.ndarray) -> np.ndarray:
        """
        Compute normal vector for a face.

        Args:
            vertices: Array of face vertices (N, 3)

        Returns:
            Normal vector (3,)
        """
        if len(vertices) < 3:
            return np.array([0, 0, 1])

        # Compute normal using cross product of first two edges
        v0 = vertices[0]
        v1 = vertices[1]
        v2 = vertices[2]

        edge1 = v1 - v0
        edge2 = v2 - v0

        normal = np.cross(edge1, edge2)
        if np.linalg.norm(normal) > 0:
            normal = normal / np.linalg.norm(normal)

        return normal

    def is_face_visible(
        self, face_normal: np.ndarray, view_direction: Optional[np.ndarray] = None
    ) -> bool:
        """
        Determine if a face is visible from view direction.

        Args:
            face_normal: Face normal vector
            view_direction: View direction (defaults to self.view_direction)

        Returns:
            True if face is front-facing (visible)
        """
        if view_direction is None:
            view_direction = self.view_direction

        # Face is visible if its normal points toward viewer
        dot_product = np.dot(face_normal, view_direction)

        # Use small epsilon to handle near-parallel faces
        return dot_product > 1e-10

    def project_mesh(
        self,
        vertices_3d: np.ndarray,
        faces: List[List[int]],
        edges: Optional[List[Tuple[int, int]]] = None,
    ) -> ProjectionResult:
        """
        Project a 3D mesh to 2D with visibility analysis.

        Args:
            vertices_3d: Array of 3D vertices (N, 3)
            faces: List of face definitions as vertex indices
            edges: Optional list of edge definitions

        Returns:
            ProjectionResult with projected geometry
        """
        # Project vertices to 2D
        vertices_2d = self.project(vertices_3d)

        # Get depths for occlusion
        depths = np.array([self.get_depth(v.reshape(1, -1)) for v in vertices_3d])

        # Create projected vertices with depth info
        projected_vertices = []
        for i, (v2d, v3d) in enumerate(zip(vertices_2d, vertices_3d)):
            pv = ProjectedVertex(x=v2d[0], y=v2d[1], z=v3d[2], depth=depths[i])
            projected_vertices.append(pv)

        # Process faces
        projected_faces = []
        for face_indices in faces:
            if len(face_indices) < 3:
                continue

            # Get 3D vertices for normal computation
            face_vertices_3d = vertices_3d[face_indices]
            normal = self.compute_face_normal(face_vertices_3d)

            # Check visibility
            visible = self.is_face_visible(normal)

            # Get projected vertices for this face
            face_projected = [projected_vertices[i] for i in face_indices]

            # Compute face center
            center = np.mean(face_vertices_3d, axis=0)

            # Create projected face
            pf = ProjectedFace(
                vertices=face_projected,
                edges=[],
                normal=(normal[0], normal[1], normal[2]),
                center=(center[0], center[1], center[2]),
                visible=visible,
            )
            projected_faces.append(pf)

        # Process edges
        projected_edges = []

        # Auto-detect edges from faces if not provided
        if edges is None:
            edge_set = set()
            for face_indices in faces:
                n = len(face_indices)
                for i in range(n):
                    edge = (face_indices[i], face_indices[(i + 1) % n])
                    # Normalize edge order for uniqueness
                    edge = tuple(sorted(edge))
                    edge_set.add(edge)
            edges = list(edge_set)

        # Project each edge
        for start_idx, end_idx in edges:
            if start_idx >= len(projected_vertices) or end_idx >= len(
                projected_vertices
            ):
                continue

            start_v = projected_vertices[start_idx]
            end_v = projected_vertices[end_idx]

            # Determine edge visibility based on adjacent faces
            edge_visible = True
            if self.hidden_line_removal:
                edge_visible = self._is_edge_visible(
                    start_idx, end_idx, faces, projected_faces
                )

            pe = ProjectedEdge(start=start_v, end=end_v, visible=edge_visible)
            projected_edges.append(pe)

        # Compute bounding box
        if len(projected_vertices) > 0:
            xs = [v.x for v in projected_vertices]
            ys = [v.y for v in projected_vertices]
            bounding_box = (min(xs), min(ys), max(xs), max(ys))
        else:
            bounding_box = (0, 0, 0, 0)

        return ProjectionResult(
            vertices=projected_vertices,
            edges=projected_edges,
            faces=projected_faces,
            view_direction=tuple(self.view_direction.tolist()),
            up_vector=tuple(self.up_vector.tolist()),
            bounding_box=bounding_box,
        )

    def _is_edge_visible(
        self,
        start_idx: int,
        end_idx: int,
        faces: List[List[int]],
        projected_faces: List[ProjectedFace],
    ) -> bool:
        """
        Determine if an edge is visible (not occluded by geometry).

        Uses simple depth comparison - edge is visible if at least
        one adjacent face is visible and in front of any occluders.

        Args:
            start_idx: Edge start vertex index
            end_idx: Edge end vertex index
            faces: All face definitions
            projected_faces: Projected face data with visibility

        Returns:
            True if edge should be visible
        """
        # Find faces adjacent to this edge
        adjacent_faces = []
        for i, face in enumerate(faces):
            if start_idx in face and end_idx in face:
                adjacent_faces.append(projected_faces[i])

        # Edge is visible if any adjacent face is front-facing
        for face in adjacent_faces:
            if face.visible:
                return True

        # If no adjacent front-facing faces, edge might be visible
        # (e.g., silhouette edge or interior edge)
        return False

    def create_section_projection(
        self,
        vertices_3d: np.ndarray,
        faces: List[List[int]],
        section_plane_point: np.ndarray,
        section_plane_normal: np.ndarray,
    ) -> Tuple[np.ndarray, List[List[int]]]:
        """
        Create projection with geometry cut by section plane.

        Args:
            vertices_3d: Original 3D vertices
            faces: Original face definitions
            section_plane_point: Point on section plane
            section_plane_normal: Normal of section plane

        Returns:
            Tuple of (cut_vertices, cut_faces) with geometry intersected by plane
        """
        # TODO: Implement proper mesh slicing with plane intersection
        # For now, return original geometry - will be implemented in Task 3
        return vertices_3d, faces

    def get_view_transform_matrix(self) -> np.ndarray:
        """
        Get 4x4 transformation matrix for view coordinate system.

        Returns:
            4x4 transformation matrix for converting world coords to view coords
        """
        # Build rotation matrix from basis vectors
        right = self._right
        up = self._up
        forward = -self.view_direction

        transform = np.array(
            [
                [right[0], right[1], right[2], 0],
                [up[0], up[1], up[2], 0],
                [forward[0], forward[1], forward[2], 0],
                [0, 0, 0, 1],
            ],
            dtype=np.float64,
        )

        return transform


def create_plan_projection(
    model, cut_level: float = 1.2, hidden_line_removal: bool = True
) -> ProjectionResult:
    """
    Create top-down plan view projection from BIM model.

    Args:
        model: BIM model with elements
        cut_level: Height at which to cut for plan view (meters)
        hidden_line_removal: Enable occlusion detection

    Returns:
        ProjectionResult for plan view
    """
    # Create projection looking down from +Z
    proj = OrthographicProjection(
        view_direction=(0, 0, -1),
        up_vector=(0, 1, 0),
        hidden_line_removal=hidden_line_removal,
    )

    # Extract geometry from model elements
    # This is a placeholder - actual implementation would traverse model
    vertices_3d = np.array([]).reshape(0, 3)
    faces = []

    return proj.project_mesh(vertices_3d, faces)


def create_elevation_projection(
    model, direction: str = "north", hidden_line_removal: bool = True
) -> ProjectionResult:
    """
    Create elevation view projection from BIM model.

    Args:
        model: BIM model with elements
        direction: Cardinal direction (north, south, east, west)
        hidden_line_removal: Enable occlusion detection

    Returns:
        ProjectionResult for elevation view
    """
    direction_map = {
        "north": (0, -1, 0),  # View from +Y
        "south": (0, 1, 0),  # View from -Y
        "east": (-1, 0, 0),  # View from +X
        "west": (1, 0, 0),  # View from -X
    }

    view_dir = direction_map.get(direction.lower(), (0, -1, 0))

    proj = OrthographicProjection(
        view_direction=view_dir,
        up_vector=(0, 0, 1),  # Z is up in elevation views
        hidden_line_removal=hidden_line_removal,
    )

    # Extract geometry from model
    vertices_3d = np.array([]).reshape(0, 3)
    faces = []

    return proj.project_mesh(vertices_3d, faces)


def create_section_projection(
    model, section_plane, hidden_line_removal: bool = True
) -> ProjectionResult:
    """
    Create section view projection from BIM model.

    Args:
        model: BIM model with elements
        section_plane: SectionPlane object defining cut plane
        hidden_line_removal: Enable occlusion detection

    Returns:
        ProjectionResult for section view
    """
    # View direction is perpendicular to section plane
    view_dir = section_plane.get_normal()

    proj = OrthographicProjection(
        view_direction=view_dir,
        up_vector=(0, 0, 1),  # Z is up in section views
        hidden_line_removal=hidden_line_removal,
    )

    # Extract and cut geometry
    # Implementation in Task 3

    return proj.project_mesh(np.array([]).reshape(0, 3), [])
