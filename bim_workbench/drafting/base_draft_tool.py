"""Base drafting tool for BIM Workbench.

Provides common functionality for all drafting tools including
mouse handling, preview rendering, and entity creation.
"""

from abc import ABC, abstractmethod
from enum import Enum, auto
from typing import Optional, List, Tuple, Any, Dict
from dataclasses import dataclass


class ToolState(Enum):
    """States for drafting tools."""

    IDLE = auto()
    ACTIVE = auto()
    PREVIEW = auto()


@dataclass
class Point2D:
    """2D point with x, y coordinates."""

    x: float
    y: float

    def __add__(self, other: "Point2D") -> "Point2D":
        return Point2D(self.x + other.x, self.y + other.y)

    def __sub__(self, other: "Point2D") -> "Point2D":
        return Point2D(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar: float) -> "Point2D":
        return Point2D(self.x * scalar, self.y * scalar)

    def magnitude(self) -> float:
        """Calculate vector magnitude."""
        import math

        return math.sqrt(self.x**2 + self.y**2)

    def to_tuple(self) -> Tuple[float, float]:
        return (self.x, self.y)


class BaseDraftTool(ABC):
    """Base class for all drafting tools.

    Provides:
    - Mouse event handling (click, drag, move)
    - Keyboard event handling
    - Preview rendering
    - State management
    - Entity creation
    """

    # Tool metadata
    name: str = "base_draft"
    display_name: str = "Base Draft Tool"
    icon: Optional[str] = None
    shortcut: Optional[str] = None

    def __init__(self):
        """Initialize the drafting tool."""
        self.state = ToolState.IDLE
        self.preview_entities: List[Any] = []
        self.active_entity: Optional[Any] = None
        self.mouse_pos: Point2D = Point2D(0, 0)
        self.snap_enabled: bool = True
        self.grid_enabled: bool = True
        self.drawing = None  # Reference to active drawing

    @abstractmethod
    def on_mouse_press(self, pos: Point2D, button: int) -> bool:
        """Handle mouse press event.

        Args:
            pos: Mouse position in drawing coordinates
            button: Mouse button (1=left, 2=middle, 3=right)

        Returns:
            True if event was handled
        """
        pass

    @abstractmethod
    def on_mouse_move(self, pos: Point2D) -> bool:
        """Handle mouse move event.

        Args:
            pos: Mouse position in drawing coordinates

        Returns:
            True if event was handled
        """
        self.mouse_pos = pos
        return False

    @abstractmethod
    def on_mouse_release(self, pos: Point2D, button: int) -> bool:
        """Handle mouse release event.

        Args:
            pos: Mouse position in drawing coordinates
            button: Mouse button (1=left, 2=middle, 3=right)

        Returns:
            True if event was handled
        """
        pass

    @abstractmethod
    def on_key_press(self, key: str) -> bool:
        """Handle key press event.

        Args:
            key: Key that was pressed

        Returns:
            True if event was handled
        """
        pass

    @abstractmethod
    def render_preview(self, renderer: Any) -> None:
        """Render tool preview.

        Args:
            renderer: Rendering context
        """
        pass

    @abstractmethod
    def reset(self) -> None:
        """Reset tool to initial state."""
        self.state = ToolState.IDLE
        self.preview_entities.clear()
        self.active_entity = None

    def get_snap_point(self, pos: Point2D) -> Point2D:
        """Get snapped point if snap is enabled.

        Args:
            pos: Raw mouse position

        Returns:
            Snapped or original position
        """
        if not self.snap_enabled:
            return pos
        # TODO: Implement snap logic
        return pos

    def finish(self) -> None:
        """Finish current operation and create entities."""
        if self.active_entity:
            self._create_entity(self.active_entity)
            self.reset()

    def cancel(self) -> None:
        """Cancel current operation without creating entities."""
        self.reset()

    def _create_entity(self, entity_data: Any) -> None:
        """Create entity in the drawing.

        Args:
            entity_data: Entity data to create
        """
        if self.drawing:
            # TODO: Add entity to drawing
            pass

    def get_help_text(self) -> str:
        """Get help text for current tool state."""
        return f"{self.display_name}: Use mouse to create geometry"


class BaseEntity:
    """Base class for drawing entities."""

    def __init__(self, entity_type: str):
        self.entity_type = entity_type
        self.layer: str = "0"
        self.color: str = "#000000"
        self.linewidth: float = 1.0
        self.linetype: str = "continuous"
        self.selected: bool = False

    def render(self, renderer: Any) -> None:
        """Render the entity."""
        pass

    def get_bounds(self) -> Tuple[Point2D, Point2D]:
        """Get bounding box of entity."""
        return (Point2D(0, 0), Point2D(0, 0))

    def clone(self) -> "BaseEntity":
        """Create a copy of this entity."""
        raise NotImplementedError
