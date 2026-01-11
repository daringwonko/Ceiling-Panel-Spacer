# Ceiling Panel Calculator - API Reference

## Module Overview

The Ceiling Panel Calculator is organized into several modules:

| Module | Purpose |
|--------|---------|
| `ceiling_panel_calc.py` | Core calculation and export functionality |
| `config_manager.py` | Configuration management (JSON, CLI, interactive) |
| `examples.py` | Runnable examples demonstrating usage |

## Core Classes

### CeilingDimensions

Represents ceiling dimensions in millimeters.

```python
from ceiling_panel_calc import CeilingDimensions

@dataclass
class CeilingDimensions:
    length_mm: float    # X-axis dimension
    width_mm: float     # Y-axis dimension
```

**Methods:**

```python
def to_meters(self) -> Tuple[float, float]:
    """Convert dimensions to meters"""
    return (self.length_mm / 1000, self.width_mm / 1000)
```

**Example:**

```python
ceiling = CeilingDimensions(length_mm=5000, width_mm=4000)
meters = ceiling.to_meters()  # (5.0, 4.0)
```

---

### PanelSpacing

Represents gap specifications in millimeters.

```python
@dataclass
class PanelSpacing:
    perimeter_gap_mm: float   # Gap around ceiling edge
    panel_gap_mm: float       # Gap between panels
```

**Example:**

```python
spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
```

---

### PanelLayout

Represents calculated panel layout result.

```python
@dataclass
class PanelLayout:
    panel_width_mm: float      # Individual panel width
    panel_length_mm: float     # Individual panel length
    panels_per_row: int        # Number of panels in row (Y)
    panels_per_column: int     # Number of panels in column (X)
    total_panels: int          # Total panels = row × column
    total_coverage_sqm: float  # Total area covered
```

**Example:**

```python
layout = calc.calculate_optimal_layout()
print(f"{layout.total_panels} panels of {layout.panel_width_mm:.0f}×{layout.panel_length_mm:.0f}mm")
```

---

### Material

Represents material/finish specification.

```python
@dataclass
class Material:
    name: str              # e.g., "led_panel_white"
    category: str          # 'lighting', 'acoustic', 'drywall', 'metal', 'custom'
    color: str             # e.g., "white"
    reflectivity: float    # 0.0 to 1.0
    cost_per_sqm: float    # Price per square meter
    notes: str             # Optional notes
```

**Example:**

```python
material = Material(
    name="led_panel_white",
    category="lighting",
    color="white",
    reflectivity=0.8,
    cost_per_sqm=450.0,
    notes="Dimmable, 4000K color temperature"
)
```

---

## CeilingPanelCalculator

Main calculation engine.

```python
class CeilingPanelCalculator:
    # Class constants
    MAX_PANEL_DIMENSION_MM = 2400
    PRACTICAL_PANEL_COUNT_RANGE = (4, 16)
```

### Constructor

```python
def __init__(self, ceiling: CeilingDimensions, spacing: PanelSpacing):
    """Initialize calculator with ceiling and spacing parameters"""
```

**Example:**

```python
ceiling = CeilingDimensions(length_mm=6000, width_mm=5000)
spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)
calc = CeilingPanelCalculator(ceiling, spacing)
```

### calculate_optimal_layout()

```python
def calculate_optimal_layout(self, optimization_strategy: str = 'balanced') -> PanelLayout:
    """
    Calculate optimal panel layout.
    
    Args:
        optimization_strategy: "balanced" (default) or "minimize_seams"
    
    Returns:
        PanelLayout: Optimal layout meeting all constraints
    
    Raises:
        ValueError: If layout impossible with given constraints
    
    Constraints:
        - Max panel dimension: 2400mm
        - Perimeter gaps must not exceed available space
        - Panel dimensions must be positive
    """
```

**Optimization Strategies:**

- **"balanced"** (default): Optimizes for reasonable panel count, balanced sizing, and good coverage
- **"minimize_seams"**: Prefers fewer panels, minimizing connections/seams

**Example:**

