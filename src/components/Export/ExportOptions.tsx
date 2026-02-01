/**
 * Export Options Panel Component
 * 
 * Provides export configuration options including format selection,
 * scope options, scale settings, and filename configuration.
 */

import React, { useState, useEffect } from 'react';
import { ExportFormat, ExportScope, SCALE_PRESETS } from '../../services/exportApi';

// ============================================================================
// Types and Interfaces
// ============================================================================

/** Export options state */
export interface ExportOptionsState {
  /** Selected export format */
  format: ExportFormat;
  /** Export scope (all, selection, current view) */
  scope: ExportScope;
  /** Export scale value */
  scale: number;
  /** Custom filename (auto-generated if empty) */
  filename: string;
  /** Include annotations */
  includeAnnotations: boolean;
  /** Include dimensions */
  includeDimensions: boolean;
  /** Layer-specific options */
  layers: {
    panels: boolean;
    gaps: boolean;
    annotations: boolean;
    dimensions: boolean;
  };
}

/** Component props */
export interface ExportOptionsProps {
  /** Current export options */
  options: ExportOptionsState;
  /** Callback when options change */
  onChange: (options: ExportOptionsState) => void;
  /** Available export formats (from backend) */
  availableFormats?: ExportFormat[];
  /** Whether current view has content */
  hasContent: boolean;
  /** Whether there's a selection */
  hasSelection: boolean;
  /** Project name for default filename */
  projectName?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Export Options Panel Component
 */
export function ExportOptions({
  options,
  onChange,
  availableFormats = ['dxf', 'svg'],
  hasContent,
  hasSelection,
  projectName = 'ceiling_project'
}: ExportOptionsProps) {
  const [customScale, setCustomScale] = useState<string>('');
  
  // Handle format change
  const handleFormatChange = (format: ExportFormat) => {
    onChange({ ...options, format });
  };
  
  // Handle scope change
  const handleScopeChange = (scope: ExportScope) => {
    onChange({ ...options, scope });
  };
  
  // Handle scale change
  const handleScaleChange = (value: number) => {
    onChange({ ...options, scale: value });
    setCustomScale('');
  };
  
  // Handle custom scale input
  const handleCustomScaleChange = (value: string) => {
    setCustomScale(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onChange({ ...options, scale: numValue });
    }
  };
  
  // Handle filename change
  const handleFilenameChange = (filename: string) => {
    onChange({ ...options, filename });
  };
  
  // Handle layer toggle
  const handleLayerToggle = (layer: keyof typeof options.layers) => {
    onChange({
      ...options,
      layers: { ...options.layers, [layer]: !options.layers[layer] }
    });
  };
  
  // Handle include toggle
  const handleIncludeToggle = (item: 'annotations' | 'dimensions') => {
    onChange({ ...options, [item]: !options[item as keyof ExportOptionsState] });
  };
  
  // Generate preview filename
  const generateFilename = () => {
    const base = projectName || 'ceiling_export';
    const scopeSuffix = options.scope === 'selection' ? '_selection' : '';
    return `${base}${scopeSuffix}_${Date.now()}`;
  };
  
  // Get current scale label
  const getCurrentScaleLabel = () => {
    const preset = SCALE_PRESETS.find(p => p.value === options.scale);
    return preset ? preset.label : `1:${Math.round(1 / options.scale)}`;
  };
  
  return (
    <div className="export-options">
      {/* Format Selection */}
      <div className="option-section">
        <h4>Export Format</h4>
        <div className="format-buttons">
          {availableFormats.includes('dxf') && (
            <button
              className={`format-btn ${options.format === 'dxf' ? 'active' : ''}`}
              onClick={() => handleFormatChange('dxf')}
              title="AutoCAD Drawing Exchange Format"
            >
              <span className="format-icon">D</span>
              <span className="format-name">DXF</span>
              <span className="format-desc">CAD Software</span>
            </button>
          )}
          {availableFormats.includes('svg') && (
            <button
              className={`format-btn ${options.format === 'svg' ? 'active' : ''}`}
              onClick={() => handleFormatChange('svg')}
              title="Scalable Vector Graphics"
            >
              <span className="format-icon">S</span>
              <span className="format-name">SVG</span>
              <span className="format-desc">Web & Print</span>
            </button>
          )}
          {availableFormats.includes('ifc') && (
            <button
              className={`format-btn ${options.format === 'ifc' ? 'active' : ''}`}
              onClick={() => handleFormatChange('ifc')}
              title="Industry Foundation Classes"
            >
              <span className="format-icon">I</span>
              <span className="format-name">IFC</span>
              <span className="format-desc">BIM Exchange</span>
            </button>
          )}
          {availableFormats.includes('png') && (
            <button
              className={`format-btn ${options.format === 'png' ? 'active' : ''}`}
              onClick={() => handleFormatChange('png')}
              title="Portable Network Graphics"
            >
              <span className="format-icon">P</span>
              <span className="format-name">PNG</span>
              <span className="format-desc">Raster Image</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Export Scope */}
      <div className="option-section">
        <h4>Export Scope</h4>
        <div className="scope-options">
          <label className={`scope-option ${options.scope === 'all' ? 'active' : ''}`}>
            <input
              type="radio"
              name="scope"
              value="all"
              checked={options.scope === 'all'}
              onChange={() => handleScopeChange('all')}
              disabled={!hasContent}
            />
            <div className="scope-content">
              <span className="scope-name">All Objects</span>
              <span className="scope-desc">Export entire ceiling layout</span>
            </div>
          </label>
          <label className={`scope-option ${options.scope === 'selection' ? 'active' : ''}`}>
            <input
              type="radio"
              name="scope"
              value="selection"
              checked={options.scope === 'selection'}
              onChange={() => handleScopeChange('selection')}
              disabled={!hasSelection}
            />
            <div className="scope-content">
              <span className="scope-name">Current Selection</span>
              <span className="scope-desc">Export only selected elements</span>
            </div>
          </label>
          <label className={`scope-option ${options.scope === 'current_view' ? 'active' : ''}`}>
            <input
              type="radio"
              name="scope"
              value="current_view"
              checked={options.scope === 'current_view'}
              onChange={() => handleScopeChange('current_view')}
              disabled={!hasContent}
            />
            <div className="scope-content">
              <span className="scope-name">Current View</span>
              <span className="scope-desc">Export visible content only</span>
            </div>
          </label>
        </div>
      </div>
      
      {/* Scale Selection */}
      <div className="option-section">
        <h4>Drawing Scale</h4>
        <div className="scale-selector">
          <select
            value={SCALE_PRESETS.some(p => p.value === options.scale) ? '' : 'custom'}
            onChange={(e) => {
              if (e.target.value !== 'custom') {
                const preset = SCALE_PRESETS[parseInt(e.target.value)];
                if (preset) handleScaleChange(preset.value);
              }
            }}
            className="scale-preset-select"
          >
            <option value="">Common Scales</option>
            {SCALE_PRESETS.filter(p => p.isCommon).map((preset, index) => (
              <option key={index} value={index}>{preset.label}</option>
            ))}
            <option value="-1">──────────</option>
            {SCALE_PRESETS.filter(p => !p.isCommon).map((preset, index) => (
              <option key={`other-${index}`} value={index + 100}>{preset.label}</option>
            ))}
            <option value="custom">Custom Scale...</option>
          </select>
          
          {!SCALE_PRESETS.some(p => p.value === options.scale) && (
            <input
              type="number"
              value={customScale}
              onChange={(e) => handleCustomScaleChange(e.target.value)}
              placeholder="Scale value"
              step="0.001"
              min="0.0001"
              className="custom-scale-input"
            />
          )}
          
          <span className="scale-preview">
            Current: {getCurrentScaleLabel()}
          </span>
        </div>
      </div>
      
      {/* Filename */}
      <div className="option-section">
        <h4>Filename</h4>
        <div className="filename-input">
          <input
            type="text"
            value={options.filename}
            onChange={(e) => handleFilenameChange(e.target.value)}
            placeholder={generateFilename()}
            className="filename-field"
          />
          <button
            type="button"
            onClick={() => handleFilenameChange('')}
            className="auto-name-btn"
            title="Generate auto filename"
          >
            Auto
          </button>
        </div>
      </div>
      
      {/* Include Options (for SVG/PNG) */}
      {(options.format === 'svg' || options.format === 'png') && (
        <div className="option-section">
          <h4>Include</h4>
          <div className="toggle-options">
            <label className="toggle-item">
              <input
                type="checkbox"
                checked={options.includeAnnotations}
                onChange={() => handleIncludeToggle('annotations')}
              />
              <span>Annotations</span>
            </label>
            <label className="toggle-item">
              <input
                type="checkbox"
                checked={options.includeDimensions}
                onChange={() => handleIncludeToggle('dimensions')}
              />
              <span>Dimensions</span>
            </label>
          </div>
        </div>
      )}
      
      {/* Layer Options (for DXF) */}
      {options.format === 'dxf' && (
        <div className="option-section">
          <h4>Layers to Export</h4>
          <div className="layer-toggles">
            <label className="toggle-item">
              <input
                type="checkbox"
                checked={options.layers.panels}
                onChange={() => handleLayerToggle('panels')}
              />
              <span>Panels</span>
            </label>
            <label className="toggle-item">
              <input
                type="checkbox"
                checked={options.layers.gaps}
                onChange={() => handleLayerToggle('gaps')}
              />
              <span>Gaps</span>
            </label>
            <label className="toggle-item">
              <input
                type="checkbox"
                checked={options.layers.annotations}
                onChange={() => handleLayerToggle('annotations')}
              />
              <span>Annotations</span>
            </label>
            <label className="toggle-item">
              <input
                type="checkbox"
                checked={options.layers.dimensions}
                onChange={() => handleLayerToggle('dimensions')}
              />
              <span>Dimensions</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default ExportOptions;
