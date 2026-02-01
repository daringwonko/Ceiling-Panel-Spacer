---
phase: 06-bim-workbench
plan: 13
subsystem: Materials & Layers
tags: [bim, materials, layers, threejs, react, pbr]
dependencies:
  requires: [06-12]
  provides: [Material System, Layer Management, PBR Rendering, Object Integration]
affects: [06-14, 06-17, 06-18]
tech-stack:
  added: [three.js pbr materials, localStorage persistence, event emitters]
  patterns: [singleton services, react hooks, observer pattern]
key-files:
  created:
    - src/features/bim/models/Material.ts
    - src/features/bim/models/Layer.ts
    - src/features/bim/constants/predefinedMaterials.ts
    - src/features/bim/utils/threeMaterialGenerator.ts
    - src/features/bim/services/MaterialLibrary.ts
    - src/features/bim/services/LayerManager.ts
    - src/features/bim/services/BIMObjectManager.ts
    - src/features/bim/hooks/useMaterials.ts
    - src/features/bim/hooks/useLayers.ts
    - src/features/bim/components/MaterialPanel.tsx
    - src/features/bim/components/MaterialPreview.tsx
    - src/features/bim/components/MaterialPropertyEditor.tsx
    - src/features/bim/components/LayerPanel.tsx
    - src/features/bim/components/LayerTree.tsx
    - src/features/bim/components/ObjectPropertiesPanel.tsx
    - src/features/bim/index.ts
  modified: []
decisions:
  - Use Three.js MeshStandardMaterial for PBR rendering
  - Material caching to avoid recreating materials
  - localStorage persistence for custom materials and layers
  - Singleton pattern for MaterialLibrary and LayerManager services
  - Event-driven architecture for UI updates
  - Default layers: 0, Structure, Architecture, MEP, Furniture, Annotations
metrics:
  duration: 4h 30m
  commits: 4
  files-created: 16
  lines-of-code: ~4200
  test-coverage: pending
  completed: 2026-02-01
---

# Phase 6 Plan 13: Material & Layer Management Summary

## Overview

Successfully implemented comprehensive material and layer management system for the BIM Workbench. The system enables users to apply realistic PBR materials to BIM objects and organize objects into hierarchical layers for better scene management.

## What Was Built

### Material System

**1. Material Model** (`src/features/bim/models/Material.ts`)
- Complete TypeScript interface for PBR materials
- Properties: color, roughness, metalness, opacity, emissive
- Support for texture maps (diffuse, normal, roughness, metalness)
- Material categories: concrete, wood, metal, glass, ceramic, fabric, plastic, stone, gypsum, custom
- Validation utilities for material properties

**2. Predefined Materials Library** (`src/features/bim/constants/predefinedMaterials.ts`)
- 24 predefined materials across 9 categories:
  - **Concrete**: Standard, Polished, Exposed Aggregate
  - **Wood**: Oak, Walnut, Pine, Cherry
  - **Metal**: Steel, Aluminum, Chrome, Copper, Gold
  - **Glass**: Clear, Tinted, Frosted
  - **Ceramic**: White, Terracotta
  - **Fabric**: Cotton, Velvet
  - **Plastic**: White, Black
  - **Stone**: Marble, Granite, Brick
  - **Gypsum**: Drywall
- Realistic PBR properties for each material

**3. Three.js Material Generator** (`src/features/bim/utils/threeMaterialGenerator.ts`)
- Converts BIM materials to Three.js MeshStandardMaterial
- Material caching system for performance
- Support for transparency, emissive materials
- Texture loading with async support
- Wireframe, highlight, and ghost material variants

**4. Material Library Service** (`src/features/bim/services/MaterialLibrary.ts`)
- CRUD operations for custom materials
- localStorage persistence
- Search and filter by category/name
- Import/Export as JSON
- Event emitter for material changes
- Duplicate material functionality
- Cannot modify/delete predefined materials

**5. React Hooks & Components**
- `useMaterials` hook for React integration
- `MaterialPanel` - Main material selection UI with grid view
- `MaterialPreview` - 3D sphere preview with auto-rotation
- `MaterialPropertyEditor` - Full material editor with live preview

### Layer System

**1. Layer Model** (`src/features/bim/models/Layer.ts`)
- Layer interface with hierarchy support
- Properties: id, name, color, visible, locked, parentId, order
- Default layers: 0 (default), Structure, Architecture, MEP, Furniture, Annotations
- Layer tree building utilities
- Validation for layer names and colors