```python
# Default balanced strategy
layout = calc.calculate_optimal_layout()

# Minimize seams strategy
layout = calc.calculate_optimal_layout(optimization_strategy='minimize_seams')
```

### validate_layout()

```python
def validate_layout(self, layout: PanelLayout) -> bool:
    """
    Validate that layout fits within ceiling constraints.
    
    Args:
        layout: Layout to validate
    
    Returns:
        bool: True if layout is valid, False otherwise
    """
```

**Example:**

```python
is_valid = calc.validate_layout(layout)
if is_valid:
    print("Layout is valid!")
```

---

## ProjectExporter

Exports project data in multiple formats.

```python
class ProjectExporter:
    def __init__(
        self,
        ceiling: CeilingDimensions,
        spacing: PanelSpacing,
        layout: PanelLayout,
        material: Material,
        waste_factor: float = 0.15,
        labor_multiplier: Optional[float] = None
    ):
        """
        Initialize project exporter.
        
        Args:
            ceiling: Ceiling dimensions
            spacing: Spacing configuration
            layout: Calculated panel layout
            material: Material specification
            waste_factor: Material waste allowance (0.15 = 15%, default)
            labor_multiplier: Labor cost multiplier (e.g., 0.25 = 25% of material cost)
                            None = no labor cost calculation
        """
```

**Example:**

```python
exporter = ProjectExporter(
    ceiling=ceiling,
    spacing=spacing,
    layout=layout,
    material=material,
    waste_factor=0.15,
    labor_multiplier=0.25  # 25% of material cost
)
```

### Methods

#### generate_report()

```python
def generate_report(self) -> str:
    """
    Generate text report with project details.
    
    Returns:
        str: Formatted project report including dimensions, layout, costs
    """
```

**Example:**

```python
report = exporter.generate_report()
print(report)
```

**Output includes:**

- Ceiling dimensions and area
- Panel layout details
- Material specifications
- Cost breakdown (material, waste, labor, total)

#### export_json()

```python
def export_json(self, output_file: str) -> None:
    """
    Export project to JSON file.
    
    Args:
        output_file: Path to output JSON file
    """
```

**Example:**

```python
exporter.export_json('project_output.json')
```

**JSON Structure:**

```json
{
  "metadata": {
    "version": "2.0",
    "timestamp": "2024-01-15T10:30:00",
    "calculator_version": "1.0"
  },
  "ceiling": {
    "length_mm": 6000,
    "width_mm": 5000,
    "area_sqm": 30.0
  },
  "spacing": {
    "perimeter_gap_mm": 200,
    "panel_gap_mm": 200
  },
  "layout": {
    "panel_width_mm": 875,
    "panel_length_mm": 1250,
    "panels_per_row": 4,
    "panels_per_column": 4,
    "total_panels": 16,
    "coverage_sqm": 20.0
  },
  "material": {
    "name": "led_panel_white",
    "category": "lighting",
    "cost_per_sqm": 450.0
  },
  "costs": {
    "material_coverage_sqm": 20.0,
    "waste_coverage_sqm": 3.0,
    "total_coverage_sqm": 23.0,
    "material_cost": 9000.0,
    "waste_cost": 1350.0,
    "total_material_cost": 10350.0,
    "labor_multiplier": 0.25,
    "labor_cost": 2587.5,
    "total_cost": 12937.5
  }
}
```

#### export_dxf()

```python
def export_dxf(self, output_file: str, scale: float = 1.0) -> None:
    """
    Export ceiling layout to DXF file (AutoCAD format).
    
    Args:
        output_file: Path to output DXF file
        scale: Scale factor for DXF output (default 1.0)
    """
```

**Example:**

```python
exporter.export_dxf('ceiling_layout.dxf', scale=1.0)
```

#### export_svg()

```python
def export_svg(self, output_file: str, scale: float = 0.1) -> None:
    """
    Export ceiling layout to SVG file (vector graphics).
    
    Args:
        output_file: Path to output SVG file
        scale: Scale factor for display (default 0.1 = 1mm becomes 0.1px)
    """
```

