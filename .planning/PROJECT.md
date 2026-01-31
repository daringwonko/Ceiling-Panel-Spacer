# BuildScale - Integrated Building Design & Manufacturing Platform

## What This Is

An integrated building design platform that combines SketchUp-like 3D modeling with automated manufacturing coordination. The system enables designers to create building components (walls, ceilings, panels), validates designs against building codes, generates manufacturing specifications, and coordinates with global suppliers through a unified portal.

## Core Value

Designers can create a building component in 3D, validate it against Canadian (and eventually global) building codes, automatically generate manufacturing-ready specifications with parts lists, and send production-ready files to vetted suppliers in their preferred language and CAD format.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Critical Fixes (Existing Codebase):**
- [ ] Fix core panel calculation algorithm to generate practical multi-panel layouts (not single oversized panels)
- [ ] Add input validation with clear error messages for all calculation endpoints
- [ ] Complete DXF/SVG fallback generation for CAD export
- [ ] Fix missing return statements in ProjectExporter
- [ ] Make examples.py executable with working code examples

**Foundation Layer:**
- [ ] Create unified orchestration system that coordinates all modules
- [ ] Implement proper error handling and logging across all layers
- [ ] Replace placeholder `pass` statements with actual implementations
- [ ] Remove hardcoded secrets and implement proper secret management

**3D Design Interface:**
- [ ] Connect existing 3D renderer to calculation engine
- [ ] Build component library (walls, ceilings, panels, windows, doors)
- [ ] Implement push-pull style 3D modeling for extrusion
- [ ] Add real-time preview and measurement display
- [ ] Create save/load project format

**Building Code Compliance:**
- [ ] Implement Canadian building code validation engine (NBCC)
- [ ] Add structural load calculations
- [ ] Create fire safety compliance checks
- [ ] Generate compliance reports

**Export & Manufacturing:**
- [ ] Expand CAD export formats (DXF, DWG, STEP, IFC)
- [ ] Generate manufacturing parts lists with specifications
- [ ] Create material cut lists with optimization
- [ ] Add assembly instructions generation

**Supplier Portal (Foundation):**
- [ ] Build manufacturer authentication and registration system
- [ ] Create part specification upload workflow
- [ ] Implement design-to-order matching system
- [ ] Add multi-language support framework (i18n)
- [ ] Create secure file exchange system

**Testing & Quality:**
- [ ] Write comprehensive test suite with actual assertions
- [ ] Add integration tests for full workflows
- [ ] Create performance benchmarks
- [ ] Implement automated test running in CI

### Out of Scope

- Full BIM integration with Revit/ArchiCAD (future integration)
- Real-time collaboration (defer to post-beta)
- Advanced generative AI design (optimize existing first)
- Full IoT sensor integration (basic monitoring only)
- Blockchain material verification (overkill for beta)
- VR/AR visualization (nice-to-have post-beta)
- Multi-jurisdiction building codes beyond Canada (v2)

## Context

**Existing Codebase:**
- 20+ Python modules with Flask API, React frontend
- Core calculation engine with quantum/reinforcement learning optimizers
- 3D rendering pipeline (Three.js frontend, Python backend)
- IoT, blockchain, and ML components (not yet integrated)
- 84 test functions but lacking assertions
- Critical algorithm flaw in panel calculation (generates single oversized panels)
- 50+ placeholder functions with `pass` statements

**Technical Environment:**
- Python 3.8+ backend with Flask 2.0
- React 18.2 frontend with Three.js for 3D
- SQLite databases for local development
- Docker containerization configured
- Kubernetes manifests for future scaling

**Team Context:**
- Two-person team (you + colleague) currently
- Plan to scale to larger team with multiple manufacturers
- Need system that supports growth without rewrite

**Current Pain Points:**
- SketchUp doesn't integrate with manufacturing
- Manual process for creating parts lists
- No automated building code validation
- Difficulty coordinating with international suppliers
- Language barriers with manufacturers

## Constraints

**Timeline:** 10-12 weeks to working beta
**Team Size:** 2 developers currently, need architecture that scales
**Tech Stack:** Existing Python/React foundation (leverage, don't rewrite)
**Building Codes:** Start with Canadian NBCC, design for global expansion
**Manufacturing:** Start with 2-3 suppliers, design for 20+

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Phased approach vs all-at-once | Deliver working software incrementally | — Pending |
| Fix existing algorithm vs rewrite | Foundation must be solid before building on it | — Pending |
| Canadian codes first vs global | Start specific, expand once proven | — Pending |
| Python/React vs new stack | Leverage existing investment | — Pending |

---
*Last updated: 2026-01-31 after initialization*
