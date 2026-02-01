// Mock Zustand store for testing
import { vi } from 'vitest'
import { BIMProject, BIMObject, Level, Material, Layer } from '../../bim/types'
import { mockProject, mockWall, mockLevel, mockMaterial, mockLayer } from './bimObjects'

// Create mock store state
const createMockState = () => ({
  project: mockProject,
  objects: mockProject.objects,
  selectedObjectIds: [] as string[],
  currentTool: null as string | null,
  activeLevelId: 'level-1',
  activeLayerId: 'layer-structure',
  viewMode: '2d' as '2d' | '3d',
  snapEnabled: true,
  gridEnabled: true,
  orthoEnabled: false,
  undoStack: [] as Array<() => void>,
  redoStack: [] as Array<() => void>
})

// Create mock actions
const createMockActions = (state: ReturnType<typeof createMockState>) => ({
  // Project actions
  createProject: vi.fn((name: string) => {
    state.project = {
      ...state.project,
      id: `project-${Date.now()}`,
      name,
      objects: [],
      metadata: {
        ...state.project.metadata,
        created: new Date().toISOString()
      }
    }
  }),
  
  loadProject: vi.fn((project: BIMProject) => {
    state.project = project
    state.objects = project.objects
  }),
  
  saveProject: vi.fn(() => {
    state.project = {
      ...state.project,
      metadata: {
        ...state.project.metadata,
        modified: new Date().toISOString()
      }
    }
  }),
  
  // Object actions
  addObject: vi.fn((object: BIMObject) => {
    state.objects.push(object)
  }),
  
  removeObject: vi.fn((id: string) => {
    state.objects = state.objects.filter(obj => obj.id !== id)
    state.selectedObjectIds = state.selectedObjectIds.filter(objId => objId !== id)
  }),
  
  updateObject: vi.fn((id: string, updates: Partial<BIMObject>) => {
    const index = state.objects.findIndex(obj => obj.id === id)
    if (index !== -1) {
      state.objects[index] = { ...state.objects[index], ...updates }
    }
  }),
  
  selectObject: vi.fn((id: string, multiSelect = false) => {
    if (multiSelect) {
      if (!state.selectedObjectIds.includes(id)) {
        state.selectedObjectIds.push(id)
      }
    } else {
      state.selectedObjectIds = [id]
    }
  }),
  
  deselectAll: vi.fn(() => {
    state.selectedObjectIds = []
  }),
  
  // Tool actions
  setCurrentTool: vi.fn((tool: string | null) => {
    state.currentTool = tool
  }),
  
  // View actions
  setViewMode: vi.fn((mode: '2d' | '3d') => {
    state.viewMode = mode
  }),
  
  toggleSnap: vi.fn(() => {
    state.snapEnabled = !state.snapEnabled
  }),
  
  toggleGrid: vi.fn(() => {
    state.gridEnabled = !state.gridEnabled
  }),
  
  toggleOrtho: vi.fn(() => {
    state.orthoEnabled = !state.orthoEnabled
  }),
  
  // Level actions
  setActiveLevel: vi.fn((levelId: string) => {
    state.activeLevelId = levelId
  }),
  
  // Layer actions
  setActiveLayer: vi.fn((layerId: string) => {
    state.activeLayerId = layerId
  }),
  
  // Undo/Redo actions
  undo: vi.fn(() => {
    if (state.undoStack.length > 0) {
      const action = state.undoStack.pop()
      if (action) {
        state.redoStack.push(action)
        action()
      }
    }
  }),
  
  redo: vi.fn(() => {
    if (state.redoStack.length > 0) {
      const action = state.redoStack.pop()
      if (action) {
        state.undoStack.push(action)
        action()
      }
    }
  }),
  
  // Reset
  resetState: vi.fn(() => {
    const newState = createMockState()
    Object.assign(state, newState)
  })
})

// Create the mock store
export const createMockBIMStore = () => {
  const state = createMockState()
  const actions = createMockActions(state)
  
  return {
    getState: () => ({ ...state, ...actions }),
    setState: vi.fn((updater: ((state: typeof state) => void) | Partial<typeof state>) => {
      if (typeof updater === 'function') {
        updater(state)
      } else {
        Object.assign(state, updater)
      }
    }),
    subscribe: vi.fn(),
    destroy: vi.fn(),
    ...actions
  }
}

// Default mock store instance
export const mockBIMStore = createMockBIMStore()
