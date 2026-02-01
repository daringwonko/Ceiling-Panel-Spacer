# BIM Data Standards Research: Ceiling Panel Systems

**Research Date:** February 1, 2026
**Research Mode:** Ecosystem Survey
**Confidence Level:** MEDIUM-HIGH

## Executive Summary

This research document establishes the BIM data standards framework for ceiling panel systems, encompassing IFC schema specifications, property sets, Level of Development (LOD) requirements, COBie compliance for facilities management, and classification systems. The findings are based on buildingSMART International specifications, IFC 4.3.2.0 schema documentation, BIM Forum LOD specifications, and industry best practices.

The ceiling panel spacer calculator should implement IFC 4.3.2.0 as the primary data standard, with compliance to Model View Definitions (MVDs) that support both coordination and facilities management use cases. Property sets should align with buildingSMART Data Dictionary (bSDD) definitions, and the system should support COBie 2024 requirements for handover to building operators. Classification should follow UniFormat for element organization and OmniClass for comprehensive categorization.

**Key Recommendations:**
- Target IFC 4.3.2.0 schema (ISO 16739-1:2024) as the primary standard
- Implement IfcCeiling and IfcCovering entities with appropriate property sets
- Design for LOD 350 minimum during design phase, LOD 400 for construction documentation
- Structure COBie compliance for Space, Asset, and System information delivery
- Use UniFormat (CSI) as primary classification, OmniClass as supplementary

---

## 1. IFC Schema for Architectural Elements

### 1.1 IFC Schema Overview

The Industry Foundation Classes (IFC) is the openBIM standard for building information modeling data exchange. The current official version is IFC 4.3.2.0, published as ISO 16739-1:2024 in April 2024. This version introduces enhanced support for architectural, structural, and building MEP systems, making it the recommended standard for ceiling panel systems.

**IFC 4.3.2.0 Release Notes:**
- ISO publication date: April 2024
- Current status: Official (supersedes IFC 4.0.2.1)
- Available formats: HTML documentation, EXPRESS, XSD/XML, OWL, RDF, TTL
- Licensed under: Creative Commons Attribution-NoDerivatives 4.0 International

### 1.2 Ceiling-Related IFC Entities

Ceiling panel systems in IFC are represented through several interconnected entities:

**Primary Entity: IfcCovering**

The `IfcCovering` entity is the primary IFC class for ceiling systems. It represents a covering or finish applied to a building element, providing a surface layer.

| Attribute | Type | Description |
|-----------|------|-------------|
| IfcCoveringTypeEnum | ENUM | Defines covering type (CEILING, WALL, FLOOR, ROOF, etc.) |
| PredefinedType | IfcCoveringTypeEnum | Specific type classification |
| LongName | IfcLabel | Descriptive name for the element |
| Description | IfcText | Additional description |
| Tag | IfcIdentifier | Unique identifier within project |

**Ceiling-Specific Predefined Types (IfcCoveringTypeEnum):**

The following enumeration values are relevant for ceiling panel systems:

| Enumeration Value | Description | Use Case |
|-------------------|-------------|----------|
| CEILING | General ceiling covering | Standard ceiling panels |
| SUSPENDED_CEILING | Dropped/suspended ceiling system | Acoustic tile ceilings |
| CEILING_TILE | Individual ceiling tiles | Modular panel systems |
| CEILING_PANEL | Large ceiling panels | Architectural ceiling systems |
| MEMBRANE | Tensioned membrane ceilings | Specialty ceiling applications |
| SOFFIT | Exposed underside of floor/roof | Industrial applications |

**Related Entities for Ceiling Systems:**

| Entity | Relationship | Purpose |
|--------|--------------|---------|
| IfcSpace | IfcRelAggregates / IfcRelContainedInSpatialStructure | Ceiling bounds the space below |
| IfcSlab | IfcRelVoidsElement | Ceiling may void floor slab |
| IfcMaterialLayerSet | IfcRelAssociatesMaterial | Material composition for layered ceilings |
| IfcElementQuantity | IfcRelDefinesByProperties | Quantities (area, count) |
| IfcPropertySet | IfcRelDefinesByProperties | Extended properties |

### 1.3 Spatial Structure Integration

