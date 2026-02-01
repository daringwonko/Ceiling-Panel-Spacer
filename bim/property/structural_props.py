"""Property panels for structural BIM objects.

Provides UI panels for editing parametric properties of structural objects:
- WallPropertyPanel: Edit wall dimensions, material, position
- BeamPropertyPanel: Edit beam profile, position, material
- ColumnPropertyPanel: Edit column height, profile, material
- SlabPropertyPanel: Edit slab thickness, elevation, material
"""

from typing import Optional, Dict, Any, List, Callable, Literal
from dataclasses import dataclass, field


@dataclass
class PropertyField:
    """Definition of a property field."""

    name: str
    label: str
    field_type: Literal["float", "int", "string", "choice", "boolean", "coordinate"]
    value: Any = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    options: List[str] = field(default_factory=list)
    read_only: bool = False
    unit: str = ""


class BasePropertyPanel:
    """Base class for structural property panels."""

    def __init__(self, object_id: str, object_type: str):
        self.object_id = object_id
        self.object_type = object_type
        self.fields: Dict[str, PropertyField] = {}
        self.on_change_callbacks: List[Callable] = []

    def register_on_change(self, callback: Callable):
        """Register callback for property changes."""
        self.on_change_callbacks.append(callback)

    def unregister_on_change(self, callback: Callable):
        """Unregister callback."""
        if callback in self.on_change_callbacks:
            self.on_change_callbacks.remove(callback)

    def _notify_change(self, property_name: str, old_value: Any, new_value: Any):
        """Notify all registered callbacks of property change."""
        for callback in self.on_change_callbacks:
            callback(self.object_id, property_name, old_value, new_value)

    def get_fields(self) -> List[PropertyField]:
        """Get all property fields."""
        return list(self.fields.values())

    def get_field(self, name: str) -> Optional[PropertyField]:
        """Get a specific property field."""
        return self.fields.get(name)

    def update_field(self, name: str, value: Any) -> bool:
        """Update a property field value.

        Returns:
            True if value was accepted, False if rejected (validation failed)
        """
        if name not in self.fields:
            return False

        field = self.fields[name]
        old_value = field.value

        # Validate value
        if not self._validate_value(field, value):
            return False

        field.value = value
        self._notify_change(name, old_value, value)
        return True

    def _validate_value(self, field: PropertyField, value: Any) -> bool:
        """Validate a value for a field."""
        if field.read_only:
            return False

        if field.field_type in ["float", "int"]:
            if field.min_value is not None and value < field.min_value:
                return False
            if field.max_value is not None and value > field.max_value:
                return False

        if field.field_type == "choice" and field.options:
            if value not in field.options:
                return False

        return True


