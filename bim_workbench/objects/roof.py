"""
Roof Object for BIM Workbench

Provides parametric roof generation from closed wire profiles.
"""

from typing import Optional, Dict, Any, Tuple, List
from enum import Enum
import math
import uuid
from datetime import datetime


class RoofType(Enum):
    """Roof type options"""

    GABLE = "gable"
    HIP = "hip"
    SHED = "shed"
    FLAT = "flat"


class Roof:
    """
    Parametric Roof object generated from closed wire profile

    Properties:
        - SlopeAngle: Roof slope in degrees (5-60)
        - Overhang: Eave overhang in mm (0-1000)
        - RoofType: Type of roof (gable, hip, shed, flat)
        - Thickness: Roof material thickness in mm (10-500)
        - BaseWire: Reference to closed wire profile
    """

    def __init__(
        self,
        name: str = "Roof",
        slope_angle: float = 30.0,
        overhang: float = 300.0,
        roof_type: RoofType = RoofType.GABLE,
        thickness: float = 150.0,
        base_wire: Optional[List[Tuple[float, float]]] = None,
        position: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    ):
        """
        Initialize Roof object

        Args:
            name: Roof name
            slope_angle: Roof slope in degrees (5-60)
            overhang: Eave overhang in mm (0-1000)
            roof_type: Type of roof
            thickness: Roof material thickness in mm (10-500)
            base_wire: List of (x, y) points defining closed wire
            position: (x, y, z) position in mm
        """
        self.id = str(uuid.uuid4())
        self.name = name
        self.type = "roof"
        self.created_at = datetime.utcnow().isoformat() + "Z"
        self.updated_at = self.created_at

        # Position
        self.position = position

        # Properties with validation
        self._slope_angle = self._validate_range(slope_angle, 5, 60, "slope_angle")
        self._overhang = self._validate_range(overhang, 0, 1000, "overhang")
        self._roof_type = roof_type
        self._thickness = self._validate_range(thickness, 10, 500, "thickness")

        # Base wire
        self._base_wire = base_wire or []

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

    @property
    def slope_angle(self) -> float:
        """Roof slope angle in degrees"""
        return self._slope_angle

    @slope_angle.setter
    def slope_angle(self, value: float):
        self._slope_angle = self._validate_range(value, 5, 60, "slope_angle")
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def overhang(self) -> float:
        """Eave overhang in mm"""
        return self._overhang

    @overhang.setter
    def overhang(self, value: float):
        self._overhang = self._validate_range(value, 0, 1000, "overhang")
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def roof_type(self) -> RoofType:
        """Roof type"""
        return self._roof_type

    @roof_type.setter
    def roof_type(self, value: RoofType):
        self._roof_type = value
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def thickness(self) -> float:
        """Roof material thickness in mm"""
        return self._thickness

    @thickness.setter
    def thickness(self, value: float):
        self._thickness = self._validate_range(value, 10, 500, "thickness")
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def base_wire(self) -> List[Tuple[float, float]]:
        """Base wire points"""
        return self._base_wire

    @base_wire.setter
    def base_wire(self, value: List[Tuple[float, float]]):
        self._base_wire = value
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    def is_valid_wire(self) -> bool:
        """
        Check if base wire is valid (closed and planar)

        Returns:
            True if wire is valid for roof generation
        """
        if len(self._base_wire) < 3:
            return False

        # Check if wire is closed (first point equals last point)
        first = self._base_wire[0]
        last = self._base_wire[-1]
        tolerance = 1.0  # 1mm tolerance

        is_closed = (
            abs(first[0] - last[0]) < tolerance and abs(first[1] - last[1]) < tolerance
        )

        return is_closed

    def generate_from_wire(self, wire: List[Tuple[float, float]]) -> Dict[str, Any]:
        """
        Generate roof geometry from closed wire profile

        Args:
            wire: List of (x, y) points defining closed wire

        Returns:
            Dictionary containing roof geometry
        """
        self._base_wire = wire
        return self.get_geometry()

    def get_geometry(self) -> Dict[str, Any]:
        """
        Generate 3D roof geometry based on type

        Returns:
            Dictionary containing roof geometry
        """
        if self._geometry is not None:
            return self._geometry

        if not self.is_valid_wire():
            return {
                "type": "error",
                "message": "Invalid wire: must be closed with at least 3 points",
            }

        # Generate roof based on type
        if self._roof_type == RoofType.GABLE:
            roof_geom = self._generate_gable_roof()
        elif self._roof_type == RoofType.HIP:
            roof_geom = self._generate_hip_roof()
        elif self._roof_type == RoofType.SHED:
            roof_geom = self._generate_shed_roof()
        else:  # FLAT
            roof_geom = self._generate_flat_roof()

        self._geometry = {
            "type": "roof",
            "roof_type": self._roof_type.value,
            "geometry": roof_geom,
            "dimensions": {
                "slope_angle": self._slope_angle,
                "overhang": self._overhang,
                "thickness": self._thickness,
            },
            "base_wire": self._base_wire,
            "position": self.position,
        }

        return self._geometry

    def get_preview_geometry(self) -> Dict[str, Any]:
        """
        Get lightweight preview geometry (wireframe)

        Returns:
            Dictionary containing wireframe preview
        """
        if self._preview_geometry is not None:
            return self._preview_geometry

        if not self.is_valid_wire():
            return {"type": "wireframe", "lines": [], "valid": False}

        # Generate wireframe representation
        lines = []

        # Add base wire
        for i in range(len(self._base_wire) - 1):
            p1 = self._base_wire[i]
            p2 = self._base_wire[i + 1]
            lines.append(
                {
                    "start": (
                        p1[0] + self.position[0],
                        p1[1] + self.position[1],
                        self.position[2],
                    ),
                    "end": (
                        p2[0] + self.position[0],
                        p2[1] + self.position[1],
                        self.position[2],
                    ),
                }
            )

        # Add ridge line preview (simplified)
        centroid = self._calculate_centroid()
        ridge_height = self._calculate_ridge_height()

        if self._roof_type == RoofType.GABLE:
            # Ridge line for gable
            lines.append(
                {
                    "start": (
                        centroid[0] - 500,
                        centroid[1],
                        self.position[2] + ridge_height,
                    ),
                    "end": (
                        centroid[0] + 500,
                        centroid[1],
                        self.position[2] + ridge_height,
                    ),
                }
            )
        elif self._roof_type == RoofType.HIP:
            # Ridge point for hip
            lines.append(
                {
                    "start": (
                        centroid[0],
                        centroid[1],
                        self.position[2] + ridge_height,
                    ),
                    "end": (centroid[0], centroid[1], self.position[2] + ridge_height),
                }
            )

        self._preview_geometry = {
            "type": "wireframe",
            "lines": lines,
            "valid": True,
            "slope_preview": ridge_height,
        }

        return self._preview_geometry

    def _generate_gable_roof(self) -> Dict[str, Any]:
        """Generate gable roof geometry"""
        # Find the longest dimension for ridge direction
        bbox = self._calculate_bounding_box()
        width = bbox["max_x"] - bbox["min_x"]
        depth = bbox["max_y"] - bbox["min_y"]

        # Ridge runs along the longer dimension
        ridge_height = self._calculate_ridge_height()

        # Calculate roof slopes
        slope_rad = math.radians(self._slope_angle)

        # Generate vertices for gable roof
        vertices = []
        faces = []

        # Apply overhang
        overhang_pts = self._apply_overhang()

        # Create roof with two sloping planes
        centroid = self._calculate_centroid()

        if width >= depth:
            # Ridge along X axis
            ridge_start = (bbox["min_x"], centroid[1], ridge_height)
            ridge_end = (bbox["max_x"], centroid[1], ridge_height)

            # Two roof planes
            vertices = [
                # Lower plane (left)
                (overhang_pts[0][0], overhang_pts[0][1], 0),
                (overhang_pts[-2][0], overhang_pts[-2][1], 0),
                ridge_end,
                ridge_start,
                # Upper plane (right)
                (overhang_pts[1][0], overhang_pts[1][1], 0),
                (overhang_pts[2][0], overhang_pts[2][1], 0),
                ridge_end,
                ridge_start,
            ]

            faces = [
                [0, 1, 2, 3],  # Left slope
                [4, 5, 6, 7],  # Right slope
            ]
        else:
            # Ridge along Y axis
            ridge_start = (centroid[0], bbox["min_y"], ridge_height)
            ridge_end = (centroid[0], bbox["max_y"], ridge_height)

            vertices = [
                (overhang_pts[0][0], overhang_pts[0][1], 0),
                (overhang_pts[1][0], overhang_pts[1][1], 0),
                ridge_end,
                ridge_start,
                (overhang_pts[2][0], overhang_pts[2][1], 0),
                (overhang_pts[3][0], overhang_pts[3][1], 0),
                ridge_end,
                ridge_start,
            ]

            faces = [
                [0, 1, 2, 3],
                [4, 5, 6, 7],
            ]

        return {
            "vertices": vertices,
            "faces": faces,
            "ridge_line": [ridge_start, ridge_end],
            "type": "gable",
        }

    def _generate_hip_roof(self) -> Dict[str, Any]:
        """Generate hip roof geometry"""
        ridge_height = self._calculate_ridge_height()
        centroid = self._calculate_centroid()
        overhang_pts = self._apply_overhang()

        # Hip roof has a ridge point (or short ridge line) at top
        # and slopes on all sides
        ridge_point = (centroid[0], centroid[1], ridge_height)

        vertices = []
        faces = []

        # Create triangular faces from each edge to ridge point
        num_edges = len(overhang_pts) - 1
        for i in range(num_edges):
            p1 = overhang_pts[i]
            p2 = overhang_pts[i + 1]

            # Face vertices
            v_idx = len(vertices)
            vertices.extend(
                [
                    (p1[0], p1[1], 0),
                    (p2[0], p2[1], 0),
                    ridge_point,
                ]
            )
            faces.append([v_idx, v_idx + 1, v_idx + 2])

        return {
            "vertices": vertices,
            "faces": faces,
            "ridge_point": ridge_point,
            "type": "hip",
        }

    def _generate_shed_roof(self) -> Dict[str, Any]:
        """Generate shed roof geometry (single slope)"""
        ridge_height = self._calculate_ridge_height()
        overhang_pts = self._apply_overhang()

        # Shed roof slopes in one direction
        # Find first and last points for slope direction
        p1 = overhang_pts[0]
        p2 = overhang_pts[1]
        p3 = overhang_pts[2]
        p4 = overhang_pts[3] if len(overhang_pts) > 3 else overhang_pts[0]

        vertices = [
            (p1[0], p1[1], 0),
            (p2[0], p2[1], 0),
            (p3[0], p3[1], ridge_height),
            (p4[0], p4[1], ridge_height),
        ]

        faces = [[0, 1, 2, 3]]

        return {
            "vertices": vertices,
            "faces": faces,
            "type": "shed",
        }

    def _generate_flat_roof(self) -> Dict[str, Any]:
        """Generate flat roof geometry (minimal slope for drainage)"""
        overhang_pts = self._apply_overhang()

        # Flat roof with slight slope (5 degrees)
        slope_height = math.tan(math.radians(5)) * 100

        vertices = []
        for i, pt in enumerate(overhang_pts[:-1]):  # Exclude duplicate last point
            z = slope_height if i < 2 else 0
            vertices.append((pt[0], pt[1], z))

        # Create face indices
        faces = [list(range(len(vertices)))]

        return {
            "vertices": vertices,
            "faces": faces,
            "type": "flat",
            "slope": 5,
        }

    def _calculate_bounding_box(self) -> Dict[str, float]:
        """Calculate bounding box of base wire"""
        if not self._base_wire:
            return {"min_x": 0, "min_y": 0, "max_x": 0, "max_y": 0}

        xs = [p[0] for p in self._base_wire]
        ys = [p[1] for p in self._base_wire]

        return {
            "min_x": min(xs),
            "min_y": min(ys),
            "max_x": max(xs),
            "max_y": max(ys),
        }

    def _calculate_centroid(self) -> Tuple[float, float]:
        """Calculate centroid of base wire"""
        if not self._base_wire:
            return (0, 0)

        xs = [p[0] for p in self._base_wire[:-1]]  # Exclude duplicate last point
        ys = [p[1] for p in self._base_wire[:-1]]

        return (sum(xs) / len(xs), sum(ys) / len(ys))

    def _calculate_ridge_height(self) -> float:
        """Calculate ridge height based on slope and building dimensions"""
        bbox = self._calculate_bounding_box()
        width = max(bbox["max_x"] - bbox["min_x"], bbox["max_y"] - bbox["min_y"])

        # Half width times tan(slope)
        slope_rad = math.radians(self._slope_angle)
        ridge_height = (width / 2) * math.tan(slope_rad)

        return ridge_height

    def _apply_overhang(self) -> List[Tuple[float, float]]:
        """Apply overhang to base wire points"""
        if not self._base_wire or self._overhang <= 0:
            return self._base_wire

        # Simple overhang: expand bounding box
        centroid = self._calculate_centroid()
        overhang_pts = []

        for pt in self._base_wire:
            # Vector from centroid to point
            dx = pt[0] - centroid[0]
            dy = pt[1] - centroid[1]

            # Normalize
            dist = math.sqrt(dx**2 + dy**2)
            if dist > 0:
                dx /= dist
                dy /= dist

                # Add overhang
                new_x = pt[0] + dx * self._overhang
                new_y = pt[1] + dy * self._overhang
                overhang_pts.append((new_x, new_y))
            else:
                overhang_pts.append(pt)

        return overhang_pts

    def to_dict(self) -> Dict[str, Any]:
        """Convert roof to dictionary representation"""
        return {
            "id": self.id,
            "type": self.type,
            "name": self.name,
            "properties": {
                "slope_angle": self._slope_angle,
                "overhang": self._overhang,
                "roof_type": self._roof_type.value,
                "thickness": self._thickness,
                "base_wire": self._base_wire,
                "position": self.position,
            },
            "geometry": self.get_geometry(),
            "valid": self.is_valid_wire(),
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Roof":
        """Create Roof from dictionary"""
        props = data.get("properties", {})
        roof = cls(
            name=data.get("name", "Roof"),
            slope_angle=props.get("slope_angle", 30.0),
            overhang=props.get("overhang", 300.0),
            roof_type=RoofType(props.get("roof_type", "gable")),
            thickness=props.get("thickness", 150.0),
            base_wire=props.get("base_wire"),
            position=tuple(props.get("position", [0.0, 0.0, 0.0])),
        )
        roof.id = data.get("id", roof.id)
        roof.created_at = data.get("created_at", roof.created_at)
        roof.updated_at = data.get("updated_at", roof.updated_at)
        return roof


def makeRoof(
    base_wire: List[Tuple[float, float]],
    slope_angle: float = 30.0,
    roof_type: RoofType = RoofType.GABLE,
    name: str = "Roof",
) -> Roof:
    """
    Factory function to create a Roof

    Args:
        base_wire: List of (x, y) points defining closed wire
        slope_angle: Roof slope in degrees
        roof_type: Type of roof
        name: Roof name

    Returns:
        Created Roof object
    """
    roof = Roof(
        name=name,
        slope_angle=slope_angle,
        roof_type=roof_type,
        base_wire=base_wire,
    )

    return roof
