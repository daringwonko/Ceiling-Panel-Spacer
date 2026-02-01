import * as React from 'react'
import { HierarchyTree } from './HierarchyTree'
import {
  HierarchyManager,
  Site,
  Building,
  Level,
} from '../../bim/hierarchy'

/**
 * Demo component showcasing the Project Hierarchy system
 * 
 * Features:
 * - Site → Building → Level → Object hierarchy
 * - Drag-drop reorganization
 * - Context menus (right-click)
 * - Expand/collapse
 * - Visibility toggles
 */
export const HierarchyDemo: React.FC = () => {
  // Create hierarchy manager with demo data
  const [manager] = React.useState(() => {
    const mgr = new HierarchyManager({
      allowMultiSelect: true,
      allowDragDrop: true,
      expandOnSelect: false,
      showRootNode: true,
    })

    // Create demo site
    const site = new Site(
      'Main Campus',
      { latitude: 40.7128, longitude: -74.0060, elevation: 10 },
      {
        address: '123 Construction Ave',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        elevation: 10,
      }
    )
    mgr.addSite(site)

    // Create buildings
    const building1 = new Building(
      'Building A - Office',
      site.id,
      {
        buildingType: 'commercial',
        totalHeight: 45,
        totalArea: 5000,
        numberOfStories: 3,
      }
    )
    mgr.addBuilding(building1)

    const building2 = new Building(
      'Building B - Warehouse',
      site.id,
      {
        buildingType: 'industrial',
        totalHeight: 15,
        totalArea: 8000,
        numberOfStories: 1,
      }
    )
    mgr.addBuilding(building2)

    // Create levels for Building A
    const levelA1 = new Level('Ground Floor', building1.id, {
      elevation: 0,
      height: 4.5,
      isGroundLevel: true,
    })
    mgr.addLevel(levelA1)

    const levelA2 = new Level('Floor 2', building1.id, {
      elevation: 4.5,
      height: 4,
    })
    mgr.addLevel(levelA2)

    const levelA3 = new Level('Floor 3', building1.id, {
      elevation: 8.5,
      height: 4,
      isRoofLevel: true,
    })
    mgr.addLevel(levelA3)

    // Create levels for Building B
    const levelB1 = new Level('Warehouse Floor', building2.id, {
      elevation: 0,
      height: 12,
      isGroundLevel: true,
      isRoofLevel: true,
    })
    mgr.addLevel(levelB1)

    // Add some demo objects
    mgr.addObjectToLevel('wall-001', levelA1.id)
    mgr.addObjectToLevel('wall-002', levelA1.id)
    mgr.addObjectToLevel('door-001', levelA1.id)
    mgr.addObjectToLevel('window-001', levelA2.id)
    mgr.addObjectToLevel('column-001', levelA3.id)
    mgr.addObjectToLevel('beam-001', levelB1.id)

    // Expand the site node
    mgr.expandNode(site.id)

    return mgr
  })

  // Track updates
  const [updateCount, setUpdateCount] = React.useState(0)

  React.useEffect(() => {
    const unsubscribe = manager.onChange(() => {
      setUpdateCount(prev => prev + 1)
    })
    return unsubscribe
  }, [manager])

  // Get statistics
  const stats = React.useMemo(() => {
    const sites = Array.from(manager.sites.values())
    const buildings = Array.from(manager.buildings.values())
    const levels = Array.from(manager.levels.values())
    const nodes = manager.getAllNodes()

    return {
      sites: sites.length,
      buildings: buildings.length,
      levels: levels.length,
      totalNodes: nodes.length,
      selectedNodes: manager.getSelectedIds().length,
    }
  }, [manager, updateCount])

  return (
    <div className="flex flex-col h-full bg-savage-base">
      {/* Header */}
      <div className="px-4 py-3 border-b border-savage-surface">
        <h2 className="text-lg font-semibold text-savage-text">
          Project Hierarchy
        </h2>
        <p className="text-sm text-savage-text-muted">
          Site → Building → Level → Object
        </p>
      </div>

      {/* Stats */}
      <div className="px-4 py-2 border-b border-savage-surface flex gap-4 text-xs text-savage-text-muted">
        <span>{stats.sites} Sites</span>
        <span>{stats.buildings} Buildings</span>
        <span>{stats.levels} Levels</span>
        <span>{stats.selectedNodes} Selected</span>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-hidden">
        <HierarchyTree
          manager={manager}
          onNodeSelect={(nodeId, nodeType) => {
            console.log('Selected:', nodeType, nodeId)
          }}
          onNodeDoubleClick={(nodeId, nodeType) => {
            console.log('Double-clicked:', nodeType, nodeId)
          }}
          onContextMenu={(nodeId, nodeType, event) => {
            console.log('Context menu:', nodeType, nodeId)
          }}
          className="h-full"
          showIcons={true}
          showVisibilityToggle={true}
          allowDragDrop={true}
        />
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 border-t border-savage-surface text-xs text-savage-text-muted space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">Click</span>
          <span>to select</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Double-click</span>
          <span>to expand/collapse</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Right-click</span>
          <span>for context menu</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Drag & Drop</span>
          <span>to reorganize</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Ctrl+Click</span>
          <span>for multi-select</span>
        </div>
      </div>
    </div>
  )
}

export default HierarchyDemo
