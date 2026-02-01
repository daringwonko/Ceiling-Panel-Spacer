---
phase: 06-bim-workbench
plan: 09
subsystem: 3D BIM System
tags: [three.js, react-three-fiber, 3d, bim, typescript]
dependencies:
  requires:
    - 06-04-bim-api-layer
  provides:
    - BIM3DObject base class for all 3D objects
    - BIM3DCanvas for 3D scene rendering
    - WorkingPlaneSystem for object placement
    - BIMObjectFactory for creating typed objects
    - SelectionVisualizer for object manipulation
  affects:
    - 06-10-specific-bim-objects
    - 06-11-3d-tools-measurements
    - 06-12-3d-snap-constraints
tech-stack:
  added:
    - @react-three/fiber (React integration for Three.js)
    - @react-three/drei (Helper components)
    - three (3D library)
    - three/examples/jsm/controls/TransformControls
  patterns:
    - Factory pattern for object creation
    - Observer pattern for selection events
    - Component composition for React integration
key-files:
  created:
    - src/components/BIMWorkbench/types/3d.ts
    - src/components/BIMWorkbench/BIM3DObject.ts
    - src/components/BIMWorkbench/BIM3DCanvas.tsx
    - src/components/BIMWorkbench/WorkingPlaneSystem.ts
    - src/components/BIMWorkbench/BIMObjectFactory.ts
    - src/components/BIMWorkbench/SelectionVisualizer.ts
    - src/components/BIMWorkbench/index.ts
  modified: []
decisions:
  - Use @react-three/fiber for React-Three.js integration
  - Extend Three.js Object3D for BIM objects to maintain compatibility
  - Implement working plane system for consistent object placement
  - Cache materials for performance
  - Use TransformControls for object manipulation
metrics:
  duration: "40 minutes"
  completed: 2026-02-01
  files-created: 7
  lines-of-code: 1777
  test-coverage: pending
---

# Phase 6 Plan 9: 3D Object Base System Summary

## Overview

Created the foundational 3D system for BIM workbench using Three.js and @react-three/fiber. This provides the base architecture for 3D BIM object rendering, manipulation, and interaction.

## What Was Built

### 1. BIM3DObject Base Class (251 lines)

**File:** `src/components/BIMWorkbench/BIM3DObject.ts`

Extends Three.js Object3D with BIM-specific features:

- **IFC Metadata Support:** Stores ifcType, material, level, id, and custom properties
- **Selection Management:** `select()`, `deselect()`, `isSelected()` methods
- **Visual Highlighting:** Emissive material override for selection feedback
- **Serialization:** `toJSON()` and `fromJSON()` for data persistence
- **Utilities:** `getBoundingBox()`, `getCenter()`, `getDimensions()`, `dispose()`

**Key Methods:**
```typescript
class BIM3DObject extends THREE.Object3D {
  select(): void                    // Highlight and mark selected
  deselect(): void                  // Remove highlight
  updateMetadata(updates): void     // Update BIM properties
  toJSON(): object                  // Serialize to JSON
  static fromJSON(data): BIM3DObject // Deserialize
  dispose(): void                   // Cleanup resources
}
```

### 2. BIM3DCanvas Component (249 lines)

**File:** `src/components/BIMWorkbench/BIM3DCanvas.tsx`

Main 3D canvas using @react-three/fiber:

- **Three.js Integration:** Canvas with perspective camera
- **Lighting:** Ambient + Directional lights with shadows
- **Grid System:** Configurable grid using @react-three/drei Grid component
- **Orbit Controls:** Pan, zoom, rotate with configurable limits
- **Object Selection:** Raycasting for click-to-select with multi-select support
- **Working Plane:** Ray intersection for object placement

**Props Interface:**
```typescript
interface BIM3DCanvasProps {
  objects: BIM3DObject[];
  selectedIds: string[];
  workingPlane: WorkingPlane;
  gridSize?: number;
  gridDivisions?: number;
  onObjectSelect?: (id: string, multi: boolean) => void;
  onObjectDeselect?: (id: string) => void;
  onCanvasClick?: (point: THREE.Vector3) => void;
}
```

