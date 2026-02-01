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
export { WorkingPlaneSystem, PlaneOrientation } from './WorkingPlaneSystem';

// Object factory
export { BIMObjectFactory } from './BIMObjectFactory';

// Selection visualization
export { SelectionVisualizer, SelectionVisualizerR3F } from './SelectionVisualizer';

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

export {
  DEFAULT_SNAP_SETTINGS,
  IFC_TYPE_MAP,
  DEFAULT_WORKING_PLANES,
} from './types/3d';
