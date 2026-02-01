"""
Dimension Style Management System

Provides configurable styles for dimension appearance and behavior.
"""

import json
import os
from FreeCAD import App


# ============================================================================
# Dimension Style Class
# ============================================================================


class DimensionStyle:
    """Represents a complete dimension style configuration.

    Stores all formatting and appearance properties for dimensions.
    Supports serialization to/from JSON for persistence.
    """

    def __init__(self, name="Custom", **kwargs):
        """Initialize dimension style with properties.

        Args:
            name: Style identifier
            **kwargs: Optional style properties
        """
        self.name = name

        # Text properties
        self.text_height = kwargs.get("text_height", 3.5)  # mm
        self.decimal_places = kwargs.get("decimal_places", 2)
        self.font_name = kwargs.get("font_name", "Arial")
        self.text_color = kwargs.get("text_color", (0.0, 0.0, 0.0, 1.0))
        self.text_position = kwargs.get(
            "text_position", "Above"
        )  # Above, Centered, Outside

        # Arrow properties
        self.arrow_size = kwargs.get("arrow_size", 2.5)  # mm
        self.arrow_style = kwargs.get(
            "arrow_style", "Closed"
        )  # Closed, Open, Dot, Tick
        self.arrow_color = kwargs.get("arrow_color", (0.0, 0.0, 0.0, 1.0))

        # Line properties
        self.line_color = kwargs.get("line_color", (0.0, 0.0, 0.0, 1.0))
        self.line_width = kwargs.get("line_width", 1.0)
        self.extension_line_offset = kwargs.get("extension_line_offset", 1.0)  # mm
        self.extension_line_extension = kwargs.get(
            "extension_line_extension", 2.0
        )  # mm

        # Unit properties
        self.unit = kwargs.get("unit", "mm")
        self.suppress_trailing_zeros = kwargs.get("suppress_trailing_zeros", True)

    def to_dict(self):
        """Convert style to dictionary for JSON serialization.

        Returns:
            Dictionary representation of style
        """
        return {
            "name": self.name,
            "text_height": self.text_height,
            "decimal_places": self.decimal_places,
            "font_name": self.font_name,
            "text_color": self.text_color,
            "text_position": self.text_position,
            "arrow_size": self.arrow_size,
            "arrow_style": self.arrow_style,
            "arrow_color": self.arrow_color,
            "line_color": self.line_color,
            "line_width": self.line_width,
            "extension_line_offset": self.extension_line_offset,
            "extension_line_extension": self.extension_line_extension,
            "unit": self.unit,
            "suppress_trailing_zeros": self.suppress_trailing_zeros,
        }

    @classmethod
    def from_dict(cls, data):
        """Create style from dictionary.

        Args:
            data: Dictionary with style properties

        Returns:
            DimensionStyle instance
        """
        return cls(**data)

    def apply_to_dimension(self, dim_obj):
        """Apply style properties to a dimension object.

        Args:
            dim_obj: FreeCAD FeaturePython dimension object
        """
        if hasattr(dim_obj, "TextHeight"):
            dim_obj.TextHeight = self.text_height
        if hasattr(dim_obj, "ArrowSize"):
            dim_obj.ArrowSize = self.arrow_size
        if hasattr(dim_obj, "TextColor"):
            dim_obj.TextColor = self.text_color
        if hasattr(dim_obj, "LineColor"):
            dim_obj.LineColor = self.line_color
        if hasattr(dim_obj, "ExtensionLineOffset"):
            dim_obj.ExtensionLineOffset = self.extension_line_offset
        if hasattr(dim_obj, "ExtensionLineExtension"):
            dim_obj.ExtensionLineExtension = self.extension_line_extension
        if hasattr(dim_obj, "FontName"):
            dim_obj.FontName = self.font_name
        if hasattr(dim_obj, "ArrowStyle"):
            dim_obj.ArrowStyle = self.arrow_style

    def clone(self, new_name=None):
        """Create a copy of this style with optional new name.

        Args:
            new_name: Optional name for clone

        Returns:
            New DimensionStyle instance
        """
        data = self.to_dict()
        if new_name:
            data["name"] = new_name
        return DimensionStyle.from_dict(data)


