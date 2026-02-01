"""Slab structural object for BIM Workbench.

Provides parametric slab creation with polygonal boundaries.
Slabs are extruded vertically to a specified thickness from a top elevation.
"""

from dataclasses import dataclass, field
from typing import Tuple, Optional, Dict, Any, List, Literal
import math


@dataclass
class Slab:
    """Parametric slab object with polygonal boundary.

    Slabs are defined by a closed polygon boundary and extruded to a thickness.
    The elevation represents the top of the slab, with extrusion downward.

    Attributes:
        boundary: List of (x, y) points forming closed polygon
        thickness: Slab thickness in mm
        elevation: Top of slab elevation in mm
        material: Material identifier
        extrude_direction: Direction of extrusion ("down" or "up")
        level: Building level identifier
        id: Unique identifier
    """

    boundary: List[Tuple[float, float]] = field(
        default_factory=lambda: [
            (0.0, 0.0),
            (5000.0, 0.0),
            (5000.0, 5000.0),
            (0.0, 5000.0),
        ]
    )
    thickness: float = 200.0  # mm
    elevation: float = 3000.0  # mm (top of slab)
    material: str = "Concrete"
    extrude_direction: Literal["down", "up"] = "down"
    level: str = "Level 1"
    id: str = field(default_factory=lambda: f"slab_{id(Slab)}{hash(Slab)}")

    # Alias for convenience
    @property
    def boundary_points(self) -> List[Tuple[float, float]]:
        return self.boundary

    @boundary_points.setter
    def boundary_points(self, value: List[Tuple[float, float]]):
        self.boundary = value

    def __post_init__(self):
        """Validate slab properties after initialization."""
        self.validate()

    def validate(self) -> None:
        """Validate slab dimensions and properties.

        Raises:
            ValueError: If dimensions or boundary are invalid
        """
        if self.thickness <= 0:
            raise ValueError(f"Slab thickness must be positive, got {self.thickness}")

        if len(self.boundary) < 3:
            raise ValueError(
                f"Slab boundary must have at least 3 points, got {len(self.boundary)}"
            )

        # Check for self-intersections (simplified)
        if self._has_self_intersection():
            raise ValueError("Slab boundary has self-intersections")

        if self.extrude_direction not in ["down", "up"]:
            raise ValueError(
                f"Invalid extrude direction: {self.extrude_direction}. Must be 'down' or 'up'"
            )

    def _has_self_intersection(self) -> bool:
        """Check if polygon has self-intersections.

        Returns:
            True if polygon self-intersects
        """
        n = len(self.boundary)
        if n < 4:
            return False

        def segments_intersect(p1, p2, p3, p4):
            """Check if two line segments intersect."""

            def ccw(A, B, C):
                return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

            return ccw(p1, p3, p4) != ccw(p2, p3, p4) and ccw(p1, p2, p3) != ccw(
                p1, p2, p4
            )

        # Check each pair of non-adjacent edges
        for i in range(n):
            p1 = self.boundary[i]
            p2 = self.boundary[(i + 1) % n]

            for j in range(i + 2, n):
                if j == (i + n - 1) % n:  # Skip adjacent edges
                    continue

                p3 = self.boundary[j]
                p4 = self.boundary[(j + 1) % n]

                if segments_intersect(p1, p2, p3, p4):
                    return True

        return False

    @property
    def area(self) -> float:
        """Calculate slab area using shoelace formula."""
        n = len(self.boundary)
        area = 0.0

        for i in range(n):
            j = (i + 1) % n
            area += self.boundary[i][0] * self.boundary[j][1]
            area -= self.boundary[j][0] * self.boundary[i][1]

        return abs(area) / 2

    @property
    def volume(self) -> float:
        """Calculate slab volume."""
        return self.area * self.thickness

    @property
    def perimeter(self) -> float:
        """Calculate slab perimeter."""
        n = len(self.boundary)
        perim = 0.0

        for i in range(n):
            j = (i + 1) % n
            dx = self.boundary[j][0] - self.boundary[i][0]
            dy = self.boundary[j][1] - self.boundary[i][1]
            perim += math.sqrt(dx**2 + dy**2)

        return perim

    @property
    def top_elevation(self) -> float:
        """Get top of slab elevation."""
        if self.extrude_direction == "down":
            return self.elevation
        else:
            return self.elevation + self.thickness

    @property
    def bottom_elevation(self) -> float:
        """Get bottom of slab elevation."""
        if self.extrude_direction == "down":
            return self.elevation - self.thickness
        else:
            return self.elevation

    @property
    def centroid(self) -> Tuple[float, float]:
        """Calculate polygon centroid."""
        n = len(self.boundary)
        cx, cy = 0.0, 0.0
        area = self.area

        if area == 0:
            return (0.0, 0.0)

        for i in range(n):
            j = (i + 1) % n
            factor = (
                self.boundary[i][0] * self.boundary[j][1]
                - self.boundary[j][0] * self.boundary[i][1]
            )
            cx += (self.boundary[i][0] + self.boundary[j][0]) * factor
            cy += (self.boundary[i][1] + self.boundary[j][1]) * factor

        cx = cx / (6 * area)
        cy = cy / (6 * area)

        return (cx, cy)

    def get_top_face(self) -> List[Tuple[float, float, float]]:
        """Get top face vertices.

        Returns:
            List of 3D points forming the top face
        """
        z = self.top_elevation
        return [(p[0], p[1], z) for p in self.boundary]

    def get_bottom_face(self) -> List[Tuple[float, float, float]]:
        """Get bottom face vertices.

        Returns:
            List of 3D points forming the bottom face
        """
        z = self.bottom_elevation
        return [(p[0], p[1], z) for p in self.boundary]

    def get_side_faces(self) -> List[List[Tuple[float, float, float]]]:
        """Get side face vertices.

        Returns:
            List of faces, each containing 4 vertices
        """
        faces = []
        n = len(self.boundary)
        top_z = self.top_elevation
        bottom_z = self.bottom_elevation

        for i in range(n):
            j = (i + 1) % n
            p1 = self.boundary[i]
            p2 = self.boundary[j]

            face = [
                (p1[0], p1[1], top_z),
                (p2[0], p2[1], top_z),
                (p2[0], p2[1], bottom_z),
                (p1[0], p1[1], bottom_z),
            ]
            faces.append(face)

        return faces

    def get_bounding_box(
        self,
    ) -> Tuple[Tuple[float, float, float], Tuple[float, float, float]]:
        """Get slab bounding box.

        Returns:
            Tuple of (min_point, max_point)
        """
        min_x = min(p[0] for p in self.boundary)
        max_x = max(p[0] for p in self.boundary)
        min_y = min(p[1] for p in self.boundary)
        max_y = max(p[1] for p in self.boundary)
        min_z = self.bottom_elevation
        max_z = self.top_elevation

        return ((min_x, min_y, min_z), (max_x, max_y, max_z))

    def is_point_inside(self, point: Tuple[float, float]) -> bool:
        """Check if a point is inside the slab boundary.

        Args:
            point: (x, y) point to test

        Returns:
            True if point is inside polygon
        """
        x, y = point
        n = len(self.boundary)
        inside = False

        j = n - 1
        for i in range(n):
            xi, yi = self.boundary[i]
            xj, yj = self.boundary[j]

            if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
                inside = not inside
            j = i

        return inside

    def to_dict(self) -> Dict[str, Any]:
        """Convert slab to dictionary representation."""
        return {
            "id": self.id,
            "type": "slab",
            "boundary": self.boundary,
            "boundary_points": self.boundary,
            "thickness": self.thickness,
            "elevation": self.elevation,
            "top_elevation": self.top_elevation,
            "bottom_elevation": self.bottom_elevation,
            "material": self.material,
            "extrude_direction": self.extrude_direction,
            "level": self.level,
            "area": round(self.area, 2),
            "volume": self.volume,
            "perimeter": round(self.perimeter, 2),
            "centroid": self.centroid,
        }

    def update_geometry(self, **kwargs) -> None:
        """Update slab geometry properties.

        Args:
            **kwargs: Properties to update (boundary, boundary_points, thickness, elevation,
                     extrude_direction)
        """
        if "boundary" in kwargs:
            self.boundary = kwargs["boundary"]
        if "boundary_points" in kwargs:
            self.boundary = kwargs["boundary_points"]
        if "thickness" in kwargs:
            self.thickness = kwargs["thickness"]
        if "elevation" in kwargs:
            self.elevation = kwargs["elevation"]
        if "extrude_direction" in kwargs:
            self.extrude_direction = kwargs["extrude_direction"]

        self.validate()


