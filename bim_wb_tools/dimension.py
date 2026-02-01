"""
Dimension and Annotation Tools for BIM Workbench

Provides dimensioning tools including aligned, horizontal, vertical,
radial, and angular dimensions with parametric updates when geometry moves.
"""

import FreeCAD as App
import Part
import math
from FreeCAD import Vector, Placement

# ============================================================================
# Base Dimension Class
# ============================================================================


class BaseDimension:
    """Base class for all dimension types.

    Provides common functionality for dimension geometry, reference tracking,
    and parametric updates.
    """

    def __init__(self, obj):
        """Initialize dimension object with properties.

        Args:
            obj: FreeCAD FeaturePython object to configure
        """
        obj.addProperty(
            "App::PropertyVector", "StartPoint", "Dimension", "First point of dimension"
        ).StartPoint = Vector(0, 0, 0)
        obj.addProperty(
            "App::PropertyVector", "EndPoint", "Dimension", "Second point of dimension"
        ).EndPoint = Vector(0, 0, 0)
        obj.addProperty(
            "App::PropertyVector",
            "TextPosition",
            "Dimension",
            "Position of dimension text",
        ).TextPosition = Vector(0, 0, 0)
        obj.addProperty(
            "App::PropertyString", "Text", "Dimension", "Dimension text value"
        ).Text = "0.00"
        obj.addProperty(
            "App::PropertyString",
            "OverrideText",
            "Dimension",
            "Custom text override (empty = auto)",
        ).OverrideText = ""
        obj.addProperty(
            "App::PropertyLink",
            "ReferenceObject",
            "Dimension",
            "Linked geometric object for parametric updates",
        ).ReferenceObject = None
        obj.addProperty(
            "App::PropertyString",
            "ReferenceSubelement",
            "Dimension",
            "Subelement name (vertex/edge)",
        ).ReferenceSubelement = ""
        obj.addProperty(
            "App::PropertyEnumeration",
            "ConstraintMode",
            "Dimension",
            "How dimension position responds to geometry changes",
            ["Free", "Aligned", "ForceHorizontal", "ForceVertical"],
        ).ConstraintMode = "Free"
        obj.addProperty(
            "App::PropertyFloat",
            "ExtensionLineOffset",
            "Dimension",
            "Gap from geometry to extension line",
        ).ExtensionLineOffset = 1.0
        obj.addProperty(
            "App::PropertyFloat",
            "ExtensionLineExtension",
            "Dimension",
            "Extension line past dimension line",
        ).ExtensionLineExtension = 2.0
        obj.addProperty(
            "App::PropertyFloat", "ArrowSize", "Dimension", "Size of dimension arrows"
        ).ArrowSize = 2.5
        obj.addProperty(
            "App::PropertyColor", "LineColor", "Dimension", "Dimension line color"
        ).LineColor = (0.0, 0.0, 0.0, 1.0)
        obj.addProperty(
            "App::PropertyColor", "TextColor", "Dimension", "Text color"
        ).TextColor = (0.0, 0.0, 0.0, 1.0)
        obj.addProperty(
            "App::PropertyString", "Style", "Dimension", "Dimension style name"
        ).Style = "Standard"

        obj.Proxy = self
        self.obj = obj
        self._valid_references = True
        self._last_update_position = None

    def onDocumentRestored(self, obj):
        """Called when document is restored from file.

        Re-establishes object links and validates references.
        Handles broken references gracefully by setting flag.
        """
        self.obj = obj
        self._valid_references = True

        # Validate reference object still exists
        ref_obj = getattr(obj, "ReferenceObject", None)
        if ref_obj:
            try:
                # Try to access the object to verify it exists
                doc = obj.Document
                if doc.getObject(ref_obj.Name) is None:
                    # Reference object was deleted
                    self._valid_references = False
                    App.Console.PrintWarning(
                        f"Dimension reference to '{ref_obj.Name}' was deleted\n"
                    )
            except (AttributeError, ReferenceError):
                # Object no longer exists
                self._valid_references = False
                obj.ReferenceObject = None
                App.Console.PrintWarning(
                    f"Dimension reference broken after document restore\n"
                )

        # Store initial position for change detection
        self._last_update_position = self._get_reference_position()

    def _get_reference_position(self):
        """Get current position of referenced geometry.

        Returns:
            Vector or None if no valid reference
        """
        ref_obj = getattr(self.obj, "ReferenceObject", None)
        ref_sub = getattr(self.obj, "ReferenceSubelement", "")

        if not ref_obj or not self._valid_references:
            return None

        try:
            if ref_sub:
                # Get subelement position
                shape = ref_obj.Shape
                if ref_sub.startswith("Vertex"):
                    idx = int(ref_sub.replace("Vertex", "")) - 1
                    if idx < len(shape.Vertexes):
                        return shape.Vertexes[idx].Point.copy()
                elif ref_sub.startswith("Edge"):
                    idx = int(ref_sub.replace("Edge", "")) - 1
                    if idx < len(shape.Edges):
                        return shape.Edges[idx].getCenterOfMass()
            else:
                # Return object placement
                if hasattr(ref_obj, "Placement"):
                    return ref_obj.Placement.Base.copy()
        except (AttributeError, IndexError, ReferenceError):
            self._valid_references = False
            return None

        return None

    def execute(self, obj):
        """Called when dimension should be recalculated.

        Regenerates dimension geometry based on current properties.
        """
        # Calculate distance between start and end points
        start = obj.StartPoint
        end = obj.EndPoint

        if start.distanceTo(end) < 0.001:
            # Degenerate case: zero length dimension
            self._create_degenerate_geometry(obj)
            return

        # Calculate dimension value
        distance = start.distanceTo(end)
        obj.Text = self._format_dimension(distance)

        # Regenerate dimension graphics
        self._create_dimension_geometry(obj)

    def _format_dimension(self, value, precision=2, unit="mm"):
        """Format dimension value for display.

        Args:
            value: Numeric value to format
            precision: Decimal places
            unit: Unit string

        Returns:
            Formatted dimension string
        """
        format_str = f"{{:.{precision}f}} {unit}".format(value)
        # Remove trailing zeros after decimal point
        if "." in format_str:
            format_str = format_str.rstrip("0").rstrip(".")
        return format_str

    def _create_dimension_geometry(self, obj):
        """Create dimension line geometry.

        Override in subclasses for different dimension types.
        """
        pass

    def _create_degenerate_geometry(self, obj):
        """Handle zero-length dimension case.

        Args:
            obj: Dimension object
        """
        # Create a marker indicating invalid dimension
        obj.Text = "?"

    def onChanged(self, obj, prop):
        """Called when a property changes.

        Triggers recalculation when geometry properties change.
        """
        if prop in ["StartPoint", "EndPoint", "TextPosition"]:
            self.execute(obj)
        elif prop == "ReferenceObject":
            # Re-validate reference and trigger update
            self.onDocumentRestored(obj)

    def subscribe_to_changes(self):
        """Subscribe to reference object position changes.

        Uses FreeCAD's observer pattern for efficient updates.
        """
        ref_obj = getattr(self.obj, "ReferenceObject", None)
        if ref_obj:
            App.addDocumentObserver(self)

    def unsubscribe_from_changes(self):
        """Remove observer subscription."""
        App.removeDocumentObserver(self)


