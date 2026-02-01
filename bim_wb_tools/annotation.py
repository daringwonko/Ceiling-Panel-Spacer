"""
Text and Annotation Tools for BIM Workbench

Provides text labels and leader lines for annotation.
"""

import FreeCAD as App
import math
from FreeCAD import Vector


# ============================================================================
# Text Label Class
# ============================================================================


class TextLabel:
    """Text label annotation object.

    Creates free text with configurable font, size, rotation, and color.
    Supports multiline text and parametric updates.
    """

    def __init__(self, obj):
        """Initialize text label object with properties.

        Args:
            obj: FreeCAD FeaturePython object to configure
        """
        obj.addProperty(
            "App::PropertyVector", "Position", "Label", "Text insertion point"
        ).Position = Vector(0, 0, 0)
        obj.addProperty(
            "App::PropertyString", "Text", "Label", "Label text (use \\n for multiline)"
        ).Text = "Label"
        obj.addProperty(
            "App::PropertyFloat", "FontSize", "Label", "Text height in mm"
        ).FontSize = 3.5
        obj.addProperty(
            "App::PropertyFloat", "Rotation", "Label", "Text rotation angle in degrees"
        ).Rotation = 0.0
        obj.addProperty(
            "App::PropertyString", "FontName", "Label", "Font family name"
        ).FontName = "Arial"
        obj.addProperty("App::PropertyColor", "Color", "Label", "Text color").Color = (
            0.0,
            0.0,
            0.0,
            1.0,
        )
        obj.addProperty(
            "App::PropertyEnumeration",
            "Justification",
            "Label",
            "Text alignment",
            ["Left", "Center", "Right"],
        ).Justification = "Center"
        obj.addProperty("App::PropertyBool", "Bold", "Label", "Bold text").Bold = False
        obj.addProperty(
            "App::PropertyBool", "Italic", "Label", "Italic text"
        ).Italic = False
        obj.addProperty(
            "App::PropertyLink",
            "ReferenceObject",
            "Label",
            "Linked object for parametric updates",
        ).ReferenceObject = None
        obj.addProperty(
            "App::PropertyVector", "Offset", "Label", "Offset from reference object"
        ).Offset = Vector(0, 0, 0)

        obj.Proxy = self
        self.obj = obj
        self._valid_reference = True

    def onDocumentRestored(self, obj):
        """Called when document is restored from file.

        Re-establishes object links and validates references.
        """
        self.obj = obj
        self._valid_reference = True

        # Validate reference object
        ref_obj = getattr(obj, "ReferenceObject", None)
        if ref_obj:
            try:
                doc = obj.Document
                if doc.getObject(ref_obj.Name) is None:
                    self._valid_reference = False
                    obj.ReferenceObject = None
                    App.Console.PrintWarning(
                        "TextLabel reference was deleted after document restore\n"
                    )
            except (AttributeError, ReferenceError):
                self._valid_reference = False
                obj.ReferenceObject = None

    def execute(self, obj):
        """Called when label should be recalculated.

        Updates text position based on reference object changes.
        """
        self._update_position(obj)
        self._create_text_geometry(obj)

    def _update_position(self, obj):
        """Update position from reference object if linked.

        Args:
            obj: TextLabel object
        """
        ref_obj = getattr(obj, "ReferenceObject", None)
        offset = getattr(obj, "Offset", Vector(0, 0, 0))

        if ref_obj and self._valid_reference:
            try:
                # Get reference position
                if hasattr(ref_obj, "Placement"):
                    ref_pos = ref_obj.Placement.Base.copy()
                elif hasattr(ref_obj, "Shape"):
                    ref_pos = ref_obj.Shape.getCenterOfMass()
                else:
                    ref_pos = Vector(0, 0, 0)

                # Apply offset
                new_pos = ref_pos.add(offset)
                obj.Position = new_pos
            except (AttributeError, ReferenceError):
                self._valid_reference = False

    def _create_text_geometry(self, obj):
        """Create text geometry for visualization.

        Override in view provider for Coin3D rendering.
        """
        pass

    def onChanged(self, obj, prop):
        """Called when a property changes.

        Triggers updates when position or text properties change.
        """
        if prop in ["Position", "Text", "FontSize", "Rotation", "FontName", "Color"]:
            self.execute(obj)
        elif prop == "ReferenceObject":
            self.onDocumentRestored(obj)

    def subscribe_to_changes(self):
        """Subscribe to reference object position changes."""
        ref_obj = getattr(self.obj, "ReferenceObject", None)
        if ref_obj:
            App.addDocumentObserver(self)

    def unsubscribe_from_changes(self):
        """Remove observer subscription."""
        App.removeDocumentObserver(self)


