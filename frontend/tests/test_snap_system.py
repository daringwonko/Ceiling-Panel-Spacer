"""Tests for snap system."""

import pytest
import sys
import os

# Add the frontend src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

# Now import modules directly
from snap_system import SnapSystem, SnapType, SnapConfig, SnapResult, SnapIndicator
from core.geometry import Point, Line, Circle


class TestSnapConfig:
    """Test snap configuration."""

    def test_default_config(self):
        """Test default configuration values."""
        config = SnapConfig()
        assert config.snap_distance == 10
        assert config.grid_size == 100
        assert config.enabled[SnapType.GRID.value] is True
        assert config.enabled[SnapType.ENDPOINT.value] is True
        assert config.enabled[SnapType.MIDPOINT.value] is True

    def test_custom_config(self):
        """Test custom configuration."""
        config = SnapConfig(
            snap_distance=20, grid_size=50, enabled={SnapType.GRID.value: False}
        )
        assert config.snap_distance == 20
        assert config.grid_size == 50
        assert config.enabled[SnapType.GRID.value] is False


class TestSnapSystemInitialization:
    """Test snap system initialization."""

    def test_default_initialization(self):
        """Test initialization with default config."""
        snap = SnapSystem()
        assert snap.config.snap_distance == 10
        assert snap.config.grid_size == 100

    def test_custom_initialization(self):
        """Test initialization with custom config."""
        config = SnapConfig(snap_distance=25)
        snap = SnapSystem(config)
        assert snap.config.snap_distance == 25


class TestGridSnap:
    """Test grid snapping functionality."""

    def test_snap_to_grid_point(self):
        """Test snapping to grid intersection."""
        snap = SnapSystem()
        point = Point(105, 205)  # Near 100, 200 grid point
        result = snap._snap_grid(point, [])

        assert result is not None
        assert result.point.x == 100
        assert result.point.y == 200
        assert result.snap_type == SnapType.GRID

    def test_snap_to_exact_grid_point(self):
        """Test snapping when already on grid."""
        snap = SnapSystem()
        point = Point(200, 300)
        result = snap._snap_grid(point, [])

        assert result is not None
        assert result.point.x == 200
        assert result.point.y == 300
        assert result.distance == 0

    def test_custom_grid_size(self):
        """Test snapping with custom grid size."""
        snap = SnapSystem()
        snap.set_grid_size(50)
        point = Point(75, 125)
        result = snap._snap_grid(point, [])

        assert result.point.x == 100  # Rounded to nearest 50
        assert result.point.y == 100


class TestEndpointSnap:
    """Test endpoint snapping functionality."""

    def test_snap_to_line_endpoint(self):
        """Test snapping to line endpoint."""
        snap = SnapSystem()
        line = Line(Point(0, 0), Point(100, 100))
        point = Point(8, 8)  # Near start point

        result = snap._snap_endpoint(point, [line])

        assert result is not None
        assert result.point.x == 0
        assert result.point.y == 0
        assert result.snap_type == SnapType.ENDPOINT

    def test_snap_to_line_end(self):
        """Test snapping to line end point."""
        snap = SnapSystem()
        line = Line(Point(0, 0), Point(100, 100))
        point = Point(105, 105)  # Near end point

        result = snap._snap_endpoint(point, [line])

        assert result is not None
        assert result.point.x == 100
        assert result.point.y == 100

    def test_closest_endpoint_wins(self):
        """Test that closest endpoint is selected."""
        snap = SnapSystem()
        line = Line(Point(0, 0), Point(100, 0))
        point = Point(30, 5)  # Closer to start (0,0)

        result = snap._snap_endpoint(point, [line])

        assert result.point.x == 0  # Start is closer