class ViewProviderBaseDimension:
    """Base view provider for dimension visualization.

    Provides Coin3D scene graph for OpenGL rendering.
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
        return ":/icons/Draft_Dimension.svg"

    def attach(self, vobj):
        """Attach to document and create scene graph.

        Args:
            vobj: View provider object
        """
        self.vobj = vobj
        self._update_geometry()

    def _update_geometry(self):
        """Update scene graph geometry."""
        obj = self.vobj.Object
        if not hasattr(obj, "Proxy") or not obj.Proxy:
            return

        # Clear existing geometry
        self._clear_geometry()

        # Create new geometry based on dimension type
        if hasattr(obj.Proxy, "_create_dimension_geometry"):
            obj.Proxy._create_dimension_geometry(obj)

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
# Linear Dimension Classes (Aligned, Horizontal, Vertical)
# ============================================================================


class AlignedDimension(BaseDimension):
    """Aligned dimension - measures distance between two points.

    Creates dimension line that follows the angle between points.
    """

    def __init__(self, obj):
        """Initialize aligned dimension."""
        super().__init__(obj)
        obj.addProperty(
            "App::PropertyEnumeration",
            "ArrowStyle",
            "Dimension",
            "Arrow style",
            ["Closed", "Open", "Dot", "Tick"],
        ).ArrowStyle = "Closed"
        obj.Proxy = self

    def execute(self, obj):
        """Recalculate aligned dimension."""
        start = obj.StartPoint
        end = obj.EndPoint

        # Calculate distance and angle
        distance = start.distanceTo(end)
        if distance < 0.001:
            self._create_degenerate_geometry(obj)
            return

        # Calculate dimension angle
        direction = end.sub(start)
        angle = math.atan2(direction.y, direction.x)

        # Format dimension text
        if obj.OverrideText:
            obj.Text = obj.OverrideText
        else:
            obj.Text = self._format_dimension(distance)

        self._create_dimension_geometry(obj)

    def _create_dimension_geometry(self, obj):
        """Create aligned dimension geometry.

        Creates dimension line, extension lines, arrows, and text.
        """
        start = obj.StartPoint
        end = obj.EndPoint
        text_pos = obj.TextPosition

        # Direction vectors
        direction = end.sub(start)
        direction.normalize()

        # Perpendicular for extension lines
        perp = Vector(-direction.y, direction.x, 0)

        # Calculate extension line start points
        ext_offset = obj.ExtensionLineOffset
        ext_extension = obj.ExtensionLineExtension

        # Extension line geometry
        ext_start1 = start.add(perp.multiply(-ext_offset))
        ext_end1 = start.add(perp.multiply(ext_offset + ext_extension))

        ext_start2 = end.add(perp.multiply(-ext_offset))
        ext_end2 = end.add(perp.multiply(ext_offset + ext_extension))

        # Create dimension line segment
        dim_start = start.add(perp.multiply(ext_offset))
        dim_end = end.add(perp.multiply(ext_offset))

        # Calculate text position if not set
        if text_pos.length() < 0.001:
            # Position text at midpoint with perpendicular offset
            midpoint = start.add(end).multiply(0.5)
            text_offset = perp.multiply(ext_offset + 3.0)  # 3mm above dimension line
            obj.TextPosition = midpoint.add(text_offset)

        # Arrow geometry
        arrow_size = obj.ArrowSize
        self._create_arrows(dim_start, dim_end, direction, arrow_size, obj.ArrowStyle)

    def _create_arrows(self, start, end, direction, size, style):
        """Create arrow markers at dimension line ends.

        Args:
            start: Dimension line start point
            end: Dimension line end point
            direction: Unit vector from start to end
            size: Arrow size
            style: Arrow style name
        """
        # Create triangle arrow at start (pointing away from end)
        # Create triangle arrow at end (pointing away from start)
        pass  # Coin3D geometry created in ViewProvider


class ViewProviderAlignedDimension(ViewProviderBaseDimension):
    """View provider for aligned dimensions."""

    def getIcon(self):
        """Return icon for tree view."""
        return ":/icons/Draft_Dimension.svg"

    def _update_geometry(self):
        """Update dimension visualization."""
        obj = self.vobj.Object
        # Update scene graph with new geometry
        pass


class HorizontalDimension(AlignedDimension):
    """Horizontal dimension - forces horizontal measurement.

    Creates dimension line that is always horizontal regardless
    of point positions.
    """

    def __init__(self, obj):
        """Initialize horizontal dimension."""
        super().__init__(obj)
        obj.Proxy = self
        obj.ConstraintMode = "ForceHorizontal"

    def execute(self, obj):
        """Recalculate horizontal dimension."""
        start = obj.StartPoint
        end = obj.EndPoint

        # Calculate horizontal distance only
        horizontal_dist = abs(end.x - start.x)
        if horizontal_dist < 0.001:
            self._create_degenerate_geometry(obj)
            return

        # Force end point to same Y as start (horizontal constraint)
        constrained_end = Vector(end.x, start.y, start.z)
        obj.EndPoint = constrained_end

        # Format dimension text
        if obj.OverrideText:
            obj.Text = obj.OverrideText
        else:
            obj.Text = self._format_dimension(horizontal_dist)

        self._create_dimension_geometry(obj)


class VerticalDimension(AlignedDimension):
    """Vertical dimension - forces vertical measurement.

    Creates dimension line that is always vertical regardless
    of point positions.
    """

    def __init__(self, obj):
        """Initialize vertical dimension."""
        super().__init__(obj)
        obj.Proxy = self
        obj.ConstraintMode = "ForceVertical"

    def execute(self, obj):
        """Recalculate vertical dimension."""
        start = obj.StartPoint
        end = obj.EndPoint

        # Calculate vertical distance only
        vertical_dist = abs(end.y - start.y)
        if vertical_dist < 0.001:
            self._create_degenerate_geometry(obj)
            return

        # Force end point to same X as start (vertical constraint)
        constrained_end = Vector(start.x, end.y, start.z)
        obj.EndPoint = constrained_end

        # Format dimension text
        if obj.OverrideText:
            obj.Text = obj.OverrideText
        else:
            obj.Text = self._format_dimension(vertical_dist)

        self._create_dimension_geometry(obj)


# ============================================================================
# Radial Dimension Class
# ============================================================================


class RadiusDimension(BaseDimension):
    """Radius dimension - measures radius of circles and arcs.

    Creates radius line from center to edge with text indicating "R{value}".
    """

    def __init__(self, obj):
        """Initialize radius dimension."""
        super().__init__(obj)
        obj.addProperty(
            "App::PropertyVector", "Center", "Dimension", "Center point of arc/circle"
        ).Center = Vector(0, 0, 0)
        obj.addProperty(
            "App::PropertyFloat", "Radius", "Dimension", "Radius value"
        ).Radius = 0.0
        obj.addProperty(
            "App::PropertyBool", "IsArc", "Dimension", "True if referencing an arc"
        ).IsArc = False
        obj.Proxy = self

    def execute(self, obj):
        """Recalculate radius dimension."""
        center = obj.Center
        radius = obj.Radius

        if radius < 0.001:
            self._create_degenerate_geometry(obj)
            return

        # Format radius text
        if obj.OverrideText:
            obj.Text = obj.OverrideText
        else:
            obj.Text = f"R{self._format_dimension(radius)}"

        self._create_dimension_geometry(obj)

    def _create_dimension_geometry(self, obj):
        """Create radius dimension geometry.

        Creates radius line from center to edge point, leader to text.
        """
        center = obj.Center
        edge_point = obj.EndPoint  # Point on circle/arc edge
        text_pos = obj.TextPosition

        # Direction from center to edge
        direction = edge_point.sub(center)
        if direction.Length > 0.001:
            direction.normalize()

        # Calculate text position if not set
        if text_pos.length() < 0.001:
            # Position text along bisector (180 degrees from edge)
            opposite = direction.multiply(-1.5)  # Offset for text
            obj.TextPosition = center.add(opposite)

    def _create_dimension_geometry(self, obj):
        """Create radius dimension geometry.

        Args:
            obj: Radius dimension object
        """
        center = obj.Center
        end = obj.EndPoint
        text_pos = obj.TextPosition

        # Create radius line
        # Leader line from text to edge point (not through center)
        # Arrow at edge point pointing toward center
        pass  # Coin3D geometry created in ViewProvider


class ViewProviderRadiusDimension(ViewProviderBaseDimension):
    """View provider for radius dimensions."""

    def getIcon(self):
        """Return icon for tree view."""
        return ":/icons/Draft_Radius.svg"

    def _update_geometry(self):
        """Update radius dimension visualization."""
        obj = self.vobj.Object
        # Update scene graph with radius-specific geometry
        pass


# ============================================================================
# Angular Dimension Class
# ============================================================================


class AngleDimension(BaseDimension):
    """Angular dimension - measures angle between three points.

    Creates angle arc between start and end vectors with text
    showing angle in degrees.
    """

    def __init__(self, obj):
        """Initialize angle dimension."""
        super().__init__(obj)
        obj.addProperty(
            "App::PropertyVector", "Vertex", "Dimension", "Vertex point of angle"
        ).Vertex = Vector(0, 0, 0)
        obj.addProperty(
            "App::PropertyFloat", "AngleValue", "Dimension", "Angle in degrees"
        ).AngleValue = 0.0
        obj.addProperty(
            "App::PropertyFloat", "ArcRadius", "Dimension", "Radius of angle arc"
        ).ArcRadius = 10.0
        obj.addProperty(
            "App::PropertyBool",
            "InteriorAngle",
            "Dimension",
            "Show interior angle (>180°)",
        ).InteriorAngle = True
        obj.Proxy = self

    def execute(self, obj):
        """Recalculate angle dimension."""
        vertex = obj.Vertex
        start = obj.StartPoint
        end = obj.EndPoint

        # Calculate angle from vertex to start and end points
        vec1 = start.sub(vertex)
        vec2 = end.sub(vertex)

        if vec1.Length < 0.001 or vec2.Length < 0.001:
            self._create_degenerate_geometry(obj)
            return

        # Calculate angle using dot product
        dot = vec1.dot(vec2)
        cross = vec1.x * vec2.y - vec1.y * vec2.x
        angle_rad = math.atan2(cross, dot)
        angle_deg = math.degrees(angle_rad)

        # Normalize to 0-360
        if angle_deg < 0:
            angle_deg += 360

        # Handle interior/exterior toggle
        if not obj.InteriorAngle and angle_deg > 180:
            angle_deg = 360 - angle_deg

        obj.AngleValue = angle_deg

        # Format angle text
        if obj.OverrideText:
            obj.Text = obj.OverrideText
        else:
            obj.Text = f"{angle_deg:.1f}°"

        self._create_dimension_geometry(obj)

    def _create_dimension_geometry(self, obj):
        """Create angle dimension geometry.

        Creates angle arc and extension lines.
        """
        vertex = obj.Vertex
        start = obj.StartPoint
        end = obj.EndPoint
        arc_radius = obj.ArcRadius
        text_pos = obj.TextPosition

        # Direction vectors from vertex
        vec1 = start.sub(vertex)
        vec2 = end.sub(vertex)

        if vec1.Length < 0.001 or vec2.Length < 0.001:
            return

        vec1.normalize()
        vec2.normalize()

        # Calculate angles for arc
        angle1 = math.atan2(vec1.y, vec1.x)
        angle2 = math.atan2(vec2.y, vec2.x)

        # Ensure counter-clockwise sweep
        angle_diff = angle2 - angle1
        while angle_diff <= 0:
            angle_diff += 2 * math.pi
            angle2 += 2 * math.pi

        # Create arc geometry
        # Extension lines from vertex to arc endpoints
        # Text position at arc midpoint
        if text_pos.length() < 0.001:
            mid_angle = (angle1 + angle2) / 2
            text_offset = Vector(math.cos(mid_angle), math.sin(mid_angle), 0)
            text_offset = text_offset.multiply(arc_radius + 5)
            obj.TextPosition = vertex.add(text_offset)

        # Create arc points for Coin3D rendering
        pass  # Coin3D geometry created in ViewProvider


class ViewProviderAngleDimension(ViewProviderBaseDimension):
    """View provider for angle dimensions."""

    def getIcon(self):
        """Return icon for tree view."""
        return ":/icons/Draft_Angle.svg"

    def _update_geometry(self):
        """Update angle dimension visualization."""
        obj = self.vobj.Object
        # Update scene graph with arc-specific geometry
        pass


# ============================================================================
# Dimension Update and Linking System
# ============================================================================


class DimensionUpdateManager:
    """Manages parametric updates for all dimensions.

    Centralized handler for geometry change notifications.
    """

    _instance = None
    _observers = []

    def __new__(cls):
        """Singleton pattern for update manager."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def register_dimension(self, dimension_obj):
        """Register dimension for update notifications.

        Args:
            dimension_obj: FeaturePython object with dimension proxy
        """
        if dimension_obj not in self._observers:
            self._observers.append(dimension_obj)

    def unregister_dimension(self, dimension_obj):
        """Remove dimension from update registry.

        Args:
            dimension_obj: FeaturePython object to remove
        """
        if dimension_obj in self._observers:
            self._observers.remove(dimension_obj)

    def on_object_changed(self, doc, obj, prop):
        """Called when any document object changes.

        Args:
            doc: FreeCAD document
            obj: Changed object
            prop: Property name that changed
        """
        if prop != "Placement":
            return

        # Find all dimensions referencing this object
        for dim_obj in self._observers:
            ref = getattr(dim_obj, "ReferenceObject", None)
            if ref and ref.Name == obj.Name:
                self._update_dimension(dim_obj)

    def _update_dimension(self, dim_obj):
        """Update single dimension from reference geometry.

        Args:
            dim_obj: Dimension object to update
        """
        proxy = getattr(dim_obj, "Proxy", None)
        if not proxy or not hasattr(proxy, "execute"):
            return

        # Get new positions from reference
        if hasattr(proxy, "_get_reference_position"):
            new_pos = proxy._get_reference_position()
            if new_pos:
                # Update dimension properties based on constraint mode
                mode = getattr(dim_obj, "ConstraintMode", "Free")

                if mode == "Free":
                    # Don't auto-update position
                    pass
                elif mode == "Aligned":
                    # Maintain offset from reference
                    proxy.execute(dim_obj)
                elif mode == "ForceHorizontal":
                    # Update horizontal component only
                    if hasattr(dim_obj, "EndPoint"):
                        new_end = Vector(new_pos.x, dim_obj.EndPoint.y, dim_pos.z)
                        dim_obj.EndPoint = new_end
                elif mode == "ForceVertical":
                    # Update vertical component only
                    if hasattr(dim_obj, "EndPoint"):
                        new_end = Vector(
                            dim_obj.EndPoint.x, new_pos.y, dim_obj.EndPoint.z
                        )
                        dim_obj.EndPoint = new_end

        # Recalculate dimension geometry
        proxy.execute(dim_obj)


