import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export default function Materials() {
  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: () => api.listMaterials(),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  })

  const categoryColors = {
    lighting: 'bg-yellow-500/20 text-yellow-400',
    acoustic: 'bg-purple-500/20 text-purple-400',
    drywall: 'bg-gray-500/20 text-gray-400',
    metal: 'bg-blue-500/20 text-blue-400',
    custom: 'bg-green-500/20 text-green-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Material Library</h1>
          <p className="text-slate-400 mt-1">Browse available panel materials</p>
        </div>
      </div>

      {/* Categories */}
      {categories?.data && (
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-primary text-sm">All</button>
          {categories.data.map((cat) => (
            <button key={cat} className="btn btn-secondary text-sm capitalize">
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Materials grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading materials...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials?.data?.map((material) => (
            <div key={material.id} className="card p-6 hover:border-primary-500 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{material.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${categoryColors[material.category] || categoryColors.custom}`}>
                    {material.category}
                  </span>
                </div>
                <div
                  className="w-8 h-8 rounded-full border-2 border-slate-600"
                  style={{ backgroundColor: material.color }}
                  title={material.color}
                />
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reflectivity:</span>
                  <span>{(material.reflectivity * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cost per m²:</span>
                  <span className="font-semibold">${material.cost_per_sqm.toFixed(2)}</span>
                </div>
              </div>

              {material.notes && (
                <p className="mt-4 text-slate-400 text-sm">{material.notes}</p>
              )}

              <button className="btn btn-secondary w-full mt-4">
                Use Material
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!materials?.data || materials.data.length === 0) && (
        <div className="card p-12 text-center">
          <p className="text-slate-400">No materials available</p>
        </div>
      )}
    </div>
  )
}
