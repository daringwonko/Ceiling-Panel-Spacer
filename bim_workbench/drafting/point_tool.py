"""Point drafting tool for BIM Workbench.

Places point markers on single click with multiple styles.
Supports crosshair, dot, plus, and circle marker styles.
Tool remains active for rapid point placement.
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


class MarkerStyle(Enum):
    """Styles for point markers."""

    CROSSHAIR = "crosshair"
    DOT = "dot"
    PLUS = "plus"
    CIRCLE = "circle"


@dataclass
class PointEntity(BaseEntity):
    """Entity representing a point marker."""

    position: Point2D = field(default_factory=lambda: Point2D(0, 0))
    marker_style: MarkerStyle = MarkerStyle.CROSSHAIR
    marker_size: int = 8

    def __init__(
        self,
        position: Point2D = None,
        marker_style: MarkerStyle = MarkerStyle.CROSSHAIR,
        marker_size: int = 8,
    ):
        super().__init__("point")
        self.position = position or Point2D(0, 0)
        self.marker_style = marker_style
        self.marker_size = marker_size

    def render(self, renderer: Any) -> None:
        """Render the point marker."""
        pos = self.position.to_tuple()
        size = self.marker_size
        color = self.color

        if self.marker_style == MarkerStyle.CROSSHAIR:
            # Crosshair: horizontal and vertical lines through point
            renderer.draw_line(
                (pos[0] - size, pos[1]), (pos[0] + size, pos[1]), color, self.linewidth
            )
            renderer.draw_line(
                (pos[0], pos[1] - size), (pos[0], pos[1] + size), color, self.linewidth
            )

        elif self.marker_style == MarkerStyle.DOT:
            # Dot: small filled circle
            renderer.draw_filled_circle(pos, size // 2, color)

        elif self.marker_style == MarkerStyle.PLUS:
            # Plus: diagonal cross
            renderer.draw_line(
                (pos[0] - size, pos[1] - size),
                (pos[0] + size, pos[1] + size),
                color,
                self.linewidth,
            )
            renderer.draw_line(
                (pos[0] - size, pos[1] + size),
                (pos[0] + size, pos[1] - size),
                color,
                self.linewidth,
            )

        elif self.marker_style == MarkerStyle.CIRCLE:
            # Circle: small circle outline
            renderer.draw_circle(pos, size // 2, color)

    def get_bounds(self) -> tuple:
        """Get bounding box of point marker."""
        size = self.marker_size
        half_size = size / 2
        return (
            Point2D(self.position.x - half_size, self.position.y - half_size),
            Point2D(self.position.x + half_size, self.position.y + half_size),
        )


class PointTool(BaseDraftTool):
    """Tool for placing point markers.

    Usage:
    - Left-click: Place point at cursor position
    - Right-click: Cancel/exit tool
    - Number keys (1-9): Change marker size
    - S key: Cycle through marker styles

    Features:
    - Single-click placement
    - Tool remains active for multiple points
    - Four marker styles: crosshair, dot, plus, circle
    - Adjustable marker size
    - Respects snap settings
    - Immediate entity creation on click
    """

    name = "point"
    display_name = "Point"
    icon = "icons/point.png"
    shortcut = "."

    def __init__(self):
        super().__init__()
        self.marker_style: MarkerStyle = MarkerStyle.CROSSHAIR
        self.marker_size: int = 8
        self._style_index: int = 0
        self._styles: List[MarkerStyle] = [
            MarkerStyle.CROSSHAIR,
            MarkerStyle.DOT,
            MarkerStyle.PLUS,
            MarkerStyle.CIRCLE,
        ]

    def on_mouse_press(self, pos: Point2D, button: int) -> bool:
        """Handle mouse press."""
        if button == 1:  # Left click
            # Place point at snapped position
            snapped_pos = self.get_snap_point(pos)

            # Create point entity immediately
            entity = PointEntity(
                position=snapped_pos,
                marker_style=self.marker_style,
                marker_size=self.marker_size,
            )
            self._create_entity(entity)

            self.state = ToolState.ACTIVE
            return True

        elif button == 3:  # Right click
            # Cancel/exit tool
            self.cancel()
            return True

        return False

    def on_mouse_move(self, pos: Point2D) -> bool:
        """Handle mouse move."""
        super().on_mouse_move(pos)
        return False

    def on_mouse_release(self, pos: Point2D, button: int) -> bool:
        """Handle mouse release."""
        return False

    def on_key_press(self, key: str) -> bool:
        """Handle key press."""
        # Number keys to set size (1-9 as scale factors)
        if key in "123456789":
            scale = int(key)
            self.marker_size = 4 + scale * 2  # 6, 8, 10, 12, 14, 16, 18, 20, 22
            return True

        # S key to cycle styles
        if key.lower() == "s":
            self._style_index = (self._style_index + 1) % len(self._styles)
            self.marker_style = self._styles[self._style_index]
            return True

        # Escape to cancel
        if key == "Escape":
            self.cancel()
            return True

        return False

    def render_preview(self, renderer: Any) -> None:
        """Render point preview at cursor."""
        # Show marker preview at mouse position
        pos = self.mouse_pos.to_tuple()
        size = self.marker_size
        color = "#666666"  # Preview color

        if self.marker_style == MarkerStyle.CROSSHAIR:
            renderer.draw_line(
                (pos[0] - size, pos[1]), (pos[0] + size, pos[1]), color, 1.0
            )
            renderer.draw_line(
                (pos[0], pos[1] - size), (pos[0], pos[1] + size), color, 1.0
            )

        elif self.marker_style == MarkerStyle.DOT:
            renderer.draw_filled_circle(pos, size // 2, color)

        elif self.marker_style == MarkerStyle.PLUS:
            renderer.draw_line(
                (pos[0] - size, pos[1] - size),
                (pos[0] + size, pos[1] + size),
                color,
                1.0,
            )
            renderer.draw_line(
                (pos[0] - size, pos[1] + size),
                (pos[0] + size, pos[1] - size),
                color,
                1.0,
            )

        elif self.marker_style == MarkerStyle.CIRCLE:
            renderer.draw_circle(pos, size // 2, color)

        # Draw style indicator
        style_names = {
            MarkerStyle.CROSSHAIR: "Crosshair",
            MarkerStyle.DOT: "Dot",
            MarkerStyle.PLUS: "Plus",
            MarkerStyle.CIRCLE: "Circle",
        }
        style_text = style_names.get(self.marker_style, "Unknown")
        text_pos = (pos[0] + size + 5, pos[1] + 5)
        renderer.draw_text(text_pos, f"{style_text} ({self.marker_size}px)", "#666666")

        # Draw snap indicator if active
        if self.snap_enabled:
            snap_pos = self.get_snap_point(self.mouse_pos)
            if snap_pos.x != self.mouse_pos.x or snap_pos.y != self.mouse_pos.y:
                renderer.draw_circle(snap_pos.to_tuple(), 3, "#0000FF")

    def reset(self) -> None:
        """Reset tool state."""
        super().reset()
        self.marker_style = MarkerStyle.CROSSHAIR
        self.marker_size = 8
        self._style_index = 0

    def finish(self) -> None:
        """Finish is not used for PointTool - entities created immediately."""
        pass

    def get_help_text(self) -> str:
        """Get help text for current state."""
        style_names = {
            MarkerStyle.CROSSHAIR: "Crosshair",
            MarkerStyle.DOT: "Dot",
            MarkerStyle.PLUS: "Plus",
            MarkerStyle.CIRCLE: "Circle",
        }
        style_text = style_names.get(self.marker_style, "Unknown")
        return f"Point: Click to place {style_text} marker ({self.marker_size}px), 1-9 for size, S for style, Right-click to exit"
