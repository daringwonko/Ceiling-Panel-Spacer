"""
Aesthetic Scoring Model.

Evaluates design aesthetics based on:
- Golden ratio compliance
- Symmetry
- Panel proportions
- Visual balance
"""

import numpy as np
from dataclasses import dataclass
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

GOLDEN_RATIO = 1.618033988749895


@dataclass
class AestheticScore:
    """Aesthetic evaluation result."""
    overall_score: float  # 0-100
    symmetry_score: float
    proportion_score: float
    balance_score: float
    coverage_score: float
    recommendations: List[str]


class AestheticScorer:
    """
    Evaluates aesthetic quality of ceiling panel layouts.

    Uses design principles:
    - Golden ratio for proportions
    - Symmetry analysis
    - Visual balance
    - Coverage efficiency
    """

    def __init__(self):
        self.golden_ratio = GOLDEN_RATIO
        self.preferred_ratios = [1.0, 1.5, 1.618, 2.0]

    def score(
        self,
        ceiling_length_mm: float,
        ceiling_width_mm: float,
        panel_width_mm: float,
        panel_height_mm: float,
        panels_x: int,
        panels_y: int,
        perimeter_gap_mm: float,
        panel_gap_mm: float
    ) -> AestheticScore:
        """
        Score the aesthetic quality of a layout.

        Returns:
            AestheticScore with detailed breakdown
        """
        recommendations = []

        # 1. Proportion score - how close to preferred ratios
        panel_ratio = max(panel_width_mm, panel_height_mm) / min(panel_width_mm, panel_height_mm)
        ratio_distances = [abs(panel_ratio - r) for r in self.preferred_ratios]
        min_distance = min(ratio_distances)
        proportion_score = max(0, 100 - min_distance * 30)

        if proportion_score < 70:
            recommendations.append(
                f"Consider adjusting panel ratio closer to 1:1, 1:1.5, or 1:1.618 (current: 1:{panel_ratio:.2f})"
            )

        # 2. Symmetry score
        ceiling_ratio = ceiling_length_mm / ceiling_width_mm
        grid_ratio = panels_y / panels_x if panels_x > 0 else 1

        symmetry_diff = abs(ceiling_ratio - grid_ratio)
        symmetry_score = max(0, 100 - symmetry_diff * 50)

        if symmetry_score < 80:
            recommendations.append("Grid layout doesn't match ceiling proportions well")

        # 3. Balance score - even spacing
        total_gap_x = 2 * perimeter_gap_mm + (panels_x - 1) * panel_gap_mm
        total_gap_y = 2 * perimeter_gap_mm + (panels_y - 1) * panel_gap_mm

        gap_ratio = total_gap_x / total_gap_y if total_gap_y > 0 else 1
        gap_diff = abs(gap_ratio - 1)
        balance_score = max(0, 100 - gap_diff * 40)

        # 4. Coverage score
        total_area = ceiling_length_mm * ceiling_width_mm
        panel_area = panel_width_mm * panel_height_mm * panels_x * panels_y
        coverage = panel_area / total_area * 100

        coverage_score = coverage  # Higher coverage is better
        if coverage < 60:
            recommendations.append("Consider reducing gaps to improve coverage")

        # Calculate overall score (weighted average)
        overall_score = (
            proportion_score * 0.3 +
            symmetry_score * 0.25 +
            balance_score * 0.2 +
            coverage_score * 0.25
        )

        if overall_score >= 90:
            recommendations.insert(0, "Excellent aesthetic balance!")
        elif overall_score >= 75:
            recommendations.insert(0, "Good design with minor improvements possible")
        elif overall_score >= 60:
            recommendations.insert(0, "Acceptable design, consider suggested improvements")
        else:
            recommendations.insert(0, "Design could benefit from significant adjustments")

        return AestheticScore(
            overall_score=round(overall_score, 1),
            symmetry_score=round(symmetry_score, 1),
            proportion_score=round(proportion_score, 1),
            balance_score=round(balance_score, 1),
            coverage_score=round(coverage_score, 1),
            recommendations=recommendations
        )

    def suggest_improvements(self, score: AestheticScore) -> List[Dict[str, Any]]:
        """Generate specific improvement suggestions."""
        improvements = []

        if score.proportion_score < 80:
            improvements.append({
                'category': 'proportion',
                'priority': 'high' if score.proportion_score < 60 else 'medium',
                'suggestion': 'Adjust panel dimensions to match golden ratio (1:1.618)',
                'expected_improvement': 15
            })

        if score.symmetry_score < 80:
            improvements.append({
                'category': 'symmetry',
                'priority': 'medium',
                'suggestion': 'Adjust grid layout to better match ceiling proportions',
                'expected_improvement': 10
            })

        if score.coverage_score < 70:
            improvements.append({
                'category': 'coverage',
                'priority': 'low',
                'suggestion': 'Reduce gap sizes to improve coverage efficiency',
                'expected_improvement': 5
            })

        return improvements