Ceiling panels must be properly integrated into the IFC spatial hierarchy. The standard structure follows:

```
IfcProject
├── IfcSite (optional)
│   └── IfcBuilding
│       └── IfcBuildingStorey
│           └── IfcSpace (room below ceiling)
│           └── IfcCovering (ceiling panel system)
│           └── IfcFlowTerminal (light fixtures in ceiling)
│           └── IfcDistributionControlElement (sensors in ceiling)
```

**Containment Relationship:** Ceiling panels should use `IfcRelContainedInSpatialStructure` to link to `IfcSpace` representing the room they bound, rather than being contained within a floor slab.

**Aggregation Structure:** For complex ceiling systems:
- Level 1: IfcCovering (individual tile/panel)
- Level 2: IfcCovering (ceiling assembly/grid)
- Level 3: IfcSystem (complete ceiling system with integrated services)

### 1.4 Geometry Representation

IFC supports multiple geometry representation types, with recommendations for each use case:

| Representation Type | Use Case | Complexity |
|---------------------|----------|------------|
| SweptSolid | Simple panel geometry | Low |
| Brep | Complex panel shapes | Medium |
| CSG | Parametric panel definitions | High |
| MappedRepresentation | Repeated panel types | Low |

**Recommended for Ceiling Panels:** SweptSolid with rectangular profile is preferred for coordination and quantity take-off. Brep should be used only when panel geometry cannot be represented with sweep operations.

**Representation Context:**
- ModelViewDefinition: CoordinationView or ReferenceView
- CoordinateReferenceSystem: ProjectCRS or BuildingCRS
- Precision: 0.001 meters (1mm)

---

## 2. Property Sets (Psets) for Ceiling Panels

### 2.1 Property Set Architecture

Property sets in IFC 4.3 organize related properties into groups. For ceiling panels, properties are divided into:
- **Qto_:** Quantity sets (numeric take-off values)
- **Pset_:** Property sets (descriptive attributes)
- **Csg_:** Construction product source groups

### 2.2 Standard Property Sets for Coverings

**Pset_CoveringCommon** (Common properties for all coverings)

| Property Name | Data Type | Description | Example Value |
|---------------|-----------|-------------|---------------|
| Reference | IfcIdentifier | Manufacturer product ID | "TP-600-600-15" |
| Status | IfcLabel | Procurement status | "SPECIFIED" |
| ServiceLife | IfcTimeMeasure | Expected service duration | 25 years |
| FireRating | IfcLabel | Fire resistance rating | "Class A" |
| ThermalTransmittance | IfcThermalTransmittanceMeasure | U-value | 2.5 W/m²K |

**Pset_CoveringThermalProperties**

| Property Name | Data Type | Description | Example Value |
|---------------|-----------|-------------|---------------|
| ThermalResistance | IfcThermalResistanceMeasure | R-value | 0.4 m²K/W |
| ThermalConductivity | IfcThermalConductivityMeasure | k-value | 0.04 W/mK |
| AcousticRating | IfcLabel | Sound absorption class | "NRC 0.70" |
| SoundReductionIndex | IfcSoundTransmissionLossMeasure | STC rating | STC 35 |

### 2.3 Ceiling-Specific Property Sets

**Pset_CeilingType** (Type-level properties for ceiling systems)

```xml
<Pset_CeilingType>
  <Properties>
    <Name>PanelWidth</Name>
    <NominalValue type="ifcpositiveLengthMeasure">600 mm</NominalValue>
  </Properties>
  <Properties>
    <Name>PanelLength</Name>
    <NominalValue type="ifcpositiveLengthMeasure">600 mm</NominalValue>
  </Properties>
  <Properties>
    <Name>PanelThickness</Name>
    <NominalValue type="ifcpositiveLengthMeasure">15 mm</NominalValue>
  </Properties>
  <Properties>
    <Name>PanelFinish</Name>
    <NominalValue type="ifclabel">Gypsum Board</NominalValue>
  </Properties>
  <Properties>
    <Name>EdgeDetail</Name>
    <NominalValue type="ifclabel">Tegular</NominalValue>
  </Properties>
  <Properties>
    <Name>SurfaceTreatment</Name>
    <NominalValue type="ifclabel">Paint - White</NominalValue>
  </Properties>
  <Properties>
    <Name>Color</Name>
    <NominalValue type="ifclabel">RAL 9010</NominalValue>
  </Properties>
  <Properties>
    <Name>LightReflectance</Name>
    <NominalValue type="ifcpositiveRatioMeasure">0.85</NominalValue>
  </Properties>
</Pset_CeilingType>
```

