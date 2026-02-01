import React from 'react'
import { Box, ToggleButton, ToggleButtonGroup, Typography, Tooltip } from '@mui/material'
import Grid4x4Icon from '@mui/icons-material/Grid4x4'
import { useDesignStore } from '../store/useDesignStore'

export const GridSnappingControls: React.FC = () => {
  const gridSnapEnabled = useDesignStore(state => state.gridSnapEnabled)
  const gridSnapSize = useDesignStore(state => state.gridSnapSize)
  const setGridSnapEnabled = useDesignStore(state => state.setGridSnapEnabled)
  const setGridSnapSize = useDesignStore(state => state.setGridSnapSize)

  const handleFormatChange = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: number | null
  ) => {
    if (newAlignment !== null) {
      setGridSnapSize(newAlignment)
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Grid4x4Icon sx={{ color: gridSnapEnabled ? '#4CAF50' : '#666', fontSize: 18 }} />
        <Typography variant="body2" sx={{ color: '#aaa', fontSize: '12px' }}>
          Grid Snap
        </Typography>
      </Box>

      <ToggleButton
        value="enable"
        selected={gridSnapEnabled}
        onChange={() => setGridSnapEnabled(!gridSnapEnabled)}
        size="small"
        sx={{
          color: '#aaa',
          border: '1px solid #444',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '11px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            color: '#4CAF50',
            borderColor: '#4CAF50',
            '&:hover': {
              backgroundColor: 'rgba(76, 175, 80, 0.3)'
            }
          },
          '&:hover': {
            borderColor: '#666'
          }
        }}
      >
        {gridSnapEnabled ? 'ON' : 'OFF'}
      </ToggleButton>

      <ToggleButtonGroup
        value={gridSnapEnabled ? gridSnapSize : null}
        exclusive
        onChange={handleFormatChange}
        disabled={!gridSnapEnabled}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            color: '#888',
            border: '1px solid #444',
            borderRadius: '4px',
            padding: '4px 12px',
            fontSize: '11px',
            '&.Mui-selected': {
              backgroundColor: 'rgba(33, 150, 243, 0.2)',
              color: '#2196F3',
              borderColor: '#2196F3',
              '&:hover': {
                backgroundColor: 'rgba(33, 150, 243, 0.3)'
              }
            },
            '&:hover': {
              borderColor: '#666'
            }
          }
        }}
      >
        <Tooltip title="600mm grid spacing" arrow>
          <ToggleButton value={600}>600mm</ToggleButton>
        </Tooltip>
        <Tooltip title="1200mm grid spacing" arrow>
          <ToggleButton value={1200}>1200mm</ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>

      <Typography variant="caption" sx={{ color: '#666', fontSize: '10px' }}>
        {gridSnapEnabled ? `Snapping to ${gridSnapSize}mm increments` : 'Free placement'}
      </Typography>
    </Box>
  )
}
