# BIM Workbench Store Patterns & State Management

## Executive Summary

The BIM Workbench has **4 Zustand stores** managing different aspects of state. The import error `"Failed to resolve import "../../stores/useBIMStore""` occurs because there are **two competing store implementations** and inconsistent import patterns across the codebase.

---

## 1. Store Files Found

### Location: `/home/tomas/Ceiling Panel Spacer/frontend/src/`

| File | Location | Type | Size | Status |
|------|----------|------|------|--------|
| `useBIMStore.ts` | `stores/` | TypeScript | 1,363 lines | **PRIMARY** - Full-featured BIM store |
| `useBIMStore.js` | `store/` | JavaScript | 960 lines | LEGACY - Uses devtools/persist middleware |
| `use3DStore.ts` | `stores/` | TypeScript | 58 lines | 3D canvas state |
| `useCabinetStore.ts` | `stores/` | TypeScript | 179 lines | Kitchen cabinet project state |
| `useDesignStore.ts` | `store/` | TypeScript | 196 lines | Ceiling panel design state |

---

## 2. Zustand Store Definitions

### 2.1 useBIMStore (PRIMARY)
**File:** `frontend/src/stores/useBIMStore.ts`

**Imports:**
```typescript
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
```

**State Managed:**
- Project state (`project`, `projects`, `activeProjectId`)
- Objects (`objects`, `selectedObjectIds`, `clipboard`)
- 3D scene (`scene`, `view`, `grid`)
- 2D canvas (`canvas2D`)
- Layers (`layers`, `activeLayerId`)
- Hierarchy: Site → Building → Level (`sites`, `buildings`, `levels`, `current*Id`)
- Tools (`activeTool`, `toolSettings`)
- Command history (`commands`, `currentCommandIndex`, `commandBatch`)
- UI state (`sidebar`, `propertiesPanel`)
- Selection sets (`selectionSets`)
- Auto-save (`autoSave`)

**Actions:** 80+ methods including project CRUD, object manipulation, selection, undo/redo, layers, hierarchy management, view controls, export/import

---

### 2.2 use3DStore
**File:** `frontend/src/stores/use3DStore.ts`

**Imports:**
```typescript
import { create } from 'zustand';
```

**State Managed:**
- Geometry objects (`geometry: GeometryObject[]`)
- Selected object (`selectedObject: string | null`)
- Camera state (`camera`, `cameraReset`)

**Actions:** `addGeometry`, `selectObject`, `moveCamera`, `resetCamera`

---

### 2.3 useCabinetStore
**File:** `frontend/src/stores/useCabinetStore.ts`

**Imports:**
```typescript
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
```

**State Managed:**
- Cabinet project (`project`, `isLoading`, `error`)

**Actions:** `createProject`, `updateDimensions`, `selectMaterial`, `calculate`, `clearProject`

---

### 2.4 useDesignStore
**File:** `frontend/src/store/useDesignStore.ts`

**Imports:**
```typescript
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
```

**State Managed:**
- Ceiling design (`currentDesign`, `selectedPanelId`)
- Grid snapping (`gridSnapEnabled`, `gridSnapSize`)
- Undo/redo history (`history`, `historyIndex`)

**Actions:** `setDesign`, `selectPanel`, `updatePanelMaterial`, `addPanel`, `removePanel`, grid actions, history actions

---

## 3. Components Using Each Store

### useBIMStore Consumers (29 files)

| Component | Import Path | Usage |
|-----------|------------|-------|
| `EllipseToolHandler.tsx` | `../../stores/useBIMStore` | `addObject`, `canvas2D` |
| `PolygonToolHandler.tsx` | `../../stores/useBIMStore` | `addObject`, `canvas2D` |
| `PolylineToolHandler.tsx` | `../../stores/useBIMStore` | `addObject`, `canvas2D` |
| `WindowToolHandler.tsx` | `../../stores/useBIMStore` | `addObject`, `canvas2D` |
| `DoorToolHandler.tsx` | `../../stores/useBIMStore` | `addObject`, `canvas2D` |
| `StairsToolHandler.tsx` | `../../stores/useBIMStore` | `addObject`, `canvas2D` |
| `RectangleToolHandler.tsx` | `../../stores/useBIMStore` | `addObject`, `canvas2D` |
| `ArcToolHandler.tsx` | `../../stores/useBIMStore` | `addObject`, `canvas2D` |
| `CircleToolHandler.tsx` | `../../stores/useBIMStore` | `addObject`, `canvas2D` |
| `LineToolHandler.tsx` | `../../stores/useBIMStore` | `addObject`, `canvas2D` |
| `ContextualHelp.tsx` | `../../stores/useBIMStore` | `showHelp`, `setShowHelp`, `currentHelpId` |
| `ObjectPropertiesPanel.tsx` | `../../../stores/useBIMStore` | `BIMObject` type |
| `BIMObjectManager.ts` | `../../../stores/useBIMStore` | `BIMObject` type |
| `StructuralPropertyPanel.tsx` | `../../stores/useBIMStore` | `updateObject`, `getSelectedObjects` |
| `SlabProperties.tsx` | `../../stores/useBIMStore` | `updateObject` |
| `ColumnProperties.tsx` | `../../stores/useBIMStore` | `updateObject` |
| `BeamProperties.tsx` | `../../stores/useBIMStore` | `updateObject` |
| `WallProperties.tsx` | `../../stores/useBIMStore` | `updateObject` |
| `structural.ts` | `../../stores/useBIMStore` | `BIMObject` type |
| `useLevels.ts` | `../stores/useBIMStore` | Sites, buildings, levels, objects |