**Pset_CeilingPanelMechanicalProperties**

| Property Name | Data Type | Description | Example |
|---------------|-----------|-------------|---------|
| CompressiveStrength | IfcPressureMeasure | Load bearing capacity | 500 kPa |
| FlexuralStrength | IfcPressureMeasure | Bending resistance | 200 kPa |
| PointLoadResistance | IfcForceMeasure | Concentrated load capacity | 100 N |
| DynamicLoadRating | IfcPressureMeasure | Foot traffic rating | 150 kg/m² |

### 2.4 COBie-Required Properties for Ceiling Panels

**COBie 2024 Property Requirements:**

| Property | IFC Property Name | Data Type | Requirement |
|----------|-------------------|-----------|-------------|
| AssetIdentifier | AssetTag | IfcIdentifier | Required at handover |
| SerialNumber | SerialNumber | IfcIdentifier | If available |
| ModelNumber | ModelLabel | IfcLabel | Recommended |
| Manufacturer | Manufacturer | IfcOrganization | Required |
| ModelReference | ProductReference | IfcIdentifier | Recommended |
| InstallationDate | InstallationDate | IfcDate | Required |
| WarrantyEndDate | WarrantyEndDate | IfcDate | Recommended |
| ExpectedLife | ServiceLife | IfcTimeMeasure | Required |
| ReplacementCost | CostRate | IfcPositiveRatioMeasure | Recommended |
| Category | Category | IfcLabel | Required (UniFormat) |
| FloorArea | FloorArea | IfcAreaMeasure | Required |
| RoomTag | RoomTag | IfcIdentifier | Required (space association) |

### 2.5 Custom Property Sets for Ceiling Panel Calculator

The ceiling panel spacer calculator should export the following extended properties:

**Pset_CeilingPanelSpacerCalculation**

| Property | Data Type | Description | Example |
|----------|-----------|-------------|---------|
| SpacingPattern | IfcLabel | Grid arrangement (square, rectangular) | "600x600 Square" |
| PanelQuantity | IfcCountMeasure | Number of panels calculated | 48 |
| TotalCoverage | IfcAreaMeasure | Total ceiling area | 17.28 m² |
| CutPanelCount | IfcCountMeasure | Panels requiring cutting | 6 |
| CutPanelPercent | IfcPositiveRatioMeasure | Waste percentage | 12.5% |
| EfficiencyRatio | IfcPositiveRatioMeasure | Coverage ratio | 0.94 |
| SpacerQuantity | IfcCountMeasure | Spacer count (special feature) | 0 |
| CutLengthTotal | IfcLengthMeasure | Total linear cut length | 7.2 m |

**Pset_CeilingSpacerSystem** (For spacer-optimized ceilings)

| Property | Data Type | Description | Example |
|----------|-----------|-------------|---------|
| SpacerType | IfcLabel | Spacer design type | "Direct Mount" |
| SpacerSpacing | IfcLengthMeasure | Spacer interval | 300 mm |
| SpacerHeight | IfcLengthMeasure | Gap created | 50 mm |
| SpacerMaterial | IfcLabel | Spacer material | "Steel Galvanized" |
| GapForServices | IfcBoolean | Service clearance | TRUE |

---

## 3. Level of Development (LOD) Specifications

### 3.1 LOD Framework Overview

The LOD Specification, maintained by BIM Forum (USA), provides standardized definitions for model element content at various project stages. The current version is LOD Specification 2025, published December 2024.

**LOD Definitions (AIA-based):**
- **LOD 100:** Conceptual massing (approximate size, shape, location)
- **LOD 200:** Schematic design (generic systems, approximate quantities)
- **LOD 300:** Design development (specific systems, accurate quantities)
- **LOD 350:** Detailed design (fabrication-ready details)
- **LOD 400:** Construction documentation (fabrication and assembly)
- **LOD 500:** As-built/facilities management (verified field conditions)

