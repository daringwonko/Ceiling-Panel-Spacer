# Phase 1: Foundation Repair - Research

**Researched:** 2026-01-31
**Domain:** BuildScale Platform Foundation Layer
**Confidence:** HIGH

## Summary

Phase 1 focuses on fixing critical issues in the existing ceiling panel calculator codebase to create a solid foundation for the BuildScale platform. The research identified the following key findings:

1. **Algorithm Redesign (CRIT-01):** The current efficiency formula prioritizes panel area over practicality, generating single oversized panels. A constraint-based approach with a 2400mm max panel dimension is required.

2. **Input Validation (CRIT-02):** Standard Python dataclasses lack validation. Pydantic dataclasses provide robust validation with clear error messages.

3. **DXF Export (CRIT-03):** Manual DXF fallback is incomplete. Two approaches: require ezdxf dependency (recommended) or implement full DXF structure.

4. **SVG Scaling (CRIT-04):** Hardcoded scale factor needs to be configurable with proper viewBox handling.

5. **JSON Export (CRIT-05):** Simple fix - missing return statement.

6. **Examples (CRIT-06):** Markdown documentation in docstrings needs conversion to executable Python.

7. **Secret Management (CRIT-07):** Hardcoded JWT secret found in `api/middleware/auth.py` needs environment variable loading.

**Primary recommendation:** Use Pydantic for validation, require ezdxf for DXF, use structlog for logging, and implement environment-based secrets via pydantic-settings.

---

## Critical Issue Analysis

### CRIT-01: Core Panel Calculation Algorithm

**Current Problem:**
The algorithm in `CeilingPanelCalculator.calculate_optimal_layout()` (lines 66-116) generates single oversized panels because the efficiency formula prioritizes panel area:

```python
efficiency = (panel_area / (available_length * available_width)) * (1 / (1 + ratio_error))
```

This rewards larger panels with minimal aspect ratio error, ignoring real-world constraints.

**Required Approach:**
| Strategy | Description | Effort |
|----------|-------------|--------|
| Hard Constraint | Add max_panel_dimension parameter (default 2400mm) | Low |
| Practical Heuristic | Start with standard panel sizes, work backward | Medium |
| Multi-strategy | Support minimize_seams, minimize_cuts, balanced modes | Medium |

**Implementation Pattern:**
```python
from dataclasses import dataclass
from typing import Literal

@dataclass
class AlgorithmConfig:
    max_panel_dimension_mm: float = 2400
    optimization_strategy: Literal['balanced', 'minimize_seams', 'minimize_cuts'] = 'balanced'
    preferred_aspect_ratios: list = None  # Default: [1.0, 1.5, 2.0]
    
    def __post_init__(self):
        if self.preferred_aspect_ratios is None:
            self.preferred_aspect_ratios = [1.0, 1.5, 2.0]

def calculate_optimal_layout(
    self, 
    target_aspect_ratio: float = 1.0,
    config: AlgorithmConfig = None
) -> PanelLayout:
    config = config or AlgorithmConfig()
    
    # Validate constraints first
    available_length = self.ceiling.length_mm - (2 * self.spacing.perimeter_gap_mm)
    available_width = self.ceiling.width_mm - (2 * self.spacing.perimeter_gap_mm)
    
    max_panel = config.max_panel_dimension_mm
    
    # Only consider layouts where ALL panels fit constraints
    for panels_length in range(1, 50):
        for panels_width in range(1, 50):
            panel_length = (available_length - (panels_length - 1) * self.spacing.panel_gap_mm) / panels_length
            panel_width = (available_width - (panels_width - 1) * self.spacing.panel_gap_mm) / panels_width
            
            # HARDCONSTRAINT: Panels must fit practical limits
            if panel_length > max_panel or panel_width > max_panel:
                continue
                
            # ... rest of calculation
```

**Pitfalls:**
- **Under-constrained search:** Range of 1-30 panels insufficient for large ceilings
- **Edge case:** Very small ceilings may have no valid solution
- **Performance:** Nested loops can be slow for large ceilings

**Mitigation:**
- Add minimum panel size constraint (e.g., 300mm)
- Pre-check if ceiling can accommodate minimum panels
- Use early termination when valid solution found

**Estimated Effort:** 4-6 hours

---

### CRIT-02: Input Validation

