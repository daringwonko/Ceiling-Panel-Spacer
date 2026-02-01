"""B-spline drafting tool for BIM Workbench.

Creates smooth B-spline curves through control points.
Implements Cox-de Boor recursion for basis functions.
Supports quadratic (degree 2) and cubic (degree 3) splines.
"""

from typing import List, Optional, Any
from dataclasses import dataclass, field
import math

from bim_workbench.drafting.base_draft_tool import (
    BaseDraftTool,
    Point2D,
    ToolState,
    BaseEntity,
)


@dataclass
class BSplineEntity(BaseEntity):
    """Entity representing a B-spline curve."""

    control_points: List[Point2D] = field(default_factory=list)
    degree: int = 3
    knots: List[float] = field(default_factory=list)
    curve_points: List[Point2D] = field(default_factory=list)
    is_clamped: bool = True

    def __init__(
        self,
        control_points: List[Point2D] = None,
        degree: int = 3,
        knots: List[float] = None,
        is_clamped: bool = True,
    ):
        super().__init__("bspline")
        self.control_points = control_points or []
        self.degree = degree
        self.is_clamped = is_clamped
        self.knots = knots or self._generate_knot_vector()
        self.curve_points = []
        self._calculate_curve()

    def _generate_knot_vector(self) -> List[float]:
        """Generate uniform knot vector for B-spline.

        For clamped B-spline with n+1 control points and degree p:
        - First p+1 knots are 0
        - Last p+1 knots are n-p
        - Middle knots go from 1 to n-p-1
        """
        n = len(self.control_points) - 1
        p = self.degree

        if n < p:
            return []

        knots = []
        m = n + p + 1  # Total number of knots - 1

        if self.is_clamped:
            # Clamped knot vector
            for i in range(m + 1):
                if i <= p:
                    knots.append(0.0)
                elif i >= m - p:
                    knots.append(float(n - p))
                else:
                    knots.append(float(i - p))
        else:
            # Uniform (periodic) knot vector
            for i in range(m + 1):
                knots.append(float(i))

        return knots

    def _calculate_curve(self, num_samples: int = 100) -> None:
        """Calculate B-spline curve points."""
        self.curve_points = []

        if len(self.control_points) < self.degree + 1:
            return

        n = len(self.control_points) - 1
        p = self.degree

        if len(self.knots) < n + p + 2:
            return

        # Sample parameter t
        u_min = self.knots[p]
        u_max = self.knots[n + 1]

        if u_max <= u_min:
            return

        for i in range(num_samples + 1):
            t = u_min + (u_max - u_min) * i / num_samples
            point = self._evaluate(t)
            if point:
                self.curve_points.append(point)

    def _evaluate(self, u: float) -> Optional[Point2D]:
        """Evaluate B-spline at parameter u using Cox-de Boor.

        Args:
            u: Parameter value

        Returns:
            Point on curve or None if evaluation fails
        """
        n = len(self.control_points) - 1
        p = self.degree

        # Find knot span
        span = self._find_span(u)
        if span is None:
            return None

        # Evaluate basis functions
        N = self._basis_functions(span, u)

        # Calculate point
        x = 0.0
        y = 0.0
        for i in range(p + 1):
            idx = span - p + i
            if 0 <= idx <= n:
                x += N[i] * self.control_points[idx].x
                y += N[i] * self.control_points[idx].y

        return Point2D(x, y)

    def _find_span(self, u: float) -> Optional[int]:
        """Find knot span index for parameter u.

        Returns:
            Knot span index or None
        """
        n = len(self.control_points) - 1
        p = self.degree

        if u >= self.knots[n + 1]:
            return n
        if u <= self.knots[p]:
            return p

        # Binary search
        low = p
        high = n + 1
        mid = (low + high) // 2

        while u < self.knots[mid] or u >= self.knots[mid + 1]:
            if u < self.knots[mid]:
                high = mid
            else:
                low = mid
            mid = (low + high) // 2

        return mid

    def _basis_functions(self, span: int, u: float) -> List[float]:
        """Calculate non-zero basis functions at parameter u.

        Implements Cox-de Boor recursion formula.

        Args:
            span: Knot span index
            u: Parameter value

        Returns:
            Array of basis function values
        """
        p = self.degree
        N = [0.0] * (p + 1)
        left = [0.0] * (p + 1)
        right = [0.0] * (p + 1)

        N[0] = 1.0

        for j in range(1, p + 1):
            left[j] = u - self.knots[span + 1 - j]
            right[j] = self.knots[span + j] - u
            saved = 0.0

            for r in range(j):
                if right[r + 1] + left[j - r] == 0:
                    temp = 0.0
                else:
                    temp = N[r] / (right[r + 1] + left[j - r])
                N[r] = saved + right[r + 1] * temp
                saved = left[j - r] * temp

            N[j] = saved

        return N

    def render(self, renderer: Any) -> None:
        """Render the B-spline curve."""
        # Draw control polygon
        if len(self.control_points) >= 2:
            for i in range(len(self.control_points) - 1):
                p1 = self.control_points[i]
                p2 = self.control_points[i + 1]
                renderer.draw_dashed_line(p1.to_tuple(), p2.to_tuple(), "#CCCCCC", 0.5)

        # Draw control points
        for i, cp in enumerate(self.control_points):
            color = (
                "#0000FF" if i == 0 or i == len(self.control_points) - 1 else "#000000"
            )
            renderer.draw_circle(cp.to_tuple(), 4, color)

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
            if self.control_points:
                p = self.control_points[0]
                return (p, p)
            return (Point2D(0, 0), Point2D(0, 0))

        min_x = min(p.x for p in self.curve_points)
        max_x = max(p.x for p in self.curve_points)
        min_y = min(p.y for p in self.curve_points)
        max_y = max(p.y for p in self.curve_points)

        return (Point2D(min_x, min_y), Point2D(max_x, max_y))


