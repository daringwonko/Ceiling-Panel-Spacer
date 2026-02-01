"""
API Routes module.
"""

from .calculations import calculations_bp
from .projects import projects_bp
from .materials import materials_bp
from .exports import exports_bp
from .health import health_bp
from .bim import bim_bp
from .kitchen import kitchen_bp
from .llm import llm_bp

__all__ = [
    "calculations_bp",
    "projects_bp",
    "materials_bp",
    "exports_bp",
    "health_bp",
    "bim_bp",
    "kitchen_bp",
    "llm_bp",
]
