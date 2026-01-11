"""
Computer Vision module for Ceiling Panel Calculator.

Extracts ceiling dimensions from floor plan images.
"""

from .floor_plan_parser import FloorPlanParser
from .dimension_extractor import DimensionExtractor

__all__ = ['FloorPlanParser', 'DimensionExtractor']
