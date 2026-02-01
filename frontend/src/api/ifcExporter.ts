/**
 * IFC Export Module
 * 
 * Handles export of BIM objects to Industry Foundation Classes (IFC) format.
 * Uses the backend ifcOpenShell Python API for IFC generation.
 * 
 * Supported object types:
 * - wall, beam, column, slab, door, window
 * - stairs, roof, panel, site, building, level
 * - point, line, polyline, rectangle, circle, arc
 */

import { BIMObject } from '../stores/useBIMStore'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProjectInfo {
  id: string
  name: string
  description?: string
  author?: string
  organization?: string
  application?: string
  version?: string
  unit?: 'mm' | 'cm' | 'm' | 'ft' | 'in'
}

export interface ExportOptions {
  includeGeometry: boolean
  includeProperties: boolean
  includeMaterials: boolean
  ifcVersion?: 'IFC2X3' | 'IFC4' | 'IFC4X1'
  coordinateSystem?: 'absolute' | 'relative'
  exportLevel?: 'detailed' | 'simplified' | 'minimal'
}

export interface IFCObjectData {
  expressId: number
  type: string
  name: string
  description?: string
  tag?: string
  geometry?: {
    vertices: number[]
    faces: number[]
    edges?: number[]
  }
  properties: Record<string, any>
  material?: string
  layer?: string
  level?: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
}

export interface ExportResult {
  success: boolean
  blob: Blob | null
  filename: string
  error?: string
  metadata?: {
    objectCount: number
    geometryCount: number
    exportTime: number
    ifcVersion: string
  }
}

const DEFAULT_OPTIONS: ExportOptions = {
  includeGeometry: true,
  includeProperties: true,
  includeMaterials: true,
  ifcVersion: 'IFC4',
  coordinateSystem: 'absolute',
  exportLevel: 'detailed',
}

const OBJECT_TYPE_MAPPING: Record<string, string> = {
  wall: 'IfcWall',
  beam: 'IfcBeam',
  column: 'IfcColumn',
  slab: 'IfcSlab',
  door: 'IfcDoor',
  window: 'IfcWindow',
  stairs: 'IfcStair',
  roof: 'IfcRoof',
  panel: 'IfcPanel',
  site: 'IfcSite',
  building: 'IfcBuilding',
  level: 'IfcBuildingStorey',
  point: 'IfcPoint',
  line: 'IfcLine',
  polyline: 'IfcPolyline',
  rectangle: 'IfcRectangleProfileDef',
  circle: 'IfcCircleProfileDef',
  arc: 'IfcArc',
}

const DEFAULT_UNIT = 'meters'

// ============================================================================
// API CLIENT
// ============================================================================

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000'

async function callExportEndpoint(
  projectId: string,
  objects: BIMObject[],
  options: ExportOptions
): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/bim/export/ifc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      project_id: projectId,
      objects: objects.map(obj => transformObjectToIFC(obj)),
      options: {
        include_geometry: options.includeGeometry,
        include_properties: options.includeProperties,
        include_materials: options.includeMaterials,
        ifc_version: options.ifcVersion,
        export_level: options.exportLevel,
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `Export failed: ${response.statusText}`)
  }

  const contentType = response.headers.get('Content-Type')
  if (contentType === 'application.ifc' || contentType === 'application/octet-stream') {
    return await response.blob()
  }

  const text = await response.text()
  return new Blob([text], { type: 'application.ifc' })
}

async function generateIFCWithIfcOpenShell(
  projectInfo: ProjectInfo,
  objects: BIMObject[],
  options: ExportOptions
): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/bim/generate-ifc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      project_info: projectInfo,
      objects: objects.map(obj => transformObjectToIFC(obj)),
      options: {
        ifc_version: options.ifcVersion || 'IFC4',
        unit: DEFAULT_UNIT,
        export_level: options.exportLevel || 'detailed',
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `IFC generation failed: ${response.statusText}`)
  }

  const blob = await response.blob()
  return blob
}

// ============================================================================
// OBJECT TRANSFORMATION
// ============================================================================

function transformObjectToIFC(obj: BIMObject): IFCObjectData {
  const ifcType = OBJECT_TYPE_MAPPING[obj.type] || 'IfcBuildingElement'

  return {
    expressId: generateExpressId(),
    type: ifcType,
    name: obj.name,
    description: obj.properties?.description,
    tag: obj.properties?.tag,
    geometry: obj.geometry ? transformGeometry(obj.geometry) : undefined,
    properties: transformProperties(obj),
    material: obj.material,
    layer: obj.layer,
    level: obj.level,
    position: obj.position,
    rotation: obj.rotation,
    scale: obj.scale,
  }
}

