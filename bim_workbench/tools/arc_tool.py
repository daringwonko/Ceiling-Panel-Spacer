"""
Arc Tool for BIM Workbench

Provides arc drawing functionality with three-point input.
"""

from typing import Tuple, Optional
import math
from bim_workbench.core import Tool, ToolState, create_bim_object


class ArcTool(Tool):
    """
    Arc drawing tool with three-point input (center, start, end)

    Usage:
        1. First click: Set center point
        2. Second click: Set start point (defines radius and start angle)
        3. Mouse move: Preview arc from start angle to cursor
        4. Third click: Set end point (defines aperture/end angle)

    Direction:
        Arc is drawn counter-clockwise (CCW) from start to end by default.
        Hold Ctrl to reverse direction (clockwise).
    """

    def __init__(self):
        super().__init__("Arc", "arc")
        self.center: Optional[Tuple[float, float]] = None
        self.start_point: Optional[Tuple[float, float]] = None
        self.end_point: Optional[Tuple[float, float]] = None
        self.radius: float = 0.0
        self.start_angle: float = 0.0
        self.end_angle: float = 0.0
        self.aperture: float = 0.0
        self.ctrl_pressed = False

    def _on_activate(self):
        """Tool activation logic"""
        self._reset_state()

    def _on_deactivate(self):
        """Tool deactivation logic"""
        self._reset_state()

    def _on_cancel(self):
        """Cancel operation - go back one state or reset"""
        if self.start_point is not None:
            # Go back to waiting for start point
            self.start_point = None
            self.end_point = None
            self.state = ToolState.DRAWING
        elif self.center is not None:
            # Go back to idle
            self._reset_state()

    def _reset_state(self):
        """Reset all state variables"""
        self.center = None
        self.start_point = None
        self.end_point = None
        self.radius = 0.0
        self.start_angle = 0.0
        self.end_angle = 0.0
        self.aperture = 0.0
        self.ctrl_pressed = False

    def on_mouse_press(self, x: float, y: float, button: int = 1):
        """
        Handle mouse press

        Left click (button=1): Set center, start, or end point
        Right click (button=3): Cancel/go back one step
        """
        if button == 3:  # Right click - cancel/go back
            self._on_cancel()
            return

        if button != 1:  # Only handle left click
            return

        if self.center is None:
            # State 0 -> State 1: Set center
            self.center = (x, y)
            self.state = ToolState.DRAWING
            self._update_preview(
                {
                    "type": "arc",
                    "center": self.center,
                    "radius": 0.0,
                    "state": 1,
                }
            )
        elif self.start_point is None:
            # State 1 -> State 2: Set start point
            self.start_point = (x, y)
            self._calculate_radius_and_start_angle()
            self._update_preview(
                {
                    "type": "arc",
                    "center": self.center,
                    "start_point": self.start_point,
                    "radius": round(self.radius, 3),
                    "start_angle": round(self.start_angle, 3),
                    "state": 2,
                }
            )
        else:
            # State 2 -> Complete: Set end point
            self.end_point = (x, y)
            self._calculate_end_angle()
            self._complete_arc()

    def on_mouse_move(self, x: float, y: float, shift_pressed: bool = False):
        """
        Handle mouse move

        Updates preview based on current state.
        """
        if self.center is None:
            return

        if self.start_point is None:
            # Showing radius preview
            temp_point = (x, y)
            dx = temp_point[0] - self.center[0]
            dy = temp_point[1] - self.center[1]
            radius = math.sqrt(dx**2 + dy**2)

            self._update_preview(
                {
                    "type": "arc",
                    "center": self.center,
                    "radius": round(radius, 3),
                    "state": 1,
                }
            )
        else:
            # Showing arc preview
            self.end_point = (x, y)
            self._calculate_end_angle()

            # Calculate arc length
            arc_length = self.radius * math.radians(abs(self.aperture))

            self._update_preview(
                {
                    "type": "arc",
                    "center": self.center,
                    "start_point": self.start_point,
                    "end_point": self.end_point,
                    "radius": round(self.radius, 3),
                    "start_angle": round(self.start_angle, 3),
                    "end_angle": round(self.end_angle, 3),
                    "aperture": round(self.aperture, 3),
                    "arc_length": round(arc_length, 3),
                    "ccw": not self.ctrl_pressed,
                    "state": 2,
                }
            )

    def on_key_press(self, key: str):
        """Handle key press"""
        if key == "Escape":
            self._on_cancel()
        elif key == "Control_L" or key == "Control_R":
            self.ctrl_pressed = True
        elif key == "Control":
            self.ctrl_pressed = True

    def _calculate_radius_and_start_angle(self):
        """Calculate radius and start angle from center and start point"""
        if self.center is None or self.start_point is None:
            return

        dx = self.start_point[0] - self.center[0]
        dy = self.start_point[1] - self.center[1]

        self.radius = math.sqrt(dx**2 + dy**2)
        self.start_angle = math.degrees(math.atan2(dy, dx))

        # Normalize to 0-360
        if self.start_angle < 0:
            self.start_angle += 360

    def _calculate_end_angle(self):
        """Calculate end angle and aperture from center and end point"""
        if self.center is None or self.end_point is None:
            return

        dx = self.end_point[0] - self.center[0]
        dy = self.end_point[1] - self.center[1]

        self.end_angle = math.degrees(math.atan2(dy, dx))

        # Normalize to 0-360
        if self.end_angle < 0:
            self.end_angle += 360

        # Calculate aperture (CCW by default)
        self.aperture = self.end_angle - self.start_angle

        # Normalize aperture to 0-360
        if self.aperture < 0:
            self.aperture += 360

        # If Ctrl is pressed, reverse direction (CW)
        if self.ctrl_pressed:
            self.aperture = 360 - self.aperture
            # Swap start and end for storage (always store CCW)
            self.start_angle, self.end_angle = self.end_angle, self.start_angle

    def _complete_arc(self):
        """Complete arc creation and create BIM object"""
        if self.center is None or self.start_point is None or self.end_point is None:
            return

        if self.radius < 0.001:
            # Radius too small
            self._reset_state()
            return

        # Calculate arc length
        arc_length = self.radius * math.radians(self.aperture)

        # Create BIM object
        bim_object = create_bim_object(
            obj_type="arc",
            name=f"Arc_R{int(self.radius)}_{int(self.aperture)}deg",
            geometry={
                "center": {"x": self.center[0], "y": self.center[1]},
                "radius": round(self.radius, 3),
                "start_angle": round(self.start_angle, 3),
                "end_angle": round(self.end_angle, 3),
                "aperture": round(self.aperture, 3),
                "arc_length": round(arc_length, 3),
                "start_point": {"x": self.start_point[0], "y": self.start_point[1]},
                "end_point": {"x": self.end_point[0], "y": self.end_point[1]},
            },
            properties={
                "counter_clockwise": True,
            },
        )

        # Reset for next arc
        self._reset_state()

        # Complete the operation
        self._complete(bim_object)

    def get_cursor(self) -> str:
        """Get cursor shape"""
        return "crosshair_arc"

    def get_status_text(self) -> str:
        """Get status bar text"""
        if self.start_point is not None:
            return "Arc: Click end point (Ctrl for CW direction)"
        elif self.center is not None:
            return "Arc: Click start point on circumference"
        return "Arc: Click center point"


