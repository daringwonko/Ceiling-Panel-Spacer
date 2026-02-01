"""
Line Tool for BIM Workbench

Provides line drawing functionality with ortho mode support.
"""

from typing import Tuple, Optional
import math
from bim_workbench.core import (
    Tool,
    ToolState,
    create_bim_object,
    distance,
    snap_to_angle,
)


class LineTool(Tool):
    """
    Line drawing tool with two-point input and ortho mode

    Usage:
        1. First click: Set start point
        2. Mouse move: Preview line from start to cursor
        3. Second click: Set end point and complete line

    Ortho Mode:
        Hold Shift to constrain line to horizontal or vertical
    """

    def __init__(self):
        super().__init__("Line", "line")
        self.start_point: Optional[Tuple[float, float]] = None
        self.end_point: Optional[Tuple[float, float]] = None
        self.ortho_active = False

    def _on_activate(self):
        """Tool activation logic"""
        self.start_point = None
        self.end_point = None
        self.ortho_active = False

    def _on_deactivate(self):
        """Tool deactivation logic"""
        self.start_point = None
        self.end_point = None
        self.ortho_active = False

    def _on_cancel(self):
        """Cancel operation"""
        self.start_point = None
        self.end_point = None
        self.ortho_active = False

    def on_mouse_press(self, x: float, y: float, button: int = 1):
        """
        Handle mouse press

        Left click (button=1): Set start or end point
        Right click (button=3): Cancel current operation
        """
        if button == 3:  # Right click - cancel
            if self.start_point is not None:
                self.cancel()
            return

        if button != 1:  # Only handle left click
            return

        if self.start_point is None:
            # First click - set start point
            self.start_point = (x, y)
            self.state = ToolState.DRAWING
            self._update_preview(
                {
                    "type": "line",
                    "start": self.start_point,
                    "end": (x, y),
                    "ortho": False,
                }
            )
        else:
            # Second click - set end point and complete
            self.end_point = (x, y)
            self._complete_line()

    def on_mouse_move(self, x: float, y: float, shift_pressed: bool = False):
        """
        Handle mouse move

        Updates preview line from start point to cursor position.
        If shift_pressed, constrains to ortho (horizontal/vertical).
        """
        if self.start_point is None:
            return

        current_point = (x, y)
        self.ortho_active = shift_pressed

        if shift_pressed:
            # Constrain to horizontal or vertical (whichever is closer)
            dx = abs(x - self.start_point[0])
            dy = abs(y - self.start_point[1])

            if dx > dy:
                # Horizontal - keep y same as start
                current_point = (x, self.start_point[1])
            else:
                # Vertical - keep x same as start
                current_point = (self.start_point[0], y)

        self.end_point = current_point

        self._update_preview(
            {
                "type": "line",
                "start": self.start_point,
                "end": self.end_point,
                "ortho": shift_pressed,
                "length": distance(self.start_point, self.end_point),
            }
        )

    def on_key_press(self, key: str):
        """Handle key press"""
        if key == "Escape":
            self.cancel()

    def _complete_line(self):
        """Complete line creation and create BIM object"""
        if self.start_point is None or self.end_point is None:
            return

        # Calculate line properties
        length = distance(self.start_point, self.end_point)

        # Calculate angle
        dx = self.end_point[0] - self.start_point[0]
        dy = self.end_point[1] - self.start_point[1]
        angle = math.degrees(math.atan2(dy, dx))

        # Create BIM object
        bim_object = create_bim_object(
            obj_type="line",
            name=f"Line_{int(length)}",
            geometry={
                "start_point": {
                    "x": self.start_point[0],
                    "y": self.start_point[1],
                },
                "end_point": {
                    "x": self.end_point[0],
                    "y": self.end_point[1],
                },
                "length": round(length, 3),
                "angle": round(angle, 3),
            },
            properties={
                "ortho_mode": self.ortho_active,
            },
        )

        # Reset for next line
        self.start_point = None
        self.end_point = None
        self.ortho_active = False
        self.state = ToolState.ACTIVE

        # Complete the operation
        self._complete(bim_object)

    def get_cursor(self) -> str:
        """Get cursor shape"""
        return "crosshair"

    def get_status_text(self) -> str:
        """Get status bar text"""
        if self.state == ToolState.DRAWING:
            return "Line: Click end point (Shift for ortho)"
        return "Line: Click start point"


def create_line(
    start: Tuple[float, float], end: Tuple[float, float], name: Optional[str] = None
) -> dict:
    """
    Helper function to create a line BIM object directly

    Args:
        start: Start point (x, y)
        end: End point (x, y)
        name: Optional line name

    Returns:
        BIM object dictionary
    """
    length = distance(start, end)

    dx = end[0] - start[0]
    dy = end[1] - start[1]
    angle = math.degrees(math.atan2(dy, dx))

    return create_bim_object(
        obj_type="line",
        name=name or f"Line_{int(length)}",
        geometry={
            "start_point": {"x": start[0], "y": start[1]},
            "end_point": {"x": end[0], "y": end[1]},
            "length": round(length, 3),
            "angle": round(angle, 3),
        },
    )
