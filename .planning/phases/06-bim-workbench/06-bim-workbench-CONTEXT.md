# Phase 6: BIM Workbench Implementation - Context

**Created:** 2026-01-31
**Status:** Planning Phase
**Target:** Full BIM Workbench implementation for Savage Cabinetry Platform

---

## Vision Statement

Transform the Savage Cabinetry Platform into a professional-grade BIM (Building Information Modeling) workbench by implementing the complete FreeCAD BIM Workbench specification in React/Three.js, delivering 100+ tools across 7 categories with Savage Cabinetry branding.

---

## Phase Goal

**Primary Goal:** Implement a fully functional BIM workbench that enables architects, contractors, and interior designers to:
- Create 2D architectural drawings with drafting tools
- Build 3D parametric building models (walls, beams, slabs, doors, windows, etc.)
- Generate production drawings (plans, sections, elevations)
- Export to industry-standard formats (IFC, DXF, JSON, SVG)
- Manage project hierarchy (sites, buildings, levels)
- Work collaboratively with real-time 3D visualization

---

## User Decisions

### Q1: Implementation Scope (Answered: FULL)
**Decision:** Implement ALL 100+ tools from BIM_Workbench.md, not just a subset
**Rationale:** Savage Cabinetry aims to compete with Autodesk - needs complete feature parity
**Impact:** Maximum effort, maximum competitive differentiation

### Q2: IFC File Support (Answered: YES)
**Decision:** Use web-ifc-three library for IFC import/export
**Rationale:** Industry standard for BIM interoperability
**Library:** web-ifc-three (npm package)

### Q3: 2D vs 3D First (Answered: PARALLEL)
**Decision:** Implement 2D drafting and 3D modeling in parallel
**Rationale:** Both foundational to BIM workflow - 2D for drawings, 3D for models
**Approach:** Separate agent teams for 2D and 3D, converge in integration phase

### Q4: Savage Branding (Answered: YES)
**Decision:** Apply Savage Cabinetry branding throughout
**Brand Colors:** Professional blue theme from config
**Logo:** Savage Cabinetry logo in sidebar
**URL:** support@savagecabinetry.com, github.com/savagecabinetry/platform

### Q5: Testing Strategy (Answered: COMPREHENSIVE)
**Decision:** Implement comprehensive test suite
**Coverage Target:** 80%+
**Test Types:** Unit, Integration, E2E, Visual regression
**Framework:** Vitest + React Testing Library + Playwright

---

## Success Criteria

### Functional Requirements (FR)

**FR-01: 2D Drafting Complete**
- All 13 drafting tools implemented (Line, Polyline, Rectangle, Circle, Arc, etc.)
- SVG-based 2D canvas with grid system
- Object snapping (endpoint, midpoint, center)
- Shape editing (move, rotate, scale, trim, split)
- Fillet/chamfer operations

**FR-02: 3D BIM Objects Complete**
- Core structural objects (Wall, Beam, Column, Slab)
- Building elements (Door, Window, Stairs, Roof)
- Parametric editing (height, thickness, material)
- Object hierarchy (Site → Building → Level → Objects)

**FR-03: Annotation System**
- Dimensions (aligned, horizontal, vertical)
- Text labels with leader lines
- Axis systems and grids
- Section planes for 2D views
- Hatching patterns

**FR-04: Project Management**
- Create IFC projects
- Manage sites, buildings, levels
- Material assignment and management
- Layer system for organization

**FR-05: Export Capabilities**
- IFC import/export (web-ifc-three)
- DXF export (ezdxf Python backend)
- SVG export (2D views)
- JSON export (structured data)
- TechDraw page generation

**FR-06: Visualization**
- Real-time 3D rendering (Three.js + React Three Fiber)
- Orbit/pan/zoom controls
- Multiple view modes (perspective, top, front, side)
- Section plane visualization
- Object selection and highlighting

### Non-Functional Requirements (NFR)

**NFR-01: Performance**
- 2D canvas: 60fps with 1000+ objects
- 3D canvas: 60fps with 100+ BIM objects
- IFC load time: <5s for 10MB file
- Calculation time: <100ms for layout operations

**NFR-02: Usability**
- Professional UI matching BIM tool conventions
- Keyboard shortcuts for common operations
- Context-sensitive toolbars
- Undo/redo support (100+ operations)

