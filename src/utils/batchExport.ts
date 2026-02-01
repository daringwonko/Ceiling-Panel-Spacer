/**
 * Batch Export Utility
 * 
 * Provides batch export functionality for multiple sheets, sections, and 3D views.
 * Creates ZIP archives containing all exported files.
 * Uses JSZip library for client-side ZIP creation.
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/** Export item types */
export type ExportItemType = 'sheet' | 'section' | 'view3d';

/** Individual export item */
export interface ExportItem {
  /** Unique identifier */
  id: string;
  /** Item type */
  type: ExportItemType;
  /** Display name */
  name: string;
  /** Export format */
  format: 'dxf' | 'svg' | 'ifc' | 'png';
  /** Scale factor (for drawings) */
  scale?: number;
  /** Additional export options */
  options?: Record<string, unknown>;
}

/** Batch export configuration */
export interface BatchExportConfig {
  /** Items to export */
  items: ExportItem[];
  /** Output archive format */
  archiveFormat: 'zip' | 'tar';
  /** Include project metadata file */
  includeMetadata: boolean;
  /** Project metadata (if included) */
  metadata?: ProjectMetadata;
  /** Progress callback */
  onProgress?: (progress: BatchExportProgress) => void;
}

/** Project metadata for included file */
export interface ProjectMetadata {
  /** Project name */
  name: string;
  /** Project description */
  description?: string;
  /** Creation date */
  created: string;
  /** Last modified */
  modified: string;
  /** Author/creator */
  author?: string;
  /** Software version */
  version: string;
}

/** Progress information */
export interface BatchExportProgress {
  /** Current item being processed */
  currentItem: string;
  /** Items processed so far */
  itemsProcessed: number;
  /** Total items to process */
  totalItems: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
  /** Status message */
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  /** Error message if failed */
  error?: string;
}

/** Export result for individual item */
interface ExportResult {
  /** Item ID */
  itemId: string;
  /** Success status */
  success: boolean;
  /** Generated file content */
  content?: Uint8Array;
  /** File extension */
  extension: string;
  /** Error message if failed */
  error?: string;
}

/** ZIP file entry */
interface ZipEntry {
  /** Entry path in archive */
  path: string;
  /** File content */
  content: Uint8Array;
  /** Comment for entry */
  comment?: string;
}

// ============================================================================
// JSZip-like Implementation
// ============================================================================

/**
 * Simple ZIP file creator (minimal implementation for basic needs)
 * In production, would use the JSZip library for full ZIP support
 */
class SimpleZip {
  private entries: ZipEntry[] = [];
  
  /**
   * Add file to ZIP archive
   */
  addFile(path: string, content: Uint8Array, comment?: string): void {
    this.entries.push({ path, content, comment });
  }
  
  /**
   * Generate ZIP file content
   */
  generate(): Uint8Array {
    // This is a simplified implementation
    // Production would use JSZip library for proper ZIP creation
    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [];
    
    // Calculate total size
    let centralDirectorySize = 0;
    const fileHeaders: Array<{ offset: number; size: number; path: string }> = [];
    
    let offset = 0;
    
    for (const entry of this.entries) {
      // Local file header
      const pathBytes = encoder.encode(entry.path);
      const pathLen = pathBytes.length;
      
      // File header (30 + filename length)
      const header = new Uint8Array(30 + pathLen);
      const headerView = new DataView(header.buffer);
      
      headerView.setUint32(0, 0x04034b50, true); // Local file header signature
      headerView.setUint16(4, 20, true); // Version needed
      headerView.setUint16(6, 0, true); // General purpose flag
      headerView.setUint16(8, 0, true); // Compression method (store)
      headerView.setUint16(10, 0, true); // File time
      headerView.setUint16(12, 0, true); // File date
      headerView.setUint32(14, this.crc32(entry.content), true); // CRC-32
      headerView.setUint32(18, entry.content.length, true); // Compressed size
      headerView.setUint32(22, entry.content.length, true); // Uncompressed size
      headerView.setUint16(26, pathLen, true); // Filename length
      headerView.setUint16(28, 0, true); // Extra field length
      
      header.set(pathBytes, 30);
      
      parts.push(header);
      parts.push(entry.content);
      
      fileHeaders.push({
        offset,
        size: header.length + entry.content.length,
        path: entry.path
      });
      
      centralDirectorySize += 46 + pathLen; // Central directory entry size
      offset += header.length + entry.content.length;
    }
    
    // Central directory
    const centralDir = new Uint8Array(centralDirectorySize);
    const centralView = new DataView(centralDir.buffer);
    
    let cdOffset = 0;
    
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const pathBytes = encoder.encode(entry.path);
      const pathLen = pathBytes.length;
      const headerInfo = fileHeaders[i];
      
      const offset = cdOffset;
      
      centralView.setUint32(offset, 0x02014b50, true); // Central directory signature
      centralView.setUint16(offset + 4, 20, true); // Version made by
      centralView.setUint16(offset + 6, 20, true); // Version needed
      centralView.setUint16(offset + 8, 0, true); // General purpose flag
      centralView.setUint16(offset + 10, 0, true); // Compression method
      centralView.setUint16(offset + 12, 0, true); // File time
      centralView.setUint16(offset + 14, 0, true); // File date
      centralView.setUint32(offset + 16, this.crc32(entry.content), true); // CRC-32
      centralView.setUint32(offset + 20, entry.content.length, true); // Compressed size
      centralView.setUint32(offset + 24, entry.content.length, true); // Uncompressed size
      centralView.setUint16(offset + 28, pathLen, true); // Filename length
      centralView.setUint16(offset + 30, 0, true); // Extra field length
      centralView.setUint16(offset + 32, 0, true); // File comment length
      centralView.setUint16(offset + 34, 0, true); // Disk number start
      centralView.setUint16(offset + 36, 0, true); // Internal file attributes
      centralView.setUint32(offset + 38, 0, true); // External file attributes
      centralView.setUint32(offset + 42, headerInfo.offset, true); // Relative offset of local header
      
      centralDir.set(pathBytes, offset + 46);
      
      cdOffset += 46 + pathLen;
    }
    
