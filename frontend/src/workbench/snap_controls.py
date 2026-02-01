"""Snap controls UI widget."""

from typing import Dict, Callable, Optional
from dataclasses import dataclass

from snap_system import SnapSystem, SnapType, SnapConfig


@dataclass
class SnapControlConfig:
    """Configuration for snap controls UI."""

    show_labels: bool = True
    show_icons: bool = True
    orientation: str = "vertical"  # "vertical" or "horizontal"
    compact: bool = False


class SnapControls:
    """UI widget for controlling snap settings.

    Provides toggle buttons/checkboxes for each snap type,
    grid size input, and snap distance slider.

    Usage:
        snap_controls = SnapControls(snap_system)
        panel.add_widget(snap_controls)
    """

    def __init__(
        self, snap_system: SnapSystem, config: Optional[SnapControlConfig] = None
    ):
        self.snap_system = snap_system
        self.config = config or SnapControlConfig()
        self._callbacks: Dict[str, list] = {}
        self._ui_elements: Dict[str, any] = {}

    def register_callback(self, event: str, callback: Callable) -> None:
        """Register callback for UI events."""
        if event not in self._callbacks:
            self._callbacks[event] = []
        self._callbacks[event].append(callback)

    def _notify(self, event: str, data: any = None) -> None:
        """Notify registered callbacks."""
        for callback in self._callbacks.get(event, []):
            callback(data)

    def toggle_snap(self, snap_type: SnapType) -> bool:
        """Toggle a snap type on/off."""
        new_state = self.snap_system.toggle_snap(snap_type)
        self._notify("snap_toggled", {"type": snap_type.value, "enabled": new_state})
        self._update_ui()
        return new_state

    def enable_snap(self, snap_type: SnapType) -> None:
        """Enable a snap type."""
        self.snap_system.enable_snap(snap_type)
        self._notify("snap_enabled", {"type": snap_type.value})
        self._update_ui()

    def disable_snap(self, snap_type: SnapType) -> None:
        """Disable a snap type."""
        self.snap_system.disable_snap(snap_type)
        self._notify("snap_disabled", {"type": snap_type.value})
        self._update_ui()

    def set_snap_distance(self, distance: int) -> None:
        """Set snap detection distance."""
        self.snap_system.set_snap_distance(distance)
        self._notify("distance_changed", {"distance": distance})
        self._update_ui()

    def set_grid_size(self, size: int) -> None:
        """Set grid size."""
        self.snap_system.set_grid_size(size)
        self._notify("grid_size_changed", {"size": size})
        self._update_ui()

    def get_snap_status(self, snap_type: SnapType) -> bool:
        """Get whether a snap type is enabled."""
        return self.snap_system.config.enabled.get(snap_type.value, False)

    def get_snap_distance(self) -> int:
        """Get current snap distance."""
        return self.snap_system.config.snap_distance

    def get_grid_size(self) -> int:
        """Get current grid size."""
        return self.snap_system.config.grid_size

    def enable_all_snaps(self) -> None:
        """Enable all snap types."""
        for snap_type in SnapType:
            self.snap_system.enable_snap(snap_type)
        self._notify("all_snaps_enabled")
        self._update_ui()

    def disable_all_snaps(self) -> None:
        """Disable all snap types."""
        for snap_type in SnapType:
            self.snap_system.disable_snap(snap_type)
        self._notify("all_snaps_disabled")
        self._update_ui()

    def _update_ui(self) -> None:
        """Update UI elements to reflect current state."""
        # Would update actual UI widgets here
        pass

    def get_active_snap_types(self) -> Dict[str, bool]:
        """Get dictionary of active snap types."""
        return {
            snap_type.value: self.snap_system.config.enabled.get(snap_type.value, False)
            for snap_type in SnapType
        }

    def save_preferences(self) -> Dict:
        """Save snap preferences to dictionary."""
        return {
            "enabled": self.snap_system.config.enabled.copy(),
            "snap_distance": self.snap_system.config.snap_distance,
            "grid_size": self.snap_system.config.grid_size,
            "snap_priority": self.snap_system.config.snap_priority.copy(),
        }

    def load_preferences(self, preferences: Dict) -> None:
        """Load snap preferences from dictionary."""
        if "enabled" in preferences:
            self.snap_system.config.enabled.update(preferences["enabled"])
        if "snap_distance" in preferences:
            self.snap_system.set_snap_distance(preferences["snap_distance"])
        if "grid_size" in preferences:
            self.snap_system.set_grid_size(preferences["grid_size"])
        if "snap_priority" in preferences:
            self.snap_system.config.snap_priority = preferences["snap_priority"]
        self._update_ui()

    def render(self) -> Dict:
        """Render UI specification.

        Returns:
            Dictionary describing UI layout
        """
        return {
            "type": "panel",
            "title": "Snap Settings",
            "orientation": self.config.orientation,
            "compact": self.config.compact,
            "sections": [
                {
                    "type": "checkbox_group",
                    "title": "Snap Types",
                    "items": [
                        {
                            "id": f"snap_{snap_type.value}",
                            "label": snap_type.value.capitalize(),
                            "checked": self.get_snap_status(snap_type),
                            "action": lambda st=snap_type: self.toggle_snap(st),
                        }
                        for snap_type in SnapType
                    ],
                },
                {
                    "type": "slider",
                    "id": "snap_distance",
                    "label": "Snap Distance",
                    "value": self.get_snap_distance(),
                    "min": 1,
                    "max": 50,
                    "unit": "px",
                },
                {
                    "type": "number_input",
                    "id": "grid_size",
                    "label": "Grid Size",
                    "value": self.get_grid_size(),
                    "min": 1,
                    "max": 1000,
                    "unit": "px",
                },
                {
                    "type": "button_group",
                    "items": [
                        {
                            "id": "enable_all",
                            "label": "Enable All",
                            "action": self.enable_all_snaps,
                        },
                        {
                            "id": "disable_all",
                            "label": "Disable All",
                            "action": self.disable_all_snaps,
                        },
                    ],
                },
            ],
        }

    def get_snap_indicator_text(self) -> str:
        """Get text showing active snap types."""
        active = [
            snap_type.value.upper()[:3]
            for snap_type in SnapType
            if self.get_snap_status(snap_type)
        ]
        return ", ".join(active) if active else "NONE"