**NFR-03: Reliability**
- Zero data loss on crashes
- Auto-save every 2 minutes
- Error recovery with user-friendly messages
- 99% uptime for web deployment

**NFR-04: Maintainability**
- Clean component architecture
- Comprehensive documentation
- 80%+ test coverage
- Type safety (TypeScript)

---

## Constraints

### Technical Constraints
- **Frontend:** React 18 + Three.js + Zustand + TanStack Query
- **2D Drawing:** SVG-based (not Canvas API for better DOM integration)
- **3D Rendering:** @react-three/fiber + @react-three/drei
- **IFC Support:** web-ifc-three (client-side parsing)
- **State Management:** Zustand for 3D, TanStack Query for API
- **Routing:** React Router v6
- **Styling:** Tailwind CSS + Savage brand theme

### Resource Constraints
- **Team Size:** 1 developer (Claude executor)
- **Time Budget:** Aggressive (execute as fast as possible)
- **Budget:** Open source, no licensing costs

### Platform Constraints
- **Browser:** Modern browsers (Chrome, Firefox, Edge, Safari)
- **Mobile:** Tablet+ recommended (touch support planned)
- **Offline:** PWA-capable (already implemented)

---

## Existing Codebase Assets

### Current Frontend Structure
```
frontend/src/
├── App.jsx                          # Main app with routing
├── main.jsx                         # Entry point
├── components/
│   ├── Layout/
│   │   └── Layout.jsx               # Sidebar navigation
│   ├── Calculator/
│   │   ├── Calculator.jsx           # Existing panel calculator
│   │   └── PanelPreview.jsx         # 2D panel preview
│   ├── Visualization/
│   │   └── Visualization.jsx        # 3D ceiling view
│   ├── ThreeDEditor.tsx             # Basic 3D editor
│   └── ThreeDCanvas.tsx             # Three.js canvas
├── stores/
│   ├── use3DStore.ts                # 3D state (Zustand)
│   └── useCabinetStore.ts           # Cabinet state
├── api/
│   └── client.js                    # Axios API client
└── themes/
    └── bimTheme.tsx                 # Existing BIM theme
```

### Existing 3D Implementation
- **Three.js integration:** ✅ Already implemented
- **Orbit controls:** ✅ Using @react-three/drei
- **Grid helper:** ✅ Grid component exists
- **Panel rendering:** ✅ Ceiling panels rendering
- **Camera controls:** ✅ Perspective and top view modes

### Existing Patterns
- **Component structure:** Functional components with hooks
- **State management:** Zustand for local state
- **API calls:** TanStack Query (React Query)
- **Routing:** React Router with NavLink
- **Styling:** Tailwind CSS with custom theme
- **Error handling:** react-hot-toast for notifications

### API Integration Points
```javascript
// Existing API endpoints (from api/client.js)
health: () => apiClient.get('/health'),
calculate: (data) => apiClient.post('/calculate', data),
listProjects: (params) => apiClient.get('/projects', { params }),
listMaterials: (params) => apiClient.get('/materials', { params }),
exportSvg: (data) => apiClient.post('/exports/svg', data),
exportDxf: (data) => apiClient.post('/exports/dxf', data),
export3d: (data) => apiClient.post('/exports/3d', data),
```

**New API Endpoints Needed:**
- `POST /api/bim/objects` - Create BIM object
- `PUT /api/bim/objects/:id` - Update BIM object
- `DELETE /api/bim/objects/:id` - Delete BIM object
- `GET /api/bim/projects/:id` - Get BIM project
- `POST /api/bim/projects` - Create BIM project
- `POST /api/bim/ifc/import` - Import IFC file
- `GET /api/bim/ifc/export/:id` - Export IFC file
- `POST /api/bim/sections` - Create section plane
- `GET /api/bim/schedules/:id` - Get quantity schedule

---

## Dependencies to Add

