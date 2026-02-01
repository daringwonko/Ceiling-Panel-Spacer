/**
 * DXF Export Utilities
 * 
 * Provides functions to export 2D canvas objects to DXF format.
 * Uses backend API for DXF generation via the ezdxf library.
 * Maps canvas objects to DXF entities (LINE, CIRCLE, ARC, LWPOLYLINE).
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/** Options for DXF export */
export interface DXFExportOptions {
  /** Export scale factor (default: 1.0) */
  scale?: number;
  /** Layer mapping configuration */
  layers?: LayerMapping;
  /** Export precision for coordinates (default: 6 decimal places) */
  precision?: number;
  /** Include metadata in DXF header (default: true) */
  includeMetadata?: boolean;
  /** Unit code for DXF header (default: 6 = Millimeters) */
  unit?: number;
}

/** Layer mapping configuration */
export interface LayerMapping {
  /** Layer name for different object types */
  objects: string;
  panels: string;
  gaps: string;
  dimensions: string;
  annotations: string;
  [key: string]: string;
}

/** Default layer mapping */
export const DEFAULT_LAYER_MAPPING: LayerMapping = {
  objects: 'OBJECTS',
  panels: 'PANELS',
  gaps: 'GAPS',
  dimensions: 'DIMENSIONS',
  annotations: 'ANNOTATIONS'
};

/** DXF entity types */
export type DXFEntityType = 'LINE' | 'CIRCLE' | 'ARC' | 'LWPOLYLINE' | 'TEXT' | 'DIMENSION';

/** Serialized object for API */
export interface DXFObjectData {
  /** Object ID */
  id: string;
  /** Entity type */
  type: DXFEntityType;
  /** Layer name */
  layer: string;
  /** Color (AutoCAD color number 1-255) */
  color?: number;
  /** Object-specific data */
  data: Record<string, number | string | number[]>;
}

/** API request for DXF generation */
export interface DXFGenerationRequest {
  /** Array of serialized objects */
  objects: DXFObjectData[];
  /** Layer mapping configuration */
  layers: LayerMapping;
  /** Export scale factor */
  scale: number;
  /** Precision for coordinates */
  precision: number;
  /** Project name for metadata */
  projectName?: string;
}

/** API response for DXF generation */
export interface DXFGenerationResponse {
  /** Success status */
  success: boolean;
  /** DXF content as base64-encoded string */
  dxfContent?: string;
  /** Error message if failed */
  error?: string;
  /** File size in bytes */
  fileSize?: number;
}

// ============================================================================
// Type Conversions
// ============================================================================

/**
 * Convert canvas element to DXF entity data
 */
export function canvasElementToDXF(
  element: import('./svgExport').CanvasElement,
  layerMapping: LayerMapping = DEFAULT_LAYER_MAPPING
): DXFObjectData {
  const getLayer = (type: string): string => {
    switch (type) {
      case 'line': return layerMapping.objects;
      case 'circle': return layerMapping.objects;
      case 'arc': return layerMapping.objects;
      case 'polyline': return layerMapping.panels;
      case 'rectangle': return layerMapping.panels;
      case 'text': return layerMapping.annotations;
      case 'dimension': return layerMapping.dimensions;
      default: return layerMapping.objects;
    }
  };
  
  const getColor = (stroke?: string): number | undefined => {
    // Convert CSS color to AutoCAD color number
    if (!stroke) return undefined;
    
    const colorMap: Record<string, number> = {
      '#000000': 7,    // White/Black
      '#FF0000': 1,    // Red
      '#00FF00': 3,    // Green
      '#0000FF': 5,    // Blue
      '#FFFF00': 2,    // Yellow
      '#00FFFF': 4,    // Cyan
      '#FF00FF': 6,    // Magenta
      '#FFFFFF': 7,    // White
      '#808080': 8,    // Gray
      '#C0C0C0': 9,    // Light Gray
    };
    
    return colorMap[stroke.toUpperCase()] || 7;
  };
  
  const baseData: DXFObjectData = {
    id: element.id,
    type: 'LINE',
    layer: getLayer(element.type),
    color: getColor(element.stroke)
  };
  
  switch (element.type) {
    case 'line':
      return {
        ...baseData,
        type: 'LINE',
        data: {
          x1: element.x1,
          y1: element.y1,
          x2: element.x2,
          y2: element.y2
        }
      };
      
    case 'circle':
      return {
        ...baseData,
        type: 'CIRCLE',
        data: {
          cx: element.cx,
          cy: element.cy,
          r: element.r
        }
      };
      
    case 'arc':
      return {
        ...baseData,
        type: 'ARC',
        data: {
          cx: element.cx,
          cy: element.cy,
          r: element.r,
          startAngle: element.startAngle,
          endAngle: element.endAngle
        }
      };
      
    case 'polyline':
      const points = element.points.map(p => [p.x, p.y]).flat();
      return {
        ...baseData,
        type: 'LWPOLYLINE',
        data: {
          points,
          closed: element.closed ? 1 : 0
        }
      };
      
    case 'rectangle':
      // Convert rectangle to polyline
      const rectPoints = [
        element.x, element.y,
        element.x + element.width, element.y,
        element.x + element.width, element.y + element.height,
        element.x, element.y + element.height
      ];
      return {
        ...baseData,
        type: 'LWPOLYLINE',
        data: {
          points: rectPoints,
          closed: 1
        }
      };
      
    case 'text':
      return {
        ...baseData,
        type: 'TEXT',
        data: {
          x: element.x,
          y: element.y,
          text: element.text,
          height: element.fontSize || 2.5, // Default text height
          rotation: 0
        }
      };
      
    case 'dimension':
      return {
        ...baseData,
        type: 'DIMENSION',
        data: {
          x1: element.x1,
          y1: element.y1,
          x2: element.x2,
          y2: element.y2,
          measurement: element.measurement,
          offset: element.offset || 10
        }
      };
      
    default:
      return baseData;
  }
}

