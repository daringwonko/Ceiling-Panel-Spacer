import * as THREE from 'three';

/**
 * BIM Object Metadata Interface
 * Stores IFC-compatible metadata for all 3D BIM objects
 */
export interface BIMObjectMetadata {
  /** IFC entity type (e.g., 'IfcWall', 'IfcDoor') */
  ifcType: string;
  
  /** Material reference or name */
  material: string;
  
  /** Floor/level identifier */
  level: string;
  
  /** Unique identifier for the object */
  id: string;
  
  /** Custom BIM properties */
  properties: Record<string, any>;
}

/**
 * Working Plane Types
 */
export type PlaneOrientation = 'top' | 'front' | 'side' | 'custom';

/**
 * Working Plane Interface
 * Defines a plane for object placement and manipulation
 */
export interface WorkingPlane {
  /** Plane orientation preset or custom */
  orientation: PlaneOrientation;
  
  /** Plane normal vector */
  normal: THREE.Vector3;
  
  /** Plane equation constant: ax + by + cz + d = 0 */
  constant: number;
  
  /** Plane origin point */
  origin: THREE.Vector3;
  
  /** Whether the plane helper is visible */
  visible: boolean;
  
  /** Size of the plane visualization */
  size: number;
}

/**
 * BIM Object Types
 */
export type BIMObjectType = 
  | 'wall' 
  | 'door' 
  | 'window' 
  | 'floor' 
  | 'ceiling' 
  | 'column'
  | 'beam'
  | 'custom';

/**
 * BIM Object Creation Options
 */
export interface BIMObjectCreateOptions {
  /** Object type */
  type: BIMObjectType;
  
  /** Position in 3D space */
  position?: THREE.Vector3;
  
  /** Rotation */
  rotation?: THREE.Euler;
  
  /** Scale */
  scale?: THREE.Vector3;
  
  /** Level/floor identifier */
  level?: string;
  
  /** Material reference */
  material?: string;
  
  /** Custom properties */
  properties?: Record<string, any>;
}

/**
 * Selection Visuals Configuration
 */
export interface SelectionVisuals {
  /** Whether to show highlight effect */
  highlight: boolean;
  
  /** Whether to show bounding box */
  boundingBox: boolean;
  
  /** Transform gizmo mode */
  transformGizmo: 'translate' | 'rotate' | 'scale' | null;
}

/**
 * Default metadata values
 */
export const DEFAULT_METADATA: Partial<BIMObjectMetadata> = {
  ifcType: 'IfcBuildingElementProxy',
  material: 'default',
  level: 'Level 0',
  properties: {}
};