### NPM Packages
```json
{
  "web-ifc-three": "^0.0.136",        // IFC file parsing
  "three-stdlib": "^2.29.4",           // Three.js utilities
  "uuid": "^9.0.1",                   // Unique ID generation
  "clsx": "^2.0.0",                   // Conditional classes (already installed)
  "@radix-ui/react-popover": "^1.0.7", // Popover menus
  "@radix-ui/react-dialog": "^1.0.5",  // Dialog modals
  "@radix-ui/react-dropdown-menu": "^2.0.6", // Dropdown menus
  "@radix-ui/react-tabs": "^1.0.4",    // Tab navigation
  "@radix-ui/react-toast": "^1.1.5",   // Toast notifications
  "@radix-ui/react-tooltip": "^1.0.7", // Tooltips
  "hotkeys-js": "^3.12.0",             // Keyboard shortcuts
  "immer": "^10.0.3",                  // Immutable state updates
  "zustand": "^4.5.7",                 // State management (already installed)
  "@tanstack/react-query": "^5.8.4",   // Data fetching (already installed)
  "react-router-dom": "^6.20.0"        // Routing (already installed)
}
```

### Python Backend Dependencies
```txt
# Already in requirements.txt
ezdxf>=1.0.0        # DXF export (already installed)

# May need:
ifcopenshell>=0.7.0  # IFC processing (optional, web-ifc-three handles most)
```

---

## Phase Structure

### Wave 1: Core Infrastructure (4 plans)
- 06-01-PLAN.md: Project structure and routing
- 06-02-PLAN.md: State management and stores
- 06-03-PLAN.md: Base UI components and layout
- 06-04-PLAN.md: API integration and backend

### Wave 2: 2D Drafting (4 plans)
- 06-05-PLAN.md: 2D canvas and grid system
- 06-06-PLAN.md: Basic drafting tools (Line, Rectangle, Circle)
- 06-07-PLAN.md: Advanced drafting tools (Polyline, Arc, Polygon)
- 06-08-PLAN.md: Snapping and edit tools

### Wave 3: 3D BIM Objects (5 plans)
- 06-09-PLAN.md: 3D object base system
- 06-10-PLAN.md: Structural objects (Wall, Beam, Column, Slab)
- 06-11-PLAN.md: Building elements (Door, Window, Stairs)
- 06-12-PLAN.md: Project hierarchy (Site, Building, Level)
- 06-13-PLAN.md: Material and layer management

### Wave 4: Annotations & Sections (3 plans)
- 06-14-PLAN.md: Dimension and annotation tools
- 06-15-PLAN.md: Section plane system
- 06-16-PLAN.md: 2D view generation

### Wave 5: Export & IFC (3 plans)
- 06-17-PLAN.md: IFC import/export
- 06-18-PLAN.md: DXF and SVG export
- 06-19-PLAN.md: JSON and project export

### Wave 6: Polish & Integration (2 plans)
- 06-20-PLAN.md: Undo/redo and keyboard shortcuts
- 06-21-PLAN.md: Testing, documentation, and deployment

**Total Plans:** 21
**Total Tasks:** ~42-63 (2-3 tasks per plan)
**Estimated Time:** 3-4 hours (parallel execution)

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| IFC parsing complexity | HIGH | MEDIUM | Use mature web-ifc-three library, test early |
| Performance with large models | HIGH | MEDIUM | Implement LOD system, frustum culling, instanced rendering |
| State management complexity | MEDIUM | HIGH | Use Zustand with immer for immutable updates, modular stores |
| Browser compatibility | MEDIUM | LOW | Modern browsers only, use polyfills for Safari |
| Context window overflow | HIGH | HIGH | Split into smaller waves, use atomic tasks, maximize parallelism |

---

## Notes

- **Context Budget:** This is MASSIVE - will hit context limits quickly
- **Strategy:** Execute in waves, generate SUMMARY.md after each plan
- **Parallelism:** Maximize - multiple tasks per wave can run in parallel
- **Documentation:** Comprehensive - every plan generates detailed SUMMARY
- **Testing:** Continuous - test as we build, not at the end
- **Branding:** Consistent - Savage Cabinetry everywhere

---

## Next Steps

1. ✓ Create Phase 6 directory
2. ⏳ Deploy scout/research agents (6-8 agents)
3. ⏳ Create executable plans (Wave 1-6, 21 plans total)
4. ⏳ Execute plans with wave-based parallelization
5. ⏳ Update ROADMAP and STATE
6. ⏳ Deploy Phase 7 scouts (if needed)

**Status:** Ready for parallel agent deployment
**Pipeline Mode:** v3.0 Strategic Research (thoroughness over speed)
**Overwatch:** Active and monitoring
