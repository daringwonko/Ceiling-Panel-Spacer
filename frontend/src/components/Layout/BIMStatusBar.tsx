import React from 'react'
import { MousePointer2, Grid3X3, Magnet, Crosshair } from 'lucide-react'

interface BIMStatusBarProps {
  snapEnabled?: boolean
  gridEnabled?: boolean
  cursorPosition?: { x: number; y: number; z?: number }
  selectedCount?: number
  objectCount?: number
  // Alternative prop names used by BIMLayout
  activeTool?: string
  coordinates?: { x: number; y: number; z?: number }
  zoom?: number
  snapToGrid?: boolean
  snapToObjects?: boolean
}

export default function BIMStatusBar({
  snapEnabled = true,
  gridEnabled = true,
  cursorPosition,
  selectedCount = 0,
  objectCount = 0,
  activeTool = 'Select',
  coordinates,
  snapToGrid = false,
  snapToObjects = true
}: BIMStatusBarProps) {
  // Use coordinates if cursorPosition is not provided
  const position = cursorPosition || coordinates || { x: 0, y: 0, z: 0 }
  return (
    <footer className="h-8 bg-savage-surface border-t border-slate-700 flex items-center justify-between px-4 text-xs">
      {/* Left: Status Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-savage-text-muted">
          <MousePointer2 className="w-3 h-3" />
          <span>{activeTool}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-savage-text-muted">Selected:</span>
          <span className="text-savage-text font-medium">{selectedCount}</span>
          <span className="text-savage-text-muted">Objects:</span>
          <span className="text-savage-text font-medium">{objectCount}</span>
        </div>
      </div>

      {/* Center: Cursor Position */}
      <div className="flex items-center gap-2 font-mono text-savage-text-muted">
        <Crosshair className="w-3 h-3" />
        <span>X: {position.x.toFixed(2)}</span>
        <span>Y: {position.y.toFixed(2)}</span>
        <span>Z: {(position.z || 0).toFixed(2)}</span>
      </div>

      {/* Right: Toggle States */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-1 ${(snapEnabled || snapToObjects) ? 'text-savage-success' : 'text-savage-text-muted'}`}>
          <Magnet className="w-3 h-3" />
          <span>Snap</span>
        </div>
        <div className={`flex items-center gap-1 ${(gridEnabled || snapToGrid) ? 'text-savage-success' : 'text-savage-text-muted'}`}>
          <Grid3X3 className="w-3 h-3" />
          <span>Grid</span>
        </div>
      </div>
    </footer>
  )
}
