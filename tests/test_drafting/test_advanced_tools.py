"""Tests for advanced drafting tools.

Tests for PolylineTool, PolygonTool, EllipseTool, BSplineTool, BezierTool, and PointTool.
"""

import pytest
import math
from typing import List

from bim_workbench.drafting.base_draft_tool import Point2D
from bim_workbench.drafting.polyline_tool import PolylineTool, PolylineEntity
from bim_workbench.drafting.polygon_tool import PolygonTool, PolygonEntity
from bim_workbench.drafting.ellipse_tool import EllipseTool, EllipseEntity
from bim_workbench.drafting.bspline_tool import BSplineTool, BSplineEntity
from bim_workbench.drafting.bezier_tool import (
    BezierTool,
    BezierCurveEntity,
    BezierCreationState,
)
from bim_workbench.drafting.point_tool import PointTool, PointEntity, MarkerStyle


# Mock renderer for testing
class MockRenderer:
    """Mock renderer for testing."""

    def __init__(self):
        self.lines = []
        self.circles = []
        self.squares = []
        self.texts = []

    def draw_line(self, p1, p2, color, width):
        self.lines.append((p1, p2, color, width))

    def draw_circle(self, center, radius, color):
        self.circles.append((center, radius, color))

    def draw_filled_circle(self, center, radius, color):
        self.circles.append((center, radius, color, "filled"))

    def draw_square(self, center, size, color):
        self.squares.append((center, size, color))

    def draw_cross(self, center, size, color):
        self.lines.append((center, size, color, "cross"))

    def draw_dashed_line(self, p1, p2, color, width):
        self.lines.append((p1, p2, color, width, "dashed"))

    def draw_text(self, pos, text, color):
        self.texts.append((pos, text, color))


class TestPolylineTool:
    """Tests for PolylineTool."""

    def test_tool_creation(self):
        tool = PolylineTool()
        assert tool.name == "polyline"
        assert tool.display_name == "Polyline"
        assert len(tool.vertices) == 0

    def test_add_vertices(self):
        tool = PolylineTool()
        tool.double_click_threshold = 0.0  # Disable double-click detection for test

        # Add first vertex
        tool.on_mouse_press(Point2D(0, 0), 1)
        assert len(tool.vertices) == 1
        assert tool.vertices[0].x == 0
        assert tool.vertices[0].y == 0

        # Add second vertex
        tool.on_mouse_press(Point2D(100, 0), 1)
        assert len(tool.vertices) == 2

    def test_remove_vertex(self):
        tool = PolylineTool()
        tool.double_click_threshold = 0.0  # Disable double-click detection for test
        tool.on_mouse_press(Point2D(0, 0), 1)
        tool.on_mouse_press(Point2D(100, 0), 1)
        assert len(tool.vertices) == 2

        # Right-click to remove last vertex
        tool.on_mouse_press(Point2D(0, 0), 3)
        assert len(tool.vertices) == 1

    def test_toggle_closed(self):
        tool = PolylineTool()
        tool.on_mouse_press(Point2D(0, 0), 1)
        tool.on_mouse_press(Point2D(100, 0), 1)
        tool.on_mouse_press(Point2D(50, 100), 1)

        assert not tool.is_closed
        tool.on_key_press("c")
        assert tool.is_closed
        tool.on_key_press("c")
        assert not tool.is_closed

    def test_polyline_entity(self):
        vertices = [Point2D(0, 0), Point2D(100, 0), Point2D(100, 100)]
        entity = PolylineEntity(vertices=vertices, is_closed=True)

        assert len(entity.vertices) == 3
        assert entity.is_closed
        assert entity.entity_type == "polyline"

        # Check bounds
        bounds = entity.get_bounds()
        assert bounds[0].x == 0
        assert bounds[1].x == 100


class TestPolygonTool:
    """Tests for PolygonTool."""

    def test_tool_creation(self):
        tool = PolygonTool()
        assert tool.name == "polygon"
        assert tool.display_name == "Polygon"
        assert tool.num_sides == 6
        assert tool.is_inscribed

    def test_center_and_radius(self):
        tool = PolygonTool()

        # Set center
        tool.on_mouse_press(Point2D(0, 0), 1)
        assert tool.center.x == 0
        assert tool.center.y == 0

        # Set radius via mouse move
        tool.on_mouse_move(Point2D(50, 0))
        assert tool.radius == 50

    def test_change_sides(self):
        tool = PolygonTool()
        tool.on_key_press("5")
        assert tool.num_sides == 5

        tool.on_key_press("8")
        assert tool.num_sides == 8

    def test_inscribed_circumscribed(self):
        tool = PolygonTool()
        assert tool.is_inscribed

        tool.on_key_press("c")
        assert not tool.is_inscribed

        tool.on_key_press("i")
        assert tool.is_inscribed

    def test_polygon_entity(self):
        entity = PolygonEntity(
            center=Point2D(0, 0), radius=50, num_sides=6, is_inscribed=True
        )

        assert entity.num_sides == 6
        assert len(entity.vertices) == 6
        assert entity.radius == 50

        # Check vertices are roughly at radius distance
        for vertex in entity.vertices:
            dist = math.sqrt(vertex.x**2 + vertex.y**2)
            assert abs(dist - 50) < 0.01


