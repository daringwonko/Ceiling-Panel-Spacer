"""Validated data structures for ceiling panel calculations."""

from pydantic import field_validator, model_validator
from pydantic.dataclasses import dataclass
from typing import Tuple

from core.exceptions import ValidationError


@dataclass
class CeilingDimensions:
    """Ceiling dimensions in millimeters with validation."""

    length_mm: float  # X-axis
    width_mm: float  # Y-axis

    @field_validator("length_mm", "width_mm", mode="before")
    @classmethod
    def validate_dimension(cls, v: float, info) -> float:
        """Validate dimension is positive and within reasonable bounds."""
        try:
            v = float(v)
        except (TypeError, ValueError):
            raise ValueError(f"Dimension must be a number, got {type(v).__name__}")

        if v <= 0:
            raise ValueError(f"Dimension must be positive, got {v}mm")
        if v > 50000:  # 50m max
            raise ValueError(f"Dimension exceeds maximum (50000mm/50m), got {v}mm")
        if v < 100:  # 10cm min
            raise ValueError(f"Dimension below minimum (100mm/10cm), got {v}mm")
        return v

    def to_meters(self) -> Tuple[float, float]:
        """Convert dimensions to meters."""
        return self.length_mm / 1000, self.width_mm / 1000

    @property
    def area_sqm(self) -> float:
        """Calculate area in square meters."""
        return (self.length_mm * self.width_mm) / 1_000_000


@dataclass
class PanelSpacing:
    """Gap specifications in millimeters with validation."""

    perimeter_gap_mm: float  # Gap around ceiling edge
    panel_gap_mm: float  # Gap between panels

    @field_validator("perimeter_gap_mm", "panel_gap_mm", mode="before")
    @classmethod
    def validate_gap(cls, v: float) -> float:
        """Validate gap is non-negative and reasonable."""
        try:
            v = float(v)
        except (TypeError, ValueError):
            raise ValueError(f"Gap must be a number, got {type(v).__name__}")

        if v < 0:
            raise ValueError(f"Gap cannot be negative, got {v}mm")
        if v > 1000:  # 1m max gap
            raise ValueError(f"Gap exceeds maximum (1000mm/1m), got {v}mm")
        return v


def validate_ceiling_vs_spacing(
    ceiling: CeilingDimensions, spacing: PanelSpacing
) -> None:
    """Validate that spacing makes sense for the given ceiling."""
    available_length = ceiling.length_mm - (2 * spacing.perimeter_gap_mm)
    available_width = ceiling.width_mm - (2 * spacing.perimeter_gap_mm)

    if available_length <= 0:
        raise ValidationError(
            f"Perimeter gap ({spacing.perimeter_gap_mm}mm x 2 = {spacing.perimeter_gap_mm * 2}mm) "
            f"exceeds ceiling length ({ceiling.length_mm}mm)",
            details={
                "ceiling_length_mm": ceiling.length_mm,
                "perimeter_gap_mm": spacing.perimeter_gap_mm,
                "required_minimum_length": spacing.perimeter_gap_mm * 2 + 100,
            },
        )

    if available_width <= 0:
        raise ValidationError(
            f"Perimeter gap ({spacing.perimeter_gap_mm}mm x 2 = {spacing.perimeter_gap_mm * 2}mm) "
            f"exceeds ceiling width ({ceiling.width_mm}mm)",
            details={
                "ceiling_width_mm": ceiling.width_mm,
                "perimeter_gap_mm": spacing.perimeter_gap_mm,
                "required_minimum_width": spacing.perimeter_gap_mm * 2 + 100,
            },
        )