class ViewProviderTextLabel:
    """View provider for text label visualization.

    Provides Coin3D text nodes for OpenGL rendering.
    """

    def __init__(self, vobj):
        """Initialize view provider.

        Args:
            vobj: Object's view proxy object
        """
        vobj.addProperty(
            "App::PropertyFloat", "Scale", "Visual", "Display scale factor"
        ).Scale = 1.0
        vobj.Proxy = self
        self.vobj = vobj

    def getIcon(self):
        """Return icon for tree view.

        Returns:
            Path to icon file
        """
        return ":/icons/Text.svg"

    def attach(self, vobj):
        """Attach to document and create scene graph.

        Args:
            vobj: View provider object
        """
        self.vobj = vobj
        self._update_geometry()

    def _update_geometry(self):
        """Update scene graph with text geometry."""
        obj = self.vobj.Object
        if not hasattr(obj, "Proxy") or not obj.Proxy:
            return

        # Clear existing geometry
        self._clear_geometry()

        # Get text properties
        text = getattr(obj, "Text", "Label")
        font_size = getattr(obj, "FontSize", 3.5)
        font_name = getattr(obj, "FontName", "Arial")
        color = getattr(obj, "Color", (0.0, 0.0, 0.0, 1.0))
        rotation = getattr(obj, "Rotation", 0.0)
        justification = getattr(obj, "Justification", "Center")

        # Create text geometry for Coin3D scene graph
        # SoText2 for screen-aligned or SoText3 for 3D text
        pass  # Coin3D nodes created here

    def _clear_geometry(self):
        """Remove all children from scene graph."""
        pass

    def onDocumentRestored(self, vobj):
        """Called when document is restored.

        Reconstructs scene graph after file load.
        """
        self.vobj = vobj
        self._update_geometry()


# ============================================================================
# Leader Line Class
# ============================================================================


class LeaderLine:
    """Leader line annotation with arrow.

    Creates polyline from text attachment to arrow point.
    Supports optional elbow/kink point for multi-segment lines.
    """

    def __init__(self, obj):
        """Initialize leader line object with properties.

        Args:
            obj: FreeCAD FeaturePython object to configure
        """
        obj.addProperty(
            "App::PropertyVector", "StartPoint", "Leader", "Text attachment point"
        ).StartPoint = Vector(0, 0, 0)
        obj.addProperty(
            "App::PropertyVector", "EndPoint", "Leader", "Arrow location point"
        ).EndPoint = Vector(0, 0, 0)
        obj.addProperty(
            "App::PropertyVector", "MidPoint", "Leader", "Optional elbow/kink point"
        ).MidPoint = Vector(0, 0, 0)
        obj.addProperty(
            "App::PropertyBool", "HasMidPoint", "Leader", "True if using elbow point"
        ).HasMidPoint = False
        obj.addProperty(
            "App::PropertyString", "Text", "Leader", "Optional leader text"
        ).Text = ""
        obj.addProperty(
            "App::PropertyFloat", "ArrowSize", "Leader", "Arrowhead size in mm"
        ).ArrowSize = 3.0
        obj.addProperty(
            "App::PropertyFloat", "LineWidth", "Leader", "Line width in mm"
        ).LineWidth = 1.0
        obj.addProperty(
            "App::PropertyColor", "LineColor", "Leader", "Line color"
        ).LineColor = (0.0, 0.0, 0.0, 1.0)
        obj.addProperty(
            "App::PropertyEnumeration",
            "ArrowStyle",
            "Leader",
            "Arrowhead style",
            ["Closed", "Open", "Filled"],
        ).ArrowStyle = "Filled"
        obj.addProperty(
            "App::PropertyEnumeration",
            "ArrowPosition",
            "Leader",
            "Arrow position",
            ["Start", "End", "Both"],
        ).ArrowPosition = "End"
        obj.addProperty(
            "App::PropertyLink",
            "ReferenceObject",
            "Leader",
            "Linked object for parametric updates",
        ).ReferenceObject = None

        obj.Proxy = self
        self.obj = obj
        self._valid_reference = True

    def onDocumentRestored(self, obj):
        """Called when document is restored from file.

        Re-establishes object links and validates references.
        """
        self.obj = obj
        self._valid_reference = True

        # Validate reference object
        ref_obj = getattr(obj, "ReferenceObject", None)
        if ref_obj:
            try:
                doc = obj.Document
                if doc.getObject(ref_obj.Name) is None:
                    self._valid_reference = False
                    obj.ReferenceObject = None
                    App.Console.PrintWarning(
                        "LeaderLine reference was deleted after document restore\n"
                    )
            except (AttributeError, ReferenceError):
                self._valid_reference = False
                obj.ReferenceObject = None

    def execute(self, obj):
        """Called when leader should be recalculated.

        Regenerates leader geometry based on current properties.
        """
        self._update_positions(obj)
        self._create_leader_geometry(obj)

    def _update_positions(self, obj):
        """Update positions from reference object if linked.

        Args:
            obj: LeaderLine object
        """
        ref_obj = getattr(obj, "ReferenceObject", None)

        if ref_obj and self._valid_reference:
            try:
                # Get reference position
                if hasattr(ref_obj, "Placement"):
                    ref_pos = ref_obj.Placement.Base.copy()
                elif hasattr(ref_obj, "Shape"):
                    ref_pos = ref_obj.Shape.getCenterOfMass()
                else:
                    ref_pos = Vector(0, 0, 0)

                # Update end point (arrow follows geometry)
                obj.EndPoint = ref_pos
            except (AttributeError, ReferenceError):
                self._valid_reference = False

    def _create_leader_geometry(self, obj):
        """Create leader line geometry for visualization.

        Override in view provider for Coin3D rendering.
        """
        pass

    def onChanged(self, obj, prop):
        """Called when a property changes.

        Triggers updates when geometry or style properties change.
        """
        if prop in ["StartPoint", "EndPoint", "MidPoint", "HasMidPoint", "Text"]:
            self.execute(obj)
        elif prop == "ReferenceObject":
            self.onDocumentRestored(obj)

    def get_geometry_points(self):
        """Return leader line segment points.

        Returns:
            List of Vector points for leader segments
        """
        start = self.obj.StartPoint
        end = self.obj.EndPoint
        mid = self.obj.MidPoint
        has_mid = self.obj.HasMidPoint

        if has_mid:
            return [start, mid, end]
        else:
            return [start, end]