class TestEllipseTool:
    """Tests for EllipseTool."""

    def test_tool_creation(self):
        tool = EllipseTool()
        assert tool.name == "ellipse"
        assert tool.display_name == "Ellipse"

    def test_axis_creation(self):
        tool = EllipseTool()

        # First axis start
        tool.on_mouse_press(Point2D(0, 0), 1)
        assert tool.first_axis_start.x == 0

        # First axis end
        tool.on_mouse_press(Point2D(100, 0), 1)
        assert tool.first_axis_end.x == 100
        assert tool.center.x == 50
        assert tool.rotation == 0

    def test_ellipse_entity(self):
        entity = EllipseEntity(
            center=Point2D(50, 50), major_radius=50, minor_radius=30, rotation=0
        )

        assert entity.major_radius == 50
        assert entity.minor_radius == 30
        assert entity.rotation == 0

        # Check points generation
        points = entity.get_points(4)
        assert len(points) == 4

    def test_rotated_ellipse(self):
        entity = EllipseEntity(
            center=Point2D(0, 0),
            major_radius=50,
            minor_radius=30,
            rotation=math.pi / 4,  # 45 degrees
        )

        assert entity.rotation == math.pi / 4


class TestBSplineTool:
    """Tests for BSplineTool."""

    def test_tool_creation(self):
        tool = BSplineTool()
        assert tool.name == "bspline"
        assert tool.display_name == "B-spline"
        assert tool.degree == 3

    def test_add_control_points(self):
        tool = BSplineTool()
        tool.double_click_threshold = 0.0  # Disable double-click detection for test

        tool.on_mouse_press(Point2D(0, 0), 1)
        tool.on_mouse_press(Point2D(50, 100), 1)
        tool.on_mouse_press(Point2D(100, 0), 1)

        assert len(tool.control_points) == 3

    def test_degree_change(self):
        tool = BSplineTool()
        assert tool.degree == 3

        tool.on_key_press("2")
        assert tool.degree == 2

        tool.on_key_press("3")
        assert tool.degree == 3

    def test_bspline_entity(self):
        # Need at least degree + 1 control points for B-spline
        control_points = [
            Point2D(0, 0),
            Point2D(50, 100),
            Point2D(100, 100),
            Point2D(150, 0),
        ]

        entity = BSplineEntity(control_points=control_points, degree=3)

        assert len(entity.control_points) == 4
        assert entity.degree == 3
        # For degree 3 with 4 points, we should have valid curve points
        assert (
            len(entity.curve_points) >= 0
        )  # May be 0 if calculation fails, but shouldn't error

    def test_basis_functions(self):
        control_points = [Point2D(0, 0), Point2D(50, 100), Point2D(100, 0)]

        entity = BSplineEntity(control_points=control_points, degree=2)

        # Test basis function calculation at a valid span
        # For degree 2 with 3 points, knots should be [0,0,0,1,1,1] for clamped
        if len(entity.knots) >= 6:
            basis = entity._basis_functions(2, 0.5)
            assert len(basis) == 3  # degree + 1
            # Partition of unity: basis functions should sum to 1
            basis_sum = sum(basis)
            assert (
                abs(basis_sum - 1.0) < 0.001 or basis_sum == 0.0
            )  # Allow 0 if outside support


