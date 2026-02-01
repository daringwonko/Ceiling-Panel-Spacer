"""Wall structural object for BIM Workbench.

Provides parametric wall creation with thickness, height, and material properties.
Walls are extruded vertically from a base line defined on a working plane.
"""

from dataclasses import dataclass, field
from typing import Tuple, Optional, Dict, Any, List
import math


@dataclass
class Wall:
    """Parametric wall object.

    Walls are defined by a base line on a working plane and extruded vertically
    to a specified height with a given thickness.

    Attributes:
        start_point: Base line start (x, y, z)
        end_point: Base line end (x, y, z)
        height: Vertical extrusion height in mm
        thickness: Wall thickness in mm
        material: Material identifier
        level: Building level identifier
        id: Unique identifier
    """

    start_point: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    end_point: Tuple[float, float, float] = (3000.0, 0.0, 0.0)
    start: Tuple[float, float, float] = None  # Alias for start_point
    end: Tuple[float, float, float] = None  # Alias for end_point
    height: float = 2800.0  # mm
    thickness: float = 200.0  # mm
    material: str = "Concrete"
    level: str = "Level 0"
    id: str = field(default_factory=lambda: f"wall_{id(Wall)}{hash(Wall)}")

    def __post_init__(self):
        """Validate wall properties after initialization."""
        self.validate()

    def validate(self) -> None:
        """Validate wall dimensions and properties.

        Raises:
            ValueError: If dimensions are invalid
        """
        if self.height <= 0:
            raise ValueError(f"Wall height must be positive, got {self.height}")
        if self.thickness <= 0:
            raise ValueError(f"Wall thickness must be positive, got {self.thickness}")
        if self.start_point == self.end_point:
            raise ValueError("Wall start and end points cannot be the same")

    @property
    def length(self) -> float:
        """Calculate wall length from base line."""
        dx = self.end_point[0] - self.start_point[0]
        dy = self.end_point[1] - self.start_point[1]
        dz = self.end_point[2] - self.start_point[2]
        return math.sqrt(dx**2 + dy**2 + dz**2)

    @property
    def area(self) -> float:
        """Calculate wall surface area (both faces)."""
        return self.length * self.height * 2

    @property
    def volume(self) -> float:
        """Calculate wall volume."""
        return self.length * self.height * self.thickness

    @property
    def base_elevation(self) -> float:
        """Get base elevation (Z coordinate of start point)."""
        return self.start_point[2]

    @property
    def top_elevation(self) -> float:
        """Get top elevation."""
        return self.base_elevation + self.height

    @property
    def center_line(
        self,
    ) -> Tuple[Tuple[float, float, float], Tuple[float, float, float]]:
        """Get wall center line (start and end points)."""
        return (self.start_point, self.end_point)

    def get_face_polygons(self) -> Dict[str, List[Tuple[float, float, float]]]:
        """Get wall face polygons for 3D rendering.

        Returns:
            Dictionary with face names and their vertices
        """
        # Calculate wall direction vector
        dx = self.end_point[0] - self.start_point[0]
        dy = self.end_point[1] - self.start_point[1]
        length = math.sqrt(dx**2 + dy**2)

        if length == 0:
            return {}

        # Normalize direction
        ux, uy = dx / length, dy / length

        # Perpendicular vector for thickness
        tx = -uy * (self.thickness / 2)
        ty = ux * (self.thickness / 2)

        # Base elevation
        z0 = self.start_point[2]
        z1 = z0 + self.height

        # Calculate corner points
        p1 = (self.start_point[0] + tx, self.start_point[1] + ty, z0)
        p2 = (self.end_point[0] + tx, self.end_point[1] + ty, z0)
        p3 = (self.end_point[0] + tx, self.end_point[1] + ty, z1)
        p4 = (self.start_point[0] + tx, self.start_point[1] + ty, z1)

        p5 = (self.start_point[0] - tx, self.start_point[1] - ty, z0)
        p6 = (self.end_point[0] - tx, self.end_point[1] - ty, z0)
        p7 = (self.end_point[0] - tx, self.end_point[1] - ty, z1)
        p8 = (self.start_point[0] - tx, self.start_point[1] - ty, z1)

        return {
            "front": [p1, p2, p3, p4],
            "back": [p5, p6, p7, p8],
            "left": [p1, p5, p8, p4],
            "right": [p2, p6, p7, p3],
            "top": [p4, p3, p7, p8],
            "bottom": [p1, p2, p6, p5],
        }

    def to_dict(self) -> Dict[str, Any]:
        """Convert wall to dictionary representation."""
        return {
            "id": self.id,
            "type": "wall",
            "start_point": self.start_point,
            "end_point": self.end_point,
            "height": self.height,
            "thickness": self.thickness,
            "material": self.material,
            "level": self.level,
            "length": self.length,
            "area": self.area,
            "volume": self.volume,
        }

    def update_geometry(self, **kwargs) -> None:
        """Update wall geometry properties.

        Args:
            **kwargs: Properties to update (start_point, end_point, height, thickness)
        """
        if "start_point" in kwargs:
            self.start_point = kwargs["start_point"]
        if "end_point" in kwargs:
            self.end_point = kwargs["end_point"]
        if "height" in kwargs:
            self.height = kwargs["height"]
        if "thickness" in kwargs:
            self.thickness = kwargs["thickness"]

        self.validate()


def create_wall(
    start: Tuple[float, float, float],
    end: Tuple[float, float, float],
    height: float = 2800.0,
    thickness: float = 200.0,
    material: str = "Concrete",
    level: str = "Level 0",
    wall_id: Optional[str] = None,
) -> Wall:
    """Create a new wall object.

    Args:
        start: Start point (x, y, z)
        end: End point (x, y, z)
        height: Wall height in mm
        thickness: Wall thickness in mm
        material: Material identifier
        level: Building level identifier
        wall_id: Optional unique identifier

    Returns:
        New Wall instance

    Example:
        >>> wall = create_wall(
        ...     start=(0, 0, 0),
        ...     end=(5000, 0, 0),
        ...     height=2800,
        ...     thickness=200,
        ...     material="Concrete"
        ... )
        >>> print(f"Wall length: {wall.length}mm, Volume: {wall.volume}mm³")
    """
    wall = Wall(
        start_point=start,
        end_point=end,
        height=height,
        thickness=thickness,
        material=material,
        level=level,
    )
    if wall_id:
        wall.id = wall_id
    return wall
