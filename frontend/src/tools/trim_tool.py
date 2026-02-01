"""Trim tool for cutting objects at intersections."""

from typing import Optional, List, Any
from enum import Enum, auto

from core.tool import Tool, ToolConfig, ToolState
from core.geometry import Point, Line, line_intersection, point_on_line_segment


class TrimState(Enum):
    """Trim tool states."""

    IDLE = auto()
    SELECT_CUTTING = auto()
    SELECT_TRIM = auto()


class TrimTool(Tool):
    """Tool for trimming objects at cutting edges.

    Usage:
        1. Select cutting edges (lines that will cut other objects)
        2. Press Enter to confirm cutting edges
        3. Click objects to trim at intersection with cutting edges
        4. Press Escape to finish

    Modes:
        - Trim: Remove portion of object beyond cutting edge
        - Extend: Extend object to meet cutting edge

    Keyboard shortcuts:
        - T - switch to trim mode
        - E - switch to extend mode
        - Enter - confirm cutting edges
        - Escape - cancel/exit
    """

    def __init__(self):
        super().__init__(
            ToolConfig(
                name="trim",
                icon="trim",
                shortcut="TR",
                tooltip="Trim objects (TR)",
                cursor="crosshair",
            )
        )
        self.state = TrimState.IDLE
        self.cutting_edges: List[Line] = []
        self.mode: str = "trim"  # "trim" or "extend"
        self.highlighted_edges: List[Any] = []

    def reset(self) -> None:
        """Reset tool to initial state."""
        self.state = TrimState.IDLE
        self.cutting_edges.clear()
        self.mode = "trim"
        self.highlighted_edges.clear()
        self.clear_preview()

    def get_cursor(self) -> str:
        """Get cursor type."""
        return self.config.cursor

    def on_activate(self) -> None:
        """Called when tool is activated."""
        self.reset()
        self.state = TrimState.SELECT_CUTTING

    def on_deactivate(self) -> None:
        """Called when tool is deactivated."""
        self.reset()

    def on_cancel(self) -> None:
        """Called when operation is cancelled."""
        self.reset()

    def on_mouse_press(self, x: float, y: float, button: int, modifiers: dict) -> bool:
        """Handle mouse press event."""
        if button == 3:  # Right click - cancel/finish
            if self.state == TrimState.SELECT_TRIM:
                self.complete()
            else:
                self.cancel()
            return True

        if button != 1:
            return False

        point = Point(x, y)

        if self.state == TrimState.SELECT_CUTTING:
            # Add cutting edge
            # In practice, this would select a line from the canvas
            # For now, just track that we're in this state
            return True

        elif self.state == TrimState.SELECT_TRIM:
            # Trim/extend the clicked object
            self._trim_at_point(point)
            return True

        return False

    def on_key_press(self, key: str, modifiers: dict) -> bool:
        """Handle key press event."""
        if key == "escape":
            if self.state == TrimState.SELECT_TRIM:
                self.complete()
            else:
                self.cancel()
            return True

        if key == "return":
            if self.state == TrimState.SELECT_CUTTING and self.cutting_edges:
                self.state = TrimState.SELECT_TRIM
            return True

        if key == "t":
            self.mode = "trim"
            return True

        if key == "e":
            self.mode = "extend"
            return True

        return False

    def add_cutting_edge(self, line: Line) -> None:
        """Add a line as a cutting edge."""
        if line not in self.cutting_edges:
            self.cutting_edges.append(line)
            self.highlighted_edges.append(line)

    def remove_cutting_edge(self, line: Line) -> None:
        """Remove a cutting edge."""
        if line in self.cutting_edges:
            self.cutting_edges.remove(line)
            if line in self.highlighted_edges:
                self.highlighted_edges.remove(line)

    def _trim_at_point(self, point: Point) -> bool:
        """Trim object at the specified point.

        Args:
            point: Point near the object to trim

        Returns:
            True if trim was performed
        """
        # Find the closest object to trim
        # This is a simplified implementation
        # In practice, would find the object under the cursor

        # Find closest cutting edge intersection
        for edge in self.cutting_edges:
            # Would need actual object to trim here
            pass

        return False

    def _find_closest_intersection(self, line: Line) -> Optional[Point]:
        """Find closest intersection with cutting edges."""
        intersections = []

        for edge in self.cutting_edges:
            point = line_intersection(line, edge)
            if point:
                intersections.append(point)

        if intersections:
            # Return the first intersection found
            # In practice, would return closest to click point
            return intersections[0]

        return None

    def get_status_text(self) -> str:
        """Get status text for UI."""
        if self.state == TrimState.IDLE:
            return "Trim: Select cutting edges"
        elif self.state == TrimState.SELECT_CUTTING:
            mode_str = self.mode.upper()
            edges_str = f" ({len(self.cutting_edges)} edges selected)"
            return f"{mode_str}: Select cutting edges{edges_str} | Enter to confirm"
        elif self.state == TrimState.SELECT_TRIM:
            mode_str = self.mode.upper()
            return f"{mode_str}: Click objects to {self.mode.lower()} | Right-click to finish"
        return ""

    def set_mode(self, mode: str) -> None:
        """Set trim mode."""
        if mode in ["trim", "extend"]:
            self.mode = mode
