/**
 * 3D Types for BIM Workbench
 * 
 * Type definitions for 3D BIM objects, working planes, and related concepts.
 */

import * as THREE from 'three';

/**
 * BIM Object metadata interface for IFC-compatible objects
 */
export interface BIMObjectMetadata {
  /** IFC type (e.g., 'IfcWall', 'IfcDoor', 'IfcWindow') */
  ifcType: string;
  
  /** Material reference or material name */
  material: string | THREE.Material;
  
  /** Floor/level identifier */
  level: string;
  
  /** Unique identifier for the object */
  id: string;
  
  /** Custom BIM properties */
  properties: Record<string, any>;
  
  /** Object name/display name */
  name?: string;
  
  /** Creation timestamp */
  createdAt?: number;
  
  /** Last modified timestamp */
  modifiedAt?: number;
}

/**
 * Working plane orientation types
 */
export type PlaneOrientation = 'top' | 'front' | 'side' | 'custom';

/**
 * Working plane configuration
 */
export interface WorkingPlane {
  /** Plane orientation preset or custom */
  orientation: PlaneOrientation;
  
  /** Plane normal vector */
  normal: THREE.Vector3;
  
  /** Plane constant (d in ax + by + cz + d = 0) */
  constant: number;
  
  /** Plane origin point */
  origin: THREE.Vector3;
  
  /** Whether the plane helper is visible */
  visible: boolean;
  
  /** Size of the plane visualization */
  size: number;
  
  /** Plane color for visualization */
  color?: THREE.Color;
}

/**
 * BIM Object types supported by the factory
 */
export type BIMObjectType = 
  | 'wall' 
  | 'door' 
  | 'window' 
  | 'floor' 
  | 'ceiling' 
  | 'column'
  | 'beam'
  | 'roof'
  | 'stair'
  | 'railing'
  | 'custom';

/**
 * Options for creating BIM objects
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
  
  /** Object name */
  name?: string;
}

/**
 * Selection visual configuration
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
 * Canvas event handlers
 */
export interface BIM3DCanvasEvents {
  /** Called when an object is selected */
  onObjectSelect?: (id: string, multi: boolean) => void;
  
  /** Called when an object is deselected */
  onObjectDeselect?: (id: string) => void;
  
  /** Called when canvas is clicked (empty space) */
  onCanvasClick?: (point: THREE.Vector3) => void;
  
  /** Called when an object is hovered */
  onObjectHover?: (id: string | null) => void;
}

/**
 * Canvas configuration props
 */
export interface BIM3DCanvasProps extends BIM3DCanvasEvents {
  /** Array of BIM objects to render */
  objects: any[]; // Will be BIM3DObject[]
  
  /** IDs of currently selected objects */
  selectedIds: string[];
  
  /** Current working plane configuration */
  workingPlane?: WorkingPlane;
  
  /** Grid size in world units */
  gridSize?: number;
  
  /** Number of grid divisions */
  gridDivisions?: number;
  
  /** Background color */
  backgroundColor?: string;
  
  /** Whether to show the grid */
  showGrid?: boolean;
  
  /** Camera position */
  cameraPosition?: [number, number, number];
  
  /** Camera target */
  cameraTarget?: [number, number, number];
}

/**
 * Transform event data
 */
export interface TransformEvent {
  /** Object being transformed */
  object: any; // BIM3DObject
  
  /** Transform type */
  type: 'translate' | 'rotate' | 'scale';
  
  /** Current position */
  position: THREE.Vector3;
  
  /** Current rotation */
  rotation: THREE.Euler;
  
  /** Current scale */
  scale: THREE.Vector3;
}

/**
 * Snap settings for transform controls
 */
export interface SnapSettings {
  /** Enable translation snapping */
  translateSnap: boolean;
  
  /** Translation snap increment */
  translateSnapValue: number;
  
  /** Enable rotation snapping */
  rotationSnap: boolean;
  
  /** Rotation snap increment (radians) */
  rotationSnapValue: number;
  
  /** Enable scale snapping */
  scaleSnap: boolean;
  
  /** Scale snap increment */
  scaleSnapValue: number;
}

/**
 * Default snap settings
 */
export const DEFAULT_SNAP_SETTINGS: SnapSettings = {
  translateSnap: false,
  translateSnapValue: 100, // mm
  rotationSnap: false,
  rotationSnapValue: Math.PI / 12, // 15 degrees
  scaleSnap: false,
  scaleSnapValue: 0.1,
};

/**
 * IFC type mappings
 */
export const IFC_TYPE_MAP: Record<BIMObjectType, string> = {
  wall: 'IfcWall',
  door: 'IfcDoor',
  window: 'IfcWindow',
  floor: 'IfcSlab',
  ceiling: 'IfcCovering',
  column: 'IfcColumn',
  beam: 'IfcBeam',
  roof: 'IfcRoof',
  stair: 'IfcStair',
  railing: 'IfcRailing',
  custom: 'IfcBuildingElementProxy',
};

/**
 * Default working plane configurations
 */
export const DEFAULT_WORKING_PLANES: Record<Exclude<PlaneOrientation, 'custom'>, Omit<WorkingPlane, 'orientation'>> = {
  top: {
    normal: new THREE.Vector3(0, 1, 0),
    constant: 0,
    origin: new THREE.Vector3(0, 0, 0),
    visible: true,
    size: 10000,
    color: new THREE.Color(0x4a9eff),
  },
  front: {
    normal: new THREE.Vector3(0, 0, 1),
    constant: 0,
    origin: new THREE.Vector3(0, 0, 0),
    visible: true,
    size: 10000,
    color: new THREE.Color(0xff6b4a),
  },
  side: {
    normal: new THREE.Vector3(1, 0, 0),
    constant: 0,
    origin: new THREE.Vector3(0, 0, 0),
    visible: true,
    size: 10000,
    color: new THREE.Color(0x6bff4a),
  },
};
