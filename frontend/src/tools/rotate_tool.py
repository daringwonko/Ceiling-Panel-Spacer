"""Rotate tool for rotating objects."""

from typing import Optional, List, Any
from enum import Enum, auto
import math

from ..core.tool import Tool, ToolConfig, ToolState
from ..core.geometry import Point


class RotateState(Enum):
    """Rotate tool states."""

    IDLE = auto()
    SELECTED = auto()
    SET_CENTER = auto()
    ROTATING = auto()


class RotateTool(Tool):
    """Tool for rotating objects around a center point.

    Usage:
        1. Select objects
        2. Click to set rotation center
        3. Drag to rotate or type exact angle
        4. Press Enter to confirm

    Keyboard input:
        - "45" - rotate 45 degrees
        - "-90" - rotate -90 degrees (clockwise)
        - Enter - confirm rotation
        - C - toggle copy mode
        - Escape - cancel
    """

    def __init__(self):
        super().__init__(
            ToolConfig(
                name="rotate",
                icon="rotate",
                shortcut="RO",
                tooltip="Rotate objects (RO)",
                cursor="crosshair",
            )
        )
        self.state = RotateState.IDLE
        self.selected_objects: List[Any] = []
        self.center_point: Optional[Point] = None
        self.start_angle: float = 0.0
        self.current_angle: float = 0.0
        self.rotation_angle: float = 0.0
        self.copy_mode: bool = False
        self._keyboard_buffer = ""
        self._ghost_objects: List[Any] = []

    def reset(self) -> None:
        """Reset tool to initial state."""
        self.state = RotateState.IDLE
        self.selected_objects.clear()
        self.center_point = None
        self.start_angle = 0.0
        self.current_angle = 0.0
        self.rotation_angle = 0.0
        self.copy_mode = False
        self._keyboard_buffer = ""
        self._ghost_objects.clear()
        self.clear_preview()

    def get_cursor(self) -> str:
        """Get cursor type."""
        if self.state == RotateState.ROTATING:
            return "rotate"
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
        if button == 3:  # Right click
            if self.state != RotateState.IDLE:
                self.cancel()
            return True

        if button != 1:
            return False

        point = Point(x, y)

        if self.state == RotateState.IDLE:
            self.state = RotateState.SELECTED
            return True

        elif self.state == RotateState.SELECTED:
            self.center_point = point
            self.state = RotateState.SET_CENTER
            return True

        elif self.state == RotateState.SET_CENTER:
            # Start rotating
            self.start_angle = math.atan2(
                y - self.center_point.y, x - self.center_point.x
            )
            self.current_angle = self.start_angle
            self.rotation_angle = 0.0
            self.state = RotateState.ROTATING
            self._create_ghost_objects()
            return True

        elif self.state == RotateState.ROTATING:
            # Complete rotation
            self.complete()
            return True

        return False

    def on_mouse_move(self, x: float, y: float, dx: float, dy: float) -> bool:
        """Handle mouse move event."""
        if self.state == RotateState.ROTATING and self.center_point:
            self.current_angle = math.atan2(
                y - self.center_point.y, x - self.center_point.x
            )
            self.rotation_angle = self.current_angle - self.start_angle
            self._update_ghost_objects()
            return True
        return False

    def on_key_press(self, key: str, modifiers: dict) -> bool:
        """Handle key press event."""
        if key == "escape":
            if self.state != RotateState.IDLE:
                self.cancel()
            return True

        if key == "return":
            if self.state == RotateState.ROTATING:
                self.complete()
            return True

        if key == "c":
            self.copy_mode = not self.copy_mode
            return True

        if self.state == RotateState.ROTATING:
            if key.isdigit() or key in [".", "-"]:
                self._keyboard_buffer += key
                return True

        return False

    def set_selected_objects(self, objects: List[Any]) -> None:
        """Set objects to rotate."""
        self.selected_objects = list(objects)
        if self.selected_objects:
            self.state = RotateState.SELECTED

    def _create_ghost_objects(self) -> None:
        """Create ghost objects for preview."""
        self._ghost_objects.clear()
        for obj in self.selected_objects:
            ghost = self._create_ghost_copy(obj)
            if ghost:
                self._ghost_objects.append(ghost)
                self.add_preview(ghost)

    def _create_ghost_copy(self, obj: Any) -> Any:
        """Create ghost copy of object."""
        if hasattr(obj, "copy"):
            ghost = obj.copy()
            ghost.is_ghost = True
            return ghost
        return None

    def _update_ghost_objects(self) -> None:
        """Update ghost object rotations."""
        for ghost in self._ghost_objects:
            if hasattr(ghost, "rotate") and self.center_point:
                # Reset to original then rotate
                ghost.rotate(self.rotation_angle, self.center_point)

    def _apply_rotation(self) -> None:
        """Apply rotation to selected objects."""
        objects_to_rotate = self.selected_objects.copy()

        if self.copy_mode:
            # Create copies and rotate those
            objects_to_rotate = []
            for obj in self.selected_objects:
                if hasattr(obj, "copy"):
                    copy = obj.copy()
                    objects_to_rotate.append(copy)
                    # Add copy to canvas (would need canvas reference)

        for obj in objects_to_rotate:
            if hasattr(obj, "rotate") and self.center_point:
                obj.rotate(self.rotation_angle, self.center_point)

    def on_complete(self) -> None:
        """Complete rotation operation."""
        self._apply_rotation()
        self.reset()

    def get_angle_degrees(self) -> float:
        """Get rotation angle in degrees."""
        return math.degrees(self.rotation_angle)

    def set_angle(self, degrees: float) -> None:
        """Set rotation angle directly."""
        self.rotation_angle = math.radians(degrees)
        self._update_ghost_objects()

    def get_status_text(self) -> str:
        """Get status text for UI."""
        if self.state == RotateState.IDLE:
            return "Select objects to rotate"
        elif self.state == RotateState.SELECTED:
            return f"Selected {len(self.selected_objects)} objects"
        elif self.state == RotateState.SET_CENTER:
            return "Click rotation center point"
        elif self.state == RotateState.ROTATING:
            angle_str = f"{self.get_angle_degrees():.1f}°"
            copy_str = " [COPY]" if self.copy_mode else ""
            if self._keyboard_buffer:
                return f"Angle: {self._keyboard_buffer}{copy_str}"
            return f"Rotation: {angle_str}{copy_str} | Click to confirm"
        return ""