# ============================================================================
# Style Manager Singleton
# ============================================================================


class StyleManager:
    """Manages dimension style storage, retrieval, and persistence.

    Provides singleton access to dimension styles with JSON file storage.
    """

    _instance = None
    _styles = {}
    _config_path = ""

    def __new__(cls):
        """Singleton pattern for style manager."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def initialize(self):
        """Initialize style manager and load styles.

        Creates default styles if none exist.
        """
        if self._initialized:
            return

        # Determine config path
        user_dir = App.getUserAppDataDir()
        self._config_path = os.path.join(user_dir, "BIM", "dimension_styles.json")

        # Ensure directory exists
        os.makedirs(os.path.dirname(self._config_path), exist_ok=True)

        # Load styles from file or create defaults
        if os.path.exists(self._config_path):
            self._load_styles()
        else:
            self._create_default_styles()

        self._initialized = True

    def _load_styles(self):
        """Load styles from JSON configuration file."""
        try:
            with open(self._config_path, "r") as f:
                data = json.load(f)
                for style_data in data.get("styles", []):
                    style = DimensionStyle.from_dict(style_data)
                    self._styles[style.name] = style
        except (json.JSONDecodeError, FileNotFoundError) as e:
            App.Console.PrintWarning(f"Could not load dimension styles: {e}\n")
            self._create_default_styles()

    def _save_styles(self):
        """Save styles to JSON configuration file."""
        try:
            data = {
                "version": "1.0",
                "styles": [style.to_dict() for style in self._styles.values()],
            }
            with open(self._config_path, "w") as f:
                json.dump(data, f, indent=2)
        except OSError as e:
            App.Console.PrintError(f"Could not save dimension styles: {e}\n")

    def _create_default_styles(self):
        """Create and store default dimension styles."""
        # Standard style - general purpose
        standard = DimensionStyle(
            name="Standard",
            text_height=3.5,
            decimal_places=2,
            font_name="Arial",
            arrow_size=2.5,
            arrow_style="Closed",
        )
        self._styles["Standard"] = standard

        # Small style - for detailed views
        small = DimensionStyle(
            name="Small",
            text_height=2.5,
            decimal_places=1,
            font_name="Arial",
            arrow_size=2.0,
            arrow_style="Closed",
        )
        self._styles["Small"] = small

        # Large style - for presentation drawings
        large = DimensionStyle(
            name="Large",
            text_height=5.0,
            decimal_places=2,
            font_name="Arial",
            arrow_size=4.0,
            arrow_style="Closed",
        )
        self._styles["Large"] = large

        # Architectural style - with tick marks
        architectural = DimensionStyle(
            name="Architectural",
            text_height=3.5,
            decimal_places=0,
            font_name="Arial",
            arrow_size=2.0,
            arrow_style="Tick",
        )
        self._styles["Architectural"] = architectural

        # Save to file
        self._save_styles()

    def get_style(self, name):
        """Retrieve a style by name.

        Args:
            name: Style identifier

        Returns:
            DimensionStyle or None if not found
        """
        self.initialize()
        return self._styles.get(name)

    def get_default_style(self):
        """Get the default dimension style.

        Returns:
            DimensionStyle for new dimensions
        """
        self.initialize()
        return self._styles.get("Standard")

    def add_style(self, style):
        """Add or update a style.

        Args:
            style: DimensionStyle to add

        Returns:
            True if successful
        """
        self.initialize()
        self._styles[style.name] = style
        self._save_styles()
        return True

    def delete_style(self, name):
        """Delete a style by name.

        Args:
            name: Style identifier to remove

        Returns:
            True if style was deleted, False if not found
        """
        self.initialize()
        if name in self._styles:
            # Don't allow deleting default styles
            if name in ["Standard", "Small", "Large", "Architectural"]:
                App.Console.PrintWarning(f"Cannot delete default style '{name}'\n")
                return False

            del self._styles[name]
            self._save_styles()
            return True
        return False

    def duplicate_style(self, name, new_name):
        """Create a copy of an existing style.

        Args:
            name: Source style name
            new_name: Name for new style

        Returns:
            New DimensionStyle or None if source not found
        """
        self.initialize()
        source = self._styles.get(name)
        if source:
            clone = source.clone(new_name)
            self._styles[new_name] = clone
            self._save_styles()
            return clone
        return None

    def list_styles(self):
        """List all available style names.

        Returns:
            List of style names
        """
        self.initialize()
        return list(self._styles.keys())

    def export_styles(self, filepath):
        """Export all styles to JSON file.

        Args:
            filepath: Path to export file

        Returns:
            True if successful
        """
        self.initialize()
        try:
            data = {
                "version": "1.0",
                "exported": True,
                "styles": [style.to_dict() for style in self._styles.values()],
            }
            with open(filepath, "w") as f:
                json.dump(data, f, indent=2)
            return True
        except OSError as e:
            App.Console.PrintError(f"Could not export styles: {e}\n")
            return False

    def import_styles(self, filepath, merge=True):
        """Import styles from JSON file.

        Args:
            filepath: Path to import file
            merge: If True, merge with existing; if False, replace all

        Returns:
            Number of styles imported
        """
        self.initialize()
        try:
            with open(filepath, "r") as f:
                data = json.load(f)

            imported_count = 0
            for style_data in data.get("styles", []):
                style = DimensionStyle.from_dict(style_data)
                if merge or style.name not in self._styles:
                    self._styles[style.name] = style
                    imported_count += 1

            if imported_count > 0:
                self._save_styles()

            return imported_count
        except (json.JSONDecodeError, FileNotFoundError) as e:
            App.Console.PrintError(f"Could not import styles: {e}\n")
            return 0


# ============================================================================
# Style Application Utilities
# ============================================================================


def apply_style_to_dimension(style_name, dim_obj):
    """Apply named style to a dimension object.

    Args:
        style_name: Name of style to apply
        dim_obj: FreeCAD FeaturePython dimension object

    Returns:
        True if style was applied
    """
    manager = StyleManager()
    style = manager.get_style(style_name)
    if style:
        style.apply_to_dimension(dim_obj)
        dim_obj.Style = style_name
        return True
    return False


def get_style_for_dimension(dim_obj):
    """Get style associated with dimension.

    Args:
        dim_obj: FreeCAD FeaturePython dimension object

    Returns:
        DimensionStyle or default style
    """
    manager = StyleManager()
    style_name = getattr(dim_obj, "Style", "Standard")
    return manager.get_style(style_name) or manager.get_default_style()


# ============================================================================
# Style Dialog (GUI placeholder)
# ============================================================================


class StyleDialog:
    """GUI dialog for editing dimension styles.

    Provides form-based editing with preview panel.
    """

    def __init__(self, style=None):
        """Initialize style dialog.

        Args:
            style: Optional DimensionStyle to edit (creates new if None)
        """
        self.style = style or DimensionStyle()
        self.preview_dimension = None

    def show(self):
        """Display the style dialog.

        Returns:
            True if user clicked OK, False if cancelled
        """
        # Placeholder for Qt dialog implementation
        # Would create:
        # - Form fields for all style properties
        # - Preview panel showing dimension
        # - Save/Apply/Cancel buttons
        # - Import/Export buttons
        pass

    def get_style(self):
        """Get the edited style.

        Returns:
            DimensionStyle from dialog
        """
        return self.style


def create_style_editor():
    """Create and show dimension style editor dialog.

    Returns:
        StyleDialog instance
    """
    return StyleDialog()


# ============================================================================
# Workbench Preferences Integration
# ============================================================================


class DimensionPreferences:
    """Manages dimension-related workbench preferences."""

    @staticmethod
    def get_default_style_name():
        """Get default style for new dimensions."""
        manager = StyleManager()
        style = manager.get_default_style()
        return style.name if style else "Standard"

    @staticmethod
    def set_default_style_name(name):
        """Set default style for new dimensions."""
        manager = StyleManager()
        if manager.get_style(name):
            # Store preference (would use FreeCAD's ParamAdapters)
            pass

    @staticmethod
    def get_global_scale():
        """Get global scale factor for all dimensions."""
        # Placeholder for global scaling
        return 1.0

    @staticmethod
    def set_global_scale(scale):
        """Set global scale factor for all dimensions."""
        # Placeholder for global scaling
        pass
