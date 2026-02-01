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
  WallData, 
  WallProperties, 
  STRUCTURAL_MATERIALS,
  calculateWallVolume 
} from '../types/structural'
import { 
  validateWall, 
  ValidationResult 
} from '../validators/StructuralValidator'
import { useBIMStore } from '../../stores/useBIMStore'
import {
  Ruler,
  Box,
  Palette,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Calculator
} from 'lucide-react'

export interface WallPropertiesProps {
  wall: WallData
  onUpdate?: (updates: Partial<WallProperties>) => void
  onValidate?: (result: ValidationResult) => void
}

export function WallPropertiesPanel({ wall, onUpdate, onValidate }: WallPropertiesProps) {
  const { updateObject } = useBIMStore()
  const [localProps, setLocalProps] = useState<WallProperties>(wall.properties)
  const [validation, setValidation] = useState<ValidationResult>({
    valid: true,
    errors: [],
    warnings: []
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Calculate derived values
  const volume = calculateWallVolume(
    localProps.length,
    localProps.height,
    localProps.thickness
  )

  const surfaceArea = localProps.length * localProps.height

  // Validate on property change
  useEffect(() => {
    const result = validateWall(
      localProps.length,
      localProps.height,
      localProps.thickness
    )
    setValidation(result)
    onValidate?.(result)
  }, [localProps.length, localProps.height, localProps.thickness, onValidate])

  // Handle property change with debounced update
  const handlePropertyChange = useCallback((
    property: keyof WallProperties,
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
    
    updateObject(wall.id, {
      properties: localProps
    })
    setHasChanges(false)
  }, [wall.id, localProps, validation.valid, updateObject])

  // Reset to original values
  const handleReset = useCallback(() => {
    setLocalProps(wall.properties)
    setHasChanges(false)
  }, [wall.properties])

  // Calculate wall length from start and end points
  const updateLengthFromPoints = useCallback(() => {
    const [x1, y1, z1] = localProps.startPoint
    const [x2, y2, z2] = localProps.endPoint
    const length = Math.sqrt(
      Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2)
    )
    handlePropertyChange('length', Math.round(length))
  }, [localProps.startPoint, localProps.endPoint, handlePropertyChange])

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-savage-primary" />
              <CardTitle className="text-lg">Wall Properties</CardTitle>
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
                label="Length"
                value={localProps.length}
                type="number"
                unit="mm"
                min={100}
                step={10}
                onChange={(value) => handlePropertyChange('length', parseFloat(value) || 0)}
              />
              
              <PropertyInput
                label="Height"
                value={localProps.height}
                type="number"
                unit="mm"
                min={1000}
                max={10000}
                step={100}
                onChange={(value) => handlePropertyChange('height', parseFloat(value) || 0)}
              />
              
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
                label="Base Elevation"
                value={localProps.baseElevation}
                type="number"
                unit="mm"
                step={100}
                onChange={(value) => handlePropertyChange('baseElevation', parseFloat(value) || 0)}
              />
            </div>
          </div>

          {/* Start/End Points Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-savage-text-muted uppercase tracking-wide">
              Position
            </h4>
            
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <PropertyInput
                  label="Start X"
                  value={localProps.startPoint[0]}
                  type="number"
                  step={10}
                  onChange={(value) => {
                    const newPoint: [number, number, number] = [
                      parseFloat(value) || 0,
                      localProps.startPoint[1],
                      localProps.startPoint[2]
                    ]
                    handlePropertyChange('startPoint', newPoint)
                  }}
                />
                <PropertyInput
                  label="Start Y"
                  value={localProps.startPoint[1]}
                  type="number"
                  step={10}
                  onChange={(value) => {
                    const newPoint: [number, number, number] = [
                      localProps.startPoint[0],
                      parseFloat(value) || 0,
                      localProps.startPoint[2]
                    ]
                    handlePropertyChange('startPoint', newPoint)
                  }}
                />
                <PropertyInput
                  label="Start Z"
                  value={localProps.startPoint[2]}
                  type="number"
                  step={10}
                  onChange={(value) => {
                    const newPoint: [number, number, number] = [
                      localProps.startPoint[0],
                      localProps.startPoint[1],
                      parseFloat(value) || 0
                    ]
                    handlePropertyChange('startPoint', newPoint)
                  }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <PropertyInput
                  label="End X"
                  value={localProps.endPoint[0]}
                  type="number"
                  step={10}
                  onChange={(value) => {
                    const newPoint: [number, number, number] = [
                      parseFloat(value) || 0,
                      localProps.endPoint[1],
                      localProps.endPoint[2]
                    ]
                    handlePropertyChange('endPoint', newPoint)
                  }}
                />
                <PropertyInput
                  label="End Y"
                  value={localProps.endPoint[1]}
                  type="number"
                  step={10}
                  onChange={(value) => {
                    const newPoint: [number, number, number] = [
                      localProps.endPoint[0],
                      parseFloat(value) || 0,
                      localProps.endPoint[2]
                    ]
                    handlePropertyChange('endPoint', newPoint)
                  }}
                />
                <PropertyInput
                  label="End Z"
                  value={localProps.endPoint[2]}
                  type="number"
                  step={10}
                  onChange={(value) => {
                    const newPoint: [number, number, number] = [
                      localProps.endPoint[0],
                      localProps.endPoint[1],
                      parseFloat(value) || 0
                    ]
                    handlePropertyChange('endPoint', newPoint)
                  }}
                />
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={updateLengthFromPoints}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Length from Points
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Update wall length based on start and end point positions</p>
                </TooltipContent>
              </Tooltip>
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

          {/* Calculated Properties */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-savage-text-muted uppercase tracking-wide flex items-center gap-2">
              <Box className="h-4 w-4" />
              Calculated Properties
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-800 p-2 rounded">
                <div className="text-savage-text-muted">Volume</div>
                <div className="font-mono">{(volume / 1e9).toFixed(3)} m³</div>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <div className="text-savage-text-muted">Surface Area</div>
                <div className="font-mono">{(surfaceArea / 1e6).toFixed(2)} m²</div>
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

export default WallPropertiesPanel
