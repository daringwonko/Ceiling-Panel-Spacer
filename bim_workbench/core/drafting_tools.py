"""
Core Drafting Tools Module for BIM Workbench

Aggregates all 2D drafting tools and provides unified interface.
"""

from bim_workbench.tools import (
    LineTool,
    RectangleTool,
    CircleTool,
    ArcTool,
    create_line,
    create_rectangle,
    create_circle,
    create_arc,
)
from bim_workbench.ui.tool_manager import (
    ToolManager,
    get_tool_manager,
    activate_tool,
)
from bim_workbench.core.cursor_manager import (
    CursorManager,
    get_cursor_manager,
    set_cursor,
    reset_cursor,
)
from bim_workbench.core import (
    Tool,
    ToolState,
    create_bim_object,
)

__all__ = [
    # Tools
    "LineTool",
    "RectangleTool",
    "CircleTool",
    "ArcTool",
    # Tool management
    "ToolManager",
    "get_tool_manager",
    "activate_tool",
    # Cursor management
    "CursorManager",
    "get_cursor_manager",
    "set_cursor",
    "reset_cursor",
    # Base classes
    "Tool",
    "ToolState",
    # Factory functions
    "create_bim_object",
    "create_line",
    "create_rectangle",
    "create_circle",
    "create_arc",
]


def get_available_tools() -> dict:
    """
    Get dictionary of all available drafting tools

    Returns:
        Dictionary mapping tool_id to tool info
    """
    return {
        "line": {
            "name": "Line",
            "icon": "line",
            "shortcut": "L",
            "description": "Draw straight lines",
            "instruction": "Click start point, then end point (Shift for ortho)",
        },
        "rectangle": {
            "name": "Rectangle",
            "icon": "rectangle",
            "shortcut": "R",
            "description": "Draw rectangles",
            "instruction": "Click first corner, then opposite corner (Shift for square)",
        },
        "circle": {
            "name": "Circle",
            "icon": "circle",
            "shortcut": "C",
            "description": "Draw circles",
            "instruction": "Click center, then radius point (or type value)",
        },
        "arc": {
            "name": "Arc",
            "icon": "arc",
            "shortcut": "A",
            "description": "Draw circular arcs",
            "instruction": "Click center, start point, then end point",
        },
    }


def create_drawing_session() -> tuple:
    """
    Create a complete drawing session with tool and cursor managers

    Returns:
        Tuple of (tool_manager, cursor_manager)
    """
    from bim_workbench.ui.tool_manager import ToolManager
    from bim_workbench.core.cursor_manager import CursorManager

    tm = ToolManager()
    cm = CursorManager()

    # Link them together
    cm.set_tool_manager(tm)

    return tm, cm
