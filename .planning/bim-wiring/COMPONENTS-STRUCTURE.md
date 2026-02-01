# BIMWorkbench Component Structure & Wiring

## 1. File List

| File | Type | Purpose |
|------|------|---------|
| `index.ts` | Entry Point | Main barrel export for BIM Workbench module |
| `BIM3DCanvas.tsx` | React Component | Main 3D canvas using react-three-fiber |
| `BIM3DObject.ts` | Class | Base class for all 3D BIM objects |
| `BIMObjectFactory.ts` | Class | Factory for creating BIM objects with geometry/materials |
| `WorkingPlaneSystem.ts` | Class | Manages working planes for object placement |
| `SelectionVisualizer.ts` | Class | Handles visual feedback for selected objects |
| `DraftingCanvas.tsx` | React Component | 2D SVG drafting canvas |
| `CanvasControls.tsx` | React Component | Zoom, pan, grid toggle controls |
| `CoordinateDisplay.tsx` | React Component | Shows mouse position in world coords |
| `GridSystem.tsx` | React Component | SVG grid overlay rendering |
| `types/3d.ts` | Type Definitions | Shared types for BIM objects |
| `drafting-canvas.css` | Styles | CSS for drafting canvas |

---

## 2. Component Purposes (One-Line Summary)

| Component | Purpose |
|-----------|---------|
| `BIM3DCanvas` | Main 3D rendering canvas with Three.js/react-three-fiber, orbit controls, and object selection |
| `BIM3DObject` | Base class extending THREE.Object3D with BIM metadata, selection, and serialization |
| `BIMObjectFactory` | Creates BIM objects (walls, doors, windows, etc.) with geometry, materials, and IFC metadata |
| `WorkingPlaneSystem` | Manages 3D working planes (top/front/side/custom) for object placement |
| `SelectionVisualizer` | Provides visual feedback: highlights, bounding boxes, and transform controls |
| `DraftingCanvas` | 2D SVG canvas with pan/zoom, grid, and selection rectangle |
| `CanvasControls` | Toolbar with zoom, fit-to-view, grid/snap toggle buttons |
| `CoordinateDisplay` | Displays mouse position and distance measurements in mm |
| `GridSystem` | Renders performance-optimized SVG grid with major/minor lines |
| `types/3d` | Type definitions: BIMObjectMetadata, WorkingPlane, BIMObjectType, etc. |

---

## 3. Imports Analysis

### index.ts
```typescript
// Exports only - no imports
export * from './types/3d';
export { BIM3DObject } from './BIM3DObject';
export { WorkingPlaneSystem } from './WorkingPlaneSystem';
export { BIMObjectFactory } from './BIMObjectFactory';
export { SelectionVisualizer } from './SelectionVisualizer';
export { BIM3DCanvas, type BIM3DCanvasProps } from './BIM3DCanvas';
```

### BIM3DCanvas.tsx
```typescript
import React, { Suspense, useRef, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { BIM3DObject } from './BIM3DObject';
import { WorkingPlane } from './types/3d';
```

### BIM3DObject.ts
```typescript
import * as THREE from 'three';
import { BIMObjectMetadata } from './types/3d';
```

### BIMObjectFactory.ts
```typescript
import * as THREE from 'three';
import { BIM3DObject } from './BIM3DObject';
import { WorkingPlaneSystem } from './WorkingPlaneSystem';
import { BIMObjectType, BIMObjectCreateOptions, BIMObjectMetadata } from './types/3d';
```

### WorkingPlaneSystem.ts
```typescript
import * as THREE from 'three';
import { WorkingPlane, PlaneOrientation } from './types/3d';
```

### SelectionVisualizer.ts
```typescript
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { BIM3DObject } from './BIM3DObject';
```

### DraftingCanvas.tsx
```typescript
import React, { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useCanvasNavigation } from '../../hooks/useCanvasNavigation';
import { useSelectionRectangle } from '../../hooks/useSelectionRectangle';
import { GridSystem } from './GridSystem';
import { CoordinateDisplay } from './CoordinateDisplay';
import { CanvasControls } from './CanvasControls';
import type { GridConfig, Point2D, Bounds } from '../../types/drafting';
import { DEFAULT_GRID_CONFIG } from '../../types/drafting';
import './drafting-canvas.css';
```