### 3. WorkingPlaneSystem (303 lines)

**File:** `src/components/BIMWorkbench/WorkingPlaneSystem.ts`

Manages working planes for 3D object placement:

- **Preset Orientations:** Top (XY), Front (XZ), Side (YZ)
- **Custom Planes:** Arbitrary normal and origin
- **Visualization:** PlaneHelper for visual reference
- **Projection:** Project points onto working plane
- **Ray Intersection:** Find where ray hits the plane

**Key Methods:**
```typescript
class WorkingPlaneSystem {
  setTopPlane(origin?): void        // XY plane, Z = 0
  setFrontPlane(origin?): void      // XZ plane, Y = 0
  setSidePlane(origin?): void       // YZ plane, X = 0
  setCustomPlane(normal, origin): void
  
  getPlane(): THREE.Plane
  projectPoint(point): Vector3
  rayIntersect(raycaster): Vector3 | null
  createHelper(scene): void
}
```

### 4. BIMObjectFactory (429 lines)

**File:** `src/components/BIMWorkbench/BIMObjectFactory.ts`

Factory for creating typed BIM objects:

- **Object Types:** wall, door, window, floor, ceiling, column, beam, custom
- **Type-Specific Helpers:** `createWall()`, `createDoor()`, etc.
- **Material System:** Cached materials (concrete, wood, glass, metal, brick)
- **IFC Types:** Automatic IFC entity type assignment
- **Working Plane Integration:** Objects positioned on current plane

**Supported Objects:**
```typescript
// Walls with width, height, thickness
createWall(2000, 3000, 200)

// Doors and windows
createDoor(900, 2100)
createWindow(1200, 1200)

// Structural elements
createFloor(5000, 5000)
createCeiling(5000, 5000)
createColumn(300, 3000)
createBeam(300, 500, 5000)
```

### 5. SelectionVisualizer (412 lines)

**File:** `src/components/BIMWorkbench/SelectionVisualizer.ts`

Complete selection feedback system:

- **Highlight Effect:** Emissive material on selected objects
- **Bounding Box:** BoxHelper around selections
- **Transform Controls:** Translate, rotate, scale gizmos
- **Multi-Selection:** Handle multiple selected objects
- **Events:** onTransformStart, onTransformChange, onTransformEnd

**Features:**
```typescript
class SelectionVisualizer {
  selectObject(object): void
  deselectObject(id): void
  clearSelection(): void
  
  enableTransform(mode): void      // 'translate' | 'rotate' | 'scale'
  disableTransform(): void
  
  setSnap(translate?, rotate?, scale?): void
  update(): void                   // Update in animation loop
}
```

### 6. TypeScript Types (114 lines)

**File:** `src/components/BIMWorkbench/types/3d.ts`

Comprehensive type definitions:

```typescript
interface BIMObjectMetadata {
  ifcType: string;      // 'IfcWall', 'IfcDoor', etc.
  material: string;
  level: string;
  id: string;
  properties: Record<string, any>;
}

type PlaneOrientation = 'top' | 'front' | 'side' | 'custom';

interface WorkingPlane {
  orientation: PlaneOrientation;
  normal: THREE.Vector3;
  constant: number;
  origin: THREE.Vector3;
  visible: boolean;
  size: number;
}

type BIMObjectType = 'wall' | 'door' | 'window' | 'floor' | 'ceiling' | 'column' | 'beam' | 'custom';
```

### 7. Module Exports (19 lines)

**File:** `src/components/BIMWorkbench/index.ts`

Centralized exports for clean imports:

```typescript
export * from './types/3d';
export { BIM3DObject } from './BIM3DObject';
export { WorkingPlaneSystem } from './WorkingPlaneSystem';
export { BIMObjectFactory } from './BIMObjectFactory';
export { SelectionVisualizer } from './SelectionVisualizer';
export { BIM3DCanvas, type BIM3DCanvasProps } from './BIM3DCanvas';
```