---

### use3DStore Consumers (5 files)

| Component | Import Path | Usage |
|-----------|------------|-------|
| `ThreeDCanvas.tsx` | `../stores/use3DStore` | `geometry`, `cameraReset`, `addGeometry`, `moveCamera`, `resetCamera` |
| `ThreeDControls.tsx` | `../stores/use3DStore` | Default export used |
| `ObjectControlsCard.tsx` | `../stores/use3DStore` | `geometries`, `moveGeometry`, `selectGeometry` |
| `CameraResetButton.tsx` | `../../stores/use3DStore` | `resetCamera` |
| `AddShapeButton.tsx` | `../../stores/use3DStore` | `addGeometry` |

---

### useDesignStore Consumers (5 files)

| Component | Import Path | Usage |
|-----------|------------|-------|
| `ToolbarButtons.tsx` | `../store/useDesignStore` | `undo`, `redo`, `canUndo`, `canRedo`, `currentDesign` |
| `GridSnappingControls.tsx` | `../store/useDesignStore` | `gridSnapEnabled`, `gridSnapSize`, setters |
| `MaterialSelectionDropdown.tsx` | `../store/useDesignStore` | `selectedPanelId`, `updatePanelMaterial` |
| `MeasurementOverlay.tsx` | `../store/useDesignStore` | `selectedPanelId` |
| `store/index.ts` | `./useDesignStore` | Re-exports |

---

### useCabinetStore Consumers (1 file)

| Component | Import Path | Usage |
|-----------|------------|-------|
| `useCabinetStore.test.ts` | `../useCabinetStore` | Test file |

---

## 4. Import Path Analysis

### Valid Import Patterns (Working)

```typescript
// From components/BIM/tools/*.tsx (3 levels deep)
import { useBIMStore, BIMObject } from '../../stores/useBIMStore'

// From bim/property-panels/*.tsx (2 levels deep)
import { useBIMStore } from '../../stores/useBIMStore'

// From features/bim/components/*.tsx (4 levels deep)
import { BIMObject } from '../../../stores/useBIMStore'

// From hooks/*.ts (2 levels deep)
import { useBIMStore } from '../stores/useBIMStore'

// From components/ui/*.tsx (3 levels deep)
import { use3DStore } from '../../stores/use3DStore'
```

### Invalid Import Pattern (CAUSING ERROR)

The error `"Failed to resolve import "../../stores/useBIMStore""` suggests a file is trying to import from a path that doesn't resolve correctly.

**Potential causes:**
1. A file in the `bim/` directory (which only contains Python files) trying to import TypeScript stores
2. A file using `../../stores/` when it should use `../../store/` or vice versa
3. Missing `stores` directory in the import path resolution

---

## 5. Missing Store References

### 5.1 Duplicate Store Implementations

**Problem:** Two different `useBIMStore` implementations exist:

| Path | Implementation | Middleware | Notes |
|------|----------------|------------|-------|
| `frontend/src/stores/useBIMStore.ts` | Full implementation | None | 1,363 lines, comprehensive |
| `frontend/src/store/useBIMStore.js` | Legacy implementation | devtools, persist | 960 lines, uses bimClient API |

### 5.2 Import Path Inconsistency

```typescript
// Some files import from 'stores' (plural)
import { useBIMStore } from '../../stores/useBIMStore'

// Others import from 'store' (singular)
import { useDesignStore } from '../store/useDesignStore'
```

### 5.3 Missing Re-exports

The `frontend/src/stores/` directory lacks an `index.ts` to re-export all stores:

