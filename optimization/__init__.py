"""
Optimization module for Ceiling Panel Calculator.

Contains various optimization algorithms including:
- Quantum-inspired optimization
- Reinforcement learning optimization
- Emotional design optimization
- Climate scenario modeling
"""

from .quantum_optimizer import (
    QuantumState,
    OptimizationResult,
    QuantumInspiredOptimizer,
    CeilingLayoutOptimizer,
)

from .reinforcement_optimizer import (
    ReinforcementOptimizer,
    QLearningAgent,
    Environment,
)

from .emotional_design_optimizer import (
    EmotionalDesignOptimizer,
    DesignEmotionalImpact,
    EmotionProfile,
)

from .climate_scenario_modeler import (
    ClimateScenarioModeler,
    ClimateResilienceAssessment,
    ClimateScenario,
)

from .qlearning_optimizer import (
    QLearningOptimizer,
)

__all__ = [
    # Quantum optimization
    'QuantumState',
    'OptimizationResult',
    'QuantumInspiredOptimizer',
    'CeilingLayoutOptimizer',
    # Reinforcement learning
    'ReinforcementOptimizer',
    'QLearningAgent',
    'Environment',
    'QLearningOptimizer',
    # Emotional design
    'EmotionalDesignOptimizer',
    'DesignEmotionalImpact',
    'EmotionProfile',
    # Climate modeling
    'ClimateScenarioModeler',
    'ClimateResilienceAssessment',
    'ClimateScenario',
]
