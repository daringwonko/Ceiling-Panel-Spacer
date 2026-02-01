import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../api/client'
import { DownloadIcon } from './icons'

const EXPORT_FORMATS = [
  { id: 'ifc', name: 'IFC', description: 'Industry Foundation Classes for BIM', extension: '.ifc' },
  { id: 'dxf', name: 'DXF', description: 'AutoCAD Drawing Exchange', extension: '.dxf' },
  { id: 'svg', name: 'SVG', description: 'Scalable Vector Graphics', extension: '.svg' },
  { id: 'json', name: 'JSON', description: 'Project Data Export', extension: '.json' },
]

export default function ExportMenu({ onExportComplete }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState('ifc')
  const [exporting, setExporting] = useState(false)

  const exportMutation = useMutation({
    mutationFn: async (format) => {
      const data = {
        dimensions: { length_mm: 5000, width_mm: 4000 },
        spacing: { perimeter_gap_mm: 200, panel_gap_mm: 50 },
      }

      switch (format) {
        case 'ifc':
          return await api.exportIfc(data)
        case 'dxf':
          return await api.exportDxf(data)
        case 'svg':
          return await api.exportSvg(data)
        case 'json':
          return await api.exportJson(data)
        default:
          throw new Error(`Unknown format: ${format}`)
      }
    },
    onSuccess: (response) => {
      const { file_url, format } = response.data
      const link = document.createElement('a')
      link.href = file_url
      link.download = `ceiling_project_${format}_${Date.now()}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      if (onExportComplete) {
        onExportComplete(response.data)
      }
    },
    onError: (error) => {
      console.error('Export failed:', error)
      alert(`Export failed: ${error.message}`)
    },
  })

  const handleExport = (format) => {
    setSelectedFormat(format)
    setExporting(true)
    exportMutation.mutate(format)
  }

  const currentFormat = EXPORT_FORMATS.find(f => f.id === selectedFormat)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline flex items-center gap-2"
        disabled={exporting}
      >
        <DownloadIcon className="w-5 h-5" />
        <span>Export</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-savage-surface border border-slate-600 rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-600">
              <h3 className="text-sm font-semibold text-savage-text">Export Format</h3>
            </div>

            <div className="p-2">
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => {
                    setSelectedFormat(format.id)
                    handleExport(format.id)
                    setIsOpen(false)
                  }}
                  disabled={exportMutation.isPending}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    selectedFormat === format.id
                      ? 'bg-savage-primary text-white'
                      : 'text-savage-text hover:bg-slate-700'
                  } ${exportMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-10 h-10 rounded bg-slate-600 flex items-center justify-center text-xs font-bold">
                    {format.name}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{format.name}</p>
                    <p className={`text-xs truncate ${selectedFormat === format.id ? 'text-white/70' : 'text-savage-text-muted'}`}>
                      {format.description}
                    </p>
                  </div>
                  <span className={`text-xs ${selectedFormat === format.id ? 'text-white/60' : 'text-slate-400'}`}>
                    {format.extension}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-3 bg-savage-dark border-t border-slate-600">
              {exportMutation.isPending ? (
                <div className="flex items-center justify-center gap-2 text-sm text-savage-text-muted">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Generating {currentFormat?.name}...</span>
                </div>
              ) : (
                <p className="text-xs text-savage-text-muted text-center">
                  Click a format to export and download
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
