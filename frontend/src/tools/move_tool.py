"""Move tool for translating objects."""

from typing import Optional, List, Any, Tuple
from enum import Enum, auto
import math

from ..core.tool import Tool, ToolConfig, ToolState
from ..core.geometry import Point
from ..snap_system import SnapSystem, SnapType


class MoveState(Enum):
    """Move tool states."""

    IDLE = auto()
    SELECTING = auto()
    SELECTED = auto()
    SET_BASE = auto()
    MOVING = auto()


class MoveTool(Tool):
    """Tool for moving objects from one position to another.

    Usage:
        1. Select objects (click or drag selection)
        2. Click to set base point (reference point for move)
        3. Drag or click to set target point
        4. Press Enter to confirm or Escape to cancel

    Keyboard input:
        - "100,200" - relative displacement in X,Y
        - Enter - confirm move
        - Escape - cancel operation
    """

    def __init__(self, snap_system: SnapSystem):
        super().__init__(
            ToolConfig(
                name="move",
                icon="move",
                shortcut="M",
                tooltip="Move objects (M)",
                cursor="crosshair",
            )
        )
        self.snap_system = snap_system
        self.state = MoveState.IDLE
        self.selected_objects: List[Any] = []
        self.base_point: Optional[Point] = None
        self.current_point: Optional[Point] = None
        self.displacement: Point = Point(0, 0)
        self._keyboard_buffer = ""
        self._ghost_objects: List[Any] = []

    def reset(self) -> None:
        """Reset tool to initial state."""
        self.state = MoveState.IDLE
        self.selected_objects.clear()
        self.base_point = None
        self.current_point = None
        self.displacement = Point(0, 0)
        self._keyboard_buffer = ""
        self._ghost_objects.clear()
        self.clear_preview()

    def get_cursor(self) -> str:
        """Get cursor type based on state."""
        if self.state == MoveState.MOVING:
            return "move"
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
            if self.state != MoveState.IDLE:
                self.cancel()
            return True

        if button != 1:  # Only left click
            return False

        # Get snapped point
        point = self._get_snapped_point(x, y)

        if self.state == MoveState.IDLE:
            # Start selection
            self.state = MoveState.SELECTING
            # Object selection is handled by canvas
            return True

        elif self.state == MoveState.SELECTED:
            # Set base point
            self.base_point = point
            self.current_point = point
            self.state = MoveState.MOVING
            self._create_ghost_objects()
            return True

        elif self.state == MoveState.MOVING:
            # Set target point and complete
            self.current_point = point
            self._calculate_displacement()
            self.complete()
            return True

        return False

    def on_mouse_move(self, x: float, y: float, dx: float, dy: float) -> bool:
        """Handle mouse move event."""
        if self.state == MoveState.MOVING:
            self.current_point = self._get_snapped_point(x, y)
            self._calculate_displacement()
            self._update_ghost_objects()
            return True
        return False

    def on_key_press(self, key: str, modifiers: dict) -> bool:
        """Handle key press event."""
        # Handle Escape
        if key == "escape":
            if self.state != MoveState.IDLE:
                self.cancel()
            return True

        # Handle Enter
        if key == "return":
            if self.state == MoveState.MOVING:
                self.complete()
            return True

        # Handle number/decimal input for displacement
        if self.state == MoveState.MOVING:
            if key.isdigit() or key in [".", ",", "-"]:
                self._keyboard_buffer += key
                return True

        return False

    def on_text_input(self, text: str) -> bool:
        """Handle text input for coordinate entry."""
        if self.state != MoveState.MOVING:
            return False

        # Accept coordinate input like "100,200"
        if text.isdigit() or text in [".", ",", "-", " "]:
            self._keyboard_buffer += text
            return True

        return False

    def set_selected_objects(self, objects: List[Any]) -> None:
        """Set the objects to be moved."""
        self.selected_objects = list(objects)
        if self.selected_objects:
            self.state = MoveState.SELECTED
        else:
            self.state = MoveState.IDLE

    def add_selected_object(self, obj: Any) -> None:
        """Add an object to the selection."""
        if obj not in self.selected_objects:
            self.selected_objects.append(obj)
            self.state = MoveState.SELECTED

    def remove_selected_object(self, obj: Any) -> None:
        """Remove an object from the selection."""
        if obj in self.selected_objects:
            self.selected_objects.remove(obj)
            if not self.selected_objects:
                self.state = MoveState.IDLE

    def clear_selection(self) -> None:
        """Clear all selected objects."""
        self.selected_objects.clear()
        if self.state in [MoveState.SELECTED, MoveState.SET_BASE]:
            self.state = MoveState.IDLE

    def _get_snapped_point(self, x: float, y: float) -> Point:
        """Get snapped point from coordinates."""
        raw_point = Point(x, y)
        # For now, return raw point (canvas will handle snapping)
        # In full implementation, this would use snap_system.get_snap_point
        return raw_point

    def _calculate_displacement(self) -> None:
        """Calculate displacement from base to current point."""
        if self.base_point and self.current_point:
            self.displacement = Point(
                self.current_point.x - self.base_point.x,
                self.current_point.y - self.base_point.y,
            )

    def _create_ghost_objects(self) -> None:
        """Create ghost/preview objects for move visualization."""
        self._ghost_objects.clear()
        for obj in self.selected_objects:
            # Create ghost copy
            ghost = self._create_ghost_copy(obj)
            if ghost:
                self._ghost_objects.append(ghost)
                self.add_preview(ghost)

    def _create_ghost_copy(self, obj: Any) -> Any:
        """Create a ghost copy of an object."""
        # This is a simplified implementation
        # In practice, this would create proper ghost objects based on type
        if hasattr(obj, "copy"):
            ghost = obj.copy()
            ghost.is_ghost = True
            return ghost
        return None

    def _update_ghost_objects(self) -> None:
        """Update ghost object positions based on displacement."""
        for ghost in self._ghost_objects:
            if hasattr(ghost, "translate"):
                ghost.translate(self.displacement.x, self.displacement.y)

    def _apply_move(self) -> None:
        """Apply the move to selected objects."""
        for obj in self.selected_objects:
            if hasattr(obj, "translate"):
                obj.translate(self.displacement.x, self.displacement.y)

    def on_complete(self) -> None:
        """Called when move operation completes."""
        # Apply the move
        self._apply_move()
        # Clear state
        self.reset()

    def get_status_text(self) -> str:
        """Get status text for display in UI."""
        if self.state == MoveState.IDLE:
            return "Select objects to move"
        elif self.state == MoveState.SELECTING:
            return f"Selected {len(self.selected_objects)} objects"
        elif self.state == MoveState.SELECTED:
            return "Click base point (or press Escape to cancel)"
        elif self.state == MoveState.MOVING:
            if self._keyboard_buffer:
                return f"Displacement: {self._keyboard_buffer} | Enter to confirm"
            return f"Move by: {self.displacement.x:.1f}, {self.displacement.y:.1f} | Click to place"
        return ""

    def get_displacement(self) -> Point:
        """Get current displacement vector."""
        return self.displacement

    def set_displacement(self, dx: float, dy: float) -> None:
        """Set displacement directly from keyboard input."""
        self.displacement = Point(dx, dy)
        self._update_ghost_objects()
