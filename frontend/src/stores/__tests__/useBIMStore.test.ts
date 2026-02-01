import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockBIMStore, createMockBIMStore } from '../../mocks/storeMock'
import { mockWall, mockDoor, mockWindow, mockProject } from '../../mocks/bimObjects'

describe('useBIMStore', () => {
  let store: ReturnType<typeof createMockBIMStore>

  beforeEach(() => {
    store = createMockBIMStore()
    store.resetState()
    vi.clearAllMocks()
  })

  describe('Project Management', () => {
    it('should create a new project', () => {
      const { createProject, getState } = store
      createProject('New Test Project')
      
      const state = getState()
      expect(state.project).not.toBeNull()
      expect(state.project.name).toBe('New Test Project')
      expect(state.objects).toHaveLength(0)
    })

    it('should load an existing project', () => {
      const { loadProject, getState } = store
      loadProject(mockProject)
      
      const state = getState()
      expect(state.project.id).toBe('project-001')
      expect(state.objects).toHaveLength(mockProject.objects.length)
    })

    it('should save project and update modified date', () => {
      const { saveProject, getState } = store
      const beforeSave = getState().project.metadata.modified
      
      // Small delay to ensure different timestamp
      saveProject()
      
      const state = getState()
      expect(state.project.metadata.modified).not.toBe(beforeSave)
    })
  })

  describe('Object Management', () => {
    it('should add an object to the project', () => {
      const { addObject, getState } = store
      addObject(mockWall)
      
      const state = getState()
      expect(state.objects).toHaveLength(1)
      expect(state.objects[0].id).toBe('wall-001')
    })

    it('should remove an object from the project', () => {
      const { addObject, removeObject, getState } = store
      addObject(mockWall)
      addObject(mockDoor)
      expect(getState().objects).toHaveLength(2)
      
      removeObject('wall-001')
      
      const state = getState()
      expect(state.objects).toHaveLength(1)
      expect(state.objects[0].id).toBe('door-001')
    })

    it('should update object properties', () => {
      const { addObject, updateObject, getState } = store
      addObject(mockWall)
      
      updateObject('wall-001', { name: 'Updated Wall', properties: { ...mockWall.properties, height: 3500 } })
      
      const state = getState()
      expect(state.objects[0].name).toBe('Updated Wall')
      expect(state.objects[0].properties.height).toBe(3500)
    })

    it('should select a single object', () => {
      const { addObject, selectObject, getState } = store
      addObject(mockWall)
      addObject(mockDoor)
      
      selectObject('wall-001')
      
      const state = getState()
      expect(state.selectedObjectIds).toEqual(['wall-001'])
    })

    it('should support multi-select of objects', () => {
      const { addObject, selectObject, getState } = store
      addObject(mockWall)
      addObject(mockDoor)
      addObject(mockWindow)
      
      selectObject('wall-001', true)
      selectObject('door-001', true)
      
      const state = getState()
      expect(state.selectedObjectIds).toEqual(['wall-001', 'door-001'])
    })

    it('should deselect all objects', () => {
      const { addObject, selectObject, deselectAll, getState } = store
      addObject(mockWall)
      addObject(mockDoor)
      
      selectObject('wall-001', true)
      selectObject('door-001', true)
      expect(getState().selectedObjectIds).toHaveLength(2)
      
      deselectAll()
      
      const state = getState()
      expect(state.selectedObjectIds).toHaveLength(0)
    })
  })

  describe('Tool Management', () => {
    it('should set current tool', () => {
      const { setCurrentTool, getState } = store
      setCurrentTool('line')
      
      expect(getState().currentTool).toBe('line')
    })

    it('should clear current tool', () => {
      const { setCurrentTool, getState } = store
      setCurrentTool('wall')
      setCurrentTool(null)
      
      expect(getState().currentTool).toBeNull()
    })
  })

  describe('View Settings', () => {
    it('should toggle view mode between 2d and 3d', () => {
      const { setViewMode, getState } = store
      expect(getState().viewMode).toBe('2d')
      
      setViewMode('3d')
      expect(getState().viewMode).toBe('3d')
      
      setViewMode('2d')
      expect(getState().viewMode).toBe('2d')
    })

    it('should toggle snap enabled state', () => {
      const { toggleSnap, getState } = store
      expect(getState().snapEnabled).toBe(true)
      
      toggleSnap()
      expect(getState().snapEnabled).toBe(false)
      
      toggleSnap()
      expect(getState().snapEnabled).toBe(true)
    })

    it('should toggle grid enabled state', () => {
      const { toggleGrid, getState } = store
      expect(getState().gridEnabled).toBe(true)
      
      toggleGrid()
      expect(getState().gridEnabled).toBe(false)
      
      toggleGrid()
      expect(getState().gridEnabled).toBe(true)
    })

    it('should toggle ortho mode', () => {
      const { toggleOrtho, getState } = store
      expect(getState().orthoEnabled).toBe(false)
      
      toggleOrtho()
      expect(getState().orthoEnabled).toBe(true)
      
      toggleOrtho()
      expect(getState().orthoEnabled).toBe(false)
    })
  })

  describe('Level Management', () => {
    it('should set active level', () => {
      const { setActiveLevel, getState } = store
      setActiveLevel('level-2')
      
      expect(getState().activeLevelId).toBe('level-2')
    })
  })

  describe('Layer Management', () => {
    it('should set active layer', () => {
      const { setActiveLayer, getState } = store
      setActiveLayer('layer-architecture')
      
      expect(getState().activeLayerId).toBe('layer-architecture')
    })
  })

  describe('State Reset', () => {
    it('should reset state to initial values', () => {
      const { 
        addObject, selectObject, setCurrentTool, 
        setViewMode, setActiveLevel, setActiveLayer,
        toggleSnap, toggleGrid, toggleOrtho,
        getState 
      } = store
      
      // Modify state
      addObject(mockWall)
      selectObject('wall-001')
      setCurrentTool('wall')
      setViewMode('3d')
      setActiveLevel('level-2')
      setActiveLayer('layer-architecture')
      toggleSnap()
      toggleGrid()
      toggleOrtho()
      
      // Reset
      store.resetState()
      
      // Verify reset
      const state = getState()
      expect(state.objects).toHaveLength(0)
      expect(state.selectedObjectIds).toHaveLength(0)
      expect(state.currentTool).toBeNull()
      expect(state.viewMode).toBe('2d')
      expect(state.activeLevelId).toBe('level-1')
      expect(state.activeLayerId).toBe('layer-structure')
      expect(state.snapEnabled).toBe(true)
      expect(state.gridEnabled).toBe(true)
      expect(state.orthoEnabled).toBe(false)
    })
  })
})
