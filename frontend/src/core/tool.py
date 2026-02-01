"""Base tool class for BIM workbench tools."""

from abc import ABC, abstractmethod
from enum import Enum, auto
from typing import Optional, Tuple, Any, List
from dataclasses import dataclass


class ToolState(Enum):
    """Base tool states."""

    IDLE = auto()
    ACTIVE = auto()
    COMPLETED = auto()
    CANCELLED = auto()


@dataclass
class ToolConfig:
    """Tool configuration."""

    name: str
    icon: str
    shortcut: str
    tooltip: str
    cursor: str = "crosshair"


class Tool(ABC):
    """Abstract base class for all BIM workbench tools.

    Tools follow a state machine pattern:
    IDLE -> ACTIVE -> COMPLETED/CANCELLED -> IDLE

    Each tool handles mouse/keyboard events and publishes
    state changes via the event bus.
    """

    def __init__(self, config: ToolConfig):
        self.config = config
        self.state = ToolState.IDLE
        self._preview_objects: List[Any] = []
        self._is_active = False

    @property
    def name(self) -> str:
        """Tool name."""
        return self.config.name

    @property
    def is_active(self) -> bool:
        """Whether tool is currently active."""
        return self._is_active

    def activate(self) -> None:
        """Activate the tool."""
        self._is_active = True
        self.state = ToolState.ACTIVE
        self.on_activate()

    def deactivate(self) -> None:
        """Deactivate the tool."""
        self._is_active = False
        self.state = ToolState.IDLE
        self.clear_preview()
        self.on_deactivate()

    def complete(self) -> None:
        """Mark tool operation as complete."""
        self.state = ToolState.COMPLETED
        self.clear_preview()
        self.on_complete()
        self.deactivate()

    def cancel(self) -> None:
        """Cancel current operation."""
        self.state = ToolState.CANCELLED
        self.clear_preview()
        self.on_cancel()
        self.deactivate()

    # Event handlers - to be overridden by subclasses
    def on_activate(self) -> None:
        """Called when tool is activated."""
        pass

    def on_deactivate(self) -> None:
        """Called when tool is deactivated."""
        pass

    def on_complete(self) -> None:
        """Called when operation completes."""
        pass

    def on_cancel(self) -> None:
        """Called when operation is cancelled."""
        pass

    def on_mouse_press(self, x: float, y: float, button: int, modifiers: dict) -> bool:
        """Handle mouse press event.

        Args:
            x, y: Mouse position in canvas coordinates
            button: Mouse button (1=left, 2=middle, 3=right)
            modifiers: Keyboard modifiers (shift, ctrl, alt)

        Returns:
            True if event was handled
        """
        return False

    def on_mouse_move(self, x: float, y: float, dx: float, dy: float) -> bool:
        """Handle mouse move event.

        Args:
            x, y: Current mouse position
            dx, dy: Delta from last position

        Returns:
            True if event was handled
        """
        return False

    def on_mouse_release(self, x: float, y: float, button: int) -> bool:
        """Handle mouse release event.

        Returns:
            True if event was handled
        """
        return False

    def on_key_press(self, key: str, modifiers: dict) -> bool:
        """Handle key press event.

        Args:
            key: Key name
            modifiers: Keyboard modifiers

        Returns:
            True if event was handled
        """
        # Default: Escape cancels tool
        if key == "escape":
            self.cancel()
            return True
        return False

    def on_key_release(self, key: str) -> bool:
        """Handle key release event.

        Returns:
            True if event was handled
        """
        return False

    def on_text_input(self, text: str) -> bool:
        """Handle text input (for coordinate entry).

        Args:
            text: Input text

        Returns:
            True if event was handled
        """
        return False

    # Preview handling
    def add_preview(self, obj: Any) -> None:
        """Add a preview object."""
        self._preview_objects.append(obj)

    def clear_preview(self) -> None:
        """Clear all preview objects."""
        self._preview_objects.clear()

    def get_preview_objects(self) -> List[Any]:
        """Get current preview objects."""
        return self._preview_objects.copy()

    # Abstract methods
    @abstractmethod
    def get_cursor(self) -> str:
        """Get cursor type for this tool."""
        pass

    @abstractmethod
    def reset(self) -> None:
        """Reset tool to initial state."""
        pass
