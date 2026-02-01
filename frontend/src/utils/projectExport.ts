/**
 * Project Export System
 * 
 * Handles complete project serialization to JSON format for export
 * and backup purposes.
 */

import { BIMProject, SiteData, BuildingData, LevelData, BIMObjectData, MaterialData, LayerData, ViewData, SectionPlaneData } from '../types/bim'
import { v4 as uuidv4 } from 'uuid'

// Export version for compatibility checking
export const EXPORT_VERSION = '1.0.0'

/**
 * Export format interfaces
 */
export interface ExportedProject {
  version: string
  metadata: {
    name: string
    description: string
    created: string
    exported: string
    author: string
  }
  units: {
    length: 'mm' | 'cm' | 'm'
    area: 'm2' | 'ft2'
    volume: 'm3' | 'ft3'
  }
  site?: SiteData
  buildings: BuildingData[]
  levels: LevelData[]
  objects: BIMObjectData[]
  materials: MaterialData[]
  layers: LayerData[]
  views: ViewData[]
  sections: SectionPlaneData[]
}

/**
 * Export a complete BIM project to exportable format
 */
export function exportProject(project: BIMProject): ExportedProject {
  const now = new Date().toISOString()
  
  return {
    version: EXPORT_VERSION,
    metadata: {
      name: project.name || 'Untitled Project',
      description: project.description || '',
      created: project.created || now,
      exported: now,
      author: project.author || 'Unknown'
    },
    units: {
      length: project.units?.length || 'mm',
      area: project.units?.area || 'm2',
      volume: project.units?.volume || 'm3'
    },
    site: project.site ? exportSite(project.site) : undefined,
    buildings: project.buildings.map(exportBuilding),
    levels: project.levels.map(exportLevel),
    objects: project.objects.map(exportObject),
    materials: project.materials.map(exportMaterial),
    layers: project.layers.map(exportLayer),
    views: project.views.map(exportView),
    sections: project.sections ? project.sections.map(exportSection) : []
  }
}

/**
 * Export site data
 */
function exportSite(site: SiteData): SiteData {
  return {
    id: site.id || uuidv4(),
    name: site.name || 'Site',
    latitude: site.latitude,
    longitude: site.longitude,
    elevation: site.elevation,
    buildings: site.buildings || [],
    terrain: site.terrain
  }
}

/**
 * Export building data
 */
function exportBuilding(building: BuildingData): BuildingData {
  return {
    id: building.id || uuidv4(),
    name: building.name || 'Building',
    description: building.description,
    location: building.location,
    levels: building.levels || [],
    boundingBox: building.boundingBox
  }
}

/**
 * Export level data
 */
function exportLevel(level: LevelData): LevelData {
  return {
    id: level.id || uuidv4(),
    name: level.name || 'Level',
    elevation: level.elevation,
    height: level.height,
    buildingId: level.buildingId,
    objects: level.objects || [],
    visible: level.visible ?? true
  }
}

/**
 * Export BIM object data
 */
function exportObject(obj: BIMObjectData): BIMObjectData {
  return {
    id: obj.id || uuidv4(),
    type: obj.type,
    name: obj.name,
    description: obj.description,
    properties: { ...obj.properties },
    material: obj.material,
    layer: obj.layer,
    position: obj.position ? [...obj.position] : [0, 0, 0],
    rotation: obj.rotation ? [...obj.rotation] : [0, 0, 0],
    scale: obj.scale ? [...obj.scale] : [1, 1, 1],
    geometry: obj.geometry,
    children: obj.children?.map(exportObject) || [],
    visible: obj.visible ?? true,
    locked: obj.locked ?? false,
    metadata: obj.metadata
  }
}

/**
 * Export material data
 */
function exportMaterial(material: MaterialData): MaterialData {
  return {
    id: material.id || uuidv4(),
    name: material.name,
    type: material.type,
    color: material.color,
    properties: { ...material.properties },
    textures: material.textures ? { ...material.textures } : undefined
  }
}

/**
 * Export layer data
 */
function exportLayer(layer: LayerData): LayerData {
  return {
    id: layer.id || uuidv4(),
    name: layer.name,
    visible: layer.visible ?? true,
    locked: layer.locked ?? false,
    color: layer.color,
    linetype: layer.linetype,
    lineweight: layer.lineweight,
    parentId: layer.parentId
  }
}

/**
 * Export view data
 */
function exportView(view: ViewData): ViewData {
  return {
    id: view.id || uuidv4(),
    name: view.name,
    type: view.type,
    camera: view.camera ? { ...view.camera } : undefined,
    objects: view.objects || [],
    annotations: view.annotations || [],
    visibleLayers: view.visibleLayers || [],
    settings: view.settings ? { ...view.settings } : undefined
  }
}

/**
 * Export section plane data
 */
function exportSection(section: SectionPlaneData): SectionPlaneData {
  return {
    id: section.id || uuidv4(),
    name: section.name,
    type: section.type,
    position: section.position ? [...section.position] : [0, 0, 0],
    normal: section.normal ? [...section.normal] : [0, 1, 0],
    size: section.size,
    visible: section.visible ?? true
  }
}

/**
 * Download project as JSON file
 */
export function downloadProject(project: BIMProject, filename?: string): void {
  const exported = exportProject(project)
  const jsonString = JSON.stringify(exported, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `${project.name || 'project'}-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download project as SavageBIM format (.savagebim)
 */
export function downloadProjectAsBIM(project: BIMProject, filename?: string): void {
  const exported = exportProject(project)
  const jsonString = JSON.stringify(exported, null, 2)
  const blob = new Blob([jsonString], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `${project.name || 'project'}.savagebim`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Get project summary for quick preview
 */
export function getProjectSummary(project: BIMProject): {
  name: string
  objectCount: number
  materialCount: number
  layerCount: number
  buildingCount: number
  levelCount: number
} {
  return {
    name: project.name || 'Untitled Project',
    objectCount: project.objects?.length || 0,
    materialCount: project.materials?.length || 0,
    layerCount: project.layers?.length || 0,
    buildingCount: project.buildings?.length || 0,
    levelCount: project.levels?.length || 0
  }
}
