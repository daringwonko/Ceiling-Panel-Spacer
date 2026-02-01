import { v4 as uuidv4 } from 'uuid'

/**
 * Level elevation representation
 */
export interface ElevationData {
  elevation: number // Elevation in meters (relative to building datum)
  height: number // Floor-to-floor height in meters
  thickness?: number // Floor slab thickness in meters
}

/**
 * 2D plan representation
 */
export interface PlanRepresentation {
  visible: boolean
  scale?: number // Drawing scale (e.g., 1:100)
  rotation?: number // Rotation angle in degrees
  origin?: { x: number; y: number } // Origin offset
  clipRegion?: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
}

/**
 * Level properties
 */
export interface LevelProperties {
  elevation: number // Elevation in meters
  height: number // Floor-to-floor height
  thickness?: number // Floor slab thickness
  isStructural?: boolean // Is this a structural level
  isGroundLevel?: boolean // Is this the ground/entry level
  isRoofLevel?: boolean // Is this the top level
  usage?: string // Intended usage (office, residential, etc.)
  fireRating?: string
  acousticRating?: string
}

/**
 * Level class - Container for objects at a specific elevation
 * 
 * Represents a building level/floor that contains objects.
 * Supports show/hide toggle and 2D plan representation.
 */
export class Level {
  id: string
  name: string
  buildingId: string // Reference to parent building
  properties: LevelProperties
  objectIds: string[] // References to objects in this level
  visible: boolean
  planRepresentation: PlanRepresentation
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>

  constructor(
    name: string,
    buildingId: string,
    properties: LevelProperties
  ) {
    this.id = uuidv4()
    this.name = name
    this.buildingId = buildingId
    this.properties = properties
    this.objectIds = []
    this.visible = true
    this.planRepresentation = {
      visible: true,
      scale: 1,
      rotation: 0,
      origin: { x: 0, y: 0 },
    }
    this.createdAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Add an object to this level
   */
  addObject(objectId: string): void {
    if (!this.objectIds.includes(objectId)) {
      this.objectIds.push(objectId)
      this.updatedAt = new Date()
    }
  }

  /**
   * Remove an object from this level
   */
  removeObject(objectId: string): void {
    const index = this.objectIds.indexOf(objectId)
    if (index !== -1) {
      this.objectIds.splice(index, 1)
      this.updatedAt = new Date()
    }
  }

  /**
   * Update level properties
   */
  updateProperties(updates: Partial<LevelProperties>): void {
    this.properties = { ...this.properties, ...updates }
    this.updatedAt = new Date()
  }

  /**
   * Toggle visibility
   */
  toggleVisibility(): void {
    this.visible = !this.visible
    this.updatedAt = new Date()
  }

  /**
   * Set visibility explicitly
   */
  setVisible(visible: boolean): void {
    this.visible = visible
    this.updatedAt = new Date()
  }

  /**
   * Update plan representation
   */
  updatePlanRepresentation(updates: Partial<PlanRepresentation>): void {
    this.planRepresentation = { ...this.planRepresentation, ...updates }
    this.updatedAt = new Date()
  }

  /**
   * Get object count
   */
  getObjectCount(): number {
    return this.objectIds.length
  }

  /**
   * Get elevation data
   */
  getElevationData(): ElevationData {
    return {
      elevation: this.properties.elevation,
      height: this.properties.height,
      thickness: this.properties.thickness,
    }
  }

  /**
   * Get top elevation (elevation + height)
   */
  getTopElevation(): number {
    return this.properties.elevation + this.properties.height
  }

  /**
   * Check if level is visible
   */
  isVisible(): boolean {
    return this.visible
  }

  /**
   * Check if level has objects
   */
  hasObjects(): boolean {
    return this.objectIds.length > 0
  }

  /**
   * Convert to JSON-serializable object
   */
  toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      buildingId: this.buildingId,
      properties: this.properties,
      objectIds: this.objectIds,
      visible: this.visible,
      planRepresentation: this.planRepresentation,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      metadata: this.metadata,
    }
  }

  /**
   * Create Level from JSON data
   */
  static fromJSON(data: any): Level {
    const level = new Level(
      data.name,
      data.buildingId,
      data.properties
    )
    level.id = data.id || uuidv4()
    level.objectIds = data.objectIds || []
    level.visible = data.visible ?? true
    level.planRepresentation = data.planRepresentation || {
      visible: true,
      scale: 1,
      rotation: 0,
      origin: { x: 0, y: 0 },
    }
    level.createdAt = new Date(data.createdAt || Date.now())
    level.updatedAt = new Date(data.updatedAt || Date.now())
    level.metadata = data.metadata
    return level
  }
}

export default Level
