/**
 * RoofPropertyPanel - Roof Configuration UI
 * 
 * React component for editing roof properties including
 * slope angle, overhang, roof type, and 3D preview.
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { Roof, RoofType } from '../types';
import { RoofGenerator } from '../geometry/RoofGenerator';

interface RoofPropertyPanelProps {
  roof: Roof;
  onChange: (updates: Partial<Roof>) => void;
  onValidate?: (valid: boolean, errors: string[]) => void;
}

const ROOF_TYPE_OPTIONS: { value: RoofType; label: string; description: string }[] = [
  { value: 'gable', label: 'Gable', description: 'Triangular roof with two slopes' },
  { value: 'hip', label: 'Hip', description: 'Sloped on all sides' },
  { value: 'shed', label: 'Shed', description: 'Single slope' },
  { value: 'flat', label: 'Flat', description: 'Minimal slope for drainage' },
];

export const RoofPropertyPanel: React.FC<RoofPropertyPanelProps> = ({
  roof,
  onChange,
  onValidate,
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [calculation, setCalculation] = useState(
    RoofGenerator.generateRoof(roof)
  );

  // Recalculate when inputs change
  useEffect(() => {
    const calc = RoofGenerator.generateRoof(roof);
    setCalculation(calc);

    // Update ridge height
    if (Math.abs(calc.ridgeHeight - roof.ridgeHeight) > 1) {
      onChange({ ridgeHeight: calc.ridgeHeight });
    }
  }, [roof.slopeAngle, roof.overhang, roof.roofType, roof.basePoints]);

  // Validate roof properties
  const validate = useCallback((r: Roof): boolean => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    if (r.basePoints.length < 3) {
      newErrors.push('Roof base must have at least 3 points');
    }

    if (!RoofGenerator.isClosedWire(r.basePoints)) {
      newWarnings.push('Base wire is not closed');
    }

    if (r.slopeAngle < 0) newErrors.push('Slope angle cannot be negative');
    if (r.slopeAngle > 60) newWarnings.push('Slope angle > 60° may be impractical');
    
    if (r.roofType === 'flat' && r.slopeAngle > 5) {
      newWarnings.push('Flat roof with slope > 5° should use shed type');
    }

    if (r.overhang < 0) newErrors.push('Overhang cannot be negative');
    if (r.overhang > 1000) newWarnings.push('Overhang > 1000mm may be excessive');

    if (r.thickness < 10) newErrors.push('Thickness must be at least 10mm');
    if (r.thickness > 500) newErrors.push('Thickness must not exceed 500mm');

    const baseArea = RoofGenerator.calculatePolygonArea(r.basePoints);
    if (baseArea < 1000) newWarnings.push(`Base area ${baseArea.toFixed(0)}mm² is quite small`);

    setErrors(newErrors);
    setWarnings(newWarnings);
    onValidate?.(newErrors.length === 0, newErrors);
    return newErrors.length === 0;
  }, [onValidate]);

  // Handle property change
  const handleChange = useCallback(
    (field: keyof Roof, value: unknown) => {
      const updated = { ...roof, [field]: value };
      validate(updated);
      onChange({ [field]: value });
    },
    [roof, onChange, validate]
  );

  // Generate 2D outline
  const outlinePath = RoofGenerator.generate2DOutline(roof);

  return (
    <div className="roof-property-panel">
      <h3>Roof Properties</h3>

      {/* Roof Type */}
      <div className="property-group">
        <label>Roof Type</label>
        <div className="roof-type-options">
          {ROOF_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`roof-type-option ${roof.roofType === option.value ? 'selected' : ''}`}
              onClick={() => handleChange('roofType', option.value)}
              title={option.description}
            >
              <span className="label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Slope & Overhang */}
      <div className="property-group">
        <h4>Slope & Overhang</h4>
        
        <div className="property-row">
          <label>Slope Angle (degrees)</label>
          <input
            type="range"
            value={roof.slopeAngle}
            min={roof.roofType === 'flat' ? 1 : 5}
            max={60}
            step={1}
            onChange={(e) => handleChange('slopeAngle', parseInt(e.target.value))}
          />
          <span className="value-display">{roof.slopeAngle}°</span>
        </div>

        <div className="property-row">
          <label>Overhang (mm)</label>
          <input
            type="number"
            value={roof.overhang}
            min={0}
            max={1000}
            step={50}
            onChange={(e) => handleChange('overhang', parseInt(e.target.value))}
          />
        </div>

        <div className="calculated-values">
          <div className="calc-row">
            <span className="label">Ridge Height:</span>
            <span className="value">{calculation.ridgeHeight.toFixed(0)} mm</span>
          </div>
          <div className="calc-row">
            <span className="label">Roof Area:</span>
            <span className="value">{calculation.roofArea.toFixed(0)} mm²</span>
          </div>
          <div className="calc-row">
            <span className="label">Volume:</span>
            <span className="value">{calculation.volume.toFixed(0)} mm³</span>
          </div>
        </div>
      </div>

      {/* Thickness & Material */}
      <div className="property-group">
        <h4>Construction</h4>
        
        <div className="property-row">
          <label>Thickness (mm)</label>
          <input
            type="number"
            value={roof.thickness}
            min={10}
            max={500}
            step={10}
            onChange={(e) => handleChange('thickness', parseInt(e.target.value))}
          />
        </div>

        <div className="property-row">
          <label>Material</label>
          <select
            value={roof.material}
            onChange={(e) => handleChange('material', e.target.value)}
          >
            <option value="tile">Tile</option>
            <option value="shingle">Shingle</option>
            <option value="metal">Metal</option>
            <option value="slate">Slate</option>
            <option value="membrane">Membrane</option>
            <option value="concrete">Concrete</option>
          </select>
        </div>
      </div>

      {/* Base Wire Info */}
      <div className="property-group">
        <h4>Base Wire</h4>
        <div className="base-info">
          <div className="info-row">
            <span className="label">Points:</span>
            <span className="value">{roof.basePoints.length}</span>
          </div>
          <div className="info-row">
            <span className="label">Closed:</span>
            <span className="value">
              {RoofGenerator.isClosedWire(roof.basePoints) ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Base Area:</span>
            <span className="value">
              {RoofGenerator.calculatePolygonArea(roof.basePoints).toFixed(0)} mm²
            </span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="property-group">
        <h4>Plan View Preview</h4>
        {outlinePath && (
          <svg viewBox="0 0 200 200" className="roof-preview">
            {/* Base wire */}
            {roof.basePoints.length >= 3 && (
              <path
                d={RoofGenerator.generate2DOutline({ ...roof, overhang: 0 })}
                fill="rgba(200, 200, 200, 0.3)"
                stroke="#666"
                strokeWidth={1}
                strokeDasharray="4,2"
              />
            )}
            
            {/* Roof outline with overhang */}
            <path
              d={outlinePath}
              fill="rgba(139, 90, 43, 0.3)"
              stroke="#8B4513"
              strokeWidth={2}
            />

            {/* Ridge line for gable roofs */}
            {roof.roofType === 'gable' && calculation.faces.length >= 2 && (
              <line
                x1={calculation.faces[0].vertices[0].x * 0.1 + 100}
                y1={calculation.faces[0].vertices[0].y * 0.1 + 100}
                x2={calculation.faces[0].vertices[1].x * 0.1 + 100}
                y2={calculation.faces[0].vertices[1].y * 0.1 + 100}
                stroke="#333"
                strokeWidth={2}
              />
            )}
          </svg>
        )}
        <div className="preview-info">
          {roof.roofType.charAt(0).toUpperCase() + roof.roofType.slice(1)} |{' '}
          {roof.slopeAngle}° slope | {roof.overhang}mm overhang
        </div>
      </div>

      {/* Faces Info */}
      {calculation.faces.length > 0 && (
        <div className="property-group">
          <h4>Roof Faces</h4>
          <div className="faces-list">
            {calculation.faces.map((face, idx) => (
              <div key={face.id} className="face-item">
                <span className="face-number">{idx + 1}</span>
                <span className="face-info">
                  {face.vertices.length} vertices | {face.elevation.toFixed(0)}mm elevation
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

export default RoofPropertyPanel;