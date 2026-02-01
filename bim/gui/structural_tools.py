"""Structural BIM tools for BIM Workbench.

Provides GUI tools for creating structural objects:
- WallTool: Draw base line and extrude to height
- BeamTool: Two-point placement with rectangular profile
- ColumnTool: Single-click placement with profile options
- SlabTool: Polygon/rectangle boundary drawing
"""

from typing import Optional, Tuple, List, Dict, Any, Literal
import math
from enum import Enum, auto


class ToolState(Enum):
    """States for structural creation tools."""

    IDLE = auto()
    DRAWING_BASE = auto()
    DRAWING_BOUNDARY = auto()
    COMPLETE = auto()


class WallTool:
    """Tool for creating walls by drawing base line on working plane.

    Usage:
        1. First click: Set wall start point on working plane
        2. Mouse move: Preview wall base line and extruded wall
        3. Second click: Set wall end point and create wall

    Options:
        - height: Wall height in mm (default: 2800)
        - thickness: Wall thickness in mm (default: 200)
        - material: Wall material (default: "Concrete")
    """

    def __init__(self):
        self.name = "Wall"
        self.icon = "wall"
        self.state = ToolState.IDLE

        # Tool settings
        self.default_height = 2800.0  # mm
        self.default_thickness = 200.0  # mm
        self.default_material = "Concrete"

        # Drawing state
        self.start_point: Optional[Tuple[float, float, float]] = None
        self.end_point: Optional[Tuple[float, float, float]] = None
        self.working_plane_elevation = 0.0

        # Preview data
        self.preview_data: Optional[Dict[str, Any]] = None

    def activate(self, canvas, on_complete=None):
        """Activate the wall tool."""
        self.canvas = canvas
        self.on_complete = on_complete
        self.state = ToolState.IDLE
        self.start_point = None
        self.end_point = None
        self.preview_data = None

    def deactivate(self):
        """Deactivate the tool."""
        self._clear_preview()
        self.state = ToolState.IDLE

    def on_mouse_press(self, x: float, y: float, button: int = 1):
        """Handle mouse press event."""
        if button == 3:  # Right click - cancel
            if self.state != ToolState.IDLE:
                self.cancel()
            return

        if button != 1:  # Only handle left click
            return

        # Get 3D point on working plane
        point = (x, y, self.working_plane_elevation)

        if self.state == ToolState.IDLE:
            # First click - set start point
            self.start_point = point
            self.state = ToolState.DRAWING_BASE
            self._update_preview()

        elif self.state == ToolState.DRAWING_BASE:
            # Second click - set end point and create wall
            self.end_point = point
            self._create_wall()

    def on_mouse_move(self, x: float, y: float, shift_pressed: bool = False):
        """Handle mouse move event."""
        if self.state != ToolState.DRAWING_BASE:
            return

        # Get 3D point on working plane
        point = (x, y, self.working_plane_elevation)

        # Apply ortho constraint if shift is pressed
        if shift_pressed and self.start_point:
            dx = abs(x - self.start_point[0])
            dy = abs(y - self.start_point[1])

            if dx > dy:
                # Horizontal - keep y same as start
                point = (x, self.start_point[1], self.working_plane_elevation)
            else:
                # Vertical - keep x same as start
                point = (self.start_point[0], y, self.working_plane_elevation)

        self.end_point = point
        self._update_preview()

    def on_key_press(self, key: str):
        """Handle key press event."""
        if key == "Escape":
            self.cancel()

    def cancel(self):
        """Cancel current operation."""
        self._clear_preview()
        self.state = ToolState.IDLE
        self.start_point = None
        self.end_point = None

    def _update_preview(self):
        """Update wall preview."""
        if not self.start_point or not self.end_point:
            return

        # Calculate wall length
        dx = self.end_point[0] - self.start_point[0]
        dy = self.end_point[1] - self.start_point[1]
        length = math.sqrt(dx**2 + dy**2)

        self.preview_data = {
            "type": "wall_preview",
            "start_point": self.start_point,
            "end_point": self.end_point,
            "height": self.default_height,
            "thickness": self.default_thickness,
            "length": length,
            "color": "lightblue",
            "opacity": 0.5,
        }

        if hasattr(self, "canvas") and self.canvas:
            self.canvas.update_preview(self.preview_data)

    def _clear_preview(self):
        """Clear preview graphics."""
        if hasattr(self, "canvas") and self.canvas:
            self.canvas.clear_preview()
        self.preview_data = None

    def _create_wall(self):
        """Create wall object and complete operation."""
        if not self.start_point or not self.end_point:
            return

        from ..objects.wall import create_wall

        wall = create_wall(
            start=self.start_point,
            end=self.end_point,
            height=self.default_height,
            thickness=self.default_thickness,
            material=self.default_material,
        )

        # Create BIM object
        bim_object = {
            "id": wall.id,
            "type": "wall",
            "name": f"Wall_{int(wall.length)}",
            "geometry": wall.to_dict(),
            "properties": {
                "height": wall.height,
                "thickness": wall.thickness,
                "material": wall.material,
            },
        }

        self._clear_preview()
        self.state = ToolState.IDLE
        self.start_point = None
        self.end_point = None

        if hasattr(self, "on_complete") and self.on_complete:
            self.on_complete(bim_object)

    def get_status_text(self) -> str:
        """Get status bar text."""
        if self.state == ToolState.DRAWING_BASE:
            return "Wall: Click end point (Shift for ortho)"
        return "Wall: Click start point on working plane"


