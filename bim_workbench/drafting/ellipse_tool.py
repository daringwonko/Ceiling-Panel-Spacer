"""Ellipse drafting tool for BIM Workbench.

Creates ellipses via three-click workflow:
1. Set first axis start point
2. Set first axis end point (defines major axis and rotation)
3. Set second axis length (defines minor axis)
"""

from typing import List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum, auto
import math

from bim_workbench.drafting.base_draft_tool import (
    BaseDraftTool,
    Point2D,
    ToolState,
    BaseEntity,
)


@dataclass
class EllipseEntity(BaseEntity):
    """Entity representing an ellipse."""

    center: Point2D = field(default_factory=lambda: Point2D(0, 0))
    major_radius: float = 0.0
    minor_radius: float = 0.0
    rotation: float = 0.0  # radians
    first_axis_start: Point2D = field(default_factory=lambda: Point2D(0, 0))
    first_axis_end: Point2D = field(default_factory=lambda: Point2D(0, 0))

    def __init__(
        self,
        center: Point2D = None,
        major_radius: float = 0.0,
        minor_radius: float = 0.0,
        rotation: float = 0.0,
        first_axis_start: Point2D = None,
        first_axis_end: Point2D = None,
    ):
        super().__init__("ellipse")
        self.center = center or Point2D(0, 0)
        self.major_radius = major_radius
        self.minor_radius = minor_radius
        self.rotation = rotation
        self.first_axis_start = first_axis_start or Point2D(0, 0)
        self.first_axis_end = first_axis_end or Point2D(0, 0)

    def get_points(self, num_points: int = 64) -> List[Point2D]:
        """Generate points along the ellipse."""
        points = []
        for i in range(num_points):
            t = 2 * math.pi * i / num_points
            # Parametric ellipse equation
            x = self.major_radius * math.cos(t)
            y = self.minor_radius * math.sin(t)
            # Rotate
            xr = x * math.cos(self.rotation) - y * math.sin(self.rotation)
            yr = x * math.sin(self.rotation) + y * math.cos(self.rotation)
            # Translate
            points.append(Point2D(self.center.x + xr, self.center.y + yr))
        return points

    def render(self, renderer: Any) -> None:
        """Render the ellipse."""
        points = self.get_points()
        if len(points) < 2:
            return

        # Draw ellipse outline
        for i in range(len(points)):
            p1 = points[i]
            p2 = points[(i + 1) % len(points)]
            renderer.draw_line(p1.to_tuple(), p2.to_tuple(), self.color, self.linewidth)

        # Draw center point
        renderer.draw_cross(self.center.to_tuple(), 6, self.color)

        # Draw axis lines
        # Major axis
        dx = self.major_radius * math.cos(self.rotation)
        dy = self.major_radius * math.sin(self.rotation)
        p1 = Point2D(self.center.x - dx, self.center.y - dy)
        p2 = Point2D(self.center.x + dx, self.center.y + dy)
        renderer.draw_dashed_line(p1.to_tuple(), p2.to_tuple(), "#888888", 0.5)

        # Minor axis
        dx = self.minor_radius * math.cos(self.rotation + math.pi / 2)
        dy = self.minor_radius * math.sin(self.rotation + math.pi / 2)
        p1 = Point2D(self.center.x - dx, self.center.y - dy)
        p2 = Point2D(self.center.x + dx, self.center.y + dy)
        renderer.draw_dashed_line(p1.to_tuple(), p2.to_tuple(), "#888888", 0.5)

    def get_bounds(self) -> tuple:
        """Get bounding box of ellipse."""
        # Approximate bounds using extreme points
        points = self.get_points(16)
        if not points:
            return (self.center, self.center)

        min_x = min(p.x for p in points)
        max_x = max(p.x for p in points)
        min_y = min(p.y for p in points)
        max_y = max(p.y for p in points)

        return (Point2D(min_x, min_y), Point2D(max_x, max_y))


class EllipseCreationState(Enum):
    """States for ellipse creation."""

    IDLE = auto()
    FIRST_AXIS_START = auto()
    FIRST_AXIS_END = auto()
    SECOND_AXIS = auto()