### 3.2 Ceiling Panel LOD Requirements

**LOD 200 - Schematic Design:**

| Attribute | Requirement | Example |
|-----------|-------------|---------|
| Geometry | Generic bounding box or simplified surface | Ceiling plane at 2.8m |
| Location | Approximate elevation | Level + 2.7m |
| Quantity | Area-based estimate | 150 m² |
| Type | Generic covering type | "Acoustic Ceiling" |
| Properties | Basic thermal/acoustic ratings | NRC 0.60 |

**LOD 300 - Design Development:**

| Attribute | Requirement | Example |
|-----------|-------------|---------|
| Geometry | Accurate footprint with penetration locations | Planar surface with openings |
| Location | Precise elevation + relationship to space | 2.75m FFL |
| Quantity | Exact area calculation | 147.3 m² |
| Type | Specific covering type | "Suspended Acoustic Tile" |
| Properties | Material, fire rating, acoustic data | Class A, NRC 0.75 |
| Spacing | Grid layout indicated | 600x600mm |

**LOD 350 - Detailed Design:**

| Attribute | Requirement | Example |
|-----------|-------------|---------|
| Geometry | Full panel geometry with edge detail | Individual tiles with tegular edge |
| Location | Precise + grid reference system | Room grid coordinates |
| Quantity | Panel count + cut panel locations | 49 panels (2 cut) |
| Type | Specific product type + manufacturer | "Armstrong Dune" |
| Properties | Full specifications per Pset_CoveringCommon | Complete property set |
| Grid | Exact spacing pattern specified | 600x600mm square |
| Perimeter | Detail condition at walls | Bounced edge detail |

**LOD 400 - Construction Documentation:**

| Attribute | Requirement | Example |
|-----------|-------------|---------|
| Geometry | Fabrication-ready panel dimensions | Actual panel sizes (599mm after edge) |
| Location | Installation coordinates with tolerances | Grid origin + offsets |
| Quantity | Exact bill of materials | Panel count with spares |
| Type | Exact product model with supplier | Armstrong 2712A |
| Properties | All manufacturer properties | Complete specification |
| Accessories | Grid, trim, hold-down clips specified | Complete assembly |
| CutTickets | Panel layout with cut dimensions | Individual panel mapping |

### 3.3 LOD Specification 2025 Updates

**Key Changes Relevant to Ceiling Panels:**

The LOD 2025 specification (released December 2024) includes:
- Enhanced definitions for prefabricated elements
- Clearer guidance on parametric content
- Improved property requirements for facilities management
- Spanish language version for international projects

**Part I:** Definitions and framework (PDF document)
**Part II:** Element-specific tables (Excel spreadsheet)

### 3.4 Ceiling Panel Calculator LOD Mapping

| Calculator Output | LOD Level | Notes |
|-------------------|-----------|-------|
| Total coverage area | LOD 200-300 | Project-level estimates |
| Panel count (basic) | LOD 300 | Design development quantity |
| Panel layout grid | LOD 350 | Detailed design with spacing |
| Cut panel identification | LOD 400 | Fabrication-ready detail |
| Spacer optimization | LOD 350+ | Requires spacer-specific design |
| Material quantities | LOD 400 | Bill of materials for procurement |

---

## 4. COBie Requirements for Facilities Management

### 4.1 COBie Standard Overview

COBie (Construction Operations Building Information Exchange) is a buildingSMART standard for delivering building information to owners and operators. The current version is COBie 2024, published by buildingSMART International.

**COBie 2024 Release:** April 2024, aligned with IFC 4.3.2.0

**Purpose:** Structured data handover for:
- Space and area management
- Asset inventory and tracking
- Maintenance scheduling
- Warranty and contract management
- Sustainability and performance monitoring

### 4.2 COBie Data Structure for Ceiling Systems

**COBie 2024 Spreadsheet Tabs (relevant to ceiling):**

| Tab | Content | Ceiling Relevance |
|-----|---------|-------------------|
| Facility | Building information | Parent record for all elements |
| Floor | Floor/level definitions | Ceiling location reference |
| Space | Room/area definitions | Ceiling bounds this space |
| Zone | Space groupings | Ceiling belongs to zones |
| Type | Product/assembly types | Ceiling panel product types |
| Component | Individual instances | Ceiling panels as assets |
| System | System relationships | Ceiling as building system |
| Assembly | Assembly hierarchy | Ceiling system composition |
| Spare | Spare parts inventory | Replacement panels |
| Job | Maintenance tasks | Cleaning/replacement schedules |
| Document | Reference documents | Product data, warranties |

