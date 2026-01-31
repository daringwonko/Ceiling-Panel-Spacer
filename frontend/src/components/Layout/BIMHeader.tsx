import React from 'react'
import { Undo, Redo, LayoutGrid, Box, Eye, ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { Button } from '../ui/Button'
import { Separator } from '../ui/Separator'

interface BIMHeaderProps {
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  viewMode: 'perspective' | 'top' | 'front' | 'side' | 'iso'
  onViewModeChange?: (mode: string) => void
  projectName?: string
}

export default function BIMHeader({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  viewMode = 'perspective',
  onViewModeChange,
  projectName = 'Untitled Project'
}: BIMHeaderProps) {
  return (
    <header className="h-14 bg-savage-surface border-b border-slate-700 flex items-center justify-between px-4">
      {/* Left: Project Info */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-savage-text">{projectName}</h1>
        <Separator orientation="vertical" className="h-6" />
        
        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
            className="w-8 h-8"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            className="w-8 h-8"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Center: View Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'perspective' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange?.('perspective')}
        >
          <Eye className="w-4 h-4 mr-2" />
          Perspective
        </Button>
        <Button
          variant={viewMode === 'top' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange?.('top')}
        >
          <LayoutGrid className="w-4 h-4 mr-2" />
          Top
        </Button>
        <Button
          variant={viewMode === 'front' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange?.('front')}
        >
          <Box className="w-4 h-4 mr-2" />
          Front
        </Button>
      </div>

      {/* Right: Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm text-savage-text-muted w-16 text-center">100%</span>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Maximize className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
