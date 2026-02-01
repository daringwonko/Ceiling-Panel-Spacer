import { Site } from './Site'
import { Building } from './Building'
import { Level } from './Level'

/**
 * Hierarchy node type
 */
export type HierarchyNodeType = 'site' | 'building' | 'level' | 'object'

/**
 * Hierarchy node representation
 */
export interface HierarchyNode {
  id: string
  type: HierarchyNodeType
  name: string
  parentId?: string
  children: string[]
  expanded: boolean
  visible: boolean
  locked?: boolean
  selected: boolean
  metadata?: Record<string, any>
}

/**
 * Hierarchy operation types
 */
export type HierarchyOperation = 
  | 'create'
  | 'delete'
  | 'move'
  | 'rename'
  | 'expand'
  | 'collapse'
  | 'select'
  | 'deselect'
  | 'toggleVisibility'
  | 'toggleLock'

/**
 * Drag and drop data
 */
export interface DragDropData {
  nodeId: string
  nodeType: HierarchyNodeType
  sourceParentId?: string
}

/**
 * Hierarchy change event
 */
export interface HierarchyChangeEvent {
  operation: HierarchyOperation
  nodeId: string
  nodeType: HierarchyNodeType
  parentId?: string
  previousParentId?: string
  index?: number
  previousIndex?: number
}

/**
 * Hierarchy manager configuration
 */
export interface HierarchyManagerConfig {
  allowMultiSelect: boolean
  allowDragDrop: boolean
  expandOnSelect: boolean
  collapseOnDeselect: boolean
  showRootNode: boolean
}

/**
 * HierarchyManager class - Manages Site → Building → Level → Object hierarchy
 * 
 * Provides tree structure management, drag-drop reorganization,
 * context menu operations, and expand/collapse functionality.
 */
export class HierarchyManager {
  sites: Map<string, Site>
  buildings: Map<string, Building>
  levels: Map<string, Level>
  nodeMap: Map<string, HierarchyNode>
  selectedNodeIds: Set<string>
  expandedNodeIds: Set<string>
  config: HierarchyManagerConfig
  changeListeners: Set<(event: HierarchyChangeEvent) => void>

  constructor(config: Partial<HierarchyManagerConfig> = {}) {
    this.sites = new Map()
    this.buildings = new Map()
    this.levels = new Map()
    this.nodeMap = new Map()
    this.selectedNodeIds = new Set()
    this.expandedNodeIds = new Set()
    this.config = {
      allowMultiSelect: true,
      allowDragDrop: true,
      expandOnSelect: false,
      collapseOnDeselect: false,
      showRootNode: true,
      ...config,
    }
    this.changeListeners = new Set()
  }

  // ============================================================================
  // SITE OPERATIONS
  // ============================================================================

  /**
   * Add a site to the hierarchy
   */
  addSite(site: Site): void {
    this.sites.set(site.id, site)
    this.createNode(site.id, 'site', site.name, undefined, site.buildingIds)
    this.notifyChange({
      operation: 'create',
      nodeId: site.id,
      nodeType: 'site',
    })
  }

  /**
   * Remove a site from the hierarchy
   */
  removeSite(siteId: string): void {
    const site = this.sites.get(siteId)
    if (!site) return

    // Remove all buildings in this site
    site.buildingIds.forEach(buildingId => this.removeBuilding(buildingId))
    
    this.sites.delete(siteId)
    this.nodeMap.delete(siteId)
    this.selectedNodeIds.delete(siteId)
    this.expandedNodeIds.delete(siteId)
    
    this.notifyChange({
      operation: 'delete',
      nodeId: siteId,
      nodeType: 'site',
    })
  }

  // ============================================================================
  // BUILDING OPERATIONS
  // ============================================================================

  /**
   * Add a building to the hierarchy
   */
  addBuilding(building: Building): void {
    const site = this.sites.get(building.siteId)
    if (!site) {
      throw new Error(`Site ${building.siteId} not found`)
    }

    this.buildings.set(building.id, building)
    site.addBuilding(building.id)
    
    this.createNode(building.id, 'building', building.name, site.id, building.levelIds)
    
    this.notifyChange({
      operation: 'create',
      nodeId: building.id,
      nodeType: 'building',
      parentId: site.id,
    })
  }