class BeamTool:
    """Tool for creating beams with two-point placement.

    Usage:
        1. First click: Set beam start point
        2. Mouse move: Preview beam with profile outline
        3. Second click: Set beam end point and create beam

    Options:
        - profile_width: Beam width in mm (default: 200)
        - profile_height: Beam height in mm (default: 400)
        - elevation: Beam elevation in mm (default: 2800)
        - material: Beam material (default: "Concrete")
    """

    def __init__(self):
        self.name = "Beam"
        self.icon = "beam"
        self.state = ToolState.IDLE

        # Tool settings
        self.default_profile_width = 200.0  # mm
        self.default_profile_height = 400.0  # mm
        self.default_elevation = 2800.0  # mm
        self.default_material = "Concrete"

        # Drawing state
        self.start_point: Optional[Tuple[float, float, float]] = None
        self.end_point: Optional[Tuple[float, float, float]] = None

        # Preview data
        self.preview_data: Optional[Dict[str, Any]] = None

    def activate(self, canvas, on_complete=None):
        """Activate the beam tool."""
        self.canvas = canvas
        self.on_complete = on_complete
        self.state = ToolState.IDLE
        self.start_point = None
        self.end_point = None
        self.preview_data = None

    def deactivate(self):
        """Deactivate the tool."""
        self._clear_preview()
        self.state = ToolState.IDLE

    def on_mouse_press(self, x: float, y: float, button: int = 1, z: float = None):
        """Handle mouse press event."""
        if button == 3:  # Right click - cancel
            if self.state != ToolState.IDLE:
                self.cancel()
            return

        if button != 1:  # Only handle left click
            return

        # Get 3D point
        elevation = z if z is not None else self.default_elevation
        point = (x, y, elevation)

        if self.state == ToolState.IDLE:
            # First click - set start point
            self.start_point = point
            self.state = ToolState.DRAWING_BASE
            self._update_preview()

        elif self.state == ToolState.DRAWING_BASE:
            # Second click - set end point and create beam
            self.end_point = point
            self._create_beam()

    def on_mouse_move(
        self, x: float, y: float, shift_pressed: bool = False, z: float = None
    ):
        """Handle mouse move event."""
        if self.state != ToolState.DRAWING_BASE:
            return

        # Get 3D point
        elevation = z if z is not None else self.default_elevation
        point = (x, y, elevation)

        # Apply ortho constraint if shift is pressed
        if shift_pressed and self.start_point:
            dx = abs(x - self.start_point[0])
            dy = abs(y - self.start_point[1])

            if dx > dy:
                point = (x, self.start_point[1], elevation)
            else:
                point = (self.start_point[0], y, elevation)

        self.end_point = point
        self._update_preview()

    def on_key_press(self, key: str):
        """Handle key press event."""
        if key == "Escape":
            self.cancel()

    def cancel(self):
        """Cancel current operation."""
        self._clear_preview()
        self.state = ToolState.IDLE
        self.start_point = None
        self.end_point = None

    def _update_preview(self):
        """Update beam preview."""
        if not self.start_point or not self.end_point:
            return

        # Calculate beam length
        dx = self.end_point[0] - self.start_point[0]
        dy = self.end_point[1] - self.start_point[1]
        dz = self.end_point[2] - self.start_point[2]
        length = math.sqrt(dx**2 + dy**2 + dz**2)

        self.preview_data = {
            "type": "beam_preview",
            "start_point": self.start_point,
            "end_point": self.end_point,
            "profile_width": self.default_profile_width,
            "profile_height": self.default_profile_height,
            "length": length,
            "color": "orange",
            "opacity": 0.6,
        }

        if hasattr(self, "canvas") and self.canvas:
            self.canvas.update_preview(self.preview_data)

    def _clear_preview(self):
        """Clear preview graphics."""
        if hasattr(self, "canvas") and self.canvas:
            self.canvas.clear_preview()
        self.preview_data = None

    def _create_beam(self):
        """Create beam object and complete operation."""
        if not self.start_point or not self.end_point:
            return

        from ..objects.beam import create_beam

        beam = create_beam(
            start=self.start_point,
            end=self.end_point,
            profile_width=self.default_profile_width,
            profile_height=self.default_profile_height,
            material=self.default_material,
        )

        # Create BIM object
        bim_object = {
            "id": beam.id,
            "type": "beam",
            "name": f"Beam_{int(beam.length)}",
            "geometry": beam.to_dict(),
            "properties": {
                "profile_width": beam.profile_width,
                "profile_height": beam.profile_height,
                "elevation": beam.elevation,
                "material": beam.material,
            },
        }

        self._clear_preview()
        self.state = ToolState.IDLE
        self.start_point = None
        self.end_point = None

        if hasattr(self, "on_complete") and self.on_complete:
            self.on_complete(bim_object)

    def get_status_text(self) -> str:
        """Get status bar text."""
        if self.state == ToolState.DRAWING_BASE:
            return f"Beam: Click end point (elevation: {self.default_elevation}mm)"
        return f"Beam: Click start point (elevation: {self.default_elevation}mm)"


