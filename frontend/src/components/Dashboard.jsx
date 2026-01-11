import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export default function Dashboard() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 30000,
  })

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.listProjects({ per_page: 5 }),
  })

  const stats = [
    { name: 'Active Projects', value: projects?.meta?.total || 0, change: '+12%', color: 'primary' },
    { name: 'Calculations Today', value: 47, change: '+5%', color: 'green' },
    { name: 'Export Downloads', value: 124, change: '+18%', color: 'blue' },
    { name: 'API Uptime', value: '99.9%', change: '', color: 'purple' },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome to Ceiling Panel Calculator</p>
        </div>
        <Link to="/calculator" className="btn btn-primary">
          New Calculation
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <p className="text-slate-400 text-sm">{stat.name}</p>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
            {stat.change && (
              <p className="text-green-400 text-sm mt-1">{stat.change} vs last week</p>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick calculator */}
        <div className="card p-6">
          <h3 className="mb-4">Quick Calculate</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Length (mm)</label>
                <input type="number" className="input" placeholder="5000" />
              </div>
              <div>
                <label className="label">Width (mm)</label>
                <input type="number" className="input" placeholder="4000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Perimeter Gap (mm)</label>
                <input type="number" className="input" placeholder="200" />
              </div>
              <div>
                <label className="label">Panel Gap (mm)</label>
                <input type="number" className="input" placeholder="50" />
              </div>
            </div>
            <button type="button" className="btn btn-primary w-full">
              Calculate Layout
            </button>
          </form>
        </div>

        {/* Recent projects */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3>Recent Projects</h3>
            <Link to="/projects" className="text-primary-400 text-sm hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {projects?.data?.length > 0 ? (
              projects.data.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-slate-400 text-sm">
                      {project.dimensions.length_mm}mm x {project.dimensions.width_mm}mm
                    </p>
                  </div>
                  <span className="text-slate-500 text-sm">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">No projects yet</p>
            )}
          </div>
        </div>
      </div>

      {/* System status */}
      <div className="card p-6">
        <h3 className="mb-4">System Status</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${health?.data?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>API: {health?.data?.status || 'checking...'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Database: {health?.data?.database || 'checking...'}</span>
          </div>
          <div className="text-slate-400 ml-auto text-sm">
            v{health?.data?.version || '2.0.0'} • Uptime: {Math.floor(health?.data?.uptime_seconds / 60) || 0} min
          </div>
        </div>
      </div>
    </div>
  )
}
