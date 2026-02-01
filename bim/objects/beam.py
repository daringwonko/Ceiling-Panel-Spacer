"""Beam structural object for BIM Workbench.

Provides parametric beam creation with rectangular profile along a vector.
Beams can be positioned at any elevation with configurable profile dimensions.
"""

from dataclasses import dataclass, field
from typing import Tuple, Optional, Dict, Any, List
import math


@dataclass
class Beam:
    """Parametric beam object with rectangular profile.

    Beams are defined by start and end points with a rectangular cross-section
    profile that is extruded along the beam axis.

    Attributes:
        start: Beam start (x, y, z)
        end: Beam end (x, y, z)
        profile_width: Profile width in mm (perpendicular to length)
        profile_height: Profile height in mm (typically vertical)
        material: Material identifier
        elevation: Elevation offset above working plane
        id: Unique identifier
    """

    start: Tuple[float, float, float] = (0.0, 0.0, 2800.0)
    end: Tuple[float, float, float] = (5000.0, 0.0, 2800.0)
    profile_width: float = 200.0  # mm
    profile_height: float = 400.0  # mm
    material: str = "Concrete"
    elevation: float = 2800.0  # mm above level
    id: str = field(default_factory=lambda: f"beam_{id(Beam)}{hash(Beam)}")

    # Aliases for convenience
    @property
    def start_point(self) -> Tuple[float, float, float]:
        return self.start

    @start_point.setter
    def start_point(self, value: Tuple[float, float, float]):
        self.start = value

    @property
    def end_point(self) -> Tuple[float, float, float]:
        return self.end

    @end_point.setter
    def end_point(self, value: Tuple[float, float, float]):
        self.end = value

    def __post_init__(self):
        """Validate beam properties after initialization."""
        self.validate()

    def validate(self) -> None:
        """Validate beam dimensions and properties.

        Raises:
            ValueError: If dimensions are invalid
        """
        if self.profile_width <= 0:
            raise ValueError(
                f"Beam profile width must be positive, got {self.profile_width}"
            )
        if self.profile_height <= 0:
            raise ValueError(
                f"Beam profile height must be positive, got {self.profile_height}"
            )
        if self.start == self.end:
            raise ValueError("Beam start and end points cannot be the same")

    @property
    def length(self) -> float:
        """Calculate beam length from start to end point."""
        dx = self.end[0] - self.start[0]
        dy = self.end[1] - self.start[1]
        dz = self.end[2] - self.start[2]
        return math.sqrt(dx**2 + dy**2 + dz**2)

    @property
    def volume(self) -> float:
        """Calculate beam volume."""
        return self.length * self.profile_width * self.profile_height

    @property
    def weight(self) -> float:
        """Calculate beam weight based on material density.

        Returns:
            Weight in kg (assuming density in kg/m³)
        """
        # Default density for concrete: 2400 kg/m³
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
    def axis_vector(self) -> Tuple[float, float, float]:
        """Get normalized beam axis vector."""
        dx = self.end[0] - self.start[0]
        dy = self.end[1] - self.start[1]
        dz = self.end[2] - self.start[2]
        length = math.sqrt(dx**2 + dy**2 + dz**2)

        if length == 0:
            return (0, 0, 0)

        return (dx / length, dy / length, dz / length)

    @property
    def is_horizontal(self) -> bool:
        """Check if beam is approximately horizontal."""
        axis = self.axis_vector
        return abs(axis[2]) < 0.01  # Less than 1% vertical component

    def get_profile_outline(self) -> List[Tuple[float, float, float]]:
        """Get beam profile outline at start point.

        Returns:
            List of 4 points forming the rectangular profile
        """
        axis = self.axis_vector

        # Calculate perpendicular vectors for profile
        # If beam is horizontal, use Z for profile height
        if self.is_horizontal:
            up = (0, 0, 1)
        else:
            # For sloped beams, find perpendicular in horizontal plane
            up = (0, 0, 1)

        # Calculate side vector (perpendicular to both axis and up)
        side = (
            axis[1] * up[2] - axis[2] * up[1],
            axis[2] * up[0] - axis[0] * up[2],
            axis[0] * up[1] - axis[1] * up[0],
        )
        side_length = math.sqrt(sum(s**2 for s in side))
        if side_length > 0:
            side = tuple(s / side_length for s in side)

        # Recalculate up to ensure orthogonality
        up = (
            side[1] * axis[2] - side[2] * axis[1],
            side[2] * axis[0] - side[0] * axis[2],
            side[0] * axis[1] - side[1] * axis[0],
        )

        # Scale by profile dimensions
        w2 = self.profile_width / 2
        h2 = self.profile_height / 2

        sx, sy, sz = self.start

        # Calculate profile corners
        p1 = (
            sx + side[0] * w2 + up[0] * h2,
            sy + side[1] * w2 + up[1] * h2,
            sz + side[2] * w2 + up[2] * h2,
        )
        p2 = (
            sx - side[0] * w2 + up[0] * h2,
            sy - side[1] * w2 + up[1] * h2,
            sz - side[2] * w2 + up[2] * h2,
        )
        p3 = (
            sx - side[0] * w2 - up[0] * h2,
            sy - side[1] * w2 - up[1] * h2,
            sz - side[2] * w2 - up[2] * h2,
        )
        p4 = (
            sx + side[0] * w2 - up[0] * h2,
            sy + side[1] * w2 - up[1] * h2,
            sz + side[2] * w2 - up[2] * h2,
        )

        return [p1, p2, p3, p4]

    def get_bounding_box(
        self,
    ) -> Tuple[Tuple[float, float, float], Tuple[float, float, float]]:
        """Get beam bounding box.

        Returns:
            Tuple of (min_point, max_point)
        """
        # Calculate all 8 corners of the beam
        profile = self.get_profile_outline()
        axis = self.axis_vector
        length = self.length

        corners = []
        for p in profile:
            # Start profile point
            corners.append(p)
            # End profile point
            corners.append(
                (
                    p[0] + axis[0] * length,
                    p[1] + axis[1] * length,
                    p[2] + axis[2] * length,
                )
            )

        # Calculate bounds
        min_x = min(c[0] for c in corners)
        min_y = min(c[1] for c in corners)
        min_z = min(c[2] for c in corners)
        max_x = max(c[0] for c in corners)
        max_y = max(c[1] for c in corners)
        max_z = max(c[2] for c in corners)

        return ((min_x, min_y, min_z), (max_x, max_y, max_z))

    def to_dict(self) -> Dict[str, Any]:
        """Convert beam to dictionary representation."""
        return {
            "id": self.id,
            "type": "beam",
            "start": self.start,
            "end": self.end,
            "start_point": self.start,
            "end_point": self.end,
            "profile_width": self.profile_width,
            "profile_height": self.profile_height,
            "material": self.material,
            "elevation": self.elevation,
            "length": self.length,
            "volume": self.volume,
            "weight": round(self.weight, 2),
            "is_horizontal": self.is_horizontal,
        }

    def update_geometry(self, **kwargs) -> None:
        """Update beam geometry properties.

        Args:
            **kwargs: Properties to update (start, end, start_point, end_point, profile_width, profile_height, elevation)
        """
        if "start" in kwargs:
            self.start = kwargs["start"]
        if "end" in kwargs:
            self.end = kwargs["end"]
        if "start_point" in kwargs:
            self.start = kwargs["start_point"]
        if "end_point" in kwargs:
            self.end = kwargs["end_point"]
        if "profile_width" in kwargs:
            self.profile_width = kwargs["profile_width"]
        if "profile_height" in kwargs:
            self.profile_height = kwargs["profile_height"]
        if "elevation" in kwargs:
            self.elevation = kwargs["elevation"]

        self.validate()


def create_beam(
    start: Tuple[float, float, float],
    end: Tuple[float, float, float],
    profile_width: float = 200.0,
    profile_height: float = 400.0,
    material: str = "Concrete",
    elevation: Optional[float] = None,
    beam_id: Optional[str] = None,
) -> Beam:
    """Create a new beam object.

    Args:
        start: Start point (x, y, z)
        end: End point (x, y, z)
        profile_width: Profile width in mm
        profile_height: Profile height in mm
        material: Material identifier
        elevation: Elevation above level (defaults to Z coordinate)
        beam_id: Optional unique identifier

    Returns:
        New Beam instance

    Example:
        >>> beam = create_beam(
        ...     start=(0, 0, 2800),
        ...     end=(5000, 0, 2800),
        ...     profile_width=200,
        ...     profile_height=400,
        ...     material="Concrete"
        ... )
        >>> print(f"Beam length: {beam.length}mm, Volume: {beam.volume}mm³")
    """
    if elevation is None:
        elevation = start[2]  # Use Z coordinate as default

    beam = Beam(
        start=start,
        end=end,
        profile_width=profile_width,
        profile_height=profile_height,
        material=material,
        elevation=elevation,
    )
    if beam_id:
        beam.id = beam_id
    return beam
