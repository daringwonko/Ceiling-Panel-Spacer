"""BIM (Building Information Modeling) module.

Provides structural object classes, creation tools, and property panels
for BIM workflows in the Ceiling Panel Spacer application.
"""

from .objects import Wall, Beam, Column, Slab
from .objects import create_wall, create_beam, create_column, create_slab
from .gui.structural_tools import WallTool, BeamTool, ColumnTool, SlabTool
from .property.structural_props import (
    WallPropertyPanel,
    BeamPropertyPanel,
    ColumnPropertyPanel,
    SlabPropertyPanel,
    create_property_panel,
)
from .preview.structural_preview import StructuralPreview

__version__ = "1.0.0"

__all__ = [
    # Objects
    "Wall",
    "Beam",
    "Column",
    "Slab",
    # Creation functions
    "create_wall",
    "create_beam",
    "create_column",
    "create_slab",
    # Tools
    "WallTool",
    "BeamTool",
    "ColumnTool",
    "SlabTool",
    # Property panels
    "WallPropertyPanel",
    "BeamPropertyPanel",
    "ColumnPropertyPanel",
    "SlabPropertyPanel",
    "create_property_panel",
    # Preview
    "StructuralPreview",
]