class EllipseTool(BaseDraftTool):
    """Tool for creating ellipses via axis definition.

    Usage:
    - First click: Set first axis start point
    - Drag: Define first axis length and orientation
    - Second click: Confirm first axis
    - Drag (third phase): Define second axis length
    - Third click: Confirm and create ellipse
    - Hold Shift: Constrain first axis to 45° increments
    - Escape: Cancel current operation

    Features:
    - Three-click workflow for precise control
    - Real-time preview showing axes and ellipse
    - Shift constraint for axis alignment
    - Stores both axis endpoints for reference
    """

    name = "ellipse"
    display_name = "Ellipse"
    icon = "icons/ellipse.png"
    shortcut = "E"

    def __init__(self):
        super().__init__()
        self.creation_state = EllipseCreationState.IDLE
        self.first_axis_start: Optional[Point2D] = None
        self.first_axis_end: Optional[Point2D] = None
        self.second_axis_length: float = 0.0
        self.center: Point2D = Point2D(0, 0)
        self.rotation: float = 0.0
        self.constrain_45: bool = False

    def on_mouse_press(self, pos: Point2D, button: int) -> bool:
        """Handle mouse press."""
        if button == 1:  # Left click
            snapped_pos = self.get_snap_point(pos)

            if self.creation_state == EllipseCreationState.IDLE:
                # Set first axis start
                self.first_axis_start = snapped_pos
                self.creation_state = EllipseCreationState.FIRST_AXIS_START
                self.state = ToolState.ACTIVE
                return True

            elif self.creation_state == EllipseCreationState.FIRST_AXIS_START:
                # Confirm first axis end
                self.first_axis_end = snapped_pos
                self._calculate_center_and_rotation()
                self.creation_state = EllipseCreationState.FIRST_AXIS_END
                return True

            elif self.creation_state == EllipseCreationState.FIRST_AXIS_END:
                # Confirm second axis and create ellipse
                self.finish()
                return True

        elif button == 3:  # Right click
            self.cancel()
            return True

        return False

    def on_mouse_move(self, pos: Point2D) -> bool:
        """Handle mouse move."""
        super().on_mouse_move(pos)

        snapped_pos = self.get_snap_point(pos)

        if (
            self.creation_state == EllipseCreationState.FIRST_AXIS_START
            and self.first_axis_start
        ):
            # Update first axis end based on mouse
            if self.constrain_45:
                self.first_axis_end = self._constrain_to_45(
                    self.first_axis_start, snapped_pos
                )
            else:
                self.first_axis_end = snapped_pos
            self.state = ToolState.PREVIEW
            return True

        elif self.creation_state == EllipseCreationState.FIRST_AXIS_END and self.center:
            # Update second axis length
            # Calculate perpendicular distance from center to mouse
            dx = snapped_pos.x - self.center.x
            dy = snapped_pos.y - self.center.y

            # Project onto perpendicular axis
            perp_x = -math.sin(self.rotation)
            perp_y = math.cos(self.rotation)

            self.second_axis_length = abs(dx * perp_x + dy * perp_y) * 2
            self.state = ToolState.PREVIEW
            return True

        return False

    def on_mouse_release(self, pos: Point2D, button: int) -> bool:
        """Handle mouse release."""
        return False

    def on_key_press(self, key: str) -> bool:
        """Handle key press."""
        if key == "Escape":
            if self.creation_state == EllipseCreationState.FIRST_AXIS_START:
                # Go back to start
                self.creation_state = EllipseCreationState.IDLE
                self.first_axis_start = None
                self.state = ToolState.IDLE
            elif self.creation_state == EllipseCreationState.FIRST_AXIS_END:
                # Go back to first axis
                self.creation_state = EllipseCreationState.FIRST_AXIS_START
                self.first_axis_end = None
            else:
                self.cancel()
            return True

        elif key == "Shift_L" or key == "Shift_R":
            self.constrain_45 = True
            return True

        return False

    def on_key_release(self, key: str) -> bool:
        """Handle key release."""
        if key == "Shift_L" or key == "Shift_R":
            self.constrain_45 = False
            return True
        return False

    def _constrain_to_45(self, start: Point2D, end: Point2D) -> Point2D:
        """Constrain point to 45° increments from start."""
        dx = end.x - start.x
        dy = end.y - start.y
        angle = math.atan2(dy, dx)
        distance = math.sqrt(dx**2 + dy**2)

        # Round to nearest 45°
        constrained_angle = round(angle / (math.pi / 4)) * (math.pi / 4)

        return Point2D(
            start.x + distance * math.cos(constrained_angle),
            start.y + distance * math.sin(constrained_angle),
        )

    def _calculate_center_and_rotation(self) -> None:
        """Calculate center and rotation from first axis."""
        if self.first_axis_start and self.first_axis_end:
            self.center = Point2D(
                (self.first_axis_start.x + self.first_axis_end.x) / 2,
                (self.first_axis_start.y + self.first_axis_end.y) / 2,
            )
            dx = self.first_axis_end.x - self.first_axis_start.x
            dy = self.first_axis_end.y - self.first_axis_start.y
            self.rotation = math.atan2(dy, dx)

    def _get_major_radius(self) -> float:
        """Calculate major radius from first axis."""
        if self.first_axis_start and self.first_axis_end:
            dx = self.first_axis_end.x - self.first_axis_start.x
            dy = self.first_axis_end.y - self.first_axis_start.y
            return math.sqrt(dx**2 + dy**2) / 2
        return 0.0

    def render_preview(self, renderer: Any) -> None:
        """Render ellipse preview."""
        if (
            self.creation_state == EllipseCreationState.FIRST_AXIS_START
            and self.first_axis_start
            and self.first_axis_end
        ):
            # Draw first axis line
            renderer.draw_line(
                self.first_axis_start.to_tuple(),
                self.first_axis_end.to_tuple(),
                "#000000",
                1.5,
            )

            # Draw endpoints
            renderer.draw_square(self.first_axis_start.to_tuple(), 4, "#0000FF")
            renderer.draw_square(self.first_axis_end.to_tuple(), 4, "#000000")

        elif self.creation_state == EllipseCreationState.FIRST_AXIS_END and self.center:
            major_radius = self._get_major_radius()

            # Draw first axis
            renderer.draw_dashed_line(
                self.first_axis_start.to_tuple(),
                self.first_axis_end.to_tuple(),
                "#888888",
                0.5,
            )

            # Draw center
            renderer.draw_cross(self.center.to_tuple(), 6, "#0000FF")

            # Draw second axis line (perpendicular)
            perp_x = -math.sin(self.rotation) * self.second_axis_length / 2
            perp_y = math.cos(self.rotation) * self.second_axis_length / 2

            p1 = Point2D(self.center.x - perp_x, self.center.y - perp_y)
            p2 = Point2D(self.center.x + perp_x, self.center.y + perp_y)
            renderer.draw_line(p1.to_tuple(), p2.to_tuple(), "#666666", 1.0)

            # Draw ellipse preview
            if major_radius > 0 and self.second_axis_length > 0:
                ellipse = EllipseEntity(
                    center=self.center,
                    major_radius=major_radius,
                    minor_radius=self.second_axis_length / 2,
                    rotation=self.rotation,
                    first_axis_start=self.first_axis_start,
                    first_axis_end=self.first_axis_end,
                )
                points = ellipse.get_points()
                for i in range(len(points)):
                    p1 = points[i]
                    p2 = points[(i + 1) % len(points)]
                    renderer.draw_line(p1.to_tuple(), p2.to_tuple(), "#000000", 1.5)

    def reset(self) -> None:
        """Reset tool state."""
        super().reset()
        self.creation_state = EllipseCreationState.IDLE
        self.first_axis_start = None
        self.first_axis_end = None
        self.second_axis_length = 0.0
        self.center = Point2D(0, 0)
        self.rotation = 0.0
        self.constrain_45 = False

    def finish(self) -> None:
        """Finish ellipse creation."""
        major_radius = self._get_major_radius()

        if major_radius > 0 and self.second_axis_length > 0:
            entity = EllipseEntity(
                center=self.center,
                major_radius=major_radius,
                minor_radius=self.second_axis_length / 2,
                rotation=self.rotation,
                first_axis_start=self.first_axis_start,
                first_axis_end=self.first_axis_end,
            )
            self._create_entity(entity)

        self.reset()

    def get_help_text(self) -> str:
        """Get help text for current state."""
        if self.creation_state == EllipseCreationState.IDLE:
            return "Ellipse: Click to set first axis start point"
        elif self.creation_state == EllipseCreationState.FIRST_AXIS_START:
            return "Ellipse: Drag to define first axis, Click to confirm (Shift for 45° constraint)"
        elif self.creation_state == EllipseCreationState.FIRST_AXIS_END:
            return "Ellipse: Drag to define second axis, Click to create ellipse, Escape to go back"
        return "Ellipse: Ready"