function transformGeometry(geometry: any): IFCObjectData['geometry'] {
  if (!geometry) return undefined

  const vertices: number[] = []
  const faces: number[] = []

  if (geometry.vertices && Array.isArray(geometry.vertices)) {
    geometry.vertices.forEach((v: [number, number, number]) => {
      vertices.push(v[0], v[1], v[2])
    })
  }

  if (geometry.faces && Array.isArray(geometry.faces)) {
    geometry.faces.forEach((f: number[]) => {
      faces.push(f[0], f[1], f[2], f[3] || 0)
    })
  }

  return { vertices, faces }
}

function transformProperties(obj: BIMObject): Record<string, any> {
  const props: Record<string, any> = {}

  if (obj.properties) {
    Object.entries(obj.properties).forEach(([key, value]) => {
      props[camelToSnake(key)] = value
    })
  }

  props.object_type = obj.type
  props.layer_name = obj.layer
  props.level_name = obj.level

  return props
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

let expressIdCounter = 100

function generateExpressId(): number {
  return ++expressIdCounter
}

// ============================================================================
// GEOMETRY GENERATORS FOR DIFFERENT OBJECT TYPES
// ============================================================================

export function generateWallGeometry(
  startPoint: [number, number, number],
  endPoint: [number, number, number],
  height: number,
  thickness: number
): { vertices: number[]; faces: number[] } {
  const vertices: number[] = []
  const faces: number[] = []

  const [x1, y1, z1] = startPoint
  const [x2, y2, z2] = endPoint
  const z = height

  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.sqrt(dx * dx + dy * dy)
  const nx = (dy / length) * thickness / 2
  const ny = (-dx / length) * thickness / 2

  vertices.push(
    x1 - nx, y1 - ny, 0,
    x1 + nx, y1 + ny, 0,
    x1 - nx, y1 - ny, z,
    x1 + nx, y1 + ny, z,
    x2 - nx, y2 - ny, 0,
    x2 + nx, y2 + ny, 0,
    x2 - nx, y2 - ny, z,
    x2 + nx, y2 + ny, z
  )

  faces.push(
    0, 1, 3, 2,
    4, 6, 7, 5,
    0, 4, 5, 1,
    2, 3, 7, 6,
    0, 2, 6, 4,
    1, 5, 7, 3
  )

  return { vertices, faces }
}

export function generateColumnGeometry(
  position: [number, number, number],
  height: number,
  width: number,
  depth: number
): { vertices: number[]; faces: number[] } {
  const vertices: number[] = []
  const faces: number[] = []

  const [x, y, z] = position
  const hw = width / 2
  const hd = depth / 2

  vertices.push(
    x - hw, y - hd, z,
    x + hw, y - hd, z,
    x - hw, y + hd, z,
    x + hw, y + hd, z,
    x - hw, y - hd, z + height,
    x + hw, y - hd, z + height,
    x - hw, y + hd, z + height,
    x + hw, y + hd, z + height
  )

  faces.push(
    0, 1, 3, 2,
    4, 6, 7, 5,
    0, 4, 5, 1,
    2, 3, 7, 6,
    0, 2, 6, 4,
    1, 5, 7, 3
  )

  return { vertices, faces }
}

export function generateBeamGeometry(
  startPoint: [number, number, number],
  endPoint: [number, number, number],
  profileWidth: number,
  profileHeight: number
): { vertices: number[]; faces: number[] } {
  const vertices: number[] = []
  const faces: number[] = []

  const [x1, y1, z1] = startPoint
  const [x2, y2, z2] = endPoint

  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.sqrt(dx * dx + dy * dy)
  const dirX = dx / length
  const dirY = dy / length

  const hw = (profileWidth / 2)
  const hh = (profileHeight / 2)

  const perpX = -dirY
  const perpY = dirX

  vertices.push(
    x1 + perpX * hw, y1 + perpY * hw, z1 - hh,
    x1 - perpX * hw, y1 - perpY * hw, z1 - hh,
    x1 + perpX * hw, y1 + perpY * hw, z1 + hh,
    x1 - perpX * hw, y1 - perpY * hw, z1 + hh,
    x2 + perpX * hw, y2 + perpY * hw, z2 - hh,
    x2 - perpX * hw, y2 - perpY * hw, z2 - hh,
    x2 + perpX * hw, y2 + perpY * hw, z2 + hh,
    x2 - perpX * hw, y2 - perpY * hw, z2 + hh
  )

  faces.push(
    0, 1, 3, 2,
    4, 6, 7, 5,
    0, 4, 5, 1,
    2, 3, 7, 6,
    0, 2, 6, 4,
    1, 5, 7, 3
  )

  return { vertices, faces }
}

export function generateSlabGeometry(
  boundary: [number, number][],
  thickness: number,
  elevation: number
): { vertices: number[]; faces: number[] } {
  const vertices: number[] = []
  const faces: number[] = []

  const n = boundary.length
  for (let i = 0; i < n; i++) {
    const [x, y] = boundary[i]
    vertices.push(x, y, elevation)
    vertices.push(x, y, elevation + thickness)
  }

  const bottomFace = Array.from({ length: n }, (_, i) => i).reverse()
  const topFace = Array.from({ length: n }, (_, i) => n + i)

  const faceIndices: number[][] = [bottomFace, topFace]

  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n
    faceIndices.push([i, next, n + next + 1, n + i + 1])
  }

  faces.push(...faceIndices.flat())

  return { vertices, faces }
}