  /**
   * Remove a building from the hierarchy
   */
  removeBuilding(buildingId: string): void {
    const building = this.buildings.get(buildingId)
    if (!building) return

    // Remove from site
    const site = this.sites.get(building.siteId)
    if (site) {
      site.removeBuilding(buildingId)
    }

    // Remove all levels in this building
    building.levelIds.forEach(levelId => this.removeLevel(levelId))
    
    this.buildings.delete(buildingId)
    this.nodeMap.delete(buildingId)
    this.selectedNodeIds.delete(buildingId)
    this.expandedNodeIds.delete(buildingId)
    
    this.notifyChange({
      operation: 'delete',
      nodeId: buildingId,
      nodeType: 'building',
    })
  }

  /**
   * Move a building to a different site
   */
  moveBuilding(buildingId: string, targetSiteId: string): void {
    const building = this.buildings.get(buildingId)
    const targetSite = this.sites.get(targetSiteId)
    
    if (!building || !targetSite) {
      throw new Error('Building or target site not found')
    }

    const previousSiteId = building.siteId
    
    // Remove from old site
    const oldSite = this.sites.get(previousSiteId)
    if (oldSite) {
      oldSite.removeBuilding(buildingId)
    }
    
    // Add to new site
    building.siteId = targetSiteId
    targetSite.addBuilding(buildingId)
    
    // Update node
    const node = this.nodeMap.get(buildingId)
    if (node) {
      node.parentId = targetSiteId
    }
    
    this.notifyChange({
      operation: 'move',
      nodeId: buildingId,
      nodeType: 'building',
      parentId: targetSiteId,
      previousParentId: previousSiteId,
    })
  }

  // ============================================================================
  // LEVEL OPERATIONS
  // ============================================================================

  /**
   * Add a level to the hierarchy
   */
  addLevel(level: Level): void {
    const building = this.buildings.get(level.buildingId)
    if (!building) {
      throw new Error(`Building ${level.buildingId} not found`)
    }

    this.levels.set(level.id, level)
    building.addLevel(level.id)
    
    this.createNode(level.id, 'level', level.name, building.id, level.objectIds)
    
    this.notifyChange({
      operation: 'create',
      nodeId: level.id,
      nodeType: 'level',
      parentId: building.id,
    })
  }

  /**
   * Remove a level from the hierarchy
   */
  removeLevel(levelId: string): void {
    const level = this.levels.get(levelId)
    if (!level) return

    // Remove from building
    const building = this.buildings.get(level.buildingId)
    if (building) {
      building.removeLevel(levelId)
    }
    
    this.levels.delete(levelId)
    this.nodeMap.delete(levelId)
    this.selectedNodeIds.delete(levelId)
    this.expandedNodeIds.delete(levelId)
    
    this.notifyChange({
      operation: 'delete',
      nodeId: levelId,
      nodeType: 'level',
    })
  }

  /**
   * Move a level to a different building
   */
  moveLevel(levelId: string, targetBuildingId: string): void {
    const level = this.levels.get(levelId)
    const targetBuilding = this.buildings.get(targetBuildingId)
    
    if (!level || !targetBuilding) {
      throw new Error('Level or target building not found')
    }

    const previousBuildingId = level.buildingId
    
    // Remove from old building
    const oldBuilding = this.buildings.get(previousBuildingId)
    if (oldBuilding) {
      oldBuilding.removeLevel(levelId)
    }
    
    // Add to new building
    level.buildingId = targetBuildingId
    targetBuilding.addLevel(levelId)
    
    // Update node
    const node = this.nodeMap.get(levelId)
    if (node) {
      node.parentId = targetBuildingId
    }
    
    this.notifyChange({
      operation: 'move',
      nodeId: levelId,
      nodeType: 'level',
      parentId: targetBuildingId,
      previousParentId: previousBuildingId,
    })
  }

  /**
   * Reorder levels within a building
   */
  reorderLevels(buildingId: string, levelIds: string[]): void {
    const building = this.buildings.get(buildingId)
    if (!building) {
      throw new Error('Building not found')
    }

    building.reorderLevels(levelIds)
    
    // Update node children
    const node = this.nodeMap.get(buildingId)
    if (node) {
      node.children = levelIds
    }
  }

  // ============================================================================
  // OBJECT OPERATIONS
  // ============================================================================

