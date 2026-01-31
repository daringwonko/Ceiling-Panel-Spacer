import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTOSAVE_KEY = 'savage-bim-autosave'
const DEFAULT_AUTOSAVE_INTERVAL = 30000  // 30 seconds
const MAX_COMMAND_HISTORY = 100  // Limit history to prevent memory issues

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SelectionMode = 'replace' | 'add' | 'remove'

export interface BIMObject {
  id: string
  type: 'wall' | 'beam' | 'column' | 'slab' | 'door' | 'window' | 'stairs' | 'roof' | 'panel' | 'site' | 'building' | 'level' | 'point' | 'line' | 'polyline' | 'rectangle' | 'circle' | 'arc'
  name: string
  geometry: any
  material: string
  properties: Record<string, any>
  level: string
  layer: string
  isSelected: boolean
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  bounds?: {
    minX: number; minY: number; minZ: number
    maxX: number; maxY: number; maxZ: number
  }
}

export interface BIMProject {
  id: string
  name: string
  description: string
  site?: BIMObject
  buildings?: BIMObject[]
  levels?: BIMObject[]
  objects: BIMObject[]
  sections?: BIMObject[]
  metadata: {
    created: string
    modified: string
    author: string
    version: string
  }
}

export interface BIMLayer {
  id: string
  name: string
  color: string
  visible: boolean
  locked: boolean
  objects: string[]
}

export interface SnapPoint {
  x: number
  y: number
  z: number
  type: 'endpoint' | 'midpoint' | 'center' | 'intersection' | 'grid'
  object: BIMObject | null
}

export interface CommandHistory {
  id: string
  action: string
  description: string  // Human-readable description for UI
  object: BIMObject | null
  previousState: any
  newState: any
  timestamp: string
  batchId?: string     // For grouping batched commands
}

export interface ViewSettings {
  mode: 'perspective' | 'top' | 'front' | 'side' | 'section'
  camera: {
    position: [number, number, number]
    target: [number, number, number] | null
    zoom: number
  }
  grid: {
    enabled: boolean
    size: number
    majorSize: number
    color: string
  }
}

export interface SelectionSet {
  id: string
  name: string
  objectIds: string[]
}

export interface ExportData {
  version: string
  exportedAt: string
  application: string
  data: {
    project: BIMProject | null
    objects: BIMObject[]
    layers: BIMLayer[]
    view: ViewSettings
    toolSettings: BIMStore['toolSettings']
    canvas2D: BIMStore['canvas2D']
  }
}

export interface AutoSaveState {
  enabled: boolean
  interval: number  // milliseconds
  lastSaved: string | null
}

// ============================================================================
// BIM WORKBENCH STORE INTERFACE
// ============================================================================

interface BIMStore {
  // Project state
  project: BIMProject | null
  projects: BIMProject[]
  activeProjectId: string | null
  
  // Object management
  objects: BIMObject[]
  selectedObjectIds: string[]
  clipboard: BIMObject[] | null
  
  // 3D scene state
  scene: {
    objects: BIMObject[]
    grid: ViewSettings['grid']
    workingPlane: 'xy' | 'xz' | 'yz'
  }
  
  // 2D canvas state
  canvas2D: {
    objects: BIMObject[]
    grid: {
      enabled: boolean
      size: number
      snapEnabled: boolean
    }
    zoom: number
    pan: [number, number]
  }
  
  // Layers
  layers: BIMLayer[]
  activeLayerId: string | null
  
  // Tools
  activeTool: string | null
  toolSettings: {
    snapDistance: number
    snapToGrid: boolean
    snapToObjects: boolean
    showMeasurements: boolean
  }
  
  // Commands
  commands: CommandHistory[]
  currentCommandIndex: number
  commandBatch: {
    isBatching: boolean
    batchId: string | null
    commands: CommandHistory[]
  }
  
  // View
  view: ViewSettings
  
  // UI state
  sidebar: {
    open: boolean
    width: number
  }
  
  // Properties panel
  propertiesPanel: {
    open: boolean
    selectedObject: BIMObject | null
  }

  // Selection sets
  selectionSets: SelectionSet[]

  // Auto-save
  autoSave: AutoSaveState

  // Actions - Project
  createProject: (name: string) => void
  loadProject: (id: string) => Promise<void>
  saveProject: () => Promise<void>
  exportProject: () => string
  importProject: (jsonData: string) => void
  downloadProject: (filename?: string) => void
  loadProjectFromFile: (file: File) => Promise<void>
  validateProjectData: (data: any) => { valid: boolean; errors: string[] }
  
