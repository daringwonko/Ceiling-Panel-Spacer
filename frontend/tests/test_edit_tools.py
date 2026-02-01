"""Tests for editing tools."""

import pytest
import sys
import os

# Add the frontend src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "frontend", "src"))

from tools import MoveTool, RotateTool, ScaleTool, TrimTool, OffsetTool, FilletTool
from snap_system import SnapSystem
from core.geometry import Point, Line, Circle


class TestMoveTool:
    """Test Move tool functionality."""

    def test_move_tool_initialization(self):
        """Test MoveTool initializes correctly."""
        snap = SnapSystem()
        tool = MoveTool(snap)

        assert tool.name == "move"
        assert tool.config.shortcut == "M"
        assert len(tool.selected_objects) == 0

    def test_move_tool_reset(self):
        """Test MoveTool reset clears state."""
        snap = SnapSystem()
        tool = MoveTool(snap)

        # Add some state
        tool.selected_objects.append("object1")
        tool.base_point = Point(100, 100)

        tool.reset()

        assert len(tool.selected_objects) == 0
        assert tool.base_point is None

    def test_move_tool_selection(self):
        """Test MoveTool object selection."""
        snap = SnapSystem()
        tool = MoveTool(snap)

        line = Line(Point(0, 0), Point(100, 100))
        tool.add_selected_object(line)

        assert len(tool.selected_objects) == 1
        assert line in tool.selected_objects

    def test_move_tool_displacement_calculation(self):
        """Test displacement calculation."""
        snap = SnapSystem()
        tool = MoveTool(snap)

        tool.base_point = Point(100, 100)
        tool.current_point = Point(150, 200)
        tool._calculate_displacement()

        assert tool.displacement.x == 50
        assert tool.displacement.y == 100

    def test_move_tool_status_text(self):
        """Test status text updates."""
        snap = SnapSystem()
        tool = MoveTool(snap)

        # Initial state
        assert "Select objects" in tool.get_status_text()

        # With selection
        from tools.move_tool import MoveState

        tool.state = MoveState.SELECTED
        tool.selected_objects.append("obj1")
        assert "Click base point" in tool.get_status_text()


class TestRotateTool:
    """Test Rotate tool functionality."""

    def test_rotate_tool_initialization(self):
        """Test RotateTool initializes correctly."""
        tool = RotateTool()

        assert tool.name == "rotate"
        assert tool.config.shortcut == "RO"
        assert tool.rotation_angle == 0.0

    def test_rotate_tool_reset(self):
        """Test RotateTool reset clears state."""
        tool = RotateTool()

        tool.selected_objects.append("object1")
        tool.center_point = Point(100, 100)
        tool.rotation_angle = 0.785  # 45 degrees

        tool.reset()

        assert len(tool.selected_objects) == 0
        assert tool.center_point is None
        assert tool.rotation_angle == 0.0

    def test_rotate_tool_angle_degrees(self):
        """Test angle conversion to degrees."""
        tool = RotateTool()

        import math

        tool.rotation_angle = math.pi / 2  # 90 degrees

        assert abs(tool.get_angle_degrees() - 90.0) < 0.01

    def test_rotate_tool_copy_mode(self):
        """Test copy mode toggle."""
        tool = RotateTool()

        assert tool.copy_mode is False
        tool.copy_mode = True
        assert tool.copy_mode is True


class TestScaleTool:
    """Test Scale tool functionality."""

    def test_scale_tool_initialization(self):
        """Test ScaleTool initializes correctly."""
        tool = ScaleTool()

        assert tool.name == "scale"
        assert tool.config.shortcut == "SC"
        assert tool.scale_factor == 1.0

    def test_scale_tool_reset(self):
        """Test ScaleTool reset clears state."""
        tool = ScaleTool()

        tool.scale_factor = 2.0
        tool.scale_x = 2.0
        tool.scale_y = 0.5

        tool.reset()

        assert tool.scale_factor == 1.0
        assert tool.scale_x == 1.0
        assert tool.scale_y == 1.0

    def test_scale_tool_uniform_mode(self):
        """Test uniform scaling mode."""
        tool = ScaleTool()

        assert tool.uniform is True
        tool.set_scale_factor(2.0)

        assert tool.scale_x == 2.0
        assert tool.scale_y == 2.0

    def test_scale_tool_copy_mode(self):
        """Test copy mode toggle."""
        tool = ScaleTool()

        assert tool.copy_mode is False
        tool.copy_mode = True
        assert tool.copy_mode is True


