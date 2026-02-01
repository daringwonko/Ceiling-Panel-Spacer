// ============================================================================
// LEVEL UTILITIES - Helper functions for level operations
// ============================================================================

import type { Level, Building, Site, LevelStatistics } from '../types/level'

/**
 * Format elevation for display (e.g., "3.00m" or "10' 0\"")
 */
export function formatElevation(elevation: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'metric') {
    return `${elevation.toFixed(2)}m`
  } else {
    const feet = Math.floor(elevation * 3.28084)
    const inches = Math.round((elevation * 3.28084 - feet) * 12)
    return `${feet}' ${ inches}"`
  }
}

/**
 * Format level number for display (e.g., "Level 1", "Ground Floor", "Basement")
 */
export function formatLevelName(levelNumber: number, name?: string): string {
  if (name) return name
  
  if (levelNumber === 0) return 'Ground Floor'
  if (levelNumber < 0) return `Basement ${Math.abs(levelNumber)}`
  return `Level ${levelNumber}`
}

/**
 * Get color for level based on usage type
 */
export function getLevelColor(usageType: string): [number, number, number] {
  const colors: Record<string, [number, number, number]> = {
    living: [255, 220, 180],    // Warm beige
    office: [200, 220, 255],    // Light blue
    retail: [255, 200, 200],    // Light red
    utility: [220, 220, 220],   // Gray
    industrial: [200, 255, 200], // Light green
    other: [240, 240, 240],     // Off-white
  }
  
  return colors[usageType] || colors.other
}

/**
 * Convert RGB tuple to CSS color string
 */
export function rgbToCss(rgb: [number, number, number]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

/**
 * Convert RGB tuple to hex color string
 */
export function rgbToHex(rgb: [number, number, number]): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`
}

/**
 * Parse hex color string to RGB tuple
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [200, 200, 200]
  
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ]
}

/**
 * Calculate the total height of a building from its levels
 */
export function calculateBuildingHeight(levels: Level[]): number {
  if (levels.length === 0) return 0
  
  const sortedLevels = [...levels].sort((a, b) => a.elevation - b.elevation)
  const lowestLevel = sortedLevels[0]
  const highestLevel = sortedLevels[sortedLevels.length - 1]
  
  return (highestLevel.elevation + highestLevel.height) - lowestLevel.elevation
}

/**
 * Calculate the footprint area of a building (from ground level)
 */
export function calculateBuildingFootprint(levels: Level[], getStatistics: (levelId: string) => LevelStatistics): number {
  const groundLevel = levels.find(l => l.levelNumber === 0)
  if (!groundLevel) return 0
  
  const stats = getStatistics(groundLevel.id)
  return stats.totalArea
}

/**
 * Sort levels by elevation
 */
export function sortLevelsByElevation(levels: Level[]): Level[] {
  return [...levels].sort((a, b) => a.elevation - b.elevation)
}

/**
 * Sort levels by level number
 */
export function sortLevelsByNumber(levels: Level[]): Level[] {
  return [...levels].sort((a, b) => a.levelNumber - b.levelNumber)
}

/**
 * Get the next suggested level number for a building
 */
export function getNextLevelNumber(levels: Level[]): number {
  if (levels.length === 0) return 0
  
  const maxLevel = Math.max(...levels.map(l => l.levelNumber))
  return maxLevel + 1
}

/**
 * Get the next suggested elevation for a new level
 */
export function getNextElevation(levels: Level[]): number {
  if (levels.length === 0) return 0
  
  const sortedLevels = sortLevelsByElevation(levels)
  const highestLevel = sortedLevels[sortedLevels.length - 1]
  return highestLevel.elevation + highestLevel.height
}

/**
 * Check if two levels overlap in elevation
 */
export function doLevelsOverlap(levelA: Level, levelB: Level): boolean {
  const aBottom = levelA.elevation
  const aTop = levelA.elevation + levelA.height
  const bBottom = levelB.elevation
  const bTop = levelB.elevation + levelB.height
  
  return aBottom < bTop && aTop > bBottom
}

/**
 * Get the distance between two levels
 */
export function getLevelDistance(levelA: Level, levelB: Level): number {
  const aBottom = levelA.elevation
  const aTop = levelA.elevation + levelA.height
  const bBottom = levelB.elevation
  const bTop = levelB.elevation + levelB.height
  
  if (doLevelsOverlap(levelA, levelB)) return 0
  
  if (aTop <= bBottom) return bBottom - aTop
  return aBottom - bTop
}

/**
 * Validate that level elevation is within reasonable bounds
 */
export function validateElevation(elevation: number): { valid: boolean; error?: string } {
  if (isNaN(elevation)) {
    return { valid: false, error: 'Elevation must be a number' }
  }
  
  if (elevation < -100) {
    return { valid: false, error: 'Elevation cannot be less than -100m' }
  }
  
  if (elevation > 1000) {
    return { valid: false, error: 'Elevation cannot be greater than 1000m' }
  }
  
  return { valid: true }
}

/**
 * Validate that level height is positive
 */
export function validateHeight(height: number): { valid: boolean; error?: string } {
  if (isNaN(height)) {
    return { valid: false, error: 'Height must be a number' }
  }
  
  if (height <= 0) {
    return { valid: false, error: 'Height must be greater than 0' }
  }
  
  if (height > 50) {
    return { valid: false, error: 'Height cannot be greater than 50m' }
  }
  
  return { valid: true }
}

/**
 * Generate a default name for a new level
 */
export function generateLevelName(levelNumber: number): string {
  if (levelNumber === 0) return 'Ground Floor'
  if (levelNumber < 0) return `Basement ${Math.abs(levelNumber)}`
  if (levelNumber === 1) return 'First Floor'
  if (levelNumber === 2) return 'Second Floor'
  return `Level ${levelNumber}`
}

/**
 * Create a hierarchy path string for display
 */
export function createHierarchyPath(site: Site, building: Building, level: Level): string {
  return `${site.name} > ${building.name} > ${level.name}`
}

/**
 * Filter levels by visibility
 */
export function filterVisibleLevels(levels: Level[]): Level[] {
  return levels.filter(l => l.isVisible)
}

/**
 * Get statistics summary for multiple levels
 */
export function getLevelsSummary(levels: Level[], getStatistics: (levelId: string) => LevelStatistics): {
  totalObjects: number
  totalArea: number
  averageElevation: number
} {
  const totalObjects = levels.reduce((sum, level) => sum + getStatistics(level.id).objectCount, 0)
  const totalArea = levels.reduce((sum, level) => sum + getStatistics(level.id).totalArea, 0)
  const averageElevation = levels.length > 0
    ? levels.reduce((sum, level) => sum + level.elevation, 0) / levels.length
    : 0
  
  return {
    totalObjects,
    totalArea,
    averageElevation,
  }
}
