import React from 'react'
import {
  Box,
  TextField,
  InputAdornment,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Straighten as MeasureIcon,
  SettingsEthernet as GridIcon
} from '@mui/icons-material'

interface MeasurementInputsProps {
  measurements: {
    width: number
    length: number
    edgeGap: number
    spacingGap: number
  }
  onMeasurementChange: (field: string, value: number) => void
  errors: Record<string, string>
}

export default function MeasurementInputs({
  measurements,
  onMeasurementChange,
  errors
}: MeasurementInputsProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'))

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0
    onMeasurementChange(field, value)
  }

  const FieldWrapper = ({ children, label }: { children: React.ReactNode; label: string }) => (
    <Box>
      {label && (
        <Box component="label" sx={{ display: 'block', mb: 1, fontSize: '0.875rem', fontWeight: 500 }}>
          {label}
        </Box>
      )}
      {children}
    </Box>
  )

  if (isMobile) {
    // Mobile stacked layout
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FieldWrapper label="Ceiling Width">
          <TextField
            fullWidth
            type="number"
            value={measurements.width}
            onChange={handleChange('width')}
            error={!!errors.width}
            helperText={errors.width}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
            inputProps={{
              'aria-label': 'Ceiling width in meters',
              min: 0.1,
              step: 0.1
            }}
            size="small"
          />
        </FieldWrapper>

        <FieldWrapper label="Ceiling Length">
          <TextField
            fullWidth
            type="number"
            value={measurements.length}
            onChange={handleChange('length')}
            error={!!errors.length}
            helperText={errors.length}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
            inputProps={{
              'aria-label': 'Ceiling length in meters',
              min: 0.1,
              step: 0.1
            }}
            size="small"
          />
        </FieldWrapper>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <FieldWrapper label="Edge Gap">
            <TextField
              fullWidth
              type="number"
              value={measurements.edgeGap}
              onChange={handleChange('edgeGap')}
              error={!!errors.edgeGap}
              helperText={errors.edgeGap}
              InputProps={{
                endAdornment: <InputAdornment position="end">m</InputAdornment>,
              }}
              inputProps={{
                'aria-label': 'Edge gap distance in meters',
                min: 0,
                step: 0.01
              }}
              size="small"
            />
          </FieldWrapper>

          <FieldWrapper label="Spacing">
            <TextField
              fullWidth
              type="number"
              value={measurements.spacingGap}
              onChange={handleChange('spacingGap')}
              error={!!errors.spacingGap}
              helperText={errors.spacingGap}
              InputProps={{
                endAdornment: <InputAdornment position="end">m</InputAdornment>,
              }}
              inputProps={{
                'aria-label': 'Spacing gap between panels in meters',
                min: 0,
                step: 0.001
              }}
              size="small"
            />
          </FieldWrapper>
        </Box>
      </Box>
    )
  }

  // Desktop layout
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Width"
            type="number"
            value={measurements.width}
            onChange={handleChange('width')}
            error={!!errors.width}
            helperText={errors.width}
            InputProps={{
              startAdornment: <InputAdornment position="start"><MeasureIcon /></InputAdornment>,
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
            inputProps={{
              'aria-label': 'Ceiling width in meters',
              min: 0.1,
              step: 0.1
            }}
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Length"
            type="number"
            value={measurements.length}
            onChange={handleChange('length')}
            error={!!errors.length}
            helperText={errors.length}
            InputProps={{
              startAdornment: <InputAdornment position="start"><MeasureIcon /></InputAdornment>,
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
            inputProps={{
              'aria-label': 'Ceiling length in meters',
              min: 0.1,
              step: 0.1
            }}
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Edge Gap"
            type="number"
            value={measurements.edgeGap}
            onChange={handleChange('edgeGap')}
            error={!!errors.edgeGap}
            helperText={errors.edgeGap}
            InputProps={{
              startAdornment: <InputAdornment position="start"><GridIcon /></InputAdornment>,
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
            inputProps={{
              'aria-label': 'Edge gap distance in meters',
              min: 0,
              step: 0.01
            }}
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Spacing Gap"
            type="number"
            value={measurements.spacingGap}
            onChange={handleChange('spacingGap')}
            error={!!errors.spacingGap}
            helperText={errors.spacingGap}
            InputProps={{
              startAdornment: <InputAdornment position="start"><GridIcon /></InputAdornment>,
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
            inputProps={{
              'aria-label': 'Spacing gap between panels in meters',
              min: 0,
              step: 0.001
            }}
            size="small"
          />
        </Grid>
      </Grid>
    </Box>
  )
}