/**
 * 2D Drafting System Type Definitions
 * 
 * Provides type safety for canvas operations, grid configuration,
 * coordinate transformations, and selection operations.
 */

/**
 * 2D Point in millimeters
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * SVG ViewBox definition
 * Defines the visible area of the canvas in world coordinates (mm)
 */
export interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

/**
 * Canvas navigation state
 * Tracks current view, zoom level, and panning operations
 */
export interface CanvasState {
  viewBox: ViewBox;
  zoom: number;
  isPanning: boolean;
  panStart: Point2D | null;
}

/**
 * Grid configuration
 * Controls grid visibility, spacing, colors, and snapping behavior
 */
export interface GridConfig {
  /** Whether grid is currently visible */
  visible: boolean;
  /** Major grid line spacing in mm (default: 100) */
  majorSize: number;
  /** Minor grid line spacing in mm (default: 10) */
  minorSize: number;
  /** Color for major grid lines */
  majorColor: string;
  /** Color for minor grid lines */
  minorColor: string;
  /** Whether snapping to grid is enabled */
  snapEnabled: boolean;
}

/**
 * Selection rectangle bounds
 * Used for click-drag selection operations
 */
export interface SelectionRect {
  /** Starting point of selection (screen coordinates) */
  start: Point2D;
  /** Current end point of selection (screen coordinates) */
  end: Point2D;
  /** Whether selection is currently active */
  active: boolean;
}

/**
 * Bounding box in world coordinates
 * Used for fit-to-view and selection operations
 */
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Default grid configuration
 */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  visible: true,
  majorSize: 100,
  minorSize: 10,
  majorColor: 'rgba(100, 100, 100, 0.5)',
  minorColor: 'rgba(80, 80, 80, 0.2)',
  snapEnabled: true,
};

/**
 * Default canvas state
 */
export const DEFAULT_CANVAS_STATE: CanvasState = {
  viewBox: {
    minX: -500,
    minY: -500,
    width: 1000,
    height: 1000,
  },
  zoom: 1.0,
  isPanning: false,
  panStart: null,
};

/**
 * Default selection rect (inactive)
 */
export const DEFAULT_SELECTION_RECT: SelectionRect = {
  start: { x: 0, y: 0 },
  end: { x: 0, y: 0 },
  active: false,
};

export default {
  DEFAULT_GRID_CONFIG,
  DEFAULT_CANVAS_STATE,
  DEFAULT_SELECTION_RECT,
};
