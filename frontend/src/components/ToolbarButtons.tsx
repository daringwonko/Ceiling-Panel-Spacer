import React from 'react'
import { Box, IconButton, Tooltip, Divider } from '@mui/material'
import UndoIcon from '@mui/icons-material/Undo'
import RedoIcon from '@mui/icons-material/Redo'
import SaveIcon from '@mui/icons-material/Save'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useDesignStore } from '../store/useDesignStore'

export const ToolbarButtons: React.FC = () => {
  const undo = useDesignStore(state => state.undo)
  const redo = useDesignStore(state => state.redo)
  const canUndo = useDesignStore(state => state.canUndo())
  const canRedo = useDesignStore(state => state.canRedo())
  const currentDesign = useDesignStore(state => state.currentDesign)

  const handleUndo = () => {
    if (canUndo) {
      undo()
    }
  }

  const handleRedo = () => {
    if (canRedo) {
      redo()
    }
  }

  const handleSave = () => {
    // In production, this would save to backend
    console.log('Saving design:', currentDesign)
    alert('Design saved successfully!')
  }

  const handleExport = () => {
    // In production, this would open export dialog
    console.log('Exporting design:', currentDesign)
    alert('Export functionality would open here')
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      padding: '8px 16px',
      backgroundColor: 'rgba(30, 30, 50, 0.8)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <Tooltip title="Undo (Ctrl+Z)" arrow>
        <span>
          <IconButton
            onClick={handleUndo}
            disabled={!canUndo}
            size="small"
            sx={{
              color: canUndo ? '#aaa' : '#444',
              '&:hover': canUndo ? { backgroundColor: 'rgba(255,255,255,0.1)' } : {},
              '&.Mui-disabled': {
                color: '#333'
              }
            }}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Redo (Ctrl+Y)" arrow>
        <span>
          <IconButton
            onClick={handleRedo}
            disabled={!canRedo}
            size="small"
            sx={{
              color: canRedo ? '#aaa' : '#444',
              '&:hover': canRedo ? { backgroundColor: 'rgba(255,255,255,0.1)' } : {},
              '&.Mui-disabled': {
                color: '#333'
              }
            }}
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      <Tooltip title="Save Design" arrow>
        <IconButton
          onClick={handleSave}
          size="small"
          sx={{
            color: '#aaa',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <SaveIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Export Design" arrow>
        <IconButton
          onClick={handleExport}
          size="small"
          sx={{
            color: '#aaa',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  )
}
