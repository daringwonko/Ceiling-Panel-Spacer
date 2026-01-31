import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

// ============================================================================
// BIM WORKBENCH STATE MANAGEMENT
// ============================================================================

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
  type: 'endpoint' | 'midpoint' | 'center' | 'intersection'
  object: BIMObject | null
}

export interface CommandHistory {
  id: string
  action: string
  object: BIMObject | null
  previousState: any
  newState: any
  timestamp: string
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

// ============================================================================
// BIM WORKBENCH STORE
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

  // Actions
  createProject: (name: string) => void
  loadProject: (id: string) => Promise<void>
  saveProject: () => Promise<void>
  
  addObject: (object: BIMObject) => void
  removeObject: (id: string) => void
  selectObject: (id: string, addToSelection?: boolean) => void
  deselectAll: () => void
  selectMultiple: (ids: string[]) => void
  
  updateObject: (id: string, updates: Partial<BIMObject>) => void
  transformObject: (id: string, transform: { position?: [number, number, number], rotation?: [number, number, number], scale?: [number, number, number] }) => void
  
  undo: () => void
  redo: () => void
  executeCommand: (command: CommandHistory) => void
  
  // 2D Canvas actions
  addObject2D: (object: BIMObject) => void
  updateObject2D: (id: string, updates: Partial<BIMObject>) => void
  
  // Layer actions
  addLayer: (layer: BIMLayer) => void
  removeLayer: (id: string) => void
  toggleLayerVisibility: (id: string) => void
  setActiveLayer: (id: string) => void
  
  // View actions
  setViewMode: (mode: ViewSettings['mode']) => void
  setCamera: (camera: Partial<ViewSettings['camera']>) => void
  setGridSettings: (settings: Partial<ViewSettings['grid']>) => void
  
  // Tool actions
  setActiveTool: (tool: string | null) => void
  setToolSettings: (settings: Partial<BIMStore['toolSettings']>) => void
  
  // Snap actions
  findSnapPoints: (position: [number, number, number], distance: number) => SnapPoint[]
}

export const useBIMStore = create<BIMStore>((set) => ({
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
    }))
  },
  
  loadProject: async (id) => {
    set({ activeProjectId: id })
    // TODO: Load from API
  },
  
  saveProject: async () => {
    const { project } = get()
    // TODO: Save to API
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
        clipboard: state.clipboard?.id === id ? null : state.clipboard,
      }
    })
  },
  
  selectObject: (id, addToSelection = false) => {
    set((state) => {
      if (addToSelection) {
        const selectedObjectIds = [...state.selectedObjectIds, id]
        return { selectedObjectIds }
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
  
  undo: () => {
    const { commands, currentCommandIndex } = get()
    if (currentCommandIndex > 0) {
      const command = commands[currentCommandIndex - 1]
      // Revert command
      set((state) => ({
        objects: command.previousState,
        commands: commands.slice(0, currentCommandIndex - 1),
        currentCommandIndex: currentCommandIndex - 1,
      }))
    }
  },
  
  redo: () => {
    const { commands, currentCommandIndex } = get()
    if (currentCommandIndex < commands.length - 1) {
      const command = commands[currentCommandIndex]
      // Apply command
      set((state) => ({
        objects: command.newState,
        currentCommandIndex: currentCommandIndex + 1,
      }))
    }
  },
  
  executeCommand: (command) => {
    const { objects } = get()
    const previousState = objects
    const newState = command.action(objects)
    
    set((state) => ({
      objects: newState,
      commands: [...state.commands, command],
      currentCommandIndex: state.commands.length,
    }))
  },
  
  // ========================================================================
  // 3D SCENE STATE
  // ========================================================================
  
  scene: {
    objects: [],
    grid: {
      enabled: true,
      size: 5000,
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
    }))
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
      return objects.find(obj => obj.id === selectedObjectIds[0])
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
    return currentCommandIndex < commands.length - 1
  },
}))