/**
 * Convert array of canvas elements to DXF object data array
 */
export function canvasElementsToDXFData(
  elements: import('./svgExport').CanvasElement[],
  layerMapping?: LayerMapping
): DXFObjectData[] {
  return elements.map(el => canvasElementToDXF(el, layerMapping));
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Generate DXF export request data
 */
function generateDXFRequest(
  elements: import('./svgExport').CanvasElement[],
  options: DXFExportOptions = {},
  projectName?: string
): DXFGenerationRequest {
  const scale = options.scale || 1.0;
  const layers = options.layers || DEFAULT_LAYER_MAPPING;
  const precision = options.precision || 6;
  
  return {
    objects: canvasElementsToDXFData(elements, layers),
    layers,
    scale,
    precision,
    projectName
  };
}

/**
 * Export canvas elements to DXF format via backend API
 * 
 * @param elements - Array of canvas elements to export
 * @param options - Export options
 * @param projectName - Optional project name
 * @returns Promise resolving to DXF Blob
 */
export async function exportToDXF(
  elements: import('./svgExport').CanvasElement[],
  options: DXFExportOptions = {},
  projectName?: string
): Promise<Blob> {
  const request = generateDXFRequest(elements, options, projectName);
  
  try {
    const response = await fetch('/api/export/dxf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `DXF generation failed: ${response.statusText}`);
    }
    
    const data: DXFGenerationResponse = await response.json();
    
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
    
  } catch (error) {
    console.error('DXF export error:', error);
    throw new Error(`Failed to export DXF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export canvas elements to DXF Blob for download
 * 
 * @param elements - Array of canvas elements
 * @param options - Export options
 * @param projectName - Optional project name
 * @param filename - Optional filename (without extension)
 * @returns Object with blob and suggested filename
 */
export async function exportToDXFBlob(
  elements: import('./svgExport').CanvasElement[],
  options: DXFExportOptions = {},
  projectName?: string,
  filename?: string
): Promise<{ blob: Blob; filename: string }> {
  const blob = await exportToDXF(elements, options, projectName);
  const suggestedName = filename || (projectName ? `${projectName}_export` : 'ceiling_export');
  return { blob, filename: `${suggestedName}.dxf` };
}

/**
 * Trigger DXF file download
 * 
 * @param elements - Array of canvas elements
 * @param options - Export options
 * @param projectName - Optional project name
 * @param filename - Optional filename (without extension)
 */
export async function downloadDXF(
  elements: import('./svgExport').CanvasElement[],
  options: DXFExportOptions = {},
  projectName?: string,
  filename?: string
): Promise<void> {
  const { blob, filename: fullFilename } = await exportToDXFBlob(elements, options, projectName, filename);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fullFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Generate minimal DXF file client-side (fallback without API)
 * This creates a basic DXF structure without full ezdxf features
 * 
 * @param elements - Array of canvas elements
 * @param options - Export options
 * @param projectName - Optional project name
 * @returns DXF string
 */
export function generateMinimalDXF(
  elements: import('./svgExport').CanvasElement[],
  options: DXFExportOptions = {},
  projectName?: string
): string {
  const scale = options.scale || 1.0;
  const layers = options.layers || DEFAULT_LAYER_MAPPING;
  const precision = options.precision || 6;
  const unit = options.unit || 6; // 6 = Millimeters
  
  const round = (n: number): string => n.toFixed(precision);
  
  // Generate HEADER section
  const header = `999
DXF generated by Ceiling Panel Calculator BIM Workbench
0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSBASE
10
0
20
0
30
0
9
$EXTMIN
10
0
20
0
9
$EXTMAX
10
800
20
600
9
$LIMMIN
10
0
20
0
9
$LIMMAX
10
800
20
600
9
$UNITCODE
70
${unit}
9
$INSUNITS
70
${unit}
0
ENDSEC
`;
  
  // Generate TABLES section (layer definitions)
  const layerColors: Record<string, number> = {
    [layers.objects]: 7,
    [layers.panels]: 5,
    [layers.gaps]: 3,
    [layers.dimensions]: 2,
    [layers.annotations]: 4
  };
  
  let tables = `0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
${Object.keys(layers).length}
`;
  
  for (const [layerName, color] of Object.entries(layerColors)) {
    tables += `0
LAYER
2
${layerName}
70
0
62
${color}
6
CONTINUOUS
`;
  }
  
  tables += `0
ENDTAB
0
ENDSEC
`;
  
  // Generate ENTITIES section
  let entities = `0
SECTION
2
ENTITIES
`;
  
  for (const element of elements) {
    const dxfData = canvasElementToDXF(element, layers);
    const color = dxfData.color || 7;
    
    switch (dxfData.type) {
      case 'LINE':
        entities += `0
LINE
8
${dxfData.layer
