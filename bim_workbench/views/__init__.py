"""
BIM Workbench Views Module

2D view generation system for architectural drawings from 3D BIM models.

Modules:
- projection: Orthographic projection engine for 3D to 2D transformation
- plan_view: Plan view generator for top-down architectural drawings
- section_view: Section view generator for vertical cut views
- elevation_view: Elevation view generator for side projections (06-17)
- view_component: Interactive 2D view display component (06-17)
"""

from .projection import (
    OrthographicProjection,
    ProjectedVertex,
    ProjectedEdge,
    ProjectedFace,
    ProjectionResult,
    ViewDirection,
    create_plan_projection,
    create_elevation_projection,
    create_section_projection,
)

from .plan_view import (
    PlanViewGenerator,
    PlanViewResult,
    PlanViewLayer,
    CutSurface,
    WallOpening,
    HatchPattern,
)

from .section_view import (
    SectionViewGenerator,
    SectionViewResult,
    SectionPlane,
    CutProfile,
    ProjectionProfile,
    SectionAnnotation,
    create_section_from_plane,
    create_building_section,
)

__all__ = [
    # Projection
    "OrthographicProjection",
    "ProjectedVertex",
    "ProjectedEdge",
    "ProjectedFace",
    "ProjectionResult",
    "ViewDirection",
    "create_plan_projection",
    "create_elevation_projection",
    "create_section_projection",
    # Plan View
    "PlanViewGenerator",
    "PlanViewResult",
    "PlanViewLayer",
    "CutSurface",
    "WallOpening",
    "HatchPattern",
    # Section View
    "SectionViewGenerator",
    "SectionViewResult",
    "SectionPlane",
    "CutProfile",
    "ProjectionProfile",
    "SectionAnnotation",
    "create_section_from_plane",
    "create_building_section",
]