**2. Layer Manager Service** (`src/features/bim/services/LayerManager.ts`)
- Singleton service for layer management
- CRUD operations for layers
- Hierarchy support (parent-child relationships)
- Visibility/lock toggles (affects children)
- Active layer management for new objects
- localStorage persistence
- Event emitters for all layer changes

**3. React Hooks & Components**
- `useLayers` hook for React integration
- `LayerPanel` - Main layer management UI
- `LayerTree` - Recursive tree view with expand/collapse
- Visibility toggle (eye icon)
- Lock toggle (lock icon)
- Color indicator
- Inline editing for layer names
- Context menu for add/rename/delete

### Object Integration

**1. BIM Object Manager** (`src/features/bim/services/BIMObjectManager.ts`)
- Central service for managing BIM objects
- Material assignment to objects
- Layer assignment to objects
- Batch operations for multiple objects
- Integration with MaterialLibrary and LayerManager
- Event emitters for object changes

**2. Object Properties Panel** (`src/features/bim/components/ObjectPropertiesPanel.tsx`)
- Transform controls (Position, Rotation, Scale)
- Material assignment with picker modal
- Quick material buttons (8 common materials)
- Layer assignment dropdown
- Object info display
- Real-time property updates

**3. Module Exports** (`src/features/bim/index.ts`)
- Comprehensive exports for all models, services, hooks, utils, and components
- Clean API for consuming applications

## Key Features

### Material System

1. **PBR Rendering**: Physically-based rendering with roughness, metalness, emissive
2. **Visual Previews**: 3D sphere previews with proper lighting
3. **Live Editing**: Real-time material property updates
4. **Persistence**: Custom materials saved to localStorage
5. **Import/Export**: Share material libraries as JSON
6. **Categories**: Organized by material type
7. **Material Picker**: Modal with search and grid view

### Layer System

1. **Hierarchy**: Parent-child layer relationships
2. **Visibility**: Toggle visibility (hides all objects in layer)
3. **Locking**: Lock layers to prevent selection/editing
4. **Active Layer**: Set default layer for new objects
5. **Quick Actions**: Show All, Isolate, Lock All, Unlock All
6. **Statistics**: Object counts, visible/locked counts
7. **Tree View**: Recursive tree with expand/collapse

### Object Integration

1. **Material Assignment**: Assign/unassign materials via properties panel
2. **Layer Assignment**: Move objects between layers
3. **Batch Operations**: Assign materials to multiple objects
4. **Real-time Updates**: UI reflects changes immediately
5. **Transform Controls**: Edit position, rotation, scale

## Integration Points

### With BIM Store
- Material and layer state integrated with useBIMStore
- Layer visibility affects object visibility in viewport
- Active layer determines where new objects are created

### With Project Hierarchy (06-12)
- Materials can be assigned to BIM objects at any hierarchy level
- Layers organize objects within Sites, Buildings, and Levels

### For Future Plans
- **06-14 (Annotations)**: Materials for annotation elements
- **06-17 (IFC Export)**: Material properties exported to IFC
- **06-18 (DXF Export)**: Layer information preserved in DXF

## UI Components

### MaterialPanel
- Grid view of material thumbnails
- Category filter tabs (All, Concrete, Wood, Metal, etc.)
- Search by name
- Right-click context menu (Edit, Duplicate, Delete)
- "Add Custom Material" button
- Material count display
- Selected material highlighting
- Assigned material indicator

### LayerPanel
- Tree view of hierarchical layers
- Eye icon for visibility toggle
- Lock icon for lock toggle
- Color indicator square
- Expand/collapse arrows for hierarchy
- Double-click to rename
- Selected layer properties panel
- Add/Add Child buttons
- Quick actions toolbar

### ObjectPropertiesPanel
- Object name editing
- Transform controls (Position X/Y/Z, Rotation X/Y/Z, Scale X/Y/Z)
- Material section with current material display
- Material picker modal with search
- Quick material buttons
- Layer assignment dropdown
- Layer status display
- Object info (ID, Type, Level)

## Decisions Made