  /**
   * Add an object reference to a level
   */
  addObjectToLevel(objectId: string, levelId: string): void {
    const level = this.levels.get(levelId)
    if (!level) {
      throw new Error(`Level ${levelId} not found`)
    }

    level.addObject(objectId)
    
    // Create or update object node
    if (!this.nodeMap.has(objectId)) {
      this.createNode(objectId, 'object', `Object ${objectId}`, levelId, [])
    } else {
      const node = this.nodeMap.get(objectId)
      if (node) {
        node.parentId = levelId
      }
    }
    
    // Update level node children
    const levelNode = this.nodeMap.get(levelId)
    if (levelNode) {
      if (!levelNode.children.includes(objectId)) {
        levelNode.children.push(objectId)
      }
    }
    
    this.notifyChange({
      operation: 'create',
      nodeId: objectId,
      nodeType: 'object',
      parentId: levelId,
    })
  }

  /**
   * Remove an object from its level
   */
  removeObject(objectId: string): void {
    const node = this.nodeMap.get(objectId)
    if (!node || node.type !== 'object') return

    // Remove from level
    if (node.parentId) {
      const level = this.levels.get(node.parentId)
      if (level) {
        level.removeObject(objectId)
      }
      
      // Update level node children
      const levelNode = this.nodeMap.get(node.parentId)
      if (levelNode) {
        levelNode.children = levelNode.children.filter(id => id !== objectId)
      }
    }
    
    this.nodeMap.delete(objectId)
    this.selectedNodeIds.delete(objectId)
    
    this.notifyChange({
      operation: 'delete',
      nodeId: objectId,
      nodeType: 'object',
    })
  }

  /**
   * Move an object to a different level
   */
  moveObject(objectId: string, targetLevelId: string): void {
    const node = this.nodeMap.get(objectId)
    const targetLevel = this.levels.get(targetLevelId)
    
    if (!node || !targetLevel || node.type !== 'object') {
      throw new Error('Object or target level not found')
    }

    const previousLevelId = node.parentId
    
    // Remove from old level
    if (previousLevelId) {
      const oldLevel = this.levels.get(previousLevelId)
      if (oldLevel) {
        oldLevel.removeObject(objectId)
      }
      
      const oldLevelNode = this.nodeMap.get(previousLevelId)
      if (oldLevelNode) {
        oldLevelNode.children = oldLevelNode.children.filter(id => id !== objectId)
      }
    }
    
    // Add to new level
    targetLevel.addObject(objectId)
    node.parentId = targetLevelId
    
    const targetLevelNode = this.nodeMap.get(targetLevelId)
    if (targetLevelNode) {
      targetLevelNode.children.push(objectId)
    }
    
    this.notifyChange({
      operation: 'move',
      nodeId: objectId,
      nodeType: 'object',
      parentId: targetLevelId,
      previousParentId: previousLevelId,
    })
  }

  // ============================================================================
  // NODE MANAGEMENT
  // ============================================================================

  /**
   * Create a hierarchy node
   */
  private createNode(
    id: string,
    type: HierarchyNodeType,
    name: string,
    parentId?: string,
    children: string[] = []
  ): HierarchyNode {
    const node: HierarchyNode = {
      id,
      type,
      name,
      parentId,
      children: [...children],
      expanded: false,
      visible: true,
      selected: false,
    }
    this.nodeMap.set(id, node)
    return node
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): HierarchyNode | undefined {
    return this.nodeMap.get(id)
  }

  /**
   * Get all nodes
   */
  getAllNodes(): HierarchyNode[] {
    return Array.from(this.nodeMap.values())
  }

  /**
   * Rename a node
   */
  renameNode(id: string, newName: string): void {
    const node = this.nodeMap.get(id)
    if (!node) return

    node.name = newName
    
    // Update the actual entity
    switch (node.type) {
      case 'site':
        const site = this.sites.get(id)
        if (site) site.name = newName
        break
      case 'building':
        const building = this.buildings.get(id)
        if (building) building.name = newName
        break
      case 'level':
        const level = this.levels.get(id)
        if (level) level.name = newName
        break
    }
    
    this.notifyChange({
      operation: 'rename',
      nodeId: id,
      nodeType: node.type,
    })
  }

  // ============================================================================
  // SELECTION
  // ============================================================================

  /**
   * Select a node
   */
  selectNode(id: string, additive = false): void {
    if (!additive) {
      this.selectedNodeIds.clear()
    }
    this.selectedNodeIds.add(id)
    
    const node = this.nodeMap.get(id)
    if (node) {
      node.selected = true
      
      if (this.config.expandOnSelect) {
        this.expandedNodeIds.add(id)
        node.expanded = true
      }
    }
    
    this.notifyChange({
      operation: 'select',
      nodeId: id,
      nodeType: node?.type || 'object',
    })
  }