def create_arc(
    center: Tuple[float, float],
    radius: float,
    start_angle: float,
    aperture: float,
    name: Optional[str] = None,
) -> dict:
    """
    Helper function to create an arc BIM object directly

    Args:
        center: Center point (x, y)
        radius: Arc radius
        start_angle: Start angle in degrees (0 = positive X axis)
        aperture: Arc aperture/angle in degrees (CCW positive)
        name: Optional arc name

    Returns:
        BIM object dictionary
    """
    # Calculate end angle
    end_angle = start_angle + aperture

    # Calculate start and end points
    start_x = center[0] + radius * math.cos(math.radians(start_angle))
    start_y = center[1] + radius * math.sin(math.radians(start_angle))
    end_x = center[0] + radius * math.cos(math.radians(end_angle))
    end_y = center[1] + radius * math.sin(math.radians(end_angle))

    # Calculate arc length
    arc_length = radius * math.radians(abs(aperture))

    return create_bim_object(
        obj_type="arc",
        name=name or f"Arc_R{int(radius)}_{int(aperture)}deg",
        geometry={
            "center": {"x": center[0], "y": center[1]},
            "radius": round(radius, 3),
            "start_angle": round(start_angle, 3),
            "end_angle": round(end_angle, 3),
            "aperture": round(aperture, 3),
            "arc_length": round(arc_length, 3),
            "start_point": {"x": start_x, "y": start_y},
            "end_point": {"x": end_x, "y": end_y},
        },
    )
