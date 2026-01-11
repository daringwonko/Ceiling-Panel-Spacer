# Ceiling Panel Calculator - System Architecture & Integration Guide

**Complete Technical Documentation**
Generated: January 11, 2026
Version: 2.0 - Post 6-Sprint Integration

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Module Dependency Map](#module-dependency-map)
3. [Core Module Descriptions](#core-module-descriptions)
4. [Integration Patterns](#integration-patterns)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Quick Start Guide](#quick-start-guide)
7. [API Reference Summary](#api-reference-summary)
8. [Configuration Guide](#configuration-guide)

---

## System Overview

The Ceiling Panel Calculator is a comprehensive architectural design platform consisting of **25+ Python modules** organized into functional layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  gui_server.py │ monitoring_dashboard.py │ examples.py          │
├─────────────────────────────────────────────────────────────────┤
│                    ORCHESTRATION LAYER                          │
│  system_orchestrator.py │ config_manager.py │ logging_config.py │
├─────────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   DESIGN     │ │ OPTIMIZATION │ │   ANALYSIS   │            │
│  │──────────────│ │──────────────│ │──────────────│            │
│  │ceiling_panel │ │quantum_optim │ │code_analyzer │            │
│  │multi_story   │ │reinforcement │ │predictive_   │            │
│  │site_planner  │ │emotional_    │ │  analytics   │            │
│  │structural_   │ │climate_      │ │energy_optim  │            │
│  │mep_systems   │ │  scenario    │ │              │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                    OUTPUT GENERATION LAYER                      │
│  renderer_3d.py │ SVGGenerator │ DXFGenerator │ ProjectExporter │
├─────────────────────────────────────────────────────────────────┤
│                    DATA & SECURITY LAYER                        │
│  blockchain_verifier.py │ iot_security.py │ iot_sensor_network  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Dependency Map

### Core Dependencies (What imports what)

```
ceiling_panel_calc.py (CORE - No internal dependencies)
    ↑
    ├── config_manager.py (imports ceiling_panel_calc)
    ├── examples.py (imports ceiling_panel_calc)
    ├── gui_server.py (imports ceiling_panel_calc)
    └── test_*.py (imports ceiling_panel_calc)

logging_config.py (FOUNDATION - No dependencies)
    ↑
    └── All modules can import for logging/exceptions

quantum_optimizer.py (STANDALONE)
    ↑
    └── Can be used by ceiling_panel_calc for optimization

renderer_3d.py (STANDALONE)
    ↑
    └── Uses ceiling_panel_calc results for 3D generation

structural_engine.py (STANDALONE)
    ↑
    ├── multi_story_designer.py (uses structural calculations)
    └── mep_systems.py (coordinates with structural)

iot_sensor_network.py
    ↑
    ├── iot_security.py (secures sensor network)
    ├── iot_integration.py (integrates sensors)
    ├── predictive_maintenance.py (uses sensor data)
    └── monitoring_dashboard.py (displays sensor data)

energy_optimization.py
    ↑
    └── predictive_maintenance.py (energy-aware maintenance)

blockchain_verifier.py (STANDALONE)
    ↑
    └── Can verify materials used in any module

system_orchestrator.py (TOP LEVEL - Coordinates everything)
    ↑
    └── test_integration.py (tests orchestration)
```

### External Dependencies

```python
# requirements.txt breakdown by module:

# Core (ceiling_panel_calc.py, config_manager.py)
- ezdxf>=0.17.0          # DXF file generation

# Scientific (quantum_optimizer.py, structural_engine.py, etc.)
- numpy>=1.21.0          # Numerical computations
- pandas>=1.3.0          # Data manipulation

# Web (gui_server.py)
- flask>=2.0.0           # Web framework
- flask-cors>=3.0.10     # CORS support
- websockets>=10.0       # Real-time communication

# IoT (iot_sensor_network.py)
- paho-mqtt>=1.6.1       # MQTT messaging

# Security (iot_security.py, blockchain_verifier.py)
- cryptography>=3.4.0    # Encryption
- PyJWT>=2.0.0           # JSON Web Tokens

# Testing
- pytest>=6.0.0
- pytest-cov>=2.12.0
- pytest-asyncio>=0.18.0
```

---

## Core Module Descriptions

### Layer 1: Foundation

| Module | Purpose | Key Classes/Functions |
|--------|---------|----------------------|
| `logging_config.py` | Unified logging, exceptions, validation | `get_logger()`, `CeilingCalculatorError`, `validate_positive()` |
| `config_manager.py` | Configuration from JSON/CLI/interactive | `ConfigManager`, `CalculatorConfig` |

### Layer 2: Core Calculation

| Module | Purpose | Key Classes/Functions |
|--------|---------|----------------------|
| `ceiling_panel_calc.py` | Panel layout calculation | `CeilingPanelCalculator`, `Dimensions`, `Gap`, `LayoutResult` |
| `structural_engine.py` | Beam/column/foundation design | `StructuralEngine`, `BeamDesign`, `ColumnDesign` |
| `mep_systems.py` | HVAC, electrical, plumbing | `MEPSystemEngine`, `HVACSystem`, `ElectricalSystem` |

### Layer 3: Optimization

| Module | Purpose | Key Classes/Functions |
|--------|---------|----------------------|
| `quantum_optimizer.py` | Quantum-inspired optimization | `QuantumInspiredOptimizer`, `CeilingLayoutOptimizer` |
| `reinforcement_optimizer.py` | RL-based optimization | `ReinforcementOptimizer`, `QLearningAgent` |
| `emotional_design_optimizer.py` | Psychological design optimization | `EmotionalDesignOptimizer`, `DesignEmotionalImpact` |
| `climate_scenario_modeler.py` | Climate resilience modeling | `ClimateScenarioModeler`, `ClimateResilienceAssessment` |

### Layer 4: Building Design

| Module | Purpose | Key Classes/Functions |
|--------|---------|----------------------|
| `multi_story_designer.py` | Multi-floor building design | `MultiStoryDesigner`, `Floor`, `Space` |
| `site_planner.py` | Site planning & zoning | `SitePlanner`, `ZoningRegulation`, `SiteAnalysisResult` |

### Layer 5: Output Generation

| Module | Purpose | Key Classes/Functions |
|--------|---------|----------------------|
| `renderer_3d.py` | 3D mesh generation | `CeilingPanel3DGenerator`, `MeshExporter`, `Mesh` |
| `ceiling_panel_calc.py` | SVG/DXF generation | `SVGGenerator`, `DXFGenerator`, `ProjectExporter` |

### Layer 6: IoT & Monitoring

| Module | Purpose | Key Classes/Functions |
|--------|---------|----------------------|
| `iot_sensor_network.py` | Sensor management | `SensorNetworkManager`, `SensorData` |
| `iot_security.py` | IoT authentication | `IoTSecurityManager`, `require_auth` |
| `monitoring_dashboard.py` | Real-time monitoring | `MonitoringDashboard`, `Alert`, `SystemHealth` |
| `predictive_maintenance.py` | Maintenance prediction | `PredictiveMaintenanceEngine` |

### Layer 7: Verification & Analytics

| Module | Purpose | Key Classes/Functions |
|--------|---------|----------------------|
| `blockchain_verifier.py` | Material verification | `MaterialBlockchain`, `MaterialCertificate` |
| `code_analyzer.py` | Code quality analysis | `CodeAnalyzer`, `SecurityAnalyzer` |
| `energy_optimization.py` | Energy efficiency | `EnergyOptimizationEngine` |

### Layer 8: Orchestration

| Module | Purpose | Key Classes/Functions |
|--------|---------|----------------------|
| `system_orchestrator.py` | System coordination | `SystemOrchestrator`, `WorkflowDefinition` |
| `gui_server.py` | Web interface | Flask app, REST endpoints |

---

## Integration Patterns

### Pattern 1: Basic Calculation Flow

```python
from ceiling_panel_calc import Dimensions, Gap, CeilingPanelCalculator, MATERIALS

# 1. Define inputs
dims = Dimensions(width_mm=5000, length_mm=4000)
gap = Gap(edge_gap_mm=200, spacing_gap_mm=50)

# 2. Calculate
calculator = CeilingPanelCalculator(dims, gap)
result = calculator.calculate()

# 3. Generate outputs
from ceiling_panel_calc import SVGGenerator, DXFGenerator

svg_gen = SVGGenerator()
svg_gen.generate("output.svg", dims, gap, result)

dxf_gen = DXFGenerator()
dxf_gen.generate("output.dxf", dims, gap, result)
```

### Pattern 2: Optimized Calculation

```python
from quantum_optimizer import CeilingLayoutOptimizer

# Use quantum-inspired optimization
optimizer = CeilingLayoutOptimizer()
optimized = optimizer.optimize_layout(
    ceiling_length_mm=5000,
    ceiling_width_mm=4000,
    perimeter_gap_mm=200,
    panel_gap_mm=50,
    max_panel_size_mm=2400
)

print(f"Optimal layout: {optimized['panels_x']}x{optimized['panels_y']}")
print(f"Panel size: {optimized['panel_width_mm']}x{optimized['panel_height_mm']}mm")
```

### Pattern 3: Full Building Design

```python
from multi_story_designer import MultiStoryDesigner, SpaceType, VerticalTransportType
from site_planner import SitePlanner, SiteCharacteristics, ZoningType
from structural_engine import StructuralEngine

# 1. Site Planning
planner = SitePlanner()
planner.set_site(SiteCharacteristics(total_area_sqm=5000, frontage_m=50, depth_m=100))
planner.set_zoning(ZoningType.OFFICE)
site_analysis = planner.analyze_site(15000, 45, 2500)

# 2. Building Design
designer = MultiStoryDesigner()
designer.set_site(5000, site_analysis.max_building_footprint_sqm)

for i in range(5):
    designer.add_floor(i, f"Floor {i}")
    designer.add_space_to_floor(i, f"O{i}", "Office", SpaceType.OFFICE, 600, 60)

# 3. Add circulation
designer.add_vertical_transport("E1", VerticalTransportType.ELEVATOR, list(range(5)), 15, (5,5), (2.5,2.5))

# 4. Compliance check
issues = designer.check_code_compliance()
cost = designer.generate_cost_estimate()
```

### Pattern 4: 3D Export Pipeline

```python
from renderer_3d import CeilingPanel3DGenerator, MeshExporter

# Generate 3D mesh from layout
generator = CeilingPanel3DGenerator(panel_thickness_mm=20)
mesh = generator.generate_layout_mesh(
    panels_x=3,
    panels_y=2,
    panel_width_mm=800,
    panel_height_mm=600,
    include_frame=True
)

# Export to multiple formats
MeshExporter.to_obj(mesh, "ceiling.obj")      # Wavefront OBJ
MeshExporter.to_stl(mesh, "ceiling.stl")      # 3D printing
MeshExporter.to_gltf(mesh, "ceiling.gltf")    # Web/AR/VR
```

### Pattern 5: IoT Monitoring Integration

```python
from monitoring_dashboard import MonitoringDashboard, MetricType, SensorReading
from datetime import datetime

# Setup dashboard
dashboard = MonitoringDashboard()

# Register sensors
dashboard.register_sensor("TEMP-01", "Office Temp", MetricType.TEMPERATURE, "Floor 1", "°C")
dashboard.register_sensor("HUM-01", "Office Humidity", MetricType.HUMIDITY, "Floor 1", "%")

# Set custom thresholds
dashboard.set_threshold(MetricType.TEMPERATURE, min_val=20, max_val=26, critical_max=30)

# Ingest readings (from IoT network)
reading = SensorReading("TEMP-01", MetricType.TEMPERATURE, 24.5, "°C", datetime.now())
dashboard.ingest_reading(reading)

# Get dashboard data (for web UI)
data = dashboard.get_dashboard_data()
```

### Pattern 6: Material Blockchain Verification

```python
from blockchain_verifier import MaterialBlockchain, MaterialCertificate

# Initialize blockchain
blockchain = MaterialBlockchain(difficulty=2)

# Register material certificate
cert = MaterialCertificate(
    material_id="PANEL-001",
    material_type="Acoustic Panel",
    manufacturer="AcoustiCorp",
    batch_number="AC-2024-001",
    production_date="2024-01-15",
    certifications=["ISO 9001", "LEED Gold"],
    properties={"nrc": 0.85, "fire_rating": "Class A"},
    inspector_id="INS-001",
    inspection_date="2024-01-16"
)
blockchain.register_certificate(cert)

# Track supply chain
blockchain.record_transfer("PANEL-001", "Manufacturer", "Distributor", 100, "sqm")
blockchain.record_transfer("PANEL-001", "Distributor", "Contractor", 50, "sqm")
blockchain.record_usage("PANEL-001", "PROJECT-001", 25, "sqm")

# Mine transactions
blockchain.mine_pending_transactions()

# Verify
verification = blockchain.verify_certificate("PANEL-001")
```

### Pattern 7: System Orchestration

```python
from system_orchestrator import SystemOrchestrator, WorkflowDefinition, WorkflowStep

# Initialize orchestrator
orchestrator = SystemOrchestrator()

# Register all components
from ceiling_panel_calc import CeilingPanelCalculator
from quantum_optimizer import CeilingLayoutOptimizer

orchestrator.register_component("calculator", "core", CeilingPanelCalculator)
orchestrator.register_component("optimizer", "optimization", CeilingLayoutOptimizer())

# Initialize
orchestrator.initialize_all()

# Execute workflow
execution = orchestrator.execute_workflow("full_calculation", {
    "length": 5000,
    "width": 4000
})

# Check status
status = orchestrator.get_system_status()
```

---

## Data Flow Architecture

### Complete System Data Flow

```
USER INPUT
    │
    ▼
┌─────────────────┐
│ config_manager  │ ← JSON/CLI/Interactive
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ site_planner    │────▶│ multi_story_    │
│ (zoning check)  │     │ designer        │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ structural_     │◀───▶│ mep_systems     │
│ engine          │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│           ceiling_panel_calc            │
│  (per-room panel layout calculation)    │
└────────────────────┬────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ quantum_    │ │reinforcement│ │ emotional_  │
│ optimizer   │ │ _optimizer  │ │ design_opt  │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       └───────────────┼───────────────┘
                       ▼
         ┌─────────────────────────┐
         │   OPTIMIZED LAYOUT      │
         └────────────┬────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    ▼                 ▼                 ▼
┌────────┐      ┌──────────┐      ┌──────────┐
│renderer│      │ SVG/DXF  │      │blockchain│
│ _3d    │      │Generator │      │_verifier │
└───┬────┘      └────┬─────┘      └────┬─────┘
    │                │                  │
    ▼                ▼                  ▼
┌────────┐      ┌──────────┐      ┌──────────┐
│OBJ/STL │      │SVG/DXF   │      │Verified  │
│GLTF    │      │Files     │      │Materials │
└────────┘      └──────────┘      └──────────┘
```

---

## Quick Start Guide

### Installation

```bash
# Clone repository
git clone https://github.com/daringwonko/ceiling.git
cd ceiling

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

### Basic Usage

```bash
# Run basic calculation
python ceiling_panel_calc.py

# Run with configuration
python -c "
from config_manager import ConfigManager
from ceiling_panel_calc import Dimensions, Gap, CeilingPanelCalculator

mgr = ConfigManager()
mgr.parse_cli_args(['--length', '6000', '--width', '5000'])
config = mgr.get_config()

dims = Dimensions(config.ceiling_width_mm, config.ceiling_length_mm)
gap = Gap(config.perimeter_gap_mm, config.panel_gap_mm)
calc = CeilingPanelCalculator(dims, gap)
result = calc.calculate()
print(f'Panels: {result.panel_count}')
"

# Run tests
python -m pytest test_integration.py -v

# Run specific module demos
python quantum_optimizer.py
python renderer_3d.py
python blockchain_verifier.py
python monitoring_dashboard.py
python system_orchestrator.py
```

### Interactive Mode

```bash
python config_manager.py --interactive
```

---

## API Reference Summary

### Core Classes

| Class | Module | Primary Methods |
|-------|--------|-----------------|
| `CeilingPanelCalculator` | ceiling_panel_calc | `calculate() -> LayoutResult` |
| `QuantumInspiredOptimizer` | quantum_optimizer | `optimize(func, bounds) -> OptimizationResult` |
| `CeilingLayoutOptimizer` | quantum_optimizer | `optimize_layout(**params) -> dict` |
| `CeilingPanel3DGenerator` | renderer_3d | `generate_layout_mesh(**params) -> Mesh` |
| `MeshExporter` | renderer_3d | `to_obj()`, `to_stl()`, `to_gltf()` |
| `MaterialBlockchain` | blockchain_verifier | `register_certificate()`, `verify_certificate()` |
| `MonitoringDashboard` | monitoring_dashboard | `register_sensor()`, `ingest_reading()` |
| `MultiStoryDesigner` | multi_story_designer | `add_floor()`, `check_code_compliance()` |
| `SitePlanner` | site_planner | `analyze_site() -> SiteAnalysisResult` |
| `SystemOrchestrator` | system_orchestrator | `register_component()`, `execute_workflow()` |
| `CodeAnalyzer` | code_analyzer | `analyze_file()`, `analyze_directory()` |

### Data Classes

| Class | Module | Key Fields |
|-------|--------|------------|
| `Dimensions` | ceiling_panel_calc | `width_mm`, `length_mm` |
| `Gap` | ceiling_panel_calc | `edge_gap_mm`, `spacing_gap_mm` |
| `LayoutResult` | ceiling_panel_calc | `panel_count`, `panel_width_mm`, `panel_length_mm` |
| `Mesh` | renderer_3d | `vertices`, `faces`, `materials` |
| `Alert` | monitoring_dashboard | `severity`, `message`, `timestamp` |
| `Floor` | multi_story_designer | `level`, `spaces`, `gross_area_sqm` |

---

## Configuration Guide

### Environment Variables

```bash
# Security
export MQTT_USERNAME="your_username"
export MQTT_PASSWORD="your_password"
export ENCRYPTION_KEY="your_fernet_key"
export JWT_SECRET="your_jwt_secret"

# Logging
export LOG_LEVEL="INFO"  # DEBUG, INFO, WARNING, ERROR
export LOG_DIR="./logs"

# Database (if using)
export DATABASE_URL="sqlite:///ceiling.db"
```

### JSON Configuration Example

```json
{
  "ceiling_length_mm": 6000,
  "ceiling_width_mm": 5000,
  "perimeter_gap_mm": 200,
  "panel_gap_mm": 50,
  "material_name": "led_panel_white",
  "waste_factor": 0.15,
  "optimization_strategy": "balanced",
  "export_dxf": true,
  "export_svg": true,
  "export_json": true,
  "output_dir": "./output"
}
```

---

## File Organization Recommendation

```
ceiling/
├── __init__.py
├── requirements.txt
├── .gitignore
├── CLAUDE.md                    # This documentation
├── ARCHITECTURE.md              # This file
│
├── core/
│   ├── __init__.py
│   ├── ceiling_panel_calc.py
│   ├── config_manager.py
│   └── logging_config.py
│
├── optimization/
│   ├── __init__.py
│   ├── quantum_optimizer.py
│   ├── reinforcement_optimizer.py
│   ├── emotional_design_optimizer.py
│   └── climate_scenario_modeler.py
│
├── design/
│   ├── __init__.py
│   ├── structural_engine.py
│   ├── mep_systems.py
│   ├── multi_story_designer.py
│   └── site_planner.py
│
├── output/
│   ├── __init__.py
│   └── renderer_3d.py
│
├── iot/
│   ├── __init__.py
│   ├── iot_sensor_network.py
│   ├── iot_security.py
│   ├── iot_integration.py
│   └── monitoring_dashboard.py
│
├── analytics/
│   ├── __init__.py
│   ├── predictive_analytics.py
│   ├── predictive_maintenance.py
│   ├── energy_optimization.py
│   └── code_analyzer.py
│
├── blockchain/
│   ├── __init__.py
│   └── blockchain_verifier.py
│
├── orchestration/
│   ├── __init__.py
│   └── system_orchestrator.py
│
├── web/
│   ├── __init__.py
│   └── gui_server.py
│
└── tests/
    ├── __init__.py
    ├── test_integration.py
    ├── test_ceiling_calc.py
    └── test_*.py
```

---

**Document Version:** 2.0
**Last Updated:** January 11, 2026
**Author:** Claude Code Integration Assistant
