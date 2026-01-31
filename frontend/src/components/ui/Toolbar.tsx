import * as React from "react"
import { cn } from "../../utils/cn"

const Toolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-row items-center gap-1 p-1 bg-savage-surface border-b border-savage-surface",
      className
    )}
    {...props}
  />
))
Toolbar.displayName = "Toolbar"

export { Toolbar }
