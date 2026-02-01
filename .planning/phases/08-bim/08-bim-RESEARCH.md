# Phase 8: BIM Workbench - Research

**Researched:** February 1, 2026
**Domain:** Building Information Modeling (BIM), IFC file generation, IfcOpenShell
**Confidence:** MEDIUM-HIGH

## Summary

This research establishes the foundation for Phase 8 BIM workbench development, integrating the ceiling panel calculator with openBIM ecosystems. The core finding is that **IfcOpenShell Python API** (v0.8.4) provides the most direct integration path for programmatic IFC generation from ceiling panel calculations, with **Bonsai** (Blender BIM) as the recommended visualization platform.

The ceiling panel calculator should export IFC 4.3.2.0 files using the `IfcCovering` entity with appropriate property sets (`Pset_CoveringCommon`, `Pset_CoveringThermalProperties`) plus custom calculator properties (`Pset_CeilingSpacerCalculation`). LOD 350 represents the minimum deliverable detail level for design-phase BIM, with LOD 400 for construction documentation.

Classification should follow **UniFormat** (C10 series) for ceiling elements, and the system should support **COBie 2024** requirements for facilities management handover.

**Primary recommendation:** Implement IFC export using IfcOpenShell Python API as a core dependency, creating `bim/ifc_generator.py` module with property set schema for ceiling panels.

---

## Standard Stack

### Core BIM Dependencies

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **ifcopenshell** | 0.8.4 | IFC file generation/parsing | Open-source standard, comprehensive Python API |
| **ifc煮ester** | Latest | IFC validation | buildingSMART-compliant validation |
| **bimserver-client** | Latest | BIM server integration | For collaborative workflows |

### Recommended Installation

```bash
# Core BIM dependency
pip install ifcopenshell==0.8.4

# For validation
pip install ifctester

# Optional: For Blender/Bonsai integration
# Install Blender 4.0+, then Bonsai add-on via Blender preferences
```

### Supporting Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Bonsai (Blender BIM)** | IFC visualization/editing | User-facing BIM review |
| **Blender** | 3D visualization | Presentation and documentation |
| **FreeCAD** (optional) | Parametric modeling | Complex junction modeling |
| **IFC.js** | Web-based IFC viewing | Browser-based previews |

---

## Architecture Patterns

### Recommended Project Structure

```
bim/
├── __init__.py
├── ifc_generator.py          # Core IFC export module
├── property_schemas.py       # IFC property definitions
├── spatial_structure.py      # Project/storey/space hierarchy
└── validators.py             # IFC validation utilities

tests/
├── test_ifc_export.py        # IFC generation tests
└── test_ifc_validation.py    # Schema validation tests
```

### Pattern 1: IFC Generation from Calculator Results

**Source:** ifcopenshell Python API (docs.ifcopenshell.org)

