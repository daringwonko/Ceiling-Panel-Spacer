"""BIM structural objects module.

Provides parametric structural objects for BIM workflows:
- Wall: Extruded from base line with thickness and height
- Beam: Rectangular profile along a vector
- Column: Vertical element with rectangle or circle profile
- Slab: Polygonal boundary extruded to thickness
"""

from .wall import Wall, create_wall
from .beam import Beam, create_beam
from .column import Column, create_column
from .slab import Slab, create_slab

__all__ = [
    "Wall",
    "Beam",
    "Column",
    "Slab",
    "create_wall",
    "create_beam",
    "create_column",
    "create_slab",
]