class BSplineTool(BaseDraftTool):
    """Tool for creating B-spline curves.

    Usage:
    - Left-click: Add control point
    - Double-click: Finish curve
    - Enter key: Finish curve
    - Right-click: Remove last control point
    - Number keys (2,3): Set degree (2=quadratic, 3=cubic)
    - Escape: Cancel

    Features:
    - Interactive B-spline preview
    - Control polygon visible during creation
    - Support for degree 2 (quadratic) and 3 (cubic)
    - Cox-de Boor algorithm implementation
    - Minimum 3 points required
    """

    name = "bspline"
    display_name = "B-spline"
    icon = "icons/bspline.png"
    shortcut = "B"

    def __init__(self):
        super().__init__()
        self.control_points: List[Point2D] = []
        self.degree: int = 3
        self.is_clamped: bool = True
        self.double_click_timer: float = 0.0
        self.double_click_threshold: float = 0.3

    def on_mouse_press(self, pos: Point2D, button: int) -> bool:
        """Handle mouse press."""
        import time

        if button == 1:  # Left click
            current_time = time.time()

            # Check for double-click to finish
            if (
                current_time - self.double_click_timer < self.double_click_threshold
                and self.control_points
            ):
                if len(self.control_points) >= 3:
                    self.finish()
                self.double_click_timer = 0.0
                return True

            self.double_click_timer = current_time

            # Add control point
            snapped_pos = self.get_snap_point(pos)
            self.control_points.append(snapped_pos)
            self.state = ToolState.ACTIVE
            return True

        elif button == 3:  # Right click
            if self.control_points:
                self.control_points.pop()
                if not self.control_points:
                    self.state = ToolState.IDLE
                return True
            else:
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
        # Set degree
        if key == "2":
            self.degree = 2
            return True
        elif key == "3":
            self.degree = 3
            return True

        if key == "Return" or key == "Enter":
            if len(self.control_points) >= 3:
                self.finish()
            return True

        elif key == "Escape":
            self.cancel()
            return True

        return False

    def _get_preview_entity(self) -> Optional[BSplineEntity]:
        """Get B-spline entity for preview."""
        if len(self.control_points) < self.degree + 1:
            return None

        return BSplineEntity(
            control_points=self.control_points.copy(),
            degree=self.degree,
            is_clamped=self.is_clamped,
        )

    def render_preview(self, renderer: Any) -> None:
        """Render B-spline preview."""
        # Draw control polygon
        if len(self.control_points) >= 2:
            for i in range(len(self.control_points) - 1):
                p1 = self.control_points[i]
                p2 = self.control_points[i + 1]
                renderer.draw_dashed_line(p1.to_tuple(), p2.to_tuple(), "#CCCCCC", 0.5)

        # Draw control points
        for i, cp in enumerate(self.control_points):
            if i == 0:
                color = "#0000FF"  # First point - blue
            elif i == len(self.control_points) - 1:
                color = "#00FF00"  # Last point - green
            else:
                color = "#000000"  # Middle points - black
            renderer.draw_circle(cp.to_tuple(), 4, color)

        # Draw curve preview
        preview = self._get_preview_entity()
        if preview and preview.curve_points:
            for i in range(len(preview.curve_points) - 1):
                p1 = preview.curve_points[i]
                p2 = preview.curve_points[i + 1]
                renderer.draw_line(p1.to_tuple(), p2.to_tuple(), "#000000", 1.5)

        # Draw degree indicator
        if self.control_points:
            text_pos = (self.control_points[0].x, self.control_points[0].y - 20)
            renderer.draw_text(text_pos, f"Degree {self.degree}", "#666666")

    def reset(self) -> None:
        """Reset tool state."""
        super().reset()
        self.control_points.clear()
        self.degree = 3
        self.is_clamped = True
        self.double_click_timer = 0.0

    def finish(self) -> None:
        """Finish B-spline creation."""
        if len(self.control_points) >= 3:
            entity = BSplineEntity(
                control_points=self.control_points.copy(),
                degree=self.degree,
                is_clamped=self.is_clamped,
            )
            self._create_entity(entity)

        self.reset()

    def get_help_text(self) -> str:
        """Get help text for current state."""
        if not self.control_points:
            return f"B-spline: Click to add first control point (Degree {self.degree})"
        elif len(self.control_points) < 3:
            return f"B-spline: {len(self.control_points)} points, need {3 - len(self.control_points)} more (2/3 for degree, Enter/Double-click to finish)"
        else:
            return f"B-spline: {len(self.control_points)} points, Degree {self.degree} - Click to add, Double-click/Enter to finish, Right-click to remove, 2/3 for degree"
