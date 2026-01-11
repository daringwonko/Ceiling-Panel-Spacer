import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../api/client'

export default function Exports() {
  const [dimensions, setDimensions] = useState({
    length_mm: 5000,
    width_mm: 4000,
  })

  const [spacing, setSpacing] = useState({
    perimeter_gap_mm: 200,
    panel_gap_mm: 50,
  })

  const [selectedFormat, setSelectedFormat] = useState('svg')
  const [exports, setExports] = useState([])

  const exportMutation = useMutation({
    mutationFn: async (format) => {
      if (format === 'svg') {
        return api.exportSvg({ dimensions, spacing })
      } else if (format === 'dxf') {
        return api.exportDxf({ dimensions, spacing })
      } else {
        return api.export3d({ dimensions, spacing, format })
      }
    },
    onSuccess: (data) => {
      setExports((prev) => [data.data, ...prev])
      toast.success(`${selectedFormat.toUpperCase()} export ready!`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleExport = () => {
    exportMutation.mutate(selectedFormat)
  }

  const formatOptions = [
    { value: 'svg', label: 'SVG', description: 'Vector graphics for web/print' },
    { value: 'dxf', label: 'DXF', description: 'CAD file for AutoCAD/Revit' },
    { value: 'obj', label: 'OBJ', description: '3D model (Wavefront)' },
    { value: 'stl', label: 'STL', description: '3D model for printing' },
    { value: 'gltf', label: 'GLTF', description: '3D model for web/AR/VR' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Export Center</h1>
          <p className="text-slate-400 mt-1">Generate and download layout files</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export form */}
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="mb-4">Dimensions</h3>
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
          </div>

          <div>
            <h3 className="mb-4">Spacing</h3>
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
            <h3 className="mb-4">Export Format</h3>
            <div className="grid grid-cols-1 gap-2">
              {formatOptions.map((format) => (
                <label
                  key={format.value}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedFormat === format.value
                      ? 'bg-primary-600/20 border border-primary-500'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={selectedFormat === format.value}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="sr-only"
                  />
                  <div className="w-12 h-8 rounded bg-slate-600 flex items-center justify-center text-xs font-bold">
                    {format.label}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{format.label}</p>
                    <p className="text-slate-400 text-sm">{format.description}</p>
                  </div>
                  {selectedFormat === format.value && (
                    <svg className="w-5 h-5 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? 'Generating...' : `Export as ${selectedFormat.toUpperCase()}`}
          </button>
        </div>

        {/* Recent exports */}
        <div className="card p-6">
          <h3 className="mb-4">Recent Exports</h3>
          {exports.length > 0 ? (
            <div className="space-y-3">
              {exports.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-600 flex items-center justify-center text-xs font-bold">
                      {exp.format.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{exp.id}</p>
                      <p className="text-slate-400 text-sm">
                        {(exp.file_size_bytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <a
                    href={exp.file_url}
                    download
                    className="btn btn-secondary text-sm"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <p>No exports yet</p>
              <p className="text-sm mt-1">Generate an export to see it here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