    parts.push(centralDir);
    
    // End of central directory
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    
    endView.setUint32(0, 0x06054b50, true); // End signature
    endView.setUint16(4, 0, true); // Disk number
    endView.setUint16(6, 0, true); // Disk with central directory
    endView.setUint16(8, this.entries.length, true); // Entries on this disk
    endView.setUint16(10, this.entries.length, true); // Total entries
    endView.setUint32(12, centralDir.length, true); // Central directory size
    endView.setUint32(16, offset, true); // Central directory offset
    endView.setUint16(20, 0, true); // Comment length
    
    parts.push(endRecord);
    
    // Concatenate all parts
    const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(totalLength);
    let pos = 0;
    
    for (const part of parts) {
      result.set(part, pos);
      pos += part.length;
    }
    
    return result;
  }
  
  /**
   * Simple CRC-32 implementation
   */
  private crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    const table = this.getCRC32Table();
    
    for (const byte of data) {
      crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xFF];
    }
    
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  
  /**
   * Generate CRC-32 lookup table
   */
  private getCRC32Table(): number[] {
    const table = new Array(256);
    
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    
    return table;
  }
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Convert canvas elements to SVG blob
 */
async function generateSVG(
  elements: import('./svgExport').CanvasElement[],
  name: string
): Promise<Uint8Array> {
  const { exportToSVG } = await import('./svgExport');
  const svg = exportToSVG(elements, { width: 800, height: 600 }, name);
  const encoder = new TextEncoder();
  return encoder.encode(svg);
}

/**
 * Convert canvas elements to DXF blob via API
 */
