import { v4 as uuidv4 } from 'uuid'

/**
 * Building type enumeration
 */
export type BuildingType = 
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'institutional'
  | 'mixed_use'
  | 'other'

/**
 * Bounding box for spatial calculations
 */
export interface BoundingBox {
  minX: number
  minY: number
  minZ: number
  maxX: number
  maxY: number
  maxZ: number
}

/**
 * Building properties
 */
export interface BuildingProperties {
  buildingType: BuildingType
  constructionYear?: number
  totalHeight: number // Total building height in meters
  totalArea?: number // Total floor area in square meters
  footprintArea?: number // Ground floor area in square meters
  numberOfStories?: number
  structuralSystem?: string
  facadeMaterial?: string
  heatingSystem?: string
  coolingSystem?: string
  energyRating?: string
  accessibilityFeatures?: string[]
}

/**
 * Building class - Container for building levels
 * 
 * Represents a single building with multiple levels/floors.
 * Auto-calculates bounding box based on level geometry.
 */
export class Building {
  id: string
  name: string
  siteId: string // Reference to parent site
  properties: BuildingProperties
  levelIds: string[] // References to levels in this building
  boundingBox: BoundingBox | null
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>

  constructor(
    name: string,
    siteId: string,
    properties: BuildingProperties
  ) {
    this.id = uuidv4()
    this.name = name
    this.siteId = siteId
    this.properties = properties
    this.levelIds = []
    this.boundingBox = null
    this.createdAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Add a level to this building
   */
  addLevel(levelId: string): void {
    if (!this.levelIds.includes(levelId)) {
      this.levelIds.push(levelId)
      this.updatedAt = new Date()
    }
  }

  /**
   * Remove a level from this building
   */
  removeLevel(levelId: string): void {
    const index = this.levelIds.indexOf(levelId)
    if (index !== -1) {
      this.levelIds.splice(index, 1)
      this.updatedAt = new Date()
    }
  }

  /**
   * Reorder levels (e.g., by elevation)
   */
  reorderLevels(levelIds: string[]): void {
    // Validate all existing levels are included
    const existingSet = new Set(this.levelIds)
    const newSet = new Set(levelIds)
    
    if (existingSet.size !== newSet.size || 
        ![...existingSet].every(id => newSet.has(id))) {
      throw new Error('Reordered levels must include all existing level IDs')
    }
    
    this.levelIds = [...levelIds]
    this.updatedAt = new Date()
  }

  /**
   * Update building properties
   */
  updateProperties(updates: Partial<BuildingProperties>): void {
    this.properties = { ...this.properties, ...updates }
    this.updatedAt = new Date()
  }

  /**
   * Calculate bounding box from level geometries
   * This is a placeholder - actual implementation would use level geometry
   */
  calculateBoundingBox(levelGeometries: BoundingBox[]): void {
    if (levelGeometries.length === 0) {
      this.boundingBox = null
      return
    }

    this.boundingBox = {
      minX: Math.min(...levelGeometries.map(g => g.minX)),
      minY: Math.min(...levelGeometries.map(g => g.minY)),
      minZ: Math.min(...levelGeometries.map(g => g.minZ)),
      maxX: Math.max(...levelGeometries.map(g => g.maxX)),
      maxY: Math.max(...levelGeometries.map(g => g.maxY)),
      maxZ: Math.max(...levelGeometries.map(g => g.maxZ)),
    }
    
    this.updatedAt = new Date()
  }

  /**
   * Get level count
   */
  getLevelCount(): number {
    return this.levelIds.length
  }

  /**
   * Get total height from bounding box
   */
  getHeightFromBoundingBox(): number | null {
    if (!this.boundingBox) return null
    return this.boundingBox.maxZ - this.boundingBox.minZ
  }

  /**
   * Get footprint area from bounding box
   */
  getFootprintFromBoundingBox(): number | null {
    if (!this.boundingBox) return null
    const width = this.boundingBox.maxX - this.boundingBox.minX
    const depth = this.boundingBox.maxY - this.boundingBox.minY
    return width * depth
  }

  /**
   * Convert to JSON-serializable object
   */
  toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      siteId: this.siteId,
      properties: this.properties,
      levelIds: this.levelIds,
      boundingBox: this.boundingBox,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      metadata: this.metadata,
    }
  }

  /**
   * Create Building from JSON data
   */
  static fromJSON(data: any): Building {
    const building = new Building(
      data.name,
      data.siteId,
      data.properties
    )
    building.id = data.id || uuidv4()
    building.levelIds = data.levelIds || []
    building.boundingBox = data.boundingBox
    building.createdAt = new Date(data.createdAt || Date.now())
    building.updatedAt = new Date(data.updatedAt || Date.now())
    building.metadata = data.metadata
    return building
  }
}

export default Building
