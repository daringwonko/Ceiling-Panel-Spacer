import * as React from 'react'
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material'
import { bimTheme } from '../../themes/bimTheme'

export interface MaterialButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'contained' | 'outlined' | 'text'
  size?: 'small' | 'medium' | 'large'
 BIMstyle?: 'primary' | 'secondary' | 'danger' | 'success'
}

const MaterialButton = React.forwardRef<HTMLButtonElement, MaterialButtonProps>(
  ({ variant = 'contained', size = 'medium', BIMstyle = 'primary', children, ...props }, ref) => {
    const getColor = () => {
      switch (BIMstyle) {
        case 'secondary': return 'secondary'
        case 'danger': return 'error'
        case 'success': return 'success'
        default: return 'primary'
      }
    }

    return (
      <MuiButton
        ref={ref}
        variant={variant}
        size={size}
        color={getColor()}
        {...props}
      >
        {children}
      </MuiButton>
    )
  }
)

MaterialButton.displayName = 'MaterialButton'

export { MaterialButton }