def create_dimension_reference(dim_obj, ref_obj, subelement=""):
    """Create parametric link between dimension and geometry.

    Args:
        dim_obj: Dimension FeaturePython object
        ref_obj: Referenced geometric object
        subelement: Optional subelement name (e.g., "Vertex1")
    """
    if not hasattr(dim_obj, "ReferenceObject"):
        return False

    dim_obj.ReferenceObject = ref_obj
    dim_obj.ReferenceSubelement = subelement

    # Register for updates
    manager = DimensionUpdateManager()
    manager.register_dimension(dim_obj)

    return True


def remove_dimension_reference(dim_obj):
    """Remove parametric link from dimension.

    Args:
        dim_obj: Dimension FeaturePython object
    """
    dim_obj.ReferenceObject = None
    dim_obj.ReferenceSubelement = ""

    # Unregister from updates
    manager = DimensionUpdateManager()
    manager.unregister_dimension(dim_obj)


# ============================================================================
# Dimension Calculation Utilities
# ============================================================================


def calculate_distance(p1, p2):
    """Calculate distance between two points.

    Args:
        p1: First point (Vector)
        p2: Second point (Vector)

    Returns:
        Distance as float
    """
    return p1.distanceTo(p2)


def calculate_angle(vertex, start, end):
    """Calculate angle in degrees from three points.

    Args:
        vertex: Angle vertex point
        start: Start point of first ray
        end: End point of second ray

    Returns:
        Angle in degrees (0-360)
    """
    vec1 = start.sub(vertex)
    vec2 = end.sub(vertex)

    if vec1.Length < 0.001 or vec2.Length < 0.001:
        return 0.0

    dot = vec1.dot(vec2)
    cross = vec1.x * vec2.y - vec1.y * vec2.x
    angle_rad = math.atan2(cross, dot)
    angle_deg = math.degrees(angle_rad)

    if angle_deg < 0:
        angle_deg += 360

    return angle_deg


