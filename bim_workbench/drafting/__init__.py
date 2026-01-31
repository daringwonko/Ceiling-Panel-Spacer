"""BIM Workbench drafting tools.

Provides tools for creating 2D geometric entities:
- Polyline: Connected line segments
- Polygon: Regular polygons
- Ellipse: Elliptical shapes
- BSpline: B-spline curves
- Bezier: Bézier curves
- Point: Point markers
"""

from bim_workbench.drafting.base_draft_tool import (
    BaseDraftTool,
    Point2D,
    ToolState,
    BaseEntity,
)

# Import tools (will be available after all are created)
try:
    from bim_workbench.drafting.polyline_tool import PolylineTool, PolylineEntity
except ImportError:
    pass

try:
    from bim_workbench.drafting.polygon_tool import PolygonTool, PolygonEntity
except ImportError:
    pass

try:
    from bim_workbench.drafting.ellipse_tool import EllipseTool, EllipseEntity
except ImportError:
    pass

try:
    from bim_workbench.drafting.bspline_tool import BSplineTool, BSplineEntity
except ImportError:
    pass

try:
    from bim_workbench.drafting.bezier_tool import BezierTool, BezierCurveEntity
except ImportError:
    pass

try:
    from bim_workbench.drafting.point_tool import PointTool, PointEntity
except ImportError:
    pass

__all__ = [
    "BaseDraftTool",
    "Point2D",
    "ToolState",
    "BaseEntity",
    "PolylineTool",
    "PolylineEntity",
    "PolygonTool",
    "PolygonEntity",
    "EllipseTool",
    "EllipseEntity",
    "BSplineTool",
    "BSplineEntity",
    "BezierTool",
    "BezierCurveEntity",
    "PointTool",
    "PointEntity",
]
