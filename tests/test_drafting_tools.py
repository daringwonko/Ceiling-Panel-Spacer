"""
Tests for BIM Workbench Drafting Tools

Comprehensive test suite for all 2D drafting tools.
"""

import pytest
import math
from unittest.mock import Mock, MagicMock

# Import tools
from bim_workbench.tools.line_tool import LineTool, create_line
from bim_workbench.tools.rectangle_tool import RectangleTool, create_rectangle
from bim_workbench.tools.circle_tool import CircleTool, create_circle
from bim_workbench.tools.arc_tool import ArcTool, create_arc
from bim_workbench.ui.tool_manager import ToolManager, activate_tool
from bim_workbench.core.cursor_manager import CursorManager
from bim_workbench.core import ToolState, create_bim_object


class TestLineTool:
    """Test cases for LineTool"""

    def test_line_tool_initialization(self):
        """Test LineTool initializes correctly"""
        tool = LineTool()
        assert tool.name == "Line"
        assert tool.icon == "line"
        assert tool.state == ToolState.IDLE
        assert tool.start_point is None
        assert tool.end_point is None

    def test_line_tool_activation(self):
        """Test LineTool activation"""
        tool = LineTool()
        canvas = Mock()

        tool.activate(canvas, on_complete=Mock())

        assert tool.state == ToolState.ACTIVE
        assert tool.canvas == canvas
        assert tool.start_point is None

    def test_line_drawing_sequence(self):
        """Test complete line drawing sequence"""
        tool = LineTool()
        canvas = Mock()
        callback = Mock()

        tool.activate(canvas, on_complete=callback)

        # First click - set start point
        tool.on_mouse_press(0, 0, button=1)
        assert tool.start_point == (0, 0)
        assert tool.state == ToolState.DRAWING

        # Mouse move - preview
        tool.on_mouse_move(100, 100)
        assert tool.end_point == (100, 100)

        # Second click - complete
        tool.on_mouse_press(100, 100, button=1)

        # Verify BIM object created
        assert callback.called
        bim_object = callback.call_args[0][0]
        assert bim_object["type"] == "line"
        assert bim_object["geometry"]["start_point"] == {"x": 0, "y": 0}
        assert bim_object["geometry"]["end_point"] == {"x": 100, "y": 100}
        assert bim_object["geometry"]["length"] == pytest.approx(141.421, rel=0.01)

    def test_line_ortho_mode_horizontal(self):
        """Test ortho mode constrains to horizontal"""
        tool = LineTool()
        canvas = Mock()

        tool.activate(canvas)
        tool.on_mouse_press(0, 0, button=1)

        # Move diagonally but with shift (should constrain to horizontal)
        tool.on_mouse_move(100, 50, shift_pressed=True)

        # Y should be same as start (0)
        assert tool.end_point[1] == 0
        assert tool.ortho_active == True

    def test_line_ortho_mode_vertical(self):
        """Test ortho mode constrains to vertical"""
        tool = LineTool()
        canvas = Mock()

        tool.activate(canvas)
        tool.on_mouse_press(0, 0, button=1)

        # Move diagonally but closer to vertical
        tool.on_mouse_move(50, 100, shift_pressed=True)

        # X should be same as start (0)
        assert tool.end_point[0] == 0

    def test_line_cancel_with_escape(self):
        """Test cancel with Escape key"""
        tool = LineTool()
        canvas = Mock()

        tool.activate(canvas)
        tool.on_mouse_press(0, 0, button=1)
        assert tool.state == ToolState.DRAWING

        tool.on_key_press("Escape")
        assert tool.state == ToolState.ACTIVE
        assert tool.start_point is None

    def test_line_cancel_with_right_click(self):
        """Test cancel with right click"""
        tool = LineTool()
        canvas = Mock()

        tool.activate(canvas)
        tool.on_mouse_press(0, 0, button=1)
        assert tool.state == ToolState.DRAWING

        tool.on_mouse_press(0, 0, button=3)
        assert tool.state == ToolState.ACTIVE
        assert tool.start_point is None

    def test_line_cursor(self):
        """Test line tool cursor"""
        tool = LineTool()
        assert tool.get_cursor() == "crosshair"

    def test_line_status_text(self):
        """Test line tool status text"""
        tool = LineTool()
        canvas = Mock()

        tool.activate(canvas)
        assert "start point" in tool.get_status_text().lower()

        tool.on_mouse_press(0, 0, button=1)
        assert "end point" in tool.get_status_text().lower()