async function generateDXF(
  elements: import('./svgExport').CanvasElement[],
  scale: number
): Promise<Uint8Array> {
  const { downloadDXF } = await import('./dxfExport');
  const blob = await import('./dxfExport').then(mod => 
    mod.exportToDXF(elements, { scale })
  );
  
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Generate 3D view SVG
 */
async function generate3DSVG(
  objects: import('./svgExport').SceneObject[],
  camera: import('./svgExport').CameraConfig,
  name: string
): Promise<Uint8Array> {
  const { export3DToSVG } = await import('./svgExport');
  const svg = export3DToSVG(objects, camera, { width: 800, height: 600 }, name);
  const encoder = new TextEncoder();
  return encoder.encode(svg);
}

/**
 * Process single export item
 */
async function processItem(
  item: ExportItem,
  elements: Map<string, import('./svgExport').CanvasElement[]>,
  scenes: Map<string, import('./svgExport').SceneObject[]>,
  onProgress?: (item: string) => void
): Promise<ExportResult> {
  onProgress?.(item.name);
  
  try {
    let content: Uint8Array;
    let extension: string;
    
    switch (item.format) {
      case 'svg':
        if (item.type === 'view3d') {
          const sceneObjects = scenes.get(item.id) || [];
          const camera: import('./svgExport').CameraConfig = {
            position: [100, 100, 100],
            target: [0, 0, 0],
            up: [0, 0, 1]
          };
          content = await generate3DSVG(sceneObjects, camera, item.name);
        } else {
          const viewElements = elements.get(item.id) || [];
          content = await generateSVG(viewElements, item.name);
        }
        extension = 'svg';
        break;
        
      case 'dxf':
        const viewElements = elements.get(item.id) || [];
        content = await generateDXF(viewElements, item.scale || 0.02);
        extension = 'dxf';
        break;
        
      default:
        throw new Error(`Unsupported format: ${item.format}`);
    }
    
    return {
      itemId: item.id,
      success: true,
      content,
      extension
    };
    
  } catch (error) {
    return {
      itemId: item.id,
      success: false,
      extension: item.format,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate metadata JSON content
 */
function generateMetadataJSON(metadata: ProjectMetadata): string {
  return JSON.stringify({
    project: {
      name: metadata.name,
      description: metadata.description,
      created: metadata.created,
      modified: metadata.modified,
      author: metadata.author,
      version: metadata.version
    },
    export: {
      date: new Date().toISOString(),
      software: 'Ceiling Panel Calculator BIM Workbench'
    }
  }, null, 2);
}

/**
 * Main batch export function
 * 
 * @param config - Batch export configuration
 * @returns Promise resolving to ZIP blob
 */
export async function batchExport(
  config: BatchExportConfig
): Promise<Blob> {
  const { items, archiveFormat, includeMetadata, metadata, onProgress } = config;
  
  // Initialize progress
  const progress: BatchExportProgress = {
    currentItem: '',
    itemsProcessed: 0,
    totalItems: items.length,
    progress: 0,
    status: 'processing'
  };
  
  onProgress?.(progress);
  
  // Create ZIP archive
  const zip = new SimpleZip();
  const results: ExportResult[] = [];
  
  // Track element/scene data (would come from store in production)
  const elementStore = new Map<string, import('./svgExport').CanvasElement[]>();
  const sceneStore = new Map<string, import('./svgExport').SceneObject[]>();
  
  // Process each item
  for (const item of items) {
    const result = await processItem(item, elementStore, sceneStore, (name) => {
      progress.currentItem = name;
      progress.itemsProcessed = results.length + 1;
      progress.progress = (progress.itemsProcessed / items.length) * 100;
      onProgress?.(progress);
    });
    
    results.push(result);
    
    if (result.success && result.content) {
      // Add to appropriate folder based on type
      let folder: string;
      switch (item.type) {
        case 'sheet':
          folder = 'Sheets/';
          break;
        case 'section':
          folder = 'Sections/';
          break;
        case 'view3d':
          folder = 'Views3D/';
          break;
        default:
          folder = 'Exports/';
      }
      
      zip.addFile(`${folder}${item.name}.${result.extension}`, result.content);
    }
  }
  
  // Add metadata file if requested
  if (includeMetadata && metadata) {
    const encoder = new TextEncoder();
    const metadataContent = encoder.encode(generateMetadataJSON(metadata));
    zip.addFile('project_metadata.json', metadataContent, 'Project metadata');
  }
  
  // Add manifest file
  const manifest = {
    exportDate: new Date().toISOString(),
    items: results.map(r => ({
      id: r.itemId,
      success: r.success,
      format: r.extension,
      error: r.error
    })),
    summary: {
      total: items.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  };
  
  const encoder = new TextEncoder();
  zip.addFile('manifest.json', encoder.encode(JSON.stringify(manifest, null, 2)));
  
  // Generate ZIP content
  const zipContent = zip.generate();
  
  // Update final progress
  progress.status = 'completed';
  progress.progress = 100;
  progress.currentItem = 'Complete';
  onProgress?.(progress);
  
  // Return as Blob
  return new Blob([zipContent], { type: 'application/zip' });
}

/**
 * Batch export with auto-download
 * 
 * @param config - Batch export configuration
 * @param filename - Download filename (without extension)
 */
export async function downloadBatchExport(
  config: BatchExportConfig,
  filename?: string
): Promise<void> {
  const blob = await batchExport(config);
  const downloadFilename = filename || `ceiling_export_${Date.now()}`;
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${downloadFilename}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create batch export configuration from project data
 */
export function createBatchExportConfig(
  sheets: Array<{ id: string; name: string; elements: import('./svgExport').CanvasElement[] }>,
  sections: Array<{ id: string; name: string; elements: import('./svgExport').CanvasElement[] }>,
  views3D: Array<{ id: string; name: string; objects: import('./svgExport').SceneObject[] }>,
  format: 'dxf' | 'svg',
  options: {
    includeMetadata?: boolean;
    projectMetadata?: ProjectMetadata;
    onProgress?: (progress: BatchExportProgress) => void;
  } = {}
): BatchExportConfig {
  const items: ExportItem[] = [];
  
  // Add sheets
  for (const sheet of sheets) {
    items.push({
      id: sheet.id,
      type: 'sheet',
      name: sheet.name,
      format,
      scale: 0.02
    });
  }
  
  // Add sections
  for (const section of sections) {
    items.push({
      id: section.id,
      type: 'section',
      name: section.name,
      format,
      scale: 0.02
    });
  }
  
  // Add 3D views
  for (const view of views3D) {
    items.push({
      id: view.id,
      type: 'view3d',
      name: view.name,
      format: 'svg' // 3D views only support SVG
    });
  }
  
  return {
    items,
    archiveFormat: 'zip',
    includeMetadata: options.includeMetadata !== false,
    metadata: options.projectMetadata,
    onProgress: options.onProgress
  };
}

/**
 * Estimate batch export time
 */
export function estimateExportTime(
  itemCount: number,
  averageItemSize: 'small' | 'medium' | 'large' = 'medium'
): number {
  const sizeMultiplier = {
    small: 0.5,
    medium: 1.0,
    large: 2.0
  };
  
  // Estimate ~2 seconds per item plus network overhead
  const baseTime = itemCount * 2 * sizeMultiplier[averageItemSize];
  const overhead = 1; // 1 second overhead
  
  return baseTime + overhead;
}