### 4.3 COBie Requirements for Ceiling Panels

**Type Tab (Ceiling Panel Type):**

| Column | Required | Example |
|--------|----------|---------|
| Name | Yes | "Armstrong Dune 2712A" |
| CreatedBy | Yes | Design team |
| CreatedOn | Yes | 2026-01-15 |
| Category | Yes | "Ceiling Tiles" |
| Description | Yes | "Mineral fiber acoustic tile" |
| Manufacturer | Yes | "Armstrong World Industries" |
| ModelNumber | Yes | "2712A" |
| WarrantyDescription | Recommended | "15 year limited" |
| ExpectedLife | Yes | 25 years |
| ReplacementCost | Recommended | "$45/m²" |

**Component Tab (Individual Ceiling Panel):**

| Column | Required | Example |
|--------|----------|---------|
| Name | Yes | "Ceiling-Panel-RM101-A" |
| CreatedBy | Yes | Contractor |
| CreatedOn | Yes | 2026-02-01 |
| Type | Yes | "Armstrong Dune 2712A" |
| Space | Yes | "Room-101" |
| Description | Recommended | "North wall panel" |
| SerialNumber | If available | "Batch-2024-156" |
| InstallationDate | Yes | 2026-02-01 |
| WarrantyStartDate | Recommended | 2026-02-01 |
| WarrantyEndDate | Recommended | 2041-02-01 |
| TagNumber | Yes | "CP-101-A" |

**Assembly Tab (Ceiling System Assembly):**

| Column | Required | Example |
|--------|----------|---------|
| Name | Yes | "Suspended Ceiling Assembly Level 2" |
| CreatedBy | Yes | Design team |
| CreatedOn | Yes | 2026-01-15 |
| Description | Recommended | "Suspended grid with acoustic tiles" |
| Parent | Optional | "Building-Level-2" |
| PredefinedType | Yes | "CEILING" |
| TotalShapeLength | Calculated | Perimeter length |
| TotalShapeArea | Calculated | Total coverage |

### 4.4 COBie Property Requirements

**Required Properties by COBie 2024:**

| Property | Source | Requirement Level |
|----------|--------|-------------------|
| AssetIdentifier | Component.TagNumber | Required |
| SerialNumber | Component.SerialNumber | Conditional |
| InstallationDate | Component.InstallationDate | Required |
| ExpectedLife | Type.ExpectedLife | Required |
| Manufacturer | Type.Manufacturer | Required |
| ModelNumber | Type.ModelNumber | Required |
| WarrantyEndDate | Component.WarrantyEndDate | Recommended |
| FireRating | Pset_CoveringCommon.FireRating | Recommended |
| AcousticRating | Pset_CoveringThermalProperties.AcousticRating | Recommended |

**COBie-IFC Mapping:**

| COBie Column | IFC Attribute | Notes |
|--------------|---------------|-------|
| Name | IfcCovering.Name | Instance name |
| Type | IfcCovering.PredefinedType | Enum value |
| Space | IfcRelContainedInSpatialStructure.RelatedElements | Space assignment |
| Description | IfcCovering.Description | Additional info |
| InstallationDate | IfcCovering.CreatedOn | When placed |
| ExpectedLife | Pset_CoveringCommon.ServiceLife | Years |

### 4.5 COBie Delivery Requirements

**Phase-Based Delivery:**

| Project Phase | COBie Deliverable | LOD Target |
|---------------|-------------------|------------|
| Design | COBie Design Phase | LOD 300 |
| Construction Start | COBie Construction | LOD 350 |
| Substantial Completion | COBie Final | LOD 400 |
| Final Handover | COBie FM | LOD 500 |

**Quality Requirements:**
- Valid against COBie 2024 XSD schema
- All required fields populated (not blank)
- Foreign key references valid
- Date format: YYYY-MM-DD
- Area units: square meters (m²)
- Currency: ISO 4217 code (e.g., USD)

