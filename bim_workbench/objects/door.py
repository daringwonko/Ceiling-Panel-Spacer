"""
Door Object for BIM Workbench

Provides parametric door creation with wall-cutting capability.
"""

from typing import Optional, Dict, Any, Tuple, List
from enum import Enum
import math
import uuid
from datetime import datetime


class SwingDirection(Enum):
    """Door swing direction options"""

    LEFT = "left"
    RIGHT = "right"
    DOUBLE = "double"
    SLIDING = "sliding"


class Door:
    """
    Parametric Door object with wall integration

    Properties:
        - Width: Door width in mm (800-2000mm)
        - Height: Door height in mm (1800-2400mm)
        - SillHeight: Height from floor to door bottom (0-300mm)
        - SwingDirection: Opening direction (left/right/double/sliding)
        - HostWall: Reference to wall containing this door
    """

    def __init__(
        self,
        name: str = "Door",
        width: float = 900.0,
        height: float = 2100.0,
        sill_height: float = 0.0,
        swing_direction: SwingDirection = SwingDirection.RIGHT,
        position: Tuple[float, float, float] = (0.0, 0.0, 0.0),
        rotation: float = 0.0,
    ):
        """
        Initialize Door object

        Args:
            name: Door name
            width: Door width in mm (800-2000)
            height: Door height in mm (1800-2400)
            sill_height: Height from floor to door bottom (0-300)
            swing_direction: Door swing direction
            position: (x, y, z) position in mm
            rotation: Rotation angle in degrees around Z axis
        """
        self.id = str(uuid.uuid4())
        self.name = name
        self.type = "door"
        self.created_at = datetime.utcnow().isoformat() + "Z"
        self.updated_at = self.created_at

        # Properties with validation
        self._width = self._validate_range(width, 800, 2000, "width")
        self._height = self._validate_range(height, 1800, 2400, "height")
        self._sill_height = self._validate_range(sill_height, 0, 300, "sill_height")
        self._swing_direction = swing_direction

        # Position and orientation
        self.position = position
        self.rotation = rotation

        # Host wall reference
        self.host_wall: Optional[Dict[str, Any]] = None
        self.wall_cut_id: Optional[str] = None

        # Geometry cache
        self._geometry: Optional[Dict[str, Any]] = None
        self._swing_arc: Optional[Dict[str, Any]] = None

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
    def width(self) -> float:
        """Door width in mm"""
        return self._width

    @width.setter
    def width(self, value: float):
        self._width = self._validate_range(value, 800, 2000, "width")
        self._geometry = None  # Invalidate cache
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def height(self) -> float:
        """Door height in mm"""
        return self._height

    @height.setter
    def height(self, value: float):
        self._height = self._validate_range(value, 1800, 2400, "height")
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def sill_height(self) -> float:
        """Sill height in mm"""
        return self._sill_height

    @sill_height.setter
    def sill_height(self, value: float):
        self._sill_height = self._validate_range(value, 0, 300, "sill_height")
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def swing_direction(self) -> SwingDirection:
        """Door swing direction"""
        return self._swing_direction

    @swing_direction.setter
    def swing_direction(self, value: SwingDirection):
        self._swing_direction = value
        self._swing_arc = None  # Invalidate swing arc cache
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    def get_geometry(self) -> Dict[str, Any]:
        """
        Generate 3D door geometry

        Returns:
            Dictionary containing door frame and panel geometry
        """
        if self._geometry is not None:
            return self._geometry

        w, h = self._width, self._height
        sh = self._sill_height

        # Door frame dimensions (50mm frame width)
        frame_width = 50.0
        frame_depth = 100.0

        # Calculate frame corners
        half_w = w / 2

        # Door frame vertices (rectangular frame)
        frame_vertices = [
            # Bottom
            (-half_w, 0, sh),
            (half_w, 0, sh),
            (half_w, frame_depth, sh),
            (-half_w, frame_depth, sh),
            # Top
            (-half_w, 0, sh + h),
            (half_w, 0, sh + h),
            (half_w, frame_depth, sh + h),
            (-half_w, frame_depth, sh + h),
        ]

        # Door panel (slightly smaller than frame)
        panel_margin = frame_width
        panel_w = w - 2 * panel_margin
        panel_h = h - panel_margin  # Panel goes from sill to top
        panel_d = frame_depth / 2

        panel_vertices = [
            (-half_w + panel_margin, panel_d / 2, sh),
            (half_w - panel_margin, panel_d / 2, sh),
            (half_w - panel_margin, panel_d / 2, sh + panel_h),
            (-half_w + panel_margin, panel_d / 2, sh + panel_h),
        ]

        self._geometry = {
            "type": "door",
            "frame": {
                "vertices": frame_vertices,
                "faces": [
                    [0, 1, 2, 3],  # Bottom
                    [4, 5, 6, 7],  # Top
                    [0, 1, 5, 4],  # Front
                    [2, 3, 7, 6],  # Back
                    [0, 3, 7, 4],  # Left
                    [1, 2, 6, 5],  # Right
                ],
                "dimensions": {"width": w, "height": h, "depth": frame_depth},
            },
            "panel": {
                "vertices": panel_vertices,
                "dimensions": {"width": panel_w, "height": panel_h, "depth": panel_d},
            },
            "position": self.position,
            "rotation": self.rotation,
        }

        return self._geometry

    def get_swing_arc(self) -> Dict[str, Any]:
        """
        Generate 2D swing arc visualization

        Returns:
            Dictionary containing arc center, radius, and angles
        """
        if self._swing_arc is not None:
            return self._swing_arc

        w, h = self._width, self._height
        sh = self._sill_height

        # Swing arc is drawn at door panel height
        arc_z = sh + h * 0.5

        # Calculate arc parameters based on swing direction
        if self._swing_direction == SwingDirection.LEFT:
            # Arc swings left (counter-clockwise from door edge)
            center = (-w / 2, 0, arc_z)
            start_angle = 0
            end_angle = 90
            radius = w
        elif self._swing_direction == SwingDirection.RIGHT:
            # Arc swings right (clockwise from door edge)
            center = (w / 2, 0, arc_z)
            start_angle = 180
            end_angle = 90
            radius = w
        elif self._swing_direction == SwingDirection.DOUBLE:
            # Double door - two arcs
            center = (0, 0, arc_z)
            start_angle = 0
            end_angle = 90
            radius = w / 2
        else:  # SLIDING
            # Sliding door - no swing arc
            self._swing_arc = {"type": "none"}
            return self._swing_arc

        # Generate arc points
        num_points = 16
        arc_points = []

        for i in range(num_points + 1):
            t = i / num_points
            angle = math.radians(start_angle + (end_angle - start_angle) * t)
            x = center[0] + radius * math.cos(angle)
            y = center[1] + radius * math.sin(angle)
            arc_points.append((x, y, arc_z))

        self._swing_arc = {
            "type": "arc",
            "center": center,
            "radius": radius,
            "start_angle": start_angle,
            "end_angle": end_angle,
            "points": arc_points,
            "swing_direction": self._swing_direction.value,
        }

        return self._swing_arc

    def get_cut_volume(self) -> Dict[str, Any]:
        """
        Get the volume to cut from host wall

        Returns:
            Dictionary defining the cutting volume (slightly larger than door)
        """
        w, h = self._width, self._height
        sh = self._sill_height

        # Cutting volume is slightly larger than door (5mm tolerance)
        tolerance = 5.0
        cut_w = w + 2 * tolerance
        cut_h = h + tolerance
        cut_d = 200.0  # Deep enough to cut through wall

        half_w = cut_w / 2

        return {
            "type": "cut_volume",
            "vertices": [
                (-half_w, -cut_d / 2, sh),
                (half_w, -cut_d / 2, sh),
                (half_w, cut_d / 2, sh),
                (-half_w, cut_d / 2, sh),
                (-half_w, -cut_d / 2, sh + cut_h),
                (half_w, -cut_d / 2, sh + cut_h),
                (half_w, cut_d / 2, sh + cut_h),
                (-half_w, cut_d / 2, sh + cut_h),
            ],
            "dimensions": {"width": cut_w, "height": cut_h, "depth": cut_d},
        }

    def cut_wall(self, wall: Dict[str, Any]) -> bool:
        """
        Perform boolean cut on host wall

        Args:
            wall: Wall object dictionary containing geometry

        Returns:
            True if cut was successful
        """
        self.host_wall = wall

        # In a real implementation, this would perform a boolean cut
        # using FreeCAD Part API or similar CAD kernel
        cut_volume = self.get_cut_volume()

        # Store reference to cut operation
        self.wall_cut_id = str(uuid.uuid4())

        return True

    def to_dict(self) -> Dict[str, Any]:
        """Convert door to dictionary representation"""
        return {
            "id": self.id,
            "type": self.type,
            "name": self.name,
            "properties": {
                "width": self._width,
                "height": self._height,
                "sill_height": self._sill_height,
                "swing_direction": self._swing_direction.value,
                "position": self.position,
                "rotation": self.rotation,
            },
            "geometry": self.get_geometry(),
            "swing_arc": self.get_swing_arc(),
            "host_wall_id": self.host_wall.get("id") if self.host_wall else None,
            "wall_cut_id": self.wall_cut_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Door":
        """Create Door from dictionary"""
        props = data.get("properties", {})
        door = cls(
            name=data.get("name", "Door"),
            width=props.get("width", 900.0),
            height=props.get("height", 2100.0),
            sill_height=props.get("sill_height", 0.0),
            swing_direction=SwingDirection(props.get("swing_direction", "right")),
            position=tuple(props.get("position", [0.0, 0.0, 0.0])),
            rotation=props.get("rotation", 0.0),
        )
        door.id = data.get("id", door.id)
        door.created_at = data.get("created_at", door.created_at)
        door.updated_at = data.get("updated_at", door.updated_at)
        if data.get("host_wall_id"):
            door.host_wall = {"id": data["host_wall_id"]}
        door.wall_cut_id = data.get("wall_cut_id")
        return door


def makeDoor(
    host_wall: Optional[Dict[str, Any]] = None,
    position: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    width: float = 900.0,
    height: float = 2100.0,
    name: str = "Door",
    swing_direction: SwingDirection = SwingDirection.RIGHT,
) -> Door:
    """
    Factory function to create a Door

    Args:
        host_wall: Optional wall to place door in
        position: (x, y, z) position in mm
        width: Door width in mm
        height: Door height in mm
        name: Door name
        swing_direction: Door swing direction

    Returns:
        Created Door object
    """
    door = Door(
        name=name,
        width=width,
        height=height,
        position=position,
        swing_direction=swing_direction,
    )

    if host_wall:
        door.cut_wall(host_wall)

    return door
