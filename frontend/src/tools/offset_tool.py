"""Offset tool for creating parallel copies."""

from typing import Optional, List, Any
from enum import Enum, auto

from core.tool import Tool, ToolConfig, ToolState
from core.geometry import Point, Line, offset_line


class OffsetState(Enum):
    """Offset tool states."""

    IDLE = auto()
    SELECT_OBJECT = auto()
    SPECIFY_SIDE = auto()
    SPECIFY_DISTANCE = auto()


class OffsetTool(Tool):
    """Tool for creating parallel copies of objects at a distance.

    Usage:
        1. Select object to offset (line, polyline, circle)
        2. Click to specify side (left/right or inside/outside)
        3. Type distance or click to specify offset amount
        4. Press Enter to confirm

    Options:
        - Delete original: Remove source object after offset
        - Multiple: Create multiple offset copies

    Keyboard shortcuts:
        - D - toggle delete original
        - M - toggle multiple mode
        - Enter - confirm
        - Escape - cancel
    """

    def __init__(self):
        super().__init__(
            ToolConfig(
                name="offset",
                icon="offset",
                shortcut="O",
                tooltip="Offset objects (O)",
                cursor="crosshair",
            )
        )
        self.state = OffsetState.IDLE
        self.selected_object: Optional[Any] = None
        self.side: Optional[str] = None  # "left", "right", "inside", "outside"
        self.distance: float = 10.0
        self.delete_original: bool = False
        self.multiple_mode: bool = False
        self._keyboard_buffer = ""
        self._preview_object: Optional[Any] = None
        self._offset_objects: List[Any] = []

    def reset(self) -> None:
        """Reset tool to initial state."""
        self.state = OffsetState.IDLE
        self.selected_object = None
        self.side = None
        self.distance = 10.0
        self.delete_original = False
        self.multiple_mode = False
        self._keyboard_buffer = ""
        self._preview_object = None
        self._offset_objects.clear()
        self.clear_preview()

    def get_cursor(self) -> str:
        """Get cursor type."""
        return self.config.cursor

    def on_activate(self) -> None:
        """Called when tool is activated."""
        self.reset()

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

        point = Point(x, y)

        if self.state == OffsetState.IDLE:
            self.state = OffsetState.SELECT_OBJECT
            return True

        elif self.state == OffsetState.SELECT_OBJECT:
            # Object would be selected from canvas here
            self.state = OffsetState.SPECIFY_SIDE
            return True

        elif self.state == OffsetState.SPECIFY_SIDE:
            # Determine side based on click position
            self.side = self._determine_side(point)
            self.state = OffsetState.SPECIFY_DISTANCE
            self._create_preview()
            return True

        elif self.state == OffsetState.SPECIFY_DISTANCE:
            # Set distance from drag or click
            self._update_distance_from_point(point)
            self.complete()
            return True

        return False

    def on_mouse_move(self, x: float, y: float, dx: float, dy: float) -> bool:
        """Handle mouse move event."""
        if self.state == OffsetState.SPECIFY_DISTANCE:
            point = Point(x, y)
            self._update_distance_from_point(point)
            self._update_preview()
            return True
        return False

    def on_key_press(self, key: str, modifiers: dict) -> bool:
        """Handle key press event."""
        if key == "escape":
            self.cancel()
            return True

        if key == "return":
            if self.state == OffsetState.SPECIFY_DISTANCE:
                self.complete()
            return True

        if key == "d":
            self.delete_original = not self.delete_original
            return True

        if key == "m":
            self.multiple_mode = not self.multiple_mode
            return True

        if self.state == OffsetState.SPECIFY_DISTANCE:
            if key.isdigit() or key in [".", "-"]:
                self._keyboard_buffer += key
                self._update_distance_from_buffer()
                return True

        return False

    def set_selected_object(self, obj: Any) -> None:
        """Set the object to offset."""
        self.selected_object = obj
        if self.state == OffsetState.IDLE:
            self.state = OffsetState.SELECT_OBJECT

    def _determine_side(self, point: Point) -> str:
        """Determine offset side from click position."""
        # Simplified - would calculate based on object geometry
        if self.selected_object and isinstance(self.selected_object, Line):
            # Determine left/right of line
            return "left"
        return "outside"

    def _update_distance_from_point(self, point: Point) -> None:
        """Calculate distance from reference point."""
        # Simplified - would calculate perpendicular distance
        if self.selected_object:
            # For lines, distance from line
            pass

    def _update_distance_from_buffer(self) -> None:
        """Parse distance from keyboard buffer."""
        try:
            self.distance = float(self._keyboard_buffer)
        except ValueError:
            pass

    def _create_preview(self) -> None:
        """Create preview of offset object."""
        if not self.selected_object:
            return

        offset_obj = self._create_offset(self.selected_object, self.distance, self.side)
        if offset_obj:
            self._preview_object = offset_obj
            self.add_preview(offset_obj)

    def _update_preview(self) -> None:
        """Update preview with current distance."""
        self.clear_preview()
        self._create_preview()

    def _create_offset(self, obj: Any, distance: float, side: str) -> Optional[Any]:
        """Create offset copy of object."""
        if isinstance(obj, Line):
            return offset_line(obj, distance, side)

        # Would handle circles, polylines, etc.
        return None

    def _apply_offset(self) -> None:
        """Apply offset and create result."""
        if not self.selected_object:
            return

        offset_obj = self._create_offset(self.selected_object, self.distance, self.side)

        if offset_obj:
            self._offset_objects.append(offset_obj)

            if self.delete_original:
                # Mark original for deletion
                pass

    def on_complete(self) -> None:
        """Complete offset operation."""
        self._apply_offset()
        self.reset()

    def get_status_text(self) -> str:
        """Get status text for UI."""
        if self.state == OffsetState.IDLE:
            return "Offset: Select object"
        elif self.state == OffsetState.SELECT_OBJECT:
            return "Offset: Select object to offset"
        elif self.state == OffsetState.SPECIFY_SIDE:
            return "Offset: Click to specify side"
        elif self.state == OffsetState.SPECIFY_DISTANCE:
            delete_str = " [DEL ORIG]" if self.delete_original else ""
            multi_str = " [MULTI]" if self.multiple_mode else ""
            if self._keyboard_buffer:
                return f"Offset: {self._keyboard_buffer}{delete_str}{multi_str}"
            return f"Offset: {self.distance:.1f}{delete_str}{multi_str} | Click or type distance"
        return ""