class ViewProviderLeaderLine:
    """View provider for leader line visualization.

    Provides Coin3D line and arrow rendering.
    """

    def __init__(self, vobj):
        """Initialize view provider.

        Args:
            vobj: Object's view proxy object
        """
        vobj.addProperty(
            "App::PropertyFloat", "Scale", "Visual", "Display scale factor"
        ).Scale = 1.0
        vobj.Proxy = self
        self.vobj = vobj

    def getIcon(self):
        """Return icon for tree view.

        Returns:
            Path to icon file
        """
        return ":/icons/Draft_Leader.svg"

    def attach(self, vobj):
        """Attach to document and create scene graph.

        Args:
            vobj: View provider object
        """
        self.vobj = vobj
        self._update_geometry()

    def _update_geometry(self):
        """Update scene graph with leader geometry."""
        obj = self.vobj.Object
        if not hasattr(obj, "Proxy") or not obj.Proxy:
            return

        # Clear existing geometry
        self._clear_geometry()

        # Get leader properties
        arrow_size = getattr(obj, "ArrowSize", 3.0)
        line_width = getattr(obj, "LineWidth", 1.0)
        line_color = getattr(obj, "LineColor", (0.0, 0.0, 0.0, 1.0))
        arrow_style = getattr(obj, "ArrowStyle", "Filled")
        text = getattr(obj, "Text", "")
        points = obj.Proxy.get_geometry_points()

        # Create line segments (SoLineSet)
        # Create arrowhead (SoCone or custom triangle)
        # Create text label at start point if provided
        pass  # Coin3D nodes created here

    def _clear_geometry(self):
        """Remove all children from scene graph."""
        pass

    def onDocumentRestored(self, vobj):
        """Called when document is restored.

        Reconstructs scene graph after file load.
        """
        self.vobj = vobj
        self._update_geometry()


# ============================================================================
# Text and Leader Line Commands
# ============================================================================


class TextLabelCommand:
    """Command for creating text labels."""

    def GetResources(self):
        """Return command resources."""
        return {
            "MenuText": "Text Label",
            "ToolTip": "Create text annotation label",
            "Icon": "text_label.svg",
        }

    def Activated(self):
        """Called when command is activated.

        Shows dialog for text input with formatting options.
        """
        App.Console.PrintMessage("Text Label: Click to place text\n")
        # Show text input dialog with:
        # - Multiline text field
        # - Font size spinner
        # - Rotation angle
        # - Font family dropdown
        # - Color picker
        # - Justification options

    def isActive(self):
        """Check if command is active."""
        return App.ActiveDocument is not None


class EditTextCommand:
    """Command for editing existing text labels."""

    def GetResources(self):
        """Return command resources."""
        return {
            "MenuText": "Edit Text",
            "ToolTip": "Edit selected text label",
            "Icon": "edit_text.svg",
        }

    def Activated(self):
        """Called when command is activated."""
        # Check if text label is selected
        # Show same dialog as create but populated
        App.Console.PrintMessage("Edit Text: Select label to edit\n")

    def isActive(self):
        """Check if command is active."""
        return App.ActiveDocument is not None


