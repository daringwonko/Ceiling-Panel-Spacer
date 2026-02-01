"""
Circle Tool for BIM Workbench

Provides circle drawing functionality with radius preview and numeric input.
"""

from typing import Tuple, Optional
import math
from bim_workbench.core import Tool, ToolState, create_bim_object


class CircleTool(Tool):
    """
    Circle drawing tool with center-radius input and numeric support

    Usage:
        1. First click: Set center point
        2. Mouse move: Preview circle with radius from center to cursor
        3. Second click: Set radius point and complete circle

    Alternative:
        - While drawing, type numeric radius value and press Enter
    """

    # Minimum radius threshold
    MIN_RADIUS = 1.0

    def __init__(self):
        super().__init__("Circle", "circle")
        self.center: Optional[Tuple[float, float]] = None
        self.radius_point: Optional[Tuple[float, float]] = None
        self.radius: float = 0.0
        self.numeric_input: str = ""
        self.numeric_mode = False

    def _on_activate(self):
        """Tool activation logic"""
        self.center = None
        self.radius_point = None
        self.radius = 0.0
        self.numeric_input = ""
        self.numeric_mode = False

    def _on_deactivate(self):
        """Tool deactivation logic"""
        self.center = None
        self.radius_point = None
        self.radius = 0.0
        self.numeric_input = ""
        self.numeric_mode = False

    def _on_cancel(self):
        """Cancel operation"""
        self.center = None
        self.radius_point = None
        self.radius = 0.0
        self.numeric_input = ""
        self.numeric_mode = False

    def on_mouse_press(self, x: float, y: float, button: int = 1):
        """
        Handle mouse press

        Left click (button=1): Set center or radius point
        Right click (button=3): Cancel current operation
        """
        if button == 3:  # Right click - cancel
            if self.center is not None:
                self.cancel()
            return

        if button != 1:  # Only handle left click
            return

        if self.numeric_mode:
            # In numeric mode, click exits numeric mode
            self.numeric_mode = False
            self.numeric_input = ""
            return

        if self.center is None:
            # First click - set center point
            self.center = (x, y)
            self.state = ToolState.DRAWING
            self._update_preview(
                {
                    "type": "circle",
                    "center": self.center,
                    "radius": 0.0,
                }
            )
        else:
            # Second click - set radius point and complete
            self.radius_point = (x, y)
            self._calculate_radius()

            if self.radius >= self.MIN_RADIUS:
                self._complete_circle()
            else:
                # Radius too small, cancel
                self.cancel()

    def on_mouse_move(self, x: float, y: float, shift_pressed: bool = False):
        """
        Handle mouse move

        Updates preview circle with radius from center to cursor.
        """
        if self.center is None or self.numeric_mode:
            return

        self.radius_point = (x, y)
        self._calculate_radius()

        if self.radius >= self.MIN_RADIUS:
            self._update_preview(
                {
                    "type": "circle",
                    "center": self.center,
                    "radius": round(self.radius, 3),
                    "diameter": round(self.radius * 2, 3),
                    "circumference": round(2 * math.pi * self.radius, 3),
                    "area": round(math.pi * self.radius**2, 3),
                }
            )

    def on_key_press(self, key: str):
        """
        Handle key press

        Supports numeric input for radius when in drawing state.
        """
        if key == "Escape":
            if self.numeric_mode:
                # Exit numeric mode
                self.numeric_mode = False
                self.numeric_input = ""
            else:
                self.cancel()
        elif key == "Return" or key == "Enter":
            if self.numeric_mode and self.numeric_input:
                # Apply numeric radius
                try:
                    radius = float(self.numeric_input)
                    if radius >= self.MIN_RADIUS:
                        self.radius = radius
                        self._complete_circle()
                    else:
                        self.numeric_mode = False
                        self.numeric_input = ""
                except ValueError:
                    self.numeric_mode = False
                    self.numeric_input = ""
        elif key.isdigit() or key == ".":
            if self.state == ToolState.DRAWING:
                # Enter numeric mode
                if not self.numeric_mode:
                    self.numeric_mode = True
                    self.numeric_input = ""
                # Append digit
                if key == "." and "." in self.numeric_input:
                    return  # Only one decimal point
                self.numeric_input += key
        elif key == "Backspace":
            if self.numeric_mode and self.numeric_input:
                self.numeric_input = self.numeric_input[:-1]

    def _calculate_radius(self):
        """Calculate radius from center to radius point"""
        if self.center is None or self.radius_point is None:
            self.radius = 0.0
            return

        dx = self.radius_point[0] - self.center[0]
        dy = self.radius_point[1] - self.center[1]
        self.radius = math.sqrt(dx**2 + dy**2)

    def _complete_circle(self):
        """Complete circle creation and create BIM object"""
        if self.center is None or self.radius < self.MIN_RADIUS:
            return

        # Create BIM object
        bim_object = create_bim_object(
            obj_type="circle",
            name=f"Circle_R{int(self.radius)}",
            geometry={
                "center": {"x": self.center[0], "y": self.center[1]},
                "radius": round(self.radius, 3),
                "diameter": round(self.radius * 2, 3),
                "circumference": round(2 * math.pi * self.radius, 3),
                "area": round(math.pi * self.radius**2, 3),
            },
        )

        # Reset for next circle
        self.center = None
        self.radius_point = None
        self.radius = 0.0
        self.numeric_input = ""
        self.numeric_mode = False
        self.state = ToolState.ACTIVE

        # Complete the operation
        self._complete(bim_object)

    def get_cursor(self) -> str:
        """Get cursor shape"""
        return "crosshair_circle"

    def get_status_text(self) -> str:
        """Get status bar text"""
        if self.numeric_mode:
            return f"Circle: Radius = {self.numeric_input} (Enter to confirm, Esc to cancel)"
        elif self.state == ToolState.DRAWING:
            if self.radius > 0:
                return f"Circle: Radius = {self.radius:.1f} (or type value)"
            return "Circle: Click radius point (or type value)"
        return "Circle: Click center point"


def create_circle(
    center: Tuple[float, float], radius: float, name: Optional[str] = None
) -> dict:
    """
    Helper function to create a circle BIM object directly

    Args:
        center: Center point (x, y)
        radius: Circle radius
        name: Optional circle name

    Returns:
        BIM object dictionary
    """
    return create_bim_object(
        obj_type="circle",
        name=name or f"Circle_R{int(radius)}",
        geometry={
            "center": {"x": center[0], "y": center[1]},
            "radius": round(radius, 3),
            "diameter": round(radius * 2, 3),
            "circumference": round(2 * math.pi * radius, 3),
            "area": round(math.pi * radius**2, 3),
        },
    )