class TestTrimTool:
    """Test Trim tool functionality."""

    def test_trim_tool_initialization(self):
        """Test TrimTool initializes correctly."""
        tool = TrimTool()

        assert tool.name == "trim"
        assert tool.config.shortcut == "TR"
        assert tool.mode == "trim"

    def test_trim_tool_reset(self):
        """Test TrimTool reset clears state."""
        tool = TrimTool()

        line = Line(Point(0, 0), Point(100, 0))
        tool.add_cutting_edge(line)
        tool.mode = "extend"

        tool.reset()

        assert len(tool.cutting_edges) == 0
        assert tool.mode == "trim"

    def test_trim_tool_cutting_edges(self):
        """Test cutting edge management."""
        tool = TrimTool()

        line1 = Line(Point(0, 0), Point(100, 0))
        line2 = Line(Point(0, 50), Point(100, 50))

        tool.add_cutting_edge(line1)
        tool.add_cutting_edge(line2)

        assert len(tool.cutting_edges) == 2
        assert line1 in tool.cutting_edges
        assert line2 in tool.cutting_edges

        tool.remove_cutting_edge(line1)
        assert len(tool.cutting_edges) == 1
        assert line1 not in tool.cutting_edges

    def test_trim_tool_mode_switching(self):
        """Test trim/extend mode switching."""
        tool = TrimTool()

        assert tool.mode == "trim"

        tool.set_mode("extend")
        assert tool.mode == "extend"

        tool.set_mode("trim")
        assert tool.mode == "trim"


class TestOffsetTool:
    """Test Offset tool functionality."""

    def test_offset_tool_initialization(self):
        """Test OffsetTool initializes correctly."""
        tool = OffsetTool()

        assert tool.name == "offset"
        assert tool.config.shortcut == "O"
        assert tool.distance == 10.0

    def test_offset_tool_reset(self):
        """Test OffsetTool reset clears state."""
        tool = OffsetTool()

        tool.distance = 25.0
        tool.side = "left"
        tool.delete_original = True

        tool.reset()

        assert tool.distance == 10.0
        assert tool.side is None
        assert tool.delete_original is False

    def test_offset_tool_options(self):
        """Test offset options."""
        tool = OffsetTool()

        assert tool.delete_original is False
        assert tool.multiple_mode is False

        tool.delete_original = True
        tool.multiple_mode = True

        assert tool.delete_original is True
        assert tool.multiple_mode is True


class TestFilletTool:
    """Test Fillet tool functionality."""

    def test_fillet_tool_initialization(self):
        """Test FilletTool initializes correctly."""
        tool = FilletTool()

        assert tool.name == "fillet"
        assert tool.config.shortcut == "F"
        assert tool.radius == 10.0

    def test_fillet_tool_custom_radius(self):
        """Test FilletTool with custom default radius."""
        tool = FilletTool(default_radius=20.0)

        assert tool.radius == 20.0

    def test_fillet_tool_reset(self):
        """Test FilletTool reset clears state."""
        tool = FilletTool()

        line1 = Line(Point(0, 0), Point(100, 100))
        line2 = Line(Point(0, 100), Point(100, 0))

        tool.set_first_line(line1)
        tool.set_second_line(line2)
        tool.radius = 15.0

        tool.reset()

        assert tool.first_line is None
        assert tool.second_line is None
        assert tool.radius == 10.0  # Back to default

    def test_fillet_tool_radius_setting(self):
        """Test radius setting."""
        tool = FilletTool()

        tool.set_radius(25.0)
        assert tool.radius == 25.0

        # Test negative radius (should be clamped to 0)
        tool.set_radius(-5.0)
        assert tool.radius == 0.0

    def test_fillet_tool_trim_mode(self):
        """Test trim mode toggle."""
        tool = FilletTool()

        assert tool.trim_mode is True
        tool.trim_mode = False
        assert tool.trim_mode is False


class TestToolIntegration:
    """Test integration between tools and snap system."""

    def test_move_tool_with_snap(self):
        """Test MoveTool works with snap system."""
        snap = SnapSystem()
        tool = MoveTool(snap)

        # Tool should have reference to snap system
        assert tool.snap_system is snap

    def test_tool_state_transitions(self):
        """Test tool state transitions."""
        tool = MoveTool(SnapSystem())
        from tools.move_tool import MoveState

        # Initial state
        assert tool.state == MoveState.IDLE

        # Simulate selection
        tool.set_selected_objects(["obj1"])
        assert tool.state == MoveState.SELECTED

        # Reset
        tool.reset()
        assert tool.state == MoveState.IDLE

    def test_all_tools_have_required_methods(self):
        """Test all tools implement required interface."""
        tools = [RotateTool(), ScaleTool(), TrimTool(), OffsetTool(), FilletTool()]

        for tool in tools:
            # Check required methods exist
            assert hasattr(tool, "reset")
            assert hasattr(tool, "get_cursor")
            assert hasattr(tool, "on_activate")
            assert hasattr(tool, "on_deactivate")
            assert hasattr(tool, "on_cancel")
            assert callable(tool.reset)


