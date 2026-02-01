"""
BIM Workbench Core Module

Provides workbench definition, toolbar setup, menu integration, and keyboard shortcuts.
"""

import FreeCAD as App
from FreeCAD import Gui


# ============================================================================
# Workbench Definition
# ============================================================================


class BIMWorkbench(Gui.Workbench):
    """BIM Workbench for ceiling panel design and documentation.

    Provides tools for ceiling layout design, dimensioning, annotation,
    and BIM-specific functionality.
    """

    def __init__(self):
        """Initialize workbench."""
        self.__class__.MenuText = "BIM Workbench"
        self.__class__.ToolTip = "BIM Workbench for ceiling panel design"
        self.__class__.Icon = ":/icons/freecad.svg"

        # Import command modules to register commands
        self._register_commands()

    def _register_commands(self):
        """Register all workbench commands."""
        try:
            # Import dimension commands
            from bim_wb_tools.dimension import (
                register_dimension_commands,
                AlignedDimensionCommand,
                HorizontalDimensionCommand,
                VerticalDimensionCommand,
                RadiusDimensionCommand,
                AngleDimensionCommand,
            )

            register_dimension_commands()

            # Import annotation commands
            from bim_wb_tools.annotation import (
                register_annotation_commands,
                TextLabelCommand,
                EditTextCommand,
                LeaderLineCommand,
            )

            register_annotation_commands()

            # Initialize style manager (loads default styles)
            from bim_wb_tools.dimension_styles import StyleManager

            StyleManager().initialize()

            App.Console.PrintMessage("BIM Workbench commands registered\n")
        except ImportError as e:
            App.Console.PrintWarning(
                f"BIM Workbench: Some commands not available: {e}\n"
            )

    def GetClassName(self):
        """Return workbench class name."""
        return "Gui::PythonWorkbench"

    def Initialize(self):
        """Called when workbench is activated.

        Sets up toolbar, menus, and keyboard shortcuts.
        """
        self._setup_toolbars()
        self._setup_menus()
        self._setup_shortcuts()
        self._setup_context_menus()

        App.Console.PrintMessage("BIM Workbench initialized\n")

    def _setup_toolbars(self):
        """Configure toolbar organization."""
        # Dimension tools toolbar
        dimTools = [
            "BIM_AlignedDimension",
            "BIM_HorizontalDimension",
            "BIM_VerticalDimension",
            "Separator",
            "BIM_RadiusDimension",
            "BIM_AngleDimension",
        ]
        self.appendToolbar("Dimensions", dimTools)

        # Annotation tools toolbar
        annTools = [
            "BIM_TextLabel",
            "BIM_LeaderLine",
            "Separator",
            "BIM_EditText",
        ]
        self.appendToolbar("Annotation", annTools)

    def _setup_menus(self):
        """Configure menu organization."""
        # BIM menu structure
        bim_menu = "BIM"

        # Annotation submenu
        annotation_menu = [
            "BIM_AlignedDimension",
            "BIM_HorizontalDimension",
            "BIM_VerticalDimension",
            "Separator",
            "BIM_RadiusDimension",
            "BIM_AngleDimension",
            "Separator",
            "BIM_TextLabel",
            "BIM_LeaderLine",
            "Separator",
            "BIM_EditText",
            "Separator",
            "BIM_DimensionStyles",
        ]
        self.appendMenu(bim_menu, annotation_menu)

        # Alternative: standalone Annotation menu
        annotation_only = [
            "BIM_TextLabel",
            "BIM_LeaderLine",
            "Separator",
            "BIM_AlignedDimension",
            "BIM_HorizontalDimension",
            "BIM_VerticalDimension",
            "Separator",
            "BIM_RadiusDimension",
            "BIM_AngleDimension",
            "Separator",
            "BIM_EditText",
        ]
        self.appendMenu("Annotation", annotation_only)

    def _setup_shortcuts(self):
        """Define keyboard shortcuts."""
        # Dimension shortcuts
        self.appendShortcut("DAL", "BIM_AlignedDimension", "Create aligned dimension")
        self.appendShortcut(
            "DHO", "BIM_HorizontalDimension", "Create horizontal dimension"
        )
        self.appendShortcut("DVE", "BIM_VerticalDimension", "Create vertical dimension")
        self.appendShortcut("DRA", "BIM_RadiusDimension", "Create radius dimension")
        self.appendShortcut("DAN", "BIM_AngleDimension", "Create angle dimension")

        # Annotation shortcuts
        self.appendShortcut("MTEXT", "BIM_TextLabel", "Create text label")
        self.appendShortcut("LEADER", "BIM_LeaderLine", "Create leader line")
        self.appendShortcut("ETEXT", "BIM_EditText", "Edit text label")

        # Global shortcuts
        self.appendShortcut(
            "CTRL+D", "BIM_AlignedDimension", "Quick dimension (uses last type)"
        )
        self.appendShortcut("CTRL+T", "BIM_TextLabel", "Quick text label")

    def _setup_context_menus(self):
        """Configure context menu integration."""
        pass

    def Activated(self):
        """Called when workbench is activated."""
        App.Console.PrintMessage("BIM Workbench activated\n")

    def Deactivated(self):
        """Called when workbench is deactivated."""
        App.Console.PrintMessage("BIM Workbench deactivated\n")

    def ContextMenu(self, recipient):
        """Called to populate context menu."""
        sel = Gui.Selection.getSelection()
        if not sel:
            return


