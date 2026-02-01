import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/Tooltip'
import { PropertyInput } from '../../components/bim/PropertyInput'
import { 
  SlabData, 
  SlabProperties,
  STRUCTURAL_MATERIALS,
  calculateSlabVolume,
  calculateSlabArea
} from '../types/structural'
import { 
  validateSlab, 
  ValidationResult 
} from '../validators/StructuralValidator'
import { useBIMStore } from '../../stores/useBIMStore'
import { 
  Layers, 
  Ruler, 
  Box, 
  Palette, 
  AlertTriangle, 
  CheckCircle2,
  RotateCcw,
  Calculator,
  ArrowUpDown,
  Grid3X3
} from 'lucide-react'

export interface SlabPropertiesProps {
  slab: SlabData
  onUpdate?: (updates: Partial<SlabProperties>) => void
  onValidate?: (result: ValidationResult) => void
}

export function SlabPropertiesPanel({ slab, onUpdate, onValidate }: SlabPropertiesProps) {
  const { updateObject } = useBIMStore()
  const [localProps, setLocalProps] = useState<SlabProperties>(slab.properties)
  const [validation, setValidation] = useState<ValidationResult>({
    valid: true,
    errors: [],
    warnings: []
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingBoundary, setEditingBoundary] = useState(false)

  // Calculate derived values
  const area = calculateSlabArea(localProps.boundary)
  const volume = calculateSlabVolume(area, localProps.thickness)
  const perimeter = calculatePerimeter(localProps.boundary)

  // Validate on property change
  useEffect(() => {
    const result = validateSlab(
      localProps.thickness,
      area,
      localProps.elevation,
      localProps.boundary.length
    )
    setValidation(result)
    onValidate?.(result)
  }, [localProps.thickness, localProps.elevation, localProps.boundary, area, onValidate])

  // Handle property change with debounced update
  const handlePropertyChange = useCallback((
    property: keyof SlabProperties,
    value: any
  ) => {
    setLocalProps(prev => ({ ...prev, [property]: value }))
    setHasChanges(true)
    
    // Debounced real-time update
    if (!isUpdating) {
      setIsUpdating(true)
      setTimeout(() => {
        onUpdate?.({ [property]: value })
        setIsUpdating(false)
      }, 100)
    }
  }, [onUpdate, isUpdating])

  // Apply changes to store
  const handleApply = useCallback(() => {
    if (!validation.valid) return
    
    updateObject(slab.id, {
      properties: {
        ...localProps,
        area,
        volume
      }
    })
    setHasChanges(false)
  }, [slab.id, localProps, area, volume, validation.valid, updateObject])

  // Reset to original values
  const handleReset = useCallback(() => {
    setLocalProps(slab.properties)
    setHasChanges(false)
  }, [slab.properties])

  // Toggle extrude direction
  const toggleExtrudeDirection = useCallback(() => {
    handlePropertyChange(
      'extrudeDirection', 
      localProps.extrudeDirection === 'up' ? 'down' : 'up'
    )
  }, [localProps.extrudeDirection, handlePropertyChange])

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-savage-primary" />
              <CardTitle className="text-lg">Slab Properties</CardTitle>
            </div>
            <Badge variant={validation.valid ? 'default' : 'destructive'}>
              {validation.valid ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Valid</>
              ) : (
                <><AlertTriangle className="h-3 w-3 mr-1" /> Invalid</>
              )}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Dimensions Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-savage-text-muted uppercase tracking-wide flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Dimensions
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <PropertyInput
                label="Thickness"
                value={localProps.thickness}
                type="number"
                unit="mm"
                min={100}
                max={500}
                step={10}
                onChange={(value) => handlePropertyChange('thickness', parseFloat(value) || 0)}
              />
              
              <PropertyInput
                label="Elevation"
                value={localProps.elevation}
                type="number"
                unit="mm"
                step={100}
                onChange={(value) => handlePropertyChange('elevation', parseFloat(value) || 0)}
              />
            </div>
            
            {/* Extrude Direction */}
            <div className="flex items-center justify-between bg-slate-800 p-3 rounded">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-savage-text-muted" />
                <span className="text-sm">Extrude Direction</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleExtrudeDirection}
              >
                {localProps.extrudeDirection === 'up' ? 'Upward ↑' : 'Downward ↓'}
              </Button>
            </div>
          </div>

          {/* Boundary Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-savage-text-muted uppercase tracking-wide flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Boundary
            </h4>
            
            <div className="bg-slate-800 p-3 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-savage-text-muted">Vertices</span>
                <Badge variant="secondary">{localProps.boundary.length} points</Badge>
              </div>
              
              <div className="text-xs text-savage-text-muted">
                {localProps.boundary.map((point, idx) => (
                  <div key={idx} className="font-mono">
                    P{idx + 1}: ({point[0].toFixed(0)}, {point[1].toFixed(0)})
                  </div>
                ))}
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setEditingBoundary(!editingBoundary)}
                  >
                    {editingBoundary ? 'Done Editing' : 'Edit Boundary'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit slab boundary vertices</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {localProps.boundary.length < 3 && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Slab requires at least 3 points to form a valid polygon
              </div>
            )}
          </div>

          {/* Material Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-savage-text-muted uppercase tracking-wide flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Material
            </h4>
            
            <PropertyInput
              label="Material"
              value={localProps.material}
              type="select"
              options={STRUCTURAL_MATERIALS.map(m => m.name)}
              onChange={(value) => handlePropertyChange('material', value)}
            />
            
            {localProps.material && (
              <div className="text-xs text-savage-text-muted bg-slate-800 p-2 rounded">
                {(() => {
                  const material = STRUCTURAL_MATERIALS.find(m => m.name === localProps.material)
                  return material ? (
                    <div className="space-y-1">
                      <div>Type: {material.type}</div>
                      <div>Density: {material.density} kg/m³</div>
                      {material.compressiveStrength && (
                        <div>Compressive Strength: {material.compressiveStrength} MPa</div>
                      )}
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </div>

          {/* Drop Panels Section */}
          {localProps.hasDropPanels && localProps.dropPanels && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-savage-text-muted uppercase tracking-wide">
                Drop Panels ({localProps.dropPanels.length})
              </h4>
              
              <div className="space-y-2">
                {localProps.dropPanels.map((panel, idx) => (
                  <div key={panel.id} className="bg-slate-800 p-2 rounded text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Drop Panel {idx + 1}</span>
                    </div>
                    <div className="text-xs text-savage-text-muted space-y-1">
                      <div>Position: ({panel.position[0].toFixed(0)}, {panel.position[1].toFixed(0)})</div>
                      <div>Size: {panel.width} × {panel.depth} mm</div>
                      <div>Thickness: {panel.thickness} mm</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calculated Properties */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-savage-text-muted uppercase tracking-wide flex items-center gap-2">
              <Box className="h-4 w-4" />
              Calculated Properties
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-800 p-2 rounded">
                <div className="text-savage-text-muted">Area</div>
                <div className="font-mono">{(area / 1e6).toFixed(2)} m²</div>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <div className="text-savage-text-muted">Perimeter</div>
                <div className="font-mono">{(perimeter / 1000).toFixed(2)} m</div>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <div className="text-savage-text-muted">Volume</div>
                <div className="font-mono">{(volume / 1e9).toFixed(3)} m³</div>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <div className="text-savage-text-muted">Weight</div>
                <div className="font-mono">
                  {(() => {
                    const material = STRUCTURAL_MATERIALS.find(m => m.name === localProps.material)
                    const weight = material ? (volume / 1e9) * material.density : 0
                    return `${weight.toFixed(1)} kg`
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Messages */}
          {(validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="space-y-2">
              {validation.errors.map((error, idx) => (
                <div key={`error-${idx}`} className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              ))}
              {validation.warnings.map((warning, idx) => (
                <div key={`warning-${idx}`} className="flex items-center gap-2 text-yellow-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {warning}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!hasChanges || !validation.valid}
              className="flex-1"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// Helper function to calculate perimeter
function calculatePerimeter(boundary: [number, number][]): number {
  let perimeter = 0
  const n = boundary.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const dx = boundary[j][0] - boundary[i][0]
    const dy = boundary[j][1] - boundary[i][1]
    perimeter += Math.sqrt(dx * dx + dy * dy)
  }
  return perimeter
}

export default SlabPropertiesPanel
