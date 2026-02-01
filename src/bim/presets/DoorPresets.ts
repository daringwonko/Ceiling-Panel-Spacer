/**
 * DoorPresets - Predefined Door Configurations
 * 
 * Provides a library of standard door sizes and configurations
 * for quick placement in BIM models. Includes interior, exterior,
 * patio, and specialty door types.
 */

import type { DoorPreset, DoorSwingDirection } from '../types';

/**
 * Standard door preset configurations
 */
export const DOOR_PRESETS: DoorPreset[] = [
  // Interior Doors
  {
    id: 'single_standard',
    name: 'Single Standard',
    description: 'Standard interior door - 900mm wide',
    width: 900,
    height: 2100,
    swingDirection: 'right',
    category: 'interior',
    icon: '🚪',
  },
  {
    id: 'single_narrow',
    name: 'Single Narrow',
    description: 'Narrow interior door for tight spaces - 800mm wide',
    width: 800,
    height: 2100,
    swingDirection: 'right',
    category: 'interior',
    icon: '🚪',
  },
  {
    id: 'single_wide',
    name: 'Single Wide',
    description: 'Wide interior door - 1000mm for accessibility',
    width: 1000,
    height: 2100,
    swingDirection: 'right',
    category: 'interior',
    icon: '🚪',
  },
  {
    id: 'single_left_swing',
    name: 'Single Left Swing',
    description: 'Standard door with left-hand swing',
    width: 900,
    height: 2100,
    swingDirection: 'left',
    category: 'interior',
    icon: '🚪',
  },

  // Exterior Doors
  {
    id: 'entry_standard',
    name: 'Entry Standard',
    description: 'Standard entry door with left swing',
    width: 900,
    height: 2100,
    swingDirection: 'left',
    category: 'exterior',
    icon: '🏠',
  },
  {
    id: 'entry_large',
    name: 'Entry Large',
    description: 'Oversized entry door - 1000mm x 2400mm',
    width: 1000,
    height: 2400,
    swingDirection: 'left',
    category: 'exterior',
    icon: '🏠',
  },
  {
    id: 'entry_tall',
    name: 'Entry Tall',
    description: 'Tall entry door for high ceilings - 900mm x 2400mm',
    width: 900,
    height: 2400,
    swingDirection: 'right',
    category: 'exterior',
    icon: '🏠',
  },

  // Double Doors
  {
    id: 'double_french',
    name: 'Double French',
    description: 'French doors with double swing - 1200mm wide',
    width: 1200,
    height: 2100,
    swingDirection: 'double',
    category: 'exterior',
    icon: '🚪🚪',
  },
  {
    id: 'double_wide',
    name: 'Double Wide',
    description: 'Wide double doors - 1500mm for grand entrances',
    width: 1500,
    height: 2100,
    swingDirection: 'double',
    category: 'exterior',
    icon: '🚪🚪',
  },
  {
    id: 'double_tall',
    name: 'Double Tall',
    description: 'Tall double doors - 1800mm x 2400mm',
    width: 1800,
    height: 2400,
    swingDirection: 'double',
    category: 'exterior',
    icon: '🚪🚪',
  },

  // Sliding Doors
  {
    id: 'sliding_patio',
    name: 'Sliding Patio',
    description: 'Sliding patio door - 1800mm wide',
    width: 1800,
    height: 2100,
    swingDirection: 'sliding',
    category: 'patio',
    icon: '➡️',
  },
  {
    id: 'sliding_wide',
    name: 'Sliding Wide',
    description: 'Wide sliding door - 2400mm for large openings',
    width: 2400,
    height: 2100,
    swingDirection: 'sliding',
    category: 'patio',
    icon: '➡️',
  },
  {
    id: 'sliding_narrow',
    name: 'Sliding Narrow',
    description: 'Narrow sliding door - 1200mm for tight spaces',
    width: 1200,
    height: 2100,
    swingDirection: 'sliding',
    category: 'patio',
    icon: '➡️',
  },

  // Specialty Doors
  {
    id: 'bathroom',
    name: 'Bathroom',
    description: 'Compact bathroom door - 700mm wide',
    width: 700,
    height: 2100,
    swingDirection: 'right',
    category: 'specialty',
    icon: '🚿',
  },
  {
    id: 'closet',
    name: 'Closet',
    description: 'Narrow closet door - 600mm wide',
    width: 600,
    height: 2100,
    swingDirection: 'right',
    category: 'specialty',
    icon: '👕',
  },
  {
    id: 'utility',
    name: 'Utility',
    description: 'Utility room door - 800mm x 2000mm',
    width: 800,
    height: 2000,
    swingDirection: 'left',
    category: 'specialty',
    icon: '🔧',
  },
  {
    id: 'garage_personnel',
    name: 'Garage Personnel',
    description: 'Personnel door to garage - 900mm x 2000mm',
    width: 900,
    height: 2000,
    swingDirection: 'right',
    category: 'specialty',
    icon: '🚗',
  },
];

/**
 * Get all door presets
 */
export function getAllDoorPresets(): DoorPreset[] {
  return [...DOOR_PRESETS];
}

/**
 * Get door presets by category
 */
