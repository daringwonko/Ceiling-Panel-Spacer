"""
Analytics module for Ceiling Panel Calculator.

Contains code analysis, predictive analytics,
and energy optimization capabilities.
"""

from .code_analyzer import (
    CodeAnalyzer,
    SecurityAnalyzer,
    CodeQualityReport,
    SecurityIssue,
)

from .predictive_analytics_engine import (
    PredictiveAnalyticsEngine,
    Prediction,
    AnalyticsModel,
)

from .energy_optimization import (
    EnergyOptimizationEngine,
    EnergyProfile,
    OptimizationRecommendation,
)

__all__ = [
    # Code analysis
    'CodeAnalyzer',
    'SecurityAnalyzer',
    'CodeQualityReport',
    'SecurityIssue',
    # Predictive analytics
    'PredictiveAnalyticsEngine',
    'Prediction',
    'AnalyticsModel',
    # Energy optimization
    'EnergyOptimizationEngine',
    'EnergyProfile',
    'OptimizationRecommendation',
]
