import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bimClient } from '../api/bimClient'

/**
 * Query keys for BIM data management
 */
export const bimQueryKeys = {
  all: ['bim'],
  projects: () => [...bimQueryKeys.all, 'projects'],
  project: (id) => [...bimQueryKeys.all, 'project', id],
  objects: (projectId) => [...bimQueryKeys.all, 'objects', projectId],
  layers: (projectId) => [...bimQueryKeys.all, 'layers', projectId],
  materials: () => [...bimQueryKeys.all, 'materials'],
  material: (id) => [...bimQueryKeys.all, 'material', id],
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook for fetching a single BIM project
 * @param {string} projectId - Project identifier
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with project data
 * @example
 * const { data: project, isLoading, error } = useBIMProject('123')
 */
export function useBIMProject(projectId) {
  return useQuery({
    queryKey: bimQueryKeys.project(projectId),
    queryFn: () => bimClient.getProject(projectId),
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for fetching all BIM projects
 * @param {Object} [params] - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.search] - Search query
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with projects list
 * @example
 * const { data: projects, isLoading } = useBIMProjects({ page: 1, limit: 10 })
 */
export function useBIMProjects(params = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: [...bimQueryKeys.projects(), params],
    queryFn: () => bimClient.listProjects(params),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for fetching objects in a project
 * @param {string} projectId - Project identifier
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with objects list
 * @example
 * const { data: objects, isLoading } = useBIMObjects('123')
 */
export function useBIMObjects(projectId) {
  return useQuery({
    queryKey: bimQueryKeys.objects(projectId),
    queryFn: () => bimClient.getProjectObjects(projectId),
    enabled: Boolean(projectId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching a single object
 * @param {string} objectId - Object identifier
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with object data
 * @example
 * const { data: object, isLoading } = useBIMObject('obj-456')
 */
export function useBIMObject(objectId) {
  return useQuery({
    queryKey: [...bimQueryKeys.all, 'object', objectId],
    queryFn: () => bimClient.getObject(objectId),
    enabled: Boolean(objectId),
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook for fetching layers in a project
 * @param {string} projectId - Project identifier
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with layers list
 * @example
 * const { data: layers, isLoading } = useBIMLayers('123')
 */
export function useBIMLayers(projectId) {
  return useQuery({
    queryKey: bimQueryKeys.layers(projectId),
    queryFn: () => bimClient.getProjectLayers(projectId),
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for fetching available materials
 * @returns {import('@tanstack/react-query').UseQueryResult} Query result with materials list
 * @example
 * const { data: materials, isLoading } = useMaterials()
 */
export function useMaterials() {
  return useQuery({
    queryKey: bimQueryKeys.materials(),
    queryFn: () => bimClient.getMaterials(),
    staleTime: 10 * 60 * 1000, // 10 minutes - materials don't change often
  })
}

// ============================================================================
// MUTATION HOOKS - PROJECTS
// ============================================================================

/**
 * Hook for creating a new project
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const createProject = useCreateProject()
 * createProject.mutate({ name: 'My Project', unit: 'mm' })
 */
export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (projectData) => bimClient.createProject(projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bimQueryKeys.projects() })
    },
  })
}

/**
 * Hook for updating a project
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const updateProject = useUpdateProject()
 * updateProject.mutate({ projectId: '123', data: { name: 'Updated' } })
 */
export function useUpdateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ projectId, data }) => bimClient.updateProject(projectId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: bimQueryKeys.project(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: bimQueryKeys.projects() })
    },
  })
}

/**
 * Hook for deleting a project
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const deleteProject = useDeleteProject()
 * deleteProject.mutate('123')
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (projectId) => bimClient.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bimQueryKeys.projects() })
    },
  })
}

// ============================================================================
// MUTATION HOOKS - OBJECTS
// ============================================================================

/**
 * Hook for creating an object in a project
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const createObject = useCreateObject()
 * createObject.mutate({ projectId: '123', objectData: { type: 'wall', name: 'Wall 1' } })
 */
export function useCreateObject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ projectId, objectData }) => bimClient.createObject(projectId, objectData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: bimQueryKeys.objects(variables.projectId) })
    },
  })
}

/**
 * Hook for updating an object
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const updateObject = useUpdateObject()
 * updateObject.mutate({ objectId: 'obj-456', data: { name: 'Updated Wall' } })
 */
