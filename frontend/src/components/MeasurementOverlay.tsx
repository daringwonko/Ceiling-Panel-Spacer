import React, { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { useDesignStore } from '../store/useDesignStore'

interface MeasurementOverlayProps {
  panelId: string
  position: [number, number, number]
  dimensions: [number, number, number]
}

export const MeasurementOverlay: React.FC<MeasurementOverlayProps> = ({
  panelId,
  position,
  dimensions
}) => {
  const selectedPanelId = useDesignStore(state => state.selectedPanelId)
  const [width, length, thickness] = dimensions
  
  // Only show overlay if this panel is selected
  if (selectedPanelId !== panelId) {
    return null
  }

  return (
    <Html
      position={[position[0], position[1] + thickness / 2 + 10, position[2]]}
      center
      distanceFactor={100}
      style={{ pointerEvents: 'none' }}
    >
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '4px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ marginBottom: '4px', fontWeight: 600 }}>
          Panel Dimensions
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'auto auto', 
          gap: '4px 12px',
          fontSize: '11px'
        }}>
          <span style={{ color: '#aaa' }}>Width:</span>
          <span style={{ fontWeight: 500 }}>{width.toFixed(0)} mm</span>
          <span style={{ color: '#aaa' }}>Length:</span>
          <span style={{ fontWeight: 500 }}>{length.toFixed(0)} mm</span>
          <span style={{ color: '#aaa' }}>Thickness:</span>
          <span style={{ fontWeight: 500 }}>{thickness.toFixed(0)} mm</span>
        </div>
      </div>
    </Html>
  )
}

interface MeasurementOverlaysProps {
  panels: Array<{
    id: string
    position: [number, number, number]
    dimensions: [number, number, number]
  }>
}

export const MeasurementOverlays: React.FC<MeasurementOverlaysProps> = ({ panels }) => {
  return (
    <>
      {panels.map(panel => (
        <MeasurementOverlay
          key={panel.id}
          panelId={panel.id}
          position={panel.position}
          dimensions={panel.dimensions}
        />
      ))}
    </>
  )
}
