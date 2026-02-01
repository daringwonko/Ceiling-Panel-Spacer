/**
 * WindowPresets - Predefined Window Configurations
 * 
 * Provides a library of standard window sizes and types
 * for quick placement in BIM models. Includes fixed, casement,
 * double-hung, sliding, and specialty window types.
 */

import type { WindowPreset, WindowType } from '../types';

/**
 * Standard window preset configurations
 */
export const WINDOW_PRESETS: WindowPreset[] = [
  // Small Fixed Windows
  {
    id: 'small_fixed_600',
    name: 'Small Fixed 600',
    description: 'Small fixed window - 600mm square',
    width: 600,
    height: 600,
    sillHeight: 900,
    windowType: 'fixed',
    category: 'standard',
    icon: '⬜',
  },
  {
    id: 'small_fixed_900',
    name: 'Small Fixed 900',
    description: 'Fixed window - 900mm square',
    width: 900,
    height: 900,
    sillHeight: 900,
    windowType: 'fixed',
    category: 'standard',
    icon: '⬜',
  },
  {
    id: 'small_narrow',
    name: 'Small Narrow',
    description: 'Narrow fixed window - 600mm x 900mm',
    width: 600,
    height: 900,
    sillHeight: 1200,
    windowType: 'fixed',
    category: 'standard',
    icon: '▫️',
  },

  // Standard Casement Windows
  {
    id: 'casement_standard',
    name: 'Casement Standard',
    description: 'Standard casement window - 900mm x 1200mm',
    width: 900,
    height: 1200,
    sillHeight: 900,
    windowType: 'casement',
    category: 'standard',
    icon: '🪟',
  },
  {
    id: 'casement_narrow',
    name: 'Casement Narrow',
    description: 'Narrow casement window - 600mm x 1200mm',
    width: 600,
    height: 1200,
    sillHeight: 900,
    windowType: 'casement',
    category: 'standard',
    icon: '🪟',
  },
  {
    id: 'casement_wide',
    name: 'Casement Wide',
    description: 'Wide casement window - 1200mm x 1200mm',
    width: 1200,
    height: 1200,
    sillHeight: 900,
    windowType: 'casement',
    category: 'standard',
    icon: '🪟',
  },
  {
    id: 'casement_tall',
    name: 'Casement Tall',
    description: 'Tall casement window - 900mm x 1500mm',
    width: 900,
    height: 1500,
    sillHeight: 900,
    windowType: 'casement',
    category: 'standard',
    icon: '🪟',
  },

  // Double-Hung Windows
  {
    id: 'doublehung_standard',
    name: 'Double-Hung Standard',
    description: 'Standard double-hung window - 900mm x 1200mm',
    width: 900,
    height: 1200,
    sillHeight: 900,
    windowType: 'doubleHung',
    category: 'standard',
    icon: '🪟',
  },
  {
    id: 'doublehung_large',
    name: 'Double-Hung Large',
    description: 'Large double-hung window - 1200mm x 1500mm',
    width: 1200,
    height: 1500,
    sillHeight: 800,
    windowType: 'doubleHung',
    category: 'standard',
    icon: '🪟',
  },
  {
    id: 'doublehung_tall',
    name: 'Double-Hung Tall',
    description: 'Tall double-hung window - 900mm x 1800mm',
    width: 900,
    height: 1800,
    sillHeight: 0,
    windowType: 'doubleHung',
    category: 'large',
    icon: '🪟',
  },

  // Single-Hung Windows
  {
    id: 'singlehung_standard',
    name: 'Single-Hung Standard',
    description: 'Standard single-hung window - 900mm x 1200mm',
    width: 900,
    height: 1200,
    sillHeight: 900,
    windowType: 'singleHung',
    category: 'standard',
    icon: '🪟',
  },
  {
    id: 'singlehung_narrow',
    name: 'Single-Hung Narrow',
    description: 'Narrow single-hung window - 600mm x 1200mm',
    width: 600,
    height: 1200,
    sillHeight: 900,
    windowType: 'singleHung',
    category: 'standard',
    icon: '🪟',
  },

  // Sliding Windows
  {
    id: 'sliding_horizontal',
    name: 'Sliding Horizontal',
    description: 'Horizontal sliding window - 1500mm x 1200mm',
    width: 1500,
    height: 1200,
    sillHeight: 900,
    windowType: 'sliding',
    category: 'large',
    icon: '↔️',
  },
  {
    id: 'sliding_wide',
    name: 'Sliding Wide',
    description: 'Wide sliding window - 1800mm x 1200mm',
    width: 1800,
    height: 1200,
    sillHeight: 900,
    windowType: 'sliding',
    category: 'large',
    icon: '↔️',
  },
  {
    id: 'sliding_narrow',
    name: 'Sliding Narrow',
    description: 'Narrow sliding window - 1200mm x 900mm',
    width: 1200,
    height: 900,
    sillHeight: 900,
    windowType: 'sliding',
    category: 'standard',
    icon: '↔️',
  },

  // Large Windows
  {
    id: 'large_picture',
    name: 'Large Picture',
    description: 'Large picture window - 1800mm x 1500mm',
    width: 1800,
    height: 1500,
    sillHeight: 600,
    windowType: 'fixed',
    category: 'large',
    icon: '🖼️',
  },
  {
    id: 'large_floortoceiling',
    name: 'Floor-to-Ceiling',
    description: 'Floor-to-ceiling window - 1500mm x 2400mm',
    width: 1500,
    height: 2400,
    sillHeight: 0,
    windowType: 'fixed',
    category: 'large',
    icon: '🖼️',
  },
  {
    id: 'large_tall_narrow',
    name: 'Tall Narrow',
    description: 'Tall narrow window - 600mm x 1800mm',
    width: 600,
    height: 1800,
    sillHeight: 0,
    windowType: 'fixed',
    category: 'large',
    icon: '🖼️',
  },

  // Bathroom Windows
  {
    id: 'bathroom_awning',
    name: 'Bathroom Awning',
    description: 'Awning window for bathrooms - 600mm x 900mm, high sill',
    width: 600,
    height: 900,
    sillHeight: 1500,
    windowType: 'awning',
    category: 'bathroom',
    icon: '🚿',
  },
  {
    id: 'bathroom_small',
    name: 'Bathroom Small',
    description: 'Small bathroom window - 600mm x 600mm',
    width: 600,
    height: 600,
    sillHeight: 1800,
    windowType: 'fixed',
    category: 'bathroom',
    icon: '🚿',
  },
  {
    id: 'bathroom_narrow',
    name: 'Bathroom Narrow',
    description: 'Narrow bathroom window - 400mm x 800mm',
    width: 400,
    height: 800,
    sillHeight: 1600,
    windowType: 'fixed',
    category: 'bathroom',
    icon: '🚿',
  },

  // Kitchen Windows
  {
    id: 'kitchen_over_sink',
    name: 'Kitchen Over-Sink',
    description: 'Window over kitchen sink - 1200mm x 900mm',
    width: 1200,
    height: 900,
    sillHeight: 1200,
    windowType: 'casement',
    category: 'standard',
    icon: '🍳',
  },
  {
    id: 'kitchen_garden',
    name: 'Garden Window',
    description: 'Garden window - 1200mm x 1200mm with projection',
    width: 1200,
    height: 1200,
    sillHeight: 900,
    windowType: 'fixed',
    category: 'specialty',
    icon: '🌱',
  },

  // Specialty Windows
  {
    id: 'transom',
    name: 'Transom Window',
    description: 'Transom window above door - 900mm x 300mm',
    width: 900,
    height: 300,
    sillHeight: 2100,
    windowType: 'fixed',
    category: 'specialty',
    icon: '➖',
  },
  {
    id: 'sidelight',
    name: 'Sidelight',
    description: 'Sidelight next to door - 300mm x 2100mm',
    width: 300,
    height: 2100,
    sillHeight: 0,
    windowType: 'fixed',
    category: 'specialty',
    icon: '⏸️',
  },
  {
    id: 'clerestory',
    name: 'Clerestory',
    description: 'High clerestory window - 1200mm x 600mm',
    width: 1200,
    height: 600,
    sillHeight: 2700,
    windowType: 'fixed',
    category: 'specialty',
    icon: '☀️',
  },
  {
    id: 'basement',
    name: 'Basement',
    description: 'Basement egress window - 800mm x 600mm, low sill',
    width: 800,
    height: 600,
    sillHeight: 300,
    windowType: 'casement',
    category: 'specialty',
    icon: '🏚️',
  },
];

