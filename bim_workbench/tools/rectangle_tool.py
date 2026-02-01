"""
Rectangle Tool for BIM Workbench

Provides rectangle drawing functionality with square mode support.
"""

from typing import Tuple, Optional
from bim_workbench.core import Tool, ToolState, create_bim_object, normalize_rectangle


class RectangleTool(Tool):
    """
    Rectangle drawing tool with two-point input and square mode

    Usage:
        1. First click: Set first corner (anchor point)
        2. Mouse move: Preview rectangle from anchor to cursor
        3. Second click: Set opposite corner and complete rectangle

    Square Mode:
        Hold Shift to constrain to square (equal width and height)
    """

    def __init__(self):
        super().__init__("Rectangle", "rectangle")
        self.corner1: Optional[Tuple[float, float]] = None
        self.corner2: Optional[Tuple[float, float]] = None
        self.square_mode = False

    def _on_activate(self):
        """Tool activation logic"""
        self.corner1 = None
        self.corner2 = None
        self.square_mode = False

    def _on_deactivate(self):
        """Tool deactivation logic"""
        self.corner1 = None
        self.corner2 = None
        self.square_mode = False

    def _on_cancel(self):
        """Cancel operation"""
        self.corner1 = None
        self.corner2 = None
        self.square_mode = False

    def on_mouse_press(self, x: float, y: float, button: int = 1):
        """
        Handle mouse press

        Left click (button=1): Set first or second corner
        Right click (button=3): Cancel current operation
        """
        if button == 3:  # Right click - cancel
            if self.corner1 is not None:
                self.cancel()
            return

        if button != 1:  # Only handle left click
            return

        if self.corner1 is None:
            # First click - set first corner
            self.corner1 = (x, y)
            self.state = ToolState.DRAWING
            self._update_preview(
                {
                    "type": "rectangle",
                    "corner1": self.corner1,
                    "corner2": (x, y),
                    "square_mode": False,
                }
            )
        else:
            # Second click - set opposite corner and complete
            self.corner2 = (x, y)
            self._complete_rectangle()

    def on_mouse_move(self, x: float, y: float, shift_pressed: bool = False):
        """
        Handle mouse move

        Updates preview rectangle from first corner to cursor position.
        If shift_pressed, constrains to square.
        """
        if self.corner1 is None:
            return

        current_point = (x, y)
        self.square_mode = shift_pressed

        if shift_pressed:
            # Constrain to square
            dx = x - self.corner1[0]
            dy = y - self.corner1[1]

            # Use the smaller dimension to create square
            size = min(abs(dx), abs(dy))

            # Determine direction
            current_x = self.corner1[0] + (size if dx >= 0 else -size)
            current_y = self.corner1[1] + (size if dy >= 0 else -size)
            current_point = (current_x, current_y)

        self.corner2 = current_point

        # Calculate dimensions
        min_x, min_y, max_x, max_y = normalize_rectangle(
            self.corner1[0], self.corner1[1], self.corner2[0], self.corner2[1]
        )
        width = max_x - min_x
        height = max_y - min_y

        self._update_preview(
            {
                "type": "rectangle",
                "corner1": self.corner1,
                "corner2": self.corner2,
                "square_mode": shift_pressed,
                "width": round(width, 3),
                "height": round(height, 3),
                "area": round(width * height, 3),
            }
        )

    def on_key_press(self, key: str):
        """Handle key press"""
        if key == "Escape":
            self.cancel()

    def _complete_rectangle(self):
        """Complete rectangle creation and create BIM object"""
        if self.corner1 is None or self.corner2 is None:
            return

        # Normalize corners
        min_x, min_y, max_x, max_y = normalize_rectangle(
            self.corner1[0], self.corner1[1], self.corner2[0], self.corner2[1]
        )

        width = max_x - min_x
        height = max_y - min_y

        # Check for zero-size rectangle
        if width < 0.001 or height < 0.001:
            # Too small, cancel
            self.cancel()
            return

        area = width * height

        # Create BIM object
        bim_object = create_bim_object(
            obj_type="rectangle",
            name=f"Rectangle_{int(width)}x{int(height)}",
            geometry={
                "corner1": {"x": min_x, "y": min_y},
                "corner2": {"x": max_x, "y": max_y},
                "width": round(width, 3),
                "height": round(height, 3),
                "area": round(area, 3),
            },
            properties={
                "square_mode": self.square_mode,
            },
        )

        # Reset for next rectangle
        self.corner1 = None
        self.corner2 = None
        self.square_mode = False
        self.state = ToolState.ACTIVE

        # Complete the operation
        self._complete(bim_object)

    def get_cursor(self) -> str:
        """Get cursor shape"""
        return "crosshair_corner"

    def get_status_text(self) -> str:
        """Get status bar text"""
        if self.state == ToolState.DRAWING:
            return "Rectangle: Click opposite corner (Shift for square)"
        return "Rectangle: Click first corner"


def create_rectangle(
    corner1: Tuple[float, float],
    corner2: Tuple[float, float],
    name: Optional[str] = None,
) -> dict:
    """
    Helper function to create a rectangle BIM object directly

    Args:
        corner1: First corner (x, y)
        corner2: Opposite corner (x, y)
        name: Optional rectangle name

    Returns:
        BIM object dictionary
    """
    min_x, min_y, max_x, max_y = normalize_rectangle(
        corner1[0], corner1[1], corner2[0], corner2[1]
    )

    width = max_x - min_x
    height = max_y - min_y
    area = width * height

    return create_bim_object(
        obj_type="rectangle",
        name=name or f"Rectangle_{int(width)}x{int(height)}",
        geometry={
            "corner1": {"x": min_x, "y": min_y},
            "corner2": {"x": max_x, "y": max_y},
            "width": round(width, 3),
            "height": round(height, 3),
            "area": round(area, 3),
        },
    )
