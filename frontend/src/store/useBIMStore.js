import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { bimClient } from '../api/bimClient'

/**
 * BIM Store State
 * @typedef {Object} BIMStoreState
 * @property {Object|null} currentProject - Currently loaded project
 * @property {Array} objects - Project objects
 * @property {Array} layers - Project layers
 * @property {Array} selectedObjects - IDs of selected objects
 * @property {boolean} isLoading - Loading state for async operations
 * @property {boolean} isSaving - Saving state
 * @property {boolean} isDirty - Whether project has unsaved changes
 * @property {Error|null} error - Last error that occurred
 * @property {Array} exportHistory - History of recent exports
 * @property {Object|null} activeTool - Currently active drawing tool
 */

/**
 * BIM Store Actions
 * @typedef {Object} BIMStoreActions
 * @property {Function} loadProject - Load a project by ID
 * @property {Function} saveProject - Save current project
 * @property {Function} createProject - Create a new project
 * @property {Function} createObject - Create a new object
 * @property {Function} updateObject - Update an existing object
 * @property {Function} deleteObject - Delete an object
 * @property {Function} selectObject - Select/deselect object(s)
 * @property {Function} clearSelection - Clear object selection
 * @property {Function} exportProject - Export project to file
 * @property {Function} setError - Set error state
 * @property {Function} clearError - Clear error state
 * @property {Function} setActiveTool - Set active drawing tool
 * @property {Function} reset - Reset store to initial state
 */

/**
 * BIM Store
 * Combines state and actions for BIM Workbench
 * @returns {BIMStoreState & BIMStoreActions}
 */
