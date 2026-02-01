/**
 * Project Import System
 * 
 * Handles importing projects from JSON files with validation
 * and version compatibility checking.
 */

import { BIMProject, SiteData, BuildingData, LevelData, BIMObjectData, MaterialData, LayerData, ViewData, SectionPlaneData } from '../types/bim'
import { v4 as uuidv4 } from 'uuid'
import { importProject } from './projectExport'

// Current export version
export const EXPORT_VERSION = '1.0.0'

/**
 * Validation errors
 */
export interface ImportValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: ImportValidationError[]
  warnings: ImportValidationError[]
}

/**
 * Import result with imported data and any issues
 */
export interface ImportResult {
  project: BIMProject
  valid: boolean
  errors: ImportValidationError[]
  warnings: ImportValidationError[]
  version: string
  importedAt: string
}

/**
 * Validate imported project data
 */
export function validateProjectData(data: unknown): ValidationResult {
  const errors: ImportValidationError[] = []
  const warnings: ImportValidationError[] = []
  
  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      message: 'Invalid file format: expected JSON object',
      severity: 'error'
    })
    return { valid: false, errors, warnings }
  }
  
  const project = data as Record<string, unknown>
  
  // Check version
  if (!project.version) {
    warnings.push({
      field: 'version',
      message: 'Missing version info, assuming compatible format',
      severity: 'warning'
    })
  } else if (!isVersionCompatible(project.version as string)) {
    errors.push({
      field: 'version',
      message: `Incompatible version: ${project.version}. Expected ${EXPORT_VERSION}`,
      severity: 'error'
    })
  }
  
  // Validate metadata
  if (!project.metadata || typeof project.metadata !== 'object') {
    warnings.push({
      field: 'metadata',
      message: 'Missing metadata, using defaults',
      severity: 'warning'
    })
  }
  
  // Validate required arrays
  const requiredArrays = ['objects', 'materials', 'layers']
  for (const array of requiredArrays) {
    if (!project[array]) {
      warnings.push({
        field: array,
        message: `Missing ${array}, will use defaults`,
        severity: 'warning'
      })
    } else if (!Array.isArray(project[array])) {
      errors.push({
        field: array,
        message: `${array} should be an array`,
        severity: 'error'
      })
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Check if version is compatible with current format
 */
function isVersionCompatible(version: string): boolean {
  // Simple major version check
  const major = parseInt(version.split('.')[0], 10)
  const currentMajor = parseInt(EXPORT_VERSION.split('.')[0], 10)
  return major === currentMajor
}

/**
 * Import project from exported data
 */
export function importProjectData(data: Record<string, unknown>): ImportResult {
  const now = new Date().toISOString()
  const validation = validateProjectData(data)
  
  const metadata = data.metadata as Record<string, unknown> | undefined
  const units = data.units as Record<string, string> | undefined
  
  // Import site
  const site = data.site as Record<string, unknown> | undefined
  const importedSite: SiteData | undefined = site ? {
    id: (site.id as string) || uuidv4(),
    name: (site.name as string) || 'Site',
    latitude: site.latitude as number | undefined,
    longitude: site.longitude as number | undefined,
    elevation: site.elevation as number | undefined,
    buildings: (site.buildings as string[]) || [],
    terrain: site.terrain
  } : undefined
  
  // Import buildings
  const buildingsData = data.buildings as Record<string, unknown>[] | undefined
  const buildings: BuildingData[] = buildingsData?.map((b, idx) => ({
    id: (b.id as string) || uuidv4(),
    name: (b.name as string) || `Building ${idx + 1}`,
    description: b.description as string | undefined,
    location: b.location,
    levels: (b.levels as string[]) || [],
    boundingBox: b.boundingBox
  })) || []
  
  // Import levels
  const levelsData = data.levels as Record<string, unknown>[] | undefined
  const levels: LevelData[] = levelsData?.map((l, idx) => ({
    id: (l.id as string) || uuidv4(),
    name: (l.name as string) || `Level ${idx + 1}`,
    elevation: l.elevation as number || 0,
    height: l.height as number || 3000,
    buildingId: l.buildingId as string | undefined,
    objects: (l.objects as string[]) || [],
    visible: l.visible !== false
  })) || []
  
  // Import objects
  const objectsData = data.objects as Record<string, unknown>[] | undefined
  const objects: BIMObjectData[] = objectsData?.map(importObject) || []
  
  // Import materials
  const materialsData = data.materials as Record<string, unknown>[] | undefined
  const materials: MaterialData[] = materialsData?.map((m, idx) => ({
    id: (m.id as string) || uuidv4(),
    name: (m.name as string) || `Material ${idx + 1}`,
    type: (m.type as string) || 'standard',
    color: m.color as string | undefined,
    properties: (m.properties as Record<string, unknown>) || {},
    textures: m.textures as Record<string, string> | undefined
  })) || []
  
  // Import layers
  const layersData = data.layers as Record<string, unknown>[] | undefined
  const layers: LayerData[] = layersData?.map((l, idx) => ({
    id: (l.id as string) || uuidv4(),
    name: (l.name as string) || `Layer ${idx + 1}`,
    visible: l.visible !== false,
    locked: l.locked === true,
    color: l.color as string | undefined,
    linetype: l.linetype as string | undefined,
    lineweight: l.lineweight as number | undefined,
    parentId: l.parentId as string | undefined
  })) || []
  
  // Import views
  const viewsData = data.views as Record<string, unknown>[] | undefined
  const views: ViewData[] = viewsData?.map((v, idx) => ({
    id: (v.id as string) || uuidv4(),
    name: (v.name as string) || `View ${idx + 1}`,
    type: (v.type as string) || 'perspective',
    camera: v.camera,
    objects: (v.objects as string[]) || [],
    annotations: (v.annotations as string[]) || [],
    visibleLayers: (v.visibleLayers as string[]) || [],
    settings: v.settings
  })) || []
  
  // Import sections
  const sectionsData = data.sections as Record<string, unknown>[] | undefined
  const sections: SectionPlaneData[] = sectionsData?.map((s, idx) => ({
    id: (s.id as string) || uuidv4(),
    name: (s.name as string) || `Section ${idx + 1}`,
    type: (s.type as string) || 'section',
    position: (s.position as number[]) || [0, 0, 0],
    normal: (s.normal as number[]) || [0, 1, 0],
    size: s.size as [number, number] | undefined,
    visible: s.visible !== false
  })) || []
  
  const project: BIMProject = {
    id: uuidv4(),
    name: (metadata?.name as string) || 'Imported Project',
    description: (metadata?.description as string) || '',
    created: (metadata?.created as string) || now,
    modified: now,
    author: (metadata?.author as string) || 'Unknown',
    units: {
      length: (units?.length as 'mm' | 'cm' | 'm') || 'mm',
      area: (units?.area as 'm2' | 'ft2') || 'm2',
      volume: (units?.volume as 'm3' | 'ft3') || 'm3'
    },
    site: importedSite,
    buildings,
    levels,
    objects,
    materials,
    layers,
    views,
    sections
  }
  
  return {
    project,
    valid: validation.valid || validation.warnings.length > 0,
    errors: validation.errors,
    warnings: [
      ...validation.warnings,
      // Add import-specific warnings
      ...(objects.length === 0 ? [{
        field: 'objects',
        message: 'No objects found in imported project',
        severity: 'warning'
      }] : [])
    ],
    version: (data.version as string) || 'unknown',
    importedAt: now
  }
}

/**
 * Import object from data
 */
function importObject(obj: Record<string, unknown>): BIMObjectData {
  const children = obj.children as Record<string, unknown>[] | undefined
  
  return {
    id: (obj.id as string) || uuidv4(),
    type: (obj.type as string) || 'unknown',
    name: (obj.name as string) || 'Object',
    description: obj.description as string | undefined,
    properties: (obj.properties as Record<string, unknown>) || {},
    material: obj.material as string | undefined,
    layer: obj.layer as string | undefined,
    position: (obj.position as number[]) || [0, 0, 0],
    rotation: (obj.rotation as number[]) || [0, 0, 0],
    scale: (obj.scale as number[]) || [1, 1, 1],
    geometry: obj.geometry,
    children: children?.map(importObject) || [],
    visible: obj.visible !== false,
    locked: obj.locked === true,
    metadata: obj.metadata
  }
}

/**
 * Load project from file
 */
export async function loadProjectFromFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result
        if (typeof content !== 'string') {
          reject(new Error('Failed to read file content'))
          return
        }
        
        const data = JSON.parse(content)
        const result = importProjectData(data)
        
        if (!result.valid && result.errors.length > 0) {
          console.warn('Import validation errors:', result.errors)
        }
        
        resolve(result)
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${(error as Error).message}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Load project from file with progress callback
 */
export async function loadProjectFromFileWithProgress(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ImportResult> {
  // For large files, we could implement chunked reading
  // For now, just simulate progress
  onProgress?.(10)
  await new Promise(resolve => setTimeout(resolve, 100))
  onProgress?.(50)
  
  const result = await loadProjectFromFile(file)
  
  onProgress?.(90)
  await new Promise(resolve => setTimeout(resolve, 100))
  onProgress?.(100)
  
  return result
}

/**
 * Quick check if file is a valid SavageBIM project file
 */
export function isValidProjectFile(file: File): boolean {
  const isJson = file.type === 'application/json' || file.name.endsWith('.json')
  const isBim = file.type === 'application/octet-stream' || file.name.endsWith('.savagebim')
  return isJson || isBim
}

/**
 * Get import preview without full import
 */
export async function getProjectPreview(file: File): Promise<{
  name: string
  version: string
  objectCount: number
  materialCount: number
  valid: boolean
  errors: ImportValidationError[]
}> {
  const result = await loadProjectFromFile(file)
  
  return {
    name: result.project.name || 'Unknown',
    version: result.version,
    objectCount: result.project.objects?.length || 0,
    materialCount: result.project.materials?.length || 0,
    valid: result.valid,
    errors: result.errors
  }
}