class WallPropertyPanel(BasePropertyPanel):
    """Property panel for Wall objects."""

    def __init__(self, wall_data: Dict[str, Any]):
        super().__init__(wall_data.get("id", ""), "wall")
        self._init_fields(wall_data)

    def _init_fields(self, wall_data: Dict[str, Any]):
        """Initialize property fields from wall data."""
        geometry = wall_data.get("geometry", {})

        # Start point coordinates
        start_point = geometry.get("start_point", (0, 0, 0))
        self.fields["start_x"] = PropertyField(
            name="start_x",
            label="Start X",
            field_type="float",
            value=start_point[0],
            unit="mm",
        )
        self.fields["start_y"] = PropertyField(
            name="start_y",
            label="Start Y",
            field_type="float",
            value=start_point[1],
            unit="mm",
        )
        self.fields["start_z"] = PropertyField(
            name="start_z",
            label="Start Z",
            field_type="float",
            value=start_point[2],
            unit="mm",
        )

        # End point coordinates
        end_point = geometry.get("end_point", (0, 0, 0))
        self.fields["end_x"] = PropertyField(
            name="end_x",
            label="End X",
            field_type="float",
            value=end_point[0],
            unit="mm",
        )
        self.fields["end_y"] = PropertyField(
            name="end_y",
            label="End Y",
            field_type="float",
            value=end_point[1],
            unit="mm",
        )
        self.fields["end_z"] = PropertyField(
            name="end_z",
            label="End Z",
            field_type="float",
            value=end_point[2],
            unit="mm",
        )

        # Dimensions
        self.fields["height"] = PropertyField(
            name="height",
            label="Height",
            field_type="float",
            value=geometry.get("height", 2800),
            min_value=1,
            unit="mm",
        )
        self.fields["thickness"] = PropertyField(
            name="thickness",
            label="Thickness",
            field_type="float",
            value=geometry.get("thickness", 200),
            min_value=1,
            unit="mm",
        )

        # Read-only calculated properties
        self.fields["length"] = PropertyField(
            name="length",
            label="Length",
            field_type="float",
            value=geometry.get("length", 0),
            read_only=True,
            unit="mm",
        )
        self.fields["volume"] = PropertyField(
            name="volume",
            label="Volume",
            field_type="float",
            value=geometry.get("volume", 0),
            read_only=True,
            unit="mm³",
        )

        # Material and level
        properties = wall_data.get("properties", {})
        self.fields["material"] = PropertyField(
            name="material",
            label="Material",
            field_type="choice",
            value=properties.get("material", "Concrete"),
            options=["Concrete", "Steel", "Timber", "Brick", "Glass", "Insulation"],
        )
        self.fields["level"] = PropertyField(
            name="level",
            label="Level",
            field_type="string",
            value=geometry.get("level", "Level 0"),
        )

    def get_wall_data(self) -> Dict[str, Any]:
        """Get updated wall data from panel fields."""
        return {
            "id": self.object_id,
            "type": "wall",
            "geometry": {
                "start_point": (
                    self.fields["start_x"].value,
                    self.fields["start_y"].value,
                    self.fields["start_z"].value,
                ),
                "end_point": (
                    self.fields["end_x"].value,
                    self.fields["end_y"].value,
                    self.fields["end_z"].value,
                ),
                "height": self.fields["height"].value,
                "thickness": self.fields["thickness"].value,
                "level": self.fields["level"].value,
            },
            "properties": {
                "material": self.fields["material"].value,
            },
        }


class BeamPropertyPanel(BasePropertyPanel):
    """Property panel for Beam objects."""

    def __init__(self, beam_data: Dict[str, Any]):
        super().__init__(beam_data.get("id", ""), "beam")
        self._init_fields(beam_data)

    def _init_fields(self, beam_data: Dict[str, Any]):
        """Initialize property fields from beam data."""
        geometry = beam_data.get("geometry", {})

        # Start point coordinates
        start_point = geometry.get("start_point", (0, 0, 0))
        self.fields["start_x"] = PropertyField(
            name="start_x",
            label="Start X",
            field_type="float",
            value=start_point[0],
            unit="mm",
        )
        self.fields["start_y"] = PropertyField(
            name="start_y",
            label="Start Y",
            field_type="float",
            value=start_point[1],
            unit="mm",
        )
        self.fields["start_z"] = PropertyField(
            name="start_z",
            label="Start Z",
            field_type="float",
            value=start_point[2],
            unit="mm",
        )

        # End point coordinates
        end_point = geometry.get("end_point", (0, 0, 0))
        self.fields["end_x"] = PropertyField(
            name="end_x",
            label="End X",
            field_type="float",
            value=end_point[0],
            unit="mm",
        )
        self.fields["end_y"] = PropertyField(
            name="end_y",
            label="End Y",
            field_type="float",
            value=end_point[1],
            unit="mm",
        )
        self.fields["end_z"] = PropertyField(
            name="end_z",
            label="End Z",
            field_type="float",
            value=end_point[2],
            unit="mm",
        )

        # Profile dimensions
        self.fields["profile_width"] = PropertyField(
            name="profile_width",
            label="Profile Width",
            field_type="float",
            value=geometry.get("profile_width", 200),
            min_value=1,
            unit="mm",
        )
        self.fields["profile_height"] = PropertyField(
            name="profile_height",
            label="Profile Height",
            field_type="float",
            value=geometry.get("profile_height", 400),
            min_value=1,
            unit="mm",
        )

        # Read-only calculated properties
        self.fields["length"] = PropertyField(
            name="length",
            label="Length",
            field_type="float",
            value=geometry.get("length", 0),
            read_only=True,
            unit="mm",
        )
        self.fields["volume"] = PropertyField(
            name="volume",
            label="Volume",
            field_type="float",
            value=geometry.get("volume", 0),
            read_only=True,
            unit="mm³",
        )
        self.fields["weight"] = PropertyField(
            name="weight",
            label="Weight",
            field_type="float",
            value=geometry.get("weight", 0),
            read_only=True,
            unit="kg",
        )

        # Material
        properties = beam_data.get("properties", {})
        self.fields["material"] = PropertyField(
            name="material",
            label="Material",
            field_type="choice",
            value=properties.get("material", "Concrete"),
            options=["Concrete", "Steel", "Timber", "Aluminum"],
        )
        self.fields["elevation"] = PropertyField(
            name="elevation",
            label="Elevation",
            field_type="float",
            value=properties.get("elevation", 2800),
            unit="mm",
        )

    def get_beam_data(self) -> Dict[str, Any]:
        """Get updated beam data from panel fields."""
        return {
            "id": self.object_id,
            "type": "beam",
            "geometry": {
                "start_point": (
                    self.fields["start_x"].value,
                    self.fields["start_y"].value,
                    self.fields["start_z"].value,
                ),
                "end_point": (
                    self.fields["end_x"].value,
                    self.fields["end_y"].value,
                    self.fields["end_z"].value,
                ),
                "profile_width": self.fields["profile_width"].value,
                "profile_height": self.fields["profile_height"].value,
            },
            "properties": {
                "material": self.fields["material"].value,
                "elevation": self.fields["elevation"].value,
            },
        }


