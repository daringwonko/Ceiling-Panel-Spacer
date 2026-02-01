import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Types for ceiling panel design
export interface Panel {
  id: string
  position: [number, number, number]
  dimensions: [number, number, number] // width, length, thickness in mm
  material: string
  selected: boolean
}

export interface CeilingDesign {
  id: string
  name: string
  ceilingDimensions: [number, number] // length, width in mm
  panels: Panel[]
  createdAt: string
  updatedAt: string
}

interface DesignState {
  // Design data
  currentDesign: CeilingDesign | null
  selectedPanelId: string | null
  
  // Grid snapping settings
  gridSnapEnabled: boolean
  gridSnapSize: number // 600 or 1200 mm
  
  // History for undo/redo
  history: CeilingDesign[]
  historyIndex: number
  
  // Actions
  setDesign: (design: CeilingDesign) => void
  selectPanel: (panelId: string | null) => void
  updatePanelMaterial: (panelId: string, material: string) => void
  addPanel: (panel: Panel) => void
  removePanel: (panelId: string) => void
  
  // Grid snapping actions
  setGridSnapEnabled: (enabled: boolean) => void
  setGridSnapSize: (size: number) => void
  
  // History actions
  saveToHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

const MAX_HISTORY = 50

export const useDesignStore = create<DesignState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentDesign: null,
    selectedPanelId: null,
    gridSnapEnabled: true,
    gridSnapSize: 600,
    history: [],
    historyIndex: -1,

    // Design actions
    setDesign: (design) => {
      set({ currentDesign: design })
      get().saveToHistory()
    },

    selectPanel: (panelId) => {
      set({ selectedPanelId: panelId })
    },

    updatePanelMaterial: (panelId, material) => {
      const { currentDesign, saveToHistory } = get()
      if (!currentDesign) return

      saveToHistory()
      
      const updatedPanels = currentDesign.panels.map(panel =>
        panel.id === panelId ? { ...panel, material } : panel
      )
      
      set({
        currentDesign: {
          ...currentDesign,
          panels: updatedPanels,
          updatedAt: new Date().toISOString()
        }
      })
    },

    addPanel: (panel) => {
      const { currentDesign, saveToHistory } = get()
      if (!currentDesign) return

      saveToHistory()
      
      set({
        currentDesign: {
          ...currentDesign,
          panels: [...currentDesign.panels, panel],
          updatedAt: new Date().toISOString()
        }
      })
    },

    removePanel: (panelId) => {
      const { currentDesign, saveToHistory } = get()
      if (!currentDesign) return

      saveToHistory()
      
      const updatedPanels = currentDesign.panels.filter(p => p.id !== panelId)
      
      set({
        currentDesign: {
          ...currentDesign,
          panels: updatedPanels,
          updatedAt: new Date().toISOString()
        },
        selectedPanelId: get().selectedPanelId === panelId ? null : get().selectedPanelId
      })
    },

    // Grid snapping actions
    setGridSnapEnabled: (enabled) => set({ gridSnapEnabled: enabled }),
    setGridSnapSize: (size) => set({ gridSnapSize: size }),

    // History actions
    saveToHistory: () => {
      const { currentDesign, history, historyIndex } = get()
      if (!currentDesign) return

      // Remove any future history if we're not at the end
      const newHistory = history.slice(0, historyIndex + 1)
      
      // Add current state to history
      newHistory.push(JSON.parse(JSON.stringify(currentDesign)))
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
      }

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1
      })
    },

    undo: () => {
      const { history, historyIndex, currentDesign } = get()
      if (historyIndex <= 0 || !currentDesign) return

      const previousDesign = history[historyIndex - 1]
      set({
        currentDesign: JSON.parse(JSON.stringify(previousDesign)),
        historyIndex: historyIndex - 1,
        selectedPanelId: null
      })
    },

    redo: () => {
      const { history, historyIndex, currentDesign } = get()
      if (!currentDesign || historyIndex >= history.length - 1) return

      const nextDesign = history[historyIndex + 1]
      set({
        currentDesign: JSON.parse(JSON.stringify(nextDesign)),
        historyIndex: historyIndex + 1,
        selectedPanelId: null
      })
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => {
      const { history, historyIndex, currentDesign } = get()
      return currentDesign && historyIndex < history.length - 1
    }
  }))
)

// Helper function to snap to grid
export function snapToGrid(value: number, gridSize: number, enabled: boolean): number {
  if (!enabled || gridSize <= 0) return value
  return Math.round(value / gridSize) * gridSize
}

// Generate unique panel ID
export function generatePanelId(): string {
  return `panel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
