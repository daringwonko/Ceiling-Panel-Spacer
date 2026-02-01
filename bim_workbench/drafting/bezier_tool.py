"""Bézier curve drafting tool for BIM Workbench.

Creates cubic Bézier curves via four-click workflow.
Implements Bézier interpolation formula with control handles.
Supports both cubic and quadratic Bézier curves.
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
class BezierCurveEntity(BaseEntity):
    """Entity representing a Bézier curve."""

    start_point: Point2D = field(default_factory=lambda: Point2D(0, 0))
    control1: Point2D = field(default_factory=lambda: Point2D(0, 0))
    control2: Point2D = field(default_factory=lambda: Point2D(0, 0))
    end_point: Point2D = field(default_factory=lambda: Point2D(0, 0))
    degree: int = 3
    curve_points: List[Point2D] = field(default_factory=list)

    def __init__(
        self,
        start_point: Point2D = None,
        control1: Point2D = None,
        control2: Point2D = None,
        end_point: Point2D = None,
        degree: int = 3,
    ):
        super().__init__("bezier")
        self.start_point = start_point or Point2D(0, 0)
        self.control1 = control1 or Point2D(0, 0)
        self.control2 = control2 or Point2D(0, 0)
        self.end_point = end_point or Point2D(0, 0)
        self.degree = degree
        self.curve_points = []
        self._calculate_curve()

    def _calculate_cubic(self, num_samples: int = 100) -> List[Point2D]:
        """Calculate cubic Bézier curve points.

        B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
        """
        points = []
        p0 = self.start_point
        p1 = self.control1
        p2 = self.control2
        p3 = self.end_point

        for i in range(num_samples + 1):
            t = i / num_samples

            # Bernstein polynomials
            b0 = (1 - t) ** 3
            b1 = 3 * (1 - t) ** 2 * t
            b2 = 3 * (1 - t) * t**2
            b3 = t**3

            x = b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x
            y = b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y

            points.append(Point2D(x, y))

        return points

    def _calculate_quadratic(self, num_samples: int = 100) -> List[Point2D]:
        """Calculate quadratic Bézier curve points.

        B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
        """
        points = []
        p0 = self.start_point
        p1 = self.control1
        p2 = self.end_point

        for i in range(num_samples + 1):
            t = i / num_samples

            # Bernstein polynomials
            b0 = (1 - t) ** 2
            b1 = 2 * (1 - t) * t
            b2 = t**2

            x = b0 * p0.x + b1 * p1.x + b2 * p2.x
            y = b0 * p0.y + b1 * p1.y + b2 * p2.y

            points.append(Point2D(x, y))

        return points

    def _calculate_curve(self, num_samples: int = 100) -> None:
        """Calculate curve points based on degree."""
        if self.degree == 3:
            self.curve_points = self._calculate_cubic(num_samples)
        elif self.degree == 2:
            self.curve_points = self._calculate_quadratic(num_samples)
        else:
            self.curve_points = []

    def render(self, renderer: Any) -> None:
        """Render the Bézier curve."""
        # Draw control handles
        if self.degree == 3:
            # Two control handles
            renderer.draw_dashed_line(
                self.start_point.to_tuple(), self.control1.to_tuple(), "#CCCCCC", 0.5
            )
            renderer.draw_dashed_line(
                self.control2.to_tuple(), self.end_point.to_tuple(), "#CCCCCC", 0.5
            )

            # Control points
            renderer.draw_circle(self.control1.to_tuple(), 4, "#666666")
            renderer.draw_circle(self.control2.to_tuple(), 4, "#666666")
        elif self.degree == 2:
            # Single control handle
            renderer.draw_dashed_line(
                self.start_point.to_tuple(), self.control1.to_tuple(), "#CCCCCC", 0.5
            )
            renderer.draw_dashed_line(
                self.control1.to_tuple(), self.end_point.to_tuple(), "#CCCCCC", 0.5
            )

            # Control point
            renderer.draw_circle(self.control1.to_tuple(), 4, "#666666")

        # Draw endpoints
        renderer.draw_square(self.start_point.to_tuple(), 5, "#0000FF")
        renderer.draw_square(self.end_point.to_tuple(), 5, "#00FF00")

        # Draw curve
        if len(self.curve_points) >= 2:
            for i in range(len(self.curve_points) - 1):
                p1 = self.curve_points[i]
                p2 = self.curve_points[i + 1]
                renderer.draw_line(
                    p1.to_tuple(), p2.to_tuple(), self.color, self.linewidth
                )

    def get_bounds(self) -> tuple:
        """Get bounding box of curve."""
        if not self.curve_points:
            return (self.start_point, self.start_point)

        min_x = min(p.x for p in self.curve_points)
        max_x = max(p.x for p in self.curve_points)
        min_y = min(p.y for p in self.curve_points)
        max_y = max(p.y for p in self.curve_points)

        return (Point2D(min_x, min_y), Point2D(max_x, max_y))


class BezierCreationState(Enum):
    """States for Bézier curve creation."""

    IDLE = auto()
    START_POINT = auto()
    CONTROL1 = auto()
    CONTROL2 = auto()
    END_POINT = auto()


class BezierTool(BaseDraftTool):
    """Tool for creating Bézier curves.

    Usage:
    - First click: Set start point
    - Second click: Set first control point
    - Third click: Set second control point (cubic only)
    - Fourth click: Set end point and create curve
    - Escape: Cancel current step or reset
    - Backspace: Go back one step
    - Q key: Toggle between cubic and quadratic

    Features:
    - Four-point workflow for precise control
    - Control handles visible during creation
    - Support for cubic (4 points) and quadratic (3 points) curves
    - Real-time curve preview
    - Correct Bézier interpolation formula
    """

    name = "bezier"
    display_name = "Bézier Curve"
    icon = "icons/bezier.png"
    shortcut = "Z"

    def __init__(self):
        super().__init__()
        self.creation_state = BezierCreationState.IDLE
        self.start_point: Optional[Point2D] = None
        self.control1: Optional[Point2D] = None
        self.control2: Optional[Point2D] = None
        self.end_point: Optional[Point2D] = None
        self.degree: int = 3  # 3 = cubic, 2 = quadratic

    def on_mouse_press(self, pos: Point2D, button: int) -> bool:
        """Handle mouse press."""
        if button == 1:  # Left click
            snapped_pos = self.get_snap_point(pos)

            if self.creation_state == BezierCreationState.IDLE:
                self.start_point = snapped_pos
                self.creation_state = BezierCreationState.START_POINT
                self.state = ToolState.ACTIVE
                return True

            elif self.creation_state == BezierCreationState.START_POINT:
                self.control1 = snapped_pos
                if self.degree == 2:
                    self.creation_state = BezierCreationState.CONTROL2
                else:
                    self.creation_state = BezierCreationState.CONTROL1
                return True

            elif self.creation_state == BezierCreationState.CONTROL1:
                self.control2 = snapped_pos
                self.creation_state = BezierCreationState.CONTROL2
                return True

            elif self.creation_state == BezierCreationState.CONTROL2:
                self.end_point = snapped_pos
                self.finish()
                return True

        elif button == 3:  # Right click
            self.cancel()
            return True

        return False

    def on_mouse_move(self, pos: Point2D) -> bool:
        """Handle mouse move."""
        super().on_mouse_move(pos)

        if self.creation_state != BezierCreationState.IDLE:
            self.state = ToolState.PREVIEW
            return True

        return False

    def on_mouse_release(self, pos: Point2D, button: int) -> bool:
        """Handle mouse release."""
        return False

    def on_key_press(self, key: str) -> bool:
        """Handle key press."""
        if key == "Escape":
            if self.creation_state == BezierCreationState.START_POINT:
                self.creation_state = BezierCreationState.IDLE
                self.start_point = None
            elif self.creation_state == BezierCreationState.CONTROL1:
                self.creation_state = BezierCreationState.START_POINT
                self.control1 = None
            elif self.creation_state == BezierCreationState.CONTROL2:
                if self.degree == 3:
                    self.creation_state = BezierCreationState.CONTROL1
                    self.control2 = None
                else:
                    self.creation_state = BezierCreationState.START_POINT
                    self.control1 = None
            else:
                self.cancel()
            return True

        elif key == "BackSpace":
            # Go back one step
            if self.creation_state == BezierCreationState.START_POINT:
                self.creation_state = BezierCreationState.IDLE
                self.start_point = None
            elif self.creation_state == BezierCreationState.CONTROL1:
                self.creation_state = BezierCreationState.START_POINT
                self.control1 = None
            elif self.creation_state == BezierCreationState.CONTROL2:
                if self.degree == 3:
                    self.creation_state = BezierCreationState.CONTROL1
                    self.control2 = None
                else:
                    self.creation_state = BezierCreationState.START_POINT
                    self.control1 = None
            return True

        elif key.lower() == "q":
            # Toggle degree
            self.degree = 2 if self.degree == 3 else 3

            # Adjust state if needed
            if self.degree == 2 and self.creation_state == BezierCreationState.CONTROL1:
                self.creation_state = BezierCreationState.CONTROL2

            return True

        return False

    def _get_preview_entity(self) -> Optional[BezierCurveEntity]:
        """Get Bézier entity for preview."""
        if self.degree == 3:
            if not all([self.start_point, self.control1]):
                return None

            # Use current mouse position for missing points
            c2 = self.control2 if self.control2 else self.mouse_pos
            end = self.end_point if self.end_point else self.mouse_pos

            return BezierCurveEntity(
                start_point=self.start_point,
                control1=self.control1,
                control2=c2,
                end_point=end,
                degree=3,
            )
        else:  # degree == 2
            if not self.start_point:
                return None

            # Use current mouse position for missing points
            c1 = self.control1 if self.control1 else self.mouse_pos
            end = self.end_point if self.end_point else self.mouse_pos

            return BezierCurveEntity(
                start_point=self.start_point,
                control1=c1,
                control2=c1,  # Not used in quadratic
                end_point=end,
                degree=2,
            )

    def render_preview(self, renderer: Any) -> None:
        """Render Bézier preview."""
        if not self.start_point:
            return

        # Draw placed points
        renderer.draw_square(self.start_point.to_tuple(), 5, "#0000FF")

        if self.control1:
            renderer.draw_circle(self.control1.to_tuple(), 4, "#666666")
            renderer.draw_dashed_line(
                self.start_point.to_tuple(), self.control1.to_tuple(), "#CCCCCC", 0.5
            )

        if self.degree == 3 and self.control2:
            renderer.draw_circle(self.control2.to_tuple(), 4, "#666666")
            renderer.draw_dashed_line(
                self.control2.to_tuple(), self.mouse_pos.to_tuple(), "#CCCCCC", 0.5
            )
        elif self.degree == 2 and self.control1:
            renderer.draw_dashed_line(
                self.control1.to_tuple(), self.mouse_pos.to_tuple(), "#CCCCCC", 0.5
            )

        # Draw curve preview
        preview = self._get_preview_entity()
        if preview and preview.curve_points:
            for i in range(len(preview.curve_points) - 1):
                p1 = preview.curve_points[i]
                p2 = preview.curve_points[i + 1]
                renderer.draw_line(p1.to_tuple(), p2.to_tuple(), "#000000", 1.5)

        # Draw degree indicator
        degree_text = "Cubic" if self.degree == 3 else "Quadratic"
        text_pos = (self.start_point.x, self.start_point.y - 20)
        renderer.draw_text(text_pos, degree_text, "#666666")

    def reset(self) -> None:
        """Reset tool state."""
        super().reset()
        self.creation_state = BezierCreationState.IDLE
        self.start_point = None
        self.control1 = None
        self.control2 = None
        self.end_point = None
        self.degree = 3

    def finish(self) -> None:
        """Finish Bézier curve creation."""
        if self.start_point and self.control1 and self.end_point:
            entity = BezierCurveEntity(
                start_point=self.start_point,
                control1=self.control1,
                control2=self.control2 if self.degree == 3 else self.control1,
                end_point=self.end_point,
                degree=self.degree,
            )
            self._create_entity(entity)

        self.reset()

    def get_help_text(self) -> str:
        """Get help text for current state."""
        degree_str = "Cubic" if self.degree == 3 else "Quadratic"

        if self.creation_state == BezierCreationState.IDLE:
            return f"Bézier: Click to set start point ({degree_str})"
        elif self.creation_state == BezierCreationState.START_POINT:
            return f"Bézier: Click to set control point 1 ({degree_str})"
        elif self.creation_state == BezierCreationState.CONTROL1:
            return f"Bézier: Click to set control point 2 ({degree_str})"
        elif self.creation_state == BezierCreationState.CONTROL2:
            return f"Bézier: Click to set end point ({degree_str}), Q to toggle degree, Backspace to go back"
        return f"Bézier: Ready ({degree_str})"
