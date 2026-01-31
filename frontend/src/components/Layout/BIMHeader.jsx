import React from 'react'

export default function BIMHeader({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  viewMode = 'perspective',
  onViewModeChange,
  projectName = 'Untitled Project'
}) {
  const viewModes = [
    { id: 'perspective', name: '3D' },
    { id: 'top', name: 'Top' },
    { id: 'front', name: 'Front' },
    { id: 'side', name: 'Side' },
    { id: 'section', name: 'Section' }
  ]

  return (
    <header className="h-12 bg-savage-surface border-b border-slate-700 flex items-center justify-between px-4">
      {/* Left: Project Info */}
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-savage-text">
          {projectName}
        </h1>
        
        {/* Undo/Redo Buttons */}
        <div className="flex items-center gap-1 border-l border-slate-700 pl-4">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded transition-colors ${
              canUndo
                ? 'hover:bg-slate-700 text-savage-text'
                : 'text-savage-text-muted cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded transition-colors ${
              canRedo
                ? 'hover:bg-slate-700 text-savage-text'
                : 'text-savage-text-muted cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 0 0-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Center: View Mode Selector */}
      <div className="flex items-center">
        <div className="flex bg-savage-dark rounded-lg p-0.5">
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onViewModeChange?.(mode.id)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === mode.id
                  ? 'bg-savage-primary text-white'
                  : 'text-savage-text-muted hover:text-savage-text'
              }`}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Project Controls */}
      <div className="flex items-center gap-3">
        <button className="p-1.5 rounded hover:bg-slate-700 text-savage-text-muted hover:text-savage-text transition-colors" title="Settings">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v6m0 6v6m4.22-10.22l4.24-4.24M6.34 17.66l-4.24 4.24M23 12h-6m-6 0H1m20.24 4.24l-4.24-4.24M6.34 6.34L2.1 2.1" />
          </svg>
        </button>
      </div>
    </header>
  )
}
