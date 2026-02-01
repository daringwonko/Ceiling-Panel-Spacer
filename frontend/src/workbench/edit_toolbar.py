"""Edit toolbar for editing tools."""

from typing import Dict, List, Callable, Optional, Any
from enum import Enum

from tools import MoveTool, RotateTool, ScaleTool, TrimTool, OffsetTool, FilletTool
from core.tool import Tool


class ToolButton:
    """Represents a tool button in the toolbar."""

    def __init__(self, tool_class: type, icon: str, tooltip: str, shortcut: str):
        self.tool_class = tool_class
        self.icon = icon
        self.tooltip = tooltip
        self.shortcut = shortcut
        self.is_active = False
        self.is_enabled = True


class EditToolbar:
    """Toolbar for editing tools.

    Provides buttons for all editing tools with:
    - Visual feedback for active tool
    - Tooltips with shortcuts
    - Enable/disable based on selection
    - Keyboard shortcut support

    Usage:
        toolbar = EditToolbar()
        toolbar.register_tool_activated_callback(on_tool_change)
        workbench.add_toolbar(toolbar)
    """

    def __init__(self):
        self.buttons: Dict[str, ToolButton] = {}
        self._active_tool: Optional[str] = None
        self._callbacks: Dict[str, List[Callable]] = {
            "tool_activated": [],
            "tool_deactivated": [],
        }
        self._tools: Dict[str, Any] = {}
        self._setup_default_buttons()

    def _setup_default_buttons(self) -> None:
        """Setup default tool buttons."""
        default_tools = [
            ("move", MoveTool, "move", "Move objects", "M"),
            ("rotate", RotateTool, "rotate", "Rotate objects (RO)", "RO"),
            ("scale", ScaleTool, "scale", "Scale objects (SC)", "SC"),
            ("trim", TrimTool, "trim", "Trim objects (TR)", "TR"),
            ("offset", OffsetTool, "offset", "Offset objects (O)", "O"),
            ("fillet", FilletTool, "fillet", "Fillet corners (F)", "F"),
        ]

        for tool_id, tool_class, icon, tooltip, shortcut in default_tools:
            self.buttons[tool_id] = ToolButton(tool_class, icon, tooltip, shortcut)

    def register_callback(self, event: str, callback: Callable) -> None:
        """Register callback for toolbar events."""
        if event not in self._callbacks:
            self._callbacks[event] = []
        self._callbacks[event].append(callback)

    def _notify(self, event: str, data: Any = None) -> None:
        """Notify registered callbacks."""
        for callback in self._callbacks.get(event, []):
            callback(data)

    def activate_tool(self, tool_id: str) -> bool:
        """Activate a tool by ID.

        Args:
            tool_id: Tool identifier

        Returns:
            True if tool was activated
        """
        if tool_id not in self.buttons:
            return False

        # Deactivate current tool
        if self._active_tool and self._active_tool != tool_id:
            self.deactivate_tool(self._active_tool)

        # Activate new tool
        button = self.buttons[tool_id]
        if not button.is_enabled:
            return False

        button.is_active = True
        self._active_tool = tool_id

        # Create tool instance if not exists
        if tool_id not in self._tools:
            self._tools[tool_id] = button.tool_class()

        self._notify(
            "tool_activated", {"tool_id": tool_id, "tool": self._tools[tool_id]}
        )

        return True

    def deactivate_tool(self, tool_id: str) -> bool:
        """Deactivate a tool."""
        if tool_id not in self.buttons:
            return False

        button = self.buttons[tool_id]
        button.is_active = False

        if self._active_tool == tool_id:
            self._active_tool = None

        self._notify("tool_deactivated", {"tool_id": tool_id})

        return True

    def deactivate_all(self) -> None:
        """Deactivate all tools."""
        for tool_id in list(self.buttons.keys()):
            self.deactivate_tool(tool_id)

    def get_active_tool(self) -> Optional[str]:
        """Get ID of currently active tool."""
        return self._active_tool

    def get_active_tool_instance(self) -> Optional[Any]:
        """Get instance of currently active tool."""
        if self._active_tool and self._active_tool in self._tools:
            return self._tools[self._active_tool]
        return None

    def set_tool_enabled(self, tool_id: str, enabled: bool) -> None:
        """Enable or disable a tool button."""
        if tool_id in self.buttons:
            self.buttons[tool_id].is_enabled = enabled
            if not enabled and self._active_tool == tool_id:
                self.deactivate_tool(tool_id)

    def enable_all_tools(self) -> None:
        """Enable all tool buttons."""
        for tool_id in self.buttons:
            self.set_tool_enabled(tool_id, True)

    def disable_all_tools(self) -> None:
        """Disable all tool buttons."""
        for tool_id in self.buttons:
            self.set_tool_enabled(tool_id, False)

    def handle_shortcut(self, shortcut: str) -> bool:
        """Handle keyboard shortcut.

        Args:
            shortcut: Shortcut key(s)

        Returns:
            True if shortcut was handled
        """
        for tool_id, button in self.buttons.items():
            if button.shortcut.upper() == shortcut.upper():
                if button.is_enabled:
                    self.activate_tool(tool_id)
                return True
        return False

    def get_tool_for_shortcut(self, shortcut: str) -> Optional[str]:
        """Get tool ID for a shortcut."""
        for tool_id, button in self.buttons.items():
            if button.shortcut.upper() == shortcut.upper():
                return tool_id
        return None

    def update_from_selection(self, has_selection: bool) -> None:
        """Update toolbar based on selection state.

        Some tools require objects to be selected.
        """
        # Tools that require selection
        selection_tools = ["move", "rotate", "scale", "trim", "offset", "fillet"]

        for tool_id in selection_tools:
            self.set_tool_enabled(tool_id, has_selection)

    def render(self) -> Dict:
        """Render toolbar specification.

        Returns:
            Dictionary describing toolbar layout
        """
        return {
            "type": "toolbar",
            "orientation": "horizontal",
            "groups": [
                {
                    "name": "Edit",
                    "buttons": [
                        {
                            "id": tool_id,
                            "icon": button.icon,
                            "tooltip": f"{button.tooltip}",
                            "shortcut": button.shortcut,
                            "active": button.is_active,
                            "enabled": button.is_enabled,
                            "action": lambda tid=tool_id: self.activate_tool(tid),
                        }
                        for tool_id, button in self.buttons.items()
                    ],
                }
            ],
        }

    def get_shortcuts(self) -> Dict[str, str]:
        """Get mapping of shortcuts to tool IDs."""
        return {button.shortcut: tool_id for tool_id, button in self.buttons.items()}

    def get_button_state(self, tool_id: str) -> Optional[Dict]:
        """Get state of a button."""
        if tool_id not in self.buttons:
            return None

        button = self.buttons[tool_id]
        return {
            "id": tool_id,
            "icon": button.icon,
            "tooltip": button.tooltip,
            "shortcut": button.shortcut,
            "active": button.is_active,
            "enabled": button.is_enabled,
        }
