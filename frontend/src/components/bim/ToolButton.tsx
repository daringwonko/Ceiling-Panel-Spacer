import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "../../utils/cn"
import { Button } from "../ui/Button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/Tooltip"

interface ToolButtonProps {
  icon: LucideIcon
  label: string
  active?: boolean
  onClick?: () => void
  tooltip?: string
  shortcut?: string
  disabled?: boolean
}

const ToolButton = React.forwardRef<HTMLButtonElement, ToolButtonProps>(
  ({ icon: Icon, label, active = false, onClick, tooltip, shortcut, disabled }, ref) => {
    const button = (
      <Button
        ref={ref}
        variant={active ? "default" : "secondary"}
        size="icon"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "w-9 h-9 p-0 relative",
          active && "ring-2 ring-savage-accent"
        )}
        aria-label={label}
      >
        <Icon className="w-5 h-5" />
      </Button>
    )

    if (tooltip) {
      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4}>
              <div className="flex flex-col items-center gap-1">
                <span>{tooltip}</span>
                {shortcut && (
                  <span className="text-xs text-savage-text-muted">
                    {shortcut}
                  </span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return button
  }
)
ToolButton.displayName = "ToolButton"

export { ToolButton }
