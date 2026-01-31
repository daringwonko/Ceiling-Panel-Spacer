import * as React from "react"
import { cn } from "../../utils/cn"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-savage-text mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-savage-text-muted">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-savage-surface bg-savage-surface px-3 py-2 text-sm text-savage-text ring-offset-savage-dark file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-savage-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-savage-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-10",
              error && "border-savage-danger focus-visible:ring-savage-danger",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-savage-danger">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