class TestRectangleTool:
    """Test cases for RectangleTool"""

    def test_rectangle_tool_initialization(self):
        """Test RectangleTool initializes correctly"""
        tool = RectangleTool()
        assert tool.name == "Rectangle"
        assert tool.icon == "rectangle"
        assert tool.state == ToolState.IDLE

    def test_rectangle_drawing_sequence(self):
        """Test complete rectangle drawing sequence"""
        tool = RectangleTool()
        canvas = Mock()
        callback = Mock()

        tool.activate(canvas, on_complete=callback)

        # First click - set first corner
        tool.on_mouse_press(0, 0, button=1)
        assert tool.corner1 == (0, 0)

        # Mouse move
        tool.on_mouse_move(100, 50)

        # Second click - complete
        tool.on_mouse_press(100, 50, button=1)

        # Verify BIM object
        assert callback.called
        bim_object = callback.call_args[0][0]
        assert bim_object["type"] == "rectangle"
        assert bim_object["geometry"]["width"] == 100
        assert bim_object["geometry"]["height"] == 50
        assert bim_object["geometry"]["area"] == 5000

    def test_rectangle_square_mode(self):
        """Test square mode with Shift"""
        tool = RectangleTool()
        canvas = Mock()

        tool.activate(canvas)
        tool.on_mouse_press(0, 0, button=1)

        # Move to create non-square, but hold shift
        tool.on_mouse_move(100, 50, shift_pressed=True)

        # Should be constrained to square (50x50 based on smaller dimension)
        assert tool.square_mode == True

    def test_rectangle_zero_size_ignored(self):
        """Test that zero-size rectangles are ignored"""
        tool = RectangleTool()
        canvas = Mock()
        callback = Mock()

        tool.activate(canvas, on_complete=callback)

        tool.on_mouse_press(0, 0, button=1)
        # Click very close to start
        tool.on_mouse_press(0.0001, 0.0001, button=1)

        # Should not create object (too small)
        assert not callback.called


class TestCircleTool:
    """Test cases for CircleTool"""

    def test_circle_tool_initialization(self):
        """Test CircleTool initializes correctly"""
        tool = CircleTool()
        assert tool.name == "Circle"
        assert tool.icon == "circle"
        assert tool.state == ToolState.IDLE

    def test_circle_drawing_sequence(self):
        """Test complete circle drawing sequence"""
        tool = CircleTool()
        canvas = Mock()
        callback = Mock()

        tool.activate(canvas, on_complete=callback)

        # First click - set center
        tool.on_mouse_press(0, 0, button=1)
        assert tool.center == (0, 0)

        # Mouse move
        tool.on_mouse_move(50, 0)

        # Second click - complete
        tool.on_mouse_press(50, 0, button=1)

        # Verify BIM object
        assert callback.called
        bim_object = callback.call_args[0][0]
        assert bim_object["type"] == "circle"
        assert bim_object["geometry"]["radius"] == 50
        assert bim_object["geometry"]["diameter"] == 100
        assert bim_object["geometry"]["circumference"] == pytest.approx(
            314.159, rel=0.01
        )
        assert bim_object["geometry"]["area"] == pytest.approx(7853.98, rel=0.01)

    def test_circle_numeric_input(self):
        """Test numeric radius input"""
        tool = CircleTool()
        canvas = Mock()
        callback = Mock()

        tool.activate(canvas, on_complete=callback)
        tool.on_mouse_press(0, 0, button=1)

        # Type numeric value
        tool.on_key_press("1")
        tool.on_key_press("0")
        tool.on_key_press("0")
        tool.on_key_press("Return")

        # Verify circle with radius 100 created
        assert callback.called
        bim_object = callback.call_args[0][0]
        assert bim_object["geometry"]["radius"] == 100

    def test_circle_minimum_radius(self):
        """Test that circles below minimum radius are rejected"""
        tool = CircleTool()
        canvas = Mock()
        callback = Mock()

        tool.activate(canvas, on_complete=callback)
        tool.on_mouse_press(0, 0, button=1)

        # Try to create very small circle
        tool.on_mouse_press(0.1, 0, button=1)

        # Should not create object
        assert not callback.called