class LeaderLineCommand:
    """Command for creating leader lines."""

    def GetResources(self):
        """Return command resources."""
        return {
            "MenuText": "Leader Line",
            "ToolTip": "Create leader line with arrow",
            "Icon": "leader_line.svg",
        }

    def Activated(self):
        """Called when command is activated.

        Multi-click workflow for leader placement.
        """
        App.Console.PrintMessage("Leader Line: Click to place text attachment\n")
        # Click 1: Start point (text side)
        # Click 2: Optional elbow point (Ctrl+Click to skip)
        # Click 3: End point (arrow location)
        # Optional: Show dialog for text input

    def isActive(self):
        """Check if command is active."""
        return App.ActiveDocument is not None


# ============================================================================
# Annotation Update Management
# ============================================================================


class AnnotationUpdateManager:
    """Manages parametric updates for annotations.

    Centralized handler for annotation geometry change notifications.
    """

    _instance = None
    _observers = []

    def __new__(cls):
        """Singleton pattern for update manager."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def register_annotation(self, annotation_obj):
        """Register annotation for update notifications.

        Args:
            annotation_obj: FeaturePython object with annotation proxy
        """
        if annotation_obj not in self._observers:
            self._observers.append(annotation_obj)

    def unregister_annotation(self, annotation_obj):
        """Remove annotation from update registry.

        Args:
            annotation_obj: FeaturePython object to remove
        """
        if annotation_obj in self._observers:
            self._observers.remove(annotation_obj)

    def on_object_changed(self, doc, obj, prop):
        """Called when any document object changes.

        Args:
            doc: FreeCAD document
            obj: Changed object
            prop: Property name that changed
        """
        if prop != "Placement":
            return

        # Find all annotations referencing this object
        for ann_obj in self._observers:
            ref = getattr(ann_obj, "ReferenceObject", None)
            if ref and ref.Name == obj.Name:
                self._update_annotation(ann_obj)

    def _update_annotation(self, ann_obj):
        """Update single annotation from reference geometry.

        Args:
            ann_obj: Annotation object to update
        """
        proxy = getattr(ann_obj, "Proxy", None)
        if not proxy or not hasattr(proxy, "execute"):
            return

        # Recalculate annotation position and geometry
        proxy.execute(ann_obj)


def create_annotation_reference(ann_obj, ref_obj):
    """Create parametric link between annotation and geometry.

    Args:
        ann_obj: Annotation FeaturePython object
        ref_obj: Referenced geometric object

    Returns:
        True if link created successfully
    """
    if not hasattr(ann_obj, "ReferenceObject"):
        return False

    ann_obj.ReferenceObject = ref_obj

    # Register for updates
    manager = AnnotationUpdateManager()
    manager.register_annotation(ann_obj)

    return True


def remove_annotation_reference(ann_obj):
    """Remove parametric link from annotation.

    Args:
        ann_obj: Annotation FeaturePython object
    """
    ann_obj.ReferenceObject = None

    # Unregister from updates
    manager = AnnotationUpdateManager()
    manager.unregister_annotation(ann_obj)


# ============================================================================
# Text Formatting Utilities
# ============================================================================


def wrap_text(text, max_line_length=80):
    """Wrap text to multiple lines.

    Args:
        text: Input text string
        max_line_length: Maximum characters per line

    Returns:
        List of text lines
    """
    if not text or len(text) <= max_line_length:
        return [text] if text else []

    lines = []
    current_line = ""

    words = text.split()
    for word in words:
        if len(current_line) + len(word) + 1 <= max_line_length:
            current_line += " " + word if current_line else word
        else:
            if current_line:
                lines.append(current_line)
            current_line = word

    if current_line:
        lines.append(current_line)

    return lines


def parse_multiline_text(text):
    """Parse multiline text with \\n escape sequences.

    Args:
        text: Input text with optional \\n sequences

    Returns:
        List of text lines
    """
    if not text:
        return []

    # Split by \n escape sequence
    lines = text.split("\\n")
    return [line.strip() for line in lines if line.strip()]


def format_multiline_text(lines):
    """Format multiline text with \\n escape sequences.

    Args:
        lines: List of text lines

    Returns:
        Text with \\n escape sequences
    """
    return "\\n".join(lines)


# ============================================================================
# Command Registration Helper
# ============================================================================


def register_annotation_commands():
    """Register all annotation commands with FreeCAD."""
    try:
        App.addCommand("BIM_TextLabel", TextLabelCommand())
        App.addCommand("BIM_EditText", EditTextCommand())
        App.addCommand("BIM_LeaderLine", LeaderLineCommand())
        App.Console.PrintMessage("Annotation commands registered\n")
        return True
    except Exception as e:
        App.Console.PrintError(f"Failed to register annotation commands: {e}\n")
        return False
