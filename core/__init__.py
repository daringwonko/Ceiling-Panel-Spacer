"""
Core module for Ceiling Panel Calculator.

Contains the fundamental calculation engine, configuration management,
and logging infrastructure.
"""

from .ceiling_panel_calc import (
    CeilingDimensions,
    PanelSpacing,
    Material,
    PanelLayout,
    CeilingPanelCalculator,
    SVGGenerator,
    DXFGenerator,
    ProjectExporter,
    MaterialLibrary,
)

from .config_manager import (
    ConfigManager,
    CalculatorConfig,
)

from .logging_config import (
    get_logger,
    configure_logging,
    CeilingCalculatorError,
    ValidationError,
    ConfigurationError,
)

__all__ = [
    # Core calculation
    "CeilingDimensions",
    "PanelSpacing",
    "Material",
    "PanelLayout",
    "CeilingPanelCalculator",
    # Generators
    "SVGGenerator",
    "DXFGenerator",
    "ProjectExporter",
    # Materials
    "MaterialLibrary",
    # Configuration
    "ConfigManager",
    "CalculatorConfig",
    # Logging
    "get_logger",
    "configure_logging",
    "CeilingCalculatorError",
    "ValidationError",
    "ConfigurationError",
]