```python
# bim/ifc_generator.py
import ifcopenshell
from ifcopenshell.api import run
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class IFCPanelConfig:
    project_name: str
    author: str = "Ceiling Panel Calculator"
    organization: Optional[str] = None
    application: str = "Ceiling Panel Calculator 1.0"

class CeilingIFCGenerator:
    """Generate IFC files from ceiling panel calculations."""
    
    def __init__(self, config: IFCPanelConfig):
        self.config = config
        self.model: Optional[ifcopenshell.file] = None
    
    def generate_from_calculation(self, calc_result) -> ifcopenshell.file:
        """Generate complete IFC from calculation result."""
        self.model = ifcopenshell.api.run("project.create_file")
        
        # Setup project structure
        self._setup_project()
        self._setup_spatial_structure()
        
        # Create representation context
        context = self._create_representation_context()
        
        # Generate panels from calculation
        for panel in calc_result.panels:
            self._create_ceiling_element(panel, context)
        
        return self.model
    
    def _setup_project(self):
        """Create project hierarchy."""
        self.project = run("project.create_file", file=self.model)
        site = run("root.create_entity", file=self.model,
                   entity="IfcSite", attributes={"Name": "Project Site"})
        building = run("root.create_entity", file=self.model,
                       entity="IfcBuilding", attributes={"Name": self.config.project_name})
        self.storey = run("root.create_entity", file=self.model,
                          entity="IfcBuildingStorey", attributes={"Name": "Level 1"})
    
    def _create_ceiling_element(self, panel, context) -> ifcopenshell.entity_instance:
        """Create IfcCovering for a single panel."""
        element = run("root.create_entity", file=self.model,
                     entity="IfcCovering",
                     attributes={
                         "Name": f"Ceiling Panel {panel.id}",
                         "Description": f"Panel efficiency: {panel.efficiency:.1%}",
                         "CoveringType": "CEILING",
                     })
        
        # Add geometry (extruded profile)
        representation = self._create_panel_representation(element, panel, context)
        
        # Assign to storey (spatial containment)
        run("spatial.assign_container", file=self.model,
            product=element, container=self.storey)
        
        # Add properties
        self._add_panel_properties(element, panel)
        
        return element
    
    def _create_panel_representation(self, element, panel, context):
        """Create extruded solid geometry for panel."""
        # Create rectangular profile
        profile = ifcopenshell.api.run("profile.add_arbitrary_profile",
                                       file=self.model,
                                       profile={"coords": [
                                           (0, 0),
                                           (panel.width_mm, 0),
                                           (panel.width_mm, panel.length_mm),
                                           (0, panel.length_mm),
                                           (0, 0)
                                       ]})
        
        # Create extruded representation
        representation = ifcopenshell.api.run(
            "geometry.add_profile_representation",
            file=self.model,
            context=context,
            profile=profile,
            depth=panel.thickness_mm
        )
        
        # Assign representation to element
        run("geometry.assign_representation", file=self.model,
            product=element, representation=representation)
        
        return representation
    
    def _add_panel_properties(self, element, panel):
        """Add custom property set for calculator outputs."""
        run("pset.add_pset", file=self.model,
            product=element,
            pset_name="CeilingSpacerCalculation",
            properties={
                "PanelID": panel.id,
                "Material": panel.material,
                "Efficiency": panel.efficiency,
                "RowPosition": panel.row,
                "ColumnPosition": panel.column,
                "IsCutPanel": panel.is_cut,
                "CutDimensions": panel.cut_dimensions if panel.is_cut else None,
            })
```

### Pattern 2: Spatial Hierarchy Setup

```python
# bim/spatial_structure.py
from ifcopenshell.api import run

def create_spatial_structure(model, project_name, ceiling_elevation_mm=2800):
    """Create building spatial hierarchy."""
    # Create project
    project = run("project.create_file", file=model)
    
    # Create site
    site = run("root.create_entity", file=model,
               entity="IfcSite", attributes={"Name": "Site"})
    
    # Create building
    building = run("root.create_entity", file=model,
                   entity="IfcBuilding", attributes={"Name": project_name})
    
    # Create storey at ceiling elevation
    storey = run("root.create_entity", file=model,
                 entity="IfcBuildingStorey",
                 attributes={
                     "Name": "Level 1 - Ceiling",
                     "Elevation": ceiling_elevation_mm / 1000  # Convert mm to m
                 })
    
    # Create spaces (rooms below ceiling)
    spaces = []
    # ... create IfcSpace for each room
    
    return {"project": project, "site": site, "building": building,
            "storey": storey, "spaces": spaces}
```

### Pattern 3: Property Set Definition

```python
# bim/property_schemas.py

# Standard covering properties (from buildingSMART)
COVERING_COMMON_PSET = {
    "name": "Pset_CoveringCommon",
    "applicable_classes": ["IfcCovering"],
    "properties": [
        {"name": "Reference", "type": "IfcIdentifier"},
        {"name": "Status", "type": "IfcLabel"},
        {"name": "ServiceLife", "type": "IfcTimeMeasure"},
        {"name": "FireRating", "type": "IfcLabel"},
        {"name": "ThermalTransmittance", "type": "IfcThermalTransmittanceMeasure"},
    ]
}

# Calculator-specific properties
CEILING_SPACER_PSET = {
    "name": "Pset_CeilingSpacerCalculation",
    "applicable_classes": ["IfcCovering"],
    "properties": [
        {"name": "PanelID", "type": "IfcIdentifier"},
        {"name": "Efficiency", "type": "IfcPositiveRatioMeasure"},
        {"name": "RowPosition", "type": "IfcInteger"},
        {"name": "ColumnPosition", "type": "IfcInteger"},
        {"name": "IsCutPanel", "type": "IfcBoolean"},
        {"name": "CutLength", "type": "IfcLengthMeasure"},
        {"name": "CutWidth", "type": "IfcLengthMeasure"},
        {"name": "MaterialGrade", "type": "IfcLabel"},
    ]
}

# Quantity take-off
CEILING_QUANTITIES = {
    "name": "Qto_CoveringBaseQuantities",
    "applicable_classes": ["IfcCovering"],
    "quantities": [
        {"name": "Area", "type": "IfcAreaMeasure"},
        {"name": "Perimeter", "type": "IfcLengthMeasure"},
        {"name": "Weight", "type": "IfcMassMeasure"},
    ]
}
```