class TestMidpointSnap:
    """Test midpoint snapping functionality."""

    def test_snap_to_midpoint(self):
        """Test snapping to line midpoint."""
        snap = SnapSystem()
        line = Line(Point(0, 0), Point(100, 100))
        point = Point(53, 53)  # Near midpoint (50, 50)

        result = snap._snap_midpoint(point, [line])

        assert result is not None
        assert result.point.x == 50
        assert result.point.y == 50
        assert result.snap_type == SnapType.MIDPOINT

    def test_midpoint_calculation(self):
        """Test midpoint is calculated correctly."""
        snap = SnapSystem()
        line = Line(Point(0, 100), Point(200, 300))
        point = Point(102, 202)  # Near midpoint (100, 200)

        result = snap._snap_midpoint(point, [line])

        assert result.point.x == 100
        assert result.point.y == 200


class TestCenterSnap:
    """Test center snapping functionality."""

    def test_snap_to_circle_center(self):
        """Test snapping to circle center."""
        snap = SnapSystem()
        circle = Circle(Point(100, 100), 50)
        point = Point(108, 108)  # Near center

        result = snap._snap_center(point, [circle])

        assert result is not None
        assert result.point.x == 100
        assert result.point.y == 100
        assert result.snap_type == SnapType.CENTER


class TestIntersectionSnap:
    """Test intersection snapping functionality."""

    def test_snap_to_intersection(self):
        """Test snapping to line intersection."""
        snap = SnapSystem()
        line1 = Line(Point(0, 0), Point(100, 100))
        line2 = Line(Point(0, 100), Point(100, 0))
        point = Point(53, 53)  # Near intersection at (50, 50)

        result = snap._snap_intersection(point, [line1, line2])

        assert result is not None
        assert abs(result.point.x - 50) < 0.1
        assert abs(result.point.y - 50) < 0.1
        assert result.snap_type == SnapType.INTERSECTION

    def test_no_intersection_for_parallel_lines(self):
        """Test no intersection for parallel lines."""
        snap = SnapSystem()
        line1 = Line(Point(0, 0), Point(100, 0))
        line2 = Line(Point(0, 50), Point(100, 50))
        point = Point(50, 25)

        result = snap._snap_intersection(point, [line1, line2])

        assert result is None


class TestSnapPriority:
    """Test snap priority and distance."""

    def test_closest_snap_wins(self):
        """Test that closest snap point is selected."""
        snap = SnapSystem()
        snap.set_snap_distance(20)  # Increase snap distance
        line = Line(Point(0, 0), Point(100, 0))
        # Point closer to endpoint (0,0) than midpoint (50,0)
        point = Point(5, 5)  # Closer to (0,0)

        result = snap.get_snap_point(point, [line])

        assert result is not None
        # Should snap to endpoint at (0,0), not midpoint at (50,0)
        assert result.point.x == 0

    def test_snap_distance_limit(self):
        """Test that points beyond snap distance are not snapped."""
        snap = SnapSystem()
        snap.set_snap_distance(10)
        line = Line(Point(0, 0), Point(100, 100))
        point = Point(50, 50)  # Far from both endpoints

        result = snap._snap_endpoint(point, [line])

        # Should still return a result, but distance check is in get_snap_point
        assert result is not None
        assert result.distance > 10  # Beyond snap distance

    def test_no_snap_beyond_distance(self):
        """Test that get_snap_point returns None for distant points."""
        snap = SnapSystem()
        snap.set_snap_distance(10)
        line = Line(Point(0, 0), Point(100, 100))
        point = Point(50, 50)  # Far from endpoints

        # Enable only endpoint snap
        snap.config.enabled = {SnapType.ENDPOINT.value: True}
        result = snap.get_snap_point(point, [line])

        assert result is None


