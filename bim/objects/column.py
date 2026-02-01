"""Column structural object for BIM Workbench.

Provides parametric column creation with rectangular or circular profiles.
Columns are extruded vertically from a base elevation to a specified height.
"""

from dataclasses import dataclass, field
from typing import Tuple, Optional, Dict, Any, List, Literal
import math


@dataclass
class Column:
    """Parametric column object with rectangle or circle profile.

    Columns are defined by a position on a working plane, base elevation, and height.
    They can have either rectangular or circular cross-sections.

    Attributes:
        position: Column base position (x, y)
        base_elevation: Base elevation in mm (Z coordinate)
        height: Column height in mm
        profile_type: Profile shape ("rectangle" or "circle")
        width: Profile width in mm (for rectangle) or diameter (for circle)
        depth: Profile depth in mm (for rectangle only)
        material: Material identifier
        level: Building level identifier
        id: Unique identifier
    """

    position: Tuple[float, float] = (0.0, 0.0)
    base_elevation: float = 0.0  # mm
    height: float = 3000.0  # mm
    profile_type: Literal["rectangle", "circle"] = "rectangle"
    width: float = 300.0  # mm
    depth: float = 300.0  # mm (rectangle only)
    material: str = "Concrete"
    level: str = "Level 0"
    id: str = field(default_factory=lambda: f"column_{id(Column)}{hash(Column)}")

    def __post_init__(self):
        """Validate column properties after initialization."""
        self.validate()

    def validate(self) -> None:
        """Validate column dimensions and properties.

        Raises:
            ValueError: If dimensions are invalid
        """
        if self.height <= 0:
            raise ValueError(f"Column height must be positive, got {self.height}")
        if self.width <= 0:
            raise ValueError(f"Column width must be positive, got {self.width}")
        if self.profile_type == "rectangle" and self.depth <= 0:
            raise ValueError(
                f"Column depth must be positive for rectangle profile, got {self.depth}"
            )
        if self.profile_type not in ["rectangle", "circle"]:
            raise ValueError(
                f"Invalid profile type: {self.profile_type}. Must be 'rectangle' or 'circle'"
            )

    @property
    def top_elevation(self) -> float:
        """Calculate top elevation."""
        return self.base_elevation + self.height

    @property
    def cross_sectional_area(self) -> float:
        """Calculate cross-sectional area."""
        if self.profile_type == "rectangle":
            return self.width * self.depth
        else:  # circle
            radius = self.width / 2
            return math.pi * radius**2

    @property
    def surface_area(self) -> float:
        """Calculate total surface area."""
        if self.profile_type == "rectangle":
            perimeter = 2 * (self.width + self.depth)
        else:  # circle
            perimeter = math.pi * self.width

        # Lateral surface + top and bottom
        lateral_area = perimeter * self.height
        top_bottom_area = 2 * self.cross_sectional_area
        return lateral_area + top_bottom_area

    @property
    def volume(self) -> float:
        """Calculate column volume."""
        return self.cross_sectional_area * self.height

    @property
    def weight(self) -> float:
        """Calculate column weight based on material density.

        Returns:
            Weight in kg (assuming density in kg/m³)
        """
        material_densities = {
            "Concrete": 2400,
            "Steel": 7850,
            "Timber": 600,
            "Aluminum": 2700,
        }
        density = material_densities.get(self.material, 2400)  # kg/m³
        volume_m3 = self.volume / 1e9  # Convert mm³ to m³
        return volume_m3 * density

    @property
    def center_point(self) -> Tuple[float, float, float]:
        """Get column center point at mid-height."""
        return (
            self.position[0],
            self.position[1],
            self.base_elevation + self.height / 2,
        )

    @property
    def base_point(self) -> Tuple[float, float, float]:
        """Get column base point."""
        return (self.position[0], self.position[1], self.base_elevation)

    @property
    def top_point(self) -> Tuple[float, float, float]:
        """Get column top point."""
        return (self.position[0], self.position[1], self.top_elevation)

    def get_base_outline(self) -> List[Tuple[float, float]]:
        """Get column base outline in 2D (XY plane).

        Returns:
            List of points forming the base outline
        """
        cx, cy = self.position

        if self.profile_type == "rectangle":
            w2 = self.width / 2
            d2 = self.depth / 2
            return [
                (cx - w2, cy - d2),
                (cx + w2, cy - d2),
                (cx + w2, cy + d2),
                (cx - w2, cy + d2),
            ]
        else:  # circle
            # Return octagon approximation for circle
            radius = self.width / 2
            points = []
            for i in range(8):
                angle = 2 * math.pi * i / 8
                points.append(
                    (cx + radius * math.cos(angle), cy + radius * math.sin(angle))
                )
            return points

    def get_3d_outline(self) -> Dict[str, List[Tuple[float, float, float]]]:
        """Get 3D outline for rendering.

        Returns:
            Dictionary with base and top outlines
        """
        base_2d = self.get_base_outline()
        base_3d = [(p[0], p[1], self.base_elevation) for p in base_2d]
        top_3d = [(p[0], p[1], self.top_elevation) for p in base_2d]

        return {
            "base": base_3d,
            "top": top_3d,
        }

    def get_bounding_box(
        self,
    ) -> Tuple[Tuple[float, float, float], Tuple[float, float, float]]:
        """Get column bounding box.

        Returns:
            Tuple of (min_point, max_point)
        """
        cx, cy = self.position

        if self.profile_type == "rectangle":
            w2 = self.width / 2
            d2 = self.depth / 2
            min_x, max_x = cx - w2, cx + w2
            min_y, max_y = cy - d2, cy + d2
        else:  # circle
            r = self.width / 2
            min_x, max_x = cx - r, cx + r
            min_y, max_y = cy - r, cy + r

        min_z = self.base_elevation
        max_z = self.top_elevation

        return ((min_x, min_y, min_z), (max_x, max_y, max_z))

    def to_dict(self) -> Dict[str, Any]:
        """Convert column to dictionary representation."""
        return {
            "id": self.id,
            "type": "column",
            "position": self.position,
            "base_elevation": self.base_elevation,
            "top_elevation": self.top_elevation,
            "height": self.height,
            "profile_type": self.profile_type,
            "width": self.width,
            "depth": self.depth if self.profile_type == "rectangle" else None,
            "diameter": self.width if self.profile_type == "circle" else None,
            "material": self.material,
            "level": self.level,
            "cross_sectional_area": round(self.cross_sectional_area, 2),
            "surface_area": round(self.surface_area, 2),
            "volume": self.volume,
            "weight": round(self.weight, 2),
        }

    def update_geometry(self, **kwargs) -> None:
        """Update column geometry properties.

        Args:
            **kwargs: Properties to update (position, base_elevation, height,
                     profile_type, width, depth)
        """
        if "position" in kwargs:
            self.position = kwargs["position"]
        if "base_elevation" in kwargs:
            self.base_elevation = kwargs["base_elevation"]
        if "height" in kwargs:
            self.height = kwargs["height"]
        if "profile_type" in kwargs:
            self.profile_type = kwargs["profile_type"]
        if "width" in kwargs:
            self.width = kwargs["width"]
        if "depth" in kwargs:
            self.depth = kwargs["depth"]

        self.validate()


