/**
 * StairsPropertyPanel - Stairs Configuration UI
 * 
 * React component for editing stairs properties including
 * rise/run calculations, path configuration, and real-time preview.
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { Stairs, StairPathType } from '../types';
import { StairsGenerator, BUILDING_CODES } from '../geometry/StairsGenerator';

interface StairsPropertyPanelProps {
  stairs: Stairs;
  onChange: (updates: Partial<Stairs>) => void;
  onValidate?: (valid: boolean, errors: string[]) => void;
}

const PATH_TYPE_OPTIONS: { value: StairPathType; label: string; icon: string }[] = [
  { value: 'straight', label: 'Straight', icon: '➡️' },
  { value: 'lShape', label: 'L-Shape', icon: '└' },
  { value: 'uShape', label: 'U-Shape', icon: '∩' },
];

export const StairsPropertyPanel: React.FC<StairsPropertyPanelProps> = ({
  stairs,
  onChange,
  onValidate,
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [calculation, setCalculation] = useState(
    StairsGenerator.calculateOptimalDimensions(stairs.totalRise, stairs.treadDepth)
  );

  // Recalculate when inputs change
  useEffect(() => {
    const calc = StairsGenerator.calculateOptimalDimensions(
      stairs.totalRise,
      stairs.treadDepth
    );
    setCalculation(calc);

    // Auto-update derived values
    if (Math.abs(calc.stairCount - stairs.stairCount) > 0 ||
        Math.abs(calc.riserHeight - stairs.riserHeight) > 0.1 ||
        Math.abs(calc.totalRun - stairs.totalRun) > 1) {
      onChange({
        stairCount: calc.stairCount,
        riserHeight: calc.riserHeight,
        totalRun: calc.totalRun,
      });
    }
  }, [stairs.totalRise, stairs.treadDepth]);

  // Validate stairs properties
  const validate = useCallback((s: Stairs): boolean => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    if (s.totalRise < 500) newErrors.push('Total rise must be at least 500mm');
    if (s.totalRise > 5000) newErrors.push('Total rise must not exceed 5000mm');
    if (s.totalRun < 500) newErrors.push('Total run must be at least 500mm');
    if (s.totalRun > 10000) newErrors.push('Total run must not exceed 10000mm');
    if (s.stairWidth < BUILDING_CODES.minStairWidth) {
      newErrors.push(`Stair width must be at least ${BUILDING_CODES.minStairWidth}mm`);
    }
    if (s.stairWidth > 1500) newWarnings.push('Stair width > 1500mm may be excessive');

    // Check building codes
    if (s.riserHeight < BUILDING_CODES.minRiserHeight) {
      newErrors.push(`Riser height ${s.riserHeight.toFixed(1)}mm is below code minimum ${BUILDING_CODES.minRiserHeight}mm`);
    }
    if (s.riserHeight > BUILDING_CODES.maxRiserHeight) {
      newErrors.push(`Riser height ${s.riserHeight.toFixed(1)}mm exceeds code maximum ${BUILDING_CODES.maxRiserHeight}mm`);
    }
    if (s.treadDepth < BUILDING_CODES.minTreadDepth) {
      newErrors.push(`Tread depth ${s.treadDepth.toFixed(1)}mm is below code minimum ${BUILDING_CODES.minTreadDepth}mm`);
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    onValidate?.(newErrors.length === 0, newErrors);
    return newErrors.length === 0;
  }, [onValidate]);

  // Handle property change
  const handleChange = useCallback(
    (field: keyof Stairs, value: unknown) => {
      const updated = { ...stairs, [field]: value };
      validate(updated);
      onChange({ [field]: value });
    },
    [stairs, onChange, validate]
  );

  // Generate step preview
  const stepPreview = StairsGenerator.generateSteps(
    stairs.pathPoints.length > 1 ? stairs.pathPoints : [{ x: 0, y: 0 }, { x: 200, y: 0 }],
    stairs.totalRise,
    stairs.stairWidth
  );

  return (
    <div className="stairs-property-panel">
      <h3>Stairs Properties</h3>

      {/* Path Type */}
      <div className="property-group">
        <label>Path Type</label>
        <div className="path-type-options">
          {PATH_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`path-type-option ${stairs.pathType === option.value ? 'selected' : ''}`}
              onClick={() => handleChange('pathType', option.value)}
            >
              <span className="icon">{option.icon}</span>
              <span className="label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Total Rise & Run */}
      <div className="property-group">
        <h4>Overall Dimensions</h4>
        
        <div className="property-row">
          <label>Total Rise (mm)</label>
          <input
            type="number"
            value={stairs.totalRise}
            min={500}
            max={5000}
            step={10}
            onChange={(e) => handleChange('totalRise', parseInt(e.target.value))}
          />
        </div>

        <div className="property-row">
          <label>Total Run (mm)</label>
          <input
            type="number"
            value={stairs.totalRun}
            min={500}
            max={10000}
            step={10}
            onChange={(e) => handleChange('totalRun', parseInt(e.target.value))}
          />
        </div>

        <div className="property-row">
          <label>Stair Width (mm)</label>
          <input
            type="number"
            value={stairs.stairWidth}
            min={860}
            max={1500}
            step={10}
            onChange={(e) => handleChange('stairWidth', parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* Step Configuration */}
      <div className="property-group">
        <h4>Step Configuration</h4>
        
        <div className="property-row">
          <label>Tread Depth (mm)</label>
          <input
            type="number"
            value={stairs.treadDepth}
            min={250}
            max={355}
            step={5}
            onChange={(e) => handleChange('treadDepth', parseInt(e.target.value))}
          />
        </div>

        <div className="calculated-values">
          <div className="calc-row">
            <span className="label">Number of Stairs:</span>
            <span className="value">{calculation.stairCount}</span>
          </div>
          <div className="calc-row">
            <span className="label">Riser Height:</span>
            <span className="value">{calculation.riserHeight.toFixed(1)} mm</span>
          </div>
          <div className="calc-row">
            <span className="label">Slope:</span>
            <span className="value">{calculation.slope.toFixed(1)}°</span>
          </div>
        </div>
      </div>

      {/* Landing */}
      {stairs.pathType !== 'straight' && (
        <div className="property-group">
          <h4>Landing</h4>
          
          <div className="property-row">
            <label>Landing Depth (mm)</label>
            <input
              type="number"
              value={stairs.landingDepth}
              min={900}
              max={1500}
              step={50}
              onChange={(e) => handleChange('landingDepth', parseInt(e.target.value))}
            />
          </div>
        </div>
      )}

      {/* Material */}
      <div className="property-group">
        <h4>Material</h4>
        
        <div className="property-row">
          <label>Material</label>
          <select
            value={stairs.material}
            onChange={(e) => handleChange('material', e.target.value)}
          >
            <option value="concrete">Concrete</option>
            <option value="wood">Wood</option>
            <option value="steel">Steel</option>
            <option value="glass">Glass</option>
            <option value="marble">Marble</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div className="property-group">
        <h4>Preview</h4>
        <svg viewBox="0 0 300 200" className="stairs-preview">
          {/* Draw stair steps */}
          {stepPreview.map((step, i) => (
            <g key={i}>
              {/* Tread */}
              <rect
                x={step.treadStart.x * 0.5 + 50}
                y={150 - (step.cumulativeRise / stairs.totalRise) * 100}
                width={Math.sqrt(
                  Math.pow(step.treadEnd.x - step.treadStart.x, 2) +
                  Math.pow(step.treadEnd.y - step.treadStart.y, 2)
                ) * 0.5}
                height={(stairs.riserHeight / stairs.totalRise) * 100}
                fill="#d4d4d4"
                stroke="#666"
                strokeWidth={1}
              />
              {/* Step number */}
              {i < 5 && (
                <text
                  x={(step.treadStart.x + step.treadEnd.x) * 0.25 + 50}
                  y={145 - (step.cumulativeRise / stairs.totalRise) * 100}
                  fontSize={8}
                  fill="#666"
                >
                  {i + 1}
                </text>
              )}
            </g>
          ))}
          
          {/* Rise dimension */}
          <text x={10} y={100} fontSize={10} fill="#333" transform="rotate(-90 10 100)">
            Rise: {stairs.totalRise}mm
          </text>
        </svg>
        <div className="preview-info">
          {calculation.stairCount} stairs | {calculation.riserHeight.toFixed(0)}mm rise |{' '}
          {stairs.treadDepth}mm tread
        </div>
      </div>

      {/* Code Compliance */}
      <div className="property-group">
        <h4>Code Compliance</h4>
        <div className={`compliance-status ${calculation.passesCode ? 'pass' : 'fail'}`}>
          {calculation.passesCode ? '✅ Passes Building Code' : '❌ Fails Building Code'}
        </div>
        {calculation.codeIssues.length > 0 && (
          <div className="code-issues">
            {calculation.codeIssues.map((issue, idx) => (
              <div key={idx} className="issue">⚠️ {issue}</div>
            ))}
          </div>
        )}
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

export default StairsPropertyPanel;