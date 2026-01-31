import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  IconButton,
  Slider,
  Grid,
  Divider
} from '@mui/material'
import {
  Close as CloseIcon,
  Move3d as MoveIcon,
  RotateRight as RotateIcon,
  Crop as ScaleIcon
} from '@mui/icons-material'
import use3DStore from '../stores/use3DStore'

export default function ObjectControlsCard({ geometryId }: { geometryId: string }) {
  const geometries = use3DStore((state) => state.geometries)
  const moveGeometry = use3DStore((state) => state.moveGeometry)
  const selectGeometry = use3DStore((state) => state.selectGeometry)

  const geometry = geometries.find(g => g.id === geometryId)

  if (!geometry) return null

  const handlePositionChange = (axis: 'x' | 'y' | 'z') => (
    event: Event,
    newValue: number | number[]
  ) => {
    if (typeof newValue === 'number') {
      const newPosition = { ...geometry.position, [axis]: newValue }
      moveGeometry(geometryId, newPosition)
    }
  }

  const handleClose = () => {
    selectGeometry(null)
  }

  return (
    <Card
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 300,
        maxHeight: '80vh',
        overflow: 'auto',
        zIndex: 1000,
        boxShadow: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
      role="dialog"
      aria-labelledby="object-controls-title"
      aria-describedby="object-controls-description"
    >
      <CardHeader
        title={
          <Typography variant="h6" id="object-controls-title">
            {`${geometry.type.charAt(0).toUpperCase() + geometry.type.slice(1)} Properties`}
          </Typography>
        }
        action={
          <IconButton onClick={handleClose} aria-label="Close controls" size="small">
            <CloseIcon />
          </IconButton>
        }
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      />
      <CardContent sx={{ p: 0 }}>
        {/* Position Controls */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <MoveIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              Position
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                X: {geometry.position.x.toFixed(1)}
              </Typography>
              <Slider
                value={geometry.position.x}
                onChange={handlePositionChange('x')}
                min={-10}
                max={10}
                step={0.1}
                sx={{
                  '& .MuiSlider-thumb': {
                    height: 20,
                    width: 20,
                  },
                }}
                aria-label="X position"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Y: {geometry.position.y.toFixed(1)}
              </Typography>
              <Slider
                value={geometry.position.y}
                onChange={handlePositionChange('y')}
                min={-10}
                max={10}
                step={0.1}
                sx={{
                  '& .MuiSlider-thumb': {
                    height: 20,
                    width: 20,
                  },
                }}
                aria-label="Y position"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Z: {geometry.position.z.toFixed(1)}
              </Typography>
              <Slider
                value={geometry.position.z}
                onChange={handlePositionChange('z')}
                min={-10}
                max={10}
                step={0.1}
                sx={{
                  '& .MuiSlider-thumb': {
                    height: 20,
                    width: 20,
                  },
                }}
                aria-label="Z position"
                size="small"
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Scale Controls */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ScaleIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              Scale
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Width: {geometry.scale.x.toFixed(1)}
              </Typography>
              <Slider
                value={geometry.scale.x}
                onChange={(e, value) => {/* TODO: Implement scaling */}}
                min={0.1}
                max={5}
                step={0.1}
                aria-label="Scale X"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Height: {geometry.scale.y.toFixed(1)}
              </Typography>
              <Slider
                value={geometry.scale.y}
                onChange={(e, value) => {/* TODO: Implement scaling */}}
                min={0.1}
                max={5}
                step={0.1}
                aria-label="Scale Y"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Depth: {geometry.scale.z.toFixed(1)}
              </Typography>
              <Slider
                value={geometry.scale.z}
                onChange={(e, value) => {/* TODO: Implement scaling */}}
                min={0.1}
                max={5}
                step={0.1}
                aria-label="Scale Z"
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  )
}