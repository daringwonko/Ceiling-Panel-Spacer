/**
 * Batch Export Progress Component
 * 
 * Displays progress indicator for batch export operations.
 * Shows current item, progress bar, estimated time, and cancellation option.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BatchExportProgress, batchExport, downloadBatchExport, ExportItem, ProjectMetadata } from '../../utils/batchExport';

// ============================================================================
// Types and Interfaces
// ============================================================================

/** Component props */
export interface BatchExportProgressProps {
  /** Export items to process */
  items: ExportItem[];
  /** Project metadata for export */
  projectMetadata?: ProjectMetadata;
  /** Export format */
  format: 'dxf' | 'svg';
  /** Whether to auto-start export */
  autoStart?: boolean;
  /** Callback when export completes */
  onComplete?: (filename: string) => void;
  /** Callback when export is cancelled */
  onCancel?: () => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
  /** Callback when progress updates */
  onProgress?: (progress: BatchExportProgress) => void;
}

/** Internal state */
interface State {
  progress: BatchExportProgress;
  isExporting: boolean;
  isComplete: boolean;
  error: string | null;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Batch Export Progress Component
 */
export function BatchExportProgress({
  items,
  projectMetadata,
  format,
  autoStart = false,
  onComplete,
  onCancel,
  onError,
  onProgress
}: BatchExportProgressProps) {
  const [state, setState] = useState<State>({
    progress: {
      currentItem: '',
      itemsProcessed: 0,
      totalItems: items.length,
      progress: 0,
      status: 'pending'
    },
    isExporting: false,
    isComplete: false,
    error: null
  });
  
  // Handle progress updates
  const handleProgress = useCallback((progress: BatchExportProgress) => {
    setState(prev => ({ ...prev, progress }));
    onProgress?.(progress);
  }, [onProgress]);
  
  // Start export
  const startExport = useCallback(async () => {
    if (state.isExporting) return;
    
    setState(prev => ({
      ...prev,
      isExporting: true,
      error: null
    }));
    
    try {
      await downloadBatchExport(
        {
          items,
          archiveFormat: 'zip',
          includeMetadata: true,
          metadata: projectMetadata,
          onProgress: handleProgress
        },
        projectMetadata?.name || 'ceiling_export'
      );
      
      setState(prev => ({
        ...prev,
        isExporting: false,
        isComplete: true,
        progress: {
          ...prev.progress,
          status: 'completed',
          progress: 100
        }
      }));
      
      onComplete?.(`${projectMetadata?.name || 'ceiling_export'}.zip`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      
      setState(prev => ({
        ...prev,
        isExporting: false,
        error: errorMessage,
        progress: {
          ...prev.progress,
          status: 'error',
          error: errorMessage
        }
      }));
      
      onError?.(errorMessage);
    }
  }, [items, projectMetadata, format, state.isExporting, handleProgress, onComplete, onError]);
  
  // Cancel export
  const cancelExport = useCallback(() => {
    if (!state.isExporting) return;
    
    setState(prev => ({
      ...prev,
      isExporting: false,
      progress: {
        ...prev.progress,
        status: 'cancelled',
        currentItem: 'Cancelled'
      }
    }));
    
    onCancel?.();
  }, [state.isExporting, onCancel]);
  
  // Retry export
  const retryExport = useCallback(() => {
    startExport();
  }, [startExport]);
  
  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && items.length > 0) {
      startExport();
    }
  }, [autoStart, items.length, startExport]);
  
  // Calculate estimated time remaining
  const getTimeRemaining = (): string => {
    const { progress } = state;
    if (progress.itemsProcessed === 0 || progress.status !== 'processing') {
      return '--:--';
    }
    
    const avgTimePerItem = 2; // Estimate 2 seconds per item
    const remainingItems = progress.totalItems - progress.itemsProcessed;
    const remainingSeconds = remainingItems * avgTimePerItem;
    
    if (remainingSeconds < 60) {
      return `${remainingSeconds}s`;
    }
    
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };
  
  // Get status message
  const getStatusMessage = (): string => {
    const { progress, error } = state;
    
    switch (progress.status) {
      case 'pending':
        return 'Ready to export';
      case 'processing':
        return 'Processing exports...';
      case 'completed':
        return 'Export complete!';
      case 'error':
        return `Error: ${error}`;
      case 'cancelled':
        return 'Export cancelled';
      default:
        return '';
    }
  };
  
  // Get icon based on status
  const getStatusIcon = (): React.ReactNode => {
    const { progress, error } = state;
    
    switch (progress.status) {
      case 'completed':
        return <span className="status-icon success">✓</span>;
      case 'error':
        return <span className="status-icon error">⚠</span>;
      case 'cancelled':
        return <span className="status-icon cancelled">⊘</span>;
      case 'processing':
        return (
          <span className="status-icon processing">
            <div className="spinner"></div>
          </span>
        );
      default:
        return <span className="status-icon pending">⏳</span>;
    }
  };
  
  // Don't render if no items
  if (items.length === 0) {
    return (
      <div className="batch-export-progress empty">
        <p>No items to export</p>
      </div>
    );
  }
  
  return (
    <div className="batch-export-progress">
      {/* Header */}
      <div className="progress-header">
        <h3>Batch Export</h3>
        <span className="item-count">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${state.progress.progress}%` }}
          />
        </div>
        <span className="progress-percent">
          {Math.round(state.progress.progress)}%
        </span>
      </div>
      
      {/* Current Item */}
      <div className="current-item">
        <div className="item-info">
          {getStatusIcon()}
          <span className="item-name">{state.progress.currentItem || 'Starting...'}</span>
        </div>
        <span className="item-counter">
          {state.progress.itemsProcessed} / {state.progress.totalItems}
        </span>
      </div>
      
      {/* Time Estimate */}
      <div className="time-estimate">
        <span className="time-label">Estimated time remaining:</span>
        <span className="time-value">{getTimeRemaining()}</span>
      </div>
      
      {/* Status Message */}
      <div className={`status-message ${state.progress.status}`}>
        {getStatusMessage()}
      </div>
      
      {/* Item List (collapsible) */}
      <details className="item-list-details">
        <summary>View items ({items.length})</summary>
        <ul className="item-list">
          {items.map((item, index) => (
            <li 
              key={item.id} 
              className={`item ${
                index < state.progress.itemsProcessed 
                  ? 'completed' 
                  : index === state.progress.itemsProcessed 
                    ? 'processing' 
                    : 'pending'
              }`}
            >
              <span className="item-status">
                {index < state.progress.itemsProcessed ? '✓' : 
                 index === state.progress.itemsProcessed ? '⋯' : '○'}
              </span>
              <span className="item-name">{item.name}</span>
              <span className="item-type">{item.type}</span>
              <span className="item-format">.{item.format}</span>
            </li>
          ))}
        </ul>
      </details>
      
      {/* Actions */}
      <div className="progress-actions">
        {state.progress.status === 'processing' && (
          <button
            className="btn btn-secondary"
            onClick={cancelExport}
          >
            Cancel
          </button>
        )}
        
        {(state.progress.status === 'pending' || state.progress.status === 'error' || state.progress.status === 'cancelled') && (
          <button
            className="btn btn-primary"
            onClick={startExport}
            disabled={state.isExporting}
          >
            {state.isExporting ? (
              <>
                <div className="btn-spinner"></div>
                Exporting...
              </>
            ) : (
              <>Start Export</>
            )}
          </button>
        )}
        
        {state.progress.status === 'error' && (
          <button
            className="btn btn-secondary"
            onClick={retryExport}
          >
            Retry
          </button>
        )}
        
        {state.isComplete && (
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default BatchExportProgress;
