# Ceiling Panel Calculator - Codebase Structure

**Analysis Date:** 2026-01-31

## Directory Layout

```
[project-root]/
├── core/                    # Core calculation engine and data models
├── api/                     # REST API (Flask) and web layer
│   ├── routes/              # API endpoint handlers
│   ├── middleware/          # Auth, rate limiting, CORS
│   └── websocket/           # Real-time communication handlers
├── optimization/            # Advanced optimization algorithms
├── design/                  # Building/site design (MEP, structural, multi-story)
├── output/                  # 3D rendering and output generation
├── iot/                     # IoT sensor network and monitoring
├── blockchain/              # Material verification and ownership
├── analytics/               # Predictive analytics and code analysis
├── ml/                      # Machine learning models
│   └── models/              # Layout predictor, cost estimator, aesthetic scorer
├── orchestration/           # System orchestrator and workflows
├── auth/                    # Authentication and user models
├── billing/                 # Billing plans and subscription logic
├── web/                     # Web server and GUI components
├── frontend/                # Frontend application (if separate from web/)
│   └── src/
│       ├── components/      # React/Vue components organized by feature
│       └── api/             # Frontend API clients
├── vision/                  # Computer vision (floor plan parsing)
├── generative/              # Generative AI components
├── examples/                # Usage examples and debug utilities
├── tests/                   # Test suite
├── docs/                    # Documentation
│   ├── api-reference/       # API documentation
│   └── getting-started/     # User guides
├── archive/                 # Deprecated/legacy code
├── maintenance_models/      # Maintenance-related models (if any)
├── requirements.txt         # Python dependencies
├── default_config.json      # Default configuration template
├── *.md                     # Project documentation (20+ markdown files)
└── __init__.py              # Package root
```

---

## Directory Purposes

**`core/` - Foundation Layer:**
- Purpose: Core calculation engine and data models
- Contains: `ceiling_panel_calc.py`, `config_manager.py`, `logging_config.py`
- Key files:
  - `core/ceiling_panel_calc.py`: Main calculation engine (577 lines)
  - `core/config_manager.py`: Configuration management
  - `core/logging_config.py`: Logging utilities
- Dependencies: None (foundation)
- Used by: All other modules

**`api/` - REST API Layer:**
- Purpose: HTTP API for external integration
- Contains: Flask application, routes, middleware, WebSocket handlers
- Key files:
  - `api/app.py`: Flask app factory (251 lines)
  - `api/routes/calculations.py`: Calculation endpoints (367 lines)
  - `api/schemas.py`: Request/response schemas
  - `api/middleware/auth.py`: Authentication decorator
  - `api/middleware/rate_limit.py`: Rate limiting
- Dependencies: `core/` (imports calculation engine)
- Used by: Frontend, external clients

**`optimization/` - Algorithm Optimization:**
- Purpose: Advanced optimization algorithms for panel layouts
- Contains: 6 optimizer implementations
- Key files:
  - `quantum_optimizer.py`: Quantum-inspired annealing
  - `reinforcement_optimizer.py`: RL-based optimization
  - `qlearning_optimizer.py`: Q-learning agent
  - `emotional_design_optimizer.py`: Psychological design factors
  - `climate_scenario_modeler.py`: Climate resilience
- Dependencies: `core/` (data types)
- Used by: API optimization endpoints

**`design/` - Building Design:**
- Purpose: Multi-story building and site-level design
- Contains: Structural, MEP, and planning modules
- Key files:
  - `structural_engine.py`: Beam/column design
  - `mep_systems.py`: HVAC, electrical, plumbing
  - `multi_story_designer.py`: Floor and space management
  - `site_planner.py`: Site analysis and zoning
- Dependencies: `core/`
- Used by: Large-scale project workflows

**`output/` - 3D Generation:**
- Purpose: 3D mesh generation and export
- Contains: `renderer_3d.py` with mesh exporters
- Key classes: `CeilingPanel3DGenerator`, `MeshExporter`
- Export formats: OBJ, STL, glTF
- Dependencies: Core layout results
- Used by: API 3D export endpoint

**`iot/` - IoT & Monitoring:**
- Purpose: Sensor network and predictive maintenance
- Contains: Sensor management, security, dashboards
- Key files:
  - `iot_sensor_network.py`: Sensor data collection
  - `iot_security.py`: Device authentication
  - `monitoring_dashboard.py`: Real-time monitoring UI
  - `predictive_maintenance.py`: Maintenance prediction
