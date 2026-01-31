"""Polyline drafting tool for BIM Workbench.

Creates connected line segments with interactive preview.
Supports open and closed polylines with vertex management.
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
class PolylineEntity(BaseEntity):
    """Entity representing a polyline."""

    vertices: List[Point2D] = field(default_factory=list)
    is_closed: bool = False

    def __init__(self, vertices: List[Point2D] = None, is_closed: bool = False):
        super().__init__("polyline")
        self.vertices = vertices or []
        self.is_closed = is_closed

    def render(self, renderer: Any) -> None:
        """Render the polyline."""
        if len(self.vertices) < 2:
            return

        # Draw lines between vertices
        for i in range(len(self.vertices) - 1):
            p1 = self.vertices[i]
            p2 = self.vertices[i + 1]
            renderer.draw_line(p1.to_tuple(), p2.to_tuple(), self.color, self.linewidth)

        # Close polyline if requested
        if self.is_closed and len(self.vertices) > 2:
            p1 = self.vertices[-1]
            p2 = self.vertices[0]
            renderer.draw_line(p1.to_tuple(), p2.to_tuple(), self.color, self.linewidth)

        # Draw vertex markers
        for vertex in self.vertices:
            renderer.draw_square(vertex.to_tuple(), 4, self.color)

    def get_bounds(self) -> tuple:
        """Get bounding box of polyline."""
        if not self.vertices:
            return (Point2D(0, 0), Point2D(0, 0))

        min_x = min(v.x for v in self.vertices)
        max_x = max(v.x for v in self.vertices)
        min_y = min(v.y for v in self.vertices)
        max_y = max(v.y for v in self.vertices)

        return (Point2D(min_x, min_y), Point2D(max_x, max_y))


class PolylineTool(BaseDraftTool):
    """Tool for creating polylines (connected line segments).

    Usage:
    - Left-click: Add vertex at cursor position
    - Double-click: Finish polyline
    - Enter key: Finish polyline
    - Right-click: Remove last vertex or cancel
    - C key: Toggle close polyline (connect last to first)

    Features:
    - Interactive preview during creation
    - Rubber-band line from last vertex to cursor
    - Vertex markers at each point
    - Support for open and closed polylines
    """

    name = "polyline"
    display_name = "Polyline"
    icon = "icons/polyline.png"
    shortcut = "P"

    def __init__(self):
        super().__init__()
        self.vertices: List[Point2D] = []
        self.current_vertex: Optional[Point2D] = None
        self.is_closed: bool = False
        self.double_click_timer: float = 0.0
        self.double_click_threshold: float = 0.3  # seconds

    def on_mouse_press(self, pos: Point2D, button: int) -> bool:
        """Handle mouse press."""
        import time

        if button == 1:  # Left click
            current_time = time.time()

            # Check for double-click
            if (
                current_time - self.double_click_timer < self.double_click_threshold
                and self.vertices
            ):
                # Double-click - finish polyline
                self.finish()
                self.double_click_timer = 0.0
                return True

            self.double_click_timer = current_time

            # Add vertex
            snapped_pos = self.get_snap_point(pos)
            self.vertices.append(snapped_pos)
            self.state = ToolState.ACTIVE
            return True

        elif button == 3:  # Right click
            if self.vertices:
                # Remove last vertex
                self.vertices.pop()
                if not self.vertices:
                    self.state = ToolState.IDLE
                return True
            else:
                # Cancel
                self.cancel()
                return True

        return False

    def on_mouse_move(self, pos: Point2D) -> bool:
        """Handle mouse move."""
        super().on_mouse_move(pos)

        if self.state == ToolState.ACTIVE and self.vertices:
            # Update current vertex for rubber-band line
            self.current_vertex = self.get_snap_point(pos)
            self.state = ToolState.PREVIEW
            return True

        return False

    def on_mouse_release(self, pos: Point2D, button: int) -> bool:
        """Handle mouse release."""
        return False

    def on_key_press(self, key: str) -> bool:
        """Handle key press."""
        key_lower = key.lower()

        if key == "Return" or key == "Enter":
            # Finish polyline
            if len(self.vertices) >= 2:
                self.finish()
            return True

        elif key == "Escape":
            # Cancel
            self.cancel()
            return True

        elif key_lower == "c":
            # Toggle close polyline
            self.is_closed = not self.is_closed
            return True

        return False

    def render_preview(self, renderer: Any) -> None:
        """Render polyline preview."""
        if not self.vertices:
            return

        # Draw lines between vertices
        for i in range(len(self.vertices) - 1):
            p1 = self.vertices[i]
            p2 = self.vertices[i + 1]
            renderer.draw_line(p1.to_tuple(), p2.to_tuple(), "#000000", 1.0)

        # Draw rubber-band line from last vertex to current mouse position
        if self.current_vertex and len(self.vertices) > 0:
            p1 = self.vertices[-1]
            p2 = self.current_vertex
            renderer.draw_line(p1.to_tuple(), p2.to_tuple(), "#666666", 1.0)

        # If closed, draw dashed line from last to first
        if self.is_closed and len(self.vertices) > 2:
            p1 = self.vertices[-1]
            p2 = self.vertices[0]
            renderer.draw_dashed_line(p1.to_tuple(), p2.to_tuple(), "#888888", 1.0)

        # Draw vertex markers
        for i, vertex in enumerate(self.vertices):
            color = "#0000FF" if i == 0 else "#000000"
            renderer.draw_square(vertex.to_tuple(), 4, color)

        # Draw current vertex marker
        if self.current_vertex:
            renderer.draw_circle(self.current_vertex.to_tuple(), 4, "#666666")

    def reset(self) -> None:
        """Reset tool state."""
        super().reset()
        self.vertices.clear()
        self.current_vertex = None
        self.is_closed = False
        self.double_click_timer = 0.0

    def finish(self) -> None:
        """Finish polyline and create entity."""
        if len(self.vertices) >= 2:
            entity = PolylineEntity(
                vertices=self.vertices.copy(), is_closed=self.is_closed
            )
            self._create_entity(entity)

        self.reset()

    def get_help_text(self) -> str:
        """Get help text for current state."""
        if not self.vertices:
            return "Polyline: Click to add first vertex"
        elif len(self.vertices) == 1:
            return "Polyline: Click to add next vertex, Double-click/Enter to finish, C to toggle close"
        else:
            return f"Polyline: {len(self.vertices)} vertices, Click to add, Double-click/Enter to finish, C to toggle close, Right-click to remove last"
