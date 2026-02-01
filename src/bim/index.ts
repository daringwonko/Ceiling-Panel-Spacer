/**
 * BIM Module Index
 * 
 * Central export point for all BIM building element modules.
 */

// Types
export * from './types';

// Geometry
export { WallCutter, createWallCutter, cutDoorOpening, cutWindowOpening } from './geometry/WallCutter';
export { StairsGenerator, createStairs, BUILDING_CODES } from './geometry/StairsGenerator';
export { RoofGenerator, createRoof } from './geometry/RoofGenerator';

// Presets
export {
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
} from './presets/DoorPresets';

export {
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
} from './presets/WindowPresets';

// Property Panels (React components)
export {
  DoorPropertyPanel,
  WindowPropertyPanel,
  StairsPropertyPanel,
  RoofPropertyPanel,
} from './propertyPanels';

// Default exports
export { default as WallCutterDefault } from './geometry/WallCutter';
export { default as StairsGeneratorDefault } from './geometry/StairsGenerator';
export { default as RoofGeneratorDefault } from './geometry/RoofGenerator';
export { default as DoorPresetsDefault } from './presets/DoorPresets';
export { default as WindowPresetsDefault } from './presets/WindowPresets';