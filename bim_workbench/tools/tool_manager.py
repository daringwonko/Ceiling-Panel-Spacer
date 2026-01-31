"""Tool manager for BIM Workbench.

Manages tool registration, activation, and event routing.
"""

from typing import Dict, Optional, Type, List
from .base_draft_tool import BaseDraftTool, Point2D


class ToolManager:
    """Manages all drafting tools."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._tools: Dict[str, Type[BaseDraftTool]] = {}
        self._tool_instances: Dict[str, BaseDraftTool] = {}
        self._active_tool: Optional[BaseDraftTool] = None
        self._active_tool_name: Optional[str] = None

    def register_tool(self, tool_class: Type[BaseDraftTool]) -> None:
        """Register a tool class.

        Args:
            tool_class: Tool class to register
        """
        self._tools[tool_class.name] = tool_class
        # Create instance on first use
        if tool_class.name not in self._tool_instances:
            self._tool_instances[tool_class.name] = tool_class()

    def activate_tool(self, tool_name: str) -> bool:
        """Activate a tool by name.

        Args:
            tool_name: Name of tool to activate

        Returns:
            True if tool was activated
        """
        if tool_name not in self._tools:
            return False

        # Deactivate current tool
        if self._active_tool:
            self._active_tool.reset()

        # Activate new tool
        self._active_tool_name = tool_name
        self._active_tool = self._tool_instances.get(tool_name)
        if not self._active_tool:
            tool_class = self._tools[tool_name]
            self._active_tool = tool_class()
            self._tool_instances[tool_name] = self._active_tool

        return True

    def get_active_tool(self) -> Optional[BaseDraftTool]:
        """Get currently active tool."""
        return self._active_tool

    def get_tool_names(self) -> List[str]:
        """Get list of all registered tool names."""
        return list(self._tools.keys())

    def get_tool(self, tool_name: str) -> Optional[BaseDraftTool]:
        """Get tool instance by name."""
        return self._tool_instances.get(tool_name)

    def handle_mouse_press(self, pos: Point2D, button: int) -> bool:
        """Route mouse press to active tool."""
        if self._active_tool:
            return self._active_tool.on_mouse_press(pos, button)
        return False

    def handle_mouse_move(self, pos: Point2D) -> bool:
        """Route mouse move to active tool."""
        if self._active_tool:
            return self._active_tool.on_mouse_move(pos)
        return False

    def handle_mouse_release(self, pos: Point2D, button: int) -> bool:
        """Route mouse release to active tool."""
        if self._active_tool:
            return self._active_tool.on_mouse_release(pos, button)
        return False

    def handle_key_press(self, key: str) -> bool:
        """Route key press to active tool."""
        if self._active_tool:
            return self._active_tool.on_key_press(key)
        return False

    def render_preview(self, renderer) -> None:
        """Render active tool preview."""
        if self._active_tool:
            self._active_tool.render_preview(renderer)


# Global tool manager instance
tool_manager = ToolManager()