  /**
   * Deselect a node
   */
  deselectNode(id: string): void {
    this.selectedNodeIds.delete(id)
    
    const node = this.nodeMap.get(id)
    if (node) {
      node.selected = false
      
      if (this.config.collapseOnDeselect) {
        this.expandedNodeIds.delete(id)
        node.expanded = false
      }
    }
    
    this.notifyChange({
      operation: 'deselect',
      nodeId: id,
      nodeType: node?.type || 'object',
    })
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    const previousSelection = Array.from(this.selectedNodeIds)
    
    this.selectedNodeIds.forEach(id => {
      const node = this.nodeMap.get(id)
      if (node) {
        node.selected = false
      }
    })
    this.selectedNodeIds.clear()
    
    previousSelection.forEach(id => {
      const node = this.nodeMap.get(id)
      if (node) {
        this.notifyChange({
          operation: 'deselect',
          nodeId: id,
          nodeType: node.type,
        })
      }
    })
  }

  /**
   * Get selected node IDs
   */
  getSelectedIds(): string[] {
    return Array.from(this.selectedNodeIds)
  }

  /**
   * Check if a node is selected
   */
  isSelected(id: string): boolean {
    return this.selectedNodeIds.has(id)
  }

  // ============================================================================
  // EXPAND/COLLAPSE
  // ============================================================================

  /**
   * Expand a node
   */
  expandNode(id: string): void {
    this.expandedNodeIds.add(id)
    
    const node = this.nodeMap.get(id)
    if (node) {
      node.expanded = true
      this.notifyChange({
        operation: 'expand',
        nodeId: id,
        nodeType: node.type,
      })
    }
  }

  /**
   * Collapse a node
   */
  collapseNode(id: string): void {
    this.expandedNodeIds.delete(id)
    
    const node = this.nodeMap.get(id)
    if (node) {
      node.expanded = false
      this.notifyChange({
        operation: 'collapse',
        nodeId: id,
        nodeType: node.type,
      })
    }
  }

  /**
   * Toggle node expansion
   */
  toggleExpansion(id: string): void {
    if (this.expandedNodeIds.has(id)) {
      this.collapseNode(id)
    } else {
      this.expandNode(id)
    }
  }

  /**
   * Check if a node is expanded
   */
  isExpanded(id: string): boolean {
    return this.expandedNodeIds.has(id)
  }

  /**
   * Expand all nodes
   */
  expandAll(): void {
    this.nodeMap.forEach((node, id) => {
      this.expandedNodeIds.add(id)
      node.expanded = true
    })
  }

  /**
   * Collapse all nodes
   */
  collapseAll(): void {
    this.expandedNodeIds.clear()
    this.nodeMap.forEach(node => {
      node.expanded = false
    })
  }

  // ============================================================================
  // VISIBILITY
  // ============================================================================

  /**
   * Toggle visibility of a node
   */
  toggleVisibility(id: string): void {
    const node = this.nodeMap.get(id)
    if (!node) return

    node.visible = !node.visible
    
    // Update level visibility
    if (node.type === 'level') {
      const level = this.levels.get(id)
      if (level) {
        level.setVisible(node.visible)
      }
    }
    
    this.notifyChange({
      operation: 'toggleVisibility',
      nodeId: id,
      nodeType: node.type,
    })
  }

  /**
   * Check if a node is visible
   */
  isVisible(id: string): boolean {
    const node = this.nodeMap.get(id)
    return node ? node.visible : false
  }

  // ============================================================================
  // DRAG AND DROP
  // ============================================================================

  /**
   * Check if a drag operation is valid
   */
  canDrop(sourceId: string, targetId: string): boolean {
    if (!this.config.allowDragDrop) return false
    if (sourceId === targetId) return false

    const sourceNode = this.nodeMap.get(sourceId)
    const targetNode = this.nodeMap.get(targetId)

    if (!sourceNode || !targetNode) return false

    // Define valid parent-child relationships
    const validMoves: Record<HierarchyNodeType, HierarchyNodeType[]> = {
      site: [], // Sites cannot be moved
      building: ['site'], // Buildings can only be moved to sites
      level: ['building'], // Levels can only be moved to buildings
      object: ['level'], // Objects can only be moved to levels
    }

    return validMoves[sourceNode.type]?.includes(targetNode.type) ?? false
  }

