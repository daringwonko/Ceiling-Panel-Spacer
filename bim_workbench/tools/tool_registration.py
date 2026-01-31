"""Tool registration module.

Registers all drafting tools with the tool manager.
"""

from bim_workbench.tools.tool_manager import tool_manager


def register_all_tools() -> None:
    """Register all drafting tools."""
    # Import and register tools
    try:
        from bim_workbench.drafting.polyline_tool import PolylineTool

        tool_manager.register_tool(PolylineTool)
    except ImportError:
        pass

    try:
        from bim_workbench.drafting.polygon_tool import PolygonTool

        tool_manager.register_tool(PolygonTool)
    except ImportError:
        pass

    try:
        from bim_workbench.drafting.ellipse_tool import EllipseTool

        tool_manager.register_tool(EllipseTool)
    except ImportError:
        pass

    try:
        from bim_workbench.drafting.bspline_tool import BSplineTool

        tool_manager.register_tool(BSplineTool)
    except ImportError:
        pass

    try:
        from bim_workbench.drafting.bezier_tool import BezierTool

        tool_manager.register_tool(BezierTool)
    except ImportError:
        pass

    try:
        from bim_workbench.drafting.point_tool import PointTool

        tool_manager.register_tool(PointTool)
    except ImportError:
        pass
