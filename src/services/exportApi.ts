/**
 * Export API Service
 * 
 * Provides backend API integration for export operations.
 * Handles DXF generation, batch exports, and file downloads.
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/** Export format types */
export type ExportFormat = 'dxf' | 'svg' | 'ifc' | 'png';

/** Export scope options */
export type ExportScope = 'all' | 'selection' | 'current_view';

/** Scale preset options */
export interface ScalePreset {
  /** Display label */
  label: string;
  /** Scale value (e.g., 0.02 for 1:50) */
  value: number;
  /** Common architectural scales */
  isCommon?: boolean;
}

/** Common scale presets for architectural drawings */
export const SCALE_PRESETS: ScalePreset[] = [
  { label: '1:1 (Full Size)', value: 1.0, isCommon: true },
  { label: '1:2', value: 0.5 },
  { label: '1:5', value: 0.2 },
  { label: '1:10', value: 0.1 },
  { label: '1:20', value: 0.05, isCommon: true },
  { label: '1:50', value: 0.02, isCommon: true },
  { label: '1:100', value: 0.01, isCommon: true },
  { label: '1:200', value: 0.005 },
  { label: '1:500', value: 0.002 },
  { label: '1:1000', value: 0.001 }
];

/** Batch export item */
export interface BatchExportItem {
  /** Item ID */
  id: string;
  /** Item type (sheet, section, view3d) */
  type: 'sheet' | 'section' | 'view3d';
  /** Display name */
  name: string;
  /** Export format */
  format: ExportFormat;
  /** Scale for export */
  scale: number;
  /** Additional options */
  options?: Record<string, unknown>;
}

/** Batch export request */
export interface BatchExportRequest {
  /** Array of items to export */
  items: BatchExportItem[];
  /** Output format for archive */
  archiveFormat: 'zip' | 'tar';
  /** Include project metadata file */
  includeMetadata: boolean;
}

/** Batch export response */
export interface BatchExportResponse {
  /** Success status */
  success: boolean;
  /** Archive content as base64-encoded string */
  archiveContent?: string;
  /** Archive filename */
  filename?: string;
  /** File size in bytes */
  fileSize?: number;
  /** Number of items processed */
  itemsProcessed?: number;
  /** Error message if failed */
  error?: string;
}

/** Export progress update */
export interface ExportProgress {
  /** Current item being processed */
  currentItem: string;
  /** Items processed so far */
  itemsProcessed: number;
  /** Total items */
  totalItems: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
  /** Status message */
  status: 'pending' | 'processing' | 'completed' | 'error';
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Generate DXF file via backend API
 * 
 * @param objects - Array of serialized 2D objects
 * @param layers - Layer configuration
 * @param scale - Export scale factor
 * @returns Promise resolving to DXF Blob
 */
export async function generateDXF(
  objects: import('../utils/dxfExport').DXFObjectData[],
  layers: import('../utils/dxfExport').LayerMapping,
  scale: number = 1.0
): Promise<Blob> {
  const response = await fetch('/api/export/dxf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      objects,
      layers,
      scale,
      precision: 6
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `DXF generation failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success || !data.dxfContent) {
    throw new Error(data.error || 'DXF generation failed');
  }
  
  // Decode base64 to Blob
  const binaryString = atob(data.dxfContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: 'application/dxf' });
}

/**
 * Generate batch export via backend API
 * 
 * @param items - Array of items to export
 * @param archiveFormat - Format for archive (zip or tar)
 * @param includeMetadata - Include project metadata file
 * @returns Promise resolving to archive Blob
 */
export async function generateBatchExport(
  items: BatchExportItem[],
  archiveFormat: 'zip' | 'tar' = 'zip',
  includeMetadata: boolean = true
): Promise<Blob> {
  const request: BatchExportRequest = {
    items,
    archiveFormat,
    includeMetadata
  };
  
  const response = await fetch('/api/export/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Batch export failed: ${response.statusText}`);
  }
  
  const data: BatchExportResponse = await response.json();
  
  if (!data.success || !data.archiveContent) {
    throw new Error(data.error || 'Batch export failed');
  }
  
  // Decode base64 to Blob
  const binaryString = atob(data.archiveContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const contentType = archiveFormat === 'zip' ? 'application/zip' : 'application/tar';
  return new Blob([bytes], { type: contentType });
}

/**
 * Generate IFC file via backend API
 * 
 * @param projectData - Project data for IFC generation
 * @returns Promise resolving to IFC Blob
 */
export async function generateIFC(
  projectData: Record<string, unknown>
): Promise<Blob> {
  const response = await fetch('/api/export/ifc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(projectData)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `IFC generation failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success || !data.ifcContent) {
    throw new Error(data.error || 'IFC generation failed');
  }
  
  // Decode base64 to Blob
  const binaryString = atob(data.ifcContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: 'application/x-step' });
}

/**
 * Stream export progress for long-running operations
 * 
 * @param exportId - Export operation ID
 * @param onProgress - Callback for progress updates
 * @param interval - Polling interval in ms (default: 500)
 * @returns Promise that resolves when export completes
 */
export async function streamExportProgress(
  exportId: string,
  onProgress: (progress: ExportProgress) => void,
  interval: number = 500
): Promise<void> {
  const poll = async (): Promise<void> => {
    const response = await fetch(`/api/export/progress/${exportId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get export progress: ${response.statusText}`);
    }
    
    const progress: ExportProgress = await response.json();
    onProgress(progress);
    
    if (progress.status === 'processing') {
      // Continue polling
      setTimeout(poll, interval);
    }
    // Resolve when status is 'completed' or 'error'
  };
  
  await poll();
}

/**
 * Cancel an ongoing export operation
 * 
 * @param exportId - Export operation ID to cancel
 * @returns Promise resolving when cancelled
 */
export async function cancelExport(exportId: string): Promise<void> {
  const response = await fetch(`/api/export/cancel/${exportId}`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to cancel export: ${response.statusText}`);
  }
}

/**
 * Get supported export formats from backend
 * 
 * @returns Promise resolving to array of supported formats
 */
export async function getSupportedFormats(): Promise<ExportFormat[]> {
  const response = await fetch('/api/export/formats');
  
  if (!response.ok) {
    // Return default formats if API not available
    return ['dxf', 'svg'];
  }
  
  return response.json();
}

/**
 * Validate export configuration before starting
 * 
 * @param format - Export format
 * @param scope - Export scope
 * @param itemCount - Number of items to export
 * @returns Promise resolving to validation result
 */
export async function validateExport(
  format: ExportFormat,
  scope: ExportScope,
  itemCount: number
): Promise<{ valid: boolean; warnings?: string[] }> {
  const response = await fetch('/api/export/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ format, scope, itemCount })
  });
  
  if (!response.ok) {
    // Return valid by default if API not available
    return { valid: true };
  }
  
  return response.json();
}

// ============================================================================
// Download Helpers
// ============================================================================

/**
 * Trigger file download from Blob
 * 
 * @param blob - File Blob
 * @param filename - Download filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger file download from base64 content
 * 
 * @param base64Content - Base64-encoded file content
 * @param filename - Download filename
 * @param contentType - MIME type
 */
export function downloadBase64(
  base64Content: string,
  filename: string,
  contentType: string
): void {
  const binaryString = atob(base64Content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const blob = new Blob([bytes], { type: contentType });
  downloadBlob(blob, filename);
}
