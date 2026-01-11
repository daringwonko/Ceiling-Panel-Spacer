"""
Design module for Ceiling Panel Calculator.

Contains building design engines including:
- Structural engineering calculations
- MEP (Mechanical, Electrical, Plumbing) systems
- Multi-story building design
- Site planning and zoning
"""

from .structural_engine import (
    StructuralEngine,
    BeamDesign,
    ColumnDesign,
    FoundationDesign,
    LoadCalculation,
)

from .mep_systems import (
    MEPSystemEngine,
    HVACSystem,
    ElectricalSystem,
    PlumbingSystem,
    MEPCoordinator,
)

from .multi_story_designer import (
    MultiStoryDesigner,
    Floor,
    Space,
    SpaceType,
    VerticalTransportType,
)

from .site_planner import (
    SitePlanner,
    SiteCharacteristics,
    ZoningType,
    ZoningRegulation,
    SiteAnalysisResult,
)

__all__ = [
    # Structural
    'StructuralEngine',
    'BeamDesign',
    'ColumnDesign',
    'FoundationDesign',
    'LoadCalculation',
    # MEP
    'MEPSystemEngine',
    'HVACSystem',
    'ElectricalSystem',
    'PlumbingSystem',
    'MEPCoordinator',
    # Multi-story
    'MultiStoryDesigner',
    'Floor',
    'Space',
    'SpaceType',
    'VerticalTransportType',
    # Site planning
    'SitePlanner',
    'SiteCharacteristics',
    'ZoningType',
    'ZoningRegulation',
    'SiteAnalysisResult',
]