# ============================================================================
# Command Alias Definitions
# ============================================================================


def create_dimension_aliases():
    """Create command aliases for dimension tools."""
    aliases = {
        "BIM_AlignedDimension": "DAL",
        "BIM_HorizontalDimension": "DHO",
        "BIM_VerticalDimension": "DVE",
        "BIM_RadiusDimension": "DRA",
        "BIM_AngleDimension": "DAN",
        "BIM_TextLabel": "MTEXT",
        "BIM_LeaderLine": "LEADER",
        "BIM_EditText": "ETEXT",
    }

    for command, alias in aliases.items():
        try:
            cmd = Gui.Command.get(command)
            if cmd:
                cmd.setAlias(alias)
        except (AttributeError, RuntimeError):
            pass


# ============================================================================
# Workbench Registration
# ============================================================================

# Register workbench with FreeCAD
Gui.addWorkbench(BIMWorkbench())

# Create command aliases
create_dimension_aliases()


# ============================================================================
# Convenience Functions
# ============================================================================


def create_aligned_dimension(points, text_pos=None):
    """Convenience function to create aligned dimension.

    Args:
        points: List of two points [(x1,y1,z1), (x2,y2,z2)]
        text_pos: Optional text position

    Returns:
        Created dimension object or None
    """
    try:
        doc = App.ActiveDocument
        if not doc:
            return None

        obj = doc.addObject("App::FeaturePython", "AlignedDimension")

        from bim_wb_tools.dimension import AlignedDimension

        AlignedDimension(obj)

        from FreeCAD import Vector

        obj.StartPoint = Vector(*points[0])
        obj.EndPoint = Vector(*points[1])
        if text_pos:
            obj.TextPosition = Vector(*text_pos)

        obj.recompute()
        return obj
    except Exception as e:
        App.Console.PrintError(f"Failed to create aligned dimension: {e}\n")
        return None


def create_text_label(text, position, **kwargs):
    """Convenience function to create text label.

    Args:
        text: Label text
        position: Position tuple (x, y, z)
        **kwargs: Optional properties

    Returns:
        Created text label object or None
    """
    try:
        doc = App.ActiveDocument
        if not doc:
            return None

        obj = doc.addObject("App::FeaturePython", "TextLabel")

        from bim_wb_tools.annotation import TextLabel

        TextLabel(obj)

        from FreeCAD import Vector

        obj.Position = Vector(*position)
        obj.Text = text

        for key, value in kwargs.items():
            if hasattr(obj, key):
                setattr(obj, key, value)

        obj.recompute()
        return obj
    except Exception as e:
        App.Console.PrintError(f"Failed to create text label: {e}\n")
        return None


def create_leader_line(start_point, end_point, text="", has_mid=False):
    """Convenience function to create leader line.

    Args:
        start_point: Text attachment point
        end_point: Arrow location point
        text: Optional leader text
        has_mid: Use elbow point

    Returns:
        Created leader line object or None
    """
    try:
        doc = App.ActiveDocument
        if not doc:
            return None

        obj = doc.addObject("App::FeaturePython", "LeaderLine")

        from bim_wb_tools.annotation import LeaderLine

        LeaderLine(obj)

        from FreeCAD import Vector

        obj.StartPoint = Vector(*start_point)
        obj.EndPoint = Vector(*end_point)
        obj.HasMidPoint = has_mid
        if text:
            obj.Text = text

        obj.recompute()
        return obj
    except Exception as e:
        App.Console.PrintError(f"Failed to create leader line: {e}\n")
        return None


__all__ = [
    "BIMWorkbench",
    "create_aligned_dimension",
    "create_text_label",
    "create_leader_line",
]