class TestArcTool:
    """Test cases for ArcTool"""

    def test_arc_tool_initialization(self):
        """Test ArcTool initializes correctly"""
        tool = ArcTool()
        assert tool.name == "Arc"
        assert tool.icon == "arc"
        assert tool.state == ToolState.IDLE

    def test_arc_drawing_sequence(self):
        """Test complete arc drawing sequence"""
        tool = ArcTool()
        canvas = Mock()
        callback = Mock()

        tool.activate(canvas, on_complete=callback)

        # First click - set center
        tool.on_mouse_press(0, 0, button=1)
        assert tool.center == (0, 0)

        # Second click - set start point
        tool.on_mouse_press(50, 0, button=1)
        assert tool.start_point == (50, 0)
        assert tool.radius == 50
        assert tool.start_angle == 0

        # Mouse move
        tool.on_mouse_move(0, 50)

        # Third click - set end point
        tool.on_mouse_press(0, 50, button=1)

        # Verify BIM object
        assert callback.called
        bim_object = callback.call_args[0][0]
        assert bim_object["type"] == "arc"
        assert bim_object["geometry"]["radius"] == 50
        assert bim_object["geometry"]["aperture"] == 90
        assert bim_object["geometry"]["start_angle"] == 0
        assert bim_object["geometry"]["end_angle"] == 90

    def test_arc_cancel_steps(self):
        """Test arc cancel goes back steps"""
        tool = ArcTool()
        canvas = Mock()

        tool.activate(canvas)

        # Set center
        tool.on_mouse_press(0, 0, button=1)
        assert tool.center is not None

        # Set start point
        tool.on_mouse_press(50, 0, button=1)
        assert tool.start_point is not None

        # Cancel should go back to waiting for start point
        tool.on_key_press("Escape")
        assert tool.start_point is None
        assert tool.center is not None

        # Cancel again should reset completely
        tool.on_key_press("Escape")
        assert tool.center is None


class TestToolManager:
    """Test cases for ToolManager"""

    def test_tool_manager_initialization(self):
        """Test ToolManager initializes with default tools"""
        tm = ToolManager()

        assert tm.get_tool("line") is not None
        assert tm.get_tool("rectangle") is not None
        assert tm.get_tool("circle") is not None
        assert tm.get_tool("arc") is not None

    def test_tool_activation(self):
        """Test tool activation"""
        tm = ToolManager()

        result = tm.activate_tool("line")
        assert result == True
        assert tm.get_active_tool_id() == "line"

    def test_tool_deactivation(self):
        """Test tool deactivation"""
        tm = ToolManager()

        tm.activate_tool("line")
        assert tm.get_active_tool() is not None

        tm.deactivate_current_tool()
        assert tm.get_active_tool() is None

    def test_invalid_tool_activation(self):
        """Test activation of invalid tool"""
        tm = ToolManager()

        result = tm.activate_tool("nonexistent")
        assert result == False

    def test_keyboard_shortcuts(self):
        """Test keyboard shortcuts"""
        tm = ToolManager()

        # Test 'L' for line
        handled = tm.handle_shortcut("l")
        assert handled == True
        assert tm.get_active_tool_id() == "line"

        # Test 'R' for rectangle
        handled = tm.handle_shortcut("R")
        assert handled == True
        assert tm.get_active_tool_id() == "rectangle"

        # Test invalid shortcut
        handled = tm.handle_shortcut("z")
        assert handled == False

    def test_tool_shortcut_methods(self):
        """Test individual tool selection methods"""
        tm = ToolManager()

        tm.select_line_tool()
        assert tm.get_active_tool_id() == "line"

        tm.select_rectangle_tool()
        assert tm.get_active_tool_id() == "rectangle"

        tm.select_circle_tool()
        assert tm.get_active_tool_id() == "circle"

        tm.select_arc_tool()
        assert tm.get_active_tool_id() == "arc"

    def test_event_routing(self):
        """Test event routing to active tool"""
        tm = ToolManager()
        canvas = Mock()
        tm.set_canvas(canvas)

        tm.activate_tool("line")
        tool = tm.get_active_tool()

        # Mock the tool's methods
        tool.on_mouse_press = Mock()
        tool.on_mouse_move = Mock()
        tool.on_key_press = Mock()

        # Route events
        tm.on_mouse_press(0, 0, button=1)
        assert tool.on_mouse_press.called

        tm.on_mouse_move(10, 10)
        assert tool.on_mouse_move.called

        tm.on_key_press("Escape")
        assert tool.on_key_press.called


