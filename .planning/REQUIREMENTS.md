# Requirements: BuildScale Platform

**Defined:** 2026-01-31
**Core Value:** Designers can create building components in 3D, validate against Canadian building codes, generate manufacturing specifications with parts lists, and send production-ready files to vetted suppliers in their preferred language and CAD format.

## v1 Requirements (Beta - 12 weeks)

### Critical Fixes (Phase 1)

- [ ] **CRIT-01**: Core panel calculation algorithm generates practical multi-panel layouts (max 2400mm per panel)
- [ ] **CRIT-02**: Input validation prevents invalid dimensions and provides clear error messages
- [ ] **CRIT-03**: DXF export generates valid CAD files that open in AutoCAD/Revit
- [ ] **CRIT-04**: SVG export renders correctly with proper scaling
- [ ] **CRIT-05**: ProjectExporter.export_json() returns project data dictionary
- [ ] **CRIT-06**: examples.py converted to executable Python code
- [ ] **CRIT-07**: Remove hardcoded JWT secrets and API keys

### Foundation Layer (Phase 1-2)

- [ ] **FOUND-01**: SystemOrchestrator coordinates workflow between all modules
- [ ] **FOUND-02**: Unified error handling with custom exceptions
- [ ] **FOUND-03**: Structured logging replaces print statements
- [ ] **FOUND-04**: Configuration management with environment variables
- [ ] **FOUND-05**: Replace 50+ placeholder functions with implementations
- [ ] **FOUND-06**: Database models for projects, components, and materials

### 3D Design Interface (Phase 2-3)

- [ ] **DESIGN-01**: 3D canvas with orbit, pan, zoom controls
- [ ] **DESIGN-02**: Component library: walls, ceilings, panels, windows, doors
- [ ] **DESIGN-03**: Push-pull extrusion for component creation
- [ ] **DESIGN-04**: Real-time dimensions display
- [ ] **DESIGN-05**: Snap-to-grid and alignment tools
- [ ] **DESIGN-06**: Save/load project files (.buildscale format)
- [ ] **DESIGN-07**: Import floor plans (PDF, image) for tracing

### Building Code Compliance (Phase 3)

- [ ] **CODE-01**: Load-bearing wall validation per NBCC
- [ ] **CODE-02**: Fire rating compliance checks
- [ ] **CODE-03**: Ceiling span and support validation
- [ ] **CODE-04**: Generate compliance report with pass/fail status
- [ ] **CODE-05**: Highlight non-compliant elements in 3D view

### Manufacturing Export (Phase 3-4)

- [ ] **EXPORT-01**: DXF export with layer organization
- [ ] **EXPORT-02**: STEP format for 3D manufacturing
- [ ] **EXPORT-03**: Generate parts list with quantities and specifications
- [ ] **EXPORT-04**: Material cut list optimization
- [ ] **EXPORT-05**: Assembly instructions with diagrams
- [ ] **EXPORT-06**: Cost estimation with material pricing

### Supplier Portal (Phase 4)

- [ ] **SUPPLIER-01**: Manufacturer registration and authentication
- [ ] **SUPPLIER-02**: Part specification upload (dimensions, materials, pricing)
- [ ] **SUPPLIER-03**: Design-to-manufacture matching system
- [ ] **SUPPLIER-04**: Multi-language support (English, Chinese, Spanish)
- [ ] **SUPPLIER-05**: Secure file download for manufacturing files
- [ ] **SUPPLIER-06**: Order tracking and status updates

### Testing & Quality (All Phases)

- [ ] **TEST-01**: Unit tests for calculation engine with assertions
- [ ] **TEST-02**: Integration tests for API endpoints
- [ ] **TEST-03**: End-to-end tests for complete workflows
- [ ] **TEST-04**: 80%+ code coverage
- [ ] **TEST-05**: Automated CI pipeline for tests
- [ ] **TEST-06**: Performance benchmarks

## v2 Requirements (Post-Beta)

### Advanced Features

- **ADV-01**: Real-time collaboration (multiple designers)
- **ADV-02**: Generative AI for design suggestions
- **ADV-03**: Full IoT integration for smart buildings
- **ADV-04**: VR/AR visualization and walkthroughs
- **ADV-05**: Advanced structural analysis (FEM)
- **ADV-06**: Energy efficiency optimization
- **ADV-07**: Cost optimization across multiple suppliers

### Scale Features

- **SCALE-01**: Multi-jurisdiction building codes (US, EU, Asia)
- **SCALE-02**: Advanced supplier marketplace with bidding
- **SCALE-03**: Supply chain tracking and logistics
- **SCALE-04**: Quality control workflow with inspections
- **SCALE-05**: White-label solution for manufacturers

### Integrations

- **INT-01**: Revit plugin for import/export
- **INT-02**: AutoCAD integration
- **INT-03**: SketchUp import
- **INT-04**: ERP system integration (SAP, Oracle)
- **INT-05**: Accounting software integration (QuickBooks, Xero)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Blockchain verification | Overkill for beta, complex without clear value |
| Quantum computing optimization | Existing optimizers sufficient |
| Full BIM standard compliance | Too complex for initial release |
| Mobile app | Desktop-first approach, mobile later |
| Real-time rendering (ray tracing) | Performance impact, defer to post-beta |
| Advanced AI design generation | Focus on core functionality first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRIT-01 | Phase 1 | Pending |
| CRIT-02 | Phase 1 | Pending |
| CRIT-03 | Phase 1 | Pending |
| CRIT-04 | Phase 1 | Pending |
| CRIT-05 | Phase 1 | Pending |
| CRIT-06 | Phase 1 | Pending |
| CRIT-07 | Phase 1 | Pending |
| FOUND-01 | Phase 2 | Pending |
| FOUND-02 | Phase 2 | Pending |
| FOUND-03 | Phase 2 | Pending |
| FOUND-04 | Phase 2 | Pending |
| FOUND-05 | Phase 2 | Pending |
| FOUND-06 | Phase 2 | Pending |
| DESIGN-01 | Phase 2 | Pending |
| DESIGN-02 | Phase 2 | Pending |
| DESIGN-03 | Phase 3 | Pending |
| DESIGN-04 | Phase 3 | Pending |
| DESIGN-05 | Phase 3 | Pending |
| DESIGN-06 | Phase 3 | Pending |
| DESIGN-07 | Phase 3 | Pending |
| CODE-01 | Phase 3 | Pending |
| CODE-02 | Phase 3 | Pending |
| CODE-03 | Phase 3 | Pending |
| CODE-04 | Phase 3 | Pending |
| CODE-05 | Phase 3 | Pending |
| EXPORT-01 | Phase 4 | Pending |
| EXPORT-02 | Phase 4 | Pending |
| EXPORT-03 | Phase 4 | Pending |
| EXPORT-04 | Phase 4 | Pending |
| EXPORT-05 | Phase 4 | Pending |
| EXPORT-06 | Phase 4 | Pending |
| SUPPLIER-01 | Phase 4 | Pending |
| SUPPLIER-02 | Phase 4 | Pending |
| SUPPLIER-03 | Phase 4 | Pending |
| SUPPLIER-04 | Phase 4 | Pending |
| SUPPLIER-05 | Phase 4 | Pending |
| SUPPLIER-06 | Phase 4 | Pending |
| TEST-01 | All | Pending |
| TEST-02 | All | Pending |
| TEST-03 | All | Pending |
| TEST-04 | All | Pending |
| TEST-05 | All | Pending |
| TEST-06 | All | Pending |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after initialization*
