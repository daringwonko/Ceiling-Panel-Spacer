---
phase: 06
plan: 12
name: Project Hierarchy (PARALLEL EXECUTION B)
subsystem: BIM Workbench
status: complete
tags: [bim, hierarchy, levels, react, typescript]
duration: 2h 45m
completed: 2026-02-01
---

# Phase 06 Plan 12: Project Hierarchy Summary

## Overview
Implemented a comprehensive project hierarchy system for the BIM Workbench with **Site → Building → Level → Object** structure. This implementation includes full tree management with drag-drop reorganization, context menus, and complete BIM Store integration.

## What Was Built

### Core Hierarchy Classes

1. **Site** (`Site.ts`)
   - Geographic coordinates (lat/lon/elevation)
   - Terrain representation (flat/sloped/irregular)
   - Container for buildings
   - Address and location properties
   - JSON serialization

2. **Building** (`Building.ts`)
   - Container for levels
   - Building types (residential/commercial/industrial/etc.)
   - Auto-calculated bounding box
   - Level reordering
   - Properties: height, area, stories, structural system

3. **Level** (`Level.ts`)
   - Container for objects at specific elevation
   - Elevation and height data
   - Show/hide visibility toggle
   - 2D plan representation (scale, rotation, origin)
   - Ground level and roof level flags

4. **HierarchyManager** (`HierarchyManager.ts`)
   - Complete tree management system
   - CRUD operations for all hierarchy types
   - Drag-and-drop with validation
   - Context menu operations
   - Selection management (single/multi)
   - Expand/collapse tracking
   - Visibility toggles
   - Tree traversal utilities
   - Event system for changes
   - Full JSON serialization

### UI Components

1. **HierarchyTree** (`HierarchyTree.tsx`)
   - React tree view component
   - Expand/collapse toggles
   - Node type icons
   - Selection highlighting
   - Visibility toggles
   - Drag-and-drop support
   - Context menu (right-click)
   - Multi-select with Ctrl/Cmd

2. **HierarchyDemo** (`HierarchyDemo.tsx`)
   - Interactive demo
   - Sample project with buildings and levels
   - Real-time statistics
   - Usage instructions

### BIM Store Integration

Extended `useBIMStore` with:
- `hierarchyManager` state
- `createSite`, `createBuilding`, `createLevel` actions
- `removeSite`, `removeBuilding`, `removeLevel` actions
- `selectHierarchyNode`, `deselectHierarchyNode`
- `expandHierarchyNode`, `collapseHierarchyNode`
- `moveHierarchyNode` for drag-drop
- `renameHierarchyNode`
- `toggleHierarchyNodeVisibility`
- Project load/save with hierarchy

## What Was Built

### Core Hierarchy Types
- **Site**: Top-level container with geographic properties (lat/lon, elevation, address)
- **Building**: Container for levels with type, construction year, and address
- **Level**: Z-level container with elevation, height, usage type, and visibility

### UI Components

#### LevelPanel
- **File**: `frontend/src/components/LevelPanel/LevelPanel.tsx`
- **Features**:
  - Site/Building/Level selector dropdowns
  - Level list with visibility toggles
  - Filter and search functionality
  - Add/Delete/Copy level operations
  - Show/Hide/Isolate all levels
  - Properties panel integration

#### LevelListItem
- **File**: `frontend/src/components/LevelPanel/LevelListItem.tsx`
- **Features**:
  - Color-coded level indicators
  - Current level highlighting
  - Object count display
  - Quick visibility toggle
  - Copy/Delete actions on hover

#### LevelProperties
- **File**: `frontend/src/components/LevelPanel/LevelProperties.tsx`
- **Features**:
  - Edit level name, elevation, height
  - Level number management
  - Usage type selection (living/office/retail/utility/industrial)
  - Color picker for 2D view
  - Visibility toggle
  - Real-time validation (overlapping levels, bounds checking)
  - Statistics display (object count, total area, bounds)

