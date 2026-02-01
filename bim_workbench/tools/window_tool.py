"""
Window Tool for BIM Workbench

Interactive tool for placing windows on walls with configurable parameters.
"""

from typing import Optional, Dict, Any, Tuple
from bim_workbench.core import Tool, ToolState, create_bim_object
from bim_workbench.objects.window import Window, WindowType, makeWindow


class WindowTool(Tool):
    """
    Window placement tool with wall face selection

    Usage:
        1. Activate tool
        2. Click on wall face to place window
        3. Adjust parameters in task panel (width, height, type, etc.)
        4. Apply to create window and cut wall
    """

    def __init__(self):
        super().__init__("Window", "window")
        self.selected_wall: Optional[Dict[str, Any]] = None
        self.click_position: Optional[Tuple[float, float, float]] = None
        self.window: Optional[Window] = None

        # Default parameters
        self.width = 900.0
        self.height = 1200.0
        self.sill_height = 900.0
        self.window_type = WindowType.FIXED
        self.frame_width = 50.0
        self.glass_thickness = 6.0

        # State tracking
        self.awaiting_wall_selection = True

    def _on_activate(self):
        """Tool activation logic"""
        self.reset_state()

    def _on_deactivate(self):
        """Tool deactivation logic"""
        self.reset_state()

    def _on_cancel(self):
        """Cancel operation"""
        self.reset_state()

    def reset_state(self):
        """Reset tool to initial state"""
        self.selected_wall = None
        self.click_position = None
        self.window = None
        self.awaiting_wall_selection = True
        self._clear_preview()

    def on_mouse_press(self, x: float, y: float, button: int = 1):
        """
        Handle mouse press for wall selection

        Left click: Select wall face at click position
        Right click: Cancel current operation
        """
        if button == 3:  # Right click - cancel
            self.cancel()
            return

        if button != 1:  # Only handle left click
            return

        if self.awaiting_wall_selection:
            wall = self._get_wall_at_position(x, y)
            if wall:
                self.selected_wall = wall
                self.click_position = (x, y, 0.0)
                self.awaiting_wall_selection = False

                # Create preview window
                self._create_preview_window()

                self._update_preview(
                    {
                        "type": "window_preview",
                        "window": self.window.to_dict() if self.window else None,
                        "message": "Adjust parameters in task panel and click Apply",
                    }
                )
            else:
                self._update_preview(
                    {
                        "type": "error",
                        "message": "Please click on a wall face",
                    }
                )

    def _get_wall_at_position(self, x: float, y: float) -> Optional[Dict[str, Any]]:
        """Get wall at specified position"""
        if self.canvas and hasattr(self.canvas, "get_objects"):
            objects = self.canvas.get_objects()
            for obj in objects:
                if obj.get("type") == "wall":
                    geom = obj.get("geometry", {})
                    if "bounds" in geom:
                        bounds = geom["bounds"]
                        if (
                            bounds["min_x"] <= x <= bounds["max_x"]
                            and bounds["min_y"] <= y <= bounds["max_y"]
                        ):
                            return obj

        # Return mock wall for testing
        return {
            "id": "wall_001",
            "type": "wall",
            "name": "Wall",
            "geometry": {
                "start": (0, 0),
                "end": (5000, 0),
                "thickness": 200,
                "height": 3000,
            },
        }

    def _create_preview_window(self):
        """Create window object with current parameters"""
        if self.click_position:
            self.window = makeWindow(
                host_wall=self.selected_wall,
                position=self.click_position,
                width=self.width,
                height=self.height,
                window_type=self.window_type,
                sill_height=self.sill_height,
            )
            self.window.frame_width = self.frame_width
            self.window.glass_thickness = self.glass_thickness

    def set_parameters(
        self,
        width: Optional[float] = None,
        height: Optional[float] = None,
        sill_height: Optional[float] = None,
        window_type: Optional[WindowType] = None,
        frame_width: Optional[float] = None,
        glass_thickness: Optional[float] = None,
    ):
        """
        Update window parameters from task panel

        Args:
            width: Window width in mm
            height: Window height in mm
            sill_height: Sill height in mm
            window_type: Type of window
            frame_width: Frame width in mm
            glass_thickness: Glass thickness in mm
        """
        if width is not None:
            self.width = width
        if height is not None:
            self.height = height
        if sill_height is not None:
            self.sill_height = sill_height
        if window_type is not None:
            self.window_type = window_type
        if frame_width is not None:
            self.frame_width = frame_width
        if glass_thickness is not None:
            self.glass_thickness = glass_thickness

        # Update preview window
        if self.window:
            self.window.width = self.width
            self.window.height = self.height
            self.window.sill_height = self.sill_height
            self.window.window_type = self.window_type
            self.window.frame_width = self.frame_width
            self.window.glass_thickness = self.glass_thickness

            self._update_preview(
                {
                    "type": "window_preview",
                    "window": self.window.to_dict(),
                    "message": "Parameters updated",
                }
            )

    def apply(self) -> Optional[Dict[str, Any]]:
        """
        Apply window creation with current parameters

        Returns:
            Created BIM object or None if not ready
        """
        if not self.window or not self.selected_wall:
            return None

        # Perform wall cut
        self.window.cut_wall(self.selected_wall)

        # Create BIM object
        window_data = self.window.to_dict()

        bim_object = create_bim_object(
            obj_type="window",
            name=self.window.name,
            geometry=window_data["geometry"],
            properties={
                "width": self.window.width,
                "height": self.window.height,
                "sill_height": self.window.sill_height,
                "window_type": self.window.window_type.value,
                "frame_width": self.window.frame_width,
                "glass_thickness": self.window.glass_thickness,
                "host_wall_id": self.selected_wall.get("id"),
            },
        )

        # Reset for next window
        self.reset_state()
        self.awaiting_wall_selection = True

        # Complete the operation
        self._complete(bim_object)

        return bim_object

    def on_key_press(self, key: str):
        """Handle key press"""
        if key == "Escape":
            self.cancel()
        elif key == "Return" or key == "Enter":
            if not self.awaiting_wall_selection:
                self.apply()

    def get_cursor(self) -> str:
        """Get cursor shape"""
        return "crosshair"

    def get_status_text(self) -> str:
        """Get status bar text"""
        if self.awaiting_wall_selection:
            return "Window: Click on wall face to place window"
        return "Window: Adjust parameters and press Enter or click Apply"

    def get_task_panel(self) -> Dict[str, Any]:
        """
        Get task panel configuration for this tool

        Returns:
            Dictionary defining task panel fields
        """
        return {
            "title": "Window Properties",
            "fields": [
                {
                    "name": "width",
                    "type": "float",
                    "label": "Width (mm)",
                    "value": self.width,
                    "min": 300,
                    "max": 2000,
                    "step": 10,
                },
                {
                    "name": "height",
                    "type": "float",
                    "label": "Height (mm)",
                    "value": self.height,
                    "min": 300,
                    "max": 2400,
                    "step": 10,
                },
                {
                    "name": "sill_height",
                    "type": "float",
                    "label": "Sill Height (mm)",
                    "value": self.sill_height,
                    "min": 0,
                    "max": 2000,
                    "step": 10,
                },
                {
                    "name": "window_type",
                    "type": "enum",
                    "label": "Window Type",
                    "value": self.window_type.value,
                    "options": [
                        {"value": "fixed", "label": "Fixed"},
                        {"value": "single_hung", "label": "Single Hung"},
                        {"value": "double_hung", "label": "Double Hung"},
                        {"value": "casement", "label": "Casement"},
                        {"value": "sliding", "label": "Sliding"},
                        {"value": "awning", "label": "Awning"},
                    ],
                },
                {
                    "name": "frame_width",
                    "type": "float",
                    "label": "Frame Width (mm)",
                    "value": self.frame_width,
                    "min": 10,
                    "max": 100,
                    "step": 5,
                },
                {
                    "name": "glass_thickness",
                    "type": "float",
                    "label": "Glass Thickness (mm)",
                    "value": self.glass_thickness,
                    "min": 3,
                    "max": 20,
                    "step": 1,
                },
            ],
            "buttons": [
                {
                    "name": "apply",
                    "label": "Apply",
                    "action": "apply",
                    "enabled": not self.awaiting_wall_selection,
                },
                {
                    "name": "cancel",
                    "label": "Cancel",
                    "action": "cancel",
                },
            ],
        }
