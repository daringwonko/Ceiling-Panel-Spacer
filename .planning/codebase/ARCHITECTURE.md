# Ceiling Panel Calculator - Architecture

**Analysis Date:** 2026-01-31

## Pattern Overview

**Overall:** Layered Clean Architecture with Orchestration Layer

The codebase follows a **layered architectural pattern** with clear separation of concerns across multiple functional domains. A central orchestration layer coordinates component interactions, while the core calculation engine remains independent and reusable.

**Key Characteristics:**
- **Layered separation**: Presentation → Orchestration → Business Logic → Output → Data
- **Component-based modularity**: Each functional area is self-contained with clear interfaces
- **Dataclass-centric data models**: Immutable data structures using Python dataclasses
- **Workflow-driven operations**: System orchestrator manages multi-step processes
- **Extensible plugin architecture**: New optimizers and generators can be added without core changes

---

## Architecture Layers

**Presentation Layer:**
- Purpose: User-facing interfaces and visualization
- Location: `web/`, `frontend/`, `api/`
- Contains: Flask API, WebSocket handlers, monitoring dashboards
- Depends on: Orchestration, Core calculation, Output generation
- Used by: External clients, web browsers, CLI tools

**API Gateway Layer:**
- Purpose: REST API endpoints and request routing
- Location: `api/routes/`, `api/middleware/`
- Contains: Calculation endpoints, project management, material routes, export handlers
- Depends on: Core calculation engine, Schemas
- Used by: Frontend applications, external integrations

**Orchestration Layer:**
- Purpose: Central coordination and workflow management
- Location: `orchestration/system_orchestrator.py`
- Contains: `SystemOrchestrator`, `WorkflowDefinition`, `ComponentInfo`
- Depends on: All business logic components
- Used by: API layer, automation scripts, batch processing

**Business Logic Layer - Core:**
- Purpose: Fundamental ceiling panel calculations
- Location: `core/ceiling_panel_calc.py`
- Contains: `CeilingPanelCalculator`, dataclasses (`CeilingDimensions`, `PanelSpacing`, `PanelLayout`, `Material`)
- Depends on: None (foundation layer)
- Used by: All other calculation-dependent layers

**Business Logic Layer - Optimization:**
- Purpose: Advanced layout optimization algorithms
- Location: `optimization/`
- Contains: `QuantumInspiredOptimizer`, `ReinforcementOptimizer`, `QLearningAgent`
- Depends on: Core calculation types
- Used by: API calculation endpoints, orchestrator workflows

**Business Logic Layer - Design:**
- Purpose: Building and site-level design capabilities
- Location: `design/`
- Contains: `MultiStoryDesigner`, `SitePlanner`, `StructuralEngine`, `MEPSystemEngine`
- Depends on: Core calculations
- Used by: Large-scale project workflows

**Output Generation Layer:**
- Purpose: File format generation and export
- Location: `core/ceiling_panel_calc.py` (generators), `output/renderer_3d.py`
- Contains: `DXFGenerator`, `SVGGenerator`, `ProjectExporter`, `CeilingPanel3DGenerator`
- Depends on: Core calculation results
- Used by: API exports, orchestration workflows

**Data & Security Layer:**
- Purpose: Data persistence, IoT integration, verification
- Location: `iot/`, `blockchain/`, `auth/`
- Contains: `SensorNetworkManager`, `MaterialBlockchain`, authentication models
- Depends on: Core types
- Used by: Monitoring systems, verification workflows

**Analytics Layer:**
- Purpose: Predictive analytics and optimization insights
- Location: `analytics/`
- Contains: `PredictiveAnalyticsEngine`, `EnergyOptimizationEngine`, `CodeAnalyzer`
- Depends on: Core calculations, IoT data
- Used by: Reporting dashboards, maintenance systems

---

## Data Flow

**Calculation Request Flow:**

1. **Request Entry**: Client sends POST to `/api/v1/calculate` (`api/routes/calculations.py`)
2. **Validation**: Request schema validated (`api/schemas.py`)
3. **Core Calculation**: `CeilingPanelCalculator.calculate_optimal_layout()` invoked (`core/ceiling_panel_calc.py`)
4. **Optimization (Optional)**: `CeilingLayoutOptimizer.optimize_layout()` called for enhanced results (`optimization/quantum_optimizer.py`)
5. **Result Assembly**: Layout, material, and efficiency data combined
6. **Response**: JSON response returned with full calculation results

**Orchestrated Workflow Flow:**

1. **Workflow Trigger**: `SystemOrchestrator.execute_workflow()` called
2. **Dependency Resolution**: Components sorted via topological sort
3. **Step Execution**: Each `WorkflowStep` executed in sequence
4. **Component Invocation**: `call_component()` routes to appropriate module
5. **Result Aggregation**: Step results stored in `WorkflowExecution.step_results`
6. **Completion Callback**: `on_success` or `on_failure` handlers invoked

**Export Generation Flow:**

1. **Export Request**: API receives export request with layout data
2. **Generator Selection**: `DXFGenerator`, `SVGGenerator`, or `ProjectExporter` instantiated
3. **File Generation**: Format-specific generation logic executed
4. **File Storage**: Output written to configured output directory
5. **Response**: File path or download URL returned

---

## Key Abstractions

**Dataclass Data Models:**
- Purpose: Immutable, typed data structures for domain entities
- Files: `core/ceiling_panel_calc.py` (lines 15-56)
- Pattern: Python `@dataclass` decorator with type hints
- Examples:
  - `CeilingDimensions`: Spatial bounds (length_mm, width_mm)
  - `PanelSpacing`: Gap specifications (perimeter_gap_mm, panel_gap_mm)
  - `PanelLayout`: Calculated results (panel dimensions, counts, coverage)
  - `Material`: Finish specification with cost and optical properties