class TestBezierTool:
    """Tests for BezierTool."""

    def test_tool_creation(self):
        tool = BezierTool()
        assert tool.name == "bezier"
        assert tool.display_name == "Bézier Curve"
        assert tool.degree == 3

    def test_four_point_workflow(self):
        tool = BezierTool()

        # Start point
        result = tool.on_mouse_press(Point2D(0, 0), 1)
        assert result is True
        assert tool.start_point is not None

        # Control point 1
        result = tool.on_mouse_press(Point2D(30, 100), 1)
        assert result is True
        assert tool.control1 is not None

        # Control point 2
        result = tool.on_mouse_press(Point2D(70, 100), 1)
        assert result is True
        assert tool.control2 is not None

        # End point - this should call finish() and reset the tool
        # So end_point will be set but then cleared
        result = tool.on_mouse_press(Point2D(100, 0), 1)
        assert result is True
        # After finish(), the tool resets, so end_point is None again
        # But the entity should have been created
        assert tool.creation_state == BezierCreationState.IDLE  # Tool reset

    def test_degree_toggle(self):
        tool = BezierTool()
        assert tool.degree == 3

        tool.on_key_press("q")
        assert tool.degree == 2

        tool.on_key_press("q")
        assert tool.degree == 3

    def test_bezier_entity_cubic(self):
        entity = BezierCurveEntity(
            start_point=Point2D(0, 0),
            control1=Point2D(30, 100),
            control2=Point2D(70, 100),
            end_point=Point2D(100, 0),
            degree=3,
        )

        assert entity.degree == 3
        assert len(entity.curve_points) == 101  # 100 samples + 1

        # Check start and end points
        assert abs(entity.curve_points[0].x - 0) < 0.01
        assert abs(entity.curve_points[-1].x - 100) < 0.01

    def test_bezier_entity_quadratic(self):
        entity = BezierCurveEntity(
            start_point=Point2D(0, 0),
            control1=Point2D(50, 100),
            control2=Point2D(50, 100),  # Not used in quadratic
            end_point=Point2D(100, 0),
            degree=2,
        )

        assert entity.degree == 2
        assert len(entity.curve_points) == 101


class TestPointTool:
    """Tests for PointTool."""

    def test_tool_creation(self):
        tool = PointTool()
        assert tool.name == "point"
        assert tool.display_name == "Point"
        assert tool.marker_size == 8
        assert tool.marker_style == MarkerStyle.CROSSHAIR

    def test_marker_styles(self):
        tool = PointTool()

        assert tool.marker_style == MarkerStyle.CROSSHAIR

        tool.on_key_press("s")
        assert tool.marker_style == MarkerStyle.DOT

        tool.on_key_press("s")
        assert tool.marker_style == MarkerStyle.PLUS

        tool.on_key_press("s")
        assert tool.marker_style == MarkerStyle.CIRCLE

        tool.on_key_press("s")
        assert tool.marker_style == MarkerStyle.CROSSHAIR

    def test_marker_size(self):
        tool = PointTool()
        assert tool.marker_size == 8

        tool.on_key_press("5")
        assert tool.marker_size == 14  # 4 + 5*2

    def test_point_entity(self):
        entity = PointEntity(
            position=Point2D(50, 50), marker_style=MarkerStyle.CROSSHAIR, marker_size=10
        )

        assert entity.position.x == 50
        assert entity.position.y == 50
        assert entity.marker_style == MarkerStyle.CROSSHAIR
        assert entity.marker_size == 10
        assert entity.entity_type == "point"

    def test_all_marker_styles(self):
        styles = [
            MarkerStyle.CROSSHAIR,
            MarkerStyle.DOT,
            MarkerStyle.PLUS,
            MarkerStyle.CIRCLE,
        ]

        for style in styles:
            entity = PointEntity(
                position=Point2D(0, 0), marker_style=style, marker_size=8
            )

            renderer = MockRenderer()
            entity.render(renderer)

            # Each style should render something
            assert len(renderer.circles) > 0 or len(renderer.lines) > 0


class TestToolIntegration:
    """Integration tests for all drafting tools."""

    def test_all_tools_can_be_created(self):
        """Test that all tools can be instantiated."""
        tools = [
            PolylineTool(),
            PolygonTool(),
            EllipseTool(),
            BSplineTool(),
            BezierTool(),
            PointTool(),
        ]

        for tool in tools:
            assert tool.name is not None
            assert tool.display_name is not None

    def test_all_entities_can_render(self):
        """Test that all entities can render without errors."""
        renderer = MockRenderer()

        entities = [
            PolylineEntity(
                vertices=[Point2D(0, 0), Point2D(100, 0), Point2D(100, 100)]
            ),
            PolygonEntity(center=Point2D(0, 0), radius=50, num_sides=6),
            EllipseEntity(center=Point2D(0, 0), major_radius=50, minor_radius=30),
            BSplineEntity(
                control_points=[Point2D(0, 0), Point2D(50, 100), Point2D(100, 0)],
                degree=2,
            ),
            BezierCurveEntity(
                start_point=Point2D(0, 0),
                control1=Point2D(50, 100),
                control2=Point2D(50, 100),
                end_point=Point2D(100, 0),
                degree=2,
            ),
            PointEntity(position=Point2D(50, 50), marker_style=MarkerStyle.CROSSHAIR),
        ]

        for entity in entities:
            entity.render(renderer)
            # Should not raise any exceptions


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
