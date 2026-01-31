# Scout Report: Push-Pull Extrusion Patterns and 3D Modeling Capabilities

**Scouted:** 2026-01-31  
**Target Phase:** Phase 2 Architecture (3D Extrusion Implementation)  
**Scout ID:** extrusion-modeling-research-agent  

## What We Found (Tier 1 - Stable)

### Codebase Location
- **Current 3D Canvas:** `src/components/ThreeDCanvas.tsx` (58 lines) - Basic React Three Fiber setup
- **Extrusion Planning:** `.planning/phases/02-architecture/02-04-PLAN.md` - Detailed task for ExtrusionTool implementation
- **Library Ready:** `@react-three/fiber` + `@react-three/drei` installed and configured

### Existing 3D Patterns
```typescript
// Current ThreeDCanvas.tsx foundation
const ThreeDCanvas: React.FC<ThreeDCanvasProps> = ({
  width = 800, height = 600
}) => (
  <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
    <OrbitControls enablePan enableZoom enableRotate />
    <Grid position={[0, -0.01, 0]} args={[20, 20]} />
  </Canvas>
);
```

### Existing Patterns
- **Canvas Architecture:** Declarative React Three Fiber setup with OrbitControls
- **Grid System:** Construction-scaled grid (1m × 1m) with fade effects
- **Component Structure:** Already supports modular 3D components

### Dependencies
- **Core 3D:** `@react-three/fiber v8.15.11`, `three v0.159.0`
- **Extended:** `@react-three/drei v9.88.11`, `zustand` for state
- **Ready for Extrusion:** Basic Three.js mesh manipulation capabilities exist
- **Unimplemented:** Actual extrusion logic, geometry modification, state management

## What We Need (Tier 2 - Decision-Dependent) 

### Unknowns Awaiting Phase N Decisions
- **Snapping System:** Should extrusion snap to construction units (600mm, 1200mm) or allow free-form?
- **State Persistence:** How long to persist extrusion history for undo operations?
- **Performance Constraints:** Maximum panels before extrusion becomes slow (instancing needs)
- **Material Feedback:** What visual indicators during extrusion (colors, highlights, measurements)?

### Questions for Planner
- Should extrusion use Three.js geometry modification or create new meshes?
- What coordinate system (meters vs mm) for extrusion operations?
- How to handle complex boolean operations (cutouts, unions with lighting) during extrusion?
- Should extrusion support multi-axis (height, width, depth) or focus on ceiling panels only?

## Recommendations

### Implementation Approach: Three.js Direct Geometry Modification + Zustand History

**Option A: Direct Geometry Modification (RECOMMENDED)**
- Pros: Immediate feedback, simple state management, Three.js direct API
- Cons: Performance impact with large geometry changes, memory usage
- Pattern: Modify geometry.attributes.position array in useFrame hooks

**Option B: Mesh Replacement System**
- Pros: Immutable geometries, easy undo, better performance for static scenes
- Cons: Complex state graph, harder real-time interaction feedback

### Extrusion Pattern Implementation

**Push-Pull Core Logic:**
```typescript
interface ExtrusionState {
  selectedMesh: THREE.Mesh | null
  initialGeometry: THREE.BufferGeometry | null
  currentHeight: number
  mode: 'idle' | 'extruding' | 'snapping'
}

const useExtrusionTool = () => {
  const [state, setState] = useZustand(extrusionStore)
  
  const startExtrusion = (mesh: THREE.Mesh) => {
    // Store initial geometry for undo
    setState({ selectedMesh: mesh, initialGeometry: mesh.geometry.clone() })
  }
  
  const updateHeight = (delta: number) => {
    const { selectedMesh, currentHeight } = state
    if (!selectedMesh) return
    
    // Modify geometry attributes directly
    const positions = selectedMesh.geometry.attributes.position
    // Extrusion logic here...
  }
}
```

### Geometry Operations Capabilities (Based on Research)

**Available Operations (Three.js Standard):**

1. **Direct Mesh Modification:**
   - `geometry.attributes.position` array manipulation
   - `geometry.translate()`, `scale()`, `rotateY()` methods
   - Real-time vertex position updates

2. **Boolean Operations:**
   - `THREE.Subtract()` from three-stdlib for lighting cutouts
   - `THREE.Union()` for panel combinations  
   - `THREE.Intersect()` for collision detection

3. **BufferGeometry Utilities:**
   - `BufferGeometryUtils.mergeBufferGeometries()` for combining
   - `BufferGeometry.computeVertexNormals()` for correct shading
   - `BufferGeometry.toNonIndexed()` for edge extrusion

### State Management Strategy

**Component State (Zustand Store):**
```typescript
interface ExtrusionStore {
  history: ExtrusionOperation[] // For undo/redo
  
  // Current operation
  activeMesh: THREE.Mesh | null
  initialData: BufferGeometryData
  currentModifiers: ExtrusionModifiers
  
  // UI state
  snapGrid: number // 600mm construction units
  visualFeedback: 'color' | 'outline' | 'measurement'
  
  // Performance
  instancedUpdate: boolean // Use InstancedMesh for batches
}
```

