import React from 'react'
import {
  Box,
  IconButton,
  Tooltip,
  Slider,
  Typography,
  Paper,
  Grid,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ThreeSixty as OrbitIcon,
  ViewInAr as IsometricIcon,
  ViewCube as FrontIcon,
  ViewCarousel as TopIcon
} from '@mui/icons-material'
import use3DStore from '../stores/use3DStore'

interface ThreeDControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onOrbitMode: () => void
  onIsometricView: () => void
  onFrontView: () => void
  onTopView: () => void
  zoomSpeed: number
  onZoomSpeedChange: (speed: number) => void
}

export default function ThreeDControls({
  onZoomIn,
  onZoomOut,
  onOrbitMode,
  onIsometricView,
  onFrontView,
  onTopView,
  zoomSpeed,
  onZoomSpeedChange
}: ThreeDControlsProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('tablet'))
  const isCompact = isMobile || window.innerWidth < 800

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: '50%',
        right: 16,
        transform: 'translateY(-50%)',
        p: isCompact ? 1 : 2,
        display: 'flex',
        flexDirection: 'column',
        gap: isCompact ? 1 : 1.5,
        borderRadius: 2,
        minWidth: isCompact ? 48 : 56,
        bgcolor: 'bim-surface',
        border: '1px solid',
        borderColor: 'bim-divider',
      }}
      aria-label="3D View Controls"
    >
      {/* Zoom Controls */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Tooltip title="Zoom In" placement="left" arrow>
          <IconButton
            onClick={onZoomIn}
            size={isCompact ? 'small' : 'medium'}
            sx={{
              bgcolor: 'transparent',
              '&:hover': { bgcolor: 'bim-focus' },
              borderRadius: 1,
            }}
            aria-label="Zoom in view"
          >
            <ZoomInIcon fontSize={isCompact ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Zoom Out" placement="left" arrow>
          <IconButton
            onClick={onZoomOut}
            size={isCompact ? 'small' : 'medium'}
            sx={{
              bgcolor: 'transparent',
              '&:hover': { bgcolor: 'bim-focus' },
              borderRadius: 1,
            }}
            aria-label="Zoom out view"
          >
            <ZoomOutIcon fontSize={isCompact ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="horizontal" />

      {/* View Orientation Controls */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Tooltip title="Orbit Mode" placement="left" arrow>
          <IconButton
            onClick={onOrbitMode}
            size={isCompact ? 'small' : 'medium'}
            sx={{
              bgcolor: 'transparent',
              '&:hover': { bgcolor: 'bim-focus' },
              borderRadius: 1,
            }}
            aria-label="Toggle orbit mode"
          >
            <OrbitIcon fontSize={isCompact ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Isometric View" placement="left" arrow>
          <IconButton
            onClick={onIsometricView}
            size={isCompact ? 'small' : 'medium'}
            sx={{
              bgcolor: 'transparent',
              '&:hover': { bgcolor: 'bim-focus' },
              borderRadius: 1,
            }}
            aria-label="View in isometric projection"
          >
            <IsometricIcon fontSize={isCompact ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>

        {!isCompact && (
          <>
            <Tooltip title="Front View" placement="left" arrow>
              <IconButton
                onClick={onFrontView}
                size="small"
                sx={{
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: 'bim-focus' },
                  borderRadius: 1,
                }}
                aria-label="View from front"
              >
                <FrontIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Top View" placement="left" arrow>
              <IconButton
                onClick={onTopView}
                size="small"
                sx={{
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: 'bim-focus' },
                  borderRadius: 1,
                }}
                aria-label="View from top"
              >
                <TopIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Zoom Speed Control - Hidden on mobile */}
      {!isMobile && (
        <>
          <Divider orientation="horizontal" />
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              Zoom Speed
            </Typography>
            <Slider
              value={zoomSpeed}
              onChange={(_, value) => onZoomSpeedChange(value as number)}
              min={0.1}
              max={2.0}
              step={0.1}
              size="small"
              sx={{
                transform: 'rotate(-90deg) scaleX(0.7) scaleY(1.2)',
                transformOrigin: 'center',
                mt: 2,
                height: 6,
                '& .MuiSlider-thumb': { width: 12, height: 12 },
              }}
              aria-label="Zoom speed control"
            />
          </Box>
        </>
      )}
    </Paper>
  )
}