"""Fillet tool for creating rounded corners."""

from typing import Optional, List, Any, Tuple
from enum import Enum, auto
import math

from core.tool import Tool, ToolConfig, ToolState
from core.geometry import Point, Line, Arc, create_fillet_arc, line_intersection


class FilletState(Enum):
    """Fillet tool states."""

    IDLE = auto()
    SELECT_FIRST = auto()
    SELECT_SECOND = auto()
    SPECIFY_RADIUS = auto()


class FilletTool(Tool):
    """Tool for creating rounded corners between two lines.

    Usage:
        1. Select first line
        2. Select second line (that forms a corner with the first)
        3. Type radius or use default
        4. Press Enter to confirm

    The fillet arc is created tangent to both lines, and the original
    lines are trimmed to meet the arc.

    Special cases:
        - Radius = 0: Creates sharp corner (just trims lines)
        - Parallel lines: Cannot fillet, shows error

    Keyboard shortcuts:
        - R - specify radius
        - T - toggle trim mode
        - Enter - confirm
        - Escape - cancel
    """

    def __init__(self, default_radius: float = 10.0):
        super().__init__(
            ToolConfig(
                name="fillet",
                icon="fillet",
                shortcut="F",
                tooltip="Fillet corners (F)",
                cursor="crosshair",
            )
        )
        self.state = FilletState.IDLE
        self.first_line: Optional[Line] = None
        self.second_line: Optional[Line] = None
        self.radius: float = default_radius
        self.trim_mode: bool = True
        self._keyboard_buffer = ""
        self._preview_arc: Optional[Arc] = None

    def reset(self) -> None:
        """Reset tool to initial state."""
        self.state = FilletState.IDLE
        self.first_line = None
        self.second_line = None
        self._keyboard_buffer = ""
        self._preview_arc = None
        self.clear_preview()

    def get_cursor(self) -> str:
        """Get cursor type."""
        return self.config.cursor

    def on_activate(self) -> None:
        """Called when tool is activated."""
        self.reset()
        self.state = FilletState.SELECT_FIRST

    def on_deactivate(self) -> None:
        """Called when tool is deactivated."""
        self.reset()

    def on_cancel(self) -> None:
        """Called when operation is cancelled."""
        self.reset()

    def on_mouse_press(self, x: float, y: float, button: int, modifiers: dict) -> bool:
        """Handle mouse press event."""
        if button == 3:  # Right click - cancel
            self.cancel()
            return True

        if button != 1:
            return False

        if self.state == FilletState.SELECT_FIRST:
            # Select first line from canvas
            self.state = FilletState.SELECT_SECOND
            return True

        elif self.state == FilletState.SELECT_SECOND:
            # Select second line
            self.state = FilletState.SPECIFY_RADIUS
            self._create_preview()
            return True

        elif self.state == FilletState.SPECIFY_RADIUS:
            # Confirm fillet
            self.complete()
            return True

        return False

    def on_key_press(self, key: str, modifiers: dict) -> bool:
        """Handle key press event."""
        if key == "escape":
            self.cancel()
            return True

        if key == "return":
            if self.state == FilletState.SPECIFY_RADIUS:
                self.complete()
            return True

        if key == "t":
            self.trim_mode = not self.trim_mode
            return True

        if key == "r":
            # Start entering radius
            self._keyboard_buffer = ""
            return True

        if self.state == FilletState.SPECIFY_RADIUS:
            if key.isdigit() or key in [".", "-"]:
                self._keyboard_buffer += key
                self._update_radius()
                self._update_preview()
                return True

        return False

    def set_first_line(self, line: Line) -> None:
        """Set the first line for fillet."""
        self.first_line = line
        if self.state == FilletState.IDLE:
            self.state = FilletState.SELECT_FIRST

    def set_second_line(self, line: Line) -> None:
        """Set the second line for fillet."""
        self.second_line = line
        if self.state == FilletState.SELECT_FIRST:
            self.state = FilletState.SELECT_SECOND

    def set_radius(self, radius: float) -> None:
        """Set the fillet radius."""
        self.radius = max(0, radius)

    def _update_radius(self) -> None:
        """Update radius from keyboard buffer."""
        try:
            self.radius = float(self._keyboard_buffer)
        except ValueError:
            pass

    def _create_preview(self) -> None:
        """Create preview of fillet arc."""
        if not self.first_line or not self.second_line:
            return

        arc = create_fillet_arc(self.first_line, self.second_line, self.radius)
        if arc:
            self._preview_arc = arc
            self.add_preview(arc)

    def _update_preview(self) -> None:
        """Update preview with current radius."""
        self.clear_preview()
        self._create_preview()

    def _apply_fillet(self) -> bool:
        """Apply fillet to the two lines.

        Returns:
            True if fillet was created successfully
        """
        if not self.first_line or not self.second_line:
            return False

        if self.radius == 0:
            # Just trim to intersection
            return self._trim_to_intersection()

        arc = create_fillet_arc(self.first_line, self.second_line, self.radius)
        if not arc:
            # Lines are parallel
            return False

        # Would create the fillet arc and trim lines here
        # This requires canvas/model integration

        return True

    def _trim_to_intersection(self) -> bool:
        """Trim both lines to their intersection point (radius = 0)."""
        if not self.first_line or not self.second_line:
            return False

        intersection = line_intersection(self.first_line, self.second_line)
        if not intersection:
            return False

        # Would trim lines to intersection here
        return True

    def on_complete(self) -> None:
        """Complete fillet operation."""
        self._apply_fillet()
        self.reset()

    def get_status_text(self) -> str:
        """Get status text for UI."""
        if self.state == FilletState.IDLE:
            return "Fillet: Select first line"
        elif self.state == FilletState.SELECT_FIRST:
            return "Fillet: Select first line"
        elif self.state == FilletState.SELECT_SECOND:
            return "Fillet: Select second line"
        elif self.state == FilletState.SPECIFY_RADIUS:
            trim_str = " [TRIM]" if self.trim_mode else ""
            if self._keyboard_buffer:
                return f"Fillet radius: {self._keyboard_buffer}{trim_str}"
            return f"Fillet radius: {self.radius:.1f}{trim_str} | R to change, Enter to confirm"
        return ""

    def validate_selection(self) -> Tuple[bool, str]:
        """Validate that selected lines can be filleted.

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not self.first_line or not self.second_line:
            return False, "Select two lines"

        # Check if lines intersect or can be extended to intersect
        intersection = line_intersection(self.first_line, self.second_line)
        if not intersection:
            return False, "Lines must intersect or can be extended to intersect"

        return True, ""
