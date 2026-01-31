# BuildScale Platform Roadmap

**Project:** BuildScale - Integrated Building Design & Manufacturing Platform  
**Created:** 2026-01-31  
**Timeline:** 12 weeks to working beta  
**Phases:** 4 phases with integrated testing

---

## Phase 1: Foundation Repair (Weeks 1-3)

**Goal:** Fix critical issues in existing codebase to create a solid foundation

**Requirements:** CRIT-01 through CRIT-07, TEST-01 baseline

**Success Criteria:**
1. Panel calculator generates practical 4-16 panel layouts (not single oversized panels)
2. All API endpoints validate input and return clear error messages
3. DXF files open correctly in AutoCAD without errors
4. Examples run without errors and produce working demonstrations
5. No hardcoded secrets in codebase
6. Core calculation engine has passing tests with assertions

**Technical Approach:**
- Rewrite `CeilingPanelCalculator.calculate()` with practical constraints
- Add validation layer to all API routes
- Fix DXF manual fallback or require ezdxf dependency
- Convert examples.py to executable Python
- Implement proper secret management
- Write correctness tests for calculation engine

**Outcomes:**
- Working calculation engine ready for integration
- Clean, tested foundation layer
- Executable documentation

**Plans:** 4 plans in 2 waves

Plans:
- [ ] 01-01-PLAN.md — Core algorithm fix (CRIT-01: max 2400mm panels)
- [ ] 01-02-PLAN.md — Validation & config (CRIT-02, CRIT-07: validation + secrets)
- [ ] 01-03-PLAN.md — Export generators (CRIT-03, CRIT-04, CRIT-05: DXF/SVG/JSON)
- [ ] 01-04-PLAN.md — Examples & tests (CRIT-06, TEST-01: executable docs + tests)

**Wave Structure:**
| Wave | Plans | Parallel |
|------|-------|----------|
| 1 | 01-01, 01-02, 01-03 | Yes (independent) |
| 2 | 01-04 | Depends on 01-01, 01-02, 01-03 |

---

## Phase 2: Architecture & 3D Foundation (Weeks 4-6)

**Goal:** Build unified orchestration system and basic 3D interface

**Requirements:** FOUND-01 through FOUND-06, DESIGN-01, DESIGN-02, TEST-02

**Success Criteria:**
1. SystemOrchestrator successfully coordinates workflow between modules
2. All modules use unified error handling and logging
3. Database models support projects, components, and materials
4. 3D canvas displays with orbit/pan/zoom controls
5. Component library displays walls, ceilings, panels in 3D
6. API integration tests pass for all endpoints

**Technical Approach:**
- Implement SystemOrchestrator with workflow definitions
- Create unified error hierarchy and logging configuration
- Design database schema (SQLAlchemy models)
- Connect React frontend to Three.js renderer
- Build component library with basic primitives
- Write API integration tests

**Outcomes:**
- Working orchestration layer
- Basic 3D interface operational
- Database persistence for projects

---

## Phase 3: Design Tools & Code Compliance (Weeks 7-9)

**Goal:** Complete 3D design interface and add building code validation

**Requirements:** DESIGN-03 through DESIGN-07, CODE-01 through CODE-05, TEST-03

**Success Criteria:**
1. Users can create components with push-pull extrusion
2. Real-time dimensions display as users design
3. Snap-to-grid and alignment tools work
4. Projects save and load correctly
5. Canadian building code validation identifies non-compliant elements
6. Compliance reports generate with pass/fail status
7. End-to-end tests for complete design workflows pass

**Technical Approach:**
- Implement push-pull interaction in Three.js
- Add measurement overlay system
- Build grid and snapping system
- Create .buildscale project file format
- Implement NBCC validation rules
- Create compliance report generator
- Write E2E tests with Playwright/Selenium

**Outcomes:**
- SketchUp-like 3D design experience
- Building code validation working
- Complete design-to-save workflow

---

## Phase 4: Manufacturing & Supplier Portal (Weeks 10-12)

**Goal:** Manufacturing export, supplier portal, and multi-language support

**Requirements:** EXPORT-01 through EXPORT-06, SUPPLIER-01 through SUPPLIER-06, TEST-04 through TEST-06

**Success Criteria:**
1. DXF, STEP, and parts list exports work for any design
2. Material cut lists optimize for minimal waste
3. Assembly instructions generate automatically
4. Manufacturers can register and upload part specifications
5. Portal supports English, Chinese, and Spanish
6. Secure file download system operational
7. 80%+ test coverage achieved
8. CI pipeline runs all tests automatically

**Technical Approach:**
- Expand export generators (STEP, optimized parts lists)
- Build supplier authentication system
- Create part specification forms
- Implement i18n framework (react-i18next)
- Build secure file storage and download
- Add comprehensive test coverage
- Set up GitHub Actions CI

**Outcomes:**
- Manufacturing-ready export system
- Basic supplier portal operational
- Production-ready beta release

---

## Phase Summary

| # | Phase | Duration | Key Deliverable |
|---|-------|----------|-----------------|
| 1 | Foundation Repair | Weeks 1-3 | Working calculation engine |
| 2 | Architecture & 3D | Weeks 4-6 | Unified system with basic 3D |
| 3 | Design & Compliance | Weeks 7-9 | SketchUp-like design + code validation |
| 4 | Manufacturing | Weeks 10-12 | Supplier portal + exports |

**Total:** 12 weeks to working beta

---

## Dependencies & Critical Path

**Critical Path:**
1. Phase 1 (Foundation) → Must complete before any integration
2. Phase 2 (Orchestration) → Required for 3D and compliance coordination
3. Phase 3 (Design) → Compliance needs orchestration to validate designs
4. Phase 4 (Manufacturing) → Portal needs working exports and designs

**Risk Mitigation:**
- If Phase 1 takes longer, compress Phase 2 features
- Building codes can start with basic checks, expand in iterations
- Supplier portal MVP can start with 1-2 languages

---

## Success Metrics for Beta

**Technical:**
- [ ] Zero critical bugs (crashes, data loss, security issues)
- [ ] 80%+ test coverage
- [ ] All tests passing in CI
- [ ] Performance: 3D interactions <100ms response

**User Experience:**
- [ ] Designer can create a room in <10 minutes
- [ ] Code compliance check runs in <5 seconds
- [ ] Export generates files in <10 seconds
- [ ] Supplier can register and download files

**Business:**
- [ ] Handles real project with 50+ components
- [ ] Exports valid files for 2 manufacturers
- [ ] Validates against Canadian building codes

---

## Post-Beta Roadmap (v2)

**Months 4-6:**
- Real-time collaboration
- Advanced structural analysis
- Additional export formats (IFC, Revit)

**Months 7-12:**
- Global building codes
- Supplier marketplace with bidding
- Mobile companion app
- VR/AR visualization

---

*Last updated: 2026-01-31*
