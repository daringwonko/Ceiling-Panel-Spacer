"""
Web module for Ceiling Panel Calculator.

Contains the Flask/FastAPI web server and REST API endpoints.
"""

from .gui_server import (
    app,
    create_app,
)

__all__ = [
    'app',
    'create_app',
]