**Current State:**
The codebase uses standard Python `dataclasses` without validation:
```python
@dataclass
class CeilingDimensions:
    length_mm: float  # No validation
    width_mm: float   # No validation
```

**Recommended Approach: Pydantic Dataclasses**

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| pydantic | 2.x | Data validation | Built-in validation, type coercion, clear errors |
| pydantic-settings | 2.x | Environment config | Integrates with .env files |

**Implementation Pattern:**
```python
from pydantic import field_validator, ValidationError
from pydantic.dataclasses import dataclass

@dataclass
class CeilingDimensions:
    length_mm: float
    width_mm: float
    
    @field_validator('length_mm', 'width_mm')
    @classmethod
    def validate_dimension(cls, v: float) -> float:
        if v <= 0:
            raise ValueError(f'Dimension must be positive, got {v}')
        if v > 50000:  # 50m max
            raise ValueError(f'Dimension exceeds maximum (50m), got {v}m')
        return float(v)

@dataclass
class PanelSpacing:
    perimeter_gap_mm: float
    panel_gap_mm: float
    
    @field_validator('perimeter_gap_mm', 'panel_gap_mm')
    @classmethod
    def validate_gap(cls, v: float) -> float:
        if v < 0:
            raise ValueError(f'Gap cannot be negative, got {v}mm')
        if v > 1000:  # 1m max gap
            raise ValueError(f'Gap exceeds maximum (1m), got {v}mm')
        return float(v)
```

**Error Message Pattern:**
```python
try:
    ceiling = CeilingDimensions(length_mm=-100, width_mm=5000)
except ValidationError as e:
    print(e)
    # Output:
    # 1 validation error for CeilingDimensions
    # length_mm
    #   Value error, Dimension must be positive, got -100.0
```

**Alternative: Standard Library with Manual Validation**
If Pydantic dependency is unwanted:
```python
@dataclass
class CeilingDimensions:
    length_mm: float
    width_mm: float
    
    def __post_init__(self):
        if self.length_mm <= 0:
            raise ValueError(f"length_mm must be positive, got {self.length_mm}")
        if self.width_mm <= 0:
            raise ValueError(f"width_mm must be positive, got {self.width_mm}")
        if self.length_mm > 50000:
            raise ValueError(f"length_mm exceeds maximum (50000mm), got {self.length_mm}")
```

**Pitfalls:**
- **Type coercion:** Pydantic coerces types (string "5" → int 5) which may be unexpected
- **Validation order:** Cross-field validation needs model_validator (Pydantic 2.x)
- **Breaking change:** Existing code may pass strings instead of floats

**Mitigation:**
- Document type expectations clearly
- Use Pydantic's strict mode if type coercion is unwanted
- Add gradual migration path

**Estimated Effort:** 2-3 hours

---

### CRIT-03: DXF Export

**Current Problem:**
The manual DXF fallback (`_generate_dxf_manual()`) produces incomplete files that may not open in AutoCAD/Revit.

**DXF File Structure Requirements (per Autodesk DXF Reference):**

| Section | Required | Content |
|---------|----------|---------|
| HEADER | Yes | $ACADVER, $INSBASE, $EXTMIN, $EXTMAX, etc. |
| CLASSES | Yes | Class definitions for custom entities |
| TABLES | Yes | LAYER, LTYPE, STYLE, VIEW, etc. |
| BLOCKS | Yes | Block definitions |
| ENTITIES | Yes | Drawing entities (lines, polylines, text) |
| OBJECTS | Yes | Dictionary objects |

**Recommended Approach: Require ezdxf**

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **Require ezdxf** | Full CAD compatibility, easier maintenance | External dependency | 30 min |
| Implement manual DXF | No external dependency | Complex, error-prone, 4-6 hours | 4-6 hours |

