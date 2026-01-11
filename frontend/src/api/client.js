import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
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
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error?.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

// API methods
export const api = {
  // Health
  health: () => apiClient.get('/health'),

  // Calculations
  calculate: (data) => apiClient.post('/calculate', data),
  getCalculation: (id) => apiClient.get(`/calculate/${id}`),
  optimizeCalculation: (data) => apiClient.post('/calculate/optimize', data),

  // Projects
  listProjects: (params) => apiClient.get('/projects', { params }),
  createProject: (data) => apiClient.post('/projects', data),
  getProject: (id) => apiClient.get(`/projects/${id}`),
  updateProject: (id, data) => apiClient.put(`/projects/${id}`, data),
  deleteProject: (id) => apiClient.delete(`/projects/${id}`),
  calculateProject: (id) => apiClient.post(`/projects/${id}/calculate`),

  // Materials
  listMaterials: (params) => apiClient.get('/materials', { params }),
  getMaterial: (id) => apiClient.get(`/materials/${id}`),
  getCategories: () => apiClient.get('/materials/categories'),
  estimateCost: (data) => apiClient.post('/materials/cost-estimate', data),

  // Exports
  exportSvg: (data) => apiClient.post('/exports/svg', data),
  exportDxf: (data) => apiClient.post('/exports/dxf', data),
  export3d: (data) => apiClient.post('/exports/3d', data),
  getExport: (id) => apiClient.get(`/exports/${id}`),
  downloadExport: (id) => `${API_BASE_URL}/exports/download/${id}`,
}

export default apiClient