---

## 5. Naming Conventions and Classification Systems

### 5.1 Classification System Overview

Building classification systems organize building elements for specification, procurement, and facilities management. Multiple systems may be used on a single project.

**Primary Classification Systems:**
- UniFormat (CSI) - Element-based
- OmniClass (CSI) - Comprehensive
- Uniclass 2015 (UK) - Unified classification
- ETIM (Europe) - Product classification

### 5.2 UniFormat Classification for Ceiling Panels

UniFormat (CSI/CSC) classifies building elements by function rather than products. Most relevant for ceiling panels:

**Level 1: Major Group Elements**

| Code | Title | Includes |
|------|-------|----------|
| B | Shell | Building envelope |
| C | Interiors | Interior construction |
| D | Services | MEP systems |

**Level 2: Subgroup Elements**

| Code | Title | Description |
|------|-------|-------------|
| C10 | Interior Construction | General interior work |
| C30 | Ceilings | Ceiling systems |

**Level 3: Individual Elements**

| Code | Title | Description |
|------|-------|-------------|
| C1010 | Fixed Ceilings | Attached ceilings |
| C1020 | Demountable Ceilings | Suspended tile systems |
| C1030 | Specialty Ceilings | Architectural ceilings |

**Level 4: Sub-elements (Products)**

| Code | Title | Description |
|------|-------|-------------|
| C1010.10 | Gypsum Board Ceilings | Drywall ceilings |
| C1010.20 | Acoustic Tile Ceilings | Mineral fiber tiles |
| C1010.30 | Metal Panel Ceilings | Aluminum/steel panels |
| C1020.10 | Suspended Acoustical Tile | Dropped grid systems |
| C1020.20 | Suspended Panel Ceilings | Large format tiles |
| C1020.30 | Direct-Hung Ceilings | Specialty grids |

**Recommended Ceiling Panel Calculator Classification:**

| Ceiling Type | UniFormat Code | Notes |
|--------------|----------------|-------|
| Standard acoustic tile | C1020.10 | Suspended acoustical tile |
| Gypsum board | C1010.10 | Fixed gypsum ceiling |
| Metal panel | C1010.30 | Metal panel ceiling |
| Direct mount | C1020.30 | Direct-hung system |
| Specialty/architectural | C1030 | Specialty ceiling |

### 5.3 OmniClass Classification

OmniClass (CSI) provides a multi-table classification system suitable for BIM and facilities management.

**Table 13: Construction Entities by Function**

| Code | Title | Description |
|------|-------|-------------|
| 13 11 00 | Ceilings | Ceiling construction |

**Table 21: Elements (Combined)**

| Code | Title | Description |
|------|-------|-------------|
| 21-03 21 00 | Ceilings | Ceiling systems |
| 21-03 21 10 | Fixed Ceilings | Permanently attached |
| 21-03 21 20 | Suspended Ceilings | Dropped systems |
| 21-03 21 30 | Demountable Ceilings | Access systems |

**Table 32: Spaces (by function)**

| Code | Title | Description |
|------|-------|-------------|
| 32-11 00 | Service Spaces | Equipment areas |
| 32-13 00 | Plenum Spaces | Above ceilings |

### 5.4 Naming Conventions for Ceiling Panels

**Element Naming Convention:**

```
[Prefix]-[Type]-[Space]-[Sequence]
```

**Examples:**
- `CP-RM101-001` - Ceiling Panel, Room 101, Panel 1
- `CP-GRID-RM101` - Ceiling Grid, Room 101
- `CP-TRIM-RM101` - Ceiling Trim, Room 101
- `CP-SPACER-RM101-001` - Ceiling Spacer (special feature)

**Type Naming Convention:**

```
[Manufacturer]-[ProductLine]-[Size]-[Finish]
```

**Examples:**
- `ARMSTRONG-DUNE-600X600-WHITE`
- `ARMSTRONG-DUNE-600X1200-WHITE`
- `KNauf-Danoline-600X600-PAINTABLE`

**Recommended Naming Elements:**

| Element | Format | Example |
|---------|--------|---------|
| Prefix | 2-3 letters | CP (Ceiling Panel) |
| Space Code | Room identifier | RM101 |
| Sequence | 3-digit number | 001 |
| Grid | GRID | GRID |
| Trim | TRIM | TRIM |
| Spacer | SPACER | SPACER |