**ezdxf Implementation Pattern:**
```python
import ezdxf
from ezdxf.math import Vec2

def generate_dxf(self, filename: str, material: Optional[Material] = None):
    """Generate DXF with proper structure."""
    doc = ezdxf.new(dxfversion='R2010')
    
    # Create layers
    doc.layers.add('CEILING', color=7)      # White
    doc.layers.add('PANELS', color=1)       # Red
    doc.layers.add('GAP', color=2)          # Yellow
    doc.layers.add('TEXT', color=3)         # Green
    
    msp = doc.modelspace()
    msp.layer = 'CEILING'
    
    # Draw ceiling boundary
    msp.add_lwpolyline([
        (0, 0),
        (self.ceiling.length_mm, 0),
        (self.ceiling.length_mm, self.ceiling.width_mm),
        (0, self.ceiling.width_mm),
        (0, 0)
    ], close=True, dxfattribs={'layer': 'CEILING'})
    
    # Draw panels with layer assignment
    for row in range(self.layout.panels_per_column):
        for col in range(self.layout.panels_per_row):
            x = start_x + col * (self.layout.panel_width_mm + self.spacing.panel_gap_mm)
            y = start_y + row * (self.layout.panel_length_mm + self.spacing.panel_gap_mm)
            
            msp.add_lwpolyline([
                (x, y),
                (x + self.layout.panel_width_mm, y),
                (x + self.layout.panel_width_mm, y + self.layout.panel_length_mm),
                (x, y + self.layout.panel_length_mm),
                (x, y)
            ], close=True, dxfattribs={'layer': 'PANELS'})
    
    doc.saveas(filename)
```

**If Manual DXF Required (not recommended):**
Minimum viable DXF structure:
```python
def _generate_dxf_manual(self, filename: str):
    """Minimum DXF structure for CAD compatibility."""
    content = []
    
    # HEADER section (REQUIRED)
    content.extend([
        "0",
        "SECTION",
        "2",
        "HEADER",
        "9",
        "$ACADVER",
        "1",
        "AC1024",  # AutoCAD 2010
        "9",
        "$INSBASE",
        "10",
        "0",
        "20",
        "0",
        "9",
        "$EXTMIN",
        "10",
        "0",
        "20",
        "0",
        "9",
        "$EXTMAX",
        "10",
        str(self.ceiling.length_mm),
        "20",
        str(self.ceiling.width_mm),
        "0",
        "ENDSEC",
    ])
    
    # TABLES section (REQUIRED - at minimum LAYER table)
    content.extend([
        "0",
        "SECTION",
        "2",
        "TABLES",
        "0",
        "TABLE",
        "2",
        "LAYER",
        "70",
        "1",
        "0",
        "LAYER",
        "70",
        "0",
        "2",
        "0",
        "62",
        "7",
        "6",
        "CONTINUOUS",
        "0",
        "ENDTAB",
        "0",
        "ENDSEC",
    ])
    
    # ENTITIES section (REQUIRED)
    content.extend([
        "0",
        "SECTION",
        "2",
        "ENTITIES",
    ])
    
    # Add entities here...
    
    content.extend([
        "0",
        "ENDSEC",
        "0",
        "EOF"
    ])
    
    with open(filename, 'w') as f:
        f.write('\n'.join(content))
```

**Pitfalls:**
- **Version compatibility:** Different AutoCAD versions support different DXF features
- **Layer colors:** Color numbers 1-255 follow AutoCAD color index
- **Units:** DXF defaults to unitless - add DIMSTYLE for proper dimensioning

**Mitigation:**
- Use ezdxf for production (handles compatibility)
- Test with target CAD versions (AutoCAD 2020+, Revit 2020+)
- Document tested versions

**Estimated Effort:** 
- With ezdxf: 30 minutes
- Manual implementation: 4-6 hours

---

### CRIT-04: SVG Export Scaling

**Current Problem:**
Hardcoded scale factor (0.5) in `SVGGenerator.__init__()`:
```python
self.scale = 0.5  # mm to px conversion (adjust for your screen)
```

**Best Practices for SVG Scaling:**

| Practice | Implementation |
|----------|----------------|
| Use viewBox | Define coordinate system independent of display size |
| Make scale configurable | Allow users to specify output target (screen, print) |
| Support preserveAspectRatio | Control how SVG scales within container |
| Use mm units | Set width/height in mm for print compatibility |

