#!/usr/bin/env python3
"""
Configuration for panel layout optimization algorithm.

Provides hard constraints and optimization preferences for panel calculations.
"""

from dataclasses import dataclass, field
from typing import Literal, List


@dataclass
class AlgorithmConfig:
    """Configuration for panel layout optimization algorithm."""

    # Hard constraints
    max_panel_dimension_mm: float = 2400  # Practical limit for transport/install
    min_panel_dimension_mm: float = 300  # Too small = impractical

    # Optimization strategy
    optimization_strategy: Literal["balanced", "minimize_panels", "minimize_cuts"] = (
        "balanced"
    )

    # Preferred aspect ratios (width/length)
    preferred_aspect_ratios: List[float] = field(
        default_factory=lambda: [1.0, 1.5, 2.0]
    )

    # Search bounds
    max_panels_per_dimension: int = 50  # Limit search space

    def validate(self) -> None:
        """Validate configuration values."""
        if self.max_panel_dimension_mm <= self.min_panel_dimension_mm:
            raise ValueError(
                f"max_panel_dimension ({self.max_panel_dimension_mm}) must be > "
                f"min_panel_dimension ({self.min_panel_dimension_mm})"
            )
        if self.max_panel_dimension_mm > 5000:
            raise ValueError(
                f"max_panel_dimension ({self.max_panel_dimension_mm}) exceeds 5000mm limit"
            )
        if not self.preferred_aspect_ratios:
            raise ValueError("preferred_aspect_ratios cannot be empty")


# Convenience function for creating default config
def create_default_config() -> AlgorithmConfig:
    """Create AlgorithmConfig with default values."""
    return AlgorithmConfig()
