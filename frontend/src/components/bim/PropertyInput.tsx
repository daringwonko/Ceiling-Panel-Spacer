import * as React from "react"
import { cn } from "../../utils/cn"
import { Input } from "../ui/Input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select"

interface PropertyInputProps {
  label: string
  value: string | number
  type?: "text" | "number" | "select"
  options?: string[]
  unit?: string
  min?: number
  max?: number
  step?: number
  onChange: (value: string) => void
  className?: string
}

const PropertyInput = React.forwardRef<HTMLInputElement, PropertyInputProps>(
  ({ label, value, type = "text", options = [], unit, min, max, step, onChange, className }, ref) => {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-savage-text-muted uppercase tracking-wide">
            {label}
          </label>
          {unit && (
            <span className="text-xs text-savage-text-muted">{unit}</span>
          )}
        </div>
        
        {type === "select" ? (
          <Select value={String(value)} onValueChange={onChange}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="relative">
            <Input
              ref={ref}
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              min={min}
              max={max}
              step={step}
              className="h-8 text-sm pr-8"
            />
            {unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-savage-text-muted pointer-events-none">
                {unit}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)
PropertyInput.displayName = "PropertyInput"

export { PropertyInput }
