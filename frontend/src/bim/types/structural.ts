/**
 * Structural BIM Object Types
 * 
 * Type definitions for Wall, Beam, Column, and Slab objects
 */

import { BIMObject } from '../../stores/useBIMStore'

// ============================================================================
// WALL TYPES
// ============================================================================

export interface WallProperties {
  length: number
  height: number
  thickness: number
  startPoint: [number, number, number]
  endPoint: [number, number, number]
  baseElevation: number
  topElevation: number
  material: string
  isStructural: boolean
  hasOpening: boolean
  openings?: WallOpening[]
}

export interface WallOpening {
  id: string
  type: 'door' | 'window' | 'generic'
  width: number
  height: number
  sillHeight: number
  position: number // Distance from wall start (0-1)
}

export interface WallData extends BIMObject {
  type: 'wall'
  properties: WallProperties
}

// ============================================================================
// BEAM TYPES
// ============================================================================

export interface BeamProperties {
  length: number
  profileWidth: number
  profileHeight: number
  startPoint: [number, number, number]
  endPoint: [number, number, number]
  elevation: number
  material: string
  isStructural: boolean
  startConnection: BeamConnection
  endConnection: BeamConnection
}

export type BeamConnection = 'pinned' | 'fixed' | 'roller' | 'none'

export interface BeamData extends BIMObject {
  type: 'beam'
  properties: BeamProperties
}

// ============================================================================
// COLUMN TYPES
// ============================================================================

export interface ColumnProperties {
  height: number
  profileType: 'rectangle' | 'circle'
  width?: number      // For rectangle
  depth?: number      // For rectangle
  diameter?: number   // For circle
  position: [number, number, number]
  baseElevation: number
  topElevation: number
  material: string
  isStructural: boolean
  loadCapacity?: number // kN
}

export interface ColumnData extends BIMObject {
  type: 'column'
  properties: ColumnProperties
}

// ============================================================================
// SLAB TYPES
// ============================================================================

export interface SlabProperties {
  boundary: [number, number][] // Array of [x, y] points forming closed polygon
  thickness: number
  elevation: number
  area: number
  volume: number
  material: string
  isStructural: boolean
  hasDropPanels: boolean
  dropPanels?: SlabDropPanel[]
  extrudeDirection: 'up' | 'down'
}

export interface SlabDropPanel {
  id: string
  position: [number, number]
  width: number
  depth: number
  thickness: number
}

export interface SlabData extends BIMObject {
  type: 'slab'
  properties: SlabProperties
}

// ============================================================================
// MATERIAL TYPES
// ============================================================================

export interface StructuralMaterial {
  id: string
  name: string
  type: 'concrete' | 'steel' | 'wood' | 'masonry' | 'composite'
  density: number // kg/m³
  compressiveStrength?: number // MPa
  tensileStrength?: number // MPa
  elasticModulus?: number // GPa
  thermalConductivity?: number // W/(m·K)
  color: string
}

// Predefined structural materials
export const STRUCTURAL_MATERIALS: StructuralMaterial[] = [
  {
    id: 'concrete-c25',
    name: 'Concrete C25/30',
    type: 'concrete',
    density: 2500,
    compressiveStrength: 25,
    elasticModulus: 30,
    color: '#9CA3AF',
  },
  {
    id: 'concrete-c30',
    name: 'Concrete C30/37',
    type: 'concrete',
    density: 2500,
    compressiveStrength: 30,
    elasticModulus: 32,
    color: '#6B7280',
  },
  {
    id: 'steel-s355',
    name: 'Structural Steel S355',
    type: 'steel',
    density: 7850,
    compressiveStrength: 355,
    tensileStrength: 470,
    elasticModulus: 210,
    color: '#4B5563',
  },
  {
    id: 'wood-glulam',
    name: 'Glulam Timber',
    type: 'wood',
    density: 500,
    compressiveStrength: 24,
    elasticModulus: 11,
    color: '#D97706',
  },
  {
    id: 'masonry-brick',
    name: 'Brick Masonry',
    type: 'masonry',
    density: 1900,
    compressiveStrength: 10,
    color: '#B91C1C',
  },
]

// ============================================================================
// PROPERTY UPDATE EVENTS
// ============================================================================

export interface PropertyUpdateEvent {
  objectId: string
  objectType: 'wall' | 'beam' | 'column' | 'slab'
  property: string
  oldValue: any
  newValue: any
  timestamp: number
}

export type PropertyUpdateCallback = (event: PropertyUpdateEvent) => void

// ============================================================================
// CALCULATION UTILITIES
// ============================================================================

export const calculateWallVolume = (length: number, height: number, thickness: number): number => {
  return length * height * thickness
}

export const calculateBeamVolume = (length: number, profileWidth: number, profileHeight: number): number => {
  return length * profileWidth * profileHeight
}

export const calculateColumnVolume = (
  height: number,
  profileType: 'rectangle' | 'circle',
  width?: number,
  depth?: number,
  diameter?: number
): number => {
  if (profileType === 'rectangle' && width && depth) {
    return height * width * depth
  } else if (profileType === 'circle' && diameter) {
    return height * Math.PI * Math.pow(diameter / 2, 2)
  }
  return 0
}

export const calculateSlabVolume = (area: number, thickness: number): number => {
  return area * thickness
}

export const calculateSlabArea = (boundary: [number, number][]): number => {
  // Shoelace formula for polygon area
  let area = 0
  const n = boundary.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += boundary[i][0] * boundary[j][1]
    area -= boundary[j][0] * boundary[i][1]
  }
  return Math.abs(area) / 2
}
