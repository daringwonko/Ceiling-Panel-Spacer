import React from 'react'
import {
  PencilIcon,
  DownloadIcon
} from './icons'

export default function QuickActions({
  onNewProject,
  onSave,
  onExport,
  projectModified = false
}) {
  return (
    <div className="p-4 border-t border-slate-700 space-y-2">
      <h3 className="text-sm font-semibold text-savage-text-muted mb-3">
        Quick Actions
      </h3>

      {/* New Project Button */}
      <button
        onClick={onNewProject}
        className="btn btn-primary w-full flex items-center gap-2 justify-center"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span>New Project</span>
      </button>

      {/* Save Button */}
      <button
        onClick={onSave}
        className={`btn btn-secondary w-full flex items-center gap-2 justify-center ${
          !projectModified && 'opacity-50'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        <span>Save Project</span>
      </button>

      {/* Export Button */}
      <button
        onClick={onExport}
        className="btn btn-outline w-full flex items-center gap-2 justify-center"
      >
        <DownloadIcon className="w-5 h-5" />
        <span>Export</span>
      </button>
    </div>
  )
}