### 5.5 Property Naming in IFC

**Standard Property Naming (buildingSMART):**

| Property Group | Naming Pattern | Example |
|----------------|----------------|---------|
| Common | PropertyName | Name, Description |
| Quantity | Qto_[Element]_[QuantityName] | Qto_CoveringArea |
| Property | Pset_[Name]_[PropertyName] | Pset_CeilingPanel_PanelWidth |
| Material | Mat_[Name]_[Property] | Mat_GypsumBoard_Density |

**Custom Property Naming (Project-Specific):**

```
Pset_CeilingSpacer_[PropertyName]
```

**Examples:**
- `Pset_CeilingSpacer_SpacingPattern`
- `Pset_CeilingSpacer_SpacerQuantity`
- `Pset_CeilingSpacer_CutPanelCount`

---

## 6. Compliance Requirements Summary

### 6.1 IFC Compliance Checklist

| Requirement | Level | Implementation |
|-------------|-------|----------------|
| Valid IFC 4.3.2.0 schema | Mandatory | Use schema-compliant export |
| IfcCovering entity | Mandatory | Primary ceiling representation |
| Proper spatial containment | Mandatory | IfcRelContainedInSpatialStructure |
| Material assignment | Recommended | IfcRelAssociatesMaterial |
| Type-object relationship | Mandatory | IfcRelDefinesByType |
| Property set assignment | Mandatory | IfcRelDefinesByProperties |
| Coordinate reference system | Mandatory | ProjectCRS defined |
| Geometry representation | Required | SweptSolid preferred |

### 6.2 COBie Compliance Checklist

| Requirement | Level | Implementation |
|-------------|-------|----------------|
| Facility tab complete | Mandatory | Building information |
| Space tab complete | Mandatory | Room definitions |
| Type tab complete | Mandatory | Product specifications |
| Component tab complete | Mandatory | Instance inventory |
| Valid foreign keys | Mandatory | References valid |
| Date format YYYY-MM-DD | Mandatory | ISO 8601 |
| Area in square meters | Mandatory | SI units |
| Currency with ISO code | Recommended | Cost fields |

### 6.3 LOD Compliance Checklist

| LOD Level | Geometry | Properties | Quantities |
|-----------|----------|------------|------------|
| LOD 100 | Conceptual | None | Rough estimate |
| LOD 200 | Schematic | Basic ratings | Approximate area |
| LOD 300 | Design | Full specifications | Exact area |
| LOD 350 | Detailed | Complete set | Panel count |
| LOD 400 | Fabrication | All properties | Bill of materials |

### 6.4 Classification Compliance

| System | Required For | Implementation |
|--------|--------------|----------------|
| UniFormat | US projects, CSI specs | C10 series for ceilings |
| OmniClass | Comprehensive FM | Table 13, 21, 32 |
| COBie | All COBie deliverables | Category field populated |

---

## 7. Sources and References

### 7.1 Primary Standards

| Standard | Version | Publisher | Status |
|----------|---------|-----------|--------|
| IFC Schema | 4.3.2.0 | buildingSMART | Official (2024-04) |
| ISO 16739-1 | 2024 | ISO | Current standard |
| COBie | 2024 | buildingSMART | Current standard |
| LOD Specification | 2025 | BIM Forum | Current (2024-12) |
| UniFormat | 2020 | CSI | Current standard |
| OmniClass | 2020 | CSI | Current standard |

### 7.2 Documentation URLs

| Resource | URL |
|----------|-----|
| IFC 4.3.2.0 Schema | https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/HTML/ |
| buildingSMART Technical | https://technical.buildingsmart.org/ |
| MVD Database | https://technical.buildingsmart.org/standards/ifc/mvd/mvd-database/ |
| bSDD API | https://app.swaggerhub.com/apis-docs/buildingSMART/Dictionaries/v1 |
| LOD Specification | https://bimforum.org/lod |
| COBie Standard | https://www.buildingsmart.org/standards/cobie/ |
| IDS Standard | https://www.buildingsmart.org/standards/bsi-standards/information-delivery-specification-ids/ |
| Sample Files | https://github.com/buildingSMART/Sample-Test-Files |