**Example:**

```python
exporter.export_svg('ceiling_layout.svg', scale=0.1)
```

---

## MaterialLibrary

Provides predefined material specifications.

```python
class MaterialLibrary:
    @staticmethod
    def get_material(material_name: str) -> Material:
        """
        Get predefined material by name.
        
        Args:
            material_name: Name of material (e.g., 'led_panel_white')
        
        Returns:
            Material: Material specification
        
        Raises:
            ValueError: If material not found
        """
    
    @staticmethod
    def list_materials() -> Dict[str, str]:
        """List available materials"""
    
    @staticmethod
    def add_custom_material(material: Material) -> None:
        """Add custom material to library"""
```

**Example:**

```python
material = MaterialLibrary.get_material('led_panel_white')

# List available
available = MaterialLibrary.list_materials()
print(available)

# Add custom material
custom = Material(
    name="custom_acoustic",
    category="acoustic",
    color="off_white",
    reflectivity=0.5,
    cost_per_sqm=250.0
)
MaterialLibrary.add_custom_material(custom)
```

---

## ConfigManager

Configuration management system.

```python
from config_manager import ConfigManager, CalculatorConfig

class ConfigManager:
    def __init__(self):
        """Initialize with default configuration"""
    
    def load_json_config(self, config_file: str) -> None:
        """Load configuration from JSON file"""
    
    def parse_cli_args(self, args: Optional[list] = None) -> None:
        """Parse command-line arguments"""
    
    def prompt_interactive(self) -> None:
        """Interactive configuration mode"""
    
    def get_config(self) -> CalculatorConfig:
        """Get configuration as CalculatorConfig object"""
    
    def save_config(self, output_file: str) -> None:
        """Save configuration to JSON file"""
    
    def print_summary(self) -> None:
        """Print configuration summary"""
```

**Example:**

```python
# From JSON file
manager = ConfigManager()
manager.load_json_config('my_config.json')

# From CLI arguments
manager = ConfigManager()
manager.parse_cli_args(['--length', '6000', '--width', '5000'])

# Interactive mode
manager = ConfigManager()
manager.parse_cli_args(['--interactive'])

# Get configuration
config = manager.get_config()

# Save configuration
manager.save_config('saved_config.json')
```

---

## Complete Example Workflow

```python
from ceiling_panel_calc import (
    CeilingDimensions, PanelSpacing, CeilingPanelCalculator,
    ProjectExporter, MaterialLibrary
)

# 1. Define ceiling and spacing
ceiling = CeilingDimensions(length_mm=6000, width_mm=5000)
spacing = PanelSpacing(perimeter_gap_mm=200, panel_gap_mm=200)

# 2. Calculate optimal layout
calc = CeilingPanelCalculator(ceiling, spacing)
layout = calc.calculate_optimal_layout(optimization_strategy='balanced')

# 3. Get material
material = MaterialLibrary.get_material('led_panel_white')

# 4. Create exporter with cost parameters
exporter = ProjectExporter(
    ceiling=ceiling,
    spacing=spacing,
    layout=layout,
    material=material,
    waste_factor=0.15,
    labor_multiplier=0.25
)

# 5. Export in multiple formats
exporter.generate_report()
exporter.export_json('project.json')
exporter.export_dxf('layout.dxf')
exporter.export_svg('layout.svg')

print("Project exported successfully!")
```

---

## Error Handling

### Common Exceptions

```python
try:
    calc = CeilingPanelCalculator(ceiling, spacing)
    layout = calc.calculate_optimal_layout()
except ValueError as e:
    print(f"Calculation error: {e}")

try:
    material = MaterialLibrary.get_material('unknown')
except ValueError as e:
    print(f"Material not found: {e}")

try:
    manager.load_json_config('nonexistent.json')
except FileNotFoundError as e:
    print(f"Config file not found: {e}")
```

---

## Version Information

- **API Version:** 2.0
- **Algorithm Version:** 2.0 (Practical multi-panel with 2400mm constraint)
- **Last Updated:** January 2024
- **Status:** Production-ready