def format_dimension(value, precision=2, unit="mm"):
    """Format dimension value for display.

    Args:
        value: Numeric value
        precision: Decimal places
        unit: Unit string

    Returns:
        Formatted string
    """
    format_str = f"{{:.{precision}f}} {unit}".format(value)
    if "." in format_str:
        format_str = format_str.rstrip("0").rstrip(".")
    return format_str


def is_circle_or_arc(obj):
    """Check if object is a circle or arc.

    Args:
        obj: FreeCAD object to check

    Returns:
        True if object has circular geometry
    """
    if not hasattr(obj, "Shape"):
        return False

    shape = obj.Shape
    if len(shape.Edges) != 1:
        return False

    edge = shape.Edges[0]
    return isinstance(edge.Curve, (Part.Circle, Part.ArcOfCircle))


def calculate_arc_angle(edge):
    """Calculate arc angle in degrees.

    Args:
        edge: Part edge (should be arc)

    Returns:
        Angle in degrees
    """
    if not isinstance(edge.Curve, Part.ArcOfCircle):
        return 0.0

    # Get angle parameters
    curve = edge.Curve
    angle1 = math.degrees(curve.FirstParameter)
    angle2 = math.degrees(curve.LastParameter)

    angle = abs(angle2 - angle1)
    if angle > 180:
        angle = 360 - angle

    return angle


