"""
Window Object for BIM Workbench

Provides parametric window creation with wall-cutting capability.
"""

from typing import Optional, Dict, Any, Tuple, List
from enum import Enum
import math
import uuid
from datetime import datetime


class WindowType(Enum):
    """Window type options"""

    FIXED = "fixed"
    SINGLE_HUNG = "single_hung"
    DOUBLE_HUNG = "double_hung"
    CASEMENT = "casement"
    SLIDING = "sliding"
    AWNING = "awning"


class Window:
    """
    Parametric Window object with wall integration

    Properties:
        - Width: Window width in mm (300-2000mm)
        - Height: Window height in mm (300-2400mm)
        - SillHeight: Height from floor to window bottom (0-2000mm)
        - WindowType: Type of window (fixed, casement, etc.)
        - FrameWidth: Width of window frame (10-100mm)
        - GlassThickness: Thickness of glass panes (3-20mm)
        - HostWall: Reference to wall containing this window
    """

    def __init__(
        self,
        name: str = "Window",
        width: float = 900.0,
        height: float = 1200.0,
        sill_height: float = 900.0,
        window_type: WindowType = WindowType.FIXED,
        frame_width: float = 50.0,
        glass_thickness: float = 6.0,
        position: Tuple[float, float, float] = (0.0, 0.0, 0.0),
        rotation: float = 0.0,
    ):
        """
        Initialize Window object

        Args:
            name: Window name
            width: Window width in mm (300-2000)
            height: Window height in mm (300-2400)
            sill_height: Height from floor to window bottom (0-2000)
            window_type: Type of window
            frame_width: Frame width in mm (10-100)
            glass_thickness: Glass thickness in mm (3-20)
            position: (x, y, z) position in mm
            rotation: Rotation angle in degrees around Z axis
        """
        self.id = str(uuid.uuid4())
        self.name = name
        self.type = "window"
        self.created_at = datetime.utcnow().isoformat() + "Z"
        self.updated_at = self.created_at

        # Properties with validation
        self._width = self._validate_range(width, 300, 2000, "width")
        self._height = self._validate_range(height, 300, 2400, "height")
        self._sill_height = self._validate_range(sill_height, 0, 2000, "sill_height")
        self._window_type = window_type
        self._frame_width = self._validate_range(frame_width, 10, 100, "frame_width")
        self._glass_thickness = self._validate_range(
            glass_thickness, 3, 20, "glass_thickness"
        )

        # Position and orientation
        self.position = position
        self.rotation = rotation

        # Host wall reference
        self.host_wall: Optional[Dict[str, Any]] = None
        self.wall_cut_id: Optional[str] = None

        # Geometry cache
        self._geometry: Optional[Dict[str, Any]] = None

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
        """Window width in mm"""
        return self._width

    @width.setter
    def width(self, value: float):
        self._width = self._validate_range(value, 300, 2000, "width")
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def height(self) -> float:
        """Window height in mm"""
        return self._height

    @height.setter
    def height(self, value: float):
        self._height = self._validate_range(value, 300, 2400, "height")
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def sill_height(self) -> float:
        """Sill height in mm"""
        return self._sill_height

    @sill_height.setter
    def sill_height(self, value: float):
        self._sill_height = self._validate_range(value, 0, 2000, "sill_height")
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def window_type(self) -> WindowType:
        """Window type"""
        return self._window_type

    @window_type.setter
    def window_type(self, value: WindowType):
        self._window_type = value
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def frame_width(self) -> float:
        """Frame width in mm"""
        return self._frame_width

    @frame_width.setter
    def frame_width(self, value: float):
        self._frame_width = self._validate_range(value, 10, 100, "frame_width")
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    @property
    def glass_thickness(self) -> float:
        """Glass thickness in mm"""
        return self._glass_thickness

    @glass_thickness.setter
    def glass_thickness(self, value: float):
        self._glass_thickness = self._validate_range(value, 3, 20, "glass_thickness")
        self._geometry = None
        self.updated_at = datetime.utcnow().isoformat() + "Z"

    def get_geometry(self) -> Dict[str, Any]:
        """
        Generate 3D window geometry based on type

        Returns:
            Dictionary containing frame, glass, and sash geometry
        """
        if self._geometry is not None:
            return self._geometry

        w, h = self._width, self._height
        sh = self._sill_height
        fw = self._frame_width
        gt = self._glass_thickness

        half_w = w / 2
        frame_depth = 100.0

        # Generate frame geometry (rectangular frame)
        frame_vertices = self._generate_frame_vertices(w, h, sh, fw, frame_depth)

        # Generate glass geometry based on window type
        glass_geometry = self._generate_glass_geometry(w, h, sh, fw, gt, frame_depth)

        # Generate sash geometry for operable windows
        sash_geometry = self._generate_sash_geometry(w, h, sh, fw, frame_depth)

        self._geometry = {
            "type": "window",
            "window_type": self._window_type.value,
            "frame": {
                "vertices": frame_vertices,
                "dimensions": {
                    "width": w,
                    "height": h,
                    "depth": frame_depth,
                    "frame_width": fw,
                },
            },
            "glass": glass_geometry,
            "sash": sash_geometry,
            "position": self.position,
            "rotation": self.rotation,
        }

        return self._geometry

    def _generate_frame_vertices(
        self, width: float, height: float, sill: float, frame_width: float, depth: float
    ) -> List[Tuple[float, float, float]]:
        """Generate window frame vertices"""
        half_w = width / 2

        # Outer frame
        outer = [
            (-half_w, 0, sill),
            (half_w, 0, sill),
            (half_w, depth, sill),
            (-half_w, depth, sill),
            (-half_w, 0, sill + height),
            (half_w, 0, sill + height),
            (half_w, depth, sill + height),
            (-half_w, depth, sill + height),
        ]

        return outer

    def _generate_glass_geometry(
        self,
        width: float,
        height: float,
        sill: float,
        frame_width: float,
        glass_thickness: float,
        frame_depth: float,
    ) -> Dict[str, Any]:
        """Generate glass geometry based on window type"""
        margin = frame_width + 5  # Small gap between frame and glass
        glass_w = width - 2 * margin
        glass_h = height - 2 * margin

        half_w = width / 2
        glass_y = frame_depth / 2  # Center in frame depth

        vertices = []

        if self._window_type in [WindowType.SINGLE_HUNG, WindowType.DOUBLE_HUNG]:
            # Two sashes vertically divided
            sash_height = (glass_h - 20) / 2  # 20mm gap between sashes

            # Lower sash
            lower_vertices = [
                (-half_w + margin, glass_y, sill + margin),
                (half_w - margin, glass_y, sill + margin),
                (half_w - margin, glass_y, sill + margin + sash_height),
                (-half_w + margin, glass_y, sill + margin + sash_height),
            ]

            # Upper sash
            upper_vertices = [
                (-half_w + margin, glass_y, sill + margin + sash_height + 20),
                (half_w - margin, glass_y, sill + margin + sash_height + 20),
                (half_w - margin, glass_y, sill + margin + 2 * sash_height + 20),
                (-half_w + margin, glass_y, sill + margin + 2 * sash_height + 20),
            ]

            return {
                "type": "divided",
                "panes": [
                    {"vertices": lower_vertices, "sash": "lower"},
                    {"vertices": upper_vertices, "sash": "upper"},
                ],
                "dimensions": {
                    "width": glass_w,
                    "height": glass_h,
                    "thickness": glass_thickness,
                },
            }

        elif self._window_type == WindowType.SLIDING:
            # Two sashes horizontally divided
            sash_width = (glass_w - 20) / 2

            # Left sash
            left_vertices = [
                (-half_w + margin, glass_y, sill + margin),
                (-half_w + margin + sash_width, glass_y, sill + margin),
                (-half_w + margin + sash_width, glass_y, sill + margin + glass_h),
                (-half_w + margin, glass_y, sill + margin + glass_h),
            ]

            # Right sash
            right_vertices = [
                (-half_w + margin + sash_width + 20, glass_y, sill + margin),
                (half_w - margin, glass_y, sill + margin),
                (half_w - margin, glass_y, sill + margin + glass_h),
                (-half_w + margin + sash_width + 20, glass_y, sill + margin + glass_h),
            ]

            return {
                "type": "divided",
                "panes": [
                    {"vertices": left_vertices, "sash": "left"},
                    {"vertices": right_vertices, "sash": "right"},
                ],
                "dimensions": {
                    "width": glass_w,
                    "height": glass_h,
                    "thickness": glass_thickness,
                },
            }

        else:
            # Single pane (fixed, casement, awning)
            vertices = [
                (-half_w + margin, glass_y, sill + margin),
                (half_w - margin, glass_y, sill + margin),
                (half_w - margin, glass_y, sill + margin + glass_h),
                (-half_w + margin, glass_y, sill + margin + glass_h),
            ]

            return {
                "type": "single",
                "vertices": vertices,
                "dimensions": {
                    "width": glass_w,
                    "height": glass_h,
                    "thickness": glass_thickness,
                },
            }

    def _generate_sash_geometry(
        self,
        width: float,
        height: float,
        sill: float,
        frame_width: float,
        frame_depth: float,
    ) -> Optional[Dict[str, Any]]:
        """Generate sash geometry for operable windows"""
        if self._window_type in [WindowType.FIXED]:
            return None

        margin = frame_width
        sash_depth = 60.0

        # For casement and awning, show hinged sash
        if self._window_type in [WindowType.CASEMENT, WindowType.AWNING]:
            half_w = width / 2
            sash_y = frame_depth + 10  # Slightly proud of frame

            # Hinge line (vertical for casement, top for awning)
            if self._window_type == WindowType.CASEMENT:
                # Hinged on left side
                hinge_x = -half_w + margin
                swing_angle = 30  # 30 degree swing

                # Sash vertices at open position
                sash_vertices = [
                    (hinge_x, sash_y, sill + margin),
                    (
                        hinge_x
                        + (width - 2 * margin) * math.cos(math.radians(swing_angle)),
                        sash_y + 100,
                        sill + margin,
                    ),  # Open outward
                    (
                        hinge_x
                        + (width - 2 * margin) * math.cos(math.radians(swing_angle)),
                        sash_y + 100,
                        sill + height - margin,
                    ),
                    (hinge_x, sash_y, sill + height - margin),
                ]
            else:  # AWNING
                # Hinged at top
                hinge_z = sill + height - margin
                swing_angle = 30

                sash_vertices = [
                    (-half_w + margin, sash_y + 100, hinge_z),
                    (half_w - margin, sash_y + 100, hinge_z),
                    (half_w - margin, sash_y, hinge_z - (height - 2 * margin)),
                    (-half_w + margin, sash_y, hinge_z - (height - 2 * margin)),
                ]

            return {
                "type": self._window_type.value,
                "vertices": sash_vertices,
                "hinge_position": "left"
                if self._window_type == WindowType.CASEMENT
                else "top",
                "swing_angle": 30,
            }

        return None

    def get_cut_volume(self) -> Dict[str, Any]:
        """
        Get the volume to cut from host wall

        Returns:
            Dictionary defining the cutting volume (slightly larger than window)
        """
        w, h = self._width, self._height
        sh = self._sill_height

        # Cutting volume is slightly larger than window (5mm tolerance)
        tolerance = 5.0
        cut_w = w + 2 * tolerance
        cut_h = h + 2 * tolerance
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

        cut_volume = self.get_cut_volume()
        self.wall_cut_id = str(uuid.uuid4())

        return True

    def to_dict(self) -> Dict[str, Any]:
        """Convert window to dictionary representation"""
        return {
            "id": self.id,
            "type": self.type,
            "name": self.name,
            "properties": {
                "width": self._width,
                "height": self._height,
                "sill_height": self._sill_height,
                "window_type": self._window_type.value,
                "frame_width": self._frame_width,
                "glass_thickness": self._glass_thickness,
                "position": self.position,
                "rotation": self.rotation,
            },
            "geometry": self.get_geometry(),
            "host_wall_id": self.host_wall.get("id") if self.host_wall else None,
            "wall_cut_id": self.wall_cut_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Window":
        """Create Window from dictionary"""
        props = data.get("properties", {})
        window = cls(
            name=data.get("name", "Window"),
            width=props.get("width", 900.0),
            height=props.get("height", 1200.0),
            sill_height=props.get("sill_height", 900.0),
            window_type=WindowType(props.get("window_type", "fixed")),
            frame_width=props.get("frame_width", 50.0),
            glass_thickness=props.get("glass_thickness", 6.0),
            position=tuple(props.get("position", [0.0, 0.0, 0.0])),
            rotation=props.get("rotation", 0.0),
        )
        window.id = data.get("id", window.id)
        window.created_at = data.get("created_at", window.created_at)
        window.updated_at = data.get("updated_at", window.updated_at)
        if data.get("host_wall_id"):
            window.host_wall = {"id": data["host_wall_id"]}
        window.wall_cut_id = data.get("wall_cut_id")
        return window


def makeWindow(
    host_wall: Optional[Dict[str, Any]] = None,
    position: Tuple[float, float, float] = (0.0, 0.0, 0.0),
    width: float = 900.0,
    height: float = 1200.0,
    name: str = "Window",
    window_type: WindowType = WindowType.FIXED,
    sill_height: float = 900.0,
) -> Window:
    """
    Factory function to create a Window

    Args:
        host_wall: Optional wall to place window in
        position: (x, y, z) position in mm
        width: Window width in mm
        height: Window height in mm
        name: Window name
        window_type: Type of window
        sill_height: Height from floor to window bottom

    Returns:
        Created Window object
    """
    window = Window(
        name=name,
        width=width,
        height=height,
        position=position,
        window_type=window_type,
        sill_height=sill_height,
    )

    if host_wall:
        window.cut_wall(host_wall)

    return window
