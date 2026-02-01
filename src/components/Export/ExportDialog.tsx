/**
 * Export Dialog Component
 * 
 * Modal dialog for exporting ceiling designs to various formats.
 * Provides format selection, scope options, scale settings, and preview.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ExportFormat, ExportScope, SCALE_PRESETS } from '../../services/exportApi';
import { exportToSVGBlob, exportToDXF } from '../../utils/svgExport';
import { downloadBlob } from '../../services/exportApi';
import ExportOptions, { ExportOptionsState } from './ExportOptions';

// ============================================================================
// Types and Interfaces
// ============================================================================

/** Component props */
export interface ExportDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Canvas elements to export */
  elements?: import('../../utils/svgExport').CanvasElement[];
  /** Current selection (if exporting selection) */
  selection?: import('../../utils/svgExport').CanvasElement[];
  /** Project name */
  projectName?: string;
  /** Default export format */
  defaultFormat?: ExportFormat;
  /** Callback after successful export */
  onExportComplete?: (filename: string, format: ExportFormat) => void;
}

/** Export state */
interface ExportState {
  /** Current export status */
  status: 'idle' | 'exporting' | 'success' | 'error';
  /** Error message if failed */
  error: string | null;
  /** Preview SVG/data URL */
  preview: string | null;
  /** Exporting item name */
  currentItem: string;
}

/** Default export options */
const DEFAULT_EXPORT_OPTIONS: ExportOptionsState = {
  format: 'dxf',
  scope: 'all',
  scale: 0.02, // 1:50 scale
  filename: '',
  includeAnnotations: true,
  includeDimensions: true,
  layers: {
    panels: true,
    gaps: true,
    annotations: true,
    dimensions: true
  }
};

// ============================================================================
// Component
// ============================================================================

/**
 * Export Dialog Component
 */
