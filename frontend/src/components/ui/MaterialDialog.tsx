import * as React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import { bimTheme } from '../../themes/bimTheme'

export interface MaterialDialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  actions?: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
  fullWidth?: boolean
  showCloseButton?: boolean
}

const MaterialDialog = React.forwardRef<HTMLDivElement, MaterialDialogProps>(
  ({ open, onClose, title, children, actions, maxWidth = 'sm', fullWidth = true, showCloseButton = true }, ref) => {
    return (
      <Dialog
        ref={ref}
        open={open}
        onClose={onClose}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
        PaperProps={{
          sx: {
            borderRadius: 8,
            minWidth: 300,
          },
        }}
      >
        {(title || showCloseButton) && (
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: `1px solid ${bimTheme.palette.divider}`,
              '& .MuiTypography-h6': {
                fontSize: '1.125rem',
                fontWeight: 600,
              },
            }}
          >
            {title}
            {showCloseButton && (
              <IconButton
                onClick={onClose}
                size="small"
                sx={{
                  color: bimTheme.palette.text.secondary,
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>
        )}
        <DialogContent sx={{ padding: '24px' }}>
          {children}
        </DialogContent>
        {actions && (
          <DialogActions
            sx={{
              padding: '16px 24px',
              borderTop: `1px solid ${bimTheme.palette.divider}`,
            }}
          >
            {actions}
          </DialogActions>
        )}
      </Dialog>
    )
  }
)

MaterialDialog.displayName = 'MaterialDialog'

export { MaterialDialog }