- Dependencies: Core types
- Used by: Monitoring workflows

**`blockchain/` - Verification:**
- Purpose: Material supply chain verification
- Contains: `blockchain_verifier.py`, `blockchain_ownership.py`
- Key classes: `MaterialBlockchain`, `MaterialCertificate`
- Dependencies: Core material types
- Used by: Verification workflows

**`analytics/` - Insights:**
- Purpose: Predictive analytics and optimization
- Contains: Analytics engines and code quality tools
- Key files:
  - `predictive_analytics_engine.py`: ML-based predictions
  - `energy_optimization.py`: Energy efficiency analysis
  - `code_analyzer.py`: Code quality analysis
- Dependencies: Core calculations, IoT data
- Used by: Reporting dashboards

**`ml/` - Machine Learning:**
- Purpose: ML models for layout and cost prediction
- Structure: `ml/models/` subdirectory
- Key models:
  - `layout_predictor.py`: Predict optimal layouts
  - `cost_estimator.py`: Cost estimation ML
  - `aesthetic_scorer.py`: Visual quality scoring
- Dependencies: Core types
- Used by: Optimization layer

**`orchestration/` - Coordination:**
- Purpose: System-wide workflow orchestration
- Contains: Orchestrator, interfaces, marketplace
- Key files:
  - `system_orchestrator.py`: Central coordinator (528 lines)
  - `universal_interfaces.py`: Component interfaces
  - `collaboration_engine.py`: Multi-user coordination
  - `ai_generative_engine.py`: AI workflow integration
- Dependencies: All business logic layers
- Used by: API layer, automation scripts

**`tests/` - Test Suite:**
- Purpose: Comprehensive testing
- Contains: 10+ test files organized by phase
- Key files:
  - `test_ceiling_calc.py`: Core calculation tests
  - `test_algorithm_correctness.py`: Algorithm validation
  - `test_api.py`: API endpoint tests
  - `test_integration.py`: Integration tests
  - `test_phase1_mvp.py`, `test_phase2_sprint*.py`: Sprint deliverables
- Pattern: pytest-based with fixtures

**`examples/` - Usage Examples:**
- Purpose: Demonstration and debugging code
- Contains: `examples.py`, `debug_algorithm.py`, `websocket_client.py`
- Usage: Reference implementations for developers

**`web/` - Web Interface:**
- Purpose: Web server and GUI
- Contains: `gui_server.py` - Flask-based web interface
- Note: May overlap with `api/` functionality

**`frontend/` - Frontend Application:**
- Purpose: Client-side application (React/Vue)
- Structure: Modern frontend organization
  - `src/components/`: Feature-organized components
    - `Calculator/`, `Layout/`, `Monitoring/`, `Projects/`, `Visualization/`
  - `src/api/`: Frontend API client
  - `src/styles/`: Styling
- Dependencies: Node.js, npm packages

**`docs/` - Documentation:**
- Purpose: Structured documentation
- Structure:
  - `api-reference/`: API documentation
  - `getting-started/`: User onboarding guides
- Related: 20+ markdown files at root level

**`archive/` - Legacy Code:**
- Purpose: Deprecated but retained for reference
- Contains: Old implementations of optimizers, engines
- Policy: Not imported by active code

**`vision/` - Computer Vision:**
- Purpose: Floor plan image analysis
- Contains: `floor_plan_parser.py`, `dimension_extractor.py`
- Dependencies: Likely OpenCV or similar

**`generative/` - Generative AI:**
- Purpose: AI-generated designs
- Contains: `generator.py`
- Status: May be experimental

---

## Key File Locations

**Entry Points:**
- `api/app.py`: Flask application factory and server entry
- `core/ceiling_panel_calc.py`: Core calculation (executable for demo)
- `orchestration/system_orchestrator.py`: Orchestration demo

**Configuration:**
- `default_config.json`: Default configuration template
- `core/config_manager.py`: Configuration loading and CLI parsing
- `requirements.txt`: Python dependencies
- `gui_requirements.txt`: GUI-specific dependencies

