import React, { useState } from 'react'
import { MaterialCard } from './MaterialCard'
import { MaterialButton } from './MaterialButton'
import { MaterialSlider } from './MaterialSlider'
import { MaterialDialog } from './MaterialDialog'
import { bimTheme } from '../../themes/bimTheme'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Grid from '@mui/material/Grid'

export interface CeilingControlPanelProps {
  // Dimensions
  width?: number
  length?: number
  onWidthChange?: (width: number) => void
  onLengthChange?: (length: number) => void
  
  // Gaps
  edgeGap?: number
  spacingGap?: number
  onEdgeGapChange?: (gap: number) => void
  onSpacingGapChange?: (gap: number) => void
  
  // Material
  selectedMaterial?: string
  materials?: Array<{ id: string; name: string; costPerSqm: number }>
  onMaterialChange?: (materialId: string) => void
  
  // Actions
  onCalculate?: () => void
  onExport?: () => void
  
  // Layout
  variant?: 'elevation' | 'outlined'
  compact?: boolean
}

const CeilingControlPanel: React.FC<CeilingControlPanelProps> = ({
  width = 4800,
  length = 3600,
  onWidthChange = () => {},
  edgeGap = 100,
  spacingGap = 50,
  onEdgeGapChange = () => {},
  selectedMaterial = 'standard',
  materials = [
    { id: 'standard', name: 'Standard Tiles', costPerSqm: 15 },
    { id: 'premium', name: 'Premium Acoustic', costPerSqm: 25 },
    { id: 'metal', name: 'Metal Panels', costPerSqm: 45 },
  ],
  onMaterialChange = () => {},
  onCalculate = () => {},
  onExport = () => {},
  variant = 'elevation',
  compact = false,
}) => {
  const [localWidth, setLocalWidth] = useState(width)
  const [localLength, setLocalLength] = useState(length)
  const [localEdgeGap, setLocalEdgeGap] = useState(edgeGap)
  const [localSpacingGap, setLocalSpacingGap] = useState(spacingGap)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const handleWidthChange = (value: number) => {
    setLocalWidth(value)
    onWidthChange(value)
  }

  const handleLengthChange = (value: number) => {
    setLocalLength(value)
    onLengthChange(value)
  }

  const handleEdgeGapChange = (value: number) => {
    setLocalEdgeGap(value)
    onEdgeGapChange(value)
  }

  const handleSpacingGapChange = (value: number) => {
    setLocalSpacingGap(value)
  }

  if (compact) {
    return (
      <MaterialCard variant={variant} title="Ceiling Settings" elevation={1}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <MaterialSlider
              label="Width (mm)"
              value={localWidth}
              min={1000}
              max={10000}
              step={100}
              onChange={(_, v) => handleWidthChange(v)}
            />
          </Grid>
          <Grid item xs={6}>
            <MaterialSlider
              label="Length (mm)"
              value={localLength}
              min={1000}
              max={10000}
              step={100}
              onChange={(_, v) => handleLengthChange(v)}
            />
          </Grid>
          <Grid item xs={6}>
            <MaterialSlider
              label="Edge Gap"
              value={localEdgeGap}
              min={0}
              max={500}
              step={10}
              onChange={(_, v) => handleEdgeGapChange(v)}
            />
          </Grid>
          <Grid item xs={6}>
            <MaterialSlider
              label="Spacing Gap"
              value={localSpacingGap}
              min={0}
              max={200}
              step={5}
              onChange={(_, v) => handleSpacingGapChange(v)}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <MaterialButton variant="contained" onClick={onCalculate}>
            Calculate Layout
          </MaterialButton>
          <MaterialButton variant="outlined" onClick={() => setShowExportDialog(true)}>
            Export
          </MaterialButton>
        </Box>
      </MaterialCard>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <MaterialCard 
        variant={variant} 
        title="Ceiling Panel Calculator"
        subtitle="Configure ceiling dimensions and material settings"
        elevation={2}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Reset to defaults">
              <IconButton size="small">
                <ResetIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Help">
              <IconButton size="small">
                <HelpIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      >
        {/* Dimensions Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: bimTheme.palette.primary.main }}>
            Dimensions
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <MaterialSlider
                label="Ceiling Width"
                value={localWidth}
                min={1000}
                max={10000}
                step={100}
                showValue
                onChange={(_, v) => handleWidthChange(v)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MaterialSlider
                label="Ceiling Length"
                value={localLength}
                min={1000}
                max={10000}
                step={100}
                showValue
                onChange={(_, v) => handleLengthChange(v)}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Gaps Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: bimTheme.palette.primary.main }}>
            Gap Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <MaterialSlider
                label="Edge Gap"
                value={localEdgeGap}
                min={0}
                max={500}
                step={10}
                showValue
                onChange={(_, v) => handleEdgeGapChange(v)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MaterialSlider
                label="Spacing Gap"
                value={localSpacingGap}
                min={0}
                max={200}
                step={5}
                showValue
                onChange={(_, v) => handleSpacingGapChange(v)}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Material Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: bimTheme.palette.primary.main }}>
            Material Selection
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {materials.map((material) => (
              <MaterialButton
                key={material.id}
                variant={selectedMaterial === material.id ? 'contained' : 'outlined'}
                BIMstyle={selectedMaterial === material.id ? 'primary' : 'secondary'}
                onClick={() => onMaterialChange(material.id)}
                size="small"
              >
                {material.name} (${material.costPerSqm}/m²)
              </MaterialButton>
            ))}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
          <MaterialButton variant="outlined" onClick={() => setShowExportDialog(true)}>
            Export Options
          </MaterialButton>
          <MaterialButton variant="contained" onClick={onCalculate} size="large">
            Calculate Layout
          </MaterialButton>
        </Box>
      </MaterialCard>

      {/* Export Dialog */}
      <MaterialDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        title="Export Options"
        maxWidth="sm"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <MaterialButton variant="outlined" onClick={() => { onExport(); setShowExportDialog(false) }}>
            Export as DXF (AutoCAD)
          </MaterialButton>
          <MaterialButton variant="outlined" onClick={() => { onExport(); setShowExportDialog(false) }}>
            Export as SVG (Vector)
          </MaterialButton>
          <MaterialButton variant="outlined" onClick={() => { onExport(); setShowExportDialog(false) }}>
            Export as JSON (Data)
          </MaterialButton>
          <MaterialButton variant="outlined" onClick={() => { onExport(); setShowExportDialog(false) }}>
            Export as PDF (Report)
          </MaterialButton>
        </Box>
      </MaterialDialog>
    </Box>
  )
}

// Icon components (simplified)
const ResetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
)

const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

export default CeilingControlPanel
