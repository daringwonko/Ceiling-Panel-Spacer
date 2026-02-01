# Kitchen Backend API Documentation

## 1. KitchenDesignOrchestrator Methods

| Method | Description | Visibility |
|--------|-------------|------------|
| `__init__(config)` | Initialize orchestrator with optional config dict | Public |
| `validate_design_parameters(params)` | Validate DesignParameters, return list of error messages | Public |
| `calculate_ceiling_panels(params)` | Calculate panel layout, returns DesignResult | Public |
| `generate_panel_layout(params, result, format_type)` | Generate layout in json/text/dxf/svg format | Public |
| `export_design(params, result, formats, output_dir)` | Export design in multiple formats, returns file paths | Public |
| `get_cost_estimate(params)` | Quick cost estimate without full calculation | Public |
| `_generate_json_layout(params, result)` | Generate JSON output | Private |
| `_generate_text_layout(params, result)` | Generate text report | Private |
| `_generate_dxf_layout(params, result)` | Generate DXF (placeholder) | Private |
| `_generate_svg_layout(params, result)` | Generate SVG (placeholder) | Private |

---

## 2. calculate_ceiling_panels() Inputs

```python
def calculate_ceiling_panels(params: DesignParameters) -> DesignResult
```

### DesignParameters Dataclass

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `ceiling_width_mm` | int | Yes | - | Ceiling width in millimeters |
| `ceiling_length_mm` | int | Yes | - | Ceiling length in millimeters |
| `material_type` | str | No | `"standard_tiles"` | Material selection key |
| `gap_edge_mm` | int | No | `200` | Perimeter edge gap in mm |
| `gap_spacing_mm` | int | No | `50` | Panel spacing gap in mm |
| `max_panel_width_mm` | int | No | `2400` | Max panel width constraint (mm) |
| `max_panel_length_mm` | int | No | `2400` | Max panel length constraint (mm) |

---

## 3. calculate_ceiling_panels() Outputs

### DesignResult Dataclass

| Field | Type | Description |
|-------|------|-------------|
| `panels_count` | int | Total number of panels required |
| `panel_dimensions` | List[Dict] | List of panel configs with width_mm, length_mm, area_sqm |
| `total_area_sqm` | float | Total coverage area in square meters |
| `estimated_cost` | float | Material cost estimate in currency units |
| `material_info` | Dict | Material details (name, cost_per_sqm, thickness_mm, weight_kg_per_sqm) |
| `warnings` | List[str] | Installation/logistics warnings |

### Example Response

```json
{
  "panels_count": 12,
  "panel_dimensions": [
    {"width_mm": 800, "length_mm": 1200, "area_sqm": 0.96}
  ],
  "total_area_sqm": 11.52,
  "estimated_cost": 288.00,
  "material_info": {
    "name": "Standard Ceiling Tiles",
    "cost_per_sqm": 25.0,
    "thickness_mm": 15,
    "weight_kg_per_sqm": 8.5
  },
  "warnings": []
}
```

---

## 4. API Endpoints

### Base URL: `/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/calculate/ceiling` | Calculate ceiling panel layout |
| POST | `/validate` | Validate design parameters |
| POST | `/generate-layout` | Generate layout in specified format |
| POST | `/export` | Export design in multiple formats |
| GET | `/cost-estimate` | Quick cost estimate |
| GET | `/materials` | List available materials |

### Endpoint Details

#### POST /calculate/ceiling

**Request Body:**
```json
{
  "ceiling_width_mm": 4000,
  "ceiling_length_mm": 6000,
  "material_type": "standard_tiles",
  "gap_edge_mm": 200,
  "gap_spacing_mm": 50
}
```

**Response:** `DesignResult` JSON (see Section 3)

#### POST /validate

**Request Body:** `DesignParameters`

**Response:**
```json
{
  "valid": true,
  "issues": []
}
```

#### POST /generate-layout

**Request Body:**
```json
{
  "design_params": {...},
  "calculation_result": {...},
  "format": "json"
}
```

**Response:** Formatted layout string or file path

#### POST /export

**Request Body:**
```json
{
  "design_params": {...},
  "calculation_result": {...},
  "formats": ["json", "dxf", "svg"],
  "output_dir": "./exports"
}
```

**Response:**
```json
{
  "json": "./exports/kitchen_design.json",
  "dxf": "./exports/kitchen_design.dxf",
  "svg": "./exports/kitchen_design.svg"
}
```

---

## 5. Validation Requirements

### DesignParameters Validation

| Condition | Error Message |
|-----------|---------------|
| `ceiling_width_mm <= 0` | "Ceiling width must be positive" |
| `ceiling_length_mm <= 0` | "Ceiling length must be positive" |
| `gap_edge_mm < 0` | "Edge gap cannot be negative" |
| `gap_spacing_mm < 0` | "Spacing gap cannot be negative" |
| `material_type not in materials` | "Unknown material type: {material_type}" |
| `available_width <= 0` | "Edge gap {gap}mm too large for width {width}mm" |
| `available_length <= 0` | "Edge gap {gap}mm too large for length {length}mm" |

### Input Constraints (Hard Limits)

| Parameter | Min | Max |
|-----------|-----|-----|
| Ceiling dimension | > 0 | 50,000mm (50m) |
| Panel dimension | 100mm | 2,400mm |
| Edge gap | 0mm | - |
| Panel count | 1 | 100 |

### Warnings Generated

- Single large panel: "Single large panel - may be impractical for installation"
- Oversized panel: "Panel dimensions exceed 2400mm - transportation may be difficult"

---

## 6. Material Types

| Key | Name | Cost/sqm | Thickness | Weight/sqm |
|-----|------|----------|-----------|------------|
| `standard_tiles` | Standard Ceiling Tiles | $25.00 | 15mm | 8.5kg |
| `acoustic_panels` | Acoustic Panels | $45.00 | 25mm | 12.0kg |