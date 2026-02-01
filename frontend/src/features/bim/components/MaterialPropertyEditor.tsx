import React, { useState, useEffect } from 'react';
import {
  Material,
  MaterialProperties,
  MaterialCategory,
  DEFAULT_MATERIAL_PROPERTIES,
  validateMaterialProperties,
  createMaterial
} from '../models/Material';

interface MaterialPropertyEditorProps {
  /** Material being edited (null for creating new) */
  material: Material | null;
  /** Callback when material is saved */
  onSave: (material: Material) => void;
  /** Callback when cancelled */
  onCancel: () => void;
}

/**
 * MaterialPropertyEditor Component
 * Form for editing material properties with live preview
 */
export const MaterialPropertyEditor: React.FC<MaterialPropertyEditorProps> = ({
  material,
  onSave,
  onCancel
}) => {
  const isEditing = material !== null;

  const [name, setName] = useState(material?.name || '');
  const [category, setCategory] = useState<MaterialCategory>(
    material?.category || MaterialCategory.CUSTOM
  );
  const [properties, setProperties] = useState<MaterialProperties>(
    material?.properties || DEFAULT_MATERIAL_PROPERTIES
  );
  const [description, setDescription] = useState(material?.description || '');
  const [errors, setErrors] = useState<string[]>([]);

  const categories = Object.values(MaterialCategory);

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!name.trim()) {
      newErrors.push('Name is required');
    }

    const propValidation = validateMaterialProperties(properties);
    if (!propValidation.valid) {
      newErrors.push(...propValidation.errors);
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    if (isEditing && material) {
      // Update existing
      const updated: Material = {
        ...material,
        name: name.trim(),
        category,
        properties,
        description: description.trim() || undefined,
        updatedAt: Date.now()
      };
      onSave(updated);
    } else {
      // Create new
      const newMaterial = createMaterial(
        `custom-${Date.now()}`,
        {
          name: name.trim(),
          category,
          properties,
          description: description.trim() || undefined
        },
        false
      );
      onSave(newMaterial);
    }
  };

  const handleReset = () => {
    if (material) {
      setName(material.name);
      setCategory(material.category);
      setProperties(material.properties);
      setDescription(material.description || '');
    } else {
      setName('');
      setCategory(MaterialCategory.CUSTOM);
      setProperties(DEFAULT_MATERIAL_PROPERTIES);
      setDescription('');
    }
    setErrors([]);
  };

  const updateProperty = <K extends keyof MaterialProperties>(
    key: K,
    value: MaterialProperties[K]
  ) => {
    setProperties(prev => ({ ...prev, [key]: value }));
  };

  // Color input change handler
  const handleColorChange = (colorType: 'color' | 'emissive', value: string) => {
    // Ensure hex format
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    updateProperty(colorType, value);
  };

  return (
    <div className="material-property-editor" style={{ padding: '16px' }}>
      <h3 style={{ marginBottom: '16px' }}>
        {isEditing ? 'Edit Material' : 'Create New Material'}
      </h3>

      {/* Error Display */}
      {errors.length > 0 && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '16px'
          }}
        >
          {errors.map((error, index) => (
            <div key={index} style={{ color: '#dc2626', fontSize: '14px' }}>
              • {error}
            </div>
          ))}
        </div>
      )}

      {/* Basic Info */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px'
          }}
          placeholder="Material name"
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
          Category
        </label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as MaterialCategory)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '14px',
            minHeight: '60px',
            resize: 'vertical'
          }}
          placeholder="Material description"
        />
      </div>

      {/* PBR Properties */}
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}
      >
        <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
          PBR Properties
        </h4>

        {/* Color */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Base Color
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="color"
              value={properties.color}
              onChange={e => handleColorChange('color', e.target.value)}
              style={{ width: '40px', height: '32px', padding: 0, border: 'none' }}
            />
            <input
              type="text"
              value={properties.color}
              onChange={e => handleColorChange('color', e.target.value)}
              style={{
                flex: 1,
                padding: '6px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '13px'
              }}
            />
          </div>
        </div>

        {/* Roughness */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Roughness: {properties.roughness.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={properties.roughness}
            onChange={e => updateProperty('roughness', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Metalness */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Metalness: {properties.metalness.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={properties.metalness}
            onChange={e => updateProperty('metalness', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Opacity */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Opacity: {properties.opacity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={properties.opacity}
            onChange={e => updateProperty('opacity', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Emissive */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Emissive Color
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="color"
              value={properties.emissive}
              onChange={e => handleColorChange('emissive', e.target.value)}
              style={{ width: '40px', height: '32px', padding: 0, border: 'none' }}
            />
            <input
              type="text"
              value={properties.emissive}
              onChange={e => handleColorChange('emissive', e.target.value)}
              style={{
                flex: 1,
                padding: '6px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '13px'
              }}
            />
          </div>
        </div>

        {/* Emissive Intensity */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Emissive Intensity: {properties.emissiveIntensity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={properties.emissiveIntensity}
            onChange={e => updateProperty('emissiveIntensity', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Live Preview */}
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          backgroundColor: '#f9fafb'
        }}
      >
        <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
          Preview
        </h4>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: properties.color,
              opacity: properties.opacity,
              boxShadow: `
                inset 0 0 20px rgba(0,0,0,${properties.roughness * 0.5}),
                ${properties.metalness > 0.5 ? '0 0 20px rgba(255,255,255,0.3)' : 'none'}
              `,
              border: `2px solid ${properties.metalness > 0.5 ? '#silver' : '#ddd'}`
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={handleReset}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Reset
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#3b82f6',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {isEditing ? 'Save Changes' : 'Create Material'}
        </button>
      </div>
    </div>
  );
};

export default MaterialPropertyEditor;
