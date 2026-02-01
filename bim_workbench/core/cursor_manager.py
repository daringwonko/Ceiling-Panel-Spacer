"""
Cursor Manager for BIM Workbench

Manages cursor shapes and visual feedback based on active tool.
"""

from typing import Optional, Dict, Callable, Any


class CursorManager:
    """
    Manages cursor shapes for different tools and states

    Provides visual feedback to users about the current tool and
    available actions.
    """

    # Cursor type definitions
    CURSOR_TYPES = {
        "default": {
            "shape": "arrow",
            "description": "Default pointer",
        },
        "crosshair": {
            "shape": "cross",
            "description": "Crosshair for precise drawing",
        },
        "crosshair_corner": {
            "shape": "cross",
            "description": "Crosshair for rectangle drawing",
        },
        "crosshair_circle": {
            "shape": "cross",
            "description": "Crosshair for circle drawing",
        },
        "crosshair_arc": {
            "shape": "cross",
            "description": "Crosshair for arc drawing",
        },
        "pointer": {
            "shape": "hand",
            "description": "Hand pointer for selection",
        },
        "move": {
            "shape": "size_all",
            "description": "Move cursor for dragging",
        },
        "text": {
            "shape": "ibeam",
            "description": "Text input cursor",
        },
        "wait": {
            "shape": "wait",
            "description": "Wait/processing cursor",
        },
        "not_allowed": {
            "shape": "no",
            "description": "Operation not allowed",
        },
    }

    # Tool to cursor mapping
    TOOL_CURSORS = {
        "line": "crosshair",
        "rectangle": "crosshair_corner",
        "circle": "crosshair_circle",
        "arc": "crosshair_arc",
    }

    def __init__(self):
        """Initialize cursor manager"""
        self._current_cursor: str = "default"
        self._on_cursor_change: Optional[Callable[[str], None]] = None
        self._tool_manager = None

    def set_cursor_change_callback(self, callback: Callable[[str], None]):
        """
        Set callback for cursor changes

        Args:
            callback: Function called with new cursor type
        """
        self._on_cursor_change = callback

    def set_tool_manager(self, tool_manager: Any):
        """
        Set tool manager for cursor synchronization

        Args:
            tool_manager: ToolManager instance
        """
        self._tool_manager = tool_manager

    def get_current_cursor(self) -> str:
        """
        Get current cursor type

        Returns:
            Current cursor type identifier
        """
        return self._current_cursor

    def set_cursor(self, cursor_type: str) -> bool:
        """
        Set cursor type

        Args:
            cursor_type: Cursor type identifier

        Returns:
            True if cursor was set successfully
        """
        if cursor_type not in self.CURSOR_TYPES:
            return False

        self._current_cursor = cursor_type

        if self._on_cursor_change:
            self._on_cursor_change(cursor_type)

        return True

    def set_cursor_for_tool(self, tool_id: str) -> bool:
        """
        Set cursor based on tool

        Args:
            tool_id: Tool identifier

        Returns:
            True if cursor was set successfully
        """
        cursor_type = self.TOOL_CURSORS.get(tool_id, "crosshair")
        return self.set_cursor(cursor_type)

    def reset_cursor(self):
        """Reset to default cursor"""
        self.set_cursor("default")

    def get_cursor_info(self, cursor_type: Optional[str] = None) -> Dict[str, str]:
        """
        Get cursor information

        Args:
            cursor_type: Cursor type (uses current if None)

        Returns:
            Cursor information dictionary
        """
        if cursor_type is None:
            cursor_type = self._current_cursor

        return self.CURSOR_TYPES.get(cursor_type, self.CURSOR_TYPES["default"])

    def get_cursor_shape(self, cursor_type: Optional[str] = None) -> str:
        """
        Get cursor shape for a cursor type

        Args:
            cursor_type: Cursor type (uses current if None)

        Returns:
            Cursor shape identifier
        """
        info = self.get_cursor_info(cursor_type)
        return info["shape"]

    def get_cursor_description(self, cursor_type: Optional[str] = None) -> str:
        """
        Get cursor description

        Args:
            cursor_type: Cursor type (uses current if None)

        Returns:
            Cursor description
        """
        info = self.get_cursor_info(cursor_type)
        return info["description"]

    def update_from_tool_manager(self):
        """Update cursor based on active tool in tool manager"""
        if self._tool_manager is None:
            return

        active_tool_id = self._tool_manager.get_active_tool_id()
        if active_tool_id:
            self.set_cursor_for_tool(active_tool_id)
        else:
            self.reset_cursor()

    def is_drawing_cursor(self, cursor_type: Optional[str] = None) -> bool:
        """
        Check if cursor is a drawing cursor

        Args:
            cursor_type: Cursor type (uses current if None)

        Returns:
            True if cursor is for drawing
        """
        if cursor_type is None:
            cursor_type = self._current_cursor

        return cursor_type.startswith("crosshair")


# Global cursor manager instance
cursor_manager = CursorManager()


def get_cursor_manager() -> CursorManager:
    """Get the global cursor manager instance"""
    return cursor_manager


def set_cursor(cursor_type: str) -> bool:
    """
    Set cursor type (convenience function)

    Args:
        cursor_type: Cursor type identifier

    Returns:
        True if cursor was set successfully
    """
    return cursor_manager.set_cursor(cursor_type)


def reset_cursor():
    """Reset to default cursor (convenience function)"""
    cursor_manager.reset_cursor()