export function generateDoorGeometry(
  position: [number, number, number],
  width: number,
  height: number,
  depth: number = 50
): { vertices: number[]; faces: number[] } {
  const vertices: number[] = []
  const faces: number[] = []

  const [x, y, z] = position
  const hw = width / 2
  const hd = depth / 2

  vertices.push(
    x - hw, y - hd, z,
    x + hw, y - hd, z,
    x - hw, y + hd, z,
    x + hw, y + hd, z,
    x - hw, y - hd, z + height,
    x + hw, y - hd, z + height,
    x - hw, y + hd, z + height,
    x + hw, y + hd, z + height
  )

  faces.push(
    0, 1, 3, 2,
    4, 6, 7, 5,
    0, 4, 5, 1,
    2, 3, 7, 6,
    0, 2, 6, 4,
    1, 5, 7, 3
  )

  return { vertices, faces }
}

export function generateWindowGeometry(
  position: [number, number, number],
  width: number,
  height: number,
  depth: number = 100
): { vertices: number[]; faces: number[] } {
  const vertices: number[] = []
  const faces: number[] = []

  const [x, y, z] = position
  const hw = width / 2
  const hd = depth / 2

  vertices.push(
    x - hw, y - hd, z,
    x + hw, y - hd, z,
    x - hw, y + hd, z,
    x + hw, y + hd, z,
    x - hw, y - hd, z + height,
    x + hw, y - hd, z + height,
    x - hw, y + hd, z + height,
    x + hw, y + hd, z + height
  )

  faces.push(
    0, 1, 3, 2,
    4, 6, 7, 5,
    0, 4, 5, 1,
    2, 3, 7, 6,
    0, 2, 6, 4,
    1, 5, 7, 3
  )

  return { vertices, faces }
}

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================

/**
 * Export BIM objects to IFC format
 * 
 * @param objects - Array of BIM objects to export
 * @param projectInfo - Project information for IFC header
 * @param options - Export options (optional)
 * @returns Promise resolving to ExportResult with IFC blob
 */
export async function exportToIFC(
  objects: BIMObject[],
  projectInfo: ProjectInfo,
  options?: Partial<ExportOptions>
): Promise<ExportResult> {
  const startTime = performance.now()
  const opts = { ...DEFAULT_OPTIONS, ...options }

  try {
    let blob: Blob

    try {
      blob = await callExportEndpoint(projectInfo.id, objects, opts)
    } catch {
      blob = await generateIFCWithIfcOpenShell(projectInfo, objects, opts)
    }

    const exportTime = performance.now() - startTime
    const filename = `${projectInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}.ifc`

    return {
      success: true,
      blob,
      filename,
      metadata: {
        objectCount: objects.length,
        geometryCount: objects.filter(obj => obj.geometry).length,
        exportTime,
        ifcVersion: opts.ifcVersion || 'IFC4',
      },
    }
  } catch (error) {
    const exportTime = performance.now() - startTime
    return {
      success: false,
      blob: null,
      filename: `${projectInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}.ifc`,
      error: error instanceof Error ? error.message : 'Unknown export error',
      metadata: {
        objectCount: objects.length,
        geometryCount: 0,
        exportTime,
        ifcVersion: opts.ifcVersion || 'IFC4',
      },
    }
  }
}

/**
 * Export a single BIM object to IFC format
 * 
 * @param obj - BIM object to export
 * @param projectInfo - Project information for context
 * @param options - Export options
 * @returns Promise resolving to ExportResult with IFC blob
 */
export async function exportSingleObjectToIFC(
  obj: BIMObject,
  projectInfo: ProjectInfo,
  options?: Partial<ExportOptions>
): Promise<ExportResult> {
  return exportToIFC([obj], projectInfo, options)
}

/**
 * Export objects filtered by type to IFC format
 * 
 * @param objects - All BIM objects
 * @param types - Object types to include
 * @param projectInfo - Project information
 * @param options - Export options
 * @returns Promise resolving to ExportResult with IFC blob
 */