**Implementation Pattern:**
```python
@dataclass
class SVGConfig:
    scale: float = 0.5  # mm to pixels for screen (96 DPI)
    target: Literal['screen', 'print', 'high_res'] = 'screen'
    
    def __post_init__(self):
        # Auto-set scale based on target
        scale_map = {
            'screen': 0.5,      # 96 DPI screen
            'print': 0.352,     # 72 DPI print (1mm = 0.352px)
            'high_res': 0.705,  # 144 DPI high-res
        }
        if self.target != 'screen':
            self.scale = scale_map.get(self.target, 0.5)

class SVGGenerator:
    def __init__(
        self, 
        ceiling: CeilingDimensions, 
        spacing: PanelSpacing, 
        layout: PanelLayout,
        config: SVGConfig = None
    ):
        self.ceiling = ceiling
        self.spacing = spacing
        self.layout = layout
        self.config = config or SVGConfig()
    
    def generate_svg(self, filename: str, material: Optional[Material] = None):
        """Generate SVG with proper scaling."""
        # Calculate dimensions in pixels
        width_px = self.ceiling.length_mm * self.config.scale
        height_px = self.ceiling.width_mm * self.config.scale
        
        # Use viewBox for scalability
        svg_lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            f'<svg width="{width_px}px" height="{height_px}px"',
            f'viewBox="0 0 {width_px} {height_px}"',
            'xmlns="http://www.w3.org/2000/svg">',
            # ... rest of SVG generation
        ]
```

**Alternative: Pure mm-based SVG (print-friendly):**
```python
def generate_print_svg(self, filename: str):
    """Generate SVG with mm dimensions for print."""
    svg_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg width="{self.ceiling.length_mm}mm" height="{self.ceiling.width_mm}mm"',
        f'viewBox="0 0 {self.ceiling.length_mm} {self.ceiling.width_mm}"',
        'xmlns="http://www.w3.org/2000/svg">',
        # Elements use mm coordinates directly
    ]
```

**Pitfalls:**
- **Font scaling:** Text may become unreadable at low resolutions
- **Line weights:** Stroke width may need scaling separately
- **Browser rendering:** SVG rendering varies by browser

**Mitigation:**
- Use vector-friendly stroke widths
- Test at multiple scales
- Provide both pixel and print-optimized outputs

**Estimated Effort:** 1-2 hours

---

### CRIT-05: JSON Export Return Value

**Current Problem:**
`ProjectExporter.export_json()` method (lines 471-502) doesn't return the project data dictionary.

**Fix:**
```python
def export_json(self, filename: str) -> Dict[str, Any]:
    """Export project as JSON for further processing."""
    project_data = {
        'metadata': {...},
        'ceiling': {...},
        'spacing': {...},
        'layout': self.layout.to_dict(),
        'material': {...}
    }
    
    with open(filename, 'w') as f:
        json.dump(project_data, f, indent=2)
    
    print(f"✓ JSON export saved: {filename}")
    
    # ADD THIS LINE
    return project_data
```

**Estimated Effort:** 5 minutes

---

### CRIT-06: Executable Examples

**Current Problem:**
`examples/examples.py` contains markdown documentation in docstrings, not valid Python.

**Implementation Pattern:**
```python
#!/usr/bin/env python3
"""
Ceiling Panel Calculator - Practical Examples

This module contains executable examples demonstrating how to use
the Ceiling Panel Calculator for various construction scenarios.

Usage:
    python examples.py                    # Run all examples
    python examples.py --example 1        # Run specific example
    python examples.py --interactive      # Interactive mode
"""

import sys
from pathlib import Path

from core.ceiling_panel_calc import (
    CeilingDimensions,
    PanelSpacing,
    CeilingPanelCalculator,
    MaterialLibrary,
    DXFGenerator,
    SVGGenerator,
    ProjectExporter,
)


def example_1_basic_calculation():
    """Example 1: Basic ceiling panel layout calculation."""
    print("\n" + "=" * 60)
    print("EXAMPLE 1: Basic Calculation")
    print("=" * 60)
    
    # Define ceiling dimensions
    ceiling = CeilingDimensions(
        length_mm=6000,  # 6 meters
        width_mm=4500    # 4.5 meters
    )
    
    # Define spacing requirements
    spacing = PanelSpacing(
        perimeter_gap_mm=200,  # 200mm edge gap for services
        panel_gap_mm=200       # 200mm between panels
    )
    
    print(f"Ceiling: {ceiling.length_mm}mm × {ceiling.width_mm}mm")
    print(f"Spacing: {spacing.perimeter_gap_mm}mm perimeter, {spacing.panel_gap_mm}mm between panels")
    
    # Calculate optimal layout
    calculator = CeilingPanelCalculator(ceiling, spacing)
    layout = calculator.calculate_optimal_layout(target_aspect_ratio=1.0)
    
    print(f"\nResult:")
    print(f"  Panel size: {layout.panel_width_mm:.1f}mm × {layout.panel_length_mm:.1f}mm")
    print(f"  Layout: {layout.panels_per_row}×{layout.panels_per_column} = {layout.total_panels} panels")
    print(f"  Coverage: {layout.total_coverage_sqm:.2f} m²")


def example_2_comparing_gaps():
    """Example 2: Comparing different gap sizes."""
    # ... implementation


def example_3_batch_rooms():
    """Example 3: Generate layouts for multiple rooms."""
    # ... implementation


def main():
    """Main entry point for examples."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Ceiling Panel Calculator - Examples"
    )
    parser.add_argument(
        '--example', '-e',
        type=int,
        choices=[1, 2, 3, 4, 5, 6, 7],
        help="Run a specific example (1-7)"
    )
    parser.add_argument(
        '--interactive', '-i',
        action='store_true',
        help="Run in interactive mode"
    )
    
    args = parser.parse_args()
    
    if args.example:
        globals()[f'example_{args.example}']()
    elif args.interactive:
        example_interactive()
    else:
        # Run all examples
        for i in range(1, 8):
            try:
                globals()[f'example_{i}']()
            except NameError:
                pass


if __name__ == '__main__':
    main()
```