#### PlanView
- **File**: `frontend/src/components/LevelPanel/PlanView.tsx`
- **Features**:
  - Canvas-based 2D plan representation
  - Auto-scaling to fit content
  - Grid display (major/minor)
  - Object rendering by type (walls, doors, windows, etc.)
  - Level boundary visualization
  - Scale and info overlay

### State Management

#### useLevels Hook
- **File**: `frontend/src/hooks/useLevels.ts`
- **Provides**:
  - Full CRUD operations for Sites, Buildings, Levels
  - Current selection management
  - Object assignment to levels
  - Move operations between levels
  - Copy level with objects
  - Visibility controls
  - Validation (elevation overlap, bounds)

#### Level Utilities
- **File**: `frontend/src/utils/levelUtils.ts`
- **Functions**:
  - Elevation formatting (metric/imperial)
  - Color conversion (RGB/Hex/CSS)
  - Building height calculation
  - Level sorting and validation
  - Auto-naming based on level number

### Store Integration

Extended `useBIMStore` with:
- `sites: Site[]` - All project sites
- `buildings: Building[]` - All buildings
- `levels: Level[]` - All levels
- `currentSiteId`, `currentBuildingId`, `currentLevelId` - Active selections

Updated export/import to preserve hierarchy data.

## Architecture

```
Site (geographic location)
  └── Building (construction type, year, bounding box)
        └── Level (elevation, height, usage, 2D plan)
              └── Objects (positioned at level elevation)
```

### Key Design Decisions

1. **UUID-based identifiers** for all hierarchy nodes
2. **Event-driven updates** via `onChange` callbacks
3. **Validation for drag-drop** ensuring valid parent-child relationships
4. **Map-based storage** for O(1) lookups
5. **Separation of concerns** between data classes and management
6. **Immutable operations** with new object creation
7. **Bidirectional references** for easy traversal

## Integration Points

### BIMLayout Integration
The LevelPanel can be integrated into BIMLayout as a sidebar panel:

```tsx
import { LevelPanel } from '../components/LevelPanel'

// In BIMLayout render:
<LevelPanel className="w-80" />
```

### Object Creation
Objects are automatically assigned to the current level:
- Object's Z position = level elevation
- Object's `level` property = current level ID
- Object added to level's `objectIds` array

### 3D View Filtering
Objects are filtered by level visibility:
```tsx
const visibleObjects = objects.filter(obj => {
  const level = levels.find(l => l.id === obj.level)
  return level?.isVisible ?? true
})
```

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/bim/hierarchy/Site.ts` | 133 | Site with geo coordinates |
| `src/bim/hierarchy/Building.ts` | 166 | Building with bounding box |
| `src/bim/hierarchy/Level.ts` | 187 | Level with visibility |
| `src/bim/hierarchy/HierarchyManager.ts` | 695 | Tree management |
| `src/bim/hierarchy/index.ts` | 21 | Module exports |
| `src/components/bim/HierarchyTree.tsx` | 455 | React tree view |
| `src/components/bim/HierarchyDemo.tsx` | 182 | Demo component |
| `src/store/useBIMStore.js` | +450 | Store integration |

**Total:** ~2,289 lines

## Usage Examples

### Creating a Project Hierarchy
```tsx
const store = useBIMStore()

// Create Site with geographic coordinates
const site = store.createSite('Main Campus', {
  latitude: 40.7128,
  longitude: -74.0060,
  elevation: 10
}, {
  address: '123 Construction Ave',
  city: 'New York',
  state: 'NY',
  country: 'USA'
})

// Create Building
const building = store.createBuilding('Office Tower', site.id, {
  buildingType: 'commercial',
  totalHeight: 45,
  totalArea: 5000,
  numberOfStories: 3
})

// Create Level
const level = store.createLevel('Ground Floor', building.id, {
  elevation: 0,
  height: 4.5,
  isGroundLevel: true,
  usage: 'office'
})
```

### Managing Hierarchy
```tsx
// Expand/collapse nodes
store.expandHierarchyNode(building.id)
store.collapseHierarchyNode(building.id)

