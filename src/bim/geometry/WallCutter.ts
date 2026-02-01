/**
 * WallCutter - Boolean Operations for Wall Openings
 * 
 * Provides geometric boolean operations to cut door and window
 * openings through wall geometry. Handles complex cases like
 * multiple openings, overlapping cuts, and edge cases.
 */

import type { Point2D } from '../../types/drafting';
import type { Wall, WallOpening, CutResult } from '../types';

/**
 * Line segment representation
 */
interface LineSegment {
  start: Point2D;
  end: Point2D;
  length: number;
  angle: number;
}

/**
 * Rectangle representing an opening
 */
interface OpeningRect {
  center: Point2D;
  width: number;
  height: number;
  angle: number;
}

/**
 * WallCutter class for boolean operations on walls
 */
export class WallCutter {
  private wall: Wall;
  private openings: WallOpening[];

  constructor(wall: Wall) {
    this.wall = wall;
    this.openings = [...wall.openings];
  }

  /**
   * Get the main axis line of the wall
   */
  private getWallAxis(): LineSegment {
    const dx = this.wall.endPoint.x - this.wall.startPoint.x;
    const dy = this.wall.endPoint.y - this.wall.startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    return {
      start: this.wall.startPoint,
      end: this.wall.endPoint,
      length,
      angle,
    };
  }

  /**
   * Get wall outline as polygon points
   */
  getWallOutline(): Point2D[] {
    const axis = this.getWallAxis();
    const halfThickness = this.wall.thickness / 2;
    const perpX = -Math.sin(axis.angle) * halfThickness;
    const perpY = Math.cos(axis.angle) * halfThickness;

    return [
      { x: this.wall.startPoint.x + perpX, y: this.wall.startPoint.y + perpY },
      { x: this.wall.endPoint.x + perpX, y: this.wall.endPoint.y + perpY },
      { x: this.wall.endPoint.x - perpX, y: this.wall.endPoint.y - perpY },
      { x: this.wall.startPoint.x - perpX, y: this.wall.startPoint.y - perpY },
    ];
  }

  /**
   * Convert opening to rectangle in world coordinates
   */
  private openingToRect(opening: WallOpening): OpeningRect {
    const axis = this.getWallAxis();
    
    // Calculate position along wall
    const distanceFromStart = opening.position * axis.length;
    const centerX = axis.start.x + Math.cos(axis.angle) * distanceFromStart;
    const centerY = axis.start.y + Math.sin(axis.angle) * distanceFromStart;

    return {
      center: { x: centerX, y: centerY },
      width: opening.width,
      height: opening.height,
      angle: axis.angle,
    };
  }

  /**
   * Get opening outline as polygon points
   */
  getOpeningOutline(opening: WallOpening): Point2D[] {
    const rect = this.openingToRect(opening);
    const halfWidth = rect.width / 2;
    const halfHeight = this.wall.thickness / 2 + 10; // Slightly larger than wall

    const cos = Math.cos(rect.angle);
    const sin = Math.sin(rect.angle);

    // Rectangle corners relative to center
    const corners = [
      { x: -halfWidth, y: -halfHeight },
      { x: halfWidth, y: -halfHeight },
      { x: halfWidth, y: halfHeight },
      { x: -halfWidth, y: halfHeight },
    ];

    // Rotate and translate to world coordinates
    return corners.map((corner) => ({
      x: rect.center.x + corner.x * cos - corner.y * sin,
      y: rect.center.y + corner.x * sin + corner.y * cos,
    }));
  }

