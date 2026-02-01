"""Snapping system for precise 2D point selection."""

from typing import Dict, List, Optional, Tuple, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import math

from core.geometry import (
    Point,
    Line,
    Circle,
    distance_point_to_line,
    line_intersection,
)


class SnapType(Enum):
    """Types of snap points."""

    GRID = "grid"
    ENDPOINT = "endpoint"
    MIDPOINT = "midpoint"
    CENTER = "center"
    INTERSECTION = "intersection"
    PERPENDICULAR = "perpendicular"
    NEAREST = "nearest"


@dataclass
class SnapConfig:
    """Configuration for snapping behavior."""

    enabled: Dict[str, bool] = field(
        default_factory=lambda: {
            SnapType.GRID.value: True,
            SnapType.ENDPOINT.value: True,
            SnapType.MIDPOINT.value: True,
            SnapType.CENTER.value: True,
            SnapType.INTERSECTION.value: True,
            SnapType.PERPENDICULAR.value: False,
            SnapType.NEAREST.value: False,
        }
    )
    snap_distance: int = 10  # pixels
    grid_size: int = 100  # pixels
    snap_priority: List[str] = field(
        default_factory=lambda: [
            SnapType.ENDPOINT.value,
            SnapType.MIDPOINT.value,
            SnapType.CENTER.value,
            SnapType.INTERSECTION.value,
            SnapType.GRID.value,
            SnapType.PERPENDICULAR.value,
            SnapType.NEAREST.value,
        ]
    )


@dataclass
class SnapResult:
    """Result of a snap operation."""

    point: Point
    snap_type: SnapType
    distance: float
    source_object: Any = None

    def __lt__(self, other: "SnapResult") -> bool:
        """Compare by distance for priority queue."""
        return self.distance < other.distance


@dataclass
class SnapIndicator:
    """Visual indicator for snap point."""

    point: Point
    snap_type: SnapType
    visible: bool = True
    label: str = ""

    def __post_init__(self):
        if not self.label:
            self.label = self.snap_type.value.upper()