**Estimated Effort:** 2-3 hours

---

### CRIT-07: Secret Management

**Current Problem:**
Hardcoded JWT secret in `api/middleware/auth.py` (line 14):
```python
JWT_SECRET = os.getenv("JWT_SECRET", "ceiling-panel-calculator-secret-key-change-in-production")
```

**Recommended Approach: pydantic-settings with .env**

| Tool | Purpose | Why Standard |
|------|---------|--------------|
| pydantic-settings | Environment variable loading | Type validation, defaults, coercion |
| python-dotenv | .env file support | Development convenience |

**Implementation Pattern:**

1. Create `.env.example`:
```bash
# Copy this to .env and fill in your values
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
DATABASE_URL=postgresql://localhost/buildscale
SECRET_KEY=another-secret-for-encryption
```

2. Create config module:
```python
# core/config.py
import os
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment."""
    
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        extra='ignore'
    )
    
    # JWT settings
    jwt_secret: SecretStr
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # Other secrets
    database_url: str = "sqlite:///./buildscale.db"
    secret_key: SecretStr
    
    # Non-secret settings
    debug: bool = False
    log_level: str = "INFO"


# Global settings instance
settings = Settings()
```

3. Update auth middleware:
```python
from core.config import settings

# Use settings.jwt_secret.get_secret_value()
def create_token(user: User) -> str:
    payload = {...}
    return jwt.encode(
        payload, 
        settings.jwt_secret.get_secret_value(), 
        algorithm=settings.jwt_algorithm
    )
```

4. Create `.gitignore`:
```gitignore
# Secrets
.env
.env.local
*.pem
*.key

# IDE
.idea/
.vscode/

# Python
__pycache__/
*.py[cod]
*.so
.Python
venv/
env/
ENV/
```

**Pitfalls:**
- **Environment precedence:** CLI args should override env vars
- **Secret exposure:** Logs may print secrets accidentally
- **Missing values:** App should fail fast if required secrets missing

**Mitigation:**
- Use SecretStr type to prevent accidental logging
- Validate required settings at startup
- Document all required environment variables

**Estimated Effort:** 2-3 hours

---

## Foundation Layer Improvements

### FOUND-02: Unified Error Handling

**Recommended Approach: Custom Exceptions with structlog**

```python
# core/exceptions.py
from typing import Optional

class BuildScaleError(Exception):
    """Base exception for BuildScale errors."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class CalculationError(BuildScaleError):
    """Raised when panel calculation fails."""
    pass


class ValidationError(BuildScaleError):
    """Raised when input validation fails."""
    pass


class ExportError(BuildScaleError):
    """Raised when file export fails."""
    pass


class ConfigurationError(BuildScaleError):
    """Raised when configuration is invalid."""
    pass
```

### FOUND-03: Structured Logging

**Recommended Tool: structlog**

```python
# core/logging.py
import structlog
import logging

def setup_logging(log_level: str = "INFO"):
    """Configure structured logging."""
    timestamper = structlog.processors.TimeStamper(fmt="iso")
    
    shared_processors = [
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        timestamper,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]
    
    if logging.getLogger().handlers:
        # Already configured
        return
    
    structlog.configure(
        processors=shared_processors + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            structlog.dev.ConsoleRenderer(),
        ],
    )
    
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    
    root = logging.getLogger()
    root.addHandler(handler)
    root.setLevel(log_level.upper())
```

