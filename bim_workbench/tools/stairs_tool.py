"""
Stairs Tool for BIM Workbench

Interactive tool for drawing stair paths and creating stairs with
real-time 3D preview.
"""

from typing import Optional, Dict, Any, Tuple, List
from bim_workbench.core import Tool, ToolState, create_bim_object
from bim_workbench.objects.stairs import Stairs, PathType, makeStairs


class StairsTool(Tool):
    """
    Stairs creation tool with path drawing and real-time preview

    Usage:
        1. Activate tool
        2. Click to set stair path points (2 for straight, 3 for L, 4 for U)
        3. Adjust TotalRise, TreadDepth, StairWidth in task panel
        4. Real-time 3D preview updates as parameters change
        5. Apply to finalize stairs
    """

    def __init__(self):
        super().__init__("Stairs", "stairs")
        self.path_points: List[Tuple[float, float]] = []
        self.stairs: Optional[Stairs] = None

        # Parameters
        self.total_rise = 3000.0
        self.tread_depth = 280.0
        self.stair_width = 1000.0

        # State
        self.drawing_path = False
        self.max_points = 2  # Default to straight

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
        self.path_points = []
        self.stairs = None
        self.drawing_path = False
        self._clear_preview()

    def on_mouse_press(self, x: float, y: float, button: int = 1):
        """
        Handle mouse press for path drawing

        Left click: Add point to path
        Right click: Cancel current operation
        """
        if button == 3:  # Right click - cancel
            if self.path_points:
                # Remove last point
                self.path_points.pop()
                if not self.path_points:
                    self.drawing_path = False
                self._update_preview(
                    {
                        "type": "stairs_path",
                        "points": self.path_points,
                        "message": f"Point removed. {self.max_points - len(self.path_points)} more needed.",
                    }
                )
            else:
                self.cancel()
            return

        if button != 1:  # Only handle left click
            return

        # Add point to path
        self.path_points.append((x, y))
        self.drawing_path = True

        # Update preview
        self._update_preview(
            {
                "type": "stairs_path",
                "points": self.path_points,
                "message": f"Point added. {self.max_points - len(self.path_points)} more needed.",
            }
        )

        # Check if path is complete
        if len(self.path_points) >= self.max_points:
            self._create_stairs_preview()

    def on_mouse_move(self, x: float, y: float, shift_pressed: bool = False):
        """
        Handle mouse move for path preview

        Shows rubber band line from last point to cursor
        """
        if not self.drawing_path or not self.path_points:
            return

        # Preview line from last point to cursor
        self._update_preview(
            {
                "type": "stairs_path_preview",
                "points": self.path_points + [(x, y)],
                "rubber_band": True,
            }
        )

    def _create_stairs_preview(self):
        """Create stairs object with current path and parameters"""
        if len(self.path_points) >= 2:
            self.stairs = makeStairs(
                path=self.path_points,
                total_rise=self.total_rise,
                tread_depth=self.tread_depth,
                stair_width=self.stair_width,
            )

            self._update_preview(
                {
                    "type": "stairs_3d_preview",
                    "stairs": self.stairs.get_preview_geometry(),
                    "calculations": self.stairs.calculate_risers(),
                    "message": "Adjust parameters in task panel",
                }
            )

    def set_parameters(
        self,
        total_rise: Optional[float] = None,
        tread_depth: Optional[float] = None,
        stair_width: Optional[float] = None,
        path_type: Optional[PathType] = None,
    ):
        """
        Update stair parameters from task panel

        Args:
            total_rise: Total vertical rise in mm
            tread_depth: Tread depth in mm
            stair_width: Stair width in mm
            path_type: Path type (updates max_points)
        """
        if total_rise is not None:
            self.total_rise = total_rise
        if tread_depth is not None:
            self.tread_depth = tread_depth
        if stair_width is not None:
            self.stair_width = stair_width
        if path_type is not None:
            self.max_points = (
                2
                if path_type == PathType.STRAIGHT
                else (3 if path_type == PathType.L_SHAPE else 4)
            )

        # Update preview if stairs exist
        if self.stairs and self.path_points:
            self.stairs.total_rise = self.total_rise
            self.stairs.tread_depth = self.tread_depth
            self.stairs.stair_width = self.stair_width

            self._update_preview(
                {
                    "type": "stairs_3d_preview",
                    "stairs": self.stairs.get_preview_geometry(),
                    "calculations": self.stairs.calculate_risers(),
                    "message": "Parameters updated",
                }
            )

    def set_path_type(self, path_type: PathType):
        """Set path type and update max points"""
        if path_type == PathType.STRAIGHT:
            self.max_points = 2
        elif path_type == PathType.L_SHAPE:
            self.max_points = 3
        else:  # U_SHAPE
            self.max_points = 4

        # Reset if needed
        if len(self.path_points) > self.max_points:
            self.path_points = self.path_points[: self.max_points]
            self._create_stairs_preview()

    def apply(self) -> Optional[Dict[str, Any]]:
        """
        Apply stairs creation with current parameters

        Returns:
            Created BIM object or None if not ready
        """
        if not self.stairs or len(self.path_points) < 2:
            return None

        # Create BIM object
        stairs_data = self.stairs.to_dict()

        bim_object = create_bim_object(
            obj_type="stairs",
            name=self.stairs.name,
            geometry=stairs_data["geometry"],
            properties={
                "total_rise": self.stairs.total_rise,
                "total_run": self.stairs.total_run,
                "tread_depth": self.stairs.tread_depth,
                "riser_height": self.stairs.riser_height,
                "stair_count": self.stairs.stair_count,
                "stair_width": self.stairs.stair_width,
                "path_type": self.stairs.path_type.value,
                "path_points": self.path_points,
                "calculations": stairs_data.get("calculations"),
            },
        )

        # Reset for next stairs
        self.reset_state()

        # Complete the operation
        self._complete(bim_object)

        return bim_object

    def on_key_press(self, key: str):
        """Handle key press"""
        if key == "Escape":
            self.cancel()
        elif key == "Return" or key == "Enter":
            if self.stairs:
                self.apply()

    def get_cursor(self) -> str:
        """Get cursor shape"""
        return "crosshair"

    def get_status_text(self) -> str:
        """Get status bar text"""
        if not self.drawing_path:
            return "Stairs: Click to start drawing path"
        elif len(self.path_points) < self.max_points:
            return f"Stairs: Click to add point ({self.max_points - len(self.path_points)} more needed)"
        else:
            return "Stairs: Adjust parameters and press Enter or click Apply"

    def get_task_panel(self) -> Dict[str, Any]:
        """
        Get task panel configuration for this tool

        Returns:
            Dictionary defining task panel fields
        """
        calculations = self.stairs.calculate_risers() if self.stairs else {}

        return {
            "title": "Stair Properties",
            "fields": [
                {
                    "name": "path_type",
                    "type": "enum",
                    "label": "Path Type",
                    "value": "straight"
                    if self.max_points == 2
                    else ("l_shape" if self.max_points == 3 else "u_shape"),
                    "options": [
                        {"value": "straight", "label": "Straight (2 points)"},
                        {"value": "l_shape", "label": "L-Shape (3 points)"},
                        {"value": "u_shape", "label": "U-Shape (4 points)"},
                    ],
                },
                {
                    "name": "total_rise",
                    "type": "float",
                    "label": "Total Rise (mm)",
                    "value": self.total_rise,
                    "min": 500,
                    "max": 5000,
                    "step": 100,
                },
                {
                    "name": "tread_depth",
                    "type": "float",
                    "label": "Tread Depth (mm)",
                    "value": self.tread_depth,
                    "min": 200,
                    "max": 400,
                    "step": 10,
                },
                {
                    "name": "stair_width",
                    "type": "float",
                    "label": "Stair Width (mm)",
                    "value": self.stair_width,
                    "min": 600,
                    "max": 1500,
                    "step": 50,
                },
                {
                    "name": "calculated_riser",
                    "type": "readonly",
                    "label": "Calculated Riser (mm)",
                    "value": calculations.get("riser_height", "--"),
                },
                {
                    "name": "calculated_count",
                    "type": "readonly",
                    "label": "Number of Stairs",
                    "value": calculations.get("stair_count", "--"),
                },
                {
                    "name": "calculated_run",
                    "type": "readonly",
                    "label": "Total Run (mm)",
                    "value": calculations.get("total_run", "--"),
                },
            ],
            "buttons": [
                {
                    "name": "apply",
                    "label": "Apply",
                    "action": "apply",
                    "enabled": self.stairs is not None,
                },
                {
                    "name": "cancel",
                    "label": "Cancel",
                    "action": "cancel",
                },
            ],
        }