```typescript
// Missing file: frontend/src/stores/index.ts
export { useBIMStore } from './useBIMStore'
export { use3DStore } from './use3DStore'
export { useCabinetStore } from './useCabinetStore'
```

### 5.4 Component Store Mock Conflicts

Test file uses different mock paths:
- `frontend/src/components/__tests__/BIMComponents.test.tsx`: `../stores/useBIMStore`
- `frontend/src/stores/__tests__/useBIMStore.test.ts`: Direct import

---

## 6. Store Structure Patterns

### 6.1 Pattern: TypeScript Interface + create()

```typescript
interface StoreInterface {
  state1: Type1
  state2: Type2
  action1: (arg: Type) => void
}

export const useStoreName = create<StoreInterface>((set, get) => ({
  state1: default1,
  state2: default2,
  action1: (arg) => {
    set({ state1: arg })
  },
}))
```

### 6.2 Pattern: JSDoc + DevTools Middleware

Legacy store (`useBIMStore.js`) uses:
```javascript
export const useBIMStore = create(
  devtools(
    persist(
      (set, get) => ({ /* implementation */ }),
      { name: 'bim-store', partialize: ... }
    ),
    { name: 'BIMStore' }
  )
)
```

### 6.3 Pattern: Selector Middleware

```typescript
export const useDesignStore = create<DesignState>()(
  subscribeWithSelector((set, get) => ({ /* ... */ }))
)
```

---

## 7. Recommendations

### 7.1 Consolidate useBIMStore
- Choose one implementation (recommend: `stores/useBIMStore.ts` for TypeScript support)
- Remove or deprecate `store/useBIMStore.js`
- Update all consumers to use the chosen implementation

### 7.2 Standardize Import Paths
- Choose `stores/` (plural) as the canonical directory name
- Rename `store/` to `stores/` for consistency
- Create `frontend/src/stores/index.ts` for barrel exports

### 7.3 Create Re-export Index

```typescript
// frontend/src/stores/index.ts
export { useBIMStore } from './useBIMStore'
export type { BIMObject, BIMProject, SelectionMode } from './useBIMStore'
export { use3DStore } from './use3DStore'
export { useCabinetStore } from './useCabinetStore'
```

### 7.4 Update Import Statements

Change:
```typescript
import { useDesignStore } from '../store/useDesignStore'
```

To:
```typescript
import { useDesignStore } from '../stores/useDesignStore'
```

---

## 8. Import Resolution Diagram

```
frontend/src/
├── stores/                    # PRIMARY (use)
│   ├── index.ts              # MISSING - needs creation
│   ├── useBIMStore.ts        # 1363 lines - MAIN STORE
│   ├── use3DStore.ts         # 58 lines
│   ├── useCabinetStore.ts    # 179 lines
│   └── __tests__/
│       ├── useBIMStore.test.ts
│       └── useCabinetStore.test.ts
│
├── store/                    # LEGACY - inconsistent naming
│   ├── index.ts
│   ├── useBIMStore.js        # 960 lines - DUPLICATE/LEGACY
│   └── useDesignStore.ts     # 196 lines
│
└── components/
    ├── BIM/
    │   └── tools/
    │       └── LineToolHandler.tsx  # imports: '../../stores/useBIMStore' ✓
    ├── ui/
    │   ├── ThreeDControls.tsx        # imports: '../stores/use3DStore' ✓
    │   └── CameraResetButton.tsx     # imports: '../../stores/useBIMStore' ✓
    └── Help/
        └── ContextualHelp.tsx        # imports: '../../stores/useBIMStore' ✓
```

---

## 9. Error Root Cause Analysis

**The Error:** `"Failed to resolve import "../../stores/useBIMStore"`

**Root Causes:**

1. **Path Resolution Issue:** A file is trying to import from `../../stores/useBIMStore` but the path doesn't resolve correctly from its location.

2. **Possible failing locations:**
   - Any file in `frontend/src/bim/` (which contains Python files, not TypeScript)
   - Any file more than 4 levels deep trying to use `../../stores/`
   - Files that moved but import paths weren't updated

3. **Inconsistent directory naming:**
   - `stores/` (plural) exists for useBIMStore, use3DStore, useCabinetStore
   - `store/` (singular) exists for useDesignStore
   - Components import based on relative path depth, not convention

**Resolution Steps:**
1. Verify all TypeScript files are importing from the correct path
2. Check for any file importing from a non-existent `stores/` when it should be `store/`
3. Ensure `frontend/src/stores/index.ts` exists for proper module resolution
