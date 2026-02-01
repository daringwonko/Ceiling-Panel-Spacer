"""Geometry utilities for 2D CAD operations."""

import math
from typing import Optional, Tuple, List
from dataclasses import dataclass


@dataclass
class Point:
    """2D point."""

    x: float
    y: float

    def __add__(self, other: "Point") -> "Point":
        return Point(self.x + other.x, self.y + other.y)

    def __sub__(self, other: "Point") -> "Point":
        return Point(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar: float) -> "Point":
        return Point(self.x * scalar, self.y * scalar)

    def distance_to(self, other: "Point") -> float:
        """Calculate distance to another point."""
        return math.sqrt((self.x - other.x) ** 2 + (self.y - other.y) ** 2)

    def distance_to_squared(self, other: "Point") -> float:
        """Calculate squared distance (faster for comparisons)."""
        return (self.x - other.x) ** 2 + (self.y - other.y) ** 2


@dataclass
class Line:
    """2D line segment."""

    start: Point
    end: Point

    @property
    def length(self) -> float:
        """Line length."""
        return self.start.distance_to(self.end)

    @property
    def midpoint(self) -> Point:
        """Midpoint of the line."""
        return Point((self.start.x + self.end.x) / 2, (self.start.y + self.end.y) / 2)

    @property
    def direction(self) -> Point:
        """Direction vector (normalized)."""
        length = self.length
        if length == 0:
            return Point(0, 0)
        return Point(
            (self.end.x - self.start.x) / length, (self.end.y - self.start.y) / length
        )

    def point_at(self, t: float) -> Point:
        """Point at parameter t (0=start, 1=end)."""
        return Point(
            self.start.x + t * (self.end.x - self.start.x),
            self.start.y + t * (self.end.y - self.start.y),
        )


@dataclass
class Circle:
    """2D circle."""

    center: Point
    radius: float


@dataclass
class Arc:
    """2D arc."""

    center: Point
    radius: float
    start_angle: float  # radians
    end_angle: float  # radians


def distance_point_to_line(point: Point, line: Line) -> float:
    """Calculate perpendicular distance from point to line segment."""
    # Project point onto line
    line_vec = Point(line.end.x - line.start.x, line.end.y - line.start.y)
    point_vec = Point(point.x - line.start.x, point.y - line.start.y)

    line_len_sq = line_vec.x**2 + line_vec.y**2
    if line_len_sq == 0:
        return point.distance_to(line.start)

    # Calculate projection parameter
    t = max(
        0, min(1, (point_vec.x * line_vec.x + point_vec.y * line_vec.y) / line_len_sq)
    )

    # Closest point on line
    closest = Point(line.start.x + t * line_vec.x, line.start.y + t * line_vec.y)

    return point.distance_to(closest)


def line_intersection(line1: Line, line2: Line) -> Optional[Point]:
    """Find intersection point of two lines (or None if parallel)."""
    x1, y1 = line1.start.x, line1.start.y
    x2, y2 = line1.end.x, line1.end.y
    x3, y3 = line2.start.x, line2.start.y
    x4, y4 = line2.end.x, line2.end.y

    denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

    if abs(denom) < 1e-10:
        return None  # Lines are parallel

    t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom

    # Check if intersection is within both line segments
    u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom

    if 0 <= t <= 1 and 0 <= u <= 1:
        return Point(x1 + t * (x2 - x1), y1 + t * (y2 - y1))

    return None


def find_all_intersections(lines: List[Line]) -> List[Point]:
    """Find all intersection points among a list of lines."""
    intersections = []
    for i in range(len(lines)):
        for j in range(i + 1, len(lines)):
            point = line_intersection(lines[i], lines[j])
            if point:
                intersections.append(point)
    return intersections


def offset_line(line: Line, distance: float, side: str = "left") -> Line:
    """Create a parallel line offset by distance.

    Args:
        line: Original line
        distance: Offset distance
        side: 'left' or 'right' relative to line direction

    Returns:
        Offset line
    """
    # Calculate normal vector
    dx = line.end.x - line.start.x
    dy = line.end.y - line.start.y
    length = math.sqrt(dx * dx + dy * dy)

    if length == 0:
        return line

    # Normalize
    dx /= length
    dy /= length

    # Perpendicular (normal) vector
    if side == "left":
        nx, ny = -dy, dx
    else:
        nx, ny = dy, -dx

    return Line(
        Point(line.start.x + nx * distance, line.start.y + ny * distance),
        Point(line.end.x + nx * distance, line.end.y + ny * distance),
    )


def create_fillet_arc(line1: Line, line2: Line, radius: float) -> Optional[Arc]:
    """Create a fillet arc between two lines.

    Args:
        line1, line2: Lines to fillet (must intersect or nearly intersect)
        radius: Fillet radius

    Returns:
        Arc or None if lines are parallel
    """
    # Find intersection point
    intersection = line_intersection(line1, line2)
    if not intersection:
        # Lines are parallel, no fillet possible
        return None

    # Calculate angle between lines
    dir1 = line1.direction
    dir2 = line2.direction

    # Angle from line1 to line2
    angle1 = math.atan2(dir1.y, dir1.x)
    angle2 = math.atan2(dir2.y, dir2.x)

    # Normalize angle difference
    angle_diff = angle2 - angle1
    while angle_diff > math.pi:
        angle_diff -= 2 * math.pi
    while angle_diff < -math.pi:
        angle_diff += 2 * math.pi

    # Fillet bisects the angle
    bisect_angle = angle1 + angle_diff / 2

    # Distance from intersection to arc center
    # For external fillet, center is at distance r / sin(angle/2) from intersection
    half_angle = abs(angle_diff) / 2
    if half_angle < 1e-10:
        return None  # Lines are parallel

    distance_to_center = radius / math.sin(half_angle)

    # Arc center
    center = Point(
        intersection.x + math.cos(bisect_angle) * distance_to_center,
        intersection.y + math.sin(bisect_angle) * distance_to_center,
    )

    return Arc(
        center=center,
        radius=radius,
        start_angle=min(angle1, angle2),
        end_angle=max(angle1, angle2),
    )


def point_on_line_segment(point: Point, line: Line, tolerance: float = 1e-10) -> bool:
    """Check if point lies on line segment."""
    # Check if point is collinear
    cross = (point.x - line.start.x) * (line.end.y - line.start.y) - (
        point.y - line.start.y
    ) * (line.end.x - line.start.x)

    if abs(cross) > tolerance:
        return False

    # Check if point is within segment bounds
    dot = (point.x - line.start.x) * (point.x - line.end.x) + (
        point.y - line.start.y
    ) * (point.y - line.end.y)

    return dot <= tolerance