export function getDoorPresetsByCategory(
  category: DoorPreset['category']
): DoorPreset[] {
  return DOOR_PRESETS.filter((preset) => preset.category === category);
}

/**
 * Get a single door preset by ID
 */
export function getDoorPresetById(id: string): DoorPreset | undefined {
  return DOOR_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get door presets by swing direction
 */
export function getDoorPresetsBySwing(
  swing: DoorSwingDirection
): DoorPreset[] {
  return DOOR_PRESETS.filter((preset) => preset.swingDirection === swing);
}

/**
 * Get default door preset
 */
export function getDefaultDoorPreset(): DoorPreset {
  return DOOR_PRESETS[0];
}

/**
 * Categories for door presets
 */
export const DOOR_CATEGORIES = [
  { id: 'interior', name: 'Interior', description: 'Doors for interior rooms' },
  { id: 'exterior', name: 'Exterior', description: 'Entry and exterior doors' },
  { id: 'patio', name: 'Patio', description: 'Patio and sliding doors' },
  { id: 'specialty', name: 'Specialty', description: 'Bathroom, closet, utility doors' },
] as const;

/**
 * Create a custom door preset
 */
export function createDoorPreset(
  name: string,
  width: number,
  height: number,
  swingDirection: DoorSwingDirection,
  category: DoorPreset['category'] = 'interior',
  description?: string
): DoorPreset {
  return {
    id: `custom_${Date.now()}`,
    name,
    description: description || `Custom ${name} door`,
    width,
    height,
    swingDirection,
    category,
    icon: '🚪',
  };
}

/**
 * Get door dimensions with validation
 */
export function getValidatedDoorDimensions(
  width: number,
  height: number,
  preset?: DoorPreset
): { width: number; height: number; warnings: string[] } {
  const warnings: string[] = [];
  let validatedWidth = width;
  let validatedHeight = height;

  // Minimum dimensions
  if (width < 600) {
    warnings.push(`Door width ${width}mm is below minimum 600mm`);
    validatedWidth = 600;
  }
  if (height < 1800) {
    warnings.push(`Door height ${height}mm is below minimum 1800mm`);
    validatedHeight = 1800;
  }

  // Maximum dimensions
  if (width > 2400) {
    warnings.push(`Door width ${width}mm exceeds maximum 2400mm`);
    validatedWidth = 2400;
  }
  if (height > 2400) {
    warnings.push(`Door height ${height}mm exceeds maximum 2400mm`);
    validatedHeight = 2400;
  }

  return { width: validatedWidth, height: validatedHeight, warnings };
}

/**
 * Get swing arc path for door visualization
 * Returns SVG path string for the swing arc
 */
export function getDoorSwingArcPath(
  position: { x: number; y: number },
  width: number,
  swingDirection: DoorSwingDirection,
  wallAngle: number = 0
): string | null {
  if (swingDirection === 'sliding') return null;

  const sweep = width;
  const startAngle = wallAngle + (swingDirection === 'left' ? Math.PI : 0);
  const endAngle = startAngle + (swingDirection === 'double' ? Math.PI / 2 : Math.PI / 2);

  if (swingDirection === 'double') {
    // Double swing - two arcs
    const leftStart = wallAngle;
    const leftEnd = wallAngle + Math.PI / 2;
    const rightStart = wallAngle + Math.PI;
    const rightEnd = wallAngle + Math.PI / 2;

    const x1 = position.x + Math.cos(leftStart) * sweep;
    const y1 = position.y + Math.sin(leftStart) * sweep;
    const x2 = position.x + Math.cos(leftEnd) * sweep;
    const y2 = position.y + Math.sin(leftEnd) * sweep;

    const x3 = position.x + Math.cos(rightStart) * sweep;
    const y3 = position.y + Math.sin(rightStart) * sweep;
    const x4 = position.x + Math.cos(rightEnd) * sweep;
    const y4 = position.y + Math.sin(rightEnd) * sweep;

    return (
      `M ${position.x} ${position.y} L ${x1} ${y1} ` +
      `A ${sweep} ${sweep} 0 0 1 ${x2} ${y2} ` +
      `M ${position.x} ${position.y} L ${x3} ${y3} ` +
      `A ${sweep} ${sweep} 0 0 1 ${x4} ${y4}`
    );
  }

  // Single swing
  const startX = position.x + Math.cos(startAngle) * sweep;
  const startY = position.y + Math.sin(startAngle) * sweep;
  const endX = position.x + Math.cos(endAngle) * sweep;
  const endY = position.y + Math.sin(endAngle) * sweep;

  return (
    `M ${position.x} ${position.y} ` +
    `L ${startX} ${startY} ` +
    `A ${sweep} ${sweep} 0 0 1 ${endX} ${endY} ` +
    `Z`
  );
}

export default {
  DOOR_PRESETS,
  DOOR_CATEGORIES,
  getAllDoorPresets,
  getDoorPresetsByCategory,
  getDoorPresetById,
  getDoorPresetsBySwing,
  getDefaultDoorPreset,
  createDoorPreset,
  getValidatedDoorDimensions,
  getDoorSwingArcPath,
};