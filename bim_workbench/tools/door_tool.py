"""
Door Tool for BIM Workbench

Interactive tool for placing doors on walls with configurable parameters.
"""

from typing import Optional, Dict, Any, Tuple
from bim_workbench.core import Tool, ToolState, create_bim_object
from bim_workbench.objects.door import Door, SwingDirection, makeDoor


class DoorTool(Tool):
    """
    Door placement tool with wall face selection

    Usage:
        1. Activate tool
        2. Click on wall face to place door
        3. Adjust parameters in task panel (width, height, swing)
        4. Apply to create door and cut wall
    """

    def __init__(self):
        super().__init__("Door", "door")
        self.selected_wall: Optional[Dict[str, Any]] = None
        self.click_position: Optional[Tuple[float, float, float]] = None
        self.door: Optional[Door] = None

        # Default parameters
        self.width = 900.0
        self.height = 2100.0
        self.sill_height = 0.0
        self.swing_direction = SwingDirection.RIGHT

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
        self.door = None
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
            # Check if clicking on a wall (simplified - in real implementation
            # would use hit testing against wall geometry)
            wall = self._get_wall_at_position(x, y)
            if wall:
                self.selected_wall = wall
                self.click_position = (x, y, 0.0)  # Assume z=0 for 2D placement
                self.awaiting_wall_selection = False

                # Create preview door
                self._create_preview_door()

                self._update_preview(
                    {
                        "type": "door_preview",
                        "door": self.door.to_dict() if self.door else None,
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
        """
        Get wall at specified position

        In real implementation, would perform hit testing.
        For now, returns a mock wall if canvas has walls.
        """
        if self.canvas and hasattr(self.canvas, "get_objects"):
            objects = self.canvas.get_objects()
            for obj in objects:
                if obj.get("type") == "wall":
                    # Simple bounding box check
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

    def _create_preview_door(self):
        """Create door object with current parameters"""
        if self.click_position:
            self.door = makeDoor(
                host_wall=self.selected_wall,
                position=self.click_position,
                width=self.width,
                height=self.height,
                swing_direction=self.swing_direction,
            )
            self.door.sill_height = self.sill_height

    def set_parameters(
        self,
        width: Optional[float] = None,
        height: Optional[float] = None,
        sill_height: Optional[float] = None,
        swing_direction: Optional[SwingDirection] = None,
    ):
        """
        Update door parameters from task panel

        Args:
            width: Door width in mm
            height: Door height in mm
            sill_height: Sill height in mm
            swing_direction: Door swing direction
        """
        if width is not None:
            self.width = width
        if height is not None:
            self.height = height
        if sill_height is not None:
            self.sill_height = sill_height
        if swing_direction is not None:
            self.swing_direction = swing_direction

        # Update preview door
        if self.door:
            self.door.width = self.width
            self.door.height = self.height
            self.door.sill_height = self.sill_height
            self.door.swing_direction = self.swing_direction

            self._update_preview(
                {
                    "type": "door_preview",
                    "door": self.door.to_dict(),
                    "message": "Parameters updated",
                }
            )

    def apply(self) -> Optional[Dict[str, Any]]:
        """
        Apply door creation with current parameters

        Returns:
            Created BIM object or None if not ready
        """
        if not self.door or not self.selected_wall:
            return None

        # Perform wall cut
        self.door.cut_wall(self.selected_wall)

        # Create BIM object
        door_data = self.door.to_dict()

        bim_object = create_bim_object(
            obj_type="door",
            name=self.door.name,
            geometry=door_data["geometry"],
            properties={
                "width": self.door.width,
                "height": self.door.height,
                "sill_height": self.door.sill_height,
                "swing_direction": self.door.swing_direction.value,
                "host_wall_id": self.selected_wall.get("id"),
                "swing_arc": door_data.get("swing_arc"),
            },
        )

        # Reset for next door
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
            return "Door: Click on wall face to place door"
        return "Door: Adjust parameters and press Enter or click Apply"

    def get_task_panel(self) -> Dict[str, Any]:
        """
        Get task panel configuration for this tool

        Returns:
            Dictionary defining task panel fields
        """
        return {
            "title": "Door Properties",
            "fields": [
                {
                    "name": "width",
                    "type": "float",
                    "label": "Width (mm)",
                    "value": self.width,
                    "min": 800,
                    "max": 2000,
                    "step": 10,
                },
                {
                    "name": "height",
                    "type": "float",
                    "label": "Height (mm)",
                    "value": self.height,
                    "min": 1800,
                    "max": 2400,
                    "step": 10,
                },
                {
                    "name": "sill_height",
                    "type": "float",
                    "label": "Sill Height (mm)",
                    "value": self.sill_height,
                    "min": 0,
                    "max": 300,
                    "step": 10,
                },
                {
                    "name": "swing_direction",
                    "type": "enum",
                    "label": "Swing Direction",
                    "value": self.swing_direction.value,
                    "options": [
                        {"value": "left", "label": "Left"},
                        {"value": "right", "label": "Right"},
                        {"value": "double", "label": "Double"},
                        {"value": "sliding", "label": "Sliding"},
                    ],
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