### CanvasControls.tsx
```typescript
import React from 'react';
import { ZoomIn, ZoomOut, Maximize, Home, Grid3X3, Magnet } from 'lucide-react';
```

### CoordinateDisplay.tsx
```typescript
import React, { useMemo } from 'react';
import type { Point2D } from '../../types/drafting';
```

### GridSystem.tsx
```typescript
import React, { useMemo } from 'react';
import type { GridConfig, ViewBox } from '../../types/drafting';
```

### types/3d.ts
```typescript
import * as THREE from 'three';
```

---

## 4. Component Interconnections (BIMWorkbench References)

```
BIM3DCanvas.tsx
    ├── imports BIM3DObject (line 5)
    └── imports WorkingPlane (line 6)

BIMObjectFactory.ts
    ├── imports BIM3DObject (line 2)
    ├── imports WorkingPlaneSystem (line 3)
    └── imports types/3d (line 4)

SelectionVisualizer.ts
    └── imports BIM3DObject (line 3)

index.ts (exports barrel)
    ├── exports BIM3DObject
    ├── exports WorkingPlaneSystem
    ├── exports BIMObjectFactory
    ├── exports SelectionVisualizer
    └── exports BIM3DCanvas
```

**Key Dependency Flow:**
```
BIM3DObject ← BIM3DCanvas (rendering)
BIM3DObject ← BIMObjectFactory (creation)
BIM3DObject ← SelectionVisualizer (selection state)
WorkingPlaneSystem ← BIMObjectFactory (positioning)
WorkingPlaneSystem ← BIM3DCanvas (props)
types/3d ← All components (shared types)
```

---

## 5. Entry Points & Rendering Order

### 3D Rendering Path:
1. `BIM3DCanvas` - Main React component (entry)
2. `Scene` (internal) - Renders 3D content
3. `Grid` (from @react-three/drei) - Grid visualization
4. `OrbitControls` - Camera manipulation
5. `BIM3DObject` instances - Rendered as `<primitive object={obj} />`

### 2D Drafting Path:
1. `DraftingCanvas` - Main entry (forwardRef component)
2. `GridSystem` - SVG grid layer
3. `CanvasControls` - UI overlay (top-right)
4. `CoordinateDisplay` - UI overlay (bottom-left)

---

## 6. Export Structure (index.ts)

```typescript
// Types
export * from './types/3d';  // BIMObjectMetadata, WorkingPlane, BIMObjectType, etc.

// Core Classes
export { BIM3DObject } from './BIM3DObject';
export { WorkingPlaneSystem } from './WorkingPlaneSystem';
export { BIMObjectFactory } from './BIMObjectFactory';
export { SelectionVisualizer } from './SelectionVisualizer';

// Components
export { BIM3DCanvas, type BIM3DCanvasProps } from './BIM3DCanvas';
```

### What Consumers Can Import:

| Export | Type | Description |
|--------|------|-------------|
| `BIM3DObject` | Class | Base 3D BIM object |
| `BIMObjectFactory` | Class | Object factory for creating BIM elements |
| `WorkingPlaneSystem` | Class | Working plane management |
| `SelectionVisualizer` | Class | Selection visual feedback |
| `BIM3DCanvas` | React FC | 3D canvas component |
| `BIM3DCanvasProps` | Type | Canvas props interface |
| `BIMObjectMetadata` | Type | BIM metadata interface |
| `WorkingPlane` | Type | Working plane configuration |
| `BIMObjectType` | Type | Union type for object types |
| `BIMObjectCreateOptions` | Type | Object creation options |

---

## Summary

**Architecture Pattern:** Facade + Factory pattern with React components for UI

**Core Classes:**
- `BIM3DObject` - Domain model for 3D elements
- `BIMObjectFactory` - Creation pattern
- `WorkingPlaneSystem` - Spatial reference system
- `SelectionVisualizer` - Interaction feedback

**React Components:**
- `BIM3DCanvas` - 3D rendering wrapper
- `DraftingCanvas` - 2D drafting wrapper
- Supporting UI: `CanvasControls`, `CoordinateDisplay`, `GridSystem`

**Dependency Direction:**
```
Types (3d.ts)
    ↓
Core Classes (BIM3DObject, Factory, WorkingPlane, SelectionVisualizer)
    ↓
Components (BIM3DCanvas, DraftingCanvas)
    ↓
UI Sub-components (Controls, Display, Grid)
```
