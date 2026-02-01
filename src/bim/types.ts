/**
 * Building Elements Type Definitions
 * 
 * Provides type safety for doors, windows, stairs, roofs,
 * and their properties in the BIM system.
 */

import type { Point2D } from '../types/drafting';

/**
 * Base interface for all building elements
 */
export interface BuildingElement {
  id: string;
  type: 'door' | 'window' | 'stairs' | 'roof' | 'wall';
  name: string;
  position: Point2D;
  rotation: number;
  visible: boolean;
  locked: boolean;
}

/**
 * Wall element
 */
export interface Wall extends BuildingElement {
  type: 'wall';
  startPoint: Point2D;
  endPoint: Point2D;
  thickness: number;
  height: number;
  openings: WallOpening[];
  material: string;
}

/**
 * Opening in a wall (door or window)
 */
export interface WallOpening {
  id: string;
  type: 'door' | 'window';
  position: number; // Distance from wall start (0-1)
  width: number;
  height: number;
  sillHeight: number;
  elementId: string; // Reference to door/window element
}

/**
 * Door swing direction
 */
export type DoorSwingDirection = 'left' | 'right' | 'double' | 'sliding';

/**
 * Door element
 */
export interface Door extends BuildingElement {
  type: 'door';
  width: number;
  height: number;
  sillHeight: number;
  swingDirection: DoorSwingDirection;
  hostWallId: string | null;
  positionOnWall: number | null; // 0-1 along wall
  frameWidth: number;
  material: string;
}

/**
 * Window type
 */
export type WindowType = 'fixed' | 'singleHung' | 'doubleHung' | 'casement' | 'sliding' | 'awning';

/**
 * Window element
 */
export interface Window extends BuildingElement {
  type: 'window';
  width: number;
  height: number;
  sillHeight: number;
  windowType: WindowType;
  hostWallId: string | null;
  positionOnWall: number | null;
  frameWidth: number;
  glassThickness: number;
  material: string;
}

/**
 * Stair path type
 */
export type StairPathType = 'straight' | 'lShape' | 'uShape';

/**
 * Stair element
 */
export interface Stairs extends BuildingElement {
  type: 'stairs';
  totalRise: number;
  totalRun: number;
  treadDepth: number;
  riserHeight: number;
  stairCount: number;
  stairWidth: number;
  pathType: StairPathType;
  pathPoints: Point2D[];
  landingDepth: number;
  hasLanding: boolean;
  material: string;
}

/**
 * Calculated stair step
 */
export interface StairStep {
  index: number;
  treadStart: Point2D;
  treadEnd: Point2D;
  riserHeight: number;
  cumulativeRise: number;
}

/**
 * Roof type
 */
export type RoofType = 'gable' | 'hip' | 'shed' | 'flat';

/**
 * Roof element
 */
export interface Roof extends BuildingElement {
  type: 'roof';
  slopeAngle: number; // degrees
  overhang: number;
  roofType: RoofType;
  thickness: number;
  baseWireId: string | null;
  basePoints: Point2D[];
  ridgeHeight: number;
  material: string;
}

/**
 * Roof face (for geometry generation)
 */
export interface RoofFace {
  id: string;
  vertices: Point2D[];
  elevation: number;
  slope: number;
}

/**
 * Door preset configuration
 */
export interface DoorPreset {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  swingDirection: DoorSwingDirection;
  icon?: string;
  category: 'interior' | 'exterior' | 'patio' | 'specialty';
}

/**
 * Window preset configuration
 */
export interface WindowPreset {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  sillHeight: number;
  windowType: WindowType;
  icon?: string;
  category: 'standard' | 'large' | 'bathroom' | 'specialty';
}

/**
 * Cut operation result
 */
export interface CutResult {
  success: boolean;
  originalPath: string;
  cutPaths: string[];
  remainingPath: string | null;
  error?: string;
}

/**
 * Property panel field type
 */
export type PropertyFieldType = 'number' | 'text' | 'select' | 'boolean' | 'color' | 'point';

/**
 * Property panel field definition
 */
export interface PropertyField {
  name: string;
  label: string;
  type: PropertyFieldType;
  value: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: unknown }[];
  readOnly?: boolean;
  group?: string;
}

/**
 * Property panel section
 */
export interface PropertySection {
  name: string;
  label: string;
  fields: PropertyField[];
  collapsed?: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Default values for building elements
 */
export const DEFAULT_DOOR: Omit<Door, 'id' | 'position'> = {
  type: 'door',
  name: 'Door',
  rotation: 0,
  visible: true,
  locked: false,
  width: 900,
  height: 2100,
  sillHeight: 0,
  swingDirection: 'right',
  hostWallId: null,
  positionOnWall: null,
  frameWidth: 50,
  material: 'wood',
};

export const DEFAULT_WINDOW: Omit<Window, 'id' | 'position'> = {
  type: 'window',
  name: 'Window',
  rotation: 0,
  visible: true,
  locked: false,
  width: 900,
  height: 1200,
  sillHeight: 900,
  windowType: 'casement',
  hostWallId: null,
  positionOnWall: null,
  frameWidth: 50,
  glassThickness: 6,
  material: 'aluminum',
};

export const DEFAULT_STAIRS: Omit<Stairs, 'id' | 'position'> = {
  type: 'stairs',
  name: 'Stairs',
  rotation: 0,
  visible: true,
  locked: false,
  totalRise: 3000,
  totalRun: 4000,
  treadDepth: 280,
  riserHeight: 175,
  stairCount: 17,
  stairWidth: 1000,
  pathType: 'straight',
  pathPoints: [],
  landingDepth: 1200,
  hasLanding: false,
  material: 'concrete',
};

export const DEFAULT_ROOF: Omit<Roof, 'id' | 'position'> = {
  type: 'roof',
  name: 'Roof',
  rotation: 0,
  visible: true,
  locked: false,
  slopeAngle: 30,
  overhang: 300,
  roofType: 'gable',
  thickness: 200,
  baseWireId: null,
  basePoints: [],
  ridgeHeight: 0,
  material: 'tile',
};

export default {
  DEFAULT_DOOR,
  DEFAULT_WINDOW,
  DEFAULT_STAIRS,
  DEFAULT_ROOF,
};