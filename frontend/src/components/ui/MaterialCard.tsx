import * as React from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import { bimTheme } from '../../themes/bimTheme'

export interface MaterialCardProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
  variant?: 'elevation' | 'outlined'
  elevation?: number
}

const MaterialCard = React.forwardRef<HTMLDivElement, MaterialCardProps>(
  ({ title, subtitle, children, actions, variant = 'elevation', elevation = 1 }, ref) => {
    return (
      <Card
        ref={ref}
        variant={variant}
        elevation={elevation}
        sx={{
          borderRadius: 8,
          border: variant === 'outlined' ? `1px solid ${bimTheme.palette.divider}` : 'none',
          boxShadow: variant === 'elevation' 
            ? '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12)'
            : 'none',
        }}
      >
        {(title || subtitle) && (
          <CardHeader
            title={title}
            subheader={subtitle}
            sx={{
              '& .MuiCardHeader-title': {
                fontSize: '1.125rem',
                fontWeight: 600,
                color: bimTheme.palette.text.primary,
              },
              '& .MuiCardHeader-subheader': {
                fontSize: '0.875rem',
                color: bimTheme.palette.text.secondary,
              },
            }}
          />
        )}
        <CardContent sx={{ padding: '16px' }}>
          {children}
        </CardContent>
        {actions && (
          <CardActions sx={{ padding: '8px 16px', borderTop: `1px solid ${bimTheme.palette.divider}` }}>
            {actions}
          </CardActions>
        )}
      </Card>
    )
  }
)

MaterialCard.displayName = 'MaterialCard'

export { MaterialCard }
