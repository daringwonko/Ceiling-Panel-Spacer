# Kitchen Backend API Documentation

## Overview

The `Savage_Cabinetry_Platform/kitchen_orchestrator.py` file provides a centralized orchestration system for kitchen design operations, integrating ceiling panel calculations, material handling, and design workflows.

## Core Components

### 1. Data Classes

#### DesignParameters
Input parameters for kitchen design calculations:

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `ceiling_width_mm` | int | - | Width of ceiling in millimeters |
| `ceiling_length_mm` | int | - | Length of ceiling in millimeters |
| `material_type` | str | `"standard_tiles"` | Material selection |
| `gap_edge_mm` | int | 200 | Edge gap from walls |
| `gap_spacing_mm` | int | 50 | Spacing between panels |
| `max_panel_width_mm` | int | 2400 | Maximum panel width constraint |
| `max_panel_length_mm` | int | 2400 | Maximum panel length constraint |

#### DesignResult
Complete design calculation results:

| Attribute | Type | Description |
|-----------|------|-------------|
| `panels_count` | int | Total number of panels required |
| `panel_dimensions` | List[Dict] | Individual panel dimensions |
| `total_area_sqm` | float | Total coverage area in square meters |
| `estimated_cost` | float | Material cost estimate |
| `material_info` | Dict | Material properties and pricing |
| `warnings` | List[str] | Practical installation warnings |

### 2. Exception Classes

```python
class KitchenDesignException(Exception)
```
Custom exception for design-related errors.

### 3. KitchenDesignOrchestrator

Main orchestrator class coordinating all kitchen design operations.

#### Constructor
```python
def __init__(self, config: Optional[Dict] = None) -> None
```

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `validate_design_parameters(params)` | `List[str]` | Validates input parameters |
| `calculate_ceiling_panels(params)` | `DesignResult` | Calculates panel layout |
| `generate_panel_layout(params, result, format_type)` | `str` | Generates output in specified format |
| `export_design(params, result, formats, output_dir)` | `Dict[str, str]` | Exports in multiple formats |
| `get_cost_estimate(params)` | `Dict` | Quick cost estimation |

#### Supported Formats
- `json` - Structured JSON output
- `text` - Human-readable report
- `dxf` - CAD file format (placeholder)
- `svg` - Scalable vector graphics (placeholder)

## Usage Example

```python
from Savage_Cabinetry_Platform.kitchen_orchestrator import (
    KitchenDesignOrchestrator,
    DesignParameters
)

orchestrator = KitchenDesignOrchestrator()

params = DesignParameters(
    ceiling_width_mm=4000,
    ceiling_length_mm=5000,
    material_type="acoustic_panels",
    gap_edge_mm=200
)

issues = orchestrator.validate_design_parameters(params)
if issues:
    print(f"Validation issues: {issues}")
else:
    result = orchestrator.calculate_ceiling_panels(params)
    layout = orchestrator.generate_panel_layout(params, result, "json")
```

## Material Definitions

| Material Type | Name | Cost/sqm | Thickness | Weight/sqm |
|---------------|------|----------|-----------|------------|
| `standard_tiles` | Standard Ceiling Tiles | $25.00 | 15mm | 8.5kg |
| `acoustic_panels` | Acoustic Panels | $45.00 | 25mm | 12.0kg |

## Validation Rules

1. Ceiling dimensions must be positive
2. Edge/spacing gaps cannot be negative
3. Material type must be recognized
4. Edge gap must not exceed ceiling dimensions
5. Available area must be > 0 after gap subtraction

## Cost Calculation

Base cost formula:
```
total_cost = (ceiling_area - 2*edge_gap)^2 * material_cost_per_sqm * 1.15
```
(15% waste allowance included)

## Output Format Examples

### JSON Output Structure
```json
{
  "design_parameters": {...},
  "calculation_results": {
    "panels_count": 6,
    "panel_dimensions": [...],
    "total_area_sqm": 18.5,
    "estimated_cost": 462.50,
    "material_info": {...},
    "warnings": []
  },
  "timestamp": "2026-02-01T00:00:00Z",
  "platform": "Savage Cabinetry Platform v1.0"
}
```

## Integration Notes

- DXF/SVG generation are placeholders for existing ceiling_panel_calc.py integration
- Material definitions are hardcoded (expandable via config)
- 2400mm max panel dimension aligns with transportation constraints
- 15% waste factor applied to cost estimates