**Calculation Engine:**
- Purpose: Core algorithm for panel layout optimization
- File: `core/ceiling_panel_calc.py` (lines 58-136)
- Pattern: Strategy pattern with efficiency scoring
- Key method: `calculate_optimal_layout(target_aspect_ratio)` - brute-force search with scoring
- Returns: `PanelLayout` with optimal dimensions and panel counts

**Generator Pattern:**
- Purpose: Encapsulate file format generation logic
- Files: `core/ceiling_panel_calc.py` (lines 139-316)
- Pattern: Template method with format-specific implementations
- Implementations:
  - `DXFGenerator`: CAD-compatible DXF output using ezdxf or manual fallback
  - `SVGGenerator`: Vector graphics for web/print visualization

**Orchestration Framework:**
- Purpose: Coordinate multi-step operations across components
- File: `orchestration/system_orchestrator.py`
- Pattern: Workflow engine with dependency management
- Key classes:
  - `SystemOrchestrator`: Central coordinator
  - `WorkflowDefinition`: Declarative workflow specification
  - `WorkflowStep`: Individual operation with dependencies
  - `ComponentInfo`: Lifecycle-managed component metadata

**Optimization Strategy Pattern:**
- Purpose: Pluggable optimization algorithms
- Location: `optimization/`
- Pattern: Strategy pattern with common interface
- Implementations:
  - `QuantumInspiredOptimizer`: Simulated quantum annealing
  - `ReinforcementOptimizer`: RL-based learning optimization
  - `QLearningAgent`: Q-learning for layout decisions

---

## Entry Points

**Flask Application Entry Point:**
- Location: `api/app.py` (lines 21-251)
- Function: `create_app(config)` - Application factory pattern
- Responsibilities: Flask configuration, blueprint registration, CORS setup, error handlers
- Triggers: HTTP requests to REST API endpoints
- Default port: 5000

**Core Calculation Entry Point:**
- Location: `core/ceiling_panel_calc.py` (lines 509-576)
- Function: `main()` - Interactive demonstration
- Responsibilities: Example calculation, material selection, file generation
- Triggers: Direct module execution (`python ceiling_panel_calc.py`)

**Orchestrator Entry Point:**
- Location: `orchestration/system_orchestrator.py` (lines 459-527)
- Function: `demonstrate_orchestrator()`
- Responsibilities: Component registration, workflow execution, health checks
- Triggers: Direct module execution for system demonstration

**Optimization Demonstration:**
- Location: `optimization/quantum_optimizer.py`, `reinforcement_optimizer.py`, etc.
- Pattern: Each module has demonstration code when executed directly
- Responsibilities: Showcase algorithm capabilities with example data

---

## Error Handling

**Strategy:** Layer-specific error handling with propagation

**Core Layer:**
- Pattern: ValueError for invalid inputs, runtime exceptions for calculation failures
- Location: `core/ceiling_panel_calc.py` (lines 113-114)
- Validation: Dimension and gap validation before calculation

**API Layer:**
- Pattern: Standardized JSON error responses with HTTP status codes
- Location: `api/app.py` (lines 82-158)
- Handlers: 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 429 (Rate Limited), 500 (Internal Error)
- Response format: `{"success": false, "data": null, "error": {"code": "...", "message": "..."}}`

**Orchestration Layer:**
- Pattern: Workflow status tracking with failure callbacks
- Location: `orchestration/system_orchestrator.py` (lines 306-313)
- Mechanism: `on_failure` callback, `error` field in `WorkflowExecution`

---

## Cross-Cutting Concerns

**Logging:**
- Framework: Python standard `logging` module
- Configuration: `core/logging_config.py`
- Pattern: Module-level loggers with hierarchical naming
- Usage: `logger = logging.getLogger(__name__)` in each module

**Validation:**
- Pattern: Schema-based validation at API layer, manual validation in core
- Location: `api/schemas.py` (Pydantic-style dataclasses), `core/ceiling_panel_calc.py` (input validation)
- Input constraints: Positive dimensions, non-negative gaps, gap < ceiling/2

**Authentication & Rate Limiting:**
- Pattern: Flask decorators for middleware
- Location: `api/middleware/auth.py`, `api/middleware/rate_limit.py`
- Usage: `@require_auth`, `@rate_limit(tier="pro")` on route handlers

**Configuration:**
- Pattern: JSON configuration with environment variable override
- Location: `core/config_manager.py`, `default_config.json`
- Sources: JSON files, CLI arguments, interactive prompts, environment variables

---

## Component Dependencies

```
core/ceiling_panel_calc.py (FOUNDATION - No internal dependencies)
    ↑
    ├── api/ (imports core for calculations)
    ├── optimization/ (imports core types)
    ├── design/ (imports core types)
    ├── output/ (imports core types)
    └── orchestration/ (can coordinate core components)

orchestration/system_orchestrator.py (COORDINATION)
    ↑
    └── Manages lifecycle of all business logic components

api/app.py (PRESENTATION)
    ↑
    ├── api/routes/ (imports core calculations)
    └── api/middleware/ (supports routes)
```

---

## File Count Summary

- Python files: 100
- Top-level directories: 44 (including subdirectories)
- Core modules: 4 files in `core/`
- API modules: 15+ files in `api/` and subdirectories
- Optimization modules: 6 files in `optimization/`
- Design modules: 5 files in `design/`
- Test files: 10+ files in `tests/`

---

*Architecture analysis: 2026-01-31*
