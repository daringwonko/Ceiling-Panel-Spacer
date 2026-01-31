import * as React from "react"
import { Eye, EyeOff, Lock, Unlock } from "lucide-react"
import { cn } from "../../utils/cn"
import { Button } from "../ui/Button"

interface LayerListItemProps {
  name: string
  visible: boolean
  color?: string
  locked?: boolean
  onToggleVisibility: () => void
  onToggleLock?: () => void
  onClick?: () => void
  className?: string
}

const LayerListItem = React.forwardRef<HTMLDivElement, LayerListItemProps>(
  ({ name, visible, color = "#3b82f6", locked = false, onToggleVisibility, onToggleLock, onClick, className }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors cursor-pointer group",
          "hover:bg-savage-surface/50",
          className
        )}
      >
        {/* Color Swatch */}
        <div
          className="w-4 h-4 rounded-sm border border-savage-surface flex-shrink-0"
          style={{ backgroundColor: color }}
        />

        {/* Layer Name */}
        <span className={cn(
          "flex-1 text-sm truncate",
          visible ? "text-savage-text" : "text-savage-text-muted"
        )}>
          {name}
        </span>

        {/* Visibility Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility()
          }}
        >
          {visible ? (
            <Eye className="w-4 h-4 text-savage-text" />
          ) : (
            <EyeOff className="w-4 h-4 text-savage-text-muted" />
          )}
        </Button>

        {/* Lock Toggle */}
        {onToggleLock && (
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onToggleLock()
            }}
          >
            {locked ? (
              <Lock className="w-4 h-4 text-savage-danger" />
            ) : (
              <Unlock className="w-4 h-4 text-savage-text-muted" />
            )}
          </Button>
        )}
      </div>
    )
  }
)
LayerListItem.displayName = "LayerListItem"

export { LayerListItem }
