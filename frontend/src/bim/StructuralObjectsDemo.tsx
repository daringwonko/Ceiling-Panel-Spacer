import * as React from 'react'
import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs'
import { 
  WallPropertiesPanel,
  BeamPropertiesPanel,
  ColumnPropertiesPanel,
  SlabPropertiesPanel,
} from './property-panels'
import { 
  WallData,
  BeamData,
  ColumnData,
  SlabData,
} from './types/structural'
import { ValidationResult } from './validators/StructuralValidator'
import {
  GripHorizontal,
  Square,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

/**
 * Demo page for Structural BIM Objects
 * 
 * This page demonstrates all four structural object types with their
 * property panels, validation, and real-time updates.
 */
export default function StructuralObjectsDemo() {
  // Sample wall data
  const [wall, setWall] = useState<WallData>({
    id: 'wall-001',
    type: 'wall',
    name: 'Exterior Wall',
    geometry: null,
    material: 'Concrete C25/30',
    properties: {
      length: 5000,
      height: 2800,
      thickness: 200,
      startPoint: [0, 0, 0],
      endPoint: [5000, 0, 0],
      baseElevation: 0,
      topElevation: 2800,
      material: 'Concrete C25/30',
      isStructural: true,
      hasOpening: false,
    },
    level: 'Level 1',
    layer: 'Walls',
    isSelected: false,
    position: [2500, 0, 1400],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  })

  // Sample beam data
  const [beam, setBeam] = useState<BeamData>({
    id: 'beam-001',
    type: 'beam',
    name: 'Main Beam',
    geometry: null,
    material: 'Structural Steel S355',
    properties: {
      length: 6000,
      profileWidth: 200,
      profileHeight: 400,
      startPoint: [0, 0, 2800],
      endPoint: [6000, 0, 2800],
      elevation: 2800,
      material: 'Structural Steel S355',
      isStructural: true,
      startConnection: 'pinned',
      endConnection: 'pinned',
    },
    level: 'Level 1',
    layer: 'Beams',
    isSelected: false,
    position: [3000, 0, 2800],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  })

  // Sample column data
  const [column, setColumn] = useState<ColumnData>({
    id: 'column-001',
    type: 'column',
    name: 'Corner Column',
    geometry: null,
    material: 'Concrete C30/37',
    properties: {
      height: 3000,
      profileType: 'rectangle',
      width: 300,
      depth: 300,
      position: [0, 0, 0],
      baseElevation: 0,
      topElevation: 3000,
      material: 'Concrete C30/37',
      isStructural: true,
      loadCapacity: 2000,
    },
    level: 'Level 1',
    layer: 'Columns',
    isSelected: false,
    position: [0, 0, 1500],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  })

  // Sample slab data
  const [slab, setSlab] = useState<SlabData>({
    id: 'slab-001',
    type: 'slab',
    name: 'Floor Slab',
    geometry: null,
    material: 'Concrete C25/30',
    properties: {
      boundary: [
        [0, 0],
        [5000, 0],
        [5000, 5000],
        [0, 5000],
      ],
      thickness: 200,
      elevation: 3000,
      area: 25000000,
      volume: 5000000000,
      material: 'Concrete C25/30',
      isStructural: true,
      hasDropPanels: false,
      extrudeDirection: 'down',
    },
    level: 'Level 1',
    layer: 'Slabs',
    isSelected: false,
    position: [2500, 2500, 3000],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  })

  // Validation states
  const [wallValidation, setWallValidation] = useState<ValidationResult | null>(null)
  const [beamValidation, setBeamValidation] = useState<ValidationResult | null>(null)
  const [columnValidation, setColumnValidation] = useState<ValidationResult | null>(null)
  const [slabValidation, setSlabValidation] = useState<ValidationResult | null>(null)

  // Update handlers
  const handleWallUpdate = useCallback((updates: any) => {
    setWall(prev => ({ ...prev, properties: { ...prev.properties, ...updates } }))
  }, [])

  const handleBeamUpdate = useCallback((updates: any) => {
    setBeam(prev => ({ ...prev, properties: { ...prev.properties, ...updates } }))
  }, [])

  const handleColumnUpdate = useCallback((updates: any) => {
    setColumn(prev => ({ ...prev, properties: { ...prev.properties, ...updates } }))
  }, [])

  const handleSlabUpdate = useCallback((updates: any) => {
    setSlab(prev => ({ ...prev, properties: { ...prev.properties, ...updates } }))
  }, [])

  return (
    <div className="min-h-screen bg-savage-dark p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Structural BIM Objects Demo
          </h1>
          <p className="text-savage-text-muted">
            Interactive demonstration of Wall, Beam, Column, and Slab property panels
            with real-time validation and updates.
          </p>
        </div>

        <Tabs defaultValue="wall" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wall" className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Wall
              {wallValidation && !wallValidation.valid && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              {wallValidation && wallValidation.valid && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="beam" className="flex items-center gap-2">
              <GripHorizontal className="h-4 w-4" />
              Beam
              {beamValidation && !beamValidation.valid && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              {beamValidation && beamValidation.valid && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="column" className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Column
              {columnValidation && !columnValidation.valid && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              {columnValidation && columnValidation.valid && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="slab" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Slab
              {slabValidation && !slabValidation.valid && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              {slabValidation && slabValidation.valid && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wall" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <WallPropertiesPanel
                  wall={wall}
                  onUpdate={handleWallUpdate}
                  onValidate={setWallValidation}
                />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Object Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">ID:</span>
                      <span className="font-mono">{wall.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Name:</span>
                      <span>{wall.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Type:</span>
                      <Badge variant="secondary">{wall.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Material:</span>
                      <span>{wall.properties.material}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Length:</span>
                      <span className="font-mono">{wall.properties.length} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Height:</span>
                      <span className="font-mono">{wall.properties.height} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Thickness:</span>
                      <span className="font-mono">{wall.properties.thickness} mm</span>
                    </div>
                  </CardContent>
                </Card>

                {wallValidation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Validation Status
                        {wallValidation.valid ? (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Invalid
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {wallValidation.errors.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-red-400 mb-2">Errors:</h4>
                          <ul className="list-disc list-inside text-sm text-red-400">
                            {wallValidation.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {wallValidation.warnings.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-yellow-400 mb-2">Warnings:</h4>
                          <ul className="list-disc list-inside text-sm text-yellow-400">
                            {wallValidation.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="beam" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <BeamPropertiesPanel
                  beam={beam}
                  onUpdate={handleBeamUpdate}
                  onValidate={setBeamValidation}
                />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Object Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">ID:</span>
                      <span className="font-mono">{beam.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Name:</span>
                      <span>{beam.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Type:</span>
                      <Badge variant="secondary">{beam.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Material:</span>
                      <span>{beam.properties.material}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Length:</span>
                      <span className="font-mono">{beam.properties.length} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Profile:</span>
                      <span className="font-mono">{beam.properties.profileWidth} × {beam.properties.profileHeight} mm</span>
                    </div>
                  </CardContent>
                </Card>

                {beamValidation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Validation Status
                        {beamValidation.valid ? (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Invalid
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {beamValidation.errors.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-red-400 mb-2">Errors:</h4>
                          <ul className="list-disc list-inside text-sm text-red-400">
                            {beamValidation.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {beamValidation.warnings.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-yellow-400 mb-2">Warnings:</h4>
                          <ul className="list-disc list-inside text-sm text-yellow-400">
                            {beamValidation.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="column" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ColumnPropertiesPanel
                  column={column}
                  onUpdate={handleColumnUpdate}
                  onValidate={setColumnValidation}
                />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Object Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">ID:</span>
                      <span className="font-mono">{column.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Name:</span>
                      <span>{column.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Type:</span>
                      <Badge variant="secondary">{column.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Profile:</span>
                      <span className="capitalize">{column.properties.profileType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Height:</span>
                      <span className="font-mono">{column.properties.height} mm</span>
                    </div>
                    {column.properties.profileType === 'rectangle' && (
                      <div className="flex justify-between">
                        <span className="text-savage-text-muted">Dimensions:</span>
                        <span className="font-mono">{column.properties.width} × {column.properties.depth} mm</span>
                      </div>
                    )}
                    {column.properties.profileType === 'circle' && (
                      <div className="flex justify-between">
                        <span className="text-savage-text-muted">Diameter:</span>
                        <span className="font-mono">{column.properties.diameter} mm</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {columnValidation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Validation Status
                        {columnValidation.valid ? (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Invalid
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {columnValidation.errors.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-red-400 mb-2">Errors:</h4>
                          <ul className="list-disc list-inside text-sm text-red-400">
                            {columnValidation.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {columnValidation.warnings.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-yellow-400 mb-2">Warnings:</h4>
                          <ul className="list-disc list-inside text-sm text-yellow-400">
                            {columnValidation.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="slab" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <SlabPropertiesPanel
                  slab={slab}
                  onUpdate={handleSlabUpdate}
                  onValidate={setSlabValidation}
                />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Object Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">ID:</span>
                      <span className="font-mono">{slab.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Name:</span>
                      <span>{slab.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Type:</span>
                      <Badge variant="secondary">{slab.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Boundary Points:</span>
                      <span className="font-mono">{slab.properties.boundary.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Thickness:</span>
                      <span className="font-mono">{slab.properties.thickness} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Elevation:</span>
                      <span className="font-mono">{slab.properties.elevation} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-savage-text-muted">Extrude:</span>
                      <span className="capitalize">{slab.properties.extrudeDirection}</span>
                    </div>
                  </CardContent>
                </Card>

                {slabValidation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Validation Status
                        {slabValidation.valid ? (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Invalid
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {slabValidation.errors.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-red-400 mb-2">Errors:</h4>
                          <ul className="list-disc list-inside text-sm text-red-400">
                            {slabValidation.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {slabValidation.warnings.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-yellow-400 mb-2">Warnings:</h4>
                          <ul className="list-disc list-inside text-sm text-yellow-400">
                            {slabValidation.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Implementation Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Square className="h-4 w-4 text-savage-primary" />
                  Wall Tool
                </h4>
                <ul className="text-sm text-savage-text-muted space-y-1">
                  <li>✓ Parametric dimensions</li>
                  <li>✓ Start/end point editing</li>
                  <li>✓ Material selection</li>
                  <li>✓ Volume calculation</li>
                  <li>✓ Validation</li>
                </ul>
              </div>
              
              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <GripHorizontal className="h-4 w-4 text-savage-primary" />
                  Beam Tool
                </h4>
                <ul className="text-sm text-savage-text-muted space-y-1">
                  <li>✓ Profile dimensions</li>
                  <li>✓ Connection types</li>
                  <li>✓ Elevation control</li>
                  <li>✓ Weight calculation</li>
                  <li>✓ Span validation</li>
                </ul>
              </div>
              
              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Square className="h-4 w-4 text-savage-primary" />
                  Column Tool
                </h4>
                <ul className="text-sm text-savage-text-muted space-y-1">
                  <li>✓ Rectangle/Circle profiles</li>
                  <li>✓ Height/elevation</li>
                  <li>✓ Position editing</li>
                  <li>✓ Slenderness check</li>
                  <li>✓ Cross-section area</li>
                </ul>
              </div>
              
              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-savage-primary" />
                  Slab Tool
                </h4>
                <ul className="text-sm text-savage-text-muted space-y-1">
                  <li>✓ Polygonal boundary</li>
                  <li>✓ Thickness control</li>
                  <li>✓ Extrude direction</li>
                  <li>✓ Area/perimeter calc</li>
                  <li>✓ Boundary validation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
