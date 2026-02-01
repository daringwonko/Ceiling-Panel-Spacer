/**
 * BIM Workbench - 3D Object System
 * 
 * Core 3D system for BIM object rendering, manipulation, and interaction.
 * Provides base classes for 3D objects, canvas component, working planes,
 * object factory, and selection visualization.
 */

// Types
export * from './types/3d';

// Core Classes
export { BIM3DObject } from './BIM3DObject';
export { WorkingPlaneSystem } from './WorkingPlaneSystem';
export { BIMObjectFactory } from './BIMObjectFactory';
export { SelectionVisualizer } from './SelectionVisualizer';

// Components
export { BIM3DCanvas, type BIM3DCanvasProps } from './BIM3DCanvas';