### 7.3 Validation Tools

| Tool | Purpose | URL |
|------|---------|-----|
| IFC Validation Service | Schema validation | https://www.buildingsmart.org/users/services/ifc-validation-service/ |
| bSDD Browser | Dictionary lookup | https://www.buildingsmart.org/users/services/buildingsmart-data-dictionary/ |
| COBie Validator | COBie compliance | Various commercial tools |

---

## 8. Confidence Assessment

### 8.1 Research Confidence by Topic

| Topic | Confidence | Basis |
|-------|------------|-------|
| IFC 4.3.2.0 Schema | HIGH | Official buildingSMART documentation |
| IFC Entities (IfcCovering) | HIGH | IFC schema specifications |
| Property Sets | MEDIUM | Standard Psets documented; ceiling-specific requires interpretation |
| COBie 2024 Requirements | HIGH | Official buildingSMART standard |
| LOD 2025 Specifications | HIGH | BIM Forum official release |
| UniFormat Classification | HIGH | CSI official standard |
| OmniClass Classification | HIGH | CSI official standard |
| Naming Conventions | MEDIUM | Industry best practices; not formally standardized |

### 8.2 Recommendations for Further Research

| Area | Confidence Gap | Recommended Action |
|------|----------------|-------------------|
| Ceiling-specific Psets | MEDIUM | Review bSDD for latest definitions |
| Spacer system properties | LOW | Develop project-specific extensions |
| MVD compatibility | MEDIUM | Test export with common BIM tools |
| COBie extensions | MEDIUM | Verify owner-specific requirements |

---

## 9. Implementation Guidelines for Ceiling Panel Calculator

### 9.1 Data Export Strategy

The ceiling panel spacer calculator should implement the following export capabilities:

**Primary Export: IFC 4.3.2.0**

1. Use `IfcCovering` entity with `PredefinedType = CEILING_TILE` or `CEILING_PANEL`
2. Assign `IfcCoveringType` for type-level properties
3. Link to `IfcSpace` via `IfcRelContainedInSpatialStructure`
4. Include `Pset_CoveringCommon` with fire rating, thermal properties
5. Add custom `Pset_CeilingSpacerCalculation` for calculator outputs
6. Export geometry as `IfcExtrudedAreaSweptSolid`

**Secondary Export: COBie 2024 Spreadsheet**

1. Complete Type tab with manufacturer, model, specifications
2. Complete Component tab with individual panel inventory
3. Include Assembly tab for ceiling system hierarchy
4. Add Document tab with product data sheets
5. Reference Installation and Warranty dates

### 9.2 Property Mapping Reference

| Calculator Data | IFC Property | COBie Field |
|-----------------|--------------|-------------|
| Panel width | Pset_CeilingPanel.PanelWidth | - |
| Panel length | Pset_CeilingPanel.PanelLength | - |
| Total panels | IfcCovering | Component (count) |
| Coverage area | Qto_CoveringArea | Type.FloorArea |
| Room association | IfcSpace | Component.Space |
| Cut panels | Pset_CeilingSpacer.CutPanelCount | - |
| Spacer count | Pset_CeilingSpacer.SpacerQuantity | - |

---

## 10. Conclusion

This research establishes the BIM data standards framework for ceiling panel systems based on current buildingSMART specifications and industry best practices. The ceiling panel spacer calculator should target IFC 4.3.2.0 schema compliance with property sets aligned to buildingSMART Data Dictionary definitions. LOD 350 represents the minimum detail level for design-phase deliverables, with LOD 400 required for construction documentation and COBie handover.

Classification should follow UniFormat (C10 series for ceilings) with OmniClass supplementary categorization. COBie 2024 compliance requires structured data delivery across Space, Type, Component, and Assembly tabs with specific properties for asset tracking and facilities management.

The custom properties for spacer calculation should be implemented as an extension property set (`Pset_CeilingSpacerCalculation`) to capture the unique outputs of the ceiling panel spacing optimization algorithm while maintaining schema validity.

**Research Confidence:** MEDIUM-HIGH
**Primary Standards:** IFC 4.3.2.0, COBie 2024, LOD 2025
**Classification:** UniFormat (Primary), OmniClass (Supplementary)