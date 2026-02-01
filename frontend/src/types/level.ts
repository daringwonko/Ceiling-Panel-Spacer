// ============================================================================
// LEVEL TYPES - Project Hierarchy System
// ============================================================================

export interface Level {
  id: string
  name: string
  elevation: number // in meters, relative to site
  height: number // floor-to-ceiling height in meters
  levelNumber: number // for ordering (0=ground, 1=first floor, -1=basement)
  usageType: 'living' | 'office' | 'retail' | 'utility' | 'industrial' | 'other'
  isVisible: boolean
  color: [number, number, number] // RGB for 2D plan view
  buildingId: string // reference to parent building
  objectIds: string[] // IDs of objects in this level
}

export interface Building {
  id: string
  name: string
  siteId: string // reference to parent site
  levelIds: string[] // IDs of levels in this building
  buildingType: 'residential' | 'commercial' | 'industrial' | 'mixed' | 'other'
  constructionYear?: number
  address?: string
}

export interface Site {
  id: string
  name: string
  description: string
  buildingIds: string[] // IDs of buildings in this site
  elevation: number // site elevation in meters
  address?: string
  latitude?: number
  longitude?: number
}

export interface LevelProperties {
  name?: string
  elevation?: number
  height?: number
  levelNumber?: number
  usageType?: Level['usageType']
  isVisible?: boolean
  color?: [number, number, number]
}

export interface BuildingProperties {
  name?: string
  buildingType?: Building['buildingType']
  constructionYear?: number
  address?: string
}

export interface SiteProperties {
  name?: string
  description?: string
  elevation?: number
  address?: string
  latitude?: number
  longitude?: number
}

export interface HierarchyPath {
  siteId: string
  buildingId: string
  levelId: string
}

export interface LevelStatistics {
  objectCount: number
  totalArea: number
  bounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  } | null
}