  /**
   * Execute a drag and drop operation
   */
  drop(sourceId: string, targetId: string): void {
    if (!this.canDrop(sourceId, targetId)) {
      throw new Error('Invalid drop operation')
    }

    const sourceNode = this.nodeMap.get(sourceId)
    if (!sourceNode) return

    switch (sourceNode.type) {
      case 'building':
        this.moveBuilding(sourceId, targetId)
        break
      case 'level':
        this.moveLevel(sourceId, targetId)
        break
      case 'object':
        this.moveObject(sourceId, targetId)
        break
    }
  }

  // ============================================================================
  // TREE TRAVERSAL
  // ============================================================================

  /**
   * Get root nodes (sites)
   */
  getRootNodes(): HierarchyNode[] {
    return Array.from(this.nodeMap.values()).filter(node => !node.parentId)
  }

  /**
   * Get children of a node
   */
  getChildren(parentId: string): HierarchyNode[] {
    const parent = this.nodeMap.get(parentId)
    if (!parent) return []
    
    return parent.children
      .map(id => this.nodeMap.get(id))
      .filter((node): node is HierarchyNode => node !== undefined)
  }

  /**
   * Get parent of a node
   */
  getParent(nodeId: string): HierarchyNode | undefined {
    const node = this.nodeMap.get(nodeId)
    if (!node?.parentId) return undefined
    return this.nodeMap.get(node.parentId)
  }

  /**
   * Get path from root to node
   */
  getPathToNode(nodeId: string): HierarchyNode[] {
    const path: HierarchyNode[] = []
    let current: HierarchyNode | undefined = this.nodeMap.get(nodeId)
    
    while (current) {
      path.unshift(current)
      current = current.parentId ? this.nodeMap.get(current.parentId) : undefined
    }
    
    return path
  }

  /**
   * Get all descendants of a node
   */
  getDescendants(nodeId: string): HierarchyNode[] {
    const descendants: HierarchyNode[] = []
    const node = this.nodeMap.get(nodeId)
    
    if (!node) return descendants

    const traverse = (currentId: string) => {
      const children = this.getChildren(currentId)
      children.forEach(child => {
        descendants.push(child)
        traverse(child.id)
      })
    }

    traverse(nodeId)
    return descendants
  }

  // ============================================================================
  // EVENTS
  // ============================================================================

  /**
   * Subscribe to hierarchy changes
   */
  onChange(callback: (event: HierarchyChangeEvent) => void): () => void {
    this.changeListeners.add(callback)
    return () => this.changeListeners.delete(callback)
  }

  /**
   * Notify listeners of a change
   */
  private notifyChange(event: HierarchyChangeEvent): void {
    this.changeListeners.forEach(callback => callback(event))
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  /**
   * Convert hierarchy to JSON
   */
  toJSON(): object {
    return {
      sites: Array.from(this.sites.values()).map(s => s.toJSON()),
      buildings: Array.from(this.buildings.values()).map(b => b.toJSON()),
      levels: Array.from(this.levels.values()).map(l => l.toJSON()),
      expandedNodes: Array.from(this.expandedNodeIds),
      config: this.config,
    }
  }

  /**
   * Load hierarchy from JSON
   */
  static fromJSON(data: any): HierarchyManager {
    const manager = new HierarchyManager(data.config)

    // Load sites
    data.sites?.forEach((siteData: any) => {
      const site = Site.fromJSON(siteData)
      manager.addSite(site)
    })

    // Load buildings
    data.buildings?.forEach((buildingData: any) => {
      const building = Building.fromJSON(buildingData)
      manager.buildings.set(building.id, building)
      manager.createNode(
        building.id,
        'building',
        building.name,
        building.siteId,
        building.levelIds
      )
    })

    // Load levels
    data.levels?.forEach((levelData: any) => {
      const level = Level.fromJSON(levelData)
      manager.levels.set(level.id, level)
      manager.createNode(
        level.id,
        'level',
        level.name,
        level.buildingId,
        level.objectIds
      )
    })

    // Restore expanded state
    data.expandedNodes?.forEach((id: string) => {
      manager.expandedNodeIds.add(id)
      const node = manager.nodeMap.get(id)
      if (node) node.expanded = true
    })

    return manager
  }
}

export default HierarchyManager