/**
 * Get all window presets
 */
export function getAllWindowPresets(): WindowPreset[] {
  return [...WINDOW_PRESETS];
}

/**
 * Get window presets by category
 */
export function getWindowPresetsByCategory(
  category: WindowPreset['category']
): WindowPreset[] {
  return WINDOW_PRESETS.filter((preset) => preset.category === category);
}

/**
 * Get a single window preset by ID
 */
export function getWindowPresetById(id: string): WindowPreset | undefined {
  return WINDOW_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get window presets by type
 */
export function getWindowPresetsByType(type: WindowType): WindowPreset[] {
  return WINDOW_PRESETS.filter((preset) => preset.windowType === type);
}

/**
 * Get default window preset
 */
export function getDefaultWindowPreset(): WindowPreset {
  return WINDOW_PRESETS[7]; // casement_standard
}

/**
 * Categories for window presets
 */
export const WINDOW_CATEGORIES = [
  { id: 'standard', name: 'Standard', description: 'Standard windows for most rooms' },
  { id: 'large', name: 'Large', description: 'Large windows for views and light' },
  { id: 'bathroom', name: 'Bathroom', description: 'Privacy windows for bathrooms' },
  { id: 'specialty', name: 'Specialty', description: 'Transoms, sidelights, custom windows' },
] as const;

/**
 * Window type definitions
 */
export const WINDOW_TYPES = [
  { id: 'fixed', name: 'Fixed', description: 'Non-opening window' },
  { id: 'casement', name: 'Casement', description: 'Side-hinged opening window' },
  { id: 'singleHung', name: 'Single-Hung', description: 'Bottom sash opens vertically' },
  { id: 'doubleHung', name: 'Double-Hung', description: 'Both sashes open vertically' },
  { id: 'sliding', name: 'Sliding', description: 'Slides horizontally' },
  { id: 'awning', name: 'Awning', description: 'Top-hinged, opens outward' },
] as const;

/**
 * Create a custom window preset
 */
export function createWindowPreset(
  name: string,
  width: number,
  height: number,
  sillHeight: number,
  windowType: WindowType,
  category: WindowPreset['category'] = 'standard',
  description?: string
): WindowPreset {
  return {
    id: `custom_${Date.now()}`,
    name,
    description: description || `Custom ${name} window`,
    width,
    height,
    sillHeight,
    windowType,
    category,
    icon: '🪟',
  };
}

/**
 * Get window dimensions with validation
 */
export function getValidatedWindowDimensions(
  width: number,
  height: number,
  sillHeight: number,
  preset?: WindowPreset
): { width: number; height: number; sillHeight: number; warnings: string[] } {
  const warnings: string[] = [];
  let validatedWidth = width;
  let validatedHeight = height;
  let validatedSillHeight = sillHeight;

  // Minimum dimensions
  if (width < 300) {
    warnings.push(`Window width ${width}mm is below minimum 300mm`);
    validatedWidth = 300;
  }
  if (height < 300) {
    warnings.push(`Window height ${height}mm is below minimum 300mm`);
    validatedHeight = 300;
  }
  if (sillHeight < 0) {
    warnings.push(`Sill height ${sillHeight}mm cannot be negative`);
    validatedSillHeight = 0;
  }

  // Maximum dimensions
  if (width > 2400) {
    warnings.push(`Window width ${width}mm exceeds maximum 2400mm`);
    validatedWidth = 2400;
  }
  if (height > 2400) {
    warnings.push(`Window height ${height}mm exceeds maximum 2400mm`);
    validatedHeight = 2400;
  }

  return {
    width: validatedWidth,
    height: validatedHeight,
    sillHeight: validatedSillHeight,
    warnings,
  };
}

/**
 * Get minimum sill height based on room type
 */
export function getMinimumSillHeight(roomType: string): number {
  const requirements: Record<string, number> = {
    bathroom: 1500,
    bedroom: 800,
    living_room: 0,
    kitchen: 900,
    basement: 300,
    garage: 1800,
    hallway: 1800,
    default: 900,
  };
  return requirements[roomType.toLowerCase()] || requirements.default;
}

/**
 * Check if window meets egress requirements
 */
export function checkEgressRequirements(
  width: number,
  height: number,
  sillHeight: number
): { meetsCode: boolean; issues: string[] } {
  const issues: string[] = [];

  // Standard egress requirements (may vary by jurisdiction)
  const minWidth = 508; // 20 inches
  const minHeight = 610; // 24 inches
  const minArea = 0.333; // 5.7 sq ft in sq meters
  const maxSillHeight = 1120; // 44 inches

  if (width < minWidth) {
    issues.push(`Width ${width}mm is below egress minimum ${minWidth}mm`);
  }
  if (height < minHeight) {
    issues.push(`Height ${height}mm is below egress minimum ${minHeight}mm`);
  }
  const area = (width / 1000) * (height / 1000);
  if (area < minArea) {
    issues.push(`Area ${area.toFixed(2)}m² is below egress minimum ${minArea}m²`);
  }
  if (sillHeight > maxSillHeight) {
    issues.push(`Sill height ${sillHeight}mm exceeds egress maximum ${maxSillHeight}mm`);
  }

  return { meetsCode: issues.length === 0, issues };
}

export default {
  WINDOW_PRESETS,
  WINDOW_CATEGORIES,
  WINDOW_TYPES,
  getAllWindowPresets,
  getWindowPresetsByCategory,
  getWindowPresetById,
  getWindowPresetsByType,
  getDefaultWindowPreset,
  createWindowPreset,
  getValidatedWindowDimensions,
  getMinimumSillHeight,
  checkEgressRequirements,
};