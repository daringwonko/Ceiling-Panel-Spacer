/**
 * ObjectPropertiesPanel Component
 * 
 * Panel for editing selected BIM object properties including material and layer assignment.
 * Integrates with the material and layer systems.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { BIMObject } from '../../../stores/useBIMStore';
import { useMaterials } from '../hooks/useMaterials';
import { useLayers } from '../hooks/useLayers';
import { MaterialPreview } from './MaterialPreview';
import { Material } from '../models/Material';
import { Layer } from '../models/Layer';

interface ObjectPropertiesPanelProps {
  /** Selected object */
  object: BIMObject | null;
  /** Callback when material is assigned */
  onMaterialAssign?: (objectId: string, materialId: string | null) => void;
  /** Callback when layer is assigned */
  onLayerAssign?: (objectId: string, layerId: string) => void;
  /** Callback when object properties are updated */
  onObjectUpdate?: (objectId: string, updates: Partial<BIMObject>) => void;
  /** Additional className */
  className?: string;
}

/**
 * Format number for display with 2 decimal places
 */
const formatNumber = (value: number): string => {
  return value.toFixed(2);
};

/**
 * Position input component
 */
const PositionInput: React.FC<{
  label: string;
  value: [number, number, number];
  onChange: (newValue: [number, number, number]) => void;
  disabled?: boolean;
}> = ({ label, value, onChange, disabled }) => {
  const handleChange = useCallback((index: number, newValue: string) => {
    const num = parseFloat(newValue);
    if (!isNaN(num)) {
      const newPosition: [number, number, number] = [...value] as [number, number, number];
      newPosition[index] = num;
      onChange(newPosition);
    }
  }, [value, onChange]);

  return (
    <div style={{ marginBottom: '8px' }}>
      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '4px' }}>
        {['X', 'Y', 'Z'].map((axis, index) => (
          <div key={axis} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#9ca3af', width: '12px' }}>{axis}</span>
            <input
              type="number"
              value={formatNumber(value[index])}
              onChange={(e) => handleChange(index, e.target.value)}
              disabled={disabled}
              step="0.1"
              style={{
                flex: 1,
                padding: '4px 6px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '3px',
                width: '100%'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ObjectPropertiesPanel: React.FC<ObjectPropertiesPanelProps> = ({
  object,
  onMaterialAssign,
  onLayerAssign,
  onObjectUpdate,
  className = ''
}) => {
  const { 
    materials, 
    getMaterialById,
    selectMaterial: selectMaterialForEdit
  } = useMaterials();
  
  const { 
    layers, 
    getLayerById, 
    activeLayerId,
    setActiveLayer 
  } = useLayers();

  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');

  // Get current material
  const currentMaterial = useMemo(() => {
    if (!object?.material) return null;
    return materials.find(m => m.id === object.material) || null;
  }, [object?.material, materials]);

  // Get current layer
  const currentLayer = useMemo(() => {
    if (!object?.layer) return null;
    return getLayerById(object.layer) || null;
  }, [object?.layer, getLayerById]);

  // Filtered materials for picker
  const filteredMaterials = useMemo(() => {
    if (!materialSearchQuery.trim()) return materials;
    const query = materialSearchQuery.toLowerCase();
    return materials.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query)
    );
  }, [materials, materialSearchQuery]);

  const handleMaterialSelect = useCallback((material: Material | null) => {
    if (object) {
      onMaterialAssign?.(object.id, material?.id || null);
    }
    setShowMaterialPicker(false);
  }, [object, onMaterialAssign]);

  const handleLayerSelect = useCallback((layerId: string) => {
    if (object) {
      onLayerAssign?.(object.id, layerId);
    }
  }, [object, onLayerAssign]);

  const handlePositionChange = useCallback((newPosition: [number, number, number]) => {
    if (object) {
      onObjectUpdate?.(object.id, { position: newPosition });
    }
  }, [object, onObjectUpdate]);

  const handleRotationChange = useCallback((newRotation: [number, number, number]) => {
    if (object) {
      onObjectUpdate?.(object.id, { rotation: newRotation });
    }
  }, [object, onObjectUpdate]);

  const handleScaleChange = useCallback((newScale: [number, number, number]) => {
    if (object) {
      onObjectUpdate?.(object.id, { scale: newScale });
    }
  }, [object, onObjectUpdate]);

  const handleNameChange = useCallback((newName: string) => {
    if (object) {
      onObjectUpdate?.(object.id, { name: newName });
    }
  }, [object, onObjectUpdate]);

  if (!object) {
    return (
      <div className={`object-properties-panel ${className}`} style={{ padding: '16px' }}>
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
          Select an object to view and edit its properties
        </div>
      </div>
    );
  }

  return (
    <div className={`object-properties-panel ${className}`} style={{ 
      fontFamily: 'system-ui, sans-serif',
      height: '100%',
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ 
          fontSize: '11px', 
          color: '#6b7280', 
          textTransform: 'uppercase',
          marginBottom: '4px',
          letterSpacing: '0.5px'
        }}>
          {object.type}
        </div>
        <input
          type="text"
          value={object.name}
          onChange={(e) => handleNameChange(e.target.value)}
          style={{
            width: '100%',
            fontSize: '16px',
            fontWeight: 600,
            border: '1px solid transparent',
            borderRadius: '3px',
            padding: '4px 8px',
            backgroundColor: 'transparent',
            ':hover': { borderColor: '#d1d5db' },
            ':focus': { 
              borderColor: '#3b82f6',
              backgroundColor: 'white',
              outline: 'none'
            }
          }}
        />
      </div>

      {/* Transform Section */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <h4 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '12px', 
          fontWeight: 600,
          color: '#374151',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Transform
        </h4>
        
        <PositionInput
          label="Position"
          value={object.position}
          onChange={handlePositionChange}
        />
        
        <PositionInput
          label="Rotation"
          value={object.rotation}
          onChange={handleRotationChange}
        />
        
        <PositionInput
          label="Scale"
          value={object.scale}
          onChange={handleScaleChange}
        />
      </div>

      {/* Material Section */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <h4 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '12px', 
          fontWeight: 600,
          color: '#374151',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Material
        </h4>

        {currentMaterial ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            marginBottom: '12px'
          }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '4px',
              backgroundColor: currentMaterial.properties.color,
              opacity: currentMaterial.properties.opacity,
              boxShadow: `
                inset 0 0 10px rgba(0,0,0,${currentMaterial.properties.roughness * 0.3}),
                ${currentMaterial.properties.metalness > 0.5 ? '0 0 5px rgba(255,255,255,0.3)' : 'none'}
              `,
              border: `1px solid ${currentMaterial.properties.metalness > 0.5 ? '#silver' : '#e5e7eb'}`
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                {currentMaterial.name}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'capitalize' }}>
                {currentMaterial.category}
              </div>
            </div>
            <button
              onClick={() => handleMaterialSelect(null)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                color: '#dc2626'
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div style={{ 
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            marginBottom: '12px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '13px'
          }}>
            No material assigned
          </div>
        )}

        <button
          onClick={() => setShowMaterialPicker(true)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            border: '1px solid #3b82f6',
            borderRadius: '4px',
            backgroundColor: '#3b82f6',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          {currentMaterial ? 'Change Material' : 'Assign Material'}
        </button>

        {/* Quick material buttons */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '4px',
          marginTop: '8px' 
        }}>
          {materials.slice(0, 8).map(material => (
            <button
              key={material.id}
              onClick={() => handleMaterialSelect(material)}
              style={{
                height: '28px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                backgroundColor: material.properties.color,
                cursor: 'pointer',
                opacity: object.material === material.id ? 0.5 : 1,
                boxShadow: object.material === material.id ? 'inset 0 0 0 2px #3b82f6' : 'none'
              }}
              title={material.name}
            />
          ))}
        </div>
      </div>

      {/* Layer Section */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <h4 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '12px', 
          fontWeight: 600,
          color: '#374151',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Layer
        </h4>

        <select
          value={object.layer || ''}
          onChange={(e) => handleLayerSelect(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          <option value="">-- Select Layer --</option>
          {layers.map(layer => (
            <option key={layer.id} value={layer.id}>
              {layer.locked ? '🔒 ' : ''}{layer.name}
            </option>
          ))}
        </select>

        {currentLayer && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#f9fafb',
            borderRadius: '4px'
          }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: currentLayer.color,
                borderRadius: '2px'
              }}
            />
            <span style={{ fontSize: '13px', flex: 1 }}>{currentLayer.name}</span>
            {!currentLayer.visible && (
              <span style={{ fontSize: '10px', color: '#dc2626' }}>Hidden</span>
            )}
            {currentLayer.locked && (
              <span style={{ fontSize: '10px', color: '#dc2626' }}>Locked</span>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div style={{ padding: '12px 16px' }}>
        <h4 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '12px', 
          fontWeight: 600,
          color: '#374151',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Info
        </h4>

        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 500 }}>ID:</span> {object.id}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 500 }}>Type:</span> {object.type}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 500 }}>Level:</span> {object.level || 'N/A'}
          </div>
          <div>
            <span style={{ fontWeight: 500 }}>Selected:</span> {object.isSelected ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Material Picker Modal */}
      {showMaterialPicker && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}
            onClick={() => setShowMaterialPicker(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              zIndex: 1001,
              width: '400px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Select Material</h3>
            
            <input
              type="text"
              placeholder="Search materials..."
              value={materialSearchQuery}
              onChange={(e) => setMaterialSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '8px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {filteredMaterials.map(material => (
                <div
                  key={material.id}
                  onClick={() => handleMaterialSelect(material)}
                  style={{
                    padding: '8px',
                    border: `2px solid ${object.material === material.id ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: object.material === material.id ? '#eff6ff' : 'white'
                  }}
                >
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '1',
                    borderRadius: '4px',
                    backgroundColor: material.properties.color,
                    opacity: material.properties.opacity,
                    marginBottom: '6px',
                    boxShadow: `
                      inset 0 0 10px rgba(0,0,0,${material.properties.roughness * 0.3}),
                      ${material.properties.metalness > 0.5 ? '0 0 5px rgba(255,255,255,0.3)' : 'none'}
                    `
                  }} />
                  <div style={{ 
                    fontSize: '10px', 
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {material.name}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setShowMaterialPicker(false)}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleMaterialSelect(null)}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  border: '1px solid #dc2626',
                  borderRadius: '4px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Remove Material
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ObjectPropertiesPanel;
