import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../../api/client'
import PanelPreview from './PanelPreview'

export default function Calculator() {
  const [dimensions, setDimensions] = useState({
    length_mm: 5000,
    width_mm: 4000,
  })

  const [spacing, setSpacing] = useState({
    perimeter_gap_mm: 200,
    panel_gap_mm: 50,
  })

  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [result, setResult] = useState(null)

  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: () => api.listMaterials(),
  })

  const calculateMutation = useMutation({
    mutationFn: api.calculate,
    onSuccess: (data) => {
      setResult(data.data)
      toast.success('Calculation completed!')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleCalculate = () => {
    calculateMutation.mutate({
      dimensions,
      spacing,
      material_id: selectedMaterial || undefined,
    })
  }

  const handleExport = async (format) => {
    try {
      let response
      if (format === 'svg') {
        response = await api.exportSvg({ dimensions, spacing })
      } else if (format === 'dxf') {
        response = await api.exportDxf({ dimensions, spacing })
      }

      if (response.data?.file_url) {
        window.open(response.data.file_url, '_blank')
        toast.success(`${format.toUpperCase()} export ready!`)
      }
    } catch (error) {
      toast.error(`Export failed: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Panel Calculator</h1>
          <p className="text-slate-400 mt-1">Calculate optimal ceiling panel layouts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="mb-4">Ceiling Dimensions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Length (mm)</label>
                <input
                  type="number"
                  className="input"
                  value={dimensions.length_mm}
                  onChange={(e) => setDimensions({ ...dimensions, length_mm: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="label">Width (mm)</label>
                <input
                  type="number"
                  className="input"
                  value={dimensions.width_mm}
                  onChange={(e) => setDimensions({ ...dimensions, width_mm: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-2">
              Area: {((dimensions.length_mm * dimensions.width_mm) / 1_000_000).toFixed(2)} m²
            </p>
          </div>

          <div>
            <h3 className="mb-4">Spacing Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Perimeter Gap (mm)</label>
                <input
                  type="number"
                  className="input"
                  value={spacing.perimeter_gap_mm}
                  onChange={(e) => setSpacing({ ...spacing, perimeter_gap_mm: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="label">Panel Gap (mm)</label>
                <input
                  type="number"
                  className="input"
                  value={spacing.panel_gap_mm}
                  onChange={(e) => setSpacing({ ...spacing, panel_gap_mm: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4">Material Selection</h3>
            <select
              className="input"
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
            >
              <option value="">Select a material (optional)</option>
              {materials?.data?.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} - ${material.cost_per_sqm}/m²
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={handleCalculate}
            disabled={calculateMutation.isPending}
          >
            {calculateMutation.isPending ? 'Calculating...' : 'Calculate Layout'}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="card p-6">
            <h3 className="mb-4">Layout Preview</h3>
            <PanelPreview
              dimensions={dimensions}
              spacing={spacing}
              layout={result?.layout}
            />
          </div>

          {/* Results panel */}
          {result && (
            <div className="card p-6">
              <h3 className="mb-4">Calculation Results</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Panel Size:</span>
                    <span>{result.layout.panel_width_mm.toFixed(0)} x {result.layout.panel_length_mm.toFixed(0)} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Grid:</span>
                    <span>{result.layout.panels_per_row} x {result.layout.panels_per_column}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Panels:</span>
                    <span className="font-bold">{result.layout.total_panels}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coverage:</span>
                    <span>{result.layout.total_coverage_sqm} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Efficiency:</span>
                    <span className="text-green-400">{result.layout.efficiency_percent}%</span>
                  </div>
                  {result.material && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Est. Cost:</span>
                      <span className="font-bold">${result.material.total_cost.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button className="btn btn-secondary flex-1" onClick={() => handleExport('svg')}>
                  Export SVG
                </button>
                <button className="btn btn-secondary flex-1" onClick={() => handleExport('dxf')}>
                  Export DXF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
