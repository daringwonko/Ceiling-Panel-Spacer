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

    @validator("length_mm", "width_mm")
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

    max_panel_width_mm: Optional[float] = Field(
        None, gt=0, description="Maximum panel width"
    )
    max_panel_length_mm: Optional[float] = Field(
        None, gt=0, description="Maximum panel length"
    )
    min_panels: Optional[int] = Field(
        None, ge=1, description="Minimum number of panels"
    )
    target_aspect_ratio: Optional[float] = Field(
        1.0, gt=0, description="Target panel aspect ratio"
    )


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
                "optimization_strategy": "balanced",
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
                "options": {"include_dimensions": True, "layer_name": "CEILING"},
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
                "meta": {"request_id": "req_abc123"},
            }
        }


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""

    success: bool = True
    data: List[Any]
    error: Optional[ErrorDetail] = None
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {
            "page": 1,
            "per_page": 20,
            "total": 0,
            "total_pages": 0,
        }
    )


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str
    uptime_seconds: float
    database: str = "connected"
    cache: str = "connected"
    timestamp: datetime


# ============== Schedule Schemas ==============


class ScheduleType(str, Enum):
    """Schedule type enumeration."""

    DOOR = "door"
    WINDOW = "window"
    MATERIAL = "material"
    CUSTOM = "custom"


class ScheduleColumn(BaseModel):
    """Column definition for a schedule table."""

    key: str
    header: str
    width: int = 100
    accessor: Optional[str] = None
    format: Optional[str] = None


class ScheduleFilter(BaseModel):
    """Filter definition for schedule data."""

    key: str
    operator: str = "equals"
    value: Any


class ScheduleSort(BaseModel):
    """Sort definition for schedule data."""

    key: str
    direction: str = "asc"


class ScheduleDefinition(BaseModel):
    """Schedule definition interface."""

    id: str
    name: str
    type: ScheduleType
    columns: List[ScheduleColumn]
    description: Optional[str] = None
    filters: Optional[List[ScheduleFilter]] = None
    default_sort: Optional[ScheduleSort] = None

    class Config:
        fields = {"default_sort": "defaultSort"}


class ScheduleRow(BaseModel):
    """Row data for a schedule table."""

    id: str
    object_id: str
    count: int = 1
    type: str
    dimensions: str = ""
    material: str = "-"
    properties: Dict[str, Any] = {}

    class Config:
        fields = {"object_id": "objectId"}


class ScheduleSummary(BaseModel):
    """Summary statistics for a schedule."""

    total_items: int = 0
    total_area: Optional[float] = None
    total_volume: Optional[float] = None
    by_type: Dict[str, int] = {}

    class Config:
        fields = {"total_items": "totalItems", "by_type": "byType"}


class ScheduleData(BaseModel):
    """Schedule data with metadata."""

    schedule_type: str
    definition: Optional[ScheduleDefinition] = None
    rows: List[ScheduleRow] = []
    total_count: int = 0
    generated: datetime
    summary: Optional[ScheduleSummary] = None

    class Config:
        fields = {"schedule_type": "schedule_type", "total_count": "totalCount"}


class BIMObject(BaseModel):
    """Simplified BIM object for schedule calculations."""

    id: str
    type: str
    name: str
    material: str = ""
    layer: str = ""
    properties: Dict[str, Any] = {}
    geometry: Optional[Dict[str, float]] = None
    position: Optional[Dict[str, float]] = None


# ============== Quantity Takeoff Schemas ==============


class QuantityResult(BaseModel):
    """Quantity takeoff result."""

    category: str
    item: str
    count: int
    unit: str
    total: float
    unit_cost: Optional[float] = None
    total_cost: Optional[float] = None

    class Config:
        fields = {"unit_cost": "unitCost", "total_cost": "totalCost"}


