"""
Stairs Object for BIM Workbench

Provides parametric stairs creation with path-based geometry.
"""

from typing import Optional, Dict, Any, Tuple, List
from enum import Enum
import math
import uuid
from datetime import datetime


class PathType(Enum):
    """Stair path type options"""

    STRAIGHT = "straight"
    L_SHAPE = "l_shape"
    U_SHAPE = "u_shape"


class Stairs:
    """
    Parametric Stairs object with path-based geometry

    Properties:
        - TotalRise: Total vertical rise in mm (500-5000mm)
        - TotalRun: Total horizontal run in mm (500-10000mm)
        - TreadDepth: Depth of each tread in mm (200-400mm)
        - RiserHeight: Height of each riser in mm (150-200mm)
        - StairCount: Number of stairs (2-50)
        - StairWidth: Width of stairway in mm (600-1500mm)
        - PathType: Shape of stair path (straight, L-shape, U-shape)
        - PathPoints: List of (x, y) points defining stair path
    """

    # Building code constraints
    MIN_RISER = 150.0  # 6 inches
    MAX_RISER = 200.0  # ~8 inches
    MIN_TREAD = 250.0  # ~10 inches
    MAX_TREAD = 400.0  # ~16 inches
    IDEAL_RISER = 175.0  # 7 inches
    IDEAL_TREAD = 280.0  # 11 inches

    def __init__(
        self,
        name: str = "Stairs",
        total_rise: float = 3000.0,
        total_run: Optional[float] = None,
        tread_depth: float = 280.0,
        stair_width: float = 1000.0,
        path_type: PathType = PathType.STRAIGHT,
        path_points: Optional[List[Tuple[float, float]]] = None,
        position: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    ):
        """
        Initialize Stairs object

        Args:
            name: Stairs name
            total_rise: Total vertical rise in mm (500-5000)
            total_run: Total horizontal run in mm (auto-calculated if None)
            tread_depth: Depth of each tread in mm (200-400)
            stair_width: Width of stairway in mm (600-1500)
            path_type: Shape of stair path
            path_points: List of (x, y) points defining path
            position: (x, y, z) base position in mm
        """
        self.id = str(uuid.uuid4())
        self.name = name
        self.type = "stairs"
        self.created_at = datetime.utcnow().isoformat() + "Z"
        self.updated_at = self.created_at

        # Position
        self.position = position

        # Path definition
        self._path_type = path_type
        self._path_points = path_points or self._default_path_points(path_type)

        # Stair parameters with validation
        self._total_rise = self._validate_range(total_rise, 500, 5000, "total_rise")
        self._tread_depth = self._validate_range(tread_depth, 200, 400, "tread_depth")
        self._stair_width = self._validate_range(stair_width, 600, 1500, "stair_width")

        # Calculated properties
        self._stair_count: int = 0
        self._riser_height: float = 0.0
        self._total_run: float = total_run or 0.0

        # Calculate dimensions
        self._calculate_dimensions()

        # Geometry cache
        self._geometry: Optional[Dict[str, Any]] = None
        self._preview_geometry: Optional[Dict[str, Any]] = None

    def _validate_range(
        self, value: float, min_val: float, max_val: float, name: str
    ) -> float:
        """Validate and clamp value to range"""
        if value < min_val:
            print(f"Warning: {name} {value} is below minimum {min_val}, clamping")
            return min_val
        if value > max_val:
            print(f"Warning: {name} {value} exceeds maximum {max_val}, clamping")
            return max_val
        return value

    def _default_path_points(self, path_type: PathType) -> List[Tuple[float, float]]:
        """Generate default path points for path type"""
        if path_type == PathType.STRAIGHT:
            return [(0, 0), (3000, 0)]
        elif path_type == PathType.L_SHAPE:
            return [(0, 0), (2000, 0), (2000, 1500)]
        else:  # U_SHAPE
            return [(0, 0), (1500, 0), (1500, 1500), (0, 1500)]

    def _calculate_dimensions(self):
        """Calculate stair count and riser height from total rise"""
        # Calculate optimal stair count
        ideal_count = self._total_rise / self.IDEAL_RISER

        # Round to nearest integer
        self._stair_count = max(2, min(50, round(ideal_count)))

        # Calculate actual riser height
        self._riser_height = self._total_rise / self._stair_count

        # Validate riser height
        if self._riser_height < self.MIN_RISER:
            # Need fewer stairs but longer risers
            self._stair_count = int(self._total_rise / self.MIN_RISER)
            self._riser_height = self._total_rise / self._stair_count
        elif self._riser_height > self.MAX_RISER:
            # Need more stairs but shorter risers
            self._stair_count = int(self._total_rise / self.MAX_RISER) + 1
            self._riser_height = self._total_rise / self._stair_count

        # Calculate total run if not specified
        if self._total_run <= 0:
            self._total_run = self._tread_depth * (self._stair_count - 1)

    @property
    def total_rise(self) -> float:
        """Total vertical rise in mm"""
        return self._total_rise

    @total_rise.setter
    def total_rise(self, value: float):
        self._total_rise = self._validate_range(value, 500, 5000, "total_rise")
        self._calculate_dimensions()
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def total_run(self) -> float:
        """Total horizontal run in mm"""
        return self._total_run

    @total_run.setter
    def total_run(self, value: float):
        self._total_run = max(500, value)
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def tread_depth(self) -> float:
        """Tread depth in mm"""
        return self._tread_depth

    @tread_depth.setter
    def tread_depth(self, value: float):
        self._tread_depth = self._validate_range(value, 200, 400, "tread_depth")
        self._calculate_dimensions()
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def riser_height(self) -> float:
        """Riser height in mm (calculated)"""
        return self._riser_height

    @property
    def stair_count(self) -> int:
        """Number of stairs (calculated)"""
        return self._stair_count

    @property
    def stair_width(self) -> float:
        """Stair width in mm"""
        return self._stair_width

    @stair_width.setter
    def stair_width(self, value: float):
        self._stair_width = self._validate_range(value, 600, 1500, "stair_width")
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def path_type(self) -> PathType:
        """Path type"""
        return self._path_type

    @path_type.setter
    def path_type(self, value: PathType):
        self._path_type = value
        self._path_points = self._default_path_points(value)
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def path_points(self) -> List[Tuple[float, float]]:
        """Path points"""
        return self._path_points

    @path_points.setter
    def path_points(self, value: List[Tuple[float, float]]):
        if len(value) >= 2:
            self._path_points = value
            # Auto-detect path type from point count
            if len(value) == 2:
                self._path_type = PathType.STRAIGHT
            elif len(value) == 3:
                self._path_type = PathType.L_SHAPE
            else:
                self._path_type = PathType.U_SHAPE
            self._geometry = None
            self.updated_at = datetime.utcnow().isoformat() + "Z"

    def calculate_risers(self) -> Dict[str, float]:
        """
        Calculate optimal riser configuration

        Returns:
            Dictionary with riser calculations
        """
        # Calculate stair count using 2R + G formula (R=riser, G=going/tread)
        # Ideal: 2*175 + 280 = 630mm
        ideal_step = 2 * self.IDEAL_RISER + self.IDEAL_TREAD

        # Calculate actual
        actual_step = 2 * self._riser_height + self._tread_depth

        return {
            "stair_count": self._stair_count,
            "riser_height": self._riser_height,
            "tread_depth": self._tread_depth,
            "total_rise": self._total_rise,
            "total_run": self._total_run,
            "step_length": actual_step,
            "compliance": "pass"
            if self.MIN_RISER <= self._riser_height <= self.MAX_RISER
            else "fail",
        }

    def get_geometry(self) -> Dict[str, Any]:
        """
        Generate 3D stair geometry

        Returns:
            Dictionary containing stair geometry data
        """
        if self._geometry is not None:
            return self._geometry

        # Generate steps based on path
        steps = self._generate_steps()

        # Generate landing if needed
        landings = self._generate_landings()

        self._geometry = {
            "type": "stairs",
            "path_type": self._path_type.value,
            "steps": steps,
            "landings": landings,
            "dimensions": {
                "total_rise": self._total_rise,
                "total_run": self._total_run,
                "stair_width": self._stair_width,
                "stair_count": self._stair_count,
                "riser_height": self._riser_height,
                "tread_depth": self._tread_depth,
            },
            "position": self.position,
        }

        return self._geometry

    def get_preview_geometry(self) -> Dict[str, Any]:
        """
        Get lightweight preview geometry for real-time updates

        Returns:
            Dictionary containing simplified geometry for preview
        """
        if self._preview_geometry is not None:
            return self._preview_geometry

        # Generate simplified wireframe representation
        path_3d = []

        # Calculate cumulative distances along path
        current_z = self.position[2]
        riser_increment = self._riser_height / 1000  # Convert to meters for display

        for i, (x, y) in enumerate(self._path_points):
            z = current_z + (i * riser_increment * 1000)
            path_3d.append((x + self.position[0], y + self.position[1], z))

        self._preview_geometry = {
            "type": "stairs_preview",
            "path": path_3d,
            "dimensions": {
                "width": self._stair_width,
                "rise": self._total_rise,
                "run": self._total_run,
                "count": self._stair_count,
            },
            "wireframe": True,
        }

        return self._preview_geometry

    def _generate_steps(self) -> List[Dict[str, Any]]:
        """Generate individual step geometries"""
        steps = []

        # Calculate step positions along path
        path_segments = self._calculate_path_segments()

        stair_idx = 0
        for segment in path_segments:
            start_pt, end_pt = segment
            segment_length = math.sqrt(
                (end_pt[0] - start_pt[0]) ** 2 + (end_pt[1] - start_pt[1]) ** 2
            )

            # Number of steps in this segment
            steps_in_segment = max(1, int(segment_length / self._tread_depth))

            for i in range(steps_in_segment):
                if stair_idx >= self._stair_count:
                    break

                # Interpolate position
                t = i / steps_in_segment
                x = start_pt[0] + t * (end_pt[0] - start_pt[0])
                y = start_pt[1] + t * (end_pt[1] - start_pt[1])
                z = stair_idx * self._riser_height

                # Step vertices
                half_width = self._stair_width / 2
                step_vertices = [
                    (x - half_width, y, z),
                    (x + half_width, y, z),
                    (x + half_width, y + self._tread_depth, z),
                    (x - half_width, y + self._tread_depth, z),
                    (x - half_width, y, z + self._riser_height),
                    (x + half_width, y, z + self._riser_height),
                    (x + half_width, y + self._tread_depth, z + self._riser_height),
                    (x - half_width, y + self._tread_depth, z + self._riser_height),
                ]

                steps.append(
                    {
                        "index": stair_idx,
                        "vertices": step_vertices,
                        "tread_depth": self._tread_depth,
                        "riser_height": self._riser_height,
                        "width": self._stair_width,
                        "position": (x, y, z),
                    }
                )

                stair_idx += 1

        return steps

    def _generate_landings(self) -> List[Dict[str, Any]]:
        """Generate landing geometries at path turns"""
        landings = []

        # Add landing at each turn point (excluding start and end)
        for i in range(1, len(self._path_points) - 1):
            pt = self._path_points[i]

            # Landing at intermediate points
            landing_z = i * (self._total_rise / len(self._path_points))

            half_width = self._stair_width / 2
            landing_depth = self._stair_width  # Square landing

            landing_vertices = [
                (pt[0] - half_width, pt[1] - landing_depth / 2, landing_z),
                (pt[0] + half_width, pt[1] - landing_depth / 2, landing_z),
                (pt[0] + half_width, pt[1] + landing_depth / 2, landing_z),
                (pt[0] - half_width, pt[1] + landing_depth / 2, landing_z),
                (
                    pt[0] - half_width,
                    pt[1] - landing_depth / 2,
                    landing_z + self._riser_height,
                ),
                (
                    pt[0] + half_width,
                    pt[1] - landing_depth / 2,
                    landing_z + self._riser_height,
                ),
                (
                    pt[0] + half_width,
                    pt[1] + landing_depth / 2,
                    landing_z + self._riser_height,
                ),
                (
                    pt[0] - half_width,
                    pt[1] + landing_depth / 2,
                    landing_z + self._riser_height,
                ),
            ]

            landings.append(
                {
                    "index": i,
                    "vertices": landing_vertices,
                    "position": (pt[0], pt[1], landing_z),
                    "width": self._stair_width,
                    "depth": landing_depth,
                }
            )

        return landings

    def _calculate_path_segments(
        self,
    ) -> List[Tuple[Tuple[float, float], Tuple[float, float]]]:
        """Calculate path segments from points"""
        segments = []
        for i in range(len(self._path_points) - 1):
            segments.append((self._path_points[i], self._path_points[i + 1]))
        return segments

    def to_dict(self) -> Dict[str, Any]:
        """Convert stairs to dictionary representation"""
        return {
            "id": self.id,
            "type": self.type,
            "name": self.name,
            "properties": {
                "total_rise": self._total_rise,
                "total_run": self._total_run,
                "tread_depth": self._tread_depth,
                "riser_height": self._riser_height,
                "stair_count": self._stair_count,
                "stair_width": self._stair_width,
                "path_type": self._path_type.value,
                "path_points": self._path_points,
                "position": self.position,
            },
            "geometry": self.get_geometry(),
            "calculations": self.calculate_risers(),
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Stairs":
        """Create Stairs from dictionary"""
        props = data.get("properties", {})
        stairs = cls(
            name=data.get("name", "Stairs"),
            total_rise=props.get("total_rise", 3000.0),
            total_run=props.get("total_run", None),
            tread_depth=props.get("tread_depth", 280.0),
            stair_width=props.get("stair_width", 1000.0),
            path_type=PathType(props.get("path_type", "straight")),
            path_points=props.get("path_points"),
            position=tuple(props.get("position", [0.0, 0.0, 0.0])),
        )
        stairs.id = data.get("id", stairs.id)
        stairs.created_at = data.get("created_at", stairs.created_at)
        stairs.updated_at = data.get("updated_at", stairs.updated_at)
        return stairs


def makeStairs(
    path: List[Tuple[float, float]],
    total_rise: float,
    tread_depth: float = 280.0,
    stair_width: float = 1000.0,
    name: str = "Stairs",
) -> Stairs:
    """
    Factory function to create Stairs

    Args:
        path: List of (x, y) points defining stair path
        total_rise: Total vertical rise in mm
        tread_depth: Depth of each tread in mm
        stair_width: Width of stairway in mm
        name: Stairs name

    Returns:
        Created Stairs object
    """
    # Auto-detect path type from point count
    if len(path) == 2:
        path_type = PathType.STRAIGHT
    elif len(path) == 3:
        path_type = PathType.L_SHAPE
    else:
        path_type = PathType.U_SHAPE

    return Stairs(
        name=name,
        total_rise=total_rise,
        tread_depth=tread_depth,
        stair_width=stair_width,
        path_type=path_type,
        path_points=path,
    )