**Core Logic:**
- `core/ceiling_panel_calc.py`: All core classes (calculator, generators, dataclasses)
- `api/routes/calculations.py`: API calculation logic
- `optimization/quantum_optimizer.py`: Optimization logic

**Testing:**
- `tests/test_ceiling_calc.py`: Unit tests for calculator
- `tests/test_algorithm_correctness.py`: Algorithm validation
- `tests/test_integration.py`: Integration tests

**Documentation (Root Level):**
- `README.md`: Main project README
- `ARCHITECTURE.md`: System architecture overview
- `ALGORITHM.md`: Algorithm documentation
- `API.md`: API reference
- `CLAUDE.md`: Comprehensive code review
- `SETUP_GUIDE.md`: Installation instructions
- `LIMITATIONS.md`: Known limitations
- `roadmap.md`, `sprint*.md`: Project planning

**Generated Output:**
- `ceiling_layout.dxf`: Sample DXF output
- `ceiling_layout.svg`: Sample SVG output
- `ceiling_report.txt`: Sample text report
- `ceiling_project.json`: Sample JSON export

---

## Naming Conventions

**Files:**
- **Python modules**: `snake_case.py` (e.g., `ceiling_panel_calc.py`, `quantum_optimizer.py`)
- **Test files**: `test_*.py` (e.g., `test_ceiling_calc.py`)
- **Documentation**: `UPPERCASE.md` or `Title_Case.md` (e.g., `README.md`, `SETUP_GUIDE.md`)
- **Configuration**: `default_config.json`, `requirements.txt`

**Directories:**
- **Modules**: `snake_case/` (e.g., `optimization/`, `analytics/`)
- **Frontend**: Standard React/Vue conventions (`components/`, `api/`, `styles/`)

**Classes:**
- **PascalCase**: `CeilingPanelCalculator`, `SystemOrchestrator`, `DXFGenerator`
- **Dataclasses**: `CeilingDimensions`, `PanelLayout`, `Material`
- **Enums**: `ComponentStatus`, `WorkflowStatus`

**Functions/Methods:**
- **snake_case**: `calculate_optimal_layout()`, `generate_dxf()`, `export_json()`

**Variables:**
- **snake_case**: `ceiling`, `spacing`, `layout`, `panel_width_mm`
- **Constants**: `MATERIALS` dict, class-level constants

**Private/Internal:**
- **Leading underscore**: `_generate_dxf_manual()`, `_calculations_store`, `_lock`

---

## Where to Add New Code

**New Feature (Calculation):**
- Primary code: `core/ceiling_panel_calc.py` (extend calculator class)
- Tests: `tests/test_ceiling_calc.py`
- API integration: `api/routes/calculations.py`

**New Optimization Algorithm:**
- Implementation: `optimization/{algorithm_name}.py`
- Follow pattern of existing optimizers (quantum, reinforcement)
- Register in: API routes for `/calculate/optimize` endpoint

**New Export Format:**
- Implementation: Add generator class to `core/ceiling_panel_calc.py`
- Pattern: Follow `DXFGenerator`, `SVGGenerator` structure
- API endpoint: Add to `api/routes/exports.py`

**New API Endpoint:**
- Route: Create file in `api/routes/` (e.g., `new_feature.py`)
- Registration: Add to `api/app.py` blueprint registration
- Schema: Add to `api/schemas.py`

**New ML Model:**
- Implementation: `ml/models/{model_name}.py`
- Follow pattern: `layout_predictor.py`, `cost_estimator.py`
- Integration: Use in optimization or analytics layer

**New Component for Orchestration:**
- Implementation: Create module in appropriate layer
- Registration: Call `orchestrator.register_component()` in setup
- Workflow: Add `WorkflowStep` to relevant `WorkflowDefinition`

**Configuration Extension:**
- Add field to: `default_config.json`
- Support in: `core/config_manager.py`
- Usage: Access via `ConfigManager.get_config()`

---

## Special Directories

**`__pycache__/`:**
- Purpose: Python bytecode cache
- Generated: Yes (by Python interpreter)
- Committed: No (in `.gitignore`)

**`frontend/node_modules/`:**
- Purpose: npm package dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**`archive/`:**
- Purpose: Historical/deprecated code
- Generated: No (manual curation)
- Committed: Yes (for reference)
- Usage: Not imported by active code

---

*Structure analysis: 2026-01-31*