class QuantityTakeoffRequest(BaseModel):
    """Request schema for quantity takeoff."""

    objects: List[BIMObject]
    categories: List[str] = ["walls", "floors", "doors", "windows", "materials"]


class QuantityTakeoffResponse(BaseModel):
    """Response schema for quantity takeoff."""

    results: List[QuantityResult]
    generated: datetime


# ============== Schedule Generation Schemas ==============


class ScheduleGenerateRequest(BaseModel):
    """Request schema for generating a schedule."""

    schedule_type: ScheduleType
    objects: List[BIMObject]
    columns: Optional[List[ScheduleColumn]] = None
    filters: Optional[List[ScheduleFilter]] = None

    class Config:
        fields = {"schedule_type": "schedule_type"}


class ScheduleGenerateResponse(BaseModel):
    """Response schema for schedule generation."""

    schedule_type: ScheduleType
    rows: List[ScheduleRow]
    total_count: int
    generated: datetime
    summary: ScheduleSummary

    class Config:
        fields = {"schedule_type": "schedule_type", "total_count": "totalCount"}


# ============== Schedule Export Schemas ==============


class ExportFormatSchedule(str, Enum):
    """Available export formats for schedules."""

    CSV = "csv"
    EXCEL = "excel"
    JSON = "json"
    PDF = "pdf"


class CSVExportOptions(BaseModel):
    """CSV export options."""

    include_headers: bool = True
    delimiter: str = ","
    quote_strings: bool = True

    class Config:
        fields = {"include_headers": "includeHeaders"}


class ExcelExportRequest(BaseModel):
    """Request schema for Excel export."""

    schedule: ScheduleDefinition
    data: List[ScheduleRow]
    title: Optional[str] = None
    include_summary: bool = True

    class Config:
        fields = {"include_summary": "includeSummary"}


class ExcelExportResponse(BaseModel):
    """Response schema for Excel export."""

    message: str
    schedule_type: str
    row_count: int
    note: str

    class Config:
        fields = {"schedule_type": "schedule_type"}


class CSVExportRequest(BaseModel):
    """Request schema for CSV export."""

    schedule_type: str
    headers: List[str]
    rows: List[Dict[str, Any]]

    class Config:
        fields = {"schedule_type": "schedule_type"}


# ============== Report Schemas ==============


class ReportMetadata(BaseModel):
    """Report metadata."""

    project_name: str
    generated: datetime
    author: str = "Unknown"

    class Config:
        fields = {"project_name": "projectName"}


class ReportSummary(BaseModel):
    """Report summary."""

    total_objects: int
    total_materials: int
    total_layers: int
    site_area: Optional[float] = None
    building_area: Optional[float] = None

    class Config:
        fields = {
            "total_objects": "totalObjects",
            "total_materials": "totalMaterials",
            "total_layers": "totalLayers",
            "site_area": "siteArea",
            "building_area": "buildingArea",
        }


class ProjectReport(BaseModel):
    """Full project report with schedules and quantities."""

    metadata: ReportMetadata
    summary: ReportSummary
    schedules: Dict[str, ScheduleData]
    quantities: Optional[List[QuantityResult]] = None


class ReportRequest(BaseModel):
    """Request schema for generating a report."""

    project: Dict[str, Any]
    objects: List[BIMObject]
    include_schedules: List[str] = ["door", "window", "material"]
    include_quantities: bool = True

    class Config:
        fields = {
            "include_schedules": "include_schedules",
            "include_quantities": "include_quantities",
        }


# ============== Schedule Definition Schemas ==============


class ScheduleDefinitionResponse(BaseModel):
    """Response schema for schedule definitions."""

    id: str
    name: str
    type: ScheduleType
    description: Optional[str] = None
    columns: List[Dict[str, Any]]


# ============== Schedule Definition Endpoints ==============


class ScheduleDefinitionsResponse(BaseModel):
    """Response schema for schedule definitions list."""

    definitions: List[ScheduleDefinitionResponse]
