import * as React from "react"
import { Folder, File, ChevronRight, ChevronDown, Eye, EyeOff } from "lucide-react"
import { cn } from "../../utils/cn"
import { Button } from "../ui/Button"

interface BIMObject {
  id: string
  name: string
  type: "folder" | "object"
  children?: BIMObject[]
  expanded?: boolean
  visible?: boolean
}

interface ObjectTreeItemProps {
  object: BIMObject
  level?: number
  onToggle?: (id: string) => void
  onSelect?: (id: string) => void
  onToggleVisibility?: (id: string) => void
  selectedIds?: string[]
  className?: string
}

const ObjectTreeItem = React.forwardRef<HTMLDivElement, ObjectTreeItemProps>(
  ({ object, level = 0, onToggle, onSelect, onToggleVisibility, selectedIds = [], className }, ref) => {
    const isSelected = selectedIds.includes(object.id)
    const hasChildren = object.children && object.children.length > 0

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggle?.(object.id)
    }

    const handleSelect = () => {
      onSelect?.(object.id)
    }

    const handleVisibilityToggle = (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggleVisibility?.(object.id)
    }

    return (
      <div ref={ref} className={className}>
        <div
          onClick={handleSelect}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-colors",
            "hover:bg-savage-surface/50",
            isSelected && "bg-savage-primary/20"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5 p-0"
              onClick={handleToggle}
            >
              {object.expanded ? (
                <ChevronDown className="w-4 h-4 text-savage-text-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-savage-text-muted" />
              )}
            </Button>
          ) : (
            <div className="w-5" />
          )}

          {/* Icon */}
          {object.type === "folder" ? (
            <Folder className="w-4 h-4 text-savage-accent flex-shrink-0" />
          ) : (
            <File className="w-4 h-4 text-savage-text-muted flex-shrink-0" />
          )}

          {/* Name */}
          <span className={cn(
            "flex-1 text-sm truncate",
            object.visible !== false ? "text-savage-text" : "text-savage-text-muted"
          )}>
            {object.name}
          </span>

          {/* Visibility Toggle */}
          {onToggleVisibility && (
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 opacity-0 hover:opacity-100 transition-opacity"
              onClick={handleVisibilityToggle}
            >
              {object.visible !== false ? (
                <Eye className="w-4 h-4 text-savage-text" />
              ) : (
                <EyeOff className="w-4 h-4 text-savage-text-muted" />
              )}
            </Button>
          )}
        </div>

        {/* Children */}
        {hasChildren && object.expanded && (
          <div>
            {object.children!.map((child) => (
              <ObjectTreeItem
                key={child.id}
                object={child}
                level={level + 1}
                onToggle={onToggle}
                onSelect={onSelect}
                onToggleVisibility={onToggleVisibility}
                selectedIds={selectedIds}
              />
            ))}
          </div>
        )}
      </div>
    )
  }
)
ObjectTreeItem.displayName = "ObjectTreeItem"

export { ObjectTreeItem }
export type { BIMObject }
