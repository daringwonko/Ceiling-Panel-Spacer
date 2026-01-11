"""
ML Inference API for Ceiling Panel Calculator.

Provides a unified interface to all ML models.
"""

from typing import Dict, Any, Optional
import logging

from .models.layout_predictor import LayoutPredictor, LayoutPrediction
from .models.cost_estimator import CostEstimator, CostEstimate
from .models.aesthetic_scorer import AestheticScorer, AestheticScore

logger = logging.getLogger(__name__)


class MLInference:
    """
    Unified ML inference API.

    Provides access to all ML models for:
    - Layout prediction
    - Cost estimation
    - Aesthetic scoring
    """

    def __init__(
        self,
        layout_model_path: Optional[str] = None,
        cost_model_path: Optional[str] = None
    ):
        self.layout_predictor = LayoutPredictor(layout_model_path)
        self.cost_estimator = CostEstimator(cost_model_path)
        self.aesthetic_scorer = AestheticScorer()

        logger.info("ML Inference initialized")

    def predict_layout(
        self,
        ceiling_length_mm: float,
        ceiling_width_mm: float,
        perimeter_gap_mm: float = 200,
        panel_gap_mm: float = 50,
        max_panel_size_mm: float = 2400
    ) -> LayoutPrediction:
        """Predict optimal panel layout."""
        return self.layout_predictor.predict(
            ceiling_length_mm=ceiling_length_mm,
            ceiling_width_mm=ceiling_width_mm,
            perimeter_gap_mm=perimeter_gap_mm,
            panel_gap_mm=panel_gap_mm,
            max_panel_size_mm=max_panel_size_mm
        )

    def estimate_cost(
        self,
        area_sqm: float,
        panel_count: int,
        material_id: str = 'standard_tiles',
        complexity_factor: float = 1.0,
        location_factor: float = 1.0
    ) -> CostEstimate:
        """Estimate project cost."""
        return self.cost_estimator.estimate(
            area_sqm=area_sqm,
            panel_count=panel_count,
            material_id=material_id,
            complexity_factor=complexity_factor,
            location_factor=location_factor
        )

    def score_aesthetics(
        self,
        ceiling_length_mm: float,
        ceiling_width_mm: float,
        panel_width_mm: float,
        panel_height_mm: float,
        panels_x: int,
        panels_y: int,
        perimeter_gap_mm: float = 200,
        panel_gap_mm: float = 50
    ) -> AestheticScore:
        """Score layout aesthetics."""
        return self.aesthetic_scorer.score(
            ceiling_length_mm=ceiling_length_mm,
            ceiling_width_mm=ceiling_width_mm,
            panel_width_mm=panel_width_mm,
            panel_height_mm=panel_height_mm,
            panels_x=panels_x,
            panels_y=panels_y,
            perimeter_gap_mm=perimeter_gap_mm,
            panel_gap_mm=panel_gap_mm
        )

    def full_analysis(
        self,
        ceiling_length_mm: float,
        ceiling_width_mm: float,
        perimeter_gap_mm: float = 200,
        panel_gap_mm: float = 50,
        max_panel_size_mm: float = 2400,
        material_id: str = 'standard_tiles'
    ) -> Dict[str, Any]:
        """
        Perform full ML analysis including layout, cost, and aesthetics.

        Returns comprehensive analysis dictionary.
        """
        # Predict layout
        layout = self.predict_layout(
            ceiling_length_mm=ceiling_length_mm,
            ceiling_width_mm=ceiling_width_mm,
            perimeter_gap_mm=perimeter_gap_mm,
            panel_gap_mm=panel_gap_mm,
            max_panel_size_mm=max_panel_size_mm
        )

        # Calculate area
        area_sqm = (ceiling_length_mm * ceiling_width_mm) / 1_000_000

        # Estimate cost
        cost = self.estimate_cost(
            area_sqm=area_sqm,
            panel_count=layout.panels_x * layout.panels_y,
            material_id=material_id
        )

        # Score aesthetics
        aesthetics = self.score_aesthetics(
            ceiling_length_mm=ceiling_length_mm,
            ceiling_width_mm=ceiling_width_mm,
            panel_width_mm=layout.panel_width_mm,
            panel_height_mm=layout.panel_height_mm,
            panels_x=layout.panels_x,
            panels_y=layout.panels_y,
            perimeter_gap_mm=perimeter_gap_mm,
            panel_gap_mm=panel_gap_mm
        )

        return {
            'layout': {
                'panels_x': layout.panels_x,
                'panels_y': layout.panels_y,
                'panel_width_mm': layout.panel_width_mm,
                'panel_height_mm': layout.panel_height_mm,
                'total_panels': layout.panels_x * layout.panels_y,
                'confidence': layout.confidence,
                'method': layout.method
            },
            'cost': {
                'total': cost.total_cost,
                'breakdown': cost.breakdown,
                'confidence': cost.confidence
            },
            'aesthetics': {
                'overall_score': aesthetics.overall_score,
                'symmetry_score': aesthetics.symmetry_score,
                'proportion_score': aesthetics.proportion_score,
                'recommendations': aesthetics.recommendations
            },
            'input': {
                'ceiling_length_mm': ceiling_length_mm,
                'ceiling_width_mm': ceiling_width_mm,
                'area_sqm': area_sqm,
                'material_id': material_id
            }
        }


# Demo usage
if __name__ == '__main__':
    inference = MLInference()

    result = inference.full_analysis(
        ceiling_length_mm=6000,
        ceiling_width_mm=5000,
        perimeter_gap_mm=200,
        panel_gap_mm=50,
        material_id='acoustic_panels'
    )

    import json
    print(json.dumps(result, indent=2))
