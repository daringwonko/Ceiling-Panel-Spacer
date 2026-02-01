import { v4 as uuidv4 } from 'uuid'

/**
 * Geographic coordinates
 */
export interface GeographicCoordinates {
  latitude: number
  longitude: number
  elevation?: number
}

/**
 * Terrain data representation
 */
export interface TerrainData {
  type: 'flat' | 'sloped' | 'irregular'
  elevationData?: number[][] // Height map for irregular terrain
  slopeAngle?: number // Degrees for sloped terrain
  slopeDirection?: number // Azimuth angle for sloped terrain
}

/**
 * Site properties
 */
export interface SiteProperties {
  address?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  elevation?: number // Site elevation above sea level in meters
  siteArea?: number // Site area in square meters
  terrain?: TerrainData
  timezone?: string
  climateZone?: string
}

/**
 * Site class - Root container for BIM project hierarchy
 * 
 * Represents a geographic location that can contain multiple buildings.
 * Sites have terrain representation and geographic coordinates.
 */
export class Site {
  id: string
  name: string
  coordinates: GeographicCoordinates
  properties: SiteProperties
  buildingIds: string[] // References to buildings in this site
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>

  constructor(
    name: string,
    coordinates: GeographicCoordinates,
    properties: SiteProperties = {}
  ) {
    this.id = uuidv4()
    this.name = name
    this.coordinates = coordinates
    this.properties = properties
    this.buildingIds = []
    this.createdAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Add a building to this site
   */
  addBuilding(buildingId: string): void {
    if (!this.buildingIds.includes(buildingId)) {
      this.buildingIds.push(buildingId)
      this.updatedAt = new Date()
    }
  }

  /**
   * Remove a building from this site
   */
  removeBuilding(buildingId: string): void {
    const index = this.buildingIds.indexOf(buildingId)
    if (index !== -1) {
      this.buildingIds.splice(index, 1)
      this.updatedAt = new Date()
    }
  }

  /**
   * Update site properties
   */
  updateProperties(updates: Partial<SiteProperties>): void {
    this.properties = { ...this.properties, ...updates }
    this.updatedAt = new Date()
  }

  /**
   * Update coordinates
   */
  updateCoordinates(coordinates: Partial<GeographicCoordinates>): void {
    this.coordinates = { ...this.coordinates, ...coordinates }
    this.updatedAt = new Date()
  }

  /**
   * Get building count
   */
  getBuildingCount(): number {
    return this.buildingIds.length
  }

  /**
   * Convert to JSON-serializable object
   */
  toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      coordinates: this.coordinates,
      properties: this.properties,
      buildingIds: this.buildingIds,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      metadata: this.metadata,
    }
  }

  /**
   * Create Site from JSON data
   */
  static fromJSON(data: any): Site {
    const site = new Site(data.name, data.coordinates, data.properties)
    site.id = data.id || uuidv4()
    site.buildingIds = data.buildingIds || []
    site.createdAt = new Date(data.createdAt || Date.now())
    site.updatedAt = new Date(data.updatedAt || Date.now())
    site.metadata = data.metadata
    return site
  }
}

export default Site