export function ExportDialog({
  isOpen,
  onClose,
  elements = [],
  selection = [],
  projectName = 'ceiling_project',
  defaultFormat = 'dxf',
  onExportComplete
}: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptionsState>({
    ...DEFAULT_EXPORT_OPTIONS,
    format: defaultFormat
  });
  const [exportState, setExportState] = useState<ExportState>({
    status: 'idle',
    error: null,
    preview: null,
    currentItem: ''
  });
  
  // Get elements to export based on scope
  const getExportElements = useCallback(() => {
    switch (options.scope) {
      case 'selection':
        return selection.length > 0 ? selection : elements;
      case 'current_view':
        return elements; // Would filter to visible in production
      default:
        return elements;
    }
  }, [options.scope, selection, elements]);
  
  // Generate preview when options change
  useEffect(() => {
    if (!isOpen) return;
    
    const generatePreview = async () => {
      if (options.format === 'svg') {
        const exportElements = getExportElements();
        try {
          const { blob } = exportToSVGBlob(
            exportElements,
            { width: 200, height: 150 },
            projectName
          );
          const previewUrl = URL.createObjectURL(blob);
          setExportState(prev => ({ ...prev, preview: previewUrl }));
          
          return () => URL.revokeObjectURL(previewUrl);
        } catch (err) {
          console.error('Preview generation failed:', err);
        }
      } else {
        setExportState(prev => ({ ...prev, preview: null }));
      }
    };
    
    generatePreview();
  }, [isOpen, options.format, options.scope, getExportElements, projectName]);
  
  // Handle export
  const handleExport = async () => {
    setExportState({
      status: 'exporting',
      error: null,
      preview: exportState.preview,
      currentItem: 'Preparing export...'
    });
    
    try {
      const exportElements = getExportElements();
      const filename = options.filename || `${projectName}_${Date.now()}`;
      
      if (options.format === 'svg') {
        // SVG export - client-side
        setExportState(prev => ({ ...prev, currentItem: 'Generating SVG...' }));
        const { blob, filename: fullFilename } = exportToSVGBlob(
          exportElements,
          {},
          projectName,
          filename
        );
        downloadBlob(blob, fullFilename);
        
        setExportState({
          status: 'success',
          error: null,
          preview: exportState.preview,
          currentItem: fullFilename
        });
        
        onExportComplete?.(fullFilename, 'svg');
        
      } else if (options.format === 'dxf') {
        // DXF export - via backend API
        setExportState(prev => ({ ...prev, currentItem: 'Generating DXF...' }));
        const { downloadDXF } = await import('../../utils/dxfExport');
        await downloadDXF(exportElements, { scale: options.scale }, projectName, filename);
        
        setExportState({
          status: 'success',
          error: null,
          preview: exportState.preview,
          currentItem: `${filename}.dxf`
        });
        
        onExportComplete?.(`${filename}.dxf`, 'dxf');
        
      } else {
        // IFC, PNG - via backend API
        setExportState(prev => ({ ...prev, currentItem: `Generating ${options.format.toUpperCase()}...` }));
        
        // Import export API dynamically
        const { generateIFC, downloadBlob: apiDownloadBlob } = await import('../../services/exportApi');
        
        if (options.format === 'ifc') {
          const blob = await generateIFC({
            projectName,
            elements: exportElements,
            scale: options.scale
          });
          apiDownloadBlob(blob, `${filename}.ifc`);
        } else if (options.format === 'png') {
          // Would call PNG generation API
          throw new Error('PNG export not yet implemented');
        }
        
        setExportState({
          status: 'success',
          error: null,
          preview: exportState.preview,
          currentItem: `${filename}.${options.format}`
        });
        
        onExportComplete?.(`${filename}.${options.format}`, options.format);
      }
      
    } catch (error) {
      setExportState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Export failed',
        preview: exportState.preview,
        currentItem: ''
      });
    }
  };
  
  // Handle close
  const handleClose = () => {
    setExportState({
      status: 'idle',
      error: null,
      preview: null,
      currentItem: ''
    });
    onClose();
  };
  
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        // Ctrl+Enter to export
        if (exportState.status !== 'exporting') {
          handleExport();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, exportState.status]);
  
  // Don't render if not open
  if (!isOpen) return null;
  
  // Get export count for preview
  const exportElements = getExportElements();
  const objectCount = exportElements.length;
  
  return (
    <div className="export-dialog-overlay" onClick={handleClose}>
      <div 
        className="export-dialog" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
      >
        {/* Header */}
        <div className="dialog-header">
          <h2 id="export-dialog-title">Export Ceiling Design</h2>
          <button 
            className="close-btn" 
            onClick={handleClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="dialog-content">
          {/* Preview Panel */}
          <div className="preview-panel">
            <h4>Preview</h4>
            <div className="preview-container">
              {exportState.preview ? (
                <img 
                  src={exportState.preview} 
                  alt="Export preview" 
                  className="preview-image"
                />
              ) : (
                <div className="preview-placeholder">
                  <span className="preview-icon">📄</span>
                  <span className="preview-text">
                    {options.format.toUpperCase()} Preview
                  </span>
                </div>
              )}
            </div>
            <div className="preview-info">
              <span>{objectCount} object{objectCount !== 1 ? 's' : ''}</span>
              <span>{options.scope.replace('_', ' ')}</span>
            </div>
          </div>
          
          {/* Options Panel */}
          <div className="options-panel">
            <ExportOptions
              options={options}
              onChange={setOptions}
              hasContent={elements.length > 0}
              hasSelection={selection.length > 0}
              projectName={projectName}
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="dialog-footer">
          {exportState.status === 'exporting' && (
            <div className="export-status">
              <div className="spinner"></div>
              <span>{exportState.currentItem}</span>
            </div>
          )}
          
          {exportState.status === 'success' && (
            <div className="export-success">
              <span className="success-icon">✓</span>
              <span>Exported: {exportState.currentItem}</span>
            </div>
          )}
          
          {exportState.status === 'error' && (
            <div className="export-error">
              <span className="error-icon">⚠</span>
              <span>{exportState.error}</span>
            </div>
          )}
          
          <div className="footer-actions">
            <button
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={exportState.status === 'exporting'}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={exportState.status === 'exporting' || objectCount === 0}
            >
              {exportState.status === 'exporting' ? (
                <>
                  <span className="btn-spinner"></span>
                  Exporting...
                </>
              ) : (
                <>Export {options.format.toUpperCase()}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default ExportDialog;
