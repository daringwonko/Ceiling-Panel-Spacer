"""Polygon drafting tool for BIM Workbench.

Creates regular polygons from center and radius.
Supports inscribed (radius to vertex) and circumscribed (radius to edge) modes.
"""

from typing import List, Optional, Any
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
class PolygonEntity(BaseEntity):
    """Entity representing a regular polygon."""

    center: Point2D = field(default_factory=lambda: Point2D(0, 0))
    radius: float = 0.0
    num_sides: int = 6
    is_inscribed: bool = True
    vertices: List[Point2D] = field(default_factory=list)

    def __init__(
        self,
        center: Point2D = None,
        radius: float = 0.0,
        num_sides: int = 6,
        is_inscribed: bool = True,
    ):
        super().__init__("polygon")
        self.center = center or Point2D(0, 0)
        self.radius = radius
        self.num_sides = num_sides
        self.is_inscribed = is_inscribed
        self.vertices = []
        self._calculate_vertices()

    def _calculate_vertices(self) -> None:
        """Calculate polygon vertices based on parameters."""
        self.vertices = []

        # Adjust radius for circumscribed mode
        if not self.is_inscribed:
            # For circumscribed: given radius is distance to edge midpoint
            # Convert to inscribed radius: r_inscribed = r_given / cos(π/n)
            adjusted_radius = self.radius / math.cos(math.pi / self.num_sides)
        else:
            adjusted_radius = self.radius

        # Calculate vertices
        angle_step = 2 * math.pi / self.num_sides
        for i in range(self.num_sides):
            angle = i * angle_step
            x = self.center.x + adjusted_radius * math.cos(angle)
            y = self.center.y + adjusted_radius * math.sin(angle)
            self.vertices.append(Point2D(x, y))

    def render(self, renderer: Any) -> None:
        """Render the polygon."""
        if len(self.vertices) < 3:
            return

        # Draw polygon outline
        for i in range(len(self.vertices)):
            p1 = self.vertices[i]
            p2 = self.vertices[(i + 1) % len(self.vertices)]
            renderer.draw_line(p1.to_tuple(), p2.to_tuple(), self.color, self.linewidth)

        # Draw center point
        renderer.draw_cross(self.center.to_tuple(), 6, self.color)

    def get_bounds(self) -> tuple:
        """Get bounding box of polygon."""
        if not self.vertices:
            return (self.center, self.center)

        min_x = min(v.x for v in self.vertices)
        max_x = max(v.x for v in self.vertices)
        min_y = min(v.y for v in self.vertices)
        max_y = max(v.y for v in self.vertices)

        return (Point2D(min_x, min_y), Point2D(max_x, max_y))


class PolygonCreationState(Enum):
    """States for polygon creation."""

    IDLE = auto()
    SET_CENTER = auto()
    SET_RADIUS = auto()