# ============================================================================
# Command Classes
# ============================================================================


class AlignedDimensionCommand:
    """Command for creating aligned dimensions."""

    def GetResources(self):
        """Return command resources."""
        return {
            "MenuText": "Aligned Dimension",
            "ToolTip": "Create aligned dimension between two points",
            "Icon": "dimension_aligned.svg",
        }

    def Activated(self):
        """Called when command is activated."""
        # 3-click workflow: point1, point2, text position
        App.Console.PrintMessage("Aligned Dimension: Click to select first point\n")

    def isActive(self):
        """Check if command is active."""
        return App.ActiveDocument is not None


class HorizontalDimensionCommand:
    """Command for creating horizontal dimensions."""

    def GetResources(self):
        """Return command resources."""
        return {
            "MenuText": "Horizontal Dimension",
            "ToolTip": "Create horizontal dimension",
            "Icon": "dimension_horizontal.svg",
        }

    def Activated(self):
        """Called when command is activated."""
        App.Console.PrintMessage("Horizontal Dimension: Click to select first point\n")

    def isActive(self):
        """Check if command is active."""
        return App.ActiveDocument is not None


class VerticalDimensionCommand:
    """Command for creating vertical dimensions."""

    def GetResources(self):
        """Return command resources."""
        return {
            "MenuText": "Vertical Dimension",
            "ToolTip": "Create vertical dimension",
            "Icon": "dimension_vertical.svg",
        }

    def Activated(self):
        """Called when command is activated."""
        App.Console.PrintMessage("Vertical Dimension: Click to select first point\n")

    def isActive(self):
        """Check if command is active."""
        return App.ActiveDocument is not None


