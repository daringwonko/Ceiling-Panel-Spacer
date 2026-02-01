"""
Base Tool Class for BIM Workbench

Provides foundation for all drafting tools with common functionality
for event handling, state management, and BIM object creation.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, Tuple
from enum import Enum


class ToolState(Enum):
    """Tool state enumeration"""

    IDLE = "idle"
    ACTIVE = "active"
    DRAWING = "drawing"


class Tool(ABC):
    """
    Abstract base class for all BIM drafting tools

    All tools must inherit from this class and implement the required
    methods for handling user input and creating BIM objects.
    """

    def __init__(self, name: str, icon: str = ""):
        """
        Initialize tool

        Args:
            name: Tool name
            icon: Tool icon identifier
        """
        self.name = name
        self.icon = icon
        self.state = ToolState.IDLE
        self.preview_data: Optional[Dict[str, Any]] = None
        self.canvas = None
        self.on_complete_callback = None

    def activate(self, canvas, on_complete=None):
        """
        Activate the tool

        Args:
            canvas: Drawing canvas reference
            on_complete: Callback function when tool completes
        """
        self.canvas = canvas
        self.on_complete_callback = on_complete
        self.state = ToolState.ACTIVE
        self._on_activate()

    def deactivate(self):
        """Deactivate the tool and clean up"""
        self._clear_preview()
        self.state = ToolState.IDLE
        self.preview_data = None
        self._on_deactivate()

    @abstractmethod
    def _on_activate(self):
        """Override for tool-specific activation logic"""
        pass

    @abstractmethod
    def _on_deactivate(self):
        """Override for tool-specific deactivation logic"""
        pass

    def on_mouse_press(self, x: float, y: float, button: int = 1):
        """
        Handle mouse press event

        Args:
            x: Mouse X coordinate
            y: Mouse Y coordinate
            button: Mouse button (1=left, 2=middle, 3=right)
        """
        pass

    def on_mouse_move(self, x: float, y: float, shift_pressed: bool = False):
        """
        Handle mouse move event

        Args:
            x: Mouse X coordinate
            y: Mouse Y coordinate
            shift_pressed: Whether Shift key is held
        """
        pass

    def on_mouse_release(self, x: float, y: float, button: int = 1):
        """
        Handle mouse release event

        Args:
            x: Mouse X coordinate
            y: Mouse Y coordinate
            button: Mouse button (1=left, 2=middle, 3=right)
        """
        pass

    def on_key_press(self, key: str):
        """
        Handle key press event

        Args:
            key: Key pressed
        """
        if key == "Escape":
            self.cancel()

    def cancel(self):
        """Cancel current operation and reset state"""
        self._clear_preview()
        self.state = ToolState.ACTIVE
        self.preview_data = None
        self._on_cancel()

    @abstractmethod
    def _on_cancel(self):
        """Override for tool-specific cancel logic"""
        pass

    def _update_preview(self, data: Dict[str, Any]):
        """
        Update preview graphics

        Args:
            data: Preview data to display
        """
        self.preview_data = data
        if self.canvas:
            self.canvas.update_preview(data)

    def _clear_preview(self):
        """Clear preview graphics"""
        if self.canvas:
            self.canvas.clear_preview()
        self.preview_data = None

    def _complete(self, bim_object: Dict[str, Any]):
        """
        Complete tool operation and create BIM object

        Args:
            bim_object: Created BIM object data
        """
        self._clear_preview()
        self.state = ToolState.ACTIVE

        if self.on_complete_callback:
            self.on_complete_callback(bim_object)

    def get_cursor(self) -> str:
        """
        Get cursor shape for this tool

        Returns:
            Cursor identifier string
        """
        return "crosshair"

    def get_status_text(self) -> str:
        """
        Get status bar text for this tool

        Returns:
            Status instruction text
        """
        return f"{self.name} tool active"


def create_bim_object(
    obj_type: str,
    name: str,
    geometry: Dict[str, Any],
    properties: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Create a standardized BIM object

    Args:
        obj_type: Object type (line, rectangle, circle, arc, etc.)
        name: Object name
        geometry: Geometric data
        properties: Additional properties

    Returns:
        BIM object dictionary
    """
    import uuid
    from datetime import datetime

    return {
        "id": str(uuid.uuid4()),
        "type": obj_type,
        "name": name,
        "geometry": geometry,
        "properties": properties or {},
        "created_at": datetime.utcnow().isoformat() + "Z",
        "updated_at": datetime.utcnow().isoformat() + "Z",
    }


def distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Calculate distance between two points"""
    import math

    return math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)


def normalize_rectangle(
    x1: float, y1: float, x2: float, y2: float
) -> Tuple[float, float, float, float]:
    """
    Normalize rectangle corners to ensure consistent ordering

    Returns:
        (min_x, min_y, max_x, max_y)
    """
    return (min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2))


def snap_to_angle(
    start: Tuple[float, float], current: Tuple[float, float], angle: float = 90
) -> Tuple[float, float]:
    """
    Snap current point to nearest angle from start point

    Args:
        start: Start point (x, y)
        current: Current point (x, y)
        angle: Snap angle in degrees (default 90 for orthogonal)

    Returns:
        Snapped point (x, y)
    """
    import math

    dx = current[0] - start[0]
    dy = current[1] - start[1]

    # Calculate current angle
    current_angle = math.degrees(math.atan2(dy, dx))

    # Snap to nearest multiple of angle
    snapped_angle = round(current_angle / angle) * angle

    # Calculate distance
    dist = math.sqrt(dx**2 + dy**2)

    # Calculate snapped point
    snapped_x = start[0] + dist * math.cos(math.radians(snapped_angle))
    snapped_y = start[1] + dist * math.sin(math.radians(snapped_angle))

    return (snapped_x, snapped_y)