class SnapSystem:
    """Core snapping engine for precision CAD operations.

    Provides snapping to:
    - Grid intersections
    - Line/arc endpoints
    - Line midpoints
    - Circle/arc centers
    - Line intersections
    - Perpendicular points
    - Nearest point on curve

    Usage:
        snap_system = SnapSystem()
        result = snap_system.get_snap_point(mouse_pos, geometry_list)
        if result:
            # Use snapped point
            draw_at(result.point)
    """

    def __init__(self, config: Optional[SnapConfig] = None):
        self.config = config or SnapConfig()
        self._indicator = SnapIndicator(Point(0, 0), SnapType.GRID, visible=False)
        self._last_snap: Optional[SnapResult] = None

    def get_snap_point(self, point: Point, geometry: List[Any]) -> Optional[SnapResult]:
        """Find the best snap point near the given point.

        Args:
            point: Mouse/cursor position
            geometry: List of geometric objects to snap to

        Returns:
            SnapResult with closest valid snap point, or None
        """
        candidates: List[SnapResult] = []

        # Check each enabled snap type
        for snap_type_name in self.config.snap_priority:
            if not self.config.enabled.get(snap_type_name, False):
                continue

            snap_type = SnapType(snap_type_name)
            result = self._check_snap_type(snap_type, point, geometry)

            if result and result.distance <= self.config.snap_distance:
                candidates.append(result)

        if not candidates:
            self._indicator.visible = False
            self._last_snap = None
            return None

        # Find closest snap
        best_snap = min(candidates, key=lambda s: s.distance)
        self._last_snap = best_snap

        # Update indicator
        self._indicator = SnapIndicator(
            point=best_snap.point,
            snap_type=best_snap.snap_type,
            visible=True,
            label=best_snap.snap_type.value.upper(),
        )

        return best_snap

    def _check_snap_type(
        self, snap_type: SnapType, point: Point, geometry: List[Any]
    ) -> Optional[SnapResult]:
        """Check for specific snap type."""
        handlers: Dict[SnapType, Callable] = {
            SnapType.GRID: self._snap_grid,
            SnapType.ENDPOINT: self._snap_endpoint,
            SnapType.MIDPOINT: self._snap_midpoint,
            SnapType.CENTER: self._snap_center,
            SnapType.INTERSECTION: self._snap_intersection,
            SnapType.PERPENDICULAR: self._snap_perpendicular,
            SnapType.NEAREST: self._snap_nearest,
        }

        handler = handlers.get(snap_type)
        if handler:
            return handler(point, geometry)
        return None

    def _snap_grid(self, point: Point, geometry: List[Any]) -> Optional[SnapResult]:
        """Snap to nearest grid intersection."""
        grid_x = round(point.x / self.config.grid_size) * self.config.grid_size
        grid_y = round(point.y / self.config.grid_size) * self.config.grid_size
        grid_point = Point(grid_x, grid_y)
        distance = point.distance_to(grid_point)

        return SnapResult(point=grid_point, snap_type=SnapType.GRID, distance=distance)

    def _snap_endpoint(self, point: Point, geometry: List[Any]) -> Optional[SnapResult]:
        """Snap to line/arc endpoints."""
        candidates = []

        for obj in geometry:
            if isinstance(obj, Line):
                candidates.extend([obj.start, obj.end])
            elif isinstance(obj, Circle):
                # Circle doesn't have endpoints, skip
                pass
            elif hasattr(obj, "points"):
                # Polyline or similar
                candidates.extend([obj.points[0], obj.points[-1]])

        if not candidates:
            return None

        closest = min(candidates, key=lambda p: point.distance_to(p))
        distance = point.distance_to(closest)

        return SnapResult(point=closest, snap_type=SnapType.ENDPOINT, distance=distance)

    def _snap_midpoint(self, point: Point, geometry: List[Any]) -> Optional[SnapResult]:
        """Snap to line midpoints."""
        candidates = []

        for obj in geometry:
            if isinstance(obj, Line):
                candidates.append(obj.midpoint)
            elif hasattr(obj, "points") and len(obj.points) >= 2:
                # Midpoint of polyline
                first = obj.points[0]
                last = obj.points[-1]
                mid = Point((first.x + last.x) / 2, (first.y + last.y) / 2)
                candidates.append(mid)

        if not candidates:
            return None

        closest = min(candidates, key=lambda p: point.distance_to(p))
        distance = point.distance_to(closest)

        return SnapResult(point=closest, snap_type=SnapType.MIDPOINT, distance=distance)

    def _snap_center(self, point: Point, geometry: List[Any]) -> Optional[SnapResult]:
        """Snap to circle/arc centers."""
        candidates = []

        for obj in geometry:
            if isinstance(obj, Circle):
                candidates.append(obj.center)
            elif hasattr(obj, "center"):
                candidates.append(obj.center)

        if not candidates:
            return None

        closest = min(candidates, key=lambda p: point.distance_to(p))
        distance = point.distance_to(closest)

        return SnapResult(point=closest, snap_type=SnapType.CENTER, distance=distance)

    def _snap_intersection(
        self, point: Point, geometry: List[Any]
    ) -> Optional[SnapResult]:
        """Snap to line intersections."""
        lines = [obj for obj in geometry if isinstance(obj, Line)]

        if len(lines) < 2:
            return None

        intersections = []
        for i in range(len(lines)):
            for j in range(i + 1, len(lines)):
                intersection = line_intersection(lines[i], lines[j])
                if intersection:
                    intersections.append(intersection)

        if not intersections:
            return None

        closest = min(intersections, key=lambda p: point.distance_to(p))
        distance = point.distance_to(closest)

        return SnapResult(
            point=closest, snap_type=SnapType.INTERSECTION, distance=distance
        )

    def _snap_perpendicular(
        self, point: Point, geometry: List[Any]
    ) -> Optional[SnapResult]:
        """Snap to perpendicular point on line."""
        candidates = []

        for obj in geometry:
            if isinstance(obj, Line):
                # Project point onto line
                line_vec = Point(obj.end.x - obj.start.x, obj.end.y - obj.start.y)
                point_vec = Point(point.x - obj.start.x, point.y - obj.start.y)

                line_len_sq = line_vec.x**2 + line_vec.y**2
                if line_len_sq == 0:
                    continue

                t = max(
                    0,
                    min(
                        1,
                        (point_vec.x * line_vec.x + point_vec.y * line_vec.y)
                        / line_len_sq,
                    ),
                )

                closest = Point(
                    obj.start.x + t * line_vec.x, obj.start.y + t * line_vec.y
                )
                candidates.append(closest)

        if not candidates:
            return None

        closest = min(candidates, key=lambda p: point.distance_to(p))
        distance = point.distance_to(closest)

        return SnapResult(
            point=closest, snap_type=SnapType.PERPENDICULAR, distance=distance
        )

    def _snap_nearest(self, point: Point, geometry: List[Any]) -> Optional[SnapResult]:
        """Snap to nearest point on geometry."""
        candidates = []

        for obj in geometry:
            if isinstance(obj, Line):
                # Project point onto line segment
                line_vec = Point(obj.end.x - obj.start.x, obj.end.y - obj.start.y)
                point_vec = Point(point.x - obj.start.x, point.y - obj.start.y)

                line_len_sq = line_vec.x**2 + line_vec.y**2
                if line_len_sq == 0:
                    candidates.append(obj.start)
                    continue

                t = max(
                    0,
                    min(
                        1,
                        (point_vec.x * line_vec.x + point_vec.y * line_vec.y)
                        / line_len_sq,
                    ),
                )

                closest = Point(
                    obj.start.x + t * line_vec.x, obj.start.y + t * line_vec.y
                )
                candidates.append(closest)
            elif isinstance(obj, Circle):
                # Nearest point on circle
                dir_vec = Point(point.x - obj.center.x, point.y - obj.center.y)
                dist = math.sqrt(dir_vec.x**2 + dir_vec.y**2)
                if dist > 0:
                    nearest = Point(
                        obj.center.x + dir_vec.x / dist * obj.radius,
                        obj.center.y + dir_vec.y / dist * obj.radius,
                    )
                    candidates.append(nearest)

        if not candidates:
            return None

        closest = min(candidates, key=lambda p: point.distance_to(p))
        distance = point.distance_to(closest)

        return SnapResult(point=closest, snap_type=SnapType.NEAREST, distance=distance)

    def enable_snap(self, snap_type: SnapType) -> None:
        """Enable a specific snap type."""
        self.config.enabled[snap_type.value] = True

    def disable_snap(self, snap_type: SnapType) -> None:
        """Disable a specific snap type."""
        self.config.enabled[snap_type.value] = False

    def toggle_snap(self, snap_type: SnapType) -> bool:
        """Toggle a snap type on/off. Returns new state."""
        current = self.config.enabled.get(snap_type.value, False)
        self.config.enabled[snap_type.value] = not current
        return not current

    def set_snap_distance(self, distance: int) -> None:
        """Set the snap detection distance."""
        self.config.snap_distance = max(1, distance)

    def set_grid_size(self, size: int) -> None:
        """Set the grid size for grid snapping."""
        self.config.grid_size = max(1, size)

    def get_indicator(self) -> SnapIndicator:
        """Get current snap indicator for rendering."""
        return self._indicator

    def clear_indicator(self) -> None:
        """Hide snap indicator."""
        self._indicator.visible = False

    def get_config(self) -> SnapConfig:
        """Get current configuration."""
        return self.config

    def set_config(self, config: SnapConfig) -> None:
        """Set configuration."""
        self.config = config
