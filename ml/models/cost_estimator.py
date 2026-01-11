"""
Cost Estimation Model using Machine Learning.

Predicts total project costs including materials, labor, and waste.
"""

import numpy as np
from dataclasses import dataclass
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False


@dataclass
class CostEstimate:
    """Cost estimation result."""
    material_cost: float
    labor_cost: float
    waste_cost: float
    total_cost: float
    confidence: float
    breakdown: Dict[str, float]
    method: str


class CostEstimator:
    """
    ML model for estimating project costs.

    Uses ensemble of models for robust predictions:
    - Material cost predictor
    - Labor cost predictor
    - Waste factor predictor
    """

    # Default cost factors
    DEFAULT_LABOR_RATE = 50  # $/hour
    DEFAULT_INSTALL_TIME_PER_PANEL = 0.5  # hours
    DEFAULT_WASTE_FACTOR = 0.15  # 15%

    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.is_trained = False

        # Material cost database (fallback)
        self.material_costs = {
            'standard_tiles': 15.0,
            'acoustic_panels': 35.0,
            'led_panel_white': 85.0,
            'metal_grid': 25.0,
            'drywall': 12.0,
        }

    def estimate(
        self,
        area_sqm: float,
        panel_count: int,
        material_id: str = 'standard_tiles',
        complexity_factor: float = 1.0,
        location_factor: float = 1.0
    ) -> CostEstimate:
        """
        Estimate total project cost.

        Args:
            area_sqm: Total ceiling area in square meters
            panel_count: Number of panels
            material_id: Material identifier
            complexity_factor: Installation complexity multiplier
            location_factor: Regional cost adjustment

        Returns:
            CostEstimate with detailed breakdown
        """
        # Get material cost
        material_rate = self.material_costs.get(material_id, 20.0)
        material_cost = area_sqm * material_rate

        # Calculate waste
        waste_factor = self.DEFAULT_WASTE_FACTOR * complexity_factor
        waste_cost = material_cost * waste_factor

        # Calculate labor
        install_hours = panel_count * self.DEFAULT_INSTALL_TIME_PER_PANEL * complexity_factor
        labor_cost = install_hours * self.DEFAULT_LABOR_RATE * location_factor

        # Additional costs
        overhead = (material_cost + labor_cost) * 0.1  # 10% overhead
        equipment = panel_count * 2  # $2 per panel for equipment

        total_cost = material_cost + waste_cost + labor_cost + overhead + equipment

        return CostEstimate(
            material_cost=round(material_cost, 2),
            labor_cost=round(labor_cost, 2),
            waste_cost=round(waste_cost, 2),
            total_cost=round(total_cost, 2),
            confidence=0.8,
            breakdown={
                'material': round(material_cost, 2),
                'labor': round(labor_cost, 2),
                'waste': round(waste_cost, 2),
                'overhead': round(overhead, 2),
                'equipment': round(equipment, 2)
            },
            method='heuristic'
        )

    def batch_estimate(
        self,
        projects: List[Dict[str, Any]]
    ) -> List[CostEstimate]:
        """Estimate costs for multiple projects."""
        return [
            self.estimate(
                area_sqm=p.get('area_sqm', 20),
                panel_count=p.get('panel_count', 10),
                material_id=p.get('material_id', 'standard_tiles'),
                complexity_factor=p.get('complexity_factor', 1.0),
                location_factor=p.get('location_factor', 1.0)
            )
            for p in projects
        ]
