import React from 'react'

export default function BIMStatusBar({
  activeTool = 'Select',
  coordinates = { x: 0, y: 0, z: 0 },
  zoom = 100,
  snapEnabled = true,
  snapToGrid = false,
  snapToObjects = true
}) {
  const formatCoordinate = (value) => {
    return value.toFixed(2)
  }

  const formatZoom = (value) => {
    return `${Math.round(value * 100)}%`
  }

  return (
    <footer className="h-8 bg-savage-surface border-t border-slate-700 flex items-center justify-between px-4 text-xs">
      {/* Left: Active Tool */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-savage-text-muted">Tool:</span>
          <span className="text-savage-text font-medium">{activeTool}</span>
        </div>
        
        {/* Coordinate Display */}
        <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
          <span className="text-savage-text-muted">X:</span>
          <span className="text-savage-text font-mono w-14">{formatCoordinate(coordinates.x)}</span>
          <span className="text-savage-text-muted">Y:</span>
          <span className="text-savage-text font-mono w-14">{formatCoordinate(coordinates.y)}</span>
          <span className="text-savage-text-muted">Z:</span>
          <span className="text-savage-text font-mono w-14">{formatCoordinate(coordinates.z)}</span>
        </div>
      </div>

      {/* Center: Zoom Level */}
      <div className="flex items-center gap-2">
        <span className="text-savage-text-muted">Zoom:</span>
        <span className="text-savage-text font-mono">{formatZoom(zoom)}</span>
      </div>

      {/* Right: Snap Settings */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
          <span className="text-savage-text-muted">Snap:</span>
          <button
            className={`px-2 py-0.5 rounded transition-colors ${
              snapEnabled
                ? 'bg-savage-primary text-white'
                : 'bg-savage-dark text-savage-text-muted'
            }`}
          >
            {snapEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`${snapToGrid ? 'text-savage-primary' : 'text-savage-text-muted'}`}>
            Grid
          </span>
          <span className="text-slate-600">|</span>
          <span className={`${snapToObjects ? 'text-savage-primary' : 'text-savage-text-muted'}`}>
            Objects
          </span>
        </div>
      </div>
    </footer>
  )
}
