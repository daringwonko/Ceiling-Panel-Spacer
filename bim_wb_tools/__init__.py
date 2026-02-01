"""
BIM Workbench Tools Package

Provides dimensioning, annotation, and other BIM tools for ceiling panel layouts.
"""

# Dimension classes
from .dimension import (
    BaseDimension,
    AlignedDimension,
    HorizontalDimension,
    VerticalDimension,
    RadiusDimension,
    AngleDimension,
    ViewProviderBaseDimension,
    ViewProviderAlignedDimension,
    ViewProviderRadiusDimension,
    ViewProviderAngleDimension,
    DimensionUpdateManager,
    AlignedDimensionCommand,
    HorizontalDimensionCommand,
    VerticalDimensionCommand,
    RadiusDimensionCommand,
    AngleDimensionCommand,
    register_dimension_commands,
    calculate_distance,
    calculate_angle,
    format_dimension,
    is_circle_or_arc,
)

# Annotation classes
from .annotation import (
    TextLabel,
    ViewProviderTextLabel,
    LeaderLine,
    ViewProviderLeaderLine,
    TextLabelCommand,
    EditTextCommand,
    LeaderLineCommand,
    AnnotationUpdateManager,
    register_annotation_commands,
    wrap_text,
    parse_multiline_text,
)

# Style management
from .dimension_styles import (
    DimensionStyle,
    StyleManager,
    apply_style_to_dimension,
    get_style_for_dimension,
    StyleDialog,
    DimensionPreferences,
)

__all__ = [
    # Dimension classes
    "BaseDimension",
    "AlignedDimension",
    "HorizontalDimension",
    "VerticalDimension",
    "RadiusDimension",
    "AngleDimension",
    "ViewProviderBaseDimension",
    "ViewProviderAlignedDimension",
    "ViewProviderRadiusDimension",
    "ViewProviderAngleDimension",
    "DimensionUpdateManager",
    "AlignedDimensionCommand",
    "HorizontalDimensionCommand",
    "VerticalDimensionCommand",
    "RadiusDimensionCommand",
    "AngleDimensionCommand",
    "register_dimension_commands",
    "calculate_distance",
    "calculate_angle",
    "format_dimension",
    "is_circle_or_arc",
    # Annotation classes
    "TextLabel",
    "ViewProviderTextLabel",
    "LeaderLine",
    "ViewProviderLeaderLine",
    "TextLabelCommand",
    "EditTextCommand",
    "LeaderLineCommand",
    "AnnotationUpdateManager",
    "register_annotation_commands",
    "wrap_text",
    "parse_multiline_text",
    # Style management
    "DimensionStyle",
    "StyleManager",
    "apply_style_to_dimension",
    "get_style_for_dimension",
    "StyleDialog",
    "DimensionPreferences",
]