class TestSnapConfiguration:
    """Test snap configuration methods."""

    def test_enable_disable_snap(self):
        """Test enabling and disabling snap types."""
        snap = SnapSystem()

        # Disable grid
        snap.disable_snap(SnapType.GRID)
        assert snap.config.enabled[SnapType.GRID.value] is False

        # Enable grid
        snap.enable_snap(SnapType.GRID)
        assert snap.config.enabled[SnapType.GRID.value] is True

    def test_toggle_snap(self):
        """Test toggling snap types."""
        snap = SnapSystem()

        # Toggle off
        result = snap.toggle_snap(SnapType.GRID)
        assert result is False
        assert snap.config.enabled[SnapType.GRID.value] is False

        # Toggle on
        result = snap.toggle_snap(SnapType.GRID)
        assert result is True
        assert snap.config.enabled[SnapType.GRID.value] is True

    def test_set_snap_distance(self):
        """Test setting snap distance."""
        snap = SnapSystem()
        snap.set_snap_distance(25)
        assert snap.config.snap_distance == 25

        # Test minimum value
        snap.set_snap_distance(-5)
        assert snap.config.snap_distance == 1

    def test_set_grid_size(self):
        """Test setting grid size."""
        snap = SnapSystem()
        snap.set_grid_size(50)
        assert snap.config.grid_size == 50

        # Test minimum value
        snap.set_grid_size(-5)
        assert snap.config.grid_size == 1


class TestSnapIndicator:
    """Test snap indicator functionality."""

    def test_indicator_visibility(self):
        """Test that indicator is visible after successful snap."""
        snap = SnapSystem()
        line = Line(Point(0, 0), Point(100, 100))
        point = Point(5, 5)

        snap.get_snap_point(point, [line])
        indicator = snap.get_indicator()

        assert indicator.visible is True
        assert indicator.point.x == 0
        assert indicator.point.y == 0

    def test_indicator_label(self):
        """Test that indicator has correct label."""
        snap = SnapSystem()
        line = Line(Point(0, 0), Point(100, 100))
        point = Point(5, 5)

        snap.get_snap_point(point, [line])
        indicator = snap.get_indicator()

        assert indicator.label == "ENDPOINT"

    def test_clear_indicator(self):
        """Test clearing snap indicator."""
        snap = SnapSystem()
        line = Line(Point(0, 0), Point(100, 100))
        point = Point(5, 5)

        snap.get_snap_point(point, [line])
        snap.clear_indicator()
        indicator = snap.get_indicator()

        assert indicator.visible is False


class TestDisabledSnaps:
    """Test behavior with disabled snap types."""

    def test_disabled_snap_not_considered(self):
        """Test that disabled snap types are not checked."""
        snap = SnapSystem()
        snap.disable_snap(SnapType.ENDPOINT)
        line = Line(Point(0, 0), Point(100, 100))
        point = Point(5, 5)

        # With endpoint disabled, should not snap
        result = snap.get_snap_point(point, [line])

        # Should not snap to endpoint since it's disabled
        # But grid might still catch it
        if result:
            assert result.snap_type != SnapType.ENDPOINT

    def test_all_snaps_disabled(self):
        """Test behavior when all snaps are disabled."""
        snap = SnapSystem()
        for snap_type in SnapType:
            snap.disable_snap(snap_type)

        line = Line(Point(0, 0), Point(100, 100))
        point = Point(5, 5)

        result = snap.get_snap_point(point, [line])

        assert result is None


class TestMultipleGeometry:
    """Test snapping with multiple geometry objects."""

    def test_snap_to_closest_of_multiple(self):
        """Test snapping to closest point among multiple objects."""
        snap = SnapSystem()
        line1 = Line(Point(0, 0), Point(100, 0))
        line2 = Line(Point(200, 0), Point(300, 0))
        point = Point(210, 5)  # Closer to line2's start

        result = snap._snap_endpoint(point, [line1, line2])

        assert result is not None
        assert result.point.x == 200  # line2's start

    def test_snap_across_different_types(self):
        """Test snapping works across different geometry types."""
        snap = SnapSystem()
        line = Line(Point(0, 0), Point(100, 100))
        circle = Circle(Point(200, 200), 50)
        point = Point(205, 205)  # Near circle center

        result = snap._snap_center(point, [line, circle])

        assert result is not None
        assert result.point.x == 200
        assert result.point.y == 200
