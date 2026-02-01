import React, { useMemo } from 'react'
import { Edges } from '@react-three/drei'
import { MeasurementOverlays } from '../components/MeasurementOverlay'
import { useDesignStore } from '../store/useDesignStore'
import { getMaterialById } from '../types/materials'

interface CeilingPanel3DProps {
  panel: {
    id: string
    position: [number, number, number]
    dimensions: [number, number, number]
    material: string
    selected: boolean
  }
  onClick: () => void
  gridSnapEnabled: boolean
  gridSnapSize: number
}

const CeilingPanel3D: React.FC<CeilingPanel3DProps> = ({
  panel,
  onClick,
  gridSnapEnabled,
  gridSnapSize
}) => {
  const [width, length, thickness] = panel.dimensions
  
  // Get material color
  const materialInfo = useMemo(() => getMaterialById(panel.material), [panel.material])
  const materialColor = materialInfo?.color || '#e0e0e0'
  const materialReflectivity = materialInfo?.reflectivity || 0.7

  // Apply grid snapping to position
  const snappedPosition = useMemo(() => {
    if (!gridSnapEnabled) return panel.position
    
    return [
      Math.round(panel.position[0] / gridSnapSize) * gridSnapSize,
      panel.position[1],
      Math.round(panel.position[2] / gridSnapSize) * gridSnapSize
    ] as [number, number, number]
  }, [panel.position, gridSnapEnabled, gridSnapSize])

  return (
    <group position={snappedPosition}>
      {/* Main panel mesh */}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, thickness, length]} />
        <meshStandardMaterial
          color={materialColor}
          metalness={0.1}
          roughness={1 - materialReflectivity}
          transparent={false}
          opacity={1}
        />
        
        {/* Selection highlight */}
        {panel.selected && (
          <Edges
            scale={1.02}
            threshold={15}
            color="#4CAF50"
            renderOrder={1000}
          />
        )}
      </mesh>

      {/* Measurement overlay for selected panel */}
      {panel.selected && (
        <MeasurementOverlays
          panels={[
            {
              id: panel.id,
              position: snappedPosition,
              dimensions: panel.dimensions
            }
          ]}
        />
      )}
    </group>
  )
}

export default CeilingPanel3D