class TestToolKeyboardInput:
    """Test tool keyboard input handling."""

    def test_move_tool_escape_cancels(self):
        """Test Escape key cancels MoveTool."""
        tool = MoveTool(SnapSystem())

        # Activate and set some state
        tool.activate()
        tool.add_selected_object("obj1")

        # Press escape
        handled = tool.on_key_press("escape", {})

        assert handled is True
        assert tool.is_active is False

    def test_rotate_tool_angle_input(self):
        """Test RotateTool accepts angle input."""
        tool = RotateTool()
        from tools.rotate_tool import RotateState

        # Set up for rotation
        tool.state = RotateState.ROTATING
        tool.center_point = Point(100, 100)

        # Simulate typing "45"
        tool.on_key_press("4", {})
        tool.on_key_press("5", {})

        # Buffer should have "45"
        assert tool._keyboard_buffer == "45"

    def test_scale_tool_factor_input(self):
        """Test ScaleTool accepts scale factor input."""
        tool = ScaleTool()
        from tools.scale_tool import ScaleState

        # Set up for scaling
        tool.state = ScaleState.SCALING
        tool.base_point = Point(100, 100)

        # Simulate typing "0.5"
        tool.on_key_press("0", {})
        tool.on_key_press(".", {})
        tool.on_key_press("5", {})

        # Buffer should have "0.5"
        assert tool._keyboard_buffer == "0.5"


class TestToolWorkflows:
    """Test complete tool workflows."""

    def test_simple_move_workflow(self):
        """Test simple move workflow."""
        snap = SnapSystem()
        tool = MoveTool(snap)
        from tools.move_tool import MoveState

        # Start
        tool.activate()
        assert tool.is_active

        # Select object
        tool.set_selected_objects(["line1"])
        assert tool.state == MoveState.SELECTED

        # Set base point
        tool.base_point = Point(0, 0)
        tool.current_point = Point(0, 0)
        tool.state = MoveState.MOVING

        # Move to new position
        tool.current_point = Point(100, 50)
        tool._calculate_displacement()

        assert tool.displacement.x == 100
        assert tool.displacement.y == 50

    def test_simple_rotate_workflow(self):
        """Test simple rotate workflow."""
        tool = RotateTool()
        from tools.rotate_tool import RotateState

        # Start
        tool.activate()

        # Select object
        tool.set_selected_objects(["line1"])
        assert tool.state == RotateState.SELECTED

        # Set center
        tool.center_point = Point(100, 100)
        tool.state = RotateState.SET_CENTER

        # Simulate rotation (45 degrees)
        import math

        tool.start_angle = 0
        tool.current_angle = math.pi / 4
        tool.rotation_angle = math.pi / 4
        tool.state = RotateState.ROTATING

        assert abs(tool.get_angle_degrees() - 45.0) < 0.01


class TestGeometryHelpers:
    """Test geometry helper functions."""

    def test_line_intersection(self):
        """Test line intersection detection."""
        from core.geometry import line_intersection

        line1 = Line(Point(0, 0), Point(100, 100))
        line2 = Line(Point(0, 100), Point(100, 0))

        intersection = line_intersection(line1, line2)

        assert intersection is not None
        assert abs(intersection.x - 50) < 0.1
        assert abs(intersection.y - 50) < 0.1

    def test_parallel_lines_no_intersection(self):
        """Test parallel lines don't intersect."""
        from core.geometry import line_intersection

        line1 = Line(Point(0, 0), Point(100, 0))
        line2 = Line(Point(0, 50), Point(100, 50))

        intersection = line_intersection(line1, line2)

        assert intersection is None

    def test_offset_line(self):
        """Test line offset."""
        from core.geometry import offset_line

        line = Line(Point(0, 0), Point(100, 0))
        offset = offset_line(line, 10, "left")

        # Offset line should be parallel
        assert offset.start.x == 0
        assert offset.start.y == 10  # Offset up by 10
        assert offset.end.x == 100
        assert offset.end.y == 10

    def test_create_fillet_arc(self):
        """Test fillet arc creation."""
        from core.geometry import create_fillet_arc

        line1 = Line(Point(0, 0), Point(100, 0))
        line2 = Line(Point(100, 0), Point(100, 100))

        arc = create_fillet_arc(line1, line2, 10)

        assert arc is not None
        assert arc.radius == 10
        # Arc is created at the corner intersection
        # Center position depends on internal/external fillet choice

    def test_fillet_parallel_lines_fails(self):
        """Test fillet fails for parallel lines."""
        from core.geometry import create_fillet_arc

        line1 = Line(Point(0, 0), Point(100, 0))
        line2 = Line(Point(0, 50), Point(100, 50))

        arc = create_fillet_arc(line1, line2, 10)

        assert arc is None