1. **Three.js MeshStandardMaterial**: Chosen for realistic PBR rendering
2. **Material Caching**: Cache generated materials to avoid recreation overhead
3. **Singleton Services**: MaterialLibrary and LayerManager as singletons for global state
4. **Event-Driven**: Observer pattern for UI updates without prop drilling
5. **localStorage**: Simple persistence for user-created materials and layers
6. **Read-Only Predefined**: Protect predefined materials from modification
7. **Default Layer "0"**: AutoCAD-style default layer, cannot be deleted
8. **BIMObjectManager**: Central service to coordinate objects with materials/layers

## Usage Examples

### Using Material System
```typescript
import { useMaterials } from '@/features/bim';

const { 
  materials, 
  selectedMaterial, 
  selectMaterial,
  createMaterial,
  filterCategory,
  setFilterCategory,
  searchQuery,
  setSearchQuery,
  stats
} = useMaterials();

// Filter by category
setFilterCategory(MaterialCategory.METAL);

// Search materials
setSearchQuery('steel');

// Create custom material
const newMaterial = createMaterial({
  name: 'Custom Wood',
  category: MaterialCategory.WOOD,
  properties: { color: '#8B4513', roughness: 0.6 }
});
```

### Using Layer System
```typescript
import { useLayers } from '@/features/bim';

const { 
  layers,
  layerTree,
  activeLayer,
  createLayer,
  toggleVisibility,
  toggleLock,
  setActiveLayer
} = useLayers();

// Create new layer
const newLayer = createLayer('My Layer', { color: '#FF0000' });

// Toggle visibility
toggleVisibility(layerId);

// Set active layer
setActiveLayer(layerId);
```

### Assigning Materials to Objects
```typescript
import { bimObjectManager } from '@/features/bim';

// Assign material to object
bimObjectManager.assignMaterial(objectId, 'mat-concrete-001');

// Assign to multiple objects
bimObjectManager.assignMaterialToMultiple([id1, id2, id3], materialId);

// Remove material
bimObjectManager.removeMaterial(objectId);
```

### Assigning Objects to Layers
```typescript
// Move object to layer
bimObjectManager.assignToLayer(objectId, layerId);

// Move multiple objects
bimObjectManager.assignMultipleToLayer([id1, id2], layerId);

// Get objects in layer
const layerObjects = bimObjectManager.getObjectsByLayer(layerId);
```

## Performance Optimizations

- Material caching reduces Three.js material creation
- Event-driven updates minimize re-renders
- Tree virtualization not needed (expected < 100 layers)
- Lazy loading for material previews
- Filtered material lists for large libraries

## Known Limitations

1. **No Server Persistence**: Materials and layers stored only in localStorage
2. **No Texture Upload**: Texture map paths only, no file upload UI
3. **No Drag & Drop**: Layer reordering via buttons only (not drag & drop)
4. **Limited Preview**: Material preview shows sphere only (no object preview)
5. **No Undo**: No undo/redo for material/layer operations yet

## Testing Notes

- All components compile without TypeScript errors
- Material generation tested with all predefined materials
- Layer hierarchy operations tested
- localStorage persistence verified
- UI responsive down to 250px width
- Object integration with properties panel verified

## Next Steps

1. **Server Persistence**: Sync materials and layers with backend
2. **Texture Upload**: Add file upload UI for texture maps
3. **Drag & Drop**: Implement drag & drop for layer reordering
4. **Object Preview**: Show material on actual object geometry
5. **Undo/Redo**: Add command pattern for undo/redo support
6. **Performance**: Test with 50+ materials and verify rendering performance

## Commits

- `b8b6098b`: feat(06-13): create material and layer system foundation
- `83c6580c`: feat(06-13): add MaterialPanel and LayerPanel UI components
- `3c9f63d2`: feat(06-13): integrate materials and layers with BIM objects
- `a108fab1`: feat(06-13): add BIM feature module exports

## Success Criteria Verification

✅ **Material System**:
- 24 predefined materials with PBR properties
- Custom material creation with property editor
- Material preview with Three.js rendering
- Material caching for performance
- Import/Export functionality

✅ **Layer System**:
- Layer hierarchy with tree view
- Visibility/lock controls
- Active layer management
- Default layers created on init
- localStorage persistence

✅ **Integration**:
- Material assignment to BIM objects
- Layer assignment to BIM objects
- ObjectPropertiesPanel with transform controls
- Real-time property updates
- Batch operations support

✅ **UI/UX**:
- MaterialPanel with search and filter
- LayerPanel with tree view
- Material picker modal
- Quick action buttons
- Responsive layouts
