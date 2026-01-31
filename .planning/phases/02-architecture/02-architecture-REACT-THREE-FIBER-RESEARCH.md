# Scout Report: React Three Fiber Integration for CEILING Design Tool

**Scouted:** 2026-01-31

**Target Phase:** 02-architecture 

**Scout ID:** React Three Fiber Research Specialist

## What We Found (Tier 1 - Stable)

### Codebase Location
- File: src/components/ThreeDCanvas.tsx (58 lines)
- Lines of interest: 39-41 (Canvas initialization), 45-51 (OrbitControls setup), 16-28 (Grid component with construction guides)
- Key functions: ThreeDCanvas component (props, sizing), Scene component (lighting setup), OrbitControls (architectural camera controls)

### Existing Patterns
- Canvas Setup: Declarative <Canvas> component from @react-three/fiber v8.15.11 with camera position [10,10,10], fov 50, WebGL auto-context
- Orbit Controls: OrbitControls from @react-three/drei for architectural viewing with pan, zoom, rotate, distance limits (5-50)
- Component Library: Grid from drei renders visual construction grid, positioned just below surface, Html ready for overlays
- Grids & Snapping: Grid component provides visual guides, snapping implementation needed for construction units (600mm, 1200mm typical)
- Measurements: Html component supported for dimension overlays, examples show 3D text positioning
- Selection: Select and TransformControls available from drei, multi-selection patterns in official repo
- Official Repositories: React Three Fiber has 20+ examples, drei offers OrbitControls, ArcballControls, TrackballControls variants

### Dependencies
- Imports: @react-three/fiber (Canvas, useFrame, useThree), @react-three/drei (OrbitControls, Grid, Html, Select, TransformControls)
- Requires: @react-three/fiber v8.15.11, @react-three/drei v9.88.11, three v0.159.0, zustand for state management
- Integration points: frontend/package.json ready, src/App.tsx can render ThreeDCanvas, lectors for debug UI optional

## What We Need (Tier 2 - Decision-Dependent)

### Unknowns Awaiting Phase N Decisions
- Panel rendering: How to render thousands of ceiling panels (instancedMesh performance vs individual geometry flexibility)
- Construction snapping: Custom grid snap logic for precise mm measurements, handle floating point limitations
- Component switching: Switch between panel types, material variations, load GLTFs vs procedural geometry
- Selection persistence: Track selected panels in React state vs useRef, handle multi-selection state
- Dimension anchoring: Position Html overlays relative to 3D edges that follow camera, handle zoom/pan updates
- Architectural presets: Save/load camera positions for standard ceiling views (overhead, isometric, detail)

### Questions for Planner
- What construction grid sizes support? (600mm tiles, 1200mm modules, custom user grids)
- Panel types include which properties? (material costs per sqm, acoustic ratings, mounting systems)
- Performance ceilings? (FPS targets, max renderable ceiling size, mobile compatibility)
- User interaction? (Visual only or allow panel placement/editing)
- Python data integration? (Receive JSON layouts, real-time 3D updates, handle layout changes)
- UI controls? (leva debug UI, custom architectural panel, settings panel integration)

## Recommendations

### Implementation Approach
- Option A: Add ceiling panel components as children in existing Scene component
  - Pros: Builds on current Canvas setup, maintains UI consistency, quick proof-of-concept
  - Cons: Risk messy with many panel types, possible scalability bottlenecks
- Option B: Dedicate <CeilingPanelCanvas /> component with isolated Canvas/Scene setup
  - Pros: Clean architecture, optimized for ceiling design, easier performance tuning
  - Cons: More initial setup, potential duplication of THREE.js configuration
- Scout preference: Option A for rapid prototyping with measurement/verification, evolve to Option B when patterns stabilize

### Risk Assessment
- Risk: Performance degradation with large ceiling sizes (>100 panels, >50m²)
  - Mitigation: Use instancedMesh for batching identical panels, levaproach frustum culling for off-screen panels, monitor with THREE.js stats
- Risk: Construction grid snapping introduces floating point errors for mm precision
  - Mitigation: Use scaled integers *1000 for calculations, validate snap accuracy with real panel sizes
- Risk: Html dimension overlays misalignment with 3D camera movements
  - Mitigation: Recalculate positions on useFrame/, use billboard-facing elements, test with various zoom levels
- Risk: Memory leaks from three.js object cleanup without proper dispose()
  - Mitigation: useEffect cleanup callbacks calling .dispose() on geometries/materials, test memory usage with DevTools

---

*Scout Report Complete*

