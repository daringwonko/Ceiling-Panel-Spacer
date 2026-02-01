import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from 'react'
import { useCabinetStore, type Dimensions, type KitchenType, type CabinetLayout } from '../useCabinetStore'

describe('useCabinetStore', () => {
  let store: typeof useCabinetStore

  beforeEach(() => {
    store = useCabinetStore
    act(() => {
      store.getState().clearLayout()
    })
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have null dimensions initially', () => {
      expect(store.getState().dimensions).toBeNull()
    })

    it('should have null kitchenType initially', () => {
      expect(store.getState().kitchenType).toBeNull()
    })

    it('should have null layout initially', () => {
      expect(store.getState().layout).toBeNull()
    })

    it('should have isCalculating as false initially', () => {
      expect(store.getState().isCalculating).toBe(false)
    })

    it('should have available kitchen types defined', () => {
      const types = store.getState().availableTypes
      expect(types).toHaveLength(4)
      expect(types.map(t => t.id)).toEqual(['galley', 'l-shape', 'u-shape', 'open'])
    })
  })

  describe('setDimensions', () => {
    it('should set kitchen dimensions', () => {
      const dimensions: Dimensions = { width: 300, length: 400, height: 250 }

      act(() => {
        store.getState().setDimensions(dimensions)
      })

      const state = store.getState()
      expect(state.dimensions).toEqual(dimensions)
      expect(state.dimensions?.width).toBe(300)
      expect(state.dimensions?.length).toBe(400)
      expect(state.dimensions?.height).toBe(250)
    })

    it('should update existing dimensions', () => {
      const initialDimensions: Dimensions = { width: 200, length: 300, height: 240 }
      const updatedDimensions: Dimensions = { width: 400, length: 500, height: 280 }

      act(() => {
        store.getState().setDimensions(initialDimensions)
        store.getState().setDimensions(updatedDimensions)
      })

      expect(store.getState().dimensions).toEqual(updatedDimensions)
    })
  })

  describe('setKitchenType', () => {
    it('should set kitchen type', () => {
      const kitchenType: KitchenType = {
        id: 'l-shape',
        name: 'L-Shape Kitchen',
        description: 'Two perpendicular counters forming L'
      }

      act(() => {
        store.getState().setKitchenType(kitchenType)
      })

      const state = store.getState()
      expect(state.kitchenType).toEqual(kitchenType)
      expect(state.kitchenType?.id).toBe('l-shape')
    })

    it('should update existing kitchen type', () => {
      const initialType: KitchenType = {
        id: 'galley',
        name: 'Galley Kitchen',
        description: 'Parallel counters'
      }
      const updatedType: KitchenType = {
        id: 'u-shape',
        name: 'U-Shape Kitchen',
        description: 'Three counters forming U'
      }

      act(() => {
        store.getState().setKitchenType(initialType)
        store.getState().setKitchenType(updatedType)
      })

      expect(store.getState().kitchenType).toEqual(updatedType)
    })
  })

  describe('clearLayout', () => {
    it('should clear layout', () => {
      act(() => {
        store.getState().clearLayout()
      })

      expect(store.getState().layout).toBeNull()
    })
  })

  describe('calculateLayout validation', () => {
    it('should throw error when dimensions are missing', async () => {
      await expect(store.getState().calculateLayout()).rejects.toThrow('Dimensions and kitchen type are required')
    })

    it('should throw error when kitchenType is missing', async () => {
      const dimensions: Dimensions = { width: 300, length: 400, height: 250 }

      act(() => {
        store.getState().setDimensions(dimensions)
      })

      await expect(store.getState().calculateLayout()).rejects.toThrow('Dimensions and kitchen type are required')
    })

    it('should throw error when both dimensions and kitchenType are missing', async () => {
      await expect(store.getState().calculateLayout()).rejects.toThrow('Dimensions and kitchen type are required')
    })
  })

  describe('Kitchen Types', () => {
    it('should have correct galley kitchen type', () => {
      const galleyType = store.getState().availableTypes.find(t => t.id === 'galley')
      expect(galleyType).toBeDefined()
      expect(galleyType?.name).toBe('Galley Kitchen')
      expect(galleyType?.description).toBe('Parallel counters for efficient workflow')
    })

    it('should have correct l-shape kitchen type', () => {
      const lShapeType = store.getState().availableTypes.find(t => t.id === 'l-shape')
      expect(lShapeType).toBeDefined()
      expect(lShapeType?.name).toBe('L-Shape Kitchen')
      expect(lShapeType?.description).toBe('Two perpendicular counters forming L')
    })

    it('should have correct u-shape kitchen type', () => {
      const uShapeType = store.getState().availableTypes.find(t => t.id === 'u-shape')
      expect(uShapeType).toBeDefined()
      expect(uShapeType?.name).toBe('U-Shape Kitchen')
      expect(uShapeType?.description).toBe('Three counters forming U around work area')
    })

    it('should have correct open concept kitchen type', () => {
      const openType = store.getState().availableTypes.find(t => t.id === 'open')
      expect(openType).toBeDefined()
      expect(openType?.name).toBe('Open Concept')
      expect(openType?.description).toBe('Connected living areas with island')
    })
  })

  describe('State Isolation', () => {
    it('should maintain state isolation between tests', () => {
      const initialState = store.getState()
      expect(initialState.dimensions).toBeNull()
      expect(initialState.kitchenType).toBeNull()
      expect(initialState.layout).toBeNull()
      expect(initialState.isCalculating).toBe(false)
    })
  })
})