**Usage:**
```python
import structlog

logger = structlog.get_logger(__name__)

# Info with context
logger.info("Calculation started", ceiling_area=24.5, panel_count=12)

# Error with exception
try:
    result = calculate_layout(ceiling, spacing)
except Exception as e:
    logger.error("Calculation failed", error=str(e), exc_info=True)
```

**Estimated Effort:** 2-3 hours (logging + error handling)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data validation | Manual if/raise checks | Pydantic | Type coercion, clear errors, maintainable |
| DXF generation | Manual file writing | ezdxf | CAD compatibility, maintenance |
| Settings loading | os.getenv everywhere | pydantic-settings | Validation, typing, env file support |
| JSON export | Custom string formatting | json module + dataclasses | Correctness, readability |
| Logging | print() statements | structlog | Structured logs, debugging, production |

---

## Common Pitfalls Summary

| Pitfall | What Goes Wrong | How to Avoid |
|---------|-----------------|--------------|
| Algorithm edge cases | Empty result for impossible layouts | Add minimum size validation, raise clear error |
| DXF version mismatch | Files don't open in older AutoCAD | Use ezdxf with R2010 (widely compatible) |
| SVG text scaling | Text unreadable at low resolution | Use viewBox, test multiple scales |
| Secret in logs | Sensitive data exposed | Use SecretStr type, sanitize logs |
| Validation errors | Confusing error messages | Use Pydantic with field-specific messages |
| Environment override | CLI args don't override env vars | Use proper precedence (CLI > env > default) |

---

## Effort Summary

| Issue | Effort | Priority |
|-------|--------|----------|
| CRIT-01: Algorithm redesign | 4-6 hours | CRITICAL |
| CRIT-02: Input validation | 2-3 hours | HIGH |
| CRIT-03: DXF export | 30 min (ezdxf) / 4-6h (manual) | HIGH |
| CRIT-04: SVG scaling | 1-2 hours | MEDIUM |
| CRIT-05: JSON return | 5 min | LOW |
| CRIT-06: Examples | 2-3 hours | MEDIUM |
| CRIT-07: Secret management | 2-3 hours | HIGH |
| FOUND-02/03: Logging/Errors | 2-3 hours | MEDIUM |

**Total Estimated Effort:** 14-21 hours (3-5 days)

---

## Sources

### Primary (HIGH confidence)

- **Pydantic Settings:** https://docs.pydantic.dev/latest/concepts/pydantic_settings/ - Official documentation for environment-based configuration
- **structlog Documentation:** https://www.structlog.org/en/stable/ - Official structured logging for Python
- **Autodesk DXF Reference:** https://images.autodesk.com/adsk/files/autocad_2012_pdf_dxf-reference_enu.pdf - Official DXF format specification

### Secondary (MEDIUM confidence)

- **SVG viewBox Best Practices:** https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox - MDN documentation
- **Python Logging Best Practices:** https://www.signoz.io/guides/python-logging-best-practices/ - Industry guidance on logging patterns

### Tertiary (LOW confidence)

- **DXF Implementation Guides:** Various community resources for manual DXF generation (not recommended for production)

---

## Open Questions

1. **Algorithm Strategy:** Should the optimization prioritize panel count, panel size, or waste? Recommend "balanced" with user-configurable strategy.

2. **DXF Fallback:** Is ezdxf as a required dependency acceptable, or must a manual fallback work without it?

3. **Pydantic Adoption:** Is adding Pydantic dependency acceptable, or should validation use standard library only?

4. **Secret Storage:** Beyond environment variables, should secrets be loaded from a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault) for production?

---

## Research Metadata

**Confidence breakdown:**
- Algorithm redesign: HIGH - Well-defined problem with clear solutions
- Input validation: HIGH - Pydantic is industry standard
- DXF export: HIGH - ezdxf is proven library
- SVG scaling: HIGH - Standard SVG practices
- Secret management: HIGH - pydantic-settings is standard approach
- Logging: HIGH - structlog is well-documented

**Research date:** 2026-01-31
**Valid until:** 2026-04-30 (6 months for stable tools)
