import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/bim'

/**
 * BIM-specific axios instance
 * @type {import('axios').AxiosInstance}
 */
const bimApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
bimApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
bimApiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error?.message || 
                    error.response?.data?.message || 
                    'An error occurred during BIM operation'
    return Promise.reject(new Error(message))
  }
)

/**
 * BIM API Client
 * Provides CRUD operations for BIM projects, objects, layers, materials, and export/import
 */
export const bimClient = {
  // ============================================================================
  // PROJECT ENDPOINTS
  // ============================================================================

  /**
   * Create a new BIM project
   * @param {Object} projectData - Project configuration
   * @param {string} projectData.name - Project name
   * @param {string} [projectData.description] - Project description
   * @param {string} projectData.unit - Measurement unit (mm, cm, m, ft, in)
   * @param {Object} [projectData.dimensions] - Project dimensions {width, height, depth}
   * @param {Object} [projectData.metadata] - Additional metadata
   * @returns {Promise<Object>} Created project with id and timestamps
   */
  createProject: (projectData) => bimApiClient.post('/bim/projects', projectData),

  /**
   * Get a project by ID
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} Project data with objects, layers, materials
   */
  getProject: (projectId) => bimApiClient.get(`/bim/projects/${projectId}`),

  /**
   * Update an existing project
   * @param {string} projectId - Project identifier
   * @param {Object} data - Updated project data
   * @returns {Promise<Object>} Updated project
   */
  updateProject: (projectId, data) => bimApiClient.put(`/bim/projects/${projectId}`, data),

  /**
   * Delete a project and all related data
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} Success response
   */
  deleteProject: (projectId) => bimApiClient.delete(`/bim/projects/${projectId}`),

  /**
   * List all projects with pagination
   * @param {Object} [params] - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=20] - Items per page
   * @param {string} [params.search] - Search query
   * @returns {Promise<Object>} Projects list with total count
   */
  listProjects: (params = {}) => bimApiClient.get('/bim/projects', { params }),

  // ============================================================================
  // OBJECT ENDPOINTS
  // ============================================================================

  /**
   * Create a new object in a project
   * @param {string} projectId - Project identifier
   * @param {Object} objectData - Object configuration
   * @param {string} objectData.type - Object type (wall, floor, ceiling, panel, etc.)
   * @param {string} objectData.name - Object name
   * @param {Object} objectData.geometry - Geometric data (position, dimensions, rotation)
   * @param {Object} [objectData.properties] - Custom properties
   * @param {string} [objectData.layer_id] - Layer assignment
   * @param {string} [objectData.material_id] - Material assignment
   * @returns {Promise<Object>} Created object with id
   */
  createObject: (projectId, objectData) => 
    bimApiClient.post('/bim/objects', { project_id: projectId, ...objectData }),

  /**
   * Get an object by ID
   * @param {string} objectId - Object identifier
   * @returns {Promise<Object>} Object data
   */
  getObject: (objectId) => bimApiClient.get(`/bim/objects/${objectId}`),

  /**
   * Update an existing object
   * @param {string} objectId - Object identifier
   * @param {Object} data - Updated object data
   * @returns {Promise<Object>} Updated object
   */
  updateObject: (objectId, data) => bimApiClient.put(`/bim/objects/${objectId}`, data),

  /**
   * Delete an object
   * @param {string} objectId - Object identifier
   * @returns {Promise<Object>} Success response
   */
  deleteObject: (objectId) => bimApiClient.delete(`/bim/objects/${objectId}`),

  /**
   * Get all objects in a project
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} List of objects
   */
  getProjectObjects: (projectId) => bimApiClient.get(`/bim/projects/${projectId}/objects`),

  // ============================================================================
  // LAYER ENDPOINTS
  // ============================================================================

  /**
   * Create a new layer in a project
   * @param {string} projectId - Project identifier
   * @param {Object} layerData - Layer configuration
   * @param {string} layerData.name - Layer name
   * @param {string} [layerData.color] - Layer color (hex)
   * @param {boolean} [layerData.visible=true] - Layer visibility
   * @param {boolean} [layerData.locked=false] - Layer lock state
   * @returns {Promise<Object>} Created layer
   */
  createLayer: (projectId, layerData) => 
    bimApiClient.post('/bim/layers', { project_id: projectId, ...layerData }),

  /**
   * Get all layers in a project
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} List of layers
   */
  getProjectLayers: (projectId) => bimApiClient.get(`/bim/projects/${projectId}/layers`),

  /**
   * Update a layer
   * @param {string} layerId - Layer identifier
   * @param {Object} data - Updated layer data
   * @returns {Promise<Object>} Updated layer
   */
  updateLayer: (layerId, data) => bimApiClient.put(`/bim/layers/${layerId}`, data),

  /**
   * Delete a layer
   * @param {string} layerId - Layer identifier
   * @returns {Promise<Object>} Success response
   */
  deleteLayer: (layerId) => bimApiClient.delete(`/bim/layers/${layerId}`),

  // ============================================================================
  // MATERIAL ENDPOINTS
  // ============================================================================

  /**
   * Get all available materials
   * @returns {Promise<Object>} List of materials
   */
  getMaterials: () => bimApiClient.get('/bim/materials'),

  /**
   * Create a custom material
   * @param {Object} materialData - Material configuration
   * @param {string} materialData.name - Material name
   * @param {string} materialData.color - Material color (hex)
   * @param {number} [materialData.density] - Material density
   * @param {number} [materialData.cost_per_unit] - Cost per unit
   * @param {Object} [materialData.properties] - Additional properties
   * @returns {Promise<Object>} Created material
   */
  createMaterial: (materialData) => bimApiClient.post('/bim/materials', materialData),

  /**
   * Get material by ID
   * @param {string} materialId - Material identifier
   * @returns {Promise<Object>} Material data
   */
  getMaterial: (materialId) => bimApiClient.get(`/bim/materials/${materialId}`),

  // ============================================================================
  // EXPORT ENDPOINTS
  // ============================================================================

  /**
   * Export project to IFC format
   * @param {string} projectId - Project identifier
   * @returns {Promise<Blob>} IFC file data
   */
  exportIFC: (projectId) => bimApiClient.post('/bim/export/ifc', { project_id: projectId }, {
    responseType: 'blob'
  }),

  /**
   * Export project to DXF format
   * @param {string} projectId - Project identifier
   * @returns {Promise<Blob>} DXF file data
   */
  exportDXF: (projectId) => bimApiClient.post('/bim/export/dxf', { project_id: projectId }, {
    responseType: 'blob'
  }),

  /**
   * Export project to SVG blueprint
   * @param {string} projectId - Project identifier
   * @returns {Promise<Blob>} SVG file data
   */
  exportSVG: (projectId) => bimApiClient.post('/bim/export/svg', { project_id: projectId }, {
    responseType: 'blob'
  }),

  /**
   * Export project to JSON format
   * @param {string} projectId - Project identifier
   * @returns {Promise<Object>} JSON project data
   */
  exportJSON: (projectId) => bimApiClient.post('/bim/export/json', { project_id: projectId }),

  // ============================================================================
  // IMPORT ENDPOINTS
  // ============================================================================

  /**
   * Import IFC file into project
   * @param {string} projectId - Project identifier (optional for new projects)
   * @param {File} file - IFC file to import
   * @returns {Promise<Object>} Import result with imported objects
   */
  importIFC: (projectId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    if (projectId) {
      formData.append('project_id', projectId)
    }
    return bimApiClient.post('/bim/import/ifc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * Import DXF file into project
   * @param {string} projectId - Project identifier (optional for new projects)
   * @param {File} file - DXF file to import
   * @returns {Promise<Object>} Import result with imported objects
   */
  importDXF: (projectId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    if (projectId) {
      formData.append('project_id', projectId)
    }
    return bimApiClient.post('/bim/import/dxf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // ============================================================================
  // TOOL ENDPOINTS
  // ============================================================================

  createLine: (data) => bimApiClient.post('/tools/line', data),

  createCircle: (data) => bimApiClient.post('/tools/circle', data),

  createArc: (data) => bimApiClient.post('/tools/arc', data),

  createRectangle: (data) => bimApiClient.post('/tools/rectangle', data),

  createDoor: (data) => bimApiClient.post('/tools/door', data),

  createWindow: (data) => bimApiClient.post('/tools/window', data),

  createEllipse: (data) => bimApiClient.post('/tools/ellipse', data),

  createPolygon: (data) => bimApiClient.post('/tools/polygon', data),

  createPolyline: (data) => bimApiClient.post('/tools/polyline', data),

  createStairs: (data) => bimApiClient.post('/tools/stairs', data),
}

export default bimClient