  // Actions - Objects
  addObject: (object: BIMObject) => void
  removeObject: (id: string) => void
  selectObject: (id: string, addToSelection?: boolean) => void
  deselectAll: () => void
  selectMultiple: (ids: string[]) => void
  boxSelect: (bounds: { minX: number; minY: number; maxX: number; maxY: number }, mode?: SelectionMode) => void
  invertSelection: () => void
  selectByLayer: (layerId: string, mode?: 'replace' | 'add') => void
  selectByType: (type: BIMObject['type'], mode?: 'replace' | 'add') => void
  selectAll: () => void
  deselectByLayer: (layerId: string) => void
  deselectByType: (type: BIMObject['type']) => void
  isObjectSelected: (objectId: string) => boolean
  getSelectionBounds: () => { minX: number; minY: number; maxX: number; maxY: number; minZ: number; maxZ: number } | null
  
  // Actions - Object manipulation
  updateObject: (id: string, updates: Partial<BIMObject>) => void
  transformObject: (id: string, transform: { position?: [number, number, number], rotation?: [number, number, number], scale?: [number, number, number] }) => void
  
  // Actions - Selection sets
  saveSelectionSet: (name: string) => void
  loadSelectionSet: (setId: string) => void
  deleteSelectionSet: (setId: string) => void
  renameSelectionSet: (setId: string, newName: string) => void
  getSelectionSets: () => { id: string; name: string; count: number }[]
  
  // Actions - Commands
  undo: () => void
  redo: () => void
  executeCommand: (command: Omit<CommandHistory, 'id' | 'timestamp'>) => void
  startCommandBatch: () => void
  endCommandBatch: () => void
  getCommandHistory: () => CommandHistory[]
  clearCommandHistory: () => void
  getLastCommandDescription: () => string | null
  
  // Actions - 2D Canvas
  addObject2D: (object: BIMObject) => void
  updateObject2D: (id: string, updates: Partial<BIMObject>) => void
  
  // Actions - Layers
  addLayer: (layer: BIMLayer) => void
  removeLayer: (id: string) => void
  toggleLayerVisibility: (id: string) => void
  setActiveLayer: (id: string) => void
  
  // Actions - View
  setViewMode: (mode: ViewSettings['mode']) => void
  setCamera: (camera: Partial<ViewSettings['camera']>) => void
  setGridSettings: (settings: Partial<ViewSettings['grid']>) => void
  
  // Actions - Tools
  setActiveTool: (tool: string | null) => void
  setToolSettings: (settings: Partial<BIMStore['toolSettings']>) => void
  
  // Actions - Snap
  findSnapPoints: (position: [number, number, number], distance: number) => SnapPoint[]
  
  // Actions - UI
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  togglePropertiesPanel: () => void
  setPropertiesPanelObject: (object: BIMObject | null) => void
  
  // Actions - Auto-save
  toggleAutoSave: () => void
  setAutoSaveInterval: (interval: number) => void
  saveToLocalStorage: () => void
  loadFromLocalStorage: () => boolean
  
  // Selectors
  getActiveProject: () => BIMProject | undefined
  getSelectedObjects: () => BIMObject[]
  getActiveObject: () => BIMObject | null
  getObjectsByType: (type: BIMObject['type']) => BIMObject[]
  getObjectsByLayer: (layerId: string) => BIMObject[]
  getCanUndo: () => boolean
  getCanRedo: () => boolean
  getSelectionCount: () => number
  getObjectCount: () => number
  getLayerCount: () => number
}

// ============================================================================
// BIM WORKBENCH STORE IMPLEMENTATION
// ============================================================================

