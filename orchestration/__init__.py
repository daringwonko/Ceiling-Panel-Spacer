"""
Orchestration module for Ceiling Panel Calculator.

Contains system orchestration, AI engines,
collaboration, and marketplace integration.
"""

from .system_orchestrator import (
    SystemOrchestrator,
    WorkflowDefinition,
    WorkflowStep,
    ExecutionResult,
)

from .universal_interfaces import (
    UniversalInterface,
    InterfaceAdapter,
    ProtocolHandler,
)

from .collaboration_engine import (
    CollaborationEngine,
    Session,
    Participant,
    ChangeSet,
)

from .marketplace import (
    Marketplace,
    MaterialListing,
    Supplier,
    Order,
)

from .ai_generative_engine import (
    AIGenerativeEngine,
    DesignSuggestion,
    GenerationConfig,
)

from .ai_singularity import (
    AISingularity,
    AdvancedOptimization,
)

from .autonomous_adaptation import (
    AutonomousAdaptationEngine,
    AdaptationStrategy,
    SystemState,
)

__all__ = [
    # Orchestration
    'SystemOrchestrator',
    'WorkflowDefinition',
    'WorkflowStep',
    'ExecutionResult',
    # Interfaces
    'UniversalInterface',
    'InterfaceAdapter',
    'ProtocolHandler',
    # Collaboration
    'CollaborationEngine',
    'Session',
    'Participant',
    'ChangeSet',
    # Marketplace
    'Marketplace',
    'MaterialListing',
    'Supplier',
    'Order',
    # AI Generative
    'AIGenerativeEngine',
    'DesignSuggestion',
    'GenerationConfig',
    # AI Singularity
    'AISingularity',
    'AdvancedOptimization',
    # Autonomous adaptation
    'AutonomousAdaptationEngine',
    'AdaptationStrategy',
    'SystemState',
]