**Extrusion Operation History:**
```typescript
interface ExtrusionOperation {
  timestamp: number
  meshId: string
  fromGeometry: BufferGeometryData  
  toGeometry: BufferGeometryData
  modifiers: ExtrusionModifiers
}
```

### Undo/Redo Implementation

**History Stack Pattern:**
- **Operation Storage:** Clone geometries on start of each extrusion operation
- **Rollback:** Restore `geometry.attributes.position` and `normals`
- **Memory Management:** Limit history to 10-20 operations, discard oldest
- **Batch Operations:** Group rapid changes (drag extrusion) as single undo action

**Trigger:** Ctrl+Z/Ctrl+Y keyboard events or UI buttons

### Performance Considerations

**Mesh Operation Efficiency:**
- **Target:** <100ms response for extrusion updates (60fps interactive)
- **Optimization:** Use `useFrame` hook for batched updates instead of per-event
- **Instancing:** Switch to `InstancedMesh` for panels > 50 count
- **LOD (Level of Detail):** Simplify geometry for distant panels during extrusion

**Complex Ceiling Handling:**
- **Hierarchy:** Use Object3D groups for panel collections
- **Culling:** Frustum culling for off-screen extrusion operations  
- **Progressive Loading:** Load geometry in chunks for very large layouts

### Snapping System Implementation

**Grid-Aligned Extrusion:**
```typescript  
const snapToConstruction = (value: number): number => {
  const units = [600, 1200, 1800, 2400] // Construction panel sizes
  const targetUnit = units.find(unit => 
    Math.abs(value - unit) < snapThreshold
  )
  return targetUnit || Math.round(value / 600) * 600
}
```

**Visual Feedback During Snapping:**
- **Color Change:** Yellow highlight when near snap point
- **Measurement Overlay:** Show final snapped dimensions
- **Grid Highlight:** Intensify grid line at snap targets  

## Implementation Roadmap

### Phase 1: Core Extrusion (Week 1)
- Basic mouse drag height extrusion on single panels
- Direct geometry modification with immediate visual feedback
- Simple undo/redo for last 5 operations

### Phase 2: Enhanced Operations (Week 2)  
- Boolean operations for lighting cutouts during extrusion
- Construction unit snapping (600mm, 1200mm panels)
- Multi-panel selection and batch extrusion

### Phase 3: Performance & Polish (Week 3)
- InstancedMesh integration for large layouts (>50 panels)
- Advanced undo system with operation grouping
- Touch/mobile extrusion controls

### Phase 4: Advanced Features (Week 4)
- Multi-axis extrusion (width/depth in addition to height)  
- Real-time measurement overlays and dimensional feedback
- Auto-correction for structural constraints (load bearing, code compliance)

## Risk Assessment

### Technical Risks
- **Risk:** Direct geometry modification causing performance issues with large meshes
- **Mitigation:** Profile early, implement InstancedMesh threshold detection  

- **Risk:** Memory leaks from cloned geometries in undo stack
- **Mitigation:** Limit history depth, implement geometry disposal

- **Risk:** Complex boolean operations slow on mobile devices  
- **Mitigation:** Progressive detail reduction, WebGL capability detection

### Integration Risks
- **Risk:** Undo operations conflicting with backend calculation state
- **Mitigation:** Clear boundaries - extrusion for visualization, backend for calculation

- **Risk:** Snapping conflicts with precise architectural measurements
- **Mitigation:** Configurable snap behavior, toggle for free-form vs construction mode

---

## Scout Investigation Summary

### Current State Assessment
**Strengths:** 
- Solid foundation with React Three Fiber + zustand
- Better planning documentation for extrusion than I expected
- Clear architectural patterns for component integration

**Gaps Found:**
- No actual extrusion code implemented (still in planning phase)  
- No geometry manipulation utilities yet created
- No undo/redo infrastructure, state snapshots, or operation tracking

### Key Findings for Extrusion Capabilities

1. **Foundation:** Good Three.js setup provides all needed geometric manipulation APIs
2. **Patterns:** Planning shows sophisticated understanding of push-pull workflow
3. **Implementation:** Ready for immediate prototyping with existing component structure  
4. **Gaps:** Need state management and performance optimizations for production
5. **Timeline:** Can implement basic extrusion in ~1 week, full system in ~4 weeks

### Next Steps Recommended
1. Implement basic ExtrusionTool component using direct geometry modification
2. Add zustand store for extrusion state and history management  
3. Implement construction grid snapping and visual feedback
4. Add performance monitoring and InstancedMesh integration for scale

**Ready for Implementation:** All foundational pieces exist for extrusion development
**Confidence Level:** High - technology stack and planning quality are excellent

---

*Scout Report Complete*
