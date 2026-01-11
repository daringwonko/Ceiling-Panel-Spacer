import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, PerspectiveCamera, Environment } from '@react-three/drei'

function CeilingPanel({ position, size, color = '#3b82f6' }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[size[0], 0.02, size[1]]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function CeilingLayout({ layout, dimensions, spacing }) {
  const panels = []

  const perimeterGap = spacing.perimeter_gap_mm / 1000
  const panelGap = spacing.panel_gap_mm / 1000
  const ceilingWidth = dimensions.width_mm / 1000
  const ceilingLength = dimensions.length_mm / 1000

  const panelsX = layout?.panels_per_column || 3
  const panelsY = layout?.panels_per_row || 2

  const panelWidth = layout?.panel_width_mm / 1000 || (ceilingWidth - 2 * perimeterGap - (panelsX - 1) * panelGap) / panelsX
  const panelLength = layout?.panel_length_mm / 1000 || (ceilingLength - 2 * perimeterGap - (panelsY - 1) * panelGap) / panelsY

  for (let row = 0; row < panelsY; row++) {
    for (let col = 0; col < panelsX; col++) {
      const x = -ceilingWidth / 2 + perimeterGap + panelWidth / 2 + col * (panelWidth + panelGap)
      const z = -ceilingLength / 2 + perimeterGap + panelLength / 2 + row * (panelLength + panelGap)

      panels.push(
        <CeilingPanel
          key={`${row}-${col}`}
          position={[x, 2.5, z]}
          size={[panelWidth, panelLength]}
        />
      )
    }
  }

  return (
    <>
      {/* Ceiling frame */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[ceilingWidth, 0.01, ceilingLength]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.5} />
      </mesh>

      {/* Panels */}
      {panels}

      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ceilingWidth + 2, ceilingLength + 2]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </>
  )
}

export default function Visualization() {
  const [dimensions, setDimensions] = useState({
    length_mm: 5000,
    width_mm: 4000,
  })

  const [spacing, setSpacing] = useState({
    perimeter_gap_mm: 200,
    panel_gap_mm: 50,
  })

  const [viewMode, setViewMode] = useState('perspective')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>3D Visualization</h1>
          <p className="text-slate-400 mt-1">Interactive 3D view of ceiling layout</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn ${viewMode === 'perspective' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('perspective')}
          >
            Perspective
          </button>
          <button
            className={`btn ${viewMode === 'top' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('top')}
          >
            Top View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="card p-6 space-y-4">
          <h3>Dimensions</h3>
          <div>
            <label className="label">Length (mm)</label>
            <input
              type="number"
              className="input"
              value={dimensions.length_mm}
              onChange={(e) => setDimensions({ ...dimensions, length_mm: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="label">Width (mm)</label>
            <input
              type="number"
              className="input"
              value={dimensions.width_mm}
              onChange={(e) => setDimensions({ ...dimensions, width_mm: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <h3 className="pt-4">Spacing</h3>
          <div>
            <label className="label">Perimeter Gap (mm)</label>
            <input
              type="number"
              className="input"
              value={spacing.perimeter_gap_mm}
              onChange={(e) => setSpacing({ ...spacing, perimeter_gap_mm: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="label">Panel Gap (mm)</label>
            <input
              type="number"
              className="input"
              value={spacing.panel_gap_mm}
              onChange={(e) => setSpacing({ ...spacing, panel_gap_mm: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="pt-4 text-sm text-slate-400">
            <p>Controls:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Drag to rotate</li>
              <li>Scroll to zoom</li>
              <li>Right-drag to pan</li>
            </ul>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="lg:col-span-3 card overflow-hidden" style={{ height: '600px' }}>
          <Canvas>
            <Suspense fallback={null}>
              <PerspectiveCamera
                makeDefault
                position={viewMode === 'top' ? [0, 8, 0] : [6, 4, 6]}
              />
              <OrbitControls
                enableDamping
                dampingFactor={0.05}
                minDistance={2}
                maxDistance={20}
              />

              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <pointLight position={[-10, -10, -5]} intensity={0.5} />

              <CeilingLayout
                dimensions={dimensions}
                spacing={spacing}
              />

              <Grid
                position={[0, 0.01, 0]}
                args={[20, 20]}
                cellSize={0.5}
                cellThickness={0.5}
                cellColor="#334155"
                sectionSize={2}
                sectionThickness={1}
                sectionColor="#475569"
                fadeDistance={30}
                fadeStrength={1}
              />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
  )
}
