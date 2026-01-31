import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { Assessment as MeasureIcon } from '@mui/icons-material'

interface MeasurementDialogProps {
  open: boolean
  onClose: () => void
  onSave: (measurements: {
    width: number
    length: number
    edgeGap: number
    spacingGap: number
  }) => void
}

export default function MeasurementDialog({
  open,
  onClose,
  onSave
}: MeasurementDialogProps) {
  const [measurements, setMeasurements] = React.useState({
    width: 4.8,
    length: 3.6,
    edgeGap: 0.2,
    spacingGap: 0.05
  })

  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0
    setMeasurements(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Basic validation
    if (value <= 0) {
      setErrors(prev => ({ ...prev, [field]: 'Must be greater than 0' }))
    }
  }

  const handleSave = () => {
    // Final validation
    const newErrors: Record<string, string> = {}
    if (measurements.width <= 0) newErrors.width = 'Width must be greater than 0'
    if (measurements.length <= 0) newErrors.length = 'Length must be greater than 0'
    if (measurements.edgeGap < 0) newErrors.edgeGap = 'Edge gap cannot be negative'
    if (measurements.spacingGap < 0) newErrors.spacingGap = 'Spacing gap cannot be negative'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onSave(measurements)
      onClose()
    }
  }

  const handleCancel = () => {
    setMeasurements({
      width: 4.8,
      length: 3.6,
      edgeGap: 0.2,
      spacingGap: 0.05
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      aria-labelledby="measurement-dialog-title"
      aria-describedby="measurement-dialog-description"
    >
      <DialogTitle
        id="measurement-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          px: 3,
          py: 2
        }}
      >
        <MeasureIcon sx={{ mr: 1 }} />
        Ceiling Measurements
      </DialogTitle>
      <DialogContent
        sx={{ px: 3, py: 2 }}
        id="measurement-dialog-description"
      >
        <DialogContentText sx={{ mb: 3 }}>
          Enter ceiling dimensions and panel spacing parameters for calculation.
          All measurements are in meters.
        </DialogContentText>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Ceiling Width (m)"
              type="number"
              value={measurements.width}
              onChange={handleChange('width')}
              error={!!errors.width}
              helperText={errors.width}
              inputProps={{
                'aria-label': 'Ceiling width in meters',
                min: 0.1,
                step: 0.1
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Ceiling Length (m)"
              type="number"
              value={measurements.length}
              onChange={handleChange('length')}
              error={!!errors.length}
              helperText={errors.length}
              inputProps={{
                'aria-label': 'Ceiling length in meters',
                min: 0.1,
                step: 0.1
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Edge Gap (m)"
              type="number"
              value={measurements.edgeGap}
              onChange={handleChange('edgeGap')}
              error={!!errors.edgeGap}
              helperText={errors.edgeGap}
              inputProps={{
                'aria-label': 'Edge gap distance in meters',
                min: 0,
                step: 0.01
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Spacing Gap (m)"
              type="number"
              value={measurements.spacingGap}
              onChange={handleChange('spacingGap')}
              error={!!errors.spacingGap}
              helperText={errors.spacingGap}
              inputProps={{
                'aria-label': 'Spacing gap between panels in meters',
                min: 0,
                step: 0.001
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Calculated Area:</strong> {(measurements.width * measurements.length).toFixed(2)} m²
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleCancel}
          variant="outlined"
          sx={{ borderRadius: 1 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{ borderRadius: 1 }}
          disabled={Object.keys(errors).length > 0}
        >
          Apply Measurements
        </Button>
      </DialogActions>
    </Dialog>
  )
}