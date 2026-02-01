import * as React from 'react'
import Slider from '@mui/material/Slider'
import { bimTheme } from '../../themes/bimTheme'

export interface MaterialSliderProps {
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onChange?: (event: Event, value: number | number[]) => void
  label?: string
  showValue?: boolean
}

const MaterialSlider = React.forwardRef<HTMLDivElement, MaterialSliderProps>(
  ({ value, defaultValue = 50, min = 0, max = 100, step = 1, disabled = false, onChange, label, showValue = false }, ref) => {
    const [localValue, setLocalValue] = React.useState(defaultValue)

    const handleChange = (event: Event, newValue: number | number[]) => {
      setLocalValue(newValue as number)
      onChange?.(event, newValue)
    }

    return (
      <div ref={ref} style={{ width: '100%' }}>
        {label && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px',
            color: bimTheme.palette.text.secondary,
            fontSize: '0.875rem'
          }}>
            <span>{label}</span>
            {showValue && <span>{value ?? localValue}</span>}
          </div>
        )}
        <Slider
          value={value ?? localValue}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={handleChange}
          sx={{
            color: bimTheme.palette.primary.main,
            '& .MuiSlider-thumb': {
              height: 20,
              width: 20,
              borderRadius: 10,
            },
            '& .MuiSlider-track': {
              borderRadius: 3,
            },
            '& .MuiSlider-rail': {
              borderRadius: 3,
              opacity: 0.3,
            },
          }}
        />
      </div>
    )
  }
)

MaterialSlider.displayName = 'MaterialSlider'

export { MaterialSlider }
