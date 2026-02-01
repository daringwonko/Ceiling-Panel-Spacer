import * as React from "react"
import { Eye, EyeOff, Trash2, Copy, MoreVertical, Box } from "lucide-react"
import { cn } from "../../utils/cn"
import { Button } from "../ui/Button"
import { formatElevation, rgbToCss } from "../../utils/levelUtils"
import type { Level, LevelStatistics } from "../../types/level"

interface LevelListItemProps {
  level: Level
  isSelected: boolean
  isCurrent: boolean
  onClick: () => void
  onToggleVisibility: () => void
  onDelete: () => void
  onCopy: () => void
  statistics: LevelStatistics
}

export function LevelListItem({
  level,
  isSelected,
  isCurrent,
  onClick,
  onToggleVisibility,
  onDelete,
  onCopy,
  statistics,
}: LevelListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors",
        isSelected && "bg-savage-primary/20 border border-savage-primary/50",
        !isSelected && "hover:bg-slate-800 border border-transparent",
        isCurrent && !isSelected && "bg-slate-800/70",
        !level.isVisible && "opacity-50"
      )}
    >
      {/* Color Indicator */}
      <div
        className="w-3 h-3 rounded-sm border border-slate-600 flex-shrink-0"
        style={{ backgroundColor: rgbToCss(level.color) }}
      />

      {/* Level Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "text-sm font-medium truncate",
            isCurrent ? "text-savage-primary" : "text-savage-text"
          )}>
            {level.name}
          </span>
          {isCurrent && (
            <span className="text-[10px] px-1.5 py-0.5 bg-savage-primary/20 text-savage-primary rounded-full">
              Current
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{formatElevation(level.elevation)}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Box className="w-3 h-3" />
            {statistics.objectCount}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6"
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility()
          }}
          title={level.isVisible ? "Hide Level" : "Show Level"}
        >
          {level.isVisible ? (
            <Eye className="w-3.5 h-3.5 text-savage-text" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6"
          onClick={(e) => {
            e.stopPropagation()
            onCopy()
          }}
          title="Copy Level"
        >
          <Copy className="w-3.5 h-3.5 text-slate-400" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 hover:text-red-400"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          title="Delete Level"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