def create_slab(
    boundary: List[Tuple[float, float]],
    thickness: float = 200.0,
    elevation: float = 3000.0,
    material: str = "Concrete",
    extrude_direction: Literal["down", "up"] = "down",
    level: str = "Level 1",
    slab_id: Optional[str] = None,
) -> Slab:
    """Create a new slab object.

    Args:
        boundary: List of (x, y) points forming closed polygon
        thickness: Slab thickness in mm
        elevation: Top of slab elevation in mm
        material: Material identifier
        extrude_direction: Direction of extrusion ("down" or "up")
        level: Building level identifier
        slab_id: Optional unique identifier

    Returns:
        New Slab instance

    Example:
        >>> slab = create_slab(
        ...     boundary=[(0, 0), (5000, 0), (5000, 5000), (0, 5000)],
        ...     thickness=200,
        ...     elevation=3000,
        ...     material="Concrete"
        ... )
        >>> print(f"Slab area: {slab.area}mm², Volume: {slab.volume}mm³")

        >>> # L-shaped slab
        >>> slab = create_slab(
        ...     boundary=[(0, 0), (8000, 0), (8000, 3000), (5000, 3000),
        ...               (5000, 5000), (0, 5000)],
        ...     thickness=250,
        ...     elevation=2800,
        ...     material="Concrete"
        ... )
    """
    slab = Slab(
        boundary=boundary,
        thickness=thickness,
        elevation=elevation,
        material=material,
        extrude_direction=extrude_direction,
        level=level,
    )
    if slab_id:
        slab.id = slab_id
    return slab
