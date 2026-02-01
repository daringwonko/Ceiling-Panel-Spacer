"""
BIM Workbench Package

Professional BIM (Building Information Modeling) workbench for
creating and editing 2D/3D architectural and construction elements.
"""

from bim_workbench.core.drafting_tools import (
    # Tools
    LineTool,
    RectangleTool,
    CircleTool,
    ArcTool,
    # Tool management
    ToolManager,
    get_tool_manager,
    activate_tool,
    # Cursor management
    CursorManager,
    get_cursor_manager,
    set_cursor,
    reset_cursor,
    # Base classes
    Tool,
    ToolState,
    # Factory functions
    create_bim_object,
    create_line,
    create_rectangle,
    create_circle,
    create_arc,
    # Utilities
    get_available_tools,
    create_drawing_session,
)

__version__ = "0.1.0"
__all__ = [
    # Version
    "__version__",
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
    # Utilities
    "get_available_tools",
    "create_drawing_session",
]
