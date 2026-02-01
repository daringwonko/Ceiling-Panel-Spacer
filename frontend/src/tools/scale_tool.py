"""Scale tool for scaling objects."""

from typing import Optional, List, Any
from enum import Enum, auto

from core.tool import Tool, ToolConfig, ToolState
from core.geometry import Point


class ScaleState(Enum):
    """Scale tool states."""

    IDLE = auto()
    SELECTED = auto()
    SET_BASE = auto()
    SCALING = auto()


class ScaleTool(Tool):
    """Tool for scaling objects from a base point.

    Usage:
        1. Select objects
        2. Click to set base point (fixed point)
        3. Drag to scale or type scale factor
        4. Press Enter to confirm

    Keyboard input:
        - "2" - scale 2x (double size)
        - "0.5" - scale 0.5x (half size)
        - Enter - confirm
        - C - toggle copy mode
        - U - toggle uniform/non-uniform scaling
        - Escape - cancel
    """

    def __init__(self):
        super().__init__(
            ToolConfig(
                name="scale",
                icon="scale",
                shortcut="SC",
                tooltip="Scale objects (SC)",
                cursor="crosshair",
            )
        )
        self.state = ScaleState.IDLE
        self.selected_objects: List[Any] = []
        self.base_point: Optional[Point] = None
        self.start_distance: float = 0.0
        self.current_distance: float = 0.0
        self.scale_factor: float = 1.0
        self.scale_x: float = 1.0
        self.scale_y: float = 1.0
        self.uniform: bool = True
        self.copy_mode: bool = False
        self._keyboard_buffer = ""
        self._ghost_objects: List[Any] = []

    def reset(self) -> None:
        """Reset tool to initial state."""
        self.state = ScaleState.IDLE
        self.selected_objects.clear()
        self.base_point = None
        self.start_distance = 0.0
        self.current_distance = 0.0
        self.scale_factor = 1.0
        self.scale_x = 1.0
        self.scale_y = 1.0
        self.uniform = True
        self.copy_mode = False
        self._keyboard_buffer = ""
        self._ghost_objects.clear()
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
        if button == 3:  # Right click
            if self.state != ScaleState.IDLE:
                self.cancel()
            return True

        if button != 1:
            return False

        point = Point(x, y)

        if self.state == ScaleState.IDLE:
            self.state = ScaleState.SELECTED
            return True

        elif self.state == ScaleState.SELECTED:
            self.base_point = point
            self.state = ScaleState.SET_BASE
            return True

        elif self.state == ScaleState.SET_BASE:
            # Start scaling
            self.start_distance = point.distance_to(self.base_point)
            if self.start_distance == 0:
                self.start_distance = 1.0  # Prevent division by zero
            self.current_distance = self.start_distance
            self.scale_factor = 1.0
            self.state = ScaleState.SCALING
            self._create_ghost_objects()
            return True

        elif self.state == ScaleState.SCALING:
            # Complete scaling
            self.complete()
            return True

        return False

    def on_mouse_move(self, x: float, y: float, dx: float, dy: float) -> bool:
        """Handle mouse move event."""
        if self.state == ScaleState.SCALING and self.base_point:
            current_point = Point(x, y)
            self.current_distance = current_point.distance_to(self.base_point)
            if self.current_distance > 0:
                self.scale_factor = self.current_distance / self.start_distance
                if self.uniform:
                    self.scale_x = self.scale_factor
                    self.scale_y = self.scale_factor
                else:
                    # Non-uniform scaling would require more complex logic
                    self.scale_x = self.scale_factor
                    self.scale_y = self.scale_factor
            self._update_ghost_objects()
            return True
        return False

    def on_key_press(self, key: str, modifiers: dict) -> bool:
        """Handle key press event."""
        if key == "escape":
            if self.state != ScaleState.IDLE:
                self.cancel()
            return True

        if key == "return":
            if self.state == ScaleState.SCALING:
                self.complete()
            return True

        if key == "c":
            self.copy_mode = not self.copy_mode
            return True

        if key == "u":
            self.uniform = not self.uniform
            return True

        if self.state == ScaleState.SCALING:
            if key.isdigit() or key in [".", "-"]:
                self._keyboard_buffer += key
                return True

        return False

    def set_selected_objects(self, objects: List[Any]) -> None:
        """Set objects to scale."""
        self.selected_objects = list(objects)
        if self.selected_objects:
            self.state = ScaleState.SELECTED

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
        """Update ghost object scales."""
        for ghost in self._ghost_objects:
            if hasattr(ghost, "scale") and self.base_point:
                ghost.scale(self.scale_x, self.scale_y, self.base_point)

    def _apply_scale(self) -> None:
        """Apply scale to selected objects."""
        objects_to_scale = self.selected_objects.copy()

        if self.copy_mode:
            # Create copies and scale those
            objects_to_scale = []
            for obj in self.selected_objects:
                if hasattr(obj, "copy"):
                    copy = obj.copy()
                    objects_to_scale.append(copy)

        for obj in objects_to_scale:
            if hasattr(obj, "scale") and self.base_point:
                obj.scale(self.scale_x, self.scale_y, self.base_point)

    def on_complete(self) -> None:
        """Complete scale operation."""
        self._apply_scale()
        self.reset()

    def set_scale_factor(self, factor: float) -> None:
        """Set scale factor directly."""
        self.scale_factor = factor
        if self.uniform:
            self.scale_x = factor
            self.scale_y = factor
        self._update_ghost_objects()

    def get_status_text(self) -> str:
        """Get status text for UI."""
        if self.state == ScaleState.IDLE:
            return "Select objects to scale"
        elif self.state == ScaleState.SELECTED:
            return f"Selected {len(self.selected_objects)} objects"
        elif self.state == ScaleState.SET_BASE:
            return "Click base point (fixed point)"
        elif self.state == ScaleState.SCALING:
            scale_str = f"{self.scale_factor:.2f}x"
            copy_str = " [COPY]" if self.copy_mode else ""
            uniform_str = " [UNIFORM]" if self.uniform else " [NON-UNIFORM]"
            if self._keyboard_buffer:
                return f"Scale: {self._keyboard_buffer}{copy_str}"
            return f"Scale: {scale_str}{copy_str}{uniform_str} | Click to confirm"
        return ""
