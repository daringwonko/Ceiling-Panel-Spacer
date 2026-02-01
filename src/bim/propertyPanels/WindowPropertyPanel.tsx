/**
 * WindowPropertyPanel - Window Configuration UI
 * 
 * React component for editing window properties including
 * dimensions, type, sill height, and preset selection.
 */

import React, { useState, useCallback } from 'react';
import type { Window, WindowType } from '../types';
import {
  WINDOW_PRESETS,
  WINDOW_TYPES,
  getWindowPresetById,
  checkEgressRequirements,
} from '../presets/WindowPresets';

interface WindowPropertyPanelProps {
  window: Window;
  onChange: (updates: Partial<Window>) => void;
  onValidate?: (valid: boolean, errors: string[]) => void;
}

export const WindowPropertyPanel: React.FC<WindowPropertyPanelProps> = ({
  window,
  onChange,
  onValidate,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Validate window properties
  const validate = useCallback((w: Window): boolean => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    if (w.width < 300) newErrors.push('Width must be at least 300mm');
    if (w.width > 2400) newErrors.push('Width must not exceed 2400mm');
    if (w.height < 300) newErrors.push('Height must be at least 300mm');
    if (w.height > 2400) newErrors.push('Height must not exceed 2400mm');
    if (w.sillHeight < 0) newErrors.push('Sill height cannot be negative');
    if (w.frameWidth < 10) newErrors.push('Frame width must be at least 10mm');
    if (w.frameWidth > 100) newErrors.push('Frame width must not exceed 100mm');
    if (w.glassThickness < 3) newErrors.push('Glass thickness must be at least 3mm');
    if (w.glassThickness > 20) newErrors.push('Glass thickness must not exceed 20mm');

    // Check egress requirements
    const egress = checkEgressRequirements(w.width, w.height, w.sillHeight);
    if (!egress.meetsCode) {
      newWarnings.push(...egress.issues.map((i) => `Egress: ${i}`));
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    onValidate?.(newErrors.length === 0, newErrors);
    return newErrors.length === 0;
  }, [onValidate]);

  // Handle property change
  const handleChange = useCallback(
    (field: keyof Window, value: unknown) => {
      const updated = { ...window, [field]: value };
      validate(updated);
      onChange({ [field]: value });
    },
    [window, onChange, validate]
  );

  // Apply preset
  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = getWindowPresetById(presetId);
      if (preset) {
        setSelectedPreset(presetId);
        onChange({
          width: preset.width,
          height: preset.height,
          sillHeight: preset.sillHeight,
          windowType: preset.windowType,
        });
      }
    },
    [onChange]
  );

  return (
    <div className="window-property-panel">
      <h3>Window Properties</h3>

      {/* Preset Selection */}
      <div className="property-group">
        <label>Preset</label>
        <select
          value={selectedPreset}
          onChange={(e) => applyPreset(e.target.value)}
        >
          <option value="">Custom...</option>
          <optgroup label="Standard">
            {WINDOW_PRESETS.filter((p) => p.category === 'standard').map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.icon} {preset.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Large">
            {WINDOW_PRESETS.filter((p) => p.category === 'large').map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.icon} {preset.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Bathroom">
            {WINDOW_PRESETS.filter((p) => p.category === 'bathroom').map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.icon} {preset.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Specialty">
            {WINDOW_PRESETS.filter((p) => p.category === 'specialty').map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.icon} {preset.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Window Type */}
      <div className="property-group">
        <label>Type</label>
        <div className="type-options">
          {WINDOW_TYPES.map((type) => (
            <button
              key={type.id}
              className={`type-option ${window.windowType === type.id ? 'selected' : ''}`}
              onClick={() => handleChange('windowType', type.id)}
              title={type.description}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div className="property-group">
        <h4>Dimensions</h4>
        
        <div className="property-row">
          <label>Width (mm)</label>
          <input
            type="number"
            value={window.width}
            min={300}
            max={2400}
            step={10}
            onChange={(e) => handleChange('width', parseInt(e.target.value))}
          />
        </div>

        <div className="property-row">
          <label>Height (mm)</label>
          <input
            type="number"
            value={window.height}
            min={300}
            max={2400}
            step={10}
            onChange={(e) => handleChange('height', parseInt(e.target.value))}
          />
        </div>

        <div className="property-row">
          <label>Sill Height (mm)</label>
          <input
            type="number"
            value={window.sillHeight}
            min={0}
            max={2000}
            step={10}
            onChange={(e) => handleChange('sillHeight', parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* Frame & Glass */}
      <div className="property-group">
        <h4>Frame & Glass</h4>
        
        <div className="property-row">
          <label>Frame Width (mm)</label>
          <input
            type="number"
            value={window.frameWidth}
            min={10}
            max={100}
            step={5}
            onChange={(e) => handleChange('frameWidth', parseInt(e.target.value))}
          />
        </div>

        <div className="property-row">
          <label>Glass Thickness (mm)</label>
          <input
            type="number"
            value={window.glassThickness}
            min={3}
            max={20}
            step={1}
            onChange={(e) => handleChange('glassThickness', parseInt(e.target.value))}
          />
        </div>

        <div className="property-row">
          <label>Material</label>
          <select
            value={window.material}
            onChange={(e) => handleChange('material', e.target.value)}
          >
            <option value="wood">Wood</option>
            <option value="metal">Metal</option>
            <option value="aluminum">Aluminum</option>
            <option value="upvc">uPVC</option>
            <option value="composite">Composite</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="property-group">
        <h4>Preview</h4>
        <svg viewBox="0 0 200 200" className="window-preview">
          {/* Window frame */}
          <rect
            x={100 - window.width * 0.05}
            y={100 - window.height * 0.05}
            width={window.width * 0.1}
            height={window.height * 0.1}
            fill="none"
            stroke="#333"
            strokeWidth={window.frameWidth * 0.1}
          />
          
          {/* Glass */}
          <rect
            x={100 - (window.width - window.frameWidth * 2) * 0.05}
            y={100 - (window.height - window.frameWidth * 2) * 0.05}
            width={(window.width - window.frameWidth * 2) * 0.1}
            height={(window.height - window.frameWidth * 2) * 0.1}
            fill="rgba(135, 206, 235, 0.6)"
            stroke="none"
          />

          {/* Window type indicators */}
          {window.windowType === 'doubleHung' && (
            <>
              <line
                x1={100 - (window.width - window.frameWidth * 2) * 0.05}
                y1={100}
                x2={100 + (window.width - window.frameWidth * 2) * 0.05}
                y2={100}
                stroke="#333"
                strokeWidth={1}
              />
            </>
          )}
          {window.windowType === 'sliding' && (
            <line
              x1={100}
              y1={100 - (window.height - window.frameWidth * 2) * 0.05}
              x2={100}
              y2={100 + (window.height - window.frameWidth * 2) * 0.05}
              stroke="#333"
              strokeWidth={1}
            />
          )}
        </svg>
        <div className="preview-info">
          {window.width}mm × {window.height}mm
        </div>
      </div>

      {/* Validation */}
      {errors.length > 0 && (
        <div className="validation-errors">
          {errors.map((error, idx) => (
            <div key={idx} className="error">⚠️ {error}</div>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="validation-warnings">
          {warnings.map((warning, idx) => (
            <div key={idx} className="warning">ℹ️ {warning}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WindowPropertyPanel;