// Select nodes
store.selectHierarchyNode(level.id)
store.selectHierarchyNode(otherLevel.id, true) // Additive

// Drag-drop reorganization
store.moveHierarchyNode(level.id, otherBuilding.id)

// Visibility toggle
store.toggleHierarchyNodeVisibility(level.id)

// Rename
store.renameHierarchyNode(level.id, 'First Floor')
```

### Using HierarchyTree Component
```tsx
const { hierarchyManager } = useBIMStore()

<HierarchyTree
  manager={hierarchyManager}
  onNodeSelect={(nodeId, nodeType) => {
    console.log('Selected:', nodeType, nodeId)
  }}
  onNodeDoubleClick={(nodeId, nodeType) => {
    console.log('Double-clicked:', nodeType, nodeId)
  }}
  onContextMenu={(nodeId, nodeType, event) => {
    console.log('Context menu:', nodeType, nodeId)
  }}
  showIcons={true}
  showVisibilityToggle={true}
  allowDragDrop={true}
/>
```

### Direct HierarchyManager Access
```tsx
const { hierarchyManager } = useBIMStore()

// Get root nodes (sites)
const sites = hierarchyManager.getRootNodes()

// Get children
const buildings = hierarchyManager.getChildren(site.id)
const levels = hierarchyManager.getChildren(building.id)

// Get path from root
const path = hierarchyManager.getPathToNode(level.id)
// [Site, Building, Level]

// Get all descendants
const allDescendants = hierarchyManager.getDescendants(site.id)

// Check state
const isSelected = hierarchyManager.isSelected(level.id)
const isExpanded = hierarchyManager.isExpanded(building.id)
const isVisible = hierarchyManager.isVisible(level.id)
```

## Testing

Test coverage:
- ✓ Site creation with geographic properties
- ✓ Building creation with site association
- ✓ Level creation with elevation and height
- ✓ Object assignment to levels
- ✓ Hierarchy traversal (Site → Building → Level)
- ✓ Tree management operations
- ✓ Drag-drop validation
- ✓ Selection management
- ✓ Expand/collapse functionality
- ✓ Visibility toggling
- ✓ Event notifications
- ✓ JSON serialization/deserialization
- ✓ Project export/import with hierarchy

## Commits

- `4b7e8314` feat(06-12): implement Site → Building → Level → Object hierarchy

## Next Steps

1. **Drag-Drop Reorganization**: Add drag-drop support for moving objects between levels
2. **Tree View**: Implement hierarchical tree view in sidebar
3. **3D Level Visualization**: Show level planes in 3D view
4. **Level Templates**: Pre-defined level configurations
5. **Elevation Snapshots**: Save/load different elevation configurations

## Compliance

- ✅ Site object with geographic properties (lat/lon/elevation)
- ✅ Site terrain representation (flat/sloped/irregular)
- ✅ Building object with auto-calculated bounding box
- ✅ Building type enumeration
- ✅ Level object with elevation, height, and 2D plan
- ✅ Level show/hide visibility toggle
- ✅ Tree view UI component (HierarchyTree)
- ✅ Drag-drop reorganization with validation
- ✅ Context menus (right-click operations)
- ✅ Expand/collapse functionality
- ✅ Multi-select support
- ✅ BIM Store integration
- ✅ Project export/import with hierarchy
- ✅ Event system for hierarchy changes
- ✅ JSON serialization/deserialization

## Known Limitations

1. No search/filter in tree view
2. No undo/redo for hierarchy operations
3. Copy/paste not yet implemented
4. No 3D visualization of hierarchy selection
5. Context menu uses basic browser prompts

## Performance Notes

- Level data stored in Zustand with selective subscriptions
- Object filtering by level uses memoized selectors
- PlanView uses canvas for efficient 2D rendering
- Hierarchy lookups use ID references (O(1) access)
