import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../api/client'

export default function Projects() {
  const [showCreate, setShowCreate] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    dimensions: { length_mm: 5000, width_mm: 4000 },
    spacing: { perimeter_gap_mm: 200, panel_gap_mm: 50 },
  })

  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.listProjects({ per_page: 50 }),
  })

  const createMutation = useMutation({
    mutationFn: api.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowCreate(false)
      setNewProject({
        name: '',
        description: '',
        dimensions: { length_mm: 5000, width_mm: 4000 },
        spacing: { perimeter_gap_mm: 200, panel_gap_mm: 50 },
      })
      toast.success('Project created!')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleCreate = (e) => {
    e.preventDefault()
    createMutation.mutate(newProject)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Projects</h1>
          <p className="text-slate-400 mt-1">Manage your ceiling projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          New Project
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-lg">
            <h2 className="mb-4">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Project Name</label>
                <input
                  type="text"
                  className="input"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows="2"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Length (mm)</label>
                  <input
                    type="number"
                    className="input"
                    value={newProject.dimensions.length_mm}
                    onChange={(e) => setNewProject({
                      ...newProject,
                      dimensions: { ...newProject.dimensions, length_mm: parseFloat(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="label">Width (mm)</label>
                  <input
                    type="number"
                    className="input"
                    value={newProject.dimensions.width_mm}
                    onChange={(e) => setNewProject({
                      ...newProject,
                      dimensions: { ...newProject.dimensions, width_mm: parseFloat(e.target.value) }
                    })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading projects...</div>
      ) : projects?.data?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.data.map((project) => (
            <div key={project.id} className="card p-6 hover:border-primary-500 transition-colors">
              <div className="flex items-start justify-between">
                <Link to={`/projects/${project.id}`} className="flex-1">
                  <h3 className="font-semibold hover:text-primary-400">{project.name}</h3>
                  {project.description && (
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">{project.description}</p>
                  )}
                </Link>
                <button
                  onClick={() => {
                    if (confirm('Delete this project?')) {
                      deleteMutation.mutate(project.id)
                    }
                  }}
                  className="text-slate-500 hover:text-red-400 p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
                <div className="flex justify-between">
                  <span>Dimensions:</span>
                  <span>{project.dimensions.length_mm} x {project.dimensions.width_mm}mm</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Updated:</span>
                  <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              <Link
                to={`/projects/${project.id}`}
                className="btn btn-secondary w-full mt-4 text-center"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-slate-400 mb-4">No projects yet</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            Create Your First Project
          </button>
        </div>
      )}
    </div>
  )
}
