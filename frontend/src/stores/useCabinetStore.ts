import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

const API_URL = '/api/v1/kitchen/calculate'

export interface CabinetDimensions {
  width: number
  length: number
}

export interface CabinetMaterial {
  id: string
  name: string
  type: 'wood' | 'laminate' | 'acrylic' | 'melamine' | 'veneer'
  color: string
  costPerUnit: number
}

export interface CabinetPanel {
  id: string
  type: 'base' | 'upper' | 'drawer' | 'door' | 'shelf'
  dimensions: {
    width: number
    height: number
    depth: number
  }
  materialId: string
  position: {
    x: number
    y: number
    z: number
  }
}

export interface CabinetLayout {
  panels: CabinetPanel[]
  arrangement: string
  totalDimensions: CabinetDimensions
}

export interface CabinetProject {
  id: string
  name: string
  dimensions: CabinetDimensions
  materials: CabinetMaterial[]
  panels: CabinetPanel[]
  cost: number
  layout: CabinetLayout | null
  createdAt: string
  updatedAt: string
}

export interface CalculateResponse {
  success: boolean
  panels: CabinetPanel[]
  layout: CabinetLayout
  cost: number
  error?: {
    message: string
  }
}

interface CabinetStoreState {
  project: CabinetProject | null
  isLoading: boolean
  error: string | null
}

interface CabinetStoreActions {
  createProject: (name: string, dimensions: CabinetDimensions) => void
  updateDimensions: (dimensions: CabinetDimensions) => void
  selectMaterial: (material: CabinetMaterial) => void
  calculate: () => Promise<void>
  clearProject: () => void
}

export type CabinetStore = CabinetStoreState & CabinetStoreActions

export const useCabinetStore = create<CabinetStore>((set, get) => ({
  project: null,
  isLoading: false,
  error: null,

  createProject: (name: string, dimensions: CabinetDimensions) => {
    const project: CabinetProject = {
      id: uuidv4(),
      name,
      dimensions,
      materials: [],
      panels: [],
      cost: 0,
      layout: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set({ project, error: null })
  },

  updateDimensions: (dimensions: CabinetDimensions) => {
    set((state) => ({
      project: state.project
        ? { ...state.project, dimensions, updatedAt: new Date().toISOString() }
        : null,
    }))
  },

  selectMaterial: (material: CabinetMaterial) => {
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            materials: [...state.project.materials, material],
            updatedAt: new Date().toISOString(),
          }
        : null,
    }))
  },

  calculate: async () => {
    const { project } = get()

    if (!project) {
      set({ error: 'No project to calculate' })
      return
    }

    if (project.materials.length === 0) {
      set({ error: 'At least one material must be selected' })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          width: project.dimensions.width,
          length: project.dimensions.length,
          material: project.materials[0]?.id || 'wood',
          style: 'standard',
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data: CalculateResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Calculation failed')
      }

      set((state) => ({
        project: state.project
          ? {
              ...state.project,
              panels: data.panels,
              layout: data.layout,
              cost: data.cost,
              updatedAt: new Date().toISOString(),
            }
          : null,
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Calculation failed'
      set({ error: errorMessage, isLoading: false })
    }
  },

  clearProject: () => {
    set({ project: null, error: null })
  },
}))