class TestCursorManager:
    """Test cases for CursorManager"""

    def test_cursor_manager_initialization(self):
        """Test CursorManager initializes correctly"""
        cm = CursorManager()
        assert cm.get_current_cursor() == "default"

    def test_cursor_setting(self):
        """Test setting cursor types"""
        cm = CursorManager()

        result = cm.set_cursor("crosshair")
        assert result == True
        assert cm.get_current_cursor() == "crosshair"

    def test_invalid_cursor(self):
        """Test setting invalid cursor"""
        cm = CursorManager()

        result = cm.set_cursor("invalid_cursor")
        assert result == False
        assert cm.get_current_cursor() == "default"

    def test_tool_cursor_mapping(self):
        """Test cursor mapping for tools"""
        cm = CursorManager()

        cm.set_cursor_for_tool("line")
        assert cm.get_current_cursor() == "crosshair"

        cm.set_cursor_for_tool("circle")
        assert cm.get_current_cursor() == "crosshair_circle"

    def test_cursor_callback(self):
        """Test cursor change callback"""
        cm = CursorManager()
        callback = Mock()

        cm.set_cursor_change_callback(callback)
        cm.set_cursor("crosshair")

        assert callback.called
        assert callback.call_args[0][0] == "crosshair"

    def test_cursor_info(self):
        """Test getting cursor information"""
        cm = CursorManager()

        info = cm.get_cursor_info("crosshair")
        assert "shape" in info
        assert "description" in info
        assert info["shape"] == "cross"


class TestHelperFunctions:
    """Test cases for helper functions"""

    def test_create_line(self):
        """Test create_line helper"""
        obj = create_line((0, 0), (100, 0))

        assert obj["type"] == "line"
        assert obj["geometry"]["length"] == 100
        assert obj["geometry"]["angle"] == 0

    def test_create_rectangle(self):
        """Test create_rectangle helper"""
        obj = create_rectangle((0, 0), (100, 50))

        assert obj["type"] == "rectangle"
        assert obj["geometry"]["width"] == 100
        assert obj["geometry"]["height"] == 50
        assert obj["geometry"]["area"] == 5000

    def test_create_circle(self):
        """Test create_circle helper"""
        obj = create_circle((0, 0), 50)

        assert obj["type"] == "circle"
        assert obj["geometry"]["radius"] == 50
        assert obj["geometry"]["diameter"] == 100

    def test_create_arc(self):
        """Test create_arc helper"""
        obj = create_arc((0, 0), 50, 0, 90)

        assert obj["type"] == "arc"
        assert obj["geometry"]["radius"] == 50
        assert obj["geometry"]["aperture"] == 90

    def test_create_bim_object(self):
        """Test create_bim_object helper"""
        obj = create_bim_object(
            obj_type="custom",
            name="TestObject",
            geometry={"x": 10, "y": 20},
            properties={"color": "red"},
        )

        assert obj["type"] == "custom"
        assert obj["name"] == "TestObject"
        assert obj["geometry"]["x"] == 10
        assert obj["properties"]["color"] == "red"
        assert "id" in obj
        assert "created_at" in obj


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
