import React, { useState, useRef, useEffect } from 'react'
import { Download, FileText, Image, Code, Box } from 'lucide-react'
import { useBIMStore } from '../../stores/useBIMStore'
import { bimClient } from '../../api/bimClient'

const EXPORT_FORMATS = [
  { id: 'ifc', name: 'IFC Export', extension: '.ifc', icon: Box, description: 'Industry Foundation Classes (BIM)' },
  { id: 'dxf', name: 'DXF Export', extension: '.dxf', icon: FileText, description: 'AutoCAD Drawing Exchange' },
  { id: 'svg', name: 'SVG Export', extension: '.svg', icon: Image, description: 'Scalable Vector Graphics' },
  { id: 'json', name: 'JSON Export', extension: '.json', icon: Code, description: 'Project Data (JSON)' },
]

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function ExportMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { project } = useBIMStore()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = async (formatId: string) => {
    const format = EXPORT_FORMATS.find(f => f.id === formatId)
    if (!format) return

    setExporting(formatId)
    setIsOpen(false)

    try {
      const projectId = project?.id || 'default'

      if (formatId === 'json') {
        const response = await bimClient.exportJSON(projectId)
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
        downloadBlob(blob, `project-${Date.now()}${format.extension}`)
      } else if (formatId === 'svg') {
        const response = await bimClient.exportSVG(projectId)
        const blob = new Blob([response.data], { type: 'image/svg+xml' })
        downloadBlob(blob, `ceiling-${Date.now()}${format.extension}`)
      } else if (formatId === 'dxf') {
        const response = await bimClient.exportDXF(projectId)
        downloadBlob(response.data, `ceiling-${Date.now()}${format.extension}`)
      } else if (formatId === 'ifc') {
        const response = await bimClient.exportIFC(projectId)
        downloadBlob(response.data, `bim-project-${Date.now()}${format.extension}`)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-savage-text-muted hover:bg-savage-surface hover:text-savage-primary transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm">Export</span>
        {exporting && (
          <span className="ml-auto text-xs text-savage-primary animate-pulse">...</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 w-48 bg-savage-surface border border-slate-600 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 text-xs text-savage-text-muted border-b border-slate-600">
            Export Format
          </div>
          {EXPORT_FORMATS.map((format) => (
            <button
              key={format.id}
              onClick={() => handleExport(format.id)}
              disabled={exporting !== null}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-savage-text hover:bg-savage-dark hover:text-savage-primary transition-colors disabled:opacity-50"
            >
              <format.icon className="w-4 h-4" />
              <div className="flex-1">
                <div>{format.name}</div>
                <div className="text-xs text-savage-text-muted">{format.extension}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