export const useBIMStore = create<BIMStore>((set, get) => ({
  // ========================================================================
  // PROJECT STATE
  // ========================================================================
  
  project: null,
  projects: [],
  activeProjectId: null,
  
  createProject: (name) => {
    const project: BIMProject = {
      id: uuidv4(),
      name,
      description: `Savage BIM Project - ${name}`,
      objects: [],
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        author: 'Savage Cabinetry Platform',
        version: '2.1.0',
      },
    }
    set((state) => ({
      projects: [...state.projects, project],
      activeProjectId: project.id,
      project,
      objects: [],
      selectedObjectIds: [],
      commands: [],
      currentCommandIndex: 0,
      clipboard: null,
    }))
  },
  
  loadProject: async (id) => {
    set({ activeProjectId: id })
    // TODO: Load from API
  },
  
  saveProject: async () => {
    const { project } = get()
    if (!project) {
      console.warn('Cannot save: No active project')
      return
    }
    // TODO: Save to API
    console.log('Saving project:', project.name)
  },
  
  exportProject: () => {
    const { project, objects, layers, view, toolSettings, canvas2D } = get()
    
    const exportData: ExportData = {
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      application: 'Savage BIM Workbench',
      data: {
        project,
        objects,
        layers,
        view,
        toolSettings,
        canvas2D,
      },
    }
    
    return JSON.stringify(exportData, null, 2)
  },
  
  importProject: (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData)
      const validation = get().validateProjectData(parsed)
      
      if (!validation.valid) {
        console.error('Invalid project data:', validation.errors)
        return
      }
      
      // Version check (warn on major version mismatch)
      const currentVersion = '2.1.0'
      const importedVersion = parsed.version || '1.0.0'
      const currentMajor = currentVersion.split('.')[0]
      const importedMajor = importedVersion.split('.')[0]
      
      if (currentMajor !== importedMajor) {
        console.warn(`Version mismatch: Current ${currentVersion}, Imported ${importedVersion}`)
      }
      
      // Restore all state
      set({
        project: parsed.data.project,
        objects: parsed.data.objects || [],
        layers: parsed.data.layers || [],
        view: parsed.data.view || get().view,
        toolSettings: parsed.data.toolSettings || get().toolSettings,
        canvas2D: parsed.data.canvas2D || get().canvas2D,
        selectedObjectIds: [],
        clipboard: null,
        commands: [],
        currentCommandIndex: 0,
      })
      
      console.log('Project imported successfully')
    } catch (error) {
      console.error('Failed to import project:', error)
    }
  },
  
  downloadProject: (filename) => {
    const { project } = get()
    const jsonData = get().exportProject()
    
    const defaultFilename = project 
      ? `${project.name}-v2.1.0-${new Date().toISOString().split('T')[0]}.bim.json`
      : `untitled-v2.1.0-${new Date().toISOString().split('T')[0]}.bim.json`
    
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || defaultFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
  
  loadProjectFromFile: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          get().importProject(content)
          resolve()
        } catch (error) {
          console.error('Error parsing file:', error)
          reject(error)
        }
      }
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error)
        reject(error)
      }
      
      reader.readAsText(file)
    })
  },
  
  validateProjectData: (data) => {
    const errors: string[] = []
    
    if (!data) {
      errors.push('Data is null or undefined')
      return { valid: false, errors }
    }
    
    if (!data.data) {
      errors.push('Missing data.data property')
    } else {
      if (!Array.isArray(data.data.objects)) {
        errors.push('data.data.objects must be an array')
      }
      if (!Array.isArray(data.data.layers)) {
        errors.push('data.data.layers must be an array')
      }
    }
    
    return { valid: errors.length === 0, errors }
  },
  
  // ========================================================================
  // OBJECT MANAGEMENT
  // ========================================================================
  
  objects: [],
  selectedObjectIds: [],
  clipboard: null,
  
  addObject: (object) => {
    set((state) => ({
      objects: [...state.objects, { ...object, isSelected: false }],
    }))
  },
  
  removeObject: (id) => {
    set((state) => {
      const objects = state.objects.filter(obj => obj.id !== id)
      const selectedObjectIds = state.selectedObjectIds.filter(sid => sid !== id)
      return {
        objects,
        selectedObjectIds,
        clipboard: state.clipboard?.filter(obj => obj.id !== id) || null,
      }
    })
  },
  
  selectObject: (id, addToSelection = false) => {
    set((state) => {
      if (addToSelection) {
        if (state.selectedObjectIds.includes(id)) {
          return { selectedObjectIds: state.selectedObjectIds }
        }
        return { selectedObjectIds: [...state.selectedObjectIds, id] }
      } else {
        return { selectedObjectIds: [id] }
      }
    })
  },
  
  deselectAll: () => {
    set({ selectedObjectIds: [] })
  },
  
  selectMultiple: (ids) => {
    set({ selectedObjectIds: ids })
  },
  
  boxSelect: (bounds, mode = 'replace') => {
    const { objects } = get()
    
    // Calculate which objects intersect with the selection box
    const intersectingIds = objects.filter(obj => {
      const x = obj.position[0]
      const y = obj.position[1]
      // Simple point-in-box test using object position
      // For more accuracy, we'd use proper bounding box intersection
      return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY
    }).map(obj => obj.id)
    
    set((state) => {
      switch (mode) {
        case 'replace':
          return { selectedObjectIds: intersectingIds }
        case 'add':
          return { 
            selectedObjectIds: [...new Set([...state.selectedObjectIds, ...intersectingIds])] 
          }
        case 'remove':
          return { 
            selectedObjectIds: state.selectedObjectIds.filter(id => !intersectingIds.includes(id)) 
          }
        default:
          return { selectedObjectIds: intersectingIds }
      }
    })
  },
  
  invertSelection: () => {
    const { objects, selectedObjectIds } = get()
    const allIds = objects.map(obj => obj.id)
    const selectedSet = new Set(selectedObjectIds)
    const invertedIds = allIds.filter(id => !selectedSet.has(id))
    
    set({ selectedObjectIds: invertedIds })
  },
  
  selectByLayer: (layerId, mode = 'replace') => {
    const { objects, layers } = get()
    
    // Verify layer exists
    const layerExists = layers.some(layer => layer.id === layerId)
    if (!layerExists) {
      console.warn(`Layer ${layerId} does not exist`)
      return
    }
    
    const objectIds = objects.filter(obj => obj.layer === layerId).map(obj => obj.id)
    
    set((state) => {
      if (mode === 'replace') {
        return { selectedObjectIds: objectIds }
      } else {
        return { 
          selectedObjectIds: [...new Set([...state.selectedObjectIds, ...objectIds])] 
        }
      }
    })
  },
  
  selectByType: (type, mode = 'replace') => {
    const { objects } = get()
    const objectIds = objects.filter(obj => obj.type === type).map(obj => obj.id)
    
    set((state) => {
      if (mode === 'replace') {
        return { selectedObjectIds: objectIds }
      } else {
        return { 
          selectedObjectIds: [...new Set([...state.selectedObjectIds, ...objectIds])] 
        }
      }
    })
  },
  
  selectAll: () => {
    const { objects } = get()
    set({ selectedObjectIds: objects.map(obj => obj.id) })
  },
  
  deselectByLayer: (layerId) => {
    const { objects } = get()
    const objectIdsToDeselect = objects
      .filter(obj => obj.layer === layerId)
      .map(obj => obj.id)
    
    set((state) => ({
      selectedObjectIds: state.selectedObjectIds.filter(id => !objectIdsToDeselect.includes(id))
    }))
  },
  
  deselectByType: (type) => {
    const { objects } = get()
    const objectIdsToDeselect = objects
      .filter(obj => obj.type === type)
      .map(obj => obj.id)
    
    set((state) => ({
      selectedObjectIds: state.selectedObjectIds.filter(id => !objectIdsToDeselect.includes(id))
    }))
  },
  
  isObjectSelected: (objectId) => {
    const { selectedObjectIds } = get()
    return selectedObjectIds.includes(objectId)
  },
  
  getSelectionBounds: () => {
    const { objects, selectedObjectIds } = get()
    
    if (selectedObjectIds.length === 0) {
      return null
    }
    
    const selectedObjects = objects.filter(obj => selectedObjectIds.includes(obj.id))
    
    if (selectedObjects.length === 0) {
      return null
    }
    
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    
    selectedObjects.forEach(obj => {
      const [x, y, z] = obj.position
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      minZ = Math.min(minZ, z)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      maxZ = Math.max(maxZ, z)
    })
    
    return { minX, minY, minZ, maxX, maxY, maxZ }
  },
  
  updateObject: (id, updates) => {
    set((state) => {
      const objects = state.objects.map(obj => 
        obj.id === id ? { ...obj, ...updates } : obj
      )
      return { objects }
    })
  },
  
  transformObject: (id, transform) => {
    set((state) => {
      const objects = state.objects.map(obj => 
        obj.id === id ? { ...obj, ...transform } : obj
      )
      return { objects }
    })
  },
  
  // ========================================================================
  // SELECTION SETS
  // ========================================================================
  
  selectionSets: [],
  
  saveSelectionSet: (name) => {
    const { selectedObjectIds } = get()
    
    if (selectedObjectIds.length === 0) {
      console.warn('Cannot save selection set: No objects selected')
      return
    }
    
    const newSet: SelectionSet = {
      id: uuidv4(),
      name,
      objectIds: [...selectedObjectIds],
    }
    
    set((state) => ({
      selectionSets: [...state.selectionSets, newSet],
    }))
  },
  
  loadSelectionSet: (setId) => {
    const { selectionSets, objects } = get()
    const set = selectionSets.find(s => s.id === setId)
    
    if (!set) {
      console.warn(`Selection set ${setId} not found`)
      return
    }
    
    // Filter to only include objects that still exist
    const validIds = set.objectIds.filter(id => objects.some(obj => obj.id === id))
    set({ selectedObjectIds: validIds })
  },
  
  deleteSelectionSet: (setId) => {
    set((state) => ({
      selectionSets: state.selectionSets.filter(s => s.id !== setId),
    }))
  },
  
  renameSelectionSet: (setId, newName) => {
    set((state) => ({
      selectionSets: state.selectionSets.map(s => 
        s.id === setId ? { ...s, name: newName } : s
      ),
    }))
  },
  
  getSelectionSets: () => {
    const { selectionSets } = get()
    return selectionSets.map(set => ({
      id: set.id,
      name: set.name,
      count: set.objectIds.length,
    }))
  },
  
  // ========================================================================
  // COMMANDS & HISTORY
  // ========================================================================
  
  commands: [],
  currentCommandIndex: 0,
  commandBatch: {
    isBatching: false,
    batchId: null,
    commands: [],
  },
  
  undo: () => {
    const { commands, currentCommandIndex } = get()
    if (currentCommandIndex > 0) {
      const command = commands[currentCommandIndex - 1]
      // Revert command
      set((state) => ({
        objects: command.previousState,
        currentCommandIndex: currentCommandIndex - 1,
      }))
    }
  },
  
  redo: () => {
    const { commands, currentCommandIndex } = get()
    if (currentCommandIndex < commands.length) {
      const command = commands[currentCommandIndex]
      // Apply command
      set((state) => ({
        objects: command.newState,
        currentCommandIndex: currentCommandIndex + 1,
      }))
    }
  },
  
  executeCommand: (command) => {
    const { objects, commandBatch } = get()
    const fullCommand: CommandHistory = {
      ...command,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    }
    
    // If batching, add to batch
    if (commandBatch.isBatching && commandBatch.batchId) {
      set((state) => ({
        commandBatch: {
          ...state.commandBatch,
          commands: [...state.commandBatch.commands, fullCommand],
        },
      }))
      return
    }
    
    // Otherwise, execute immediately
    set((state) => {
      // Truncate future history if not at end
      const newCommands = state.commands.slice(0, state.currentCommandIndex)
      
      // Add new command and limit history
      const updatedCommands = [...newCommands, fullCommand].slice(-MAX_COMMAND_HISTORY)
      const newIndex = updatedCommands.length
      
      return {
        objects: command.newState,
        commands: updatedCommands,
        currentCommandIndex: newIndex,
      }
    })
  },
  
  startCommandBatch: () => {
    set({
      commandBatch: {
        isBatching: true,
        batchId: uuidv4(),
        commands: [],
      },
    })
  },
  
  endCommandBatch: () => {
    const { commandBatch } = get()
    
    if (!commandBatch.isBatching || commandBatch.commands.length === 0) {
      set({
        commandBatch: {
          isBatching: false,
          batchId: null,
          commands: [],
        },
      })
      return
    }
    
    // Create a single command from the batch
    const firstCommand = commandBatch.commands[0]
    const lastCommand = commandBatch.commands[commandBatch.commands.length - 1]
    
    const batchedCommand: CommandHistory = {
      id: uuidv4(),
      action: 'batch',
      description: `${commandBatch.commands.length} operations`,
      object: null,
      previousState: firstCommand.previousState,
      newState: lastCommand.newState,
      timestamp: new Date().toISOString(),
      batchId: commandBatch.batchId!,
    }
    
    set((state) => {
      const newCommands = state.commands.slice(0, state.currentCommandIndex)
      const updatedCommands = [...newCommands, batchedCommand].slice(-MAX_COMMAND_HISTORY)
      
      return {
        objects: lastCommand.newState,
        commands: updatedCommands,
        currentCommandIndex: updatedCommands.length,
        commandBatch: {
          isBatching: false,
          batchId: null,
          commands: [],
        },
      }
    })
  },
  
  getCommandHistory: () => {
    return get().commands
  },
  
  clearCommandHistory: () => {
    set({ commands: [], currentCommandIndex: 0 })
  },
  
  getLastCommandDescription: () => {
    const { commands, currentCommandIndex } = get()
    if (currentCommandIndex > 0 && commands.length > 0) {
      return commands[currentCommandIndex - 1].description
    }
    return null
  },
  
  // ========================================================================
  // 3D SCENE STATE
  // ========================================================================
  
  scene: {
    objects: [],
    grid: {
      enabled: true,
      size: 5000,
      majorSize: 1000,
      color: '#334155',
    },
    workingPlane: 'xy',
  },
  
  // ========================================================================
  // 2D CANVAS STATE
  // ========================================================================
  
  canvas2D: {
    objects: [],
    grid: {
      enabled: true,
      size: 500,
      snapEnabled: true,
    },
    zoom: 1.0,
    pan: [0, 0],
  },
  
  addObject2D: (object) => {
    set((state) => ({
      canvas2D: {
        ...state.canvas2D,
        objects: [...state.canvas2D.objects, object],
      },
    }))
  },
  
  updateObject2D: (id, updates) => {
    set((state) => {
      const objects = state.canvas2D.objects.map(obj =>
        obj.id === id ? { ...obj, ...updates } : obj
      )
      return {
        canvas2D: {
          ...state.canvas2D,
          objects,
        },
      }
    })
  },
  
  // ========================================================================
  // LAYER MANAGEMENT
  // ========================================================================
  
  layers: [
    { id: 'layer-0', name: 'Structure', color: '#3B82F6', visible: true, locked: false, objects: [] },
    { id: 'layer-1', name: 'Architectural', color: '#10B981', visible: true, locked: false, objects: [] },
    { id: 'layer-2', name: 'MEP', color: '#F59E0B', visible: true, locked: false, objects: [] },
    { id: 'layer-3', name: 'Annotations', color: '#6B7280', visible: true, locked: false, objects: [] },
  ],
  activeLayerId: 'layer-0',
  
  addLayer: (layer) => {
    set((state) => ({
      layers: [...state.layers, layer],
    }))
  },
  
  removeLayer: (id) => {
    set((state) => {
      const layers = state.layers.filter(layer => layer.id !== id)
      if (state.activeLayerId === id) {
        return { layers, activeLayerId: 'layer-0' }
      }
      return { layers }
    })
  },
  
  toggleLayerVisibility: (id) => {
    set((state) => {
      const layers = state.layers.map(layer =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
      return { layers }
    })
  },
  
  setActiveLayer: (id) => {
    set({ activeLayerId: id })
  },
  
  // ========================================================================
  // TOOLS
  // ========================================================================
  
  activeTool: null,
  toolSettings: {
    snapDistance: 50,
    snapToGrid: false,
    snapToObjects: true,
    showMeasurements: true,
  },
  
  setActiveTool: (tool) => {
    set({ activeTool: tool })
  },
  
  setToolSettings: (settings) => {
    set((state) => ({
      toolSettings: { ...state.toolSettings, ...settings },
    }))
  },
  
  findSnapPoints: (position, distance) => {
    const { objects, toolSettings } = get()
    const snapPoints: SnapPoint[] = []
    
    // Snap to grid
    if (toolSettings.snapToGrid) {
      const gridSize = 100
      snapPoints.push({
        x: Math.round(position[0] / gridSize) * gridSize,
        y: Math.round(position[1] / gridSize) * gridSize,
        z: position[2],
        type: 'grid',
        object: null,
      })
    }
    
    // Snap to objects
    if (toolSettings.snapToObjects) {
      objects.forEach(obj => {
        // Find snapable points on object
        if (obj.geometry) {
          // TODO: Implement object snapping logic
        }
      })
    }
    
    return snapPoints
  },
  
  // ========================================================================
  // VIEW SETTINGS
  // ========================================================================
  
  view: {
    mode: 'perspective',
    camera: {
      position: [10, 10, 10],
      target: [0, 0, 0],
      zoom: 1,
    },
    grid: {
      enabled: true,
      size: 5000,
      majorSize: 1000,
      color: '#334155',
    },
  },
  
  setViewMode: (mode) => {
    set((state) => ({
      view: {
        ...state.view,
        mode,
      },
    }))
  },
  
  setCamera: (camera) => {
    set((state) => ({
      view: {
        ...state.view,
        camera: {
          ...state.view.camera,
          ...camera,
        },
      },
    }))
  },
  
  setGridSettings: (settings) => {
    set((state) => ({
      view: {
        ...state.view,
        grid: {
          ...state.view.grid,
          ...settings,
        },
      },
    }))
  },
  
  // ========================================================================
  // UI STATE
  // ========================================================================
  
  sidebar: {
    open: true,
    width: 280,
  },
  
  propertiesPanel: {
    open: false,
    selectedObject: null,
  },
  
  toggleSidebar: () => {
    set((state) => ({
      sidebar: {
        ...state.sidebar,
        open: !state.sidebar.open,
      },
    }))
  },
  
  setSidebarWidth: (width) => {
    set((state) => ({
      sidebar: {
        ...state.sidebar,
        width,
      },
    }))
  },
  
  togglePropertiesPanel: () => {
    set((state) => ({
      propertiesPanel: {
        ...state.propertiesPanel,
        open: !state.propertiesPanel.open,
      },
    }))
  },
  
  setPropertiesPanelObject: (object) => {
    set({ propertiesPanel: { open: true, selectedObject: object } })
  },
  
  // ========================================================================
  // AUTO-SAVE
  // ========================================================================
  
  autoSave: {
    enabled: true,
    interval: DEFAULT_AUTOSAVE_INTERVAL,
    lastSaved: null,
  },
  
  toggleAutoSave: () => {
    set((state) => ({
      autoSave: {
        ...state.autoSave,
        enabled: !state.autoSave.enabled,
      },
    }))
  },
  
  setAutoSaveInterval: (interval) => {
    set((state) => ({
      autoSave: {
        ...state.autoSave,
        interval,
      },
    }))
  },
  
  saveToLocalStorage: () => {
    const { project, objects, layers, view, toolSettings, canvas2D } = get()
    
    const data: ExportData = {
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      application: 'Savage BIM Workbench',
      data: {
        project,
        objects,
        layers,
        view,
        toolSettings,
        canvas2D,
      },
    }
    
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data))
      set((state) => ({
        autoSave: {
          ...state.autoSave,
          lastSaved: new Date().toISOString(),
        },
      }))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },
  
  loadFromLocalStorage: () => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY)
      if (saved) {
        const data: ExportData = JSON.parse(saved)
        set({
          project: data.data.project,
          objects: data.data.objects || [],
          layers: data.data.layers || [],
          view: data.data.view,
          toolSettings: data.data.toolSettings,
          canvas2D: data.data.canvas2D,
        })
        return true
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
    }
    return false
  },
  
  // ========================================================================
  // SELECTORS
  // ========================================================================
  
  getActiveProject: () => {
    const { projects, activeProjectId } = get()
    return projects.find(p => p.id === activeProjectId)
  },
  
  getSelectedObjects: () => {
    const { objects, selectedObjectIds } = get()
    return objects.filter(obj => selectedObjectIds.includes(obj.id))
  },
  
  getActiveObject: () => {
    const { objects, selectedObjectIds } = get()
    if (selectedObjectIds.length === 1) {
      return objects.find(obj => obj.id === selectedObjectIds[0]) || null
    }
    return null
  },
  
  getObjectsByType: (type) => {
    const { objects } = get()
    return objects.filter(obj => obj.type === type)
  },
  
  getObjectsByLayer: (layerId) => {
    const { objects } = get()
    return objects.filter(obj => obj.layer === layerId)
  },
  
  getCanUndo: () => {
    const { commands, currentCommandIndex } = get()
    return currentCommandIndex > 0
  },
  
  getCanRedo: () => {
    const { commands, currentCommandIndex } = get()
    return currentCommandIndex < commands.length
  },
  
  getSelectionCount: () => {
    return get().selectedObjectIds.length
  },
  
  getObjectCount: () => {
    return get().objects.length
  },
  
  getLayerCount: () => {
    return get().layers.length
  },
}))

// ============================================================================
// AUTO-SAVE INITIALIZATION
// ============================================================================

// Initialize auto-save interval
if (typeof window !== 'undefined') {
  const store = useBIMStore.getState()
  
  // Load from localStorage on initialization
  store.loadFromLocalStorage()
  
  // Set up auto-save interval
  setInterval(() => {
    const { autoSave } = useBIMStore.getState()
    if (autoSave.enabled) {
      useBIMStore.getState().saveToLocalStorage()
    }
  }, DEFAULT_AUTOSAVE_INTERVAL)
}
