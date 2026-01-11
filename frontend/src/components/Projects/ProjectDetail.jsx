import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../../api/client'
import PanelPreview from '../Calculator/PanelPreview'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.getProject(id),
  })

  const calculateMutation = useMutation({
    mutationFn: () => api.calculateProject(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('Calculation completed!')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteProject(id),
    onSuccess: () => {
      navigate('/projects')
      toast.success('Project deleted')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400">Loading project...</div>
  }

  if (!project?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">Project not found</p>
        <button className="btn btn-secondary" onClick={() => navigate('/projects')}>
          Back to Projects
        </button>
      </div>
    )
  }

  const projectData = project.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-slate-400 hover:text-white text-sm mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </button>
          <h1>{projectData.name}</h1>
          {projectData.description && (
            <p className="text-slate-400 mt-1">{projectData.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => calculateMutation.mutate()}
            disabled={calculateMutation.isPending}
          >
            {calculateMutation.isPending ? 'Calculating...' : 'Run Calculation'}
          </button>
          <button
            className="btn btn-outline text-red-400 border-red-400 hover:bg-red-400/10"
            onClick={() => {
              if (confirm('Are you sure you want to delete this project?')) {
                deleteMutation.mutate()
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project details */}
        <div className="card p-6">
          <h3 className="mb-4">Project Details</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Dimensions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700 rounded-lg p-3">
                  <p className="text-slate-400 text-sm">Length</p>
                  <p className="text-xl font-semibold">{projectData.dimensions.length_mm} mm</p>
                </div>
                <div className="bg-slate-700 rounded-lg p-3">
                  <p className="text-slate-400 text-sm">Width</p>
                  <p className="text-xl font-semibold">{projectData.dimensions.width_mm} mm</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Spacing</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700 rounded-lg p-3">
                  <p className="text-slate-400 text-sm">Perimeter Gap</p>
                  <p className="text-xl font-semibold">{projectData.spacing.perimeter_gap_mm} mm</p>
                </div>
                <div className="bg-slate-700 rounded-lg p-3">
                  <p className="text-slate-400 text-sm">Panel Gap</p>
                  <p className="text-xl font-semibold">{projectData.spacing.panel_gap_mm} mm</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Area:</span>
                <span>{((projectData.dimensions.length_mm * projectData.dimensions.width_mm) / 1_000_000).toFixed(2)} m²</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-400">Created:</span>
                <span>{new Date(projectData.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-400">Updated:</span>
                <span>{new Date(projectData.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="card p-6">
          <h3 className="mb-4">Layout Preview</h3>
          <PanelPreview
            dimensions={projectData.dimensions}
            spacing={projectData.spacing}
          />
        </div>
      </div>

      {/* Tags */}
      {projectData.tags?.length > 0 && (
        <div className="card p-6">
          <h3 className="mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {projectData.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-slate-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
