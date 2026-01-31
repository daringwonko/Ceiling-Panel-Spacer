"""
Savage Cabinetry Platform

Professional kitchen design and panel calculation platform.
Main entry point for all design operations.
"""

from .kitchen_orchestrator import (
    KitchenDesignOrchestrator,
    DesignParameters,
    DesignResult,
    KitchenDesignException,
    create_default_orchestrator,
)

__version__ = "1.0.0"
__author__ = "Savage Cabinetry Team"
__description__ = "Professional kitchen design and ceiling panel calculation platform"

# Main exports for easy importing
__all__ = [
    "KitchenDesignOrchestrator",
    "DesignParameters",
    "DesignResult",
    "KitchenDesignException",
    "create_default_orchestrator",
]