class ColumnTool:
    """Tool for creating columns with single-click placement.

    Usage:
        1. Click: Set column position on working plane
        2. Column created immediately at clicked position

    Options:
        - height: Column height in mm (default: 3000)
        - profile_type: "rectangle" or "circle" (default: "rectangle")
        - width: Profile width/diameter in mm (default: 300)
        - depth: Profile depth in mm (rectangle only, default: 300)
        - material: Column material (default: "Concrete")
    """

    def __init__(self):
        self.name = "Column"
        self.icon = "column"
        self.state = ToolState.IDLE

        # Tool settings
        self.default_height = 3000.0  # mm
        self.default_profile_type: Literal["rectangle", "circle"] = "rectangle"
        self.default_width = 300.0  # mm
        self.default_depth = 300.0  # mm (rectangle only)
        self.default_material = "Concrete"
        self.default_base_elevation = 0.0  # mm

        # Preview data
        self.preview_position: Optional[Tuple[float, float]] = None
        self.preview_data: Optional[Dict[str, Any]] = None

    def activate(self, canvas, on_complete=None):
        """Activate the column tool."""
        self.canvas = canvas
        self.on_complete = on_complete
        self.state = ToolState.IDLE
        self.preview_position = None
        self.preview_data = None

    def deactivate(self):
        """Deactivate the tool."""
        self._clear_preview()
        self.state = ToolState.IDLE

    def on_mouse_press(self, x: float, y: float, button: int = 1):
        """Handle mouse press event."""
        if button == 3:  # Right click - cancel
            return

        if button != 1:  # Only handle left click
            return

        # Create column at clicked position
        self._create_column(x, y)

    def on_mouse_move(self, x: float, y: float, shift_pressed: bool = False):
        """Handle mouse move event - update preview."""
        self.preview_position = (x, y)
        self._update_preview()

    def on_key_press(self, key: str):
        """Handle key press event."""
        if key == "Escape":
            self._clear_preview()

    def _update_preview(self):
        """Update column preview at mouse position."""
        if not self.preview_position:
            return

        self.preview_data = {
            "type": "column_preview",
            "position": self.preview_position,
            "height": self.default_height,
            "profile_type": self.default_profile_type,
            "width": self.default_width,
            "depth": self.default_depth
            if self.default_profile_type == "rectangle"
            else None,
            "base_elevation": self.default_base_elevation,
            "color": "green",
            "opacity": 0.4,
        }

        if hasattr(self, "canvas") and self.canvas:
            self.canvas.update_preview(self.preview_data)

    def _clear_preview(self):
        """Clear preview graphics."""
        if hasattr(self, "canvas") and self.canvas:
            self.canvas.clear_preview()
        self.preview_data = None

    def _create_column(self, x: float, y: float):
        """Create column object and complete operation."""
        from ..objects.column import create_column

        column = create_column(
            position=(x, y),
            height=self.default_height,
            profile_type=self.default_profile_type,
            width=self.default_width,
            depth=self.default_depth
            if self.default_profile_type == "rectangle"
            else None,
            base_elevation=self.default_base_elevation,
            material=self.default_material,
        )

        # Create BIM object
        bim_object = {
            "id": column.id,
            "type": "column",
            "name": f"Column_{self.default_profile_type}",
            "geometry": column.to_dict(),
            "properties": {
                "height": column.height,
                "profile_type": column.profile_type,
                "width": column.width,
                "depth": column.depth,
                "material": column.material,
            },
        }

        if hasattr(self, "on_complete") and self.on_complete:
            self.on_complete(bim_object)

    def get_status_text(self) -> str:
        """Get status bar text."""
        dims = (
            f"{self.default_width}x{self.default_depth}"
            if self.default_profile_type == "rectangle"
            else f"D{self.default_width}"
        )
        return f"Column: Click to place ({self.default_profile_type}, {dims}, H={self.default_height})"