---

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IFC schema validation | Custom parser | ifcopenshell + ifctester | Handles all IFC versions, schema validation, IDS checking |
| Geometry serialization | Custom extrusion | ifcopenshell.geom module | Proper CSG, BREP, swept solid support |
| Property set management | Custom dictionaries | ifcopenshell.api.pset functions | Schema compliance, inheritance handling |
| Unit conversion | Custom formulas | ifcopenshell.util.unit | Handles all IFC unit types correctly |
| Spatial containment | Custom relationships | ifcopenshell.api.spatial | Proper IFC hierarchy compliance |
| IFC file parsing | Regex/file reading | ifcopenshell.open() | Complete entity graph, type safety |

**Key insight:** IfcOpenShell provides a comprehensive, buildingSMART-compliant API for all IFC operations. Attempting custom implementations will result in files that fail validation in commercial BIM tools.

---

## Common Pitfalls

### Pitfall 1: Wrong Ceiling Entity Type

**What goes wrong:** Using `IfcSlab` instead of `IfcCovering` for ceiling panels.

**Why it happens:** `IfcSlab` is commonly used for floor slabs, leading to confusion. Ceiling panels are coverings, not structural elements.

**How to avoid:** Always use `IfcCovering` with `CoveringType` enum:
- `CEILING` - General ceiling covering
- `CEILING_TILE` - Individual ceiling tiles
- `CEILING_PANEL` - Large ceiling panels
- `SUSPENDED_CEILING` - Dropped ceiling systems

**Warning signs:** BIM software classifies ceiling as floor/roof, quantity take-offs show wrong assemblies.

### Pitfall 2: Missing Spatial Containment

**What goes wrong:** Panels exist in file but are not assigned to any space or storey.

**Why it happens:** Creating elements without assigning them to spatial containers via `IfcRelContainedInSpatialStructure`.

**How to avoid:** Always use `run("spatial.assign_container", ...)` after creating elements:
```python
run("spatial.assign_container", file=model,
    product=element, container=storey)
```

**Warning signs:** IFC opens empty in BIM software, elements not visible in 3D view.

### Pitfall 3: Incorrect Unit Handling

**What goes wrong:** Using millimeters directly without unit assignment.

**Why it happens:** IFC defaults to meters for length values. Passing mm values without conversion produces tiny geometry.

**How to avoid:** Convert all lengths to meters, or explicitly define unit assignment:
```python
# All dimensions in meters
depth=0.015  # 15mm panel thickness
elevation=2.8  # 2800mm ceiling height

# Or define custom units (less common)
```

**Warning signs:** Geometry is 1000x smaller than expected, elements at wrong elevations.

### Pitfall 4: Custom Property Names Not Compliant

**What goes wrong:** Using arbitrary property names that fail validation.

**Why it happens:** Adding properties without following buildingSMART naming conventions.

**How to avoid:** Use `Pset_{Name}_{PropertyName}` pattern and follow bSDD conventions:
```python
# Good: follows convention
run("pset.add_pset", file=model, pset_name="CeilingSpacerCalculation", ...)

# Bad: arbitrary name
run("pset.add_pset", file=model, pset_name="MyCustomProps", ...)
```

**Warning signs:** IDS validation fails, properties not recognized in BIM software.

---

## Code Examples

### Complete IFC Export Workflow