export async function exportObjectsByTypeToIFC(
  objects: BIMObject[],
  types: BIMObject['type'][],
  projectInfo: ProjectInfo,
  options?: Partial<ExportOptions>
): Promise<ExportResult> {
  const filteredObjects = objects.filter(obj => types.includes(obj.type))
  return exportToIFC(filteredObjects, projectInfo, options)
}

/**
 * Export objects on a specific level to IFC format
 * 
 * @param objects - All BIM objects
 * @param levelId - Level ID to filter by
 * @param projectInfo - Project information
 * @param options - Export options
 * @returns Promise resolving to ExportResult with IFC blob
 */
export async function exportLevelToIFC(
  objects: BIMObject[],
  levelId: string,
  projectInfo: ProjectInfo,
  options?: Partial<ExportOptions>
): Promise<ExportResult> {
  const filteredObjects = objects.filter(obj => obj.level === levelId)
  return exportToIFC(filteredObjects, projectInfo, options)
}

// ============================================================================
// DOWNLOAD UTILITIES
// ============================================================================

/**
 * Download IFC file from ExportResult
 * 
 * @param result - ExportResult from exportToIFC
 * @param customFilename - Optional custom filename
 */
export function downloadIFC(
  result: ExportResult,
  customFilename?: string
): void {
  if (!result.success || !result.blob) {
    console.error('Cannot download IFC: Export failed')
    return
  }

  const url = URL.createObjectURL(result.blob)
  const link = document.createElement('a')
  link.href = url
  link.download = customFilename || result.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download IFC file directly
 * 
 * @param objects - BIM objects to export
 * @param projectInfo - Project information
 * @param options - Export options
 * @param filename - Optional custom filename
 */
export async function downloadIFCFile(
  objects: BIMObject[],
  projectInfo: ProjectInfo,
  options?: Partial<ExportOptions>,
  filename?: string
): Promise<void> {
  const result = await exportToIFC(objects, projectInfo, options)
  downloadIFC(result, filename)
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate that objects can be exported to IFC
 * 
 * @param objects - Objects to validate
 * @returns Validation result with errors/warnings
 */
export function validateObjectsForExport(
  objects: BIMObject[]
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  objects.forEach((obj, index) => {
    if (!obj.id) {
      errors.push(`Object ${index}: Missing ID`)
    }

    if (!obj.name) {
      errors.push(`Object ${index} (${obj.type}): Missing name`)
    }

    if (!obj.type) {
      errors.push(`Object ${index}: Missing type`)
    } else if (!OBJECT_TYPE_MAPPING[obj.type]) {
      warnings.push(`Object ${obj.name || index}: Unknown type "${obj.type}", will use generic IfcBuildingElement`)
    }

    if (!obj.position || obj.position.length !== 3) {
      warnings.push(`Object ${obj.name || index}: Invalid or missing position`)
    }

    if (obj.geometry) {
      if (!obj.geometry.vertices || !Array.isArray(obj.geometry.vertices)) {
        warnings.push(`Object ${obj.name || index}: Missing or invalid geometry vertices`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================================================
// PROPERTY EXPORT
// ============================================================================

/**
 * Generate IFC properties (IfcPropertySet) for a BIM object
 * 
 * @param obj - BIM object
 * @returns Array of IFC properties
 */
export function generateIFCProperties(obj: BIMObject): Record<string, any> {
  const properties: Record<string, any> = {}

  properties.Name = { type: 'IfcLabel', value: obj.name }
  properties.Description = { type: 'IfcText', value: obj.properties?.description || '' }
  properties.ObjectType = { type: 'IfcLabel', value: obj.type }
  properties.Tag = { type: 'IfcIdentifier', value: obj.properties?.tag }

  if (obj.material) {
    properties.Material = { type: 'IfcLabel', value: obj.material }
  }

  if (obj.layer) {
    properties.Layer = { type: 'IfcLabel', value: obj.layer }
  }

  if (obj.level) {
    properties.Level = { type: 'IfcLabel', value: obj.level }
  }

  if (obj.properties) {
    Object.entries(obj.properties).forEach(([key, value]) => {
      if (key !== 'description' && key !== 'tag') {
        const ifcKey = camelToSnake(key)
        const ifcValue = typeof value === 'number'
          ? { type: 'IfcReal', value }
          : { type: 'IfcText', value: String(value) }
        properties[ifcKey] = ifcValue
      }
    })
  }

  return properties
}

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

export {
  OBJECT_TYPE_MAPPING,
  DEFAULT_OPTIONS as defaultExportOptions,
}