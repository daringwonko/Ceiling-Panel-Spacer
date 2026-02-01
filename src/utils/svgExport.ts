/**
 * SVG Export Utilities
 * 
 * Provides functions to export 2D canvas objects and 3D views to SVG format.
 * Supports line, circle, arc, polyline, and rectangle elements with proper styling.
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/** Options for SVG export */
export interface SVGExportOptions {
  /** Width of the SVG canvas in pixels */
  width?: number;
  /** Height of the SVG canvas in pixels */
  height?: number;
  /** ViewBox string (e.g., "0 0 800 600") */
  viewBox?: string;
  /** Export scale factor (default: 1.0) */
  scale?: number;
  /** Include metadata header (default: true) */
  includeMetadata?: boolean;
  /** Stroke color for elements without explicit color */
  defaultStroke?: string;
  /** Fill color for elements without explicit color */
  defaultFill?: string;
  /** Stroke width for elements (default: 1) */
  strokeWidth?: number;
}

/** Canvas object types that can be exported */
export type CanvasObjectType = 'line' | 'circle' | 'arc' | 'polyline' | 'rectangle' | 'text' | 'dimension';

/** Base interface for canvas objects */
export interface CanvasObject {
  /** Unique identifier for the object */
  id: string;
  /** Type of object */
  type: CanvasObjectType;
  /** Layer name for organization */
  layer: string;
  /** Stroke color */
  stroke?: string;
  /** Fill color */
  fill?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Opacity (0-1) */
  opacity?: number;
}

