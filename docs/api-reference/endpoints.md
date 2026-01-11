# API Reference

Base URL: `http://localhost:5000/api/v1`

## Authentication

All endpoints except `/health` and `/version` require authentication.

### Headers

```
Authorization: Bearer <jwt_token>
# or
X-API-Key: cpk_your_api_key
```

---

## Health & Status

### GET /health
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "2.0.0",
    "uptime_seconds": 3600.5,
    "database": "connected",
    "cache": "connected"
  }
}
```

---

## Calculations

### POST /calculate
Run a panel calculation.

**Request:**
```json
{
  "dimensions": {
    "length_mm": 5000,
    "width_mm": 4000
  },
  "spacing": {
    "perimeter_gap_mm": 200,
    "panel_gap_mm": 50
  },
  "material_id": "standard_tiles",
  "optimization_strategy": "balanced"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "calc_abc123",
    "created_at": "2026-01-11T12:00:00Z",
    "layout": {
      "panel_width_mm": 600,
      "panel_length_mm": 600,
      "panels_per_row": 6,
      "panels_per_column": 7,
      "total_panels": 42,
      "total_coverage_sqm": 15.12,
      "efficiency_percent": 75.6
    },
    "optimization_score": 85.5,
    "execution_time_ms": 45.2
  }
}
```

### GET /calculate/{id}
Get calculation results.

---

## Projects

### POST /projects
Create a new project.

**Request:**
```json
{
  "name": "Conference Room A",
  "description": "Main floor conference room",
  "dimensions": {
    "length_mm": 6000,
    "width_mm": 5000
  },
  "tags": ["floor-1", "conference"]
}
```

### GET /projects
List all projects.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 20)
- `search` (string): Search by name
- `tags` (string): Filter by tags (comma-separated)

### GET /projects/{id}
Get project details.

### PUT /projects/{id}
Update a project.

### DELETE /projects/{id}
Delete a project.

### POST /projects/{id}/calculate
Run calculation for a project.

---

## Materials

### GET /materials
List available materials.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "standard_tiles",
      "name": "Standard Ceiling Tiles",
      "category": "tiles",
      "cost_per_sqm": 15.00,
      "color": "#f5f5f5"
    }
  ]
}
```

### GET /materials/categories
List material categories.

### POST /materials/cost-estimate
Estimate material costs.

**Request:**
```json
{
  "material_id": "acoustic_panels",
  "area_sqm": 20,
  "waste_factor": 1.15
}
```

---

## Exports

### POST /exports/svg
Generate SVG export.

### POST /exports/dxf
Generate DXF export for CAD software.

### POST /exports/3d
Generate 3D model (OBJ, STL, or GLTF).

**Request:**
```json
{
  "calculation_id": "calc_abc123",
  "format": "gltf",
  "options": {
    "include_ceiling": true,
    "panel_thickness_mm": 15
  }
}
```

### GET /exports/{id}
Get export status and download URL.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid dimensions provided",
    "field": "dimensions.length_mm"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

| Plan | Requests/Minute | Requests/Hour |
|------|-----------------|---------------|
| Free | 20 | 200 |
| Pro | 100 | 2000 |
| Enterprise | 500 | 10000 |

Rate limit headers are included in all responses:
```
X-RateLimit-Limit-Minute: 100
X-RateLimit-Remaining-Minute: 95
X-RateLimit-Reset-Minute: 1704978000
```
