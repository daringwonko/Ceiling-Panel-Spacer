"""
Ceiling Panel Calculator Platform

A comprehensive construction design platform for:
- Optimal ceiling panel layout calculation
- 3D visualization and CAD export
- IoT sensor monitoring
- AI-powered design optimization
- Blockchain material verification

Usage:
    from core import CeilingPanelCalculator, CeilingDimensions, PanelSpacing

    dims = CeilingDimensions(length_mm=5000, width_mm=4000)
    spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=50)
    calc = CeilingPanelCalculator(dims, spacing)
    layout = calc.calculate_optimal_layout()
"""

__version__ = "2.0.0"
__author__ = "Ceiling Panel Calculator Team"

# Convenience imports for common use cases
from core import (
    CeilingPanelCalculator,
    CeilingDimensions,
    PanelSpacing,
    Material,
    PanelLayout,
    MATERIALS,
)

__all__ = [
    '__version__',
    'CeilingPanelCalculator',
    'CeilingDimensions',
    'PanelSpacing',
    'Material',
    'PanelLayout',
    'MATERIALS',
]