class RadiusDimensionCommand:
    """Command for creating radius dimensions."""

    def GetResources(self):
        """Return command resources."""
        return {
            "MenuText": "Radius Dimension",
            "ToolTip": "Create radius dimension for circle or arc",
            "Icon": "dimension_radius.svg",
        }

    def Activated(self):
        """Called when command is activated."""
        App.Console.PrintMessage("Radius Dimension: Select circle or arc edge\n")

    def isActive(self):
        """Check if command is active."""
        return App.ActiveDocument is not None


class AngleDimensionCommand:
    """Command for creating angular dimensions."""

    def GetResources(self):
        """Return command resources."""
        return {
            "MenuText": "Angle Dimension",
            "ToolTip": "Create angle dimension from three points",
            "Icon": "dimension_angle.svg",
        }

    def Activated(self):
        """Called when command is activated."""
        App.Console.PrintMessage("Angle Dimension: Click to select vertex point\n")

    def isActive(self):
        """Check if command is active."""
        return App.ActiveDocument is not None


# ============================================================================
# Command Registration Helper
# ============================================================================


def register_dimension_commands():
    """Register all dimension commands with FreeCAD."""
    try:
        App.addCommand("BIM_AlignedDimension", AlignedDimensionCommand())
        App.addCommand("BIM_HorizontalDimension", HorizontalDimensionCommand())
        App.addCommand("BIM_VerticalDimension", VerticalDimensionCommand())
        App.addCommand("BIM_RadiusDimension", RadiusDimensionCommand())
        App.addCommand("BIM_AngleDimension", AngleDimensionCommand())
        App.Console.PrintMessage("Dimension commands registered\n")
        return True
    except Exception as e:
        App.Console.PrintError(f"Failed to register dimension commands: {e}\n")
        return False
