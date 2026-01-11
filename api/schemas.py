"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class OptimizationStrategy(str, Enum):
    """Optimization strategy options."""
    BALANCED = "balanced"
    MINIMIZE_PANELS = "minimize_panels"
    MINIMIZE_WASTE = "minimize_waste"
    MAXIMIZE_SYMMETRY = "maximize_symmetry"


class ExportFormat(str, Enum):
    """Available export formats."""
    SVG = "svg"
    DXF = "dxf"
    OBJ = "obj"
    STL = "stl"
    GLTF = "gltf"
    JSON = "json"
    PDF = "pdf"


# ============== Request Schemas ==============

class DimensionsInput(BaseModel):
    """Ceiling dimensions input."""
    length_mm: float = Field(..., gt=0, description="Ceiling length in millimeters")
    width_mm: float = Field(..., gt=0, description="Ceiling width in millimeters")

    @validator('length_mm', 'width_mm')
    def validate_dimension(cls, v):
        if v > 100000:  # 100 meters max
            raise ValueError("Dimension cannot exceed 100,000mm (100m)")
        return v


class SpacingInput(BaseModel):
    """Panel spacing input."""
    perimeter_gap_mm: float = Field(200, ge=0, description="Gap around ceiling edge")
    panel_gap_mm: float = Field(50, ge=0, description="Gap between panels")


class ConstraintsInput(BaseModel):
    """Layout constraints."""
    max_panel_width_mm: Optional[float] = Field(None, gt=0, description="Maximum panel width")
    max_panel_length_mm: Optional[float] = Field(None, gt=0, description="Maximum panel length")
    min_panels: Optional[int] = Field(None, ge=1, description="Minimum number of panels")
    target_aspect_ratio: Optional[float] = Field(1.0, gt=0, description="Target panel aspect ratio")


class CalculationRequest(BaseModel):
    """Request schema for panel calculation."""
    dimensions: DimensionsInput
    spacing: SpacingInput = SpacingInput()
    constraints: Optional[ConstraintsInput] = None
    material_id: Optional[str] = None
    optimization_strategy: OptimizationStrategy = OptimizationStrategy.BALANCED

    class Config:
        schema_extra = {
            "example": {
                "dimensions": {"length_mm": 5000, "width_mm": 4000},
                "spacing": {"perimeter_gap_mm": 200, "panel_gap_mm": 50},
                "material_id": "led_panel_white",
                "optimization_strategy": "balanced"
            }
        }


class ProjectRequest(BaseModel):
    """Request schema for creating/updating a project."""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    dimensions: DimensionsInput
    spacing: SpacingInput = SpacingInput()
    material_id: Optional[str] = None
    tags: Optional[List[str]] = []
    metadata: Optional[Dict[str, Any]] = {}


class ExportRequest(BaseModel):
    """Request schema for exporting files."""
    calculation_id: str
    format: ExportFormat
    options: Optional[Dict[str, Any]] = {}

    class Config:
        schema_extra = {
            "example": {
                "calculation_id": "calc_123456",
                "format": "dxf",
                "options": {"include_dimensions": True, "layer_name": "CEILING"}
            }
        }


# ============== Response Schemas ==============

class PanelLayoutOutput(BaseModel):
    """Panel layout output data."""
    panel_width_mm: float
    panel_length_mm: float
    panels_per_row: int
    panels_per_column: int
    total_panels: int
    total_coverage_sqm: float
    gap_area_sqm: float
    efficiency_percent: float


class CalculationResponse(BaseModel):
    """Response schema for calculation results."""
    id: str
    created_at: datetime
    dimensions: DimensionsInput
    spacing: SpacingInput
    layout: PanelLayoutOutput
    material: Optional[Dict[str, Any]] = None
    optimization_score: float = Field(..., ge=0, le=100)
    execution_time_ms: float


class ProjectResponse(BaseModel):
    """Response schema for project data."""
    id: str
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    dimensions: DimensionsInput
    spacing: SpacingInput
    material_id: Optional[str]
    calculation_id: Optional[str]
    tags: List[str]
    owner_id: str


class MaterialResponse(BaseModel):
    """Response schema for material data."""
    id: str
    name: str
    category: str
    color: str
    reflectivity: float
    cost_per_sqm: float
    notes: Optional[str]


class ExportResponse(BaseModel):
    """Response schema for export operations."""
    id: str
    format: ExportFormat
    file_url: str
    file_size_bytes: int
    expires_at: datetime


class ErrorDetail(BaseModel):
    """Error detail structure."""
    code: str
    message: str
    field: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class APIResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None
    meta: Optional[Dict[str, Any]] = None

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "data": {"id": "123", "name": "Project 1"},
                "error": None,
                "meta": {"request_id": "req_abc123"}
            }
        }


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    success: bool = True
    data: List[Any]
    error: Optional[ErrorDetail] = None
    meta: Dict[str, Any] = Field(default_factory=lambda: {
        "page": 1,
        "per_page": 20,
        "total": 0,
        "total_pages": 0
    })


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    uptime_seconds: float
    database: str = "connected"
    cache: str = "connected"
    timestamp: datetime
