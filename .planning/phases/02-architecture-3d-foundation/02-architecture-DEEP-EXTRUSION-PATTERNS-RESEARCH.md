# Scout Report: React Three Fiber ExtrudeGeometry Implementation

**Scouted:** 2026-01-31T14:39:04-05:00
**Target Phase:** Phase 2 - Architecture 3D Foundation
**Scout ID:** scout-extrusion-patterns-001

## What We Found (Tier 1 - Stable)

### ExtrudeGeometry API in Three.js
- **Three.js ExtrudeGeometry**: Core geometry for shape-to-3D extrusion
- **Parameters**: Shape (from THREE.Shape), depth/bevel parameters, extrudePath for complex extrusions
- **Bevel Options**: bevelEnabled, bevelThickness, bevelSize, bevelOffset, bevelSegments
- **Performance**: Creates BufferGeometry with vertices for side walls, cap faces, and bevel edges
- **Usage**: `new THREE.ExtrudeGeometry([shape], {depth: 1, bevelEnabled: false})`

### React Three Fiber Integration Patterns
- **<mesh> Component**: R3F wrapper for THREE.Mesh
- **geometry Props**: Accepts any Three.js geometry including ExtrudeGeometry
- **useRef Pattern**: `const meshRef = useRef<THREE.Mesh>(null)` for direct access
- **useFrame Hook**: For animation updates to extruded objects
- **Imperative Updates**: For dynamic geometry changes (shape/bevel modifications)

### State Management with Zustand
- **useGeometryStore**: Centralized store for panel shapes and extrusion parameters
- **Reactive Updates**: Store changes trigger re-computation of ExtrudeGeometry
- **Parameter Validation**: Store validates depth/bevel values before applying to geometry

### Performance Considerations
- **Geometry Reuse**: Cache ExtrudeGeometry instances for similar shapes
- **Material Optimization**: Use instanced materials for multiple extruded panels
- **LOD System**: Level-of-detail for distant extruded objects
- **Dispose Pattern**: Clean up geometry resources on unmount

## What We Need (Tier 2 - Decision-Dependent)

### Unknowns Awaiting Phase N Decisions
- **Shape Definition Format**: Will panels use THREE.Shape, custom shapes, or projectIO format?
- **Bevel Requirements**: Medical vs industrial panel standards for edge treatment?
- **Multi-shape Boolean Ops**: Required for lighting cutouts during extrusion phase?
- **Path Extrusion**: Will ceiling panels follow curved paths?

### Questions for Planner
- What tolerance for bevel thickness in medical facility ceilings?
- How will lighting cutouts integrate with panel extrusion?
- Required UV mapping for different panel materials?
- Performance budget for extruded geometry vertex count?

## Recommendations

### Implementation Strategy
- **Option A: Direct R3F Integration** - Use THREE.ExtrudeGeometry directly in meshes, update via zustand state changes
- **Option B: Custom Extrude Hook** - Create `useExtrudedPanel` with memoized geometry updates
- **Option C: Geometry Manager** - Centralized ExtrudeGeometry factory with caching

**Recommendation**: Option B - Custom hook for panel-specific extrusion logic while maintaining R3F ecosystem compatibility

### Risk Assessment
- **Dependency Risk**: React Three Fiber version upgrade could change ExtrudeGeometry API patterns
- **Performance Risk**: Complex shapes with beveled edges may exceed ceiling panel geometry budget
- **Boolean Ops Risk**: Lighting cutouts require Three.js CSG library integration, increases complexity

---

*Scout Report Complete*