```python
# bim/ifc_generator.py - Complete example
import ifcopenshell
from ifcopenshell.api import run
from core.ceiling_panel_calc import CeilingPanelCalculator

def export_ceiling_to_ifc(calculation_input, output_path):
    """Export ceiling panel calculation to IFC 4.3.2.0."""
    
    # Run calculation
    calculator = CeilingPanelCalculator()
    result = calculator.calculate(calculation_input)
    
    # Configure IFC generation
    config = IFCPanelConfig(
        project_name=result.project_name or "Ceiling Project",
        author="Ceiling Panel Calculator",
        organization="Project Team",
    )
    
    # Generate IFC
    generator = CeilingIFCGenerator(config)
    model = generator.generate_from_calculation(result)
    
    # Write file
    model.write(output_path)
    
    # Validate
    from ifctester import Validator
    validator = Validator(model)
    if validator.validate():
        print(f"IFC validation passed: {output_path}")
    else:
        print(f"IFC validation errors: {validator.errors}")
    
    return model
```

### CLI Integration

```python
# cli/commands.py
import click
from bim.ifc_generator import export_ceiling_to_ifc

@click.command()
@click.argument("input_file", type=click.Path(exists=True))
@click.option("--output", "-o", default="ceiling.ifc", help="Output IFC file")
@click.option("--project", "-p", help="Project name")
def ifc_export(input_file, output, project):
    """Export ceiling calculation to IFC format."""
    import yaml
    with open(input_file) as f:
        calculation_input = yaml.safe_load(f)
    
    if project:
        calculation_input["project_name"] = project
    
    export_ceiling_to_ifc(calculation_input, output)
    click.echo(f"Exported to {output}")
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom IFC parser | ifcopenshell Python API | 2015+ | Schema-compliant, validated output |
| Closed-source BIM SDKs | Open-source ifcopenshell | 2015+ | Free licensing, community support |
| IFC 2x3 | IFC 4.3.2.0 | 2024 | Better covering types, COBie 2024 |
| Manual property assignment | API-based pset functions | 2020+ | Consistent schema compliance |
| Single-file export | Incremental/streaming | 2022+ | Handles large models better |

**Deprecated/outdated:**
- IFC 2x3 TC1 - Use IFC 4.3.2.0 instead
- Custom geometry exporters - Use ifcopenshell.geom
- Hard-coded property values - Use property sets with inheritance

---

## Open Questions

1. **BIM Software Compatibility**
   - What we know: IfcOpenShell generates IFC 4.3.2.0 files
   - What's unclear: Validation against all major BIM tools (Revit, ArchiCAD, Navisworks)
   - Recommendation: Test export with free trials before finalizing

2. **Spacer System Properties**
   - What we know: Need custom pset for calculator outputs
   - What's unclear: Whether buildingSMART has existing properties for spacer optimization
   - Recommendation: Check bSDD for ceiling spacer extensions before defining custom

3. **Performance for Large Ceilings**
   - What we know: ifcopenshell handles thousands of elements
   - What's unclear: Performance limits for very large ceiling systems (100+ rooms)
   - Recommendation: Implement incremental writing for large projects

4. **Bi-directional Updates**
   - What we know: IfcOpenShell can modify existing files
   - What's unclear: User need for editing panels in BIM tool and re-importing
   - Recommendation: Start with export-only, add import if requested

---

## Sources

### Primary (HIGH confidence)
- IfcOpenShell Documentation: https://docs.ifcopenshell.org/ - Official Python API reference
- IfcOpenShell GitHub: https://github.com/IfcOpenShell/IfcOpenShell - Latest code and examples
- Bonsai Documentation: https://docs.bonsaibim.org/ - Blender BIM integration guide
- IFC 4.3.2.0 Schema: https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/ - Official specification

### Secondary (MEDIUM confidence)
- buildingSMART Technical: https://technical.buildingsmart.org/ - Standards documentation
- LOD Specification 2025: https://bimforum.org/lod - BIM Forum official release
- COBie 2024: https://www.buildingsmart.org/standards/cobie/ - Handover standard

### Tertiary (LOW confidence)
- FreeCAD BIM Workbench: https://wiki.freecad.org/Arch_Workbench - Community documentation

---

## Metadata

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | ifcopenshell is de facto open-source standard |
| Architecture | MEDIUM | Patterns from documentation, needs implementation validation |
| Pitfalls | MEDIUM | Common issues documented, edge cases untested |
| Integration | MEDIUM | Based on IfcOpenShell API, not project-specific |

**Research date:** February 1, 2026
**Valid until:** October 2026 (IFC 4.3.2 stable, ifcopenshell 0.8.x active development)