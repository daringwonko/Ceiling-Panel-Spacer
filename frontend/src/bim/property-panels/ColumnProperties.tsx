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
  ColumnData, 
  ColumnProperties,
  STRUCTURAL_MATERIALS,
  calculateColumnVolume 
} from '../types/structural'
import { 
  validateColumn, 
  ValidationResult 
} from '../validators/StructuralValidator'
import { useBIMStore } from '../../stores/useBIMStore'
import { 
  Square, 
  Ruler, 
  Box, 
  Palette, 
  AlertTriangle, 
  CheckCircle2,
  RotateCcw,
  Weight,
  ArrowUpFromLine
} from 'lucide-react'

export interface ColumnPropertiesProps {
  column: ColumnData
  onUpdate?: (updates: Partial<ColumnProperties>) => void
  onValidate?: (result: ValidationResult) => void
}

export function ColumnPropertiesPanel({ column, onUpdate, onValidate }: ColumnPropertiesProps) {
  const { updateObject } = useBIMStore()
  const [localProps, setLocalProps] = useState<ColumnProperties>(column.properties)
  const [validation, setValidation] = useState<ValidationResult>({
    valid: true,
    errors: [],
    warnings: []
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Calculate derived values
  const volume = calculateColumnVolume(
    localProps.height,
    localProps.profileType,
    localProps.width,
    localProps.depth,
    localProps.diameter
  )

  const crossSectionalArea = localProps.profileType === 'rectangle' && localProps.width && localProps.depth
    ? localProps.width * localProps.depth
    : localProps.profileType === 'circle' && localProps.diameter
    ? Math.PI * Math.pow(localProps.diameter / 2, 2)
    : 0

  // Validate on property change
  useEffect(() => {
    const result = validateColumn(
      localProps.height,
      localProps.profileType,
      localProps.width,
      localProps.depth,
      localProps.diameter,
      localProps.baseElevation
    )
    setValidation(result)
    onValidate?.(result)
  }, [localProps.height, localProps.profileType, localProps.width, localProps.depth, localProps.diameter, localProps.baseElevation, onValidate])

  // Handle property change with debounced update
  const handlePropertyChange = useCallback((
    property: keyof ColumnProperties,
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
    
    updateObject(column.id, {
      properties: localProps
    })
    setHasChanges(false)
  }, [column.id, localProps, validation.valid, updateObject])

  // Reset to original values
  const handleReset = useCallback(() => {
    setLocalProps(column.properties)
    setHasChanges(false)
  }, [column.properties])

  // Handle profile type change - reset profile dimensions
  const handleProfileTypeChange = useCallback((newType: 'rectangle' | 'circle') => {
    setLocalProps(prev => ({
      ...prev,
      profileType: newType,
      // Reset dimensions appropriate to type
      width: newType === 'rectangle' ? (prev.width || 300) : undefined,
      depth: newType === 'rectangle' ? (prev.depth || 300) : undefined,
      diameter: newType === 'circle' ? (prev.diameter || 300) : undefined,
    }))
    setHasChanges(true)
  }, [])

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Square className="h-5 w-5 text-savage-primary" />
              <CardTitle className="text-lg">Column Properties</CardTitle>
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
          {/* Profile Type Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-savage-text-muted uppercase tracking-wide">
              Profile Type
            </h4>
            
            <PropertyInput
              label="Profile Shape"
              value={localProps.profileType}
              type="select"
              options={['rectangle', 'circle']}
              onChange={(value) => handleProfileTypeChange(value as 'rectangle' | 'circle')}
            />
          </div>

          {/* Dimensions Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-savage-text-muted uppercase tracking-wide flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Dimensions
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <PropertyInput
                label="Height"
                value={localProps.height}
                type="number"
                unit="mm"
                min={1000}
                max={15000}
                step={100}
                onChange={(value) => handlePropertyChange('height', parseFloat(value) || 0)}
              />
              
              <PropertyInput
                label="Base Elevation"
                value={localProps.baseElevation}
                type="number"
                unit="mm"
                step={100}
                onChange={(value) => handlePropertyChange('baseElevation', parseFloat(value) || 0)}
              />
              
              {localProps.profileType === 'rectangle' && (
                <>
                  <PropertyInput
                    label="Width"
                    value={localProps.width || 300}
                    type="number"
                    unit="mm"
                    min={200}
                    max={800}
                    step={10}
                    onChange={(value) => handlePropertyChange('width', parseFloat(value) || 0)}
                  />
                  
                  <PropertyInput
                    label="Depth"
                    value={localProps.depth || 300}
                    type="number"
                    unit="mm"
                    min={200}
                    max={800}
                    step={10}
                    onChange={(value) => handlePropertyChange('depth', parseFloat(value) || 0)}
                  />
                </>
              )}
              
              {localProps.profileType === 'circle' && (
                <PropertyInput
                  label="Diameter"
                  value={localProps.diameter || 300}
                  type="number"
                  unit="mm"
                  min={200}
                  max={1000}
                  step={10}
                  onChange={(value) => handlePropertyChange('diameter', parseFloat(value) || 0)}
                />
              )}
            </div>
          </div>

          {/* Position Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-savage-text-muted uppercase tracking-wide flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              Position
            </h4>
            
            <div className="grid grid-cols-3 gap-2">
              <PropertyInput
                label="X"
                value={localProps.position[0]}
                type="number"
                step={10}
                onChange={(value) => {
                  const newPos: [number, number, number] = [
                    parseFloat(value) || 0,
                    localProps.position[1],
                    localProps.position[2]
                  ]
                  handlePropertyChange('position', newPos)
                }}
              />
              <PropertyInput
                label="Y"
                value={localProps.position[1]}
                type="number"
                step={10}
                onChange={(value) => {
                  const newPos: [number, number, number] = [
                    localProps.position[0],
                    parseFloat(value) || 0,
                    localProps.position[2]
                  ]
                  handlePropertyChange('position', newPos)
                }}
              />
              <PropertyInput
                label="Z"
                value={localProps.position[2]}
                type="number"
                step={10}
                onChange={(value) => {
                  const newPos: [number, number, number] = [
                    localProps.position[0],
                    localProps.position[1],
                    parseFloat(value) || 0
                  ]
                  handlePropertyChange('position', newPos)
                }}
              />
            </div>
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

          {/* Load Capacity */}
          {localProps.loadCapacity && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-savage-text-muted uppercase tracking-wide flex items-center gap-2">
                <Weight className="h-4 w-4" />
                Structural Properties
              </h4>
              
              <div className="bg-slate-800 p-2 rounded">
                <div className="text-savage-text-muted">Load Capacity</div>
                <div className="font-mono">{localProps.loadCapacity.toLocaleString()} kN</div>
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
                <div className="text-savage-text-muted">Cross-Section Area</div>
                <div className="font-mono">{(crossSectionalArea / 1e6).toFixed(4)} m²</div>
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
              <div className="bg-slate-800 p-2 rounded">
                <div className="text-savage-text-muted">Top Elevation</div>
                <div className="font-mono">{localProps.baseElevation + localProps.height} mm</div>
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

export default ColumnPropertiesPanel
