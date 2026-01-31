import React from 'react'
import { Plus, Save, Download } from 'lucide-react'
import { Button } from '../ui/Button'

interface QuickActionsProps {
  onNewProject?: () => void
  onSave?: () => void
  onExport?: () => void
  projectModified?: boolean
}

export default function QuickActions({
  onNewProject,
  onSave,
  onExport,
  projectModified = false
}: QuickActionsProps) {
  return (
    <div className="p-4 border-t border-slate-700 space-y-2">
      <h3 className="text-sm font-semibold text-savage-text-muted mb-3">Quick Actions</h3>
      
      <Button
        onClick={onNewProject}
        className="w-full flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span>New Project</span>
      </Button>
      
      <Button
        variant="secondary"
        onClick={onSave}
        className={`w-full flex items-center gap-2 ${projectModified ? 'border-savage-accent' : ''}`}
      >
        <Save className="w-4 h-4" />
        <span>Save Project</span>
        {projectModified && <span className="w-2 h-2 bg-savage-accent rounded-full ml-auto" />}
      </Button>
      
      <Button
        variant="outline"
        onClick={onExport}
        className="w-full flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </Button>
    </div>
  )
}