## Technical Architecture

### Component Relationships

```
BIM3DCanvas (React)
  ├── Scene (fiber component)
  │   ├── Lighting (Ambient + Directional)
  │   ├── Grid (drei Grid)
  │   ├── BIM3DObject[] (primitive objects)
  │   └── OrbitControls (drei)
  ├── Raycasting (for selection)
  └── WorkingPlane (for placement)

WorkingPlaneSystem
  └── PlaneHelper (visualization)

BIMObjectFactory
  ├── WorkingPlaneSystem (positioning)
  ├── MaterialCache (reused materials)
  └── Creates → BIM3DObject

SelectionVisualizer
  ├── BIM3DObject[] (selected)
  ├── BoxHelper[] (bounding boxes)
  └── TransformControls (manipulation)
```

### Dependencies

**Required packages:**
```json
{
  "three": "^0.x.x",
  "@react-three/fiber": "^8.x.x",
  "@react-three/drei": "^9.x.x"
}
```

**Integration with existing codebase:**
- Works with BIMWorkbench existing components
- Compatible with BIMStore state management
- Follows established TypeScript patterns

## Deviations from Plan

### None

All tasks implemented exactly as specified in the plan:
- ✅ Task 1: BIM3DObject base class with metadata, selection, serialization
- ✅ Task 2: BIM3DCanvas with fiber, orbit controls, grid, selection
- ✅ Task 3: WorkingPlaneSystem with all orientations and projection
- ✅ Task 4: BIMObjectFactory with all basic types
- ✅ Task 5: SelectionVisualizer with highlight, bbox, transform controls

## Verification

- ✅ All TypeScript types compile without errors
- ✅ All required exports present in index.ts
- ✅ BIM3DObject extends Object3D correctly
- ✅ BIM3DCanvas uses @react-three/fiber properly
- ✅ WorkingPlaneSystem supports all orientations
- ✅ BIMObjectFactory creates objects with correct geometry
- ✅ SelectionVisualizer uses TransformControls from three/examples/jsm

## Usage Example

```typescript
import {
  BIM3DObject,
  BIM3DCanvas,
  WorkingPlaneSystem,
  BIMObjectFactory,
  SelectionVisualizer
} from './components/BIMWorkbench';

// Set up working plane
const planeSystem = new WorkingPlaneSystem();
planeSystem.setTopPlane(new THREE.Vector3(0, 0, 0));

// Create object factory
const factory = new BIMObjectFactory(planeSystem);

// Create a wall
const wall = factory.createWall(2000, 3000, 200, {
  position: new THREE.Vector3(0, 1500, 0),
  material: 'concrete'
});

// Use in React component
function App() {
  const [objects, setObjects] = useState<BIM3DObject[]>([wall]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  return (
    <BIM3DCanvas
      objects={objects}
      selectedIds={selectedIds}
      workingPlane={planeSystem.getWorkingPlane()}
      onObjectSelect={(id, multi) => {
        if (multi) {
          setSelectedIds([...selectedIds, id]);
        } else {
          setSelectedIds([id]);
        }
      }}
    />
  );
}
```

## Next Steps

This base system enables:
1. **Plan 06-10:** Specific BIM objects (parametric walls, detailed doors/windows)
2. **Plan 06-11:** 3D measurements and annotations
3. **Plan 06-12:** 3D snapping and constraints
4. **Plan 06-13:** Material and texture system

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| types/3d.ts | 114 | TypeScript type definitions |
| BIM3DObject.ts | 251 | Base 3D object class |
| BIM3DCanvas.tsx | 249 | React 3D canvas component |
| WorkingPlaneSystem.ts | 303 | Working plane management |
| BIMObjectFactory.ts | 429 | Object creation factory |
| SelectionVisualizer.ts | 412 | Selection feedback system |
| index.ts | 19 | Module exports |
| **Total** | **1777** | **Complete 3D base system** |

## Commit

```
d7c6756 feat(06-09): create 3D object base system for BIM workbench
```
