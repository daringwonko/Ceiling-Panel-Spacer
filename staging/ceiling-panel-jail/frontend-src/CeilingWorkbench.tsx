import React, { useState, useEffect, useCallback } from 'react'
import { Box, AppBar, Toolbar, Typography, Paper, Grid } from '@mui/material'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, GridHelper } from '@react-three/drei'
import CeilingPanel3D from './CeilingPanel3D'
import { ToolbarButtons } from '../components/ToolbarButtons'
import { GridSnappingControls } from '../components/GridSnappingControls'
import { MaterialSelectionDropdown } from '../components/MaterialSelectionDropdown'
import { useDesignStore, generatePanelId } from '../store/useDesignStore'
import { PREDEFINED_MATERIALS } from '../types/materials'

const CeilingWorkbench: React.FC = () => {
  const [mounted, setMounted] = useState(false)
  
  const currentDesign = useDesignStore(state => state.currentDesign)
  const setDesign = useDesignStore(state => state.setDesign)
  const selectPanel = useDesignStore(state => state.selectPanel)
  const gridSnapEnabled = useDesignStore(state => state.gridSnapEnabled)
  const gridSnapSize = useDesignStore(state => state.gridSnapSize)
  const snapToGrid = useDesignStore.getState().saveToHistory

  // Initialize with a sample ceiling design
  useEffect(() => {
    if (!currentDesign) {
      const initialDesign = {
        id: 'ceiling_design_1',
        name: 'New Ceiling Design',
        ceilingDimensions: [4800, 3600] as [number, number], // 4.8m x 3.6m
        panels: [
          {
            id: 'panel_1',
            position: [0, 0, 0] as [number, number, number],
            dimensions: [1200, 1200, 50] as [number, number, number],
            material: 'acoustic_white',
            selected: true
          },
          {
            id: 'panel_2',
            position: [1200, 0, 0] as [number, number, number],
            dimensions: [1200, 1200, 50] as [number, number, number],
            material: 'acoustic_white',
            selected: false
          },
          {
            id: 'panel_3',
            position: [2400, 0, 0] as [number, number, number],
            dimensions: [1200, 1200, 50] as [number, number, number],
            material: 'led_panel_white',
            selected: false
          },
          {
            id: 'panel_4',
            position: [0, 1200, 0] as [number, number, number],
            dimensions: [1200, 1200, 50] as [number, number, number],
            material: 'acoustic_white',
            selected: false
          },
          {
            id: 'panel_5',
            position: [1200, 1200, 0] as [number, number, number],
            dimensions: [1200, 1200, 50] as [number, number, number],
            material: 'acoustic_white',
            selected: false
          },
          {
            id: 'panel_6',
            position: [2400, 1200, 0] as [number, number, number],
            dimensions: [1200, 1200, 50] as [number, number, number],
            material: 'acoustic_white',
            selected: false
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setDesign(initialDesign)
    }
    
    setMounted(true)
  }, [currentDesign, setDesign])

  const handlePanelClick = useCallback((panelId: string) => {
    // Deselect all panels first
    if (currentDesign) {
      currentDesign.panels.forEach(panel => {
        if (panel.selected) {
          useDesignStore.getState().saveToHistory()
        }
      })
    }
    
    // Select the clicked panel
    selectPanel(panelId)
    
    // Update panel selection state
    if (currentDesign) {
      const updatedPanels = currentDesign.panels.map(panel => ({
        ...panel,
        selected: panel.id === panelId
      }))
      
      useDesignStore.setState({
        currentDesign: {
          ...currentDesign,
          panels: updatedPanels,
          updatedAt: new Date().toISOString()
        }
      })
    }
  }, [currentDesign, selectPanel])

  const handleCanvasClick = useCallback(() => {
    // Deselect when clicking on empty area
    selectPanel(null)
  }, [selectPanel])

  if (!mounted || !currentDesign) {
    return null
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top AppBar */}
      <AppBar position="static" sx={{ backgroundColor: '#16213e', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Ceiling Panel Designer
          </Typography>
          <ToolbarButtons />
        </Toolbar>
      </AppBar>

      {/* Main content area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left sidebar */}
        <Paper sx={{ 
          width: 280, 
          p: 2, 
          backgroundColor: '#16213e',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          overflow: 'auto'
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Properties
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                Selected Panel
              </Typography>
              <MaterialSelectionDropdown />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: '#888', mb: 1, mt: 2 }}>
                Grid Snapping
              </Typography>
              <GridSnappingControls />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: '#888', mb: 1, mt: 2 }}>
                Design Info
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '12px' }}>
                Ceiling: {currentDesign.ceilingDimensions[0]}mm × {currentDesign.ceilingDimensions[1]}mm
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '12px', color: '#888' }}>
                Panels: {currentDesign.panels.length}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* 3D Canvas */}
        <Box sx={{ flex: 1, position: 'relative' }} onClick={handleCanvasClick}>
          <Canvas
            camera={{ position: [2400, 3000, 3000], fov: 50 }}
            shadows
            style={{ background: '#1a1a2e' }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            
            {/* Grid helper */}
            <gridHelper 
              args={[6000, 10, '#444', '#333']} 
              position={[0, -1, 0]} 
            />
            
            {/* Ceiling panels */}
            {currentDesign.panels.map(panel => (
              <CeilingPanel3D
                key={panel.id}
                panel={panel}
                onClick={() => handlePanelClick(panel.id)}
                gridSnapEnabled={gridSnapEnabled}
                gridSnapSize={gridSnapSize}
              />
            ))}
            
            <OrbitControls
              makeDefault
              enableDamping
              dampingFactor={0.05}
              minDistance={500}
              maxDistance={8000}
            />
          </Canvas>
          
          {/* Instructions overlay */}
          <Box sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#888'
          }}>
            Click on panels to select and view measurements
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default CeilingWorkbench
