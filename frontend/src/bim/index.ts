/**
 * BIM Module Index
 * 
 * Export all BIM-related components and utilities
 */

// Property Panels
export {
  WallPropertiesPanel,
  BeamPropertiesPanel,
  ColumnPropertiesPanel,
  SlabPropertiesPanel,
} from './property-panels'

export {
  StructuralPropertyPanel,
  PropertiesSidebar,
  useSelectedStructuralObject,
} from './property-panels/StructuralPropertyPanel'

// Types
export * from './types/structural'

// Validators
export * from './validators/StructuralValidator'

// Demo
export { default as StructuralObjectsDemo } from './StructuralObjectsDemo'