export function useUpdateObject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ objectId, data }) => bimClient.updateObject(objectId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...bimQueryKeys.all, 'object', variables.objectId] })
    },
  })
}

/**
 * Hook for deleting an object
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const deleteObject = useDeleteObject()
 * deleteObject.mutate({ objectId: 'obj-456', projectId: '123' })
 */
export function useDeleteObject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ objectId }) => bimClient.deleteObject(objectId),
    onSuccess: (data, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: bimQueryKeys.objects(variables.projectId) })
      }
    },
  })
}

// ============================================================================
// MUTATION HOOKS - LAYERS
// ============================================================================

/**
 * Hook for creating a layer
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const createLayer = useCreateLayer()
 * createLayer.mutate({ projectId: '123', layerData: { name: 'Walls', color: '#FF0000' } })
 */
export function useCreateLayer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ projectId, layerData }) => bimClient.createLayer(projectId, layerData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: bimQueryKeys.layers(variables.projectId) })
    },
  })
}

/**
 * Hook for updating a layer
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const updateLayer = useUpdateLayer()
 * updateLayer.mutate({ layerId: 'layer-789', data: { visible: false } })
 */
export function useUpdateLayer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ layerId, data }) => bimClient.updateLayer(layerId, data),
    onSuccess: () => {
      // Invalidate all layer queries since we don't know the project
      queryClient.invalidateQueries({ queryKey: [...bimQueryKeys.all, 'layers'] })
    },
  })
}

/**
 * Hook for deleting a layer
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const deleteLayer = useDeleteLayer()
 * deleteLayer.mutate({ layerId: 'layer-789', projectId: '123' })
 */
export function useDeleteLayer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ layerId }) => bimClient.deleteLayer(layerId),
    onSuccess: (data, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: bimQueryKeys.layers(variables.projectId) })
      }
    },
  })
}

// ============================================================================
// MUTATION HOOKS - MATERIALS
// ============================================================================

/**
 * Hook for creating a material
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const createMaterial = useCreateMaterial()
 * createMaterial.mutate({ name: 'Concrete', color: '#808080', density: 2400 })
 */
export function useCreateMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (materialData) => bimClient.createMaterial(materialData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bimQueryKeys.materials() })
    },
  })
}

// ============================================================================
// MUTATION HOOKS - EXPORT/IMPORT
// ============================================================================

/**
 * Hook for exporting a project
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const exportProject = useExportProject()
 * exportProject.mutate({ projectId: '123', format: 'IFC' }, {
 *   onSuccess: (blob) => downloadFile(blob, 'project.ifc')
 * })
 */
export function useExportProject() {
  return useMutation({
    mutationFn: ({ projectId, format }) => {
      const exportFn = bimClient[`export${format}`]
      if (!exportFn) {
        throw new Error(`Unsupported export format: ${format}`)
      }
      return exportFn.call(bimClient, projectId)
    },
  })
}

/**
 * Hook for importing a file into a project
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 * @example
 * const importProject = useImportProject()
 * importProject.mutate({ projectId: '123', format: 'IFC', file: ifcFile })
 */
export function useImportProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ projectId, format, file }) => {
      const importFn = bimClient[`import${format}`]
      if (!importFn) {
        throw new Error(`Unsupported import format: ${format}`)
      }
      return importFn.call(bimClient, projectId, file)
    },
    onSuccess: (data, variables) => {
      if (variables.projectId) {
        queryClient.invalidateQueries({ queryKey: bimQueryKeys.project(variables.projectId) })
        queryClient.invalidateQueries({ queryKey: bimQueryKeys.objects(variables.projectId) })
      }
    },
  })
}

// ============================================================================
// GROUPED EXPORTS
// ============================================================================

/**
 * All BIM hooks grouped together for convenience
 */
export const useBIM = {
  // Queries
  useBIMProject,
  useBIMProjects,
  useBIMObject,
  useBIMObjects,
  useBIMLayers,
  useMaterials,
  
  // Project mutations
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  
  // Object mutations
  useCreateObject,
  useUpdateObject,
  useDeleteObject,
  
  // Layer mutations
  useCreateLayer,
  useUpdateLayer,
  useDeleteLayer,
  
  // Material mutations
  useCreateMaterial,
  
  // Export/Import
  useExportProject,
  useImportProject,
}

export default useBIM