class ColumnPropertyPanel(BasePropertyPanel):
    """Property panel for Column objects."""

    def __init__(self, column_data: Dict[str, Any]):
        super().__init__(column_data.get("id", ""), "column")
        self._init_fields(column_data)

    def _init_fields(self, column_data: Dict[str, Any]):
        """Initialize property fields from column data."""
        geometry = column_data.get("geometry", {})

        # Position
        position = geometry.get("position", (0, 0))
        self.fields["pos_x"] = PropertyField(
            name="pos_x",
            label="Position X",
            field_type="float",
            value=position[0],
            unit="mm",
        )
        self.fields["pos_y"] = PropertyField(
            name="pos_y",
            label="Position Y",
            field_type="float",
            value=position[1],
            unit="mm",
        )

        # Elevations
        self.fields["base_elevation"] = PropertyField(
            name="base_elevation",
            label="Base Elevation",
            field_type="float",
            value=geometry.get("base_elevation", 0),
            unit="mm",
        )
        self.fields["height"] = PropertyField(
            name="height",
            label="Height",
            field_type="float",
            value=geometry.get("height", 3000),
            min_value=1,
            unit="mm",
        )

        # Profile
        self.fields["profile_type"] = PropertyField(
            name="profile_type",
            label="Profile Type",
            field_type="choice",
            value=geometry.get("profile_type", "rectangle"),
            options=["rectangle", "circle"],
        )
        self.fields["width"] = PropertyField(
            name="width",
            label="Width / Diameter",
            field_type="float",
            value=geometry.get("width", 300),
            min_value=1,
            unit="mm",
        )
        self.fields["depth"] = PropertyField(
            name="depth",
            label="Depth (Rectangle only)",
            field_type="float",
            value=geometry.get("depth", 300),
            min_value=1,
            unit="mm",
        )

        # Read-only calculated properties
        self.fields["top_elevation"] = PropertyField(
            name="top_elevation",
            label="Top Elevation",
            field_type="float",
            value=geometry.get("top_elevation", 3000),
            read_only=True,
            unit="mm",
        )
        self.fields["cross_sectional_area"] = PropertyField(
            name="cross_sectional_area",
            label="Cross-Sectional Area",
            field_type="float",
            value=geometry.get("cross_sectional_area", 0),
            read_only=True,
            unit="mm²",
        )
        self.fields["volume"] = PropertyField(
            name="volume",
            label="Volume",
            field_type="float",
            value=geometry.get("volume", 0),
            read_only=True,
            unit="mm³",
        )

        # Material and level
        properties = column_data.get("properties", {})
        self.fields["material"] = PropertyField(
            name="material",
            label="Material",
            field_type="choice",
            value=properties.get("material", "Concrete"),
            options=["Concrete", "Steel", "Timber", "Aluminum"],
        )
        self.fields["level"] = PropertyField(
            name="level",
            label="Level",
            field_type="string",
            value=geometry.get("level", "Level 0"),
        )

    def get_column_data(self) -> Dict[str, Any]:
        """Get updated column data from panel fields."""
        return {
            "id": self.object_id,
            "type": "column",
            "geometry": {
                "position": (self.fields["pos_x"].value, self.fields["pos_y"].value),
                "base_elevation": self.fields["base_elevation"].value,
                "height": self.fields["height"].value,
                "profile_type": self.fields["profile_type"].value,
                "width": self.fields["width"].value,
                "depth": self.fields["depth"].value,
                "level": self.fields["level"].value,
            },
            "properties": {
                "material": self.fields["material"].value,
            },
        }