export const useBIMStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ============================================================================
        // STATE
        // ============================================================================
        
        currentProject: null,
        objects: [],
        layers: [],
        selectedObjects: [],
        isLoading: false,
        isSaving: false,
        isDirty: false,
        error: null,
        exportHistory: [],
        activeTool: null,
        
        // ============================================================================
        // PROJECT ACTIONS
        // ============================================================================

        /**
         * Load a project by ID
         * @param {string} projectId - Project identifier
         * @returns {Promise<Object>} Loaded project data
         */
        loadProject: async (projectId) => {
          set({ isLoading: true, error: null })
          
          try {
            const project = await bimClient.getProject(projectId)
            
            set({
              currentProject: project,
              objects: project.objects || [],
              layers: project.layers || [],
              selectedObjects: [],
              isDirty: false,
              isLoading: false,
            })
            
            return project
          } catch (error) {
            const errorMessage = error.message || 'Failed to load project'
            set({ 
              error: new Error(errorMessage), 
              isLoading: false,
              currentProject: null,
              objects: [],
              layers: [],
            })
            throw error
          }
        },

        /**
         * Create a new project
         * @param {Object} projectData - Project configuration
         * @returns {Promise<Object>} Created project
         */
        createProject: async (projectData) => {
          set({ isLoading: true, error: null })
          
          try {
            const project = await bimClient.createProject(projectData)
            
            set({
              currentProject: project,
              objects: [],
              layers: [],
              selectedObjects: [],
              isDirty: false,
              isLoading: false,
            })
            
            return project
          } catch (error) {
            set({ 
              error: new Error(error.message || 'Failed to create project'), 
              isLoading: false 
            })
            throw error
          }
        },

        /**
         * Save current project
         * Creates new project if no ID exists, updates otherwise
         * @param {Object} [projectData] - Optional project data to save
         * @returns {Promise<Object>} Saved project
         */
        saveProject: async (projectData) => {
          const { currentProject } = get()
          set({ isSaving: true, error: null })
          
          try {
            let savedProject
            
            if (currentProject?.id) {
              // Update existing project
              const dataToUpdate = projectData || currentProject
              savedProject = await bimClient.updateProject(
                currentProject.id, 
                dataToUpdate
              )
            } else {
              // Create new project
              const dataToCreate = projectData || currentProject
              if (!dataToCreate?.name) {
                throw new Error('Project name is required')
              }
              savedProject = await bimClient.createProject(dataToCreate)
            }
            
            set({
              currentProject: savedProject,
              isDirty: false,
              isSaving: false,
            })
            
            return savedProject
          } catch (error) {
            set({ 
              error: new Error(error.message || 'Failed to save project'), 
              isSaving: false 
            })
            throw error
          }
        },

        /**
         * Delete current project
         * @returns {Promise<void>}
         */
        deleteProject: async () => {
          const { currentProject } = get()
          
          if (!currentProject?.id) {
            throw new Error('No project to delete')
          }
          
          set({ isLoading: true, error: null })
          
          try {
            await bimClient.deleteProject(currentProject.id)
            
            set({
              currentProject: null,
              objects: [],
              layers: [],
              selectedObjects: [],
              isDirty: false,
              isLoading: false,
            })
          } catch (error) {
            set({ 
              error: new Error(error.message || 'Failed to delete project'), 
              isLoading: false 
            })
            throw error
          }
        },

        /**
         * Update project metadata
         * @param {Object} updates - Project updates
         */
        updateProjectMeta: (updates) => {
          const { currentProject } = get()
          if (!currentProject) return
          
          set({
            currentProject: { ...currentProject, ...updates },
            isDirty: true,
          })
        },
        
        // ============================================================================
        // OBJECT ACTIONS
        // ============================================================================

        /**
         * Create a new object in the project
         * @param {Object} objectData - Object configuration
         * @returns {Promise<Object>} Created object
         */
        createObject: async (objectData) => {
          const { currentProject } = get()
          
          if (!currentProject?.id) {
            throw new Error('No project loaded')
          }
          
          // Validate required fields
          if (!objectData.type) {
            throw new Error('Object type is required')
          }
          if (!objectData.name) {
            throw new Error('Object name is required')
          }
          if (!objectData.geometry) {
            throw new Error('Object geometry is required')
          }
          
          set({ isLoading: true, error: null })
          
          try {
            const newObject = await bimClient.createObject(
              currentProject.id, 
              objectData
            )
            
            set((state) => ({
              objects: [...state.objects, newObject],
              isDirty: true,
              isLoading: false,
            }))
            
            return newObject
          } catch (error) {
            set({ 
              error: new Error(error.message || 'Failed to create object'), 
              isLoading: false 
            })
            throw error
          }
        },

        /**
         * Update an existing object
         * @param {string} objectId - Object identifier
         * @param {Object} updates - Object updates
         * @returns {Promise<Object>} Updated object
         */
        updateObject: async (objectId, updates) => {
          const { objects } = get()
          const objectIndex = objects.findIndex(obj => obj.id === objectId)
          
          if (objectIndex === -1) {
            throw new Error('Object not found')
          }
          
          set({ isLoading: true, error: null })
          
          try {
            const updatedObject = await bimClient.updateObject(objectId, updates)
            
            set((state) => ({
              objects: state.objects.map((obj, idx) => 
                idx === objectIndex ? updatedObject : obj
              ),
              isDirty: true,
              isLoading: false,
            }))
            
            return updatedObject
          } catch (error) {
            set({ 
              error: new Error(error.message || 'Failed to update object'), 
              isLoading: false 
            })
            throw error
          }
        },

        /**
         * Delete an object
         * @param {string} objectId - Object identifier
         * @returns {Promise<void>}
         */
        deleteObject: async (objectId) => {
          set({ isLoading: true, error: null })
          
          try {
            await bimClient.deleteObject(objectId)
            
            set((state) => ({
              objects: state.objects.filter(obj => obj.id !== objectId),
              selectedObjects: state.selectedObjects.filter(id => id !== objectId),
              isDirty: true,
              isLoading: false,
            }))
          } catch (error) {
            set({ 
              error: new Error(error.message || 'Failed to delete object'), 
              isLoading: false 
            })
            throw error
          }
        },

        /**
         * Select/deselect object(s)
         * @param {string|string[]} objectIds - Object ID(s) to select
         * @param {boolean} [additive=false] - Add to selection (true) or replace (false)
         */
        selectObject: (objectIds, additive = false) => {
          const ids = Array.isArray(objectIds) ? objectIds : [objectIds]
          
          set((state) => ({
            selectedObjects: additive 
              ? [...new Set([...state.selectedObjects, ...ids])]
              : ids,
          }))
        },

        /**
         * Clear object selection
         */
        clearSelection: () => {
          set({ selectedObjects: [] })
        },

        /**
         * Delete all selected objects
         * @returns {Promise<void>}
         */
        deleteSelectedObjects: async () => {
          const { selectedObjects } = get()
          
          if (selectedObjects.length === 0) return
          
          set({ isLoading: true, error: null })
          
          try {
            // Delete all selected objects in parallel
            await Promise.all(
              selectedObjects.map(id => bimClient.deleteObject(id))
            )
            
            set((state) => ({
              objects: state.objects.filter(obj => !selectedObjects.includes(obj.id)),
              selectedObjects: [],
              isDirty: true,
              isLoading: false,
            }))
          } catch (error) {
            set({ 
              error: new Error(error.message || 'Failed to delete selected objects'), 
              isLoading: false 
            })
            throw error
          }
        },
        
        // ============================================================================
        // LAYER ACTIONS
        // ============================================================================

        /**
         * Create a new layer
         * @param {Object} layerData - Layer configuration
         * @returns {Promise<Object>} Created layer
         */
        createLayer: async (layerData) => {
          const { currentProject } = get()
          
          if (!currentProject?.id) {
            throw new Error('No project loaded')
          }
          
          if (!layerData.name) {
            throw new Error('Layer name is required')
          }
          
          set({ isLoading: true, error: null })
          
          try {
            const newLayer = await bimClient.createLayer(
              currentProject.id,
              layerData
            )
            
            set((state) => ({
              layers: [...state.layers, newLayer],
              isDirty: true,
              isLoading: false,
            }))
            
            return newLayer
          } catch (error) {
            set({ 
              error: new Error(error.message || 'Failed to create layer'), 
              isLoading: false 
            })
            throw error
          }
        },

        /**
         * Update a layer
         * @param {string} layerId - Layer identifier
         * @param {Object} updates - Layer updates
         * @returns {Promise<Object>} Updated layer
         */
        updateLayer: async (layerId, updates) => {
          set({ isLoading: true, error: null })
          
          try {
            const updatedLayer = await bimClient.updateLayer(layerId, updates)
            
            set((state) => ({
              layers: state.layers.map(layer => 
                layer.id === layerId ? updatedLayer : layer
              ),
              isDirty: true,
              isLoading: false,
            }))
            
            return updatedLayer
          } catch (error) {
            set({ 
              error: new Error(error.message || 'Failed to update layer'), 
              isLoading: false 
            })
            throw error
          }
        },

        /**
         * Delete a layer
         * @param {string} layerId - Layer identifier
         * @returns {Promise<void>}
         */
        deleteLayer: async (layerId) => {
          set({ isLoading: true, error: null })
          
          try {
            await bimClient.deleteLayer(layerId)
            
            set((state) => ({
              layers: state.layers.filter(layer => layer.id !== layerId),
              // Remove layer assignment from objects
              objects: state.objects.map(obj => 
                obj.layer_id === layerId ? { ...obj, layer_id: null } : obj
              ),
              isDirty: true,
              isLoading: false,
            }))
          } catch (error) {
            set({ 
              error: new Error(error.message || 'Failed to delete layer'), 
              isLoading: false 
            })
            throw error
          }
        },

        /**
         * Toggle layer visibility
         * @param {string} layerId - Layer identifier
         */
        toggleLayerVisibility: async (layerId) => {
          const { layers } = get()
          const layer = layers.find(l => l.id === layerId)
          
          if (layer) {
            await get().updateLayer(layerId, { visible: !layer.visible })
          }
        },

        /**
         * Toggle layer lock state
         * @param {string} layerId - Layer identifier
         */
        toggleLayerLock: async (layerId) => {
          const { layers } = get()
          const layer = layers.find(l => l.id === layerId)
          
          if (layer) {
            await get().updateLayer(layerId, { locked: !layer.locked })
          }
        },
        
        // ============================================================================
        // EXPORT/IMPORT ACTIONS
        // ============================================================================

        /**
         * Export project to a file format
         * @param {string} format - Export format (IFC, DXF, SVG, JSON)
         * @param {string} [filename] - Optional filename
         * @returns {Promise<Blob>} Exported file data
         */
        exportProject: async (format, filename) => {
          const { currentProject, exportHistory } = get()
          
          if (!currentProject?.id) {
            throw new Error('No project loaded')
          }
          
          const validFormats = ['IFC', 'DXF', 'SVG', 'JSON']
          if (!validFormats.includes(format)) {
            throw new Error(`Invalid format: ${format}. Must be one of: ${validFormats.join(', ')}`)
          }
          
          set({ isLoading: true, error: null })
          
          try {
            const blob = await bimClient[`export${format}`](currentProject.id)
            
            // Handle file download for binary formats
            if (format !== 'JSON') {
              const url = window.URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = filename || `${currentProject.name}.${format.toLowerCase()}`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              window.URL.revokeObjectURL(url)
            }
            
            // Track export in history
            const exportRecord = {
              format,
              filename: filename || `${currentProject.name}.${format.toLowerCase()}`,
              timestamp: new Date().toISOString(),
              projectId: currentProject.id,
            }
            
            set((state) => ({
              exportHistory: [exportRecord, ...state.exportHistory].slice(0, 50), // Keep last 50
              isLoading: false,
            }))
            
            return blob
          } catch (error) {
            set({ 
              error: new Error(error.message || `Failed to export as ${format}`), 
              isLoading: false 
            })
            throw error
          }
        },

        /**
         * Import file into current project
         * @param {File} file - File to import
         * @param {string} format - Import format (IFC, DXF)
         * @returns {Promise<Object>} Import result
         */
        importProject: async (file, format) => {
          const { currentProject } = get()
          
          const validFormats = ['IFC', 'DXF']
          if (!validFormats.includes(format)) {
            throw new Error(`Invalid format: ${format}. Must be one of: ${validFormats.join(', ')}`)
          }
          
          set({ isLoading: true, error: null })
          
          try {
            const result = await bimClient[`import${format}`](
              currentProject?.id,
              file
            )
            
            // Refresh project data after import
            if (currentProject?.id) {
              const project = await bimClient.getProject(currentProject.id)
              set({
                currentProject: project,
                objects: project.objects || [],
                layers: project.layers || [],
                isDirty: false,
                isLoading: false,
              })
            } else if (result.project_id) {
              // Imported as new project
              const project = await bimClient.getProject(result.project_id)
              set({
                currentProject: project,
                objects: project.objects || [],
                layers: project.layers || [],
                isDirty: false,
                isLoading: false,
              })
            }
            
            return result
          } catch (error) {
            set({ 
              error: new Error(error.message || `Failed to import ${format}`), 
              isLoading: false 
            })
            throw error
          }
        },
        
        // ============================================================================
        // UTILITY ACTIONS
        // ============================================================================

        /**
         * Set error state
         * @param {Error|string} error - Error to set
         */
        setError: (error) => {
          set({ 
            error: error instanceof Error ? error : new Error(String(error)) 
          })
        },

        /**
         * Clear error state
         */
        clearError: () => {
          set({ error: null })
        },

        /**
         * Set active drawing tool
         * @param {Object|null} tool - Tool configuration or null to clear
         */
        setActiveTool: (tool) => {
          set({ activeTool: tool })
        },

        /**
         * Reset store to initial state
         */
        reset: () => {
          set({
            currentProject: null,
            objects: [],
            layers: [],
            selectedObjects: [],
            isLoading: false,
            isSaving: false,
            isDirty: false,
            error: null,
            activeTool: null,
          })
        },
      }),
      {
        name: 'bim-store',
        partialize: (state) => ({
          currentProject: state.currentProject,
          exportHistory: state.exportHistory,
        }),
      }
    ),
    { name: 'BIMStore' }
  )
)

export default useBIMStore
