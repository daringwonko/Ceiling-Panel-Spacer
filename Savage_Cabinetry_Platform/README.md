# Savage Cabinetry Platform

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/savagecabinetry/platform)
[![Python](https://img.shields.io/badge/python-3.8+-green.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Professional Kitchen Design and Ceiling Panel Calculation Platform**

Savage Cabinetry Platform is a comprehensive software solution for architects, contractors, and interior designers working with suspended ceiling systems and kitchen installations. It provides accurate panel calculations, cost estimates, CAD exports, and real-time 3D visualization.

## 🌟 Features

### 🧮 Core Calculation Engine
- **Practical Panel Layouts** - Generates installer-friendly panel configurations
- **Multi-Material Support** - Standard tiles, acoustic panels, LED integrated systems
- **Constraint-Aware** - Respects transportation and installation limitations
- **Cost Estimation** - Real-time pricing with waste allowances

### 🎨 User Interfaces
- **Command-Line Interface** - Full-featured terminal access for automation
- **Web-Based GUI** - Professional 3D visualization with orbit controls
- **Integrated Workflow** - Seamless transition between design tools

### 📤 Export Capabilities
- **CAD Compatible** - DXF files for AutoCAD, Revit integration
- **Vector Graphics** - SVG blueprints for documentation
- **Structured Data** - JSON exports for downstream systems
- **Technical Reports** - Comprehensive specifications

### 🏗️ Professional Features
- **Input Validation** - Prevents impossible configurations
- **Error Recovery** - Graceful handling of edge cases
- **Configuration Management** - Customizable defaults and settings
- **Extensible Architecture** - Plugin-ready for custom requirements

## 🚀 Quick Start

### Launch Platform
```bash
# Method 1: Simple launcher
./launch.sh

# Method 2: Direct Python
python3 main_platform_entry.py

# Method 3: CLI mode
python3 savage_cli.py calculate --help
```

### Basic Design Calculation
```bash
# Calculate ceiling panels for 16ft × 12ft kitchen
python3 savage_cli.py calculate \
  --width 4800 \
  --length 3600 \
  --material standard_tiles

# Get cost estimate
python3 savage_cli.py estimate \
  --width 4800 \
  --length 3600 \
  --material acoustic_panels
```

### Export Design Files
```bash
# Export complete design package
python3 savage_cli.py calculate --width 4800 --length 3600
python3 savage_cli.py export json text dxf svg --output-dir my_project/
```

### Launch GUI
```bash
./launch.sh --gui
# Then open http://localhost:5000
```

## 📋 Available Materials

| Material | Cost/m² | Thickness | Use Case |
|----------|---------|-----------|----------|
| Standard Tiles | $25 | 15mm | Basic suspended ceilings |
| Acoustic Panels | $45 | 25mm | Sound dampening |
| Mineral Fiber | $35 | 20mm | Fire-rated installations |
| Wood Panels | $85 | 18mm | Premium finishes |
| LED Panels | $120 | 35mm | Integrated lighting |

## 🏛️ Architecture

```
Savage Cabinetry Platform
├── main_platform_entry.py     # Unified application entry
├── savage_cli.py             # CLI command processor
├── launch.sh                 # Simple launcher script
└── Savage_Cabinetry_Platform/
    ├── kitchen_orchestrator.py  # Central calculation engine
    ├── cli_interface.py        # CLI command handling
    ├── config.py              # Platform configuration
    └── __init__.py           # Package initialization
```

## 🔧 Installation

### Prerequisites
- Python 3.8 or later
- pip package manager

### Install Package
```bash
# Clone repository
git clone [repository-url]
cd savage-cabinetry-platform

# Install with full features (recommended)
pip install -e .[full]

# Or install minimal version
pip install -e .
```

### Verify Installation
```bash
# Check platform status
python3 main_platform_entry.py --mode status

# Test CLI interface
python3 savage_cli.py --help
```

## 📖 Usage Examples

### Example 1: Small Conference Room
```bash
python3 savage_cli.py calculate \
  --width 4800 \
  --length 3600 \
  --material acoustic_panels \
  --edge-gap 200 \
  --format json
```

**Output:**
```json
{
  "panels_count": 16,
  "panel_dimensions": [{"width_mm": 600, "length_mm": 600}],
  "estimated_cost": 172.80,
  "warnings": []
}
```

### Example 2: Large Commercial Kitchen
```bash
python3 savage_cli.py calculate \
  --width 8000 \
  --length 6000 \
  --material led_panels
```

Generates layout for premium lighting-integrated ceiling system.

### Example 3: Cost Estimation
```bash
python3 savage_cli.py estimate \
  --width 4800 \
  --length 3600 \
  --material mineral_fiber
```

**Quick Estimate:**
```
Material Cost: $414.00
Waste Allowance: $62.10
Total Estimated Cost: $476.10
Area: 17.28 sqm
```

## 🎛️ Configuration

### User Configuration
Create `~/.savage_cabinetry/config.json`:

```json
{
  "defaults": {
    "material": "acoustic_panels",
    "edge_gap_mm": 250,
    "waste_factor": 1.20
  },
  "materials": {
    "custom_tile": {
      "name": "Custom Ceiling Tile",
      "cost_per_sqm": 55.0,
      "thickness_mm": 20,
      "weight_kg_per_sqm": 10.0
    }
  }
}
```

### Material Definition
```json
{
  "name": "Material Name",
  "cost_per_sqm": 25.00,
  "thickness_mm": 15,
  "weight_kg_per_sqm": 8.5,
  "description": "Optional description"
}
```

## 🛠️ Development

### Project Structure
```
├── main_platform_entry.py      # Main application
├── savage_cli.py              # CLI entry point
├── launch.sh                  # Launcher script
├── requirements.txt           # Dependencies
├── setup.py                  # Package setup
├── Savage_Cabinetry_Platform/ # Core platform
│   ├── __init__.py
│   ├── kitchen_orchestrator.py
│   ├── cli_interface.py
│   └── config.py
├── gui_server.py            # Web interface (optional)
├── gui_requirements.txt      # GUI dependencies (optional)
└── README.md                 # This file
```

### Testing
```bash
# Run platform tests
python3 -m pytest

# Test CLI interface
python3 savage_cli.py status

# Test platform setup
python3 main_platform_entry.py --mode setup
```

### Extending Platform
```python
from Savage_Cabinetry_Platform.kitchen_orchestrator import KitchenDesignOrchestrator

# Custom orchestrator
class CustomOrchestrator(KitchenDesignOrchestrator):
    def calculate_ceiling_panels(self, params):
        # Custom logic here
        return super().calculate_ceiling_panels(params)
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚨 Important Notes

### Algorithm Limitations
- Current version generates multiple smaller panels instead of single oversized ones
- Maximum panel size capped at 2400mm for practical installation
- Transportation constraints considered for panel sizing

### CAD Export
- DXF export requires `ezdxf` library for full CAD compatibility
- Fallback DXF generator available but limited
- SVG exports scale appropriately for most use cases

### Performance
- Calculations complete in <100ms for typical kitchen sizes
- GUI interface optimized for smooth 3D interactions
- Memory usage scales with project complexity

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/savagecabinetry/platform/issues)
- **Documentation:** [Wiki](https://github.com/savagecabinetry/platform/wiki)
- **Email:** support@savagecabinetry.com

## 🗺️ Roadmap

### Phase 1 (Current): Foundation ✓
- Core calculation engine
- CLI and GUI interfaces
- Basic export capabilities

### Phase 2: Professional Features (Q2 2026)
- Advanced cost optimization
- Multi-room projects
- User account management

### Phase 3: Enterprise Integration (Q3 2026)
- BIM/CAD system integration
- Supplier portal
- Manufacturing export

### Phase 4: Advanced Visualization (Q4 2026)
- VR walkthrough
- Augmented reality preview
- Real-time collaboration

---

**Built for professionals, by professionals.**  
*Savage Cabinetry Platform - Version 1.0.0*