/** Line object */
export interface LineObject extends CanvasObject {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Circle object */
export interface CircleObject extends CanvasObject {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}

/** Arc object */
export interface ArcObject extends CanvasObject {
  type: 'arc';
  cx: number;
  cy: number;
  r: number;
  startAngle: number;  // in degrees
  endAngle: number;    // in degrees
  counterClockwise?: boolean;
}

/** Polyline object */
export interface PolylineObject extends CanvasObject {
  type: 'polyline';
  points: Array<{ x: number; y: number }>;
  closed?: boolean;
}

/** Rectangle object */
export interface RectangleObject extends CanvasObject {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Text object */
export interface TextObject extends CanvasObject {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  textAnchor?: 'start' | 'middle' | 'end';
}

/** Dimension object */
export interface DimensionObject extends CanvasObject {
  type: 'dimension';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  measurement: string;
  offset?: number;
}

/** Union type for all canvas objects */
export type CanvasElement = LineObject | CircleObject | ArcObject | PolylineObject | RectangleObject | TextObject | DimensionObject;

/** 3D scene object for export */
export interface SceneObject {
  /** Object ID */
  id: string;
  /** Object type */
  type: string;
  /** Vertices in 3D space [x, y, z] */
  vertices: Array<[number, number, number]>;
  /** Faces (indices into vertices array) */
  faces: Array<[number, number, number, number?]>;
  /** Layer/material */
  layer: string;
  /** Color */
  color?: string;
  /** Section cut info (if clipped by section plane) */
  cut?: boolean;
}

/** Camera configuration for 3D projection */
export interface CameraConfig {
  /** Camera position [x, y, z] */
  position: [number, number, number];
  /** Camera target [x, y, z] */
  target: [number, number, number];
  /** Camera up vector [x, y, z] */
  up: [number, number, number];
  /** Field of view in degrees (for perspective) */
  fov?: number;
  /** Orthographic mode */
  orthographic?: boolean;
}

/** Options for 3D SVG export */
export interface SVG3DExportOptions extends SVGExportOptions {
  /** Camera configuration */
  camera: CameraConfig;
  /** Section plane position (z-coordinate for cut) */
  sectionPlaneZ?: number;
  /** Show hidden lines (default: false) */
  showHiddenLines?: boolean;
  /** Background color */
  backgroundColor?: string;
}

// ============================================================================
// SVG Export Functions
// ============================================================================

/**
 * Convert a line object to SVG element
 */
function lineToSVG(obj: LineObject): string {
  return `<line 
  x1="${obj.x1}" y1="${obj.y1}" 
  x2="${obj.x2}" y2="${obj.y2}" 
  stroke="${obj.stroke || '#000000'}" 
  stroke-width="${obj.strokeWidth || 1}" 
  fill="none"
  data-layer="${obj.layer}"
  data-id="${obj.id}"
/>`;
}

/**
 * Convert a circle object to SVG element
 */
function circleToSVG(obj: CircleObject): string {
  return `<circle 
  cx="${obj.cx}" cy="${obj.cy}" r="${obj.r}" 
  stroke="${obj.stroke || '#000000'}" 
  stroke-width="${obj.strokeWidth || 1}" 
  fill="${obj.fill || 'none'}"
  data-layer="${obj.layer}"
  data-id="${obj.id}"
/>`;
}

/**
 * Convert an arc object to SVG path
 */
function arcToSVG(obj: ArcObject): string {
  // Convert angles to radians
  const startRad = (obj.startAngle * Math.PI) / 180;
  const endRad = (obj.endAngle * Math.PI) / 180;
  
  // Calculate start and end points
  const x1 = obj.cx + obj.r * Math.cos(startRad);
  const y1 = obj.cy + obj.r * Math.sin(startRad);
  const x2 = obj.cx + obj.r * Math.cos(endRad);
  const y2 = obj.cy + obj.r * Math.sin(endRad);
  
  // Determine sweep flag
  const sweepFlag = obj.counterClockwise ? 0 : 1;
  
  // Create arc path
  const pathData = `M ${x1} ${y1} A ${obj.r} ${obj.r} 0 0 ${sweepFlag} ${x2} ${y2}`;
  
  return `<path 
  d="${pathData}" 
  stroke="${obj.stroke || '#000000'}" 
  stroke-width="${obj.strokeWidth || 1}" 
  fill="none"
  data-layer="${obj.layer}"
  data-id="${obj.id}"
/>`;
}

/**
 * Convert a polyline object to SVG path
 */
function polylineToSVG(obj: PolylineObject): string {
  if (obj.points.length === 0) return '';
  
  const pathData = obj.points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${point.x} ${point.y}`;
    })
    .join(' ');
  
  const closedPath = obj.closed ? ' Z' : '';
  
  return `<path 
  d="${pathData}${closedPath}" 
  stroke="${obj.stroke || '#000000'}" 
  stroke-width="${obj.strokeWidth || 1}" 
  fill="${obj.fill || 'none'}"
  data-layer="${obj.layer}"
  data-id="${obj.id}"
/>`;
}

/**
 * Convert a rectangle object to SVG element
 */
function rectangleToSVG(obj: RectangleObject): string {
  return `<rect 
  x="${obj.x}" y="${obj.y}" 
  width="${obj.width}" height="${obj.height}" 
  stroke="${obj.stroke || '#000000'}" 
  stroke-width="${obj.strokeWidth || 1}" 
  fill="${obj.fill || 'none'}"
  data-layer="${obj.layer}"
  data-id="${obj.id}"
/>`;
}

/**
 * Convert a text object to SVG element
 */
function textToSVG(obj: TextObject): string {
  return `<text 
  x="${obj.x}" y="${obj.y}" 
  font-size="${obj.fontSize || 12}" 
  font-family="${obj.fontFamily || 'Arial, sans-serif'}" 
  text-anchor="${obj.textAnchor || 'start'}"
  fill="${obj.stroke || '#000000'}"
  data-layer="${obj.layer}"
  data-id="${obj.id}"
>${escapeXML(obj.text)}</text>`;
}

/**
 * Convert a dimension object to SVG elements
 */
function dimensionToSVG(obj: DimensionObject): string {
  const elements: string[] = [];
  
  // Main dimension line
  elements.push(`<line 
    x1="${obj.x1}" y1="${obj.y1}" 
    x2="${obj.x2}" y2="${obj.y2}" 
    stroke="${obj.stroke || '#000000'}" 
    stroke-width="${obj.strokeWidth || 1}"
    data-id="${obj.id}-line"
  />`);
  
  // Extension lines (simple implementation)
  const extensionLength = obj.offset || 10;
  elements.push(`<line 
    x1="${obj.x1}" y1="${obj.y1 - extensionLength}" 
    x2="${obj.x1}" y2="${obj.y1 + extensionLength}" 
    stroke="${obj.stroke || '#000000'}" 
    stroke-width="${(obj.strokeWidth || 1) * 0.5}"
  />`);
  elements.push(`<line 
    x1="${obj.x2}" y1="${obj.y2 - extensionLength}" 
    x2="${obj.x2}" y2="${obj.y2 + extensionLength}" 
    stroke="${obj.stroke || '#000000'}" 
    stroke-width="${(obj.strokeWidth || 1) * 0.5}"
  />`);
  
  // Measurement text at midpoint
  const midX = (obj.x1 + obj.x2) / 2;
  const midY = (obj.y1 + obj.y2) / 2;
  elements.push(`<text 
    x="${midX}" y="${midY - 5}" 
    font-size="10" 
    font-family="Arial, sans-serif" 
    text-anchor="middle"
    fill="${obj.stroke || '#000000'}"
  >${escapeXML(obj.measurement)}</text>`);
  
  return elements.join('\n');
}

/**
 * Convert any canvas element to SVG
 */
function elementToSVG(element: CanvasElement): string {
  switch (element.type) {
    case 'line':
      return lineToSVG(element);
    case 'circle':
      return circleToSVG(element);
    case 'arc':
      return arcToSVG(element);
    case 'polyline':
      return polylineToSVG(element);
    case 'rectangle':
      return rectangleToSVG(element);
    case 'text':
      return textToSVG(element);
    case 'dimension':
      return dimensionToSVG(element);
    default:
      console.warn(`Unknown element type: ${(element as CanvasObject).type}`);
      return '';
  }
}

/**
 * Calculate bounding box for a collection of elements
 */
function calculateBoundingBox(elements: CanvasElement[]): { minX: number; maxX: number; minY: number; maxY: number } | null {
  if (elements.length === 0) return null;
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (const element of elements) {
    switch (element.type) {
      case 'line':
        minX = Math.min(minX, (element as LineObject).x1, (element as LineObject).x2);
        maxX = Math.max(maxX, (element as LineObject).x1, (element as LineObject).x2);
        minY = Math.min(minY, (element as LineObject).y1, (element as LineObject).y2);
        maxY = Math.max(maxY, (element as LineObject).y1, (element as LineObject).y2);
        break;
      case 'circle':
        const circle = element as CircleObject;
        minX = Math.min(minX, circle.cx - circle.r);
        maxX = Math.max(maxX, circle.cx + circle.r);
        minY = Math.min(minY, circle.cy - circle.r);
        maxY = Math.max(maxY, circle.cy + circle.r);
        break;
      case 'arc':
        const arc = element as ArcObject;
        minX = Math.min(minX, arc.cx - arc.r);
        maxX = Math.max(maxX, arc.cx + arc.r);
        minY = Math.min(minY, arc.cy - arc.r);
        maxY = Math.max(maxY, arc.cy + arc.r);
        break;
      case 'polyline':
        for (const point of (element as PolylineObject).points) {
          minX = Math.min(minX, point.x);
          maxX = Math.max(maxX, point.x);
          minY = Math.min(minY, point.y);
          maxY = Math.max(maxY, point.y);
        }
        break;
      case 'rectangle':
        const rect = element as RectangleObject;
        minX = Math.min(minX, rect.x);
        maxX = Math.max(maxX, rect.x + rect.width);
        minY = Math.min(minY, rect.y);
        maxY = Math.max(maxY, rect.y + rect.height);
        break;
      case 'text':
        const text = element as TextObject;
        minX = Math.min(minX, text.x);
        maxX = Math.max(maxX, text.x);
        minY = Math.min(minY, text.y);
        maxY = Math.max(maxY, text.y);
        break;
      case 'dimension':
        const dim = element as DimensionObject;
        minX = Math.min(minX, dim.x1, dim.x2);
        maxX = Math.max(maxX, dim.x1, dim.x2);
        minY = Math.min(minY, dim.y1, dim.y2);
        maxY = Math.max(maxY, dim.y1, dim.y2);
        break;
    }
  }
  
  return { minX, maxX, minY, maxY };
}

/**
 * Generate SVG metadata header
 */
function generateMetadata(projectName?: string): string {
  const timestamp = new Date().toISOString();
  return `  <!-- Generated by Ceiling Panel Calculator BIM Workbench -->
  <!-- Project: ${projectName || 'Untitled'} -->
  <!-- Date: ${timestamp} -->`;
}

/**
 * Escape special XML characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Main SVG export function for 2D canvas objects
 * 
 * @param elements - Array of canvas elements to export
 * @param options - Export options
 * @param projectName - Optional project name for metadata
 * @returns SVG string
 */
export function exportToSVG(
  elements: CanvasElement[],
  options: SVGExportOptions = {},
  projectName?: string
): string {
  // Set defaults
  const width = options.width || 800;
  const height = options.height || 600;
  const scale = options.scale || 1.0;
  const includeMetadata = options.includeMetadata !== false;
  
  // Calculate viewBox if not provided
  let viewBox: string;
  if (options.viewBox) {
    viewBox = options.viewBox;
  } else {
    const bounds = calculateBoundingBox(elements);
    if (bounds) {
      const padding = 20;
      const viewWidth = (bounds.maxX - bounds.minX + padding * 2) * scale;
      const viewHeight = (bounds.maxY - bounds.minY + padding * 2) * scale;
      const viewMinX = (bounds.minX - padding) * scale;
      const viewMinY = (bounds.minY - padding) * scale;
      viewBox = `${viewMinX} ${viewMinY} ${viewWidth} ${viewHeight}`;
    } else {
      viewBox = `0 0 ${width} ${height}`;
    }
  }
  
  // Build SVG content
  const svgElements = elements.map(elementToSVG).filter(el => el.length > 0);
  const metadata = includeMetadata ? generateMetadata(projectName) : '';
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  width="${width}" 
  height="${height}" 
  viewBox="${viewBox}"
>
${metadata}
  <g transform="scale(${scale})">
${svgElements.join('\n')}
  </g>
</svg>`;
  
  return svg;
}

/**
 * Export canvas elements to SVG Blob for download
 * 
 * @param elements - Array of canvas elements
 * @param options - Export options
 * @param projectName - Optional project name
 * @param filename - Optional filename (without extension)
 * @returns Object with blob and suggested filename
 */
export function exportToSVGBlob(
  elements: CanvasElement[],
  options: SVGExportOptions = {},
  projectName?: string,
  filename?: string
): { blob: Blob; filename: string } {
  const svgString = exportToSVG(elements, options, projectName);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const suggestedName = filename || (projectName ? `${projectName}_export` : 'ceiling_export');
  return { blob, filename: `${suggestedName}.svg` };
}

/**
 * Project 3D point to 2D screen coordinates using camera configuration
 */
function projectPoint(
  point: [number, number, number],
  camera: CameraConfig,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; z: number } {
  const [px, py, pz] = point;
  const [cx, cy, cz] = camera.position;
  const [tx, ty, tz] = camera.target;
  const [ux, uy, uz] = camera.up;
  
  // Calculate forward vector (camera to target)
  const fx = tx - cx;
  const fy = ty - cy;
  const fz = tz - cz;
  const fLen = Math.sqrt(fx * fx + fy * fy + fz * fz);
  const fn = [fx / fLen, fy / fLen, fz / fLen];
  
  // Calculate right vector (cross product of forward and up)
  const rx = fn[1] * uz - fn[2] * uy;
  const ry = fn[2] * ux - fn[0] * uz;
  const rz = fn[0] * uy - fn[1] * ux;
  const rLen = Math.sqrt(rx * rx + ry * ry + rz * rz);
  const rn = [rx / rLen, ry / rLen, rz / rLen];
  
  // Calculate true up vector (cross product of right and forward)
  const uxn = rn[1] * fn[2] - rn[2] * fn[1];
  const uyn = rn[2] * fn[0] - rn[0] * fn[2];
  const uzn = rn[0] * fn[1] - rn[1] * fn[0];
  
  // Calculate camera space coordinates
  const dx = px - cx;
  const dy = py - cy;
  const dz = pz - cz;
  
  const camX = dx * rn[0] + dy * rn[1] + dz * rn[2];
  const camY = dx * uxn + dy * uyn + dz * uzn;
  const camZ = -dx * fn[0] - dy * fn[1] - dz * fn[2];
  
  // Project to screen coordinates
  let screenX: number, screenY: number;
  
  if (camera.orthographic) {
    // Orthographic projection
    screenX = (camX + canvasWidth / 2);
    screenY = (canvasHeight / 2) - camY;
  } else {
    // Perspective projection
    const fov = camera.fov || 45;
    const aspect = canvasWidth / canvasHeight;
    const f = 1.0 / Math.tan((fov * Math.PI / 180) / 2);
    
    if (camZ <= 0) {
      // Point is behind camera
      return { x: NaN, y: NaN, z: camZ };
    }
    
    screenX = (camX * f / aspect + 0.5) * canvasWidth;
    screenY = (0.5 - camY * f / aspect) * canvasHeight;
  }
  
  return { x: screenX, y: screenY, z: camZ };
}

/**
 * Clip 3D geometry at section plane
 */
function clipAtSectionPlane(
  vertices: Array<[number, number, number]>,
  faces: Array<[number, number, number, number?]>,
  sectionZ: number
): { vertices: Array<[number, number, number]>; faces: Array<[number, number, number, number?]> } {
  const newVertices: Array<[number, number, number]> = [...vertices];
  const newFaces: Array<[number, number, number, number?]> = [];
  
  for (const face of faces) {
    const v0 = vertices[face[0]];
    const v1 = vertices[face[1]];
    const v2 = vertices[face[2]];
    const v3 = face.length > 3 ? vertices[face[3]] : null;
    
    // Check which vertices are above/below section plane
    const above = [v0, v1, v2, v3].filter(v => v !== null && v[2] >= sectionZ);
    const below = [v0, v1, v2, v3].filter(v => v !== null && v[2] < sectionZ);
    
    if (above.length === 4) {
      // Entire face is above - keep as is
      newFaces.push(face);
    } else if (above.length === 0) {
      // Entire face is below - skip
      continue;
    } else {
      // Face is intersected by section plane
      // Simplified: add cut vertices at intersection
      // In production, would calculate exact intersection polygon
      const cutVertices = [v0, v1, v2, v3].filter(v => v !== null && Math.abs((v as [number, number, number])[2] - sectionZ) < 0.001);
      if (cutVertices.length >= 3) {
        // Add face and cut lines (simplified)
        newFaces.push(face);
      }
    }
  }
  
  return { vertices: newVertices, faces: newFaces };
}

/**
 * Convert 3D scene to 2D SVG projection
 */
function sceneObjectToSVG(
  obj: SceneObject,
  camera: CameraConfig,
  canvasWidth: number,
  canvasHeight: number,
  showHiddenLines: boolean = false
): string {
  // Apply section plane clipping if specified
  let vertices = obj.vertices;
  let faces = obj.faces;
  
  // Project all vertices to 2D
  const projectedVertices = vertices.map(v => 
    projectPoint(v, camera, canvasWidth, canvasHeight)
  );
  
  const elements: string[] = [];
  
  // Draw faces as polygons
  for (const face of faces) {
    const v0 = projectedVertices[face[0]];
    const v1 = projectedVertices[face[1]];
    const v2 = projectedVertices[face[2]];
    const v3 = face.length > 3 ? projectedVertices[face[3]] : null;
    
    // Skip if any vertex is behind camera
    if ([v0, v1, v2, v3].some(v => v && isNaN(v.x))) continue;
    
    // Simple back-face culling
    const area = 0.5 * (
      v0.x * (v1.y - v2.y) +
      v1.x * (v2.y - v0.y) +
      v2.x * (v0.y - v1.y)
    );
    
    if (area < 0 && !showHiddenLines) continue;
    
    const points = face.length > 3
      ? `${v0.x},${v0.y} ${v1.x},${v1.y} ${v2.x},${v2.y} ${v3.x},${v3.y}`
      : `${v0.x},${v0.y} ${v1.x},${v1.y} ${v2.x},${v2.y}`;
    
    elements.push(`<polygon 
      points="${points}" 
      fill="${obj.cut ? 'none' : (obj.color || '#CCCCCC')}" 
      stroke="${obj.color || '#666666'}" 
      stroke-width="1"
      fill-opacity="0.3"
      data-layer="${obj.layer}"
      data-id="${obj.id}"
    />`);
  }
  
  // Draw edges
  const edges = new Set<string>();
  for (const face of faces) {
    const faceVerts = [face[0], face[1], face[2]];
    if (face.length > 3) faceVerts.push(face[3]);
    
    for (let i = 0; i < faceVerts.length; i++) {
      const v1 = faceVerts[i];
      const v2 = faceVerts[(i + 1) % faceVerts.length];
      const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
      if (!edges.has(edgeKey)) {
        edges.add(edgeKey);
        const p1 = projectedVertices[v1];
        const p2 = projectedVertices[v2];
        
        if (!isNaN(p1.x) && !isNaN(p2.x)) {
          elements.push(`<line 
            x1="${p1.x}" y1="${p1.y}" 
            x2="${p2.x}" y2="${p2.y}" 
            stroke="${obj.cut ? '#333333' : '#000000'}" 
            stroke-width="${obj.cut ? 2 : 0.5}"
            data-layer="${obj.layer}"
            data-id="${obj.id}-edge"
          />`);
        }
      }
    }
  }
  
  return elements.join('\n');
}

/**
 * Export 3D scene to SVG with projection
 * 
 * @param objects - Array of 3D scene objects
 * @param camera - Camera configuration
 * @param options - Export options
 * @param projectName - Optional project name
 * @returns SVG string
 */
export function export3DToSVG(
  objects: SceneObject[],
  camera: CameraConfig,
  options: SVG3DExportOptions = {},
  projectName?: string
): string {
  // Set defaults
  const width = options.width || 800;
  const height = options.height || 600;
  const includeMetadata = options.includeMetadata !== false;
  const backgroundColor = options.backgroundColor || '#FFFFFF';
  
  // Apply section plane clipping if specified
  let exportObjects = objects;
  if (options.sectionPlaneZ !== undefined) {
    exportObjects = objects.map(obj => {
      const { vertices, faces } = clipAtSectionPlane(obj.vertices, obj.faces, options.sectionPlaneZ!);
      return { ...obj, vertices, faces };
    });
  }
  
  // Generate SVG elements
  const svgElements = exportObjects.map(obj => 
    sceneObjectToSVG(obj, camera, width, height, options.showHiddenLines)
  ).join('\n');
  
  const metadata = includeMetadata ? generateMetadata(projectName) : '';
  
  // Generate camera info annotation
  const cameraInfo = `  <!-- Camera: pos=(${camera.position.join(', ')}) target=(${camera.target.join(', ')}) -->`;
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  width="${width}" 
  height="${height}"
>
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
${metadata}
${cameraInfo}
  <g transform="translate(0, 0)">
${svgElements}
  </g>
</svg>`;
  
  return svg;
}

/**
 * Export 3D scene to SVG Blob for download
 */
export function export3DToSVGBlob(
  objects: SceneObject[],
  camera: CameraConfig,
  options: SVG3DExportOptions = {},
  projectName?: string,
  filename?: string
): { blob: Blob; filename: string } {
  const svgString = export3DToSVG(objects, camera, options, projectName);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const suggestedName = filename || (projectName ? `${projectName}_3d_view` : 'ceiling_3d_view');
  return { blob, filename: `${suggestedName}.svg` };
}
