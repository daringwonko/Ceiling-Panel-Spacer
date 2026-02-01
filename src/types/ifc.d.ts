/**
 * IFC Type Definitions for BIM Workbench
 * Extends Three.js types for IFC object support
 */

import * as THREE from 'three';

// ============================================================================
// IFC Entity Types
// ============================================================================

export type IFCEntityType =
  | 'IfcProject'
  | 'IfcSite'
  | 'IfcBuilding'
  | 'IfcBuildingStorey'
  | 'IfcWall'
  | 'IfcWallStandardCase'
  | 'IfcBeam'
  | 'IfcColumn'
  | 'IfcSlab'
  | 'IfcDoor'
  | 'IfcWindow'
  | 'IfcRoof'
  | 'IfcCovering'
  | 'IfcStair'
  | 'IfcStairFlight'
  | 'IfcRamp'
  | 'IfcRampFlight'
  | 'IfcFurnishingElement'
  | 'IfcElement'
  | 'IfcProduct'
  | 'IfcSpatialElement'
  | string; // Allow unknown types

// ============================================================================
// BIM Object Types (Application-level)
// ============================================================================

export type BIMObjectType =
  | 'Wall'
  | 'Beam'
  | 'Column'
  | 'Slab'
  | 'Door'
  | 'Window'
  | 'Roof'
  | 'Covering'
  | 'Stair'
  | 'Ramp'
  | 'Furniture'
  | 'Site'
  | 'Building'
  | 'Level'
  | 'Element'
  | 'Unknown';

// ============================================================================
// IFC Property Structures
// ============================================================================

export interface IFCPropertyValue {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'entity';
  value: string | number | boolean;
  unit?: string;
}

export interface IFCPropertySet {
  name: string;
  description?: string;
  properties: IFCPropertyValue[];
}

export interface IFCQuantity {
  name: string;
  type: 'length' | 'area' | 'volume' | 'count';
  value: number;
  unit: string;
}

export interface IFCQuantitySet {
  name: string;
  quantities: IFCQuantity[];
}

// ============================================================================
// Geometry Types
// ============================================================================

export interface IFCGeometry {
  vertices: Float32Array;
  indices: Uint32Array;
  normals: Float32Array;
}

export interface IFCPlacement {
  x: number;
  y: number;
  z: number;
}

export interface IFCLocalPlacement {
  location: IFCPlacement;
  axis?: IFCPlacement;
  refDirection?: IFCPlacement;
}

// ============================================================================
// BIM Object Properties Interface
// ============================================================================

export interface BIMProperties {
  name?: string;
  description?: string;
  objectType?: string;
  ifcType: IFCEntityType;
  expressID: number;
  level?: string;
  placement?: IFCLocalPlacement;
  geometry?: IFCGeometry;
  propertySets: IFCPropertySet[];
  quantitySets: IFCQuantitySet[];
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
}

// ============================================================================
// Three.js Integration
// ============================================================================

declare module 'three' {
  interface Mesh {
    userData: {
      ifc?: {
        expressID: number;
        type: IFCEntityType;
        properties: BIMProperties;
      };
    };
  }

  interface Object3D {
    userData: {
      ifc?: {
        expressID: number;
        type: IFCEntityType;
      };
    };
  }
}

// ============================================================================
// Import Result Types
// ============================================================================

export interface IFCImportStatistics {
  totalElements: number;
  walls: number;
  beams: number;
  columns: number;
  slabs: number;
  doors: number;
  windows: number;
  other: number;
  levels: number;
  warnings: string[];
}

export interface IFCImportResult {
  success: boolean;
  statistics: IFCImportStatistics;
  model?: THREE.Group;
  spatialStructure?: SpatialTree;
  error?: string;
}

// ============================================================================
// Spatial Structure Types
// ============================================================================

export interface SpatialTreeNode {
  id: string;
  type: 'Site' | 'Building' | 'Level';
  name: string;
  expressID: number;
  children: SpatialTreeNode[];
  elements: BIMProperties[];
  placement?: IFCLocalPlacement;
}

export interface SpatialTree {
  project: {
    name: string;
    expressID: number;
  };
  site?: SpatialTreeNode;
  building?: SpatialTreeNode;
  levels: SpatialTreeNode[];
}

// ============================================================================
// Export Types
// ============================================================================

export interface IFCExportOptions {
  version: 'IFC4' | 'IFC2X3_TC1';
  includeGeometry: boolean;
  includeProperties: boolean;
  includeQuantities: boolean;
}

export interface IFCExportResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

// ============================================================================
// Loader Configuration
// ============================================================================

export interface IFCLoaderConfig {
  WASMPath?: string;
  workerPath?: string;
  useCache?: boolean;
}

// ============================================================================
// Type Guard Functions
// ============================================================================

export function isIFCSpatialElement(type: IFCEntityType): boolean {
  return ['IfcSite', 'IfcBuilding', 'IfcBuildingStorey'].includes(type);
}

export function isIFCBuildingElement(type: IFCEntityType): boolean {
  return [
    'IfcWall',
    'IfcWallStandardCase',
    'IfcBeam',
    'IfcColumn',
    'IfcSlab',
    'IfcDoor',
    'IfcWindow',
    'IfcRoof',
    'IfcCovering',
    'IfcStair',
    'IfcStairFlight',
    'IfcRamp',
    'IfcRampFlight'
  ].includes(type);
}

export function isIFCFurniture(type: IFCEntityType): boolean {
  return ['IfcFurnishingElement'].includes(type);
}