class PolygonTool(BaseDraftTool):
    """Tool for creating regular polygons.

    Usage:
    - First click: Set center point
    - Drag: Define radius (distance from center)
    - Second click: Confirm radius and create polygon
    - Number keys (3-9): Set number of sides during drag
    - Tab key or I/C keys: Toggle inscribed/circumscribed mode

    Features:
    - Regular polygons with configurable sides
    - Inscribed mode: radius to vertex
    - Circumscribed mode: radius to edge midpoint
    - Real-time preview with polygon outline
    """

    name = "polygon"
    display_name = "Polygon"
    icon = "icons/polygon.png"
    shortcut = "Y"

    def __init__(self):
        super().__init__()
        self.creation_state = PolygonCreationState.IDLE
        self.center: Optional[Point2D] = None
        self.radius: float = 0.0
        self.num_sides: int = 6
        self.is_inscribed: bool = True

    def on_mouse_press(self, pos: Point2D, button: int) -> bool:
        """Handle mouse press."""
        if button == 1:  # Left click
            if self.creation_state == PolygonCreationState.IDLE:
                # Set center point
                self.center = self.get_snap_point(pos)
                self.creation_state = PolygonCreationState.SET_CENTER
                self.state = ToolState.ACTIVE
                return True

            elif self.creation_state == PolygonCreationState.SET_CENTER:
                # Confirm radius and create polygon
                self.finish()
                return True

        elif button == 3:  # Right click
            self.cancel()
            return True

        return False

    def on_mouse_move(self, pos: Point2D) -> bool:
        """Handle mouse move."""
        super().on_mouse_move(pos)

        if self.creation_state == PolygonCreationState.SET_CENTER and self.center:
            # Calculate radius from center to mouse
            mouse_pos = self.get_snap_point(pos)
            dx = mouse_pos.x - self.center.x
            dy = mouse_pos.y - self.center.y
            self.radius = math.sqrt(dx**2 + dy**2)
            self.state = ToolState.PREVIEW
            return True

        return False

    def on_mouse_release(self, pos: Point2D, button: int) -> bool:
        """Handle mouse release."""
        return False

    def on_key_press(self, key: str) -> bool:
        """Handle key press."""
        # Number keys to set sides
        if key in "3456789":
            self.num_sides = int(key)
            return True
        elif key == "0":
            self.num_sides = 10
            return True

        # Tab or I/C to toggle inscribed/circumscribed
        key_lower = key.lower()
        if key == "Tab" or key_lower == "i":
            self.is_inscribed = True
            return True
        elif key_lower == "c":
            self.is_inscribed = False
            return True

        # Escape to cancel
        if key == "Escape":
            self.cancel()
            return True

        return False

    def _calculate_preview_vertices(self) -> List[Point2D]:
        """Calculate vertices for preview."""
        vertices = []

        # Adjust radius for circumscribed mode
        if not self.is_inscribed:
            if self.num_sides > 2:
                adjusted_radius = self.radius / math.cos(math.pi / self.num_sides)
            else:
                adjusted_radius = self.radius
        else:
            adjusted_radius = self.radius

        # Calculate vertices
        angle_step = 2 * math.pi / self.num_sides
        for i in range(self.num_sides):
            angle = i * angle_step
            x = self.center.x + adjusted_radius * math.cos(angle)
            y = self.center.y + adjusted_radius * math.sin(angle)
            vertices.append(Point2D(x, y))

        return vertices

    def render_preview(self, renderer: Any) -> None:
        """Render polygon preview."""
        if not self.center or self.radius <= 0:
            return

        # Draw center point
        renderer.draw_cross(self.center.to_tuple(), 6, "#0000FF")

        # Draw radius line
        angle = math.atan2(
            self.mouse_pos.y - self.center.y, self.mouse_pos.x - self.center.x
        )
        radius_end = Point2D(
            self.center.x + self.radius * math.cos(angle),
            self.center.y + self.radius * math.sin(angle),
        )
        renderer.draw_line(
            self.center.to_tuple(), radius_end.to_tuple(), "#666666", 1.0
        )

        # Draw circle outline for radius reference
        renderer.draw_circle(self.center.to_tuple(), self.radius, "#CCCCCC")

        # Draw polygon
        vertices = self._calculate_preview_vertices()
        if len(vertices) >= 3:
            for i in range(len(vertices)):
                p1 = vertices[i]
                p2 = vertices[(i + 1) % len(vertices)]
                renderer.draw_line(p1.to_tuple(), p2.to_tuple(), "#000000", 1.5)

            # Draw vertices
            for vertex in vertices:
                renderer.draw_circle(vertex.to_tuple(), 3, "#000000")

        # Draw mode indicator
        mode_text = "Inscribed" if self.is_inscribed else "Circumscribed"
        renderer.draw_text(
            (self.center.x, self.center.y - self.radius - 20),
            f"{self.num_sides} sides, {mode_text}",
            "#000000",
        )

    def reset(self) -> None:
        """Reset tool state."""
        super().reset()
        self.creation_state = PolygonCreationState.IDLE
        self.center = None
        self.radius = 0.0
        self.num_sides = 6
        self.is_inscribed = True

    def finish(self) -> None:
        """Finish polygon creation."""
        if self.center and self.radius > 0:
            entity = PolygonEntity(
                center=self.center,
                radius=self.radius,
                num_sides=self.num_sides,
                is_inscribed=self.is_inscribed,
            )
            self._create_entity(entity)

        self.reset()

    def get_help_text(self) -> str:
        """Get help text for current state."""
        if self.creation_state == PolygonCreationState.IDLE:
            return "Polygon: Click to set center point"
        elif self.creation_state == PolygonCreationState.SET_CENTER:
            mode = "Inscribed" if self.is_inscribed else "Circumscribed"
            return f"Polygon: {self.num_sides} sides, {mode} - Click to confirm radius, 3-9 for sides, I/C for mode"
        return "Polygon: Ready"
