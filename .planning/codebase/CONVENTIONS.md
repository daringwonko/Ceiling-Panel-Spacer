# Coding Conventions

**Analysis Date:** 2026-01-31

## Naming Patterns

**Files:**
- Core modules use `snake_case.py` - e.g., `ceiling_panel_calc.py`, `quantum_optimizer.py`
- API routes use plural nouns in `snake_case` - e.g., `calculations.py`, `projects.py`
- Test files use `test_` prefix with `snake_case` - e.g., `test_ceiling_calc.py`, `test_algorithm_correctness.py`
- Module directories use descriptive names: `core/`, `api/`, `tests/`, `optimization/`, `design/`

**Classes:**
- Use `PascalCase` for all classes
- Data transfer objects end with descriptive suffixes:
  - `*Dimensions` (e.g., `CeilingDimensions`, `Dimensions`)
  - `*Spacing` (e.g., `PanelSpacing`, `Gap`)
  - `*Layout` (e.g., `PanelLayout`, `LayoutResult`)
  - `*Generator` (e.g., `DXFGenerator`, `SVGGenerator`)
  - `*Exporter` (e.g., `ProjectExporter`, `MeshExporter`)
  - `*Config` (e.g., `CalculatorConfig`)
  - `*State` (e.g., `QuantumState`)
  - `*Library` (e.g., `MaterialLibrary`)
- Calculator/engine classes: `CeilingPanelCalculator`, `CeilingLayoutOptimizer`

**Functions:**
- Use `snake_case` for all functions and methods
- Private methods use single underscore prefix: `_generate_dxf_manual`
- Validation methods: `validate_*` (e.g., `validate_layout`)
- Getters: `get_*` (e.g., `get_material`, `get_config`, `get_alternate_layouts`)
- Generation methods: `generate_*` (e.g., `generate_dxf`, `generate_svg`, `generate_report`)
- Export methods: `export_*` (e.g., `export_json`)

**Variables:**
- Use `snake_case` for all variables
- Constants at module level use `UPPER_SNAKE_CASE` - e.g., `MATERIALS`
- Class attributes in `DEFAULT_CONFIG` pattern use uppercase keys
- Private instance variables: use descriptive names without underscore prefix

**Type Hints:**
- Function parameters and return types must be annotated
- Common patterns:
  - `-> PanelLayout` for returning data objects
  - `-> bool` for validation methods
  - `-> Optional[Material]` for nullable returns
  - `-> Dict[str, Any]` for flexible dictionary returns
  - `-> List[Tuple[PanelLayout, float]]` for complex collection types

## Code Style

**Formatting:**
- **Tool:** `black` (configured in `requirements.txt`)
- **Indentation:** 4 spaces (no tabs)
- **Line length:** Not explicitly constrained, but keep under 120 characters for readability
- **String quotes:** Double quotes for docstrings, single/double for regular strings

**Linting:**
- **Tools:** `flake8`, `mypy` (configured in `requirements.txt`)
- Type hints are required for public APIs

**Shebang:**
- Scripts that can be run directly include shebang: `#!/usr/bin/env python3`

## Import Organization

**Order (observed pattern):**
1. **Standard library** imports first (no `from __future__`)
2. **Third-party** imports (numpy, flask, pydantic, etc.)
3. **Local application** imports (use `sys.path.insert` when needed)

**Patterns:**
```python
# Standard library
import json
import math
import sys
import os
from dataclasses import dataclass, asdict
from typing import List, Tuple, Dict, Optional, Any
from pathlib import Path
from datetime import datetime
from abc import ABC, abstractmethod
from enum import Enum

# Third-party
import numpy as np
from flask import Flask, Blueprint, request, jsonify
from pydantic import BaseModel, Field, validator
import logging

# Local imports (using sys.path manipulation when cross-module)
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from core.ceiling_panel_calc import CeilingDimensions, PanelSpacing
```

**Wildcard Imports:**
- Allowed in test files: `from ceiling_panel_calc import *`
- Avoid in production code

## Error Handling

**Patterns:**
- **Standard exceptions:** Use built-in Python exceptions (`ValueError`, `FileNotFoundError`, etc.)
- **Custom exceptions:** Not commonly used; prefer descriptive error messages
- **Validation pattern:**
```python
if key not in cls.MATERIALS:
    raise ValueError(f"Unknown material: {key}. Available: {list(cls.MATERIALS.keys())}")
```

