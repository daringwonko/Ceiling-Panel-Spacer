import * as React from 'react'
import { useBIMStore, BIMObject } from '../../stores/useBIMStore'
import { WallPropertiesPanel } from './WallProperties'
import { BeamPropertiesPanel } from './BeamProperties'
import { ColumnPropertiesPanel } from './ColumnProperties'
import { SlabPropertiesPanel } from './SlabProperties'
import { WallData, BeamData, ColumnData, SlabData } from '../types/structural'
import { ValidationResult } from '../validators/StructuralValidator'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { AlertTriangle, Info } from 'lucide-react'

interface StructuralPropertyPanelProps {
  object?: BIMObject | null
  onUpdate?: (objectId: string, updates: any) => void
  onValidate?: (result: ValidationResult) => void
}

/**
 * Unified Structural Property Panel
 * 
 * Automatically detects the type of structural object and renders
 * the appropriate property panel. Integrates with BIMLayout and
 * the BIM store for real-time updates.
 */
export function StructuralPropertyPanel({ 
  object, 
  onUpdate, 
  onValidate 
}: StructuralPropertyPanelProps) {
  const { updateObject } = useBIMStore()

  // Handle property updates from child panels
  const handleUpdate = React.useCallback((updates: any) => {
    if (!object) return
    
    // Call external handler if provided
    onUpdate?.(object.id, updates)
    
    // Update in store
    updateObject(object.id, {
      properties: {
        ...object.properties,
        ...updates
      }
    })
  }, [object, onUpdate, updateObject])

  // Render appropriate panel based on object type
  const renderPanel = () => {
    if (!object) {
      return (
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-savage-text-muted">
              <Info className="h-5 w-5" />
              <p>Select a structural object to edit its properties</p>
            </div>
          </CardContent>
        </Card>
      )
    }

    switch (object.type) {
      case 'wall':
        return (
          <WallPropertiesPanel
            wall={object as WallData}
            onUpdate={handleUpdate}
            onValidate={onValidate}
          />
        )
      
      case 'beam':
        return (
          <BeamPropertiesPanel
            beam={object as BeamData}
            onUpdate={handleUpdate}
            onValidate={onValidate}
          />
        )
      
      case 'column':
        return (
          <ColumnPropertiesPanel
            column={object as ColumnData}
            onUpdate={handleUpdate}
            onValidate={onValidate}
          />
        )
      
      case 'slab':
        return (
          <SlabPropertiesPanel
            slab={object as SlabData}
            onUpdate={handleUpdate}
            onValidate={onValidate}
          />
        )
      
      default:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Unsupported Object Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-savage-text-muted">
                Property editing is not supported for objects of type: <strong>{object.type}</strong>
              </p>
              <p className="text-sm text-savage-text-muted mt-2">
                Supported types: wall, beam, column, slab
              </p>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="structural-property-panel">
      {renderPanel()}
    </div>
  )
}

/**
 * Hook to get the currently selected structural object
 */
export function useSelectedStructuralObject(): BIMObject | null {
  const { getSelectedObjects } = useBIMStore()
  const selectedObjects = getSelectedObjects()
  
  // Return first selected object if it's a structural type
  if (selectedObjects.length > 0) {
    const firstObject = selectedObjects[0]
    const structuralTypes = ['wall', 'beam', 'column', 'slab']
    if (structuralTypes.includes(firstObject.type)) {
      return firstObject
    }
  }
  
  return null
}

/**
 * Properties Panel Container with BIMLayout integration
 */
export function PropertiesSidebar() {
  const selectedObject = useSelectedStructuralObject()
  const [lastValidation, setLastValidation] = React.useState<ValidationResult | null>(null)

  return (
    <div className="properties-sidebar w-80 bg-savage-surface border-l border-slate-700 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Properties</h3>
        
        <StructuralPropertyPanel
          object={selectedObject}
          onValidate={setLastValidation}
        />
        
        {lastValidation && !lastValidation.valid && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
            <strong>Validation Errors:</strong>
            <ul className="mt-1 list-disc list-inside">
              {lastValidation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default StructuralPropertyPanel
