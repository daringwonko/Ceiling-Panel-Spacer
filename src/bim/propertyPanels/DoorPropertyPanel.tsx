/**
 * DoorPropertyPanel - Door Configuration UI
 * 
 * React component for editing door properties including
 * dimensions, swing direction, and preset selection.
 */

import React, { useState, useCallback } from 'react';
import type { Door, DoorSwingDirection } from '../types';
import {
  DOOR_PRESETS,
  getDoorPresetById,
  getDoorSwingArcPath,
} from '../presets/DoorPresets';

interface DoorPropertyPanelProps {
  door: Door;
  onChange: (updates: Partial<Door>) => void;
  onValidate?: (valid: boolean, errors: string[]) => void;
}

const SWING_OPTIONS: { value: DoorSwingDirection; label: string; icon: string }[] = [
  { value: 'left', label: 'Left Swing', icon: '↩️' },
  { value: 'right', label: 'Right Swing', icon: '↪️' },
  { value: 'double', label: 'Double Swing', icon: '↔️' },
  { value: 'sliding', label: 'Sliding', icon: '➡️' },
];

export const DoorPropertyPanel: React.FC<DoorPropertyPanelProps> = ({
  door,
  onChange,
  onValidate,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);

  // Validate door properties
  const validate = useCallback((d: Door): boolean => {
    const newErrors: string[] = [];

    if (d.width < 600) newErrors.push('Width must be at least 600mm');
    if (d.width > 2400) newErrors.push('Width must not exceed 2400mm');
    if (d.height < 1800) newErrors.push('Height must be at least 1800mm');
    if (d.height > 2400) newErrors.push('Height must not exceed 2400mm');
    if (d.sillHeight < 0) newErrors.push('Sill height cannot be negative');
    if (d.frameWidth < 10) newErrors.push('Frame width must be at least 10mm');
    if (d.frameWidth > 100) newErrors.push('Frame width must not exceed 100mm');

    setErrors(newErrors);
    onValidate?.(newErrors.length === 0, newErrors);
    return newErrors.length === 0;
  }, [onValidate]);

  // Handle property change
  const handleChange = useCallback(
    (field: keyof Door, value: unknown) => {
      const updated = { ...door, [field]: value };
      validate(updated);
      onChange({ [field]: value });
    },
    [door, onChange, validate]
  );

  // Apply preset
  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = getDoorPresetById(presetId);
      if (preset) {
        setSelectedPreset(presetId);
        onChange({
          width: preset.width,
          height: preset.height,
          swingDirection: preset.swingDirection,
        });
      }
    },
    [onChange]
  );

  // Generate preview SVG path
  const previewPath = getDoorSwingArcPath(
    { x: 100, y: 150 },
    door.width * 0.1, // Scale down for preview
    door.swingDirection,
    0
  );

  return (
    <div className="door-property-panel">
      <h3>Door Properties</h3>

      {/* Preset Selection */}
      <div className="property-group">
        <label>Preset</label>
        <select
          value={selectedPreset}
          onChange={(e) => applyPreset(e.target.value)}
        >
          <option value="">Custom...</option>
          {DOOR_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.icon} {preset.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dimensions */}
      <div className="property-group">
        <h4>Dimensions</h4>
        
        <div className="property-row">
          <label>Width (mm)</label>
          <input
            type="number"
            value={door.width}
            min={600}
            max={2400}
            step={10}
            onChange={(e) => handleChange('width', parseInt(e.target.value))}
          />
        </div>

        <div className="property-row">
          <label>Height (mm)</label>
          <input
            type="number"
            value={door.height}
            min={1800}
            max={2400}
            step={10}
            onChange={(e) => handleChange('height', parseInt(e.target.value))}
          />
        </div>

        <div className="property-row">
          <label>Sill Height (mm)</label>
          <input
            type="number"
            value={door.sillHeight}
            min={0}
            max={500}
            step={10}
            onChange={(e) => handleChange('sillHeight', parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* Swing Direction */}
      <div className="property-group">
        <h4>Swing Direction</h4>
        <div className="swing-options">
          {SWING_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`swing-option ${door.swingDirection === option.value ? 'selected' : ''}`}
              onClick={() => handleChange('swingDirection', option.value)}
            >
              <span className="icon">{option.icon}</span>
              <span className="label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Frame */}
      <div className="property-group">
        <h4>Frame</h4>
        
        <div className="property-row">
          <label>Frame Width (mm)</label>
          <input
            type="number"
            value={door.frameWidth}
            min={10}
            max={100}
            step={5}
            onChange={(e) => handleChange('frameWidth', parseInt(e.target.value))}
          />
        </div>

        <div className="property-row">
          <label>Material</label>
          <select
            value={door.material}
            onChange={(e) => handleChange('material', e.target.value)}
          >
            <option value="wood">Wood</option>
            <option value="metal">Metal</option>
            <option value="aluminum">Aluminum</option>
            <option value="fiberglass">Fiberglass</option>
            <option value="upvc">uPVC</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="property-group">
        <h4>Preview</h4>
        <svg viewBox="0 0 200 300" className="door-preview">
          {/* Door frame */}
          <rect
            x={100 - door.width * 0.1}
            y={150 - door.height * 0.1}
            width={door.width * 0.2}
            height={door.height * 0.2}
            fill="none"
            stroke="#333"
            strokeWidth={2}
          />
          
          {/* Door panel */}
          <rect
            x={100 - (door.width - door.frameWidth * 2) * 0.1}
            y={150 - (door.height - door.frameWidth * 2) * 0.1}
            width={(door.width - door.frameWidth * 2) * 0.2}
            height={(door.height - door.frameWidth * 2) * 0.2}
            fill="#8B4513"
            stroke="none"
          />

          {/* Swing arc */}
          {previewPath && (
            <path
              d={previewPath}
              fill="rgba(79, 195, 247, 0.2)"
              stroke="#4fc3f7"
              strokeWidth={1}
              strokeDasharray="4,2"
            />
          )}
        </svg>
        <div className="preview-info">
          {door.width}mm × {door.height}mm
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="validation-errors">
          {errors.map((error, idx) => (
            <div key={idx} className="error">⚠️ {error}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoorPropertyPanel;