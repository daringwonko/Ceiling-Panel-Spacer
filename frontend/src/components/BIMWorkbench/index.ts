/**
 * BIMWorkbench 3D Object Base System
 *
 * Foundation for 3D BIM object creation and management.
 *
 * @module BIMWorkbench
 */

// Base object class
export { BIM3DObject } from './BIM3DObject';

// Canvas component
export { BIM3DCanvas, useBIM3DCanvas } from './BIM3DCanvas';

// Working plane system
export { WorkingPlaneSystem } from './WorkingPlaneSystem';

// Object factory
export { BIMObjectFactory } from './BIMObjectFactory';

// Selection visualization
export { SelectionVisualizer, SelectionVisualizerR3F } from './SelectionVisualizer';

// Store-to-3D mapper (Wiring Agent 3)
export {
  BIMObjectToMeshMapper,
  StoreBIMObject,
  MapperOptions,
  MappingResult,
  useBIMObjectMapper,
} from './BIMObjectToMeshMapper';

// Types
export type {
  BIMObjectMetadata,
  PlaneOrientation,
  WorkingPlane,
  BIMObjectType,
  BIMObjectCreateOptions,
  SelectionVisuals,
  BIM3DCanvasProps,
  BIM3DCanvasEvents,
  TransformEvent,
  SnapSettings,
} from './types/3d';

export type { PlaneOrientation as WorkingPlaneSystemOrientation } from './WorkingPlaneSystem';

export {
  DEFAULT_SNAP_SETTINGS,
  IFC_TYPE_MAP,
  DEFAULT_WORKING_PLANES,
} from './types/3d';

// Workbench integration (Wave 3 - Backup Agent 4)
export { BIMWorkbench } from './BIMWorkbench';