**Fallback pattern (when optional dependencies missing):**
```python
try:
    import ezdxf
except ImportError:
    print("ERROR: ezdxf not installed. Install with: pip install ezdxf")
    self._generate_dxf_manual(filename, material)
    return
```

**API error responses follow standard JSON structure:**
```python
return jsonify({
    "success": False,
    "data": None,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": str(e)
    }
}), 400
```

## Logging

**Framework:** Python standard `logging` module

**Pattern:**
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Message")
logger.error("Error: %s", str(e))
```

**Legacy pattern (still present):**
- Some older code uses `print()` for user-facing output
- Print statements with checkmarks: `print(f"✓ DXF saved: {filename}")`

## Comments

**Docstrings:**
- Use triple-quoted docstrings for all modules, classes, and functions
- Format: Google-style with clear Args/Returns sections
- Example:
```python
def calculate_optimal_layout(self, target_aspect_ratio: float = 1.0) -> PanelLayout:
    """
    Calculate optimal panel size given ceiling dimensions and gap constraints.
    
    Args:
        target_aspect_ratio: Panel width/length ratio (1.0 = square)
    
    Returns:
        Optimized PanelLayout
    """
```

**Inline comments:**
- Use `#` for inline explanations
- Group related functionality with visual separators:
```python
# ============================================================================
# MAIN USAGE EXAMPLE
# ============================================================================
```

**Type comments:**
- Prefer type hints over type comments

## Function Design

**Size:**
- Functions should be focused on single responsibility
- Longer functions (50+ lines) should be broken into helper methods

**Parameters:**
- Use dataclasses for grouped parameters (e.g., `CeilingDimensions`, `PanelSpacing`)
- Provide sensible defaults:
```python
def calculate_optimal_layout(self, target_aspect_ratio: float = 1.0) -> PanelLayout:
```

**Return Values:**
- Return dataclass instances or tuples for structured data
- Return `Optional[T]` when failure is expected
- Return `Dict[str, Any]` for flexible JSON-like responses

## Module Design

**Exports:**
- `__init__.py` files expose public API via `from .module import Class`
- Example from `/home/tomas/Ceiling Panel Spacer/api/__init__.py`:
```python
from .app import create_app
from .schemas import *
```

**Barrel Files:**
- Not commonly used
- Prefer explicit imports in consuming code

**Dataclass Pattern:**
```python
@dataclass
class Material:
    """Material/finish specification"""
    name: str
    category: str  # 'lighting', 'acoustic', 'drywall', 'metal', 'custom'
    color: str
    reflectivity: float  # 0.0 to 1.0
    cost_per_sqm: float
    notes: str = ""  # Default value for optional fields
```

## API Patterns

**Blueprint registration (Flask):**
```python
calculations_bp = Blueprint('calculations', __name__, url_prefix='/api/v1')

@calculations_bp.route('/calculate', methods=['POST'])
@rate_limit()
def create_calculation():
    # Implementation
```

**Pydantic schemas:**
```python
class DimensionsInput(BaseModel):
    """Ceiling dimensions input."""
    length_mm: float = Field(..., gt=0, description="Ceiling length in millimeters")
    width_mm: float = Field(..., gt=0, description="Ceiling width in millimeters")
    
    @validator('length_mm', 'width_mm')
    def validate_dimension(cls, v):
        if v > 100000:
            raise ValueError("Dimension cannot exceed 100,000mm (100m)")
        return v
```

## Constants

**Location:**
- Module-level constants at top of file
- Class-level constants use uppercase (e.g., `DEFAULT_CONFIG`)

**Pattern:**
```python
# In ceiling_panel_calc.py
MATERIALS = {
    'led_panel_white': Material(...),
    'acoustic_white': Material(...),
}

# In config_manager.py
class ConfigManager:
    DEFAULT_CONFIG = {
        'ceiling_length_mm': 5000,
        'ceiling_width_mm': 4000,
        'waste_factor': 0.15,
    }
```

## String Formatting

**Pattern:**
- F-strings for simple interpolation: `f"Panel: {width}mm × {length}mm"`
- `.format()` rarely used
- f-strings with format specifiers: `f"{value:.2f}"`, `f"{value:>6.2f}"`

---

*Convention analysis: 2026-01-31*
