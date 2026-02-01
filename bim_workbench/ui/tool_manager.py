"""
Tool Manager for BIM Workbench

Manages tool activation, deactivation, and event routing.
"""

from typing import Optional, Dict, Callable, Any
from bim_workbench.tools import LineTool, RectangleTool, CircleTool, ArcTool


class ToolManager:
    """
    Manages all drafting tools and their lifecycle

    Handles:
    - Tool registration and activation
    - Event routing to active tool
    - Tool state management
    - UI integration (cursor, status bar)
    """

    def __init__(self):
        """Initialize tool manager"""
        self._tools: Dict[str, Any] = {}
        self._active_tool: Optional[Any] = None
        self._canvas = None
        self._on_tool_complete: Optional[Callable] = None
        self._on_status_change: Optional[Callable[[str], None]] = None
        self._on_cursor_change: Optional[Callable[[str], None]] = None

        # Register default tools
        self._register_default_tools()

    def _register_default_tools(self):
        """Register the default set of drafting tools"""
        self.register_tool("line", LineTool())
        self.register_tool("rectangle", RectangleTool())
        self.register_tool("circle", CircleTool())
        self.register_tool("arc", ArcTool())

    def register_tool(self, tool_id: str, tool: Any):
        """
        Register a tool

        Args:
            tool_id: Unique tool identifier
            tool: Tool instance
        """
        self._tools[tool_id] = tool

    def get_tool(self, tool_id: str) -> Optional[Any]:
        """
        Get a tool by ID

        Args:
            tool_id: Tool identifier

        Returns:
            Tool instance or None
        """
        return self._tools.get(tool_id)

    def get_all_tools(self) -> Dict[str, Any]:
        """
        Get all registered tools

        Returns:
            Dictionary of tool_id -> tool
        """
        return self._tools.copy()

    def activate_tool(self, tool_id: str) -> bool:
        """
        Activate a tool

        Args:
            tool_id: Tool identifier

        Returns:
            True if tool activated successfully
        """
        tool = self._tools.get(tool_id)
        if tool is None:
            return False

        # Deactivate current tool if any
        if self._active_tool is not None:
            self._active_tool.deactivate()

        # Activate new tool
        self._active_tool = tool
        tool.activate(canvas=self._canvas, on_complete=self._handle_tool_complete)

        # Update UI
        self._update_cursor(tool.get_cursor())
        self._update_status(tool.get_status_text())

        return True

    def deactivate_current_tool(self):
        """Deactivate the current tool"""
        if self._active_tool is not None:
            self._active_tool.deactivate()
            self._active_tool = None
            self._update_cursor("default")
            self._update_status("Ready")

    def get_active_tool(self) -> Optional[Any]:
        """
        Get currently active tool

        Returns:
            Active tool or None
        """
        return self._active_tool

    def get_active_tool_id(self) -> Optional[str]:
        """
        Get ID of currently active tool

        Returns:
            Tool ID or None
        """
        for tool_id, tool in self._tools.items():
            if tool is self._active_tool:
                return tool_id
        return None

    def is_tool_active(self, tool_id: str) -> bool:
        """
        Check if a specific tool is active

        Args:
            tool_id: Tool identifier

        Returns:
            True if tool is active
        """
        return self.get_active_tool_id() == tool_id

    # ========================================================================
    # Event Routing
    # ========================================================================

    def on_mouse_press(self, x: float, y: float, button: int = 1):
        """
        Route mouse press to active tool

        Args:
            x: Mouse X coordinate
            y: Mouse Y coordinate
            button: Mouse button (1=left, 2=middle, 3=right)
        """
        if self._active_tool is not None:
            self._active_tool.on_mouse_press(x, y, button)
            self._update_status(self._active_tool.get_status_text())

    def on_mouse_move(self, x: float, y: float, shift_pressed: bool = False):
        """
        Route mouse move to active tool

        Args:
            x: Mouse X coordinate
            y: Mouse Y coordinate
            shift_pressed: Whether Shift key is held
        """
        if self._active_tool is not None:
            self._active_tool.on_mouse_move(x, y, shift_pressed)
            self._update_status(self._active_tool.get_status_text())

    def on_mouse_release(self, x: float, y: float, button: int = 1):
        """
        Route mouse release to active tool

        Args:
            x: Mouse X coordinate
            y: Mouse Y coordinate
            button: Mouse button (1=left, 2=middle, 3=right)
        """
        if self._active_tool is not None:
            self._active_tool.on_mouse_release(x, y, button)
            self._update_status(self._active_tool.get_status_text())

    def on_key_press(self, key: str):
        """
        Route key press to active tool

        Args:
            key: Key pressed
        """
        if self._active_tool is not None:
            self._active_tool.on_key_press(key)
            self._update_status(self._active_tool.get_status_text())

    # ========================================================================
    # Tool Selection Shortcuts
    # ========================================================================

    def select_line_tool(self) -> bool:
        """Activate line tool"""
        return self.activate_tool("line")

    def select_rectangle_tool(self) -> bool:
        """Activate rectangle tool"""
        return self.activate_tool("rectangle")

    def select_circle_tool(self) -> bool:
        """Activate circle tool"""
        return self.activate_tool("circle")

    def select_arc_tool(self) -> bool:
        """Activate arc tool"""
        return self.activate_tool("arc")

    def handle_shortcut(self, key: str) -> bool:
        """
        Handle keyboard shortcut for tool selection

        Args:
            key: Key pressed

        Returns:
            True if shortcut was handled
        """
        shortcuts = {
            "l": "line",
            "L": "line",
            "r": "rectangle",
            "R": "rectangle",
            "c": "circle",
            "C": "circle",
            "a": "arc",
            "A": "arc",
        }

        tool_id = shortcuts.get(key)
        if tool_id:
            return self.activate_tool(tool_id)
        return False

    # ========================================================================
    # UI Integration
    # ========================================================================

    def set_canvas(self, canvas: Any):
        """
        Set the drawing canvas

        Args:
            canvas: Canvas reference
        """
        self._canvas = canvas

    def set_on_tool_complete(self, callback: Callable[[dict], None]):
        """
        Set callback for tool completion

        Args:
            callback: Function called when tool completes with BIM object
        """
        self._on_tool_complete = callback

    def set_on_status_change(self, callback: Callable[[str], None]):
        """
        Set callback for status bar updates

        Args:
            callback: Function called with status text
        """
        self._on_status_change = callback

    def set_on_cursor_change(self, callback: Callable[[str], None]):
        """
        Set callback for cursor changes

        Args:
            callback: Function called with cursor type
        """
        self._on_cursor_change = callback

    def _handle_tool_complete(self, bim_object: dict):
        """
        Handle tool completion

        Args:
            bim_object: Created BIM object
        """
        if self._on_tool_complete:
            self._on_tool_complete(bim_object)

    def _update_status(self, text: str):
        """
        Update status bar

        Args:
            text: Status text
        """
        if self._on_status_change:
            self._on_status_change(text)

    def _update_cursor(self, cursor_type: str):
        """
        Update cursor

        Args:
            cursor_type: Cursor type identifier
        """
        if self._on_cursor_change:
            self._on_cursor_change(cursor_type)

    def get_tool_instructions(self, tool_id: Optional[str] = None) -> str:
        """
        Get instructions for a tool

        Args:
            tool_id: Tool identifier (uses active tool if None)

        Returns:
            Instruction text
        """
        if tool_id is None:
            tool = self._active_tool
        else:
            tool = self._tools.get(tool_id)

        if tool is None:
            return ""

        instructions = {
            "line": "Click start point, then end point (Shift for ortho)",
            "rectangle": "Click first corner, then opposite corner (Shift for square)",
            "circle": "Click center, then radius point (or type value)",
            "arc": "Click center, start point, then end point",
        }

        return instructions.get(tool_id, tool.get_status_text())


# Global tool manager instance
tool_manager = ToolManager()


def get_tool_manager() -> ToolManager:
    """Get the global tool manager instance"""
    return tool_manager


def activate_tool(tool_id: str) -> bool:
    """
    Activate a tool by ID (convenience function)

    Args:
        tool_id: Tool identifier

    Returns:
        True if tool activated successfully
    """
    return tool_manager.activate_tool(tool_id)