  /**
   * Check if point is inside polygon
   */
  private pointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Check if two line segments intersect
   */
  private lineSegmentsIntersect(
    a1: Point2D,
    a2: Point2D,
    b1: Point2D,
    b2: Point2D
  ): boolean {
    const d = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
    if (d === 0) return false;

    const t = ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / d;
    const u = ((b1.x - a1.x) * (a2.y - a1.y) - (b1.y - a1.y) * (a2.x - a1.x)) / d;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  /**
   * Find intersection point of two line segments
   */
  private getLineIntersection(
    a1: Point2D,
    a2: Point2D,
    b1: Point2D,
    b2: Point2D
  ): Point2D | null {
    const d = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
    if (d === 0) return null;

    const t = ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / d;
    const u = ((b1.x - a1.x) * (a2.y - a1.y) - (b1.y - a1.y) * (a2.x - a1.x)) / d;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: a1.x + t * (a2.x - a1.x),
        y: a1.y + t * (a2.y - a1.y),
      };
    }
    return null;
  }

  /**
   * Check if an opening is valid (within wall bounds and not overlapping excessively)
   */
  validateOpening(opening: WallOpening): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const axis = this.getWallAxis();

    // Check position is within wall (with some tolerance)
    if (opening.position < -0.01 || opening.position > 1.01) {
      errors.push(`Opening position ${opening.position} is outside wall bounds (0-1)`);
    }

    // Check width is reasonable
    if (opening.width <= 0) {
      errors.push('Opening width must be positive');
    }
    if (opening.width > axis.length * 0.9) {
      errors.push('Opening width exceeds 90% of wall length');
    }

    // Check height is reasonable
    if (opening.height <= 0) {
      errors.push('Opening height must be positive');
    }
    if (opening.height > this.wall.height) {
      errors.push('Opening height exceeds wall height');
    }

    // Check sill height
    if (opening.sillHeight < 0) {
      errors.push('Sill height cannot be negative');
    }
    if (opening.sillHeight + opening.height > this.wall.height) {
      errors.push('Opening extends above wall top');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Calculate the wall segments remaining after cutting openings
   */
  calculateWallSegments(): Point2D[][] {
    if (this.openings.length === 0) {
      return [this.getWallOutline()];
    }

    const axis = this.getWallAxis();
    const halfThickness = this.wall.thickness / 2;
    const perpX = -Math.sin(axis.angle) * halfThickness;
    const perpY = Math.cos(axis.angle) * halfThickness;

    // Sort openings by position along wall
    const sortedOpenings = [...this.openings].sort((a, b) => a.position - b.position);

    const segments: Point2D[][] = [];
    let currentPos = 0;

    for (const opening of sortedOpenings) {
      const openingStart = Math.max(0, opening.position - (opening.width / 2) / axis.length);
      const openingEnd = Math.min(1, opening.position + (opening.width / 2) / axis.length);

      if (openingStart > currentPos) {
        // Create segment from currentPos to openingStart
        const segStart = {
          x: axis.start.x + Math.cos(axis.angle) * (currentPos * axis.length),
          y: axis.start.y + Math.sin(axis.angle) * (currentPos * axis.length),
        };
        const segEnd = {
          x: axis.start.x + Math.cos(axis.angle) * (openingStart * axis.length),
          y: axis.start.y + Math.sin(axis.angle) * (openingStart * axis.length),
        };

        segments.push([
          { x: segStart.x + perpX, y: segStart.y + perpY },
          { x: segEnd.x + perpX, y: segEnd.y + perpY },
          { x: segEnd.x - perpX, y: segEnd.y - perpY },
          { x: segStart.x - perpX, y: segStart.y - perpY },
        ]);
      }

      currentPos = openingEnd;
    }

    // Add final segment if there's remaining wall
    if (currentPos < 1) {
      const segStart = {
        x: axis.start.x + Math.cos(axis.angle) * (currentPos * axis.length),
        y: axis.start.y + Math.sin(axis.angle) * (currentPos * axis.length),
      };

      segments.push([
        { x: segStart.x + perpX, y: segStart.y + perpY },
        { x: axis.end.x + perpX, y: axis.end.y + perpY },
        { x: axis.end.x - perpX, y: axis.end.y - perpY },
        { x: segStart.x - perpX, y: segStart.y - perpY },
      ]);
    }

    return segments;
  }

  /**
   * Perform boolean cut operation
   * Returns SVG path strings for the wall with openings
   */
  cut(): CutResult {
    try {
      // Validate all openings
      for (const opening of this.openings) {
        const validation = this.validateOpening(opening);
        if (!validation.valid) {
          return {
            success: false,
            originalPath: this.createSVGPath(this.getWallOutline()),
            cutPaths: [],
            remainingPath: null,
            error: `Invalid opening ${opening.id}: ${validation.errors.join(', ')}`,
          };
        }
      }

      // Calculate wall segments with openings removed
      const segments = this.calculateWallSegments();

      // Create SVG paths
      const cutPaths = this.openings.map((opening) =>
        this.createSVGPath(this.getOpeningOutline(opening))
      );

      // Create remaining wall path (may be multiple segments)
      const remainingPaths = segments.map((segment) => this.createSVGPath(segment));

      return {
        success: true,
        originalPath: this.createSVGPath(this.getWallOutline()),
        cutPaths,
        remainingPath: remainingPaths.join(' '),
      };
    } catch (error) {
      return {
        success: false,
        originalPath: this.createSVGPath(this.getWallOutline()),
        cutPaths: [],
        remainingPath: null,
        error: error instanceof Error ? error.message : 'Unknown error during cut operation',
      };
    }
  }

  /**
   * Convert polygon points to SVG path string
   */
  private createSVGPath(points: Point2D[]): string {
    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    path += ' Z';
    return path;
  }

  /**
   * Add an opening to the wall
   */
  addOpening(opening: WallOpening): { success: boolean; error?: string } {
    const validation = this.validateOpening(opening);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    // Check for excessive overlap with existing openings
    for (const existing of this.openings) {
      const existingStart = existing.position - (existing.width / 2) / this.getWallAxis().length;
      const existingEnd = existing.position + (existing.width / 2) / this.getWallAxis().length;
      const newStart = opening.position - (opening.width / 2) / this.getWallAxis().length;
      const newEnd = opening.position + (opening.width / 2) / this.getWallAxis().length;

      // Check for more than 50% overlap
      const overlapStart = Math.max(existingStart, newStart);
      const overlapEnd = Math.min(existingEnd, newEnd);
      const overlapAmount = Math.max(0, overlapEnd - overlapStart);
      
      const newWidth = newEnd - newStart;
      if (overlapAmount > newWidth * 0.5) {
        return {
          success: false,
          error: `Opening overlaps excessively with existing opening ${existing.id}`,
        };
      }
    }

    this.openings.push(opening);
    return { success: true };
  }

  /**
   * Remove an opening from the wall
   */
  removeOpening(openingId: string): boolean {
    const index = this.openings.findIndex((o) => o.id === openingId);
    if (index >= 0) {
      this.openings.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update an existing opening
   */
  updateOpening(openingId: string, updates: Partial<WallOpening>): boolean {
    const index = this.openings.findIndex((o) => o.id === openingId);
    if (index >= 0) {
      this.openings[index] = { ...this.openings[index], ...updates };
      return true;
    }
    return false;
  }

  /**
   * Get the position along wall for a world point
   * Returns 0-1 value or -1 if point is not near wall
   */
  getPositionOnWall(point: Point2D, tolerance: number = 50): number {
    const axis = this.getWallAxis();
    
    // Project point onto wall axis
    const dx = point.x - axis.start.x;
    const dy = point.y - axis.start.y;
    
    // Distance along axis
    const dot = dx * Math.cos(axis.angle) + dy * Math.sin(axis.angle);
    const position = dot / axis.length;
    
    // Distance from axis (perpendicular)
    const perpDist = Math.abs(
      dx * Math.sin(axis.angle) - dy * Math.cos(axis.angle)
    );
    
    if (perpDist > this.wall.thickness / 2 + tolerance) {
      return -1;
    }
    
    return Math.max(0, Math.min(1, position));
  }
}

/**
 * Factory function to create a WallCutter
 */
export function createWallCutter(wall: Wall): WallCutter {
  return new WallCutter(wall);
}

/**
 * Utility to cut a door opening in a wall
 */
export function cutDoorOpening(
  wall: Wall,
  position: number,
  width: number,
  height: number
): CutResult {
  const cutter = new WallCutter(wall);
  
  const opening: WallOpening = {
    id: `door_${Date.now()}`,
    type: 'door',
    position,
    width,
    height,
    sillHeight: 0,
    elementId: '',
  };
  
  const result = cutter.addOpening(opening);
  if (!result.success) {
    return {
      success: false,
      originalPath: '',
      cutPaths: [],
      remainingPath: null,
      error: result.error,
    };
  }
  
  return cutter.cut();
}

/**
 * Utility to cut a window opening in a wall
 */
export function cutWindowOpening(
  wall: Wall,
  position: number,
  width: number,
  height: number,
  sillHeight: number
): CutResult {
  const cutter = new WallCutter(wall);
  
  const opening: WallOpening = {
    id: `window_${Date.now()}`,
    type: 'window',
    position,
    width,
    height,
    sillHeight,
    elementId: '',
  };
  
  const result = cutter.addOpening(opening);
  if (!result.success) {
    return {
      success: false,
      originalPath: '',
      cutPaths: [],
      remainingPath: null,
      error: result.error,
    };
  }
  
  return cutter.cut();
}

export default WallCutter;