def create_column(
    position: Tuple[float, float],
    height: float = 3000.0,
    profile_type: Literal["rectangle", "circle"] = "rectangle",
    width: float = 300.0,
    depth: Optional[float] = None,
    base_elevation: float = 0.0,
    material: str = "Concrete",
    level: str = "Level 0",
    column_id: Optional[str] = None,
) -> Column:
    """Create a new column object.

    Args:
        position: Column position (x, y)
        height: Column height in mm
        profile_type: Profile shape ("rectangle" or "circle")
        width: Profile width in mm (or diameter for circle)
        depth: Profile depth in mm (rectangle only, defaults to width)
        base_elevation: Base elevation in mm
        material: Material identifier
        level: Building level identifier
        column_id: Optional unique identifier

    Returns:
        New Column instance

    Example:
        >>> column = create_column(
        ...     position=(2500, 2500),
        ...     height=3000,
        ...     profile_type="rectangle",
        ...     width=300,
        ...     depth=300,
        ...     material="Concrete"
        ... )
        >>> print(f"Column height: {column.height}mm, Volume: {column.volume}mm³")

        >>> # Circular column
        >>> column = create_column(
        ...     position=(5000, 5000),
        ...     height=3000,
        ...     profile_type="circle",
        ...     width=400,  # Diameter
        ...     material="Steel"
        ... )
    """
    if depth is None:
        depth = width

    column = Column(
        position=position,
        height=height,
        profile_type=profile_type,
        width=width,
        depth=depth,
        base_elevation=base_elevation,
        material=material,
        level=level,
    )
    if column_id:
        column.id = column_id
    return column