class SlabTool:
    """Tool for creating slabs by drawing boundary polygon.

    Usage:
        1. First click: Set first boundary point
        2. Subsequent clicks: Add more boundary points
        3. Double-click or Enter: Close boundary and create slab
        4. Or click first point again to close

    Options:
        - thickness: Slab thickness in mm (default: 200)
        - elevation: Top of slab elevation in mm (default: 3000)
        - extrude_direction: "down" or "up" (default: "down")
        - material: Slab material (default: "Concrete")
    """

    def __init__(self):
        self.name = "Slab"
        self.icon = "slab"
        self.state = ToolState.IDLE

        # Tool settings
        self.default_thickness = 200.0  # mm
        self.default_elevation = 3000.0  # mm
        self.default_extrude_direction: Literal["down", "up"] = "down"
        self.default_material = "Concrete"

        # Drawing state
        self.boundary_points: List[Tuple[float, float]] = []
        self.working_plane_elevation = 3000.0

        # Preview data
        self.preview_data: Optional[Dict[str, Any]] = None

    def activate(self, canvas, on_complete=None):
        """Activate the slab tool."""
        self.canvas = canvas
        self.on_complete = on_complete
        self.state = ToolState.IDLE
        self.boundary_points = []
        self.preview_data = None

    def deactivate(self):
        """Deactivate the tool."""
        self._clear_preview()
        self.state = ToolState.IDLE

    def on_mouse_press(self, x: float, y: float, button: int = 1):
        """Handle mouse press event."""
        if button == 3:  # Right click - cancel
            if self.state != ToolState.IDLE:
                self.cancel()
            return

        if button != 1:  # Only handle left click
            return

        if self.state == ToolState.IDLE:
            # First point
            self.boundary_points = [(x, y)]
            self.state = ToolState.DRAWING_BOUNDARY
            self._update_preview()

        elif self.state == ToolState.DRAWING_BOUNDARY:
            # Check if clicking near first point to close
            if len(self.boundary_points) >= 3:
                first_point = self.boundary_points[0]
                dx = x - first_point[0]
                dy = y - first_point[1]
                dist = math.sqrt(dx**2 + dy**2)

                if dist < 100:  # Within 100mm of first point
                    self._create_slab()
                    return

            # Add new point
            self.boundary_points.append((x, y))
            self._update_preview()

    def on_mouse_move(self, x: float, y: float, shift_pressed: bool = False):
        """Handle mouse move event."""
        if self.state != ToolState.DRAWING_BOUNDARY:
            return

        # Update preview with current mouse position
        temp_points = self.boundary_points + [(x, y)]

        # Calculate temporary area
        area = self._calculate_area(temp_points)

        self.preview_data = {
            "type": "slab_preview",
            "boundary_points": temp_points,
            "thickness": self.default_thickness,
            "elevation": self.default_elevation,
            "area": area,
            "color": "cyan",
            "opacity": 0.3,
        }

        if hasattr(self, "canvas") and self.canvas:
            self.canvas.update_preview(self.preview_data)

    def on_key_press(self, key: str):
        """Handle key press event."""
        if key == "Escape":
            self.cancel()
        elif key == "Return" and self.state == ToolState.DRAWING_BOUNDARY:
            # Close with Enter key
            if len(self.boundary_points) >= 3:
                self._create_slab()

    def cancel(self):
        """Cancel current operation."""
        self._clear_preview()
        self.state = ToolState.IDLE
        self.boundary_points = []

    def _calculate_area(self, points: List[Tuple[float, float]]) -> float:
        """Calculate area of polygon using shoelace formula."""
        n = len(points)
        if n < 3:
            return 0.0

        area = 0.0
        for i in range(n):
            j = (i + 1) % n
            area += points[i][0] * points[j][1]
            area -= points[j][0] * points[i][1]

        return abs(area) / 2

    def _clear_preview(self):
        """Clear preview graphics."""
        if hasattr(self, "canvas") and self.canvas:
            self.canvas.clear_preview()
        self.preview_data = None

    def _create_slab(self):
        """Create slab object and complete operation."""
        if len(self.boundary_points) < 3:
            return

        from ..objects.slab import create_slab

        slab = create_slab(
            boundary=self.boundary_points,
            thickness=self.default_thickness,
            elevation=self.default_elevation,
            material=self.default_material,
            extrude_direction=self.default_extrude_direction,
        )

        # Create BIM object
        bim_object = {
            "id": slab.id,
            "type": "slab",
            "name": f"Slab_{int(slab.area / 1e6)}m2",
            "geometry": slab.to_dict(),
            "properties": {
                "thickness": slab.thickness,
                "elevation": slab.elevation,
                "area": slab.area,
                "material": slab.material,
            },
        }

        self._clear_preview()
        self.state = ToolState.IDLE
        self.boundary_points = []

        if hasattr(self, "on_complete") and self.on_complete:
            self.on_complete(bim_object)

    def get_status_text(self) -> str:
        """Get status bar text."""
        if self.state == ToolState.DRAWING_BOUNDARY:
            point_count = len(self.boundary_points)
            if point_count >= 3:
                return f"Slab: {point_count} points - Click first point or press Enter to close"
            return f"Slab: {point_count} points - Continue drawing boundary"
        return "Slab: Click to start boundary (draw closed polygon)"