class SlabPropertyPanel(BasePropertyPanel):
    """Property panel for Slab objects."""

    def __init__(self, slab_data: Dict[str, Any]):
        super().__init__(slab_data.get("id", ""), "slab")
        self._init_fields(slab_data)

    def _init_fields(self, slab_data: Dict[str, Any]):
        """Initialize property fields from slab data."""
        geometry = slab_data.get("geometry", {})

        # Thickness and elevation
        self.fields["thickness"] = PropertyField(
            name="thickness",
            label="Thickness",
            field_type="float",
            value=geometry.get("thickness", 200),
            min_value=1,
            unit="mm",
        )
        self.fields["elevation"] = PropertyField(
            name="elevation",
            label="Top Elevation",
            field_type="float",
            value=geometry.get("elevation", 3000),
            unit="mm",
        )
        self.fields["extrude_direction"] = PropertyField(
            name="extrude_direction",
            label="Extrude Direction",
            field_type="choice",
            value=geometry.get("extrude_direction", "down"),
            options=["down", "up"],
        )

        # Read-only calculated properties
        self.fields["area"] = PropertyField(
            name="area",
            label="Area",
            field_type="float",
            value=geometry.get("area", 0),
            read_only=True,
            unit="mm²",
        )
        self.fields["perimeter"] = PropertyField(
            name="perimeter",
            label="Perimeter",
            field_type="float",
            value=geometry.get("perimeter", 0),
            read_only=True,
            unit="mm",
        )
        self.fields["volume"] = PropertyField(
            name="volume",
            label="Volume",
            field_type="float",
            value=geometry.get("volume", 0),
            read_only=True,
            unit="mm³",
        )
        self.fields["bottom_elevation"] = PropertyField(
            name="bottom_elevation",
            label="Bottom Elevation",
            field_type="float",
            value=geometry.get("bottom_elevation", 2800),
            read_only=True,
            unit="mm",
        )

        # Centroid
        centroid = geometry.get("centroid", (0, 0))
        self.fields["centroid_x"] = PropertyField(
            name="centroid_x",
            label="Centroid X",
            field_type="float",
            value=centroid[0],
            read_only=True,
            unit="mm",
        )
        self.fields["centroid_y"] = PropertyField(
            name="centroid_y",
            label="Centroid Y",
            field_type="float",
            value=centroid[1],
            read_only=True,
            unit="mm",
        )

        # Material and level
        properties = slab_data.get("properties", {})
        self.fields["material"] = PropertyField(
            name="material",
            label="Material",
            field_type="choice",
            value=properties.get("material", "Concrete"),
            options=["Concrete", "Steel", "Timber", "Composite"],
        )
        self.fields["level"] = PropertyField(
            name="level",
            label="Level",
            field_type="string",
            value=geometry.get("level", "Level 1"),
        )

        # Boundary points (display count only)
        boundary = geometry.get("boundary_points", [])
        self.fields["boundary_points_count"] = PropertyField(
            name="boundary_points_count",
            label="Boundary Points",
            field_type="int",
            value=len(boundary),
            read_only=True,
        )

    def get_slab_data(self) -> Dict[str, Any]:
        """Get updated slab data from panel fields."""
        return {
            "id": self.object_id,
            "type": "slab",
            "geometry": {
                "thickness": self.fields["thickness"].value,
                "elevation": self.fields["elevation"].value,
                "extrude_direction": self.fields["extrude_direction"].value,
                "level": self.fields["level"].value,
            },
            "properties": {
                "material": self.fields["material"].value,
            },
        }


# Factory function to create appropriate panel
def create_property_panel(object_data: Dict[str, Any]) -> Optional[BasePropertyPanel]:
    """Create appropriate property panel for object data.

    Args:
        object_data: BIM object data dictionary

    Returns:
        Property panel instance or None if type not supported
    """
    obj_type = object_data.get("type", "").lower()

    if obj_type == "wall":
        return WallPropertyPanel(object_data)
    elif obj_type == "beam":
        return BeamPropertyPanel(object_data)
    elif obj_type == "column":
        return ColumnPropertyPanel(object_data)
    elif obj_type == "slab":
        return SlabPropertyPanel(object_data)

    return None
