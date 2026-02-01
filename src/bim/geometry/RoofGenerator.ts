/**
 * RoofGenerator - Roof Geometry Generation Algorithms
 * 
 * Provides tools for generating roof geometry from closed wire
 * profiles. Supports gable, hip, shed, and flat roof types with
 * configurable slope angles and overhangs.
 */

import type { Point2D } from '../../types/drafting';
import type { Roof, RoofType, RoofFace } from '../types';

/**
 * Roof calculation result
 */
export interface RoofCalculation {
  ridgeHeight: number;
  roofArea: number;
  volume: number;
  faces: RoofFace[];
}

/**
 * Line segment utility
 */
interface LineSegment {
  start: Point2D;
  end: Point2D;
  length: number;
  angle: number;
  midpoint: Point2D;
}

/**
 * RoofGenerator class
 */
export class RoofGenerator {
  /**
   * Calculate line segment properties
   */
  private static getLineSegment(start: Point2D, end: Point2D): LineSegment {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    return {
      start,
      end,
      length,
      angle,
      midpoint: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      },
    };
  }

  /**
   * Check if wire is closed (first point equals last)
   */
  static isClosedWire(points: Point2D[], tolerance: number = 1): boolean {
    if (points.length < 3) return false;

    const first = points[0];
    const last = points[points.length - 1];

    const dx = first.x - last.x;
    const dy = first.y - last.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= tolerance;
  }

  /**
   * Close an open wire by adding the first point at the end
   */
  static closeWire(points: Point2D[]): Point2D[] {
    if (this.isClosedWire(points)) return points;
    return [...points, points[0]];
  }

  /**
   * Calculate polygon area using shoelace formula
   */
  static calculatePolygonArea(points: Point2D[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    const closed = this.isClosedWire(points) ? points : [...points, points[0]];

    for (let i = 0; i < closed.length - 1; i++) {
      area += closed[i].x * closed[i + 1].y;
      area -= closed[i + 1].x * closed[i].y;
    }

    return Math.abs(area) / 2;
  }

  /**
   * Calculate polygon centroid
   */
  static calculateCentroid(points: Point2D[]): Point2D {
    if (points.length === 0) return { x: 0, y: 0 };

    let x = 0;
    let y = 0;
    let area = 0;
    const closed = this.isClosedWire(points) ? points : [...points, points[0]];

    for (let i = 0; i < closed.length - 1; i++) {
      const cross = closed[i].x * closed[i + 1].y - closed[i + 1].x * closed[i].y;
      area += cross;
      x += (closed[i].x + closed[i + 1].x) * cross;
      y += (closed[i].y + closed[i + 1].y) * cross;
    }

    area /= 2;
    if (area === 0) {
      // Fallback to average
      x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    } else {
      x /= 6 * area;
      y /= 6 * area;
    }

    return { x, y };
  }

  /**
   * Extend a line segment by a given distance in both directions
   */
  private static extendSegment(
    segment: LineSegment,
    extension: number
  ): LineSegment {
    const cos = Math.cos(segment.angle);
    const sin = Math.sin(segment.angle);

    return {
      start: {
        x: segment.start.x - cos * extension,
        y: segment.start.y - sin * extension,
      },
      end: {
        x: segment.end.x + cos * extension,
        y: segment.end.y + sin * extension,
      },
      length: segment.length + 2 * extension,
      angle: segment.angle,
      midpoint: segment.midpoint,
    };
  }

  /**
   * Find intersection of two line segments
   */
  private static findIntersection(
    seg1: LineSegment,
    seg2: LineSegment
  ): Point2D | null {
    const x1 = seg1.start.x;
    const y1 = seg1.start.y;
    const x2 = seg1.end.x;
    const y2 = seg1.end.y;
    const x3 = seg2.start.x;
    const y3 = seg2.start.y;
    const x4 = seg2.end.x;
    const y4 = seg2.end.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null; // Parallel

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }

  /**
   * Calculate ridge height from slope angle
   */
  static calculateRidgeHeight(
    span: number,
    slopeAngle: number
  ): number {
    // Height = (span / 2) * tan(slope)
    return (span / 2) * Math.tan((slopeAngle * Math.PI) / 180);
  }

  /**
   * Generate gable roof
   */
  static generateGableRoof(
    basePoints: Point2D[],
    slopeAngle: number,
    overhang: number
  ): RoofCalculation {
    if (basePoints.length < 3) {
      return { ridgeHeight: 0, roofArea: 0, volume: 0, faces: [] };
    }

    const closed = this.closeWire(basePoints);
    const segments: LineSegment[] = [];

    for (let i = 0; i < closed.length - 1; i++) {
      segments.push(this.getLineSegment(closed[i], closed[i + 1]));
    }

    // Find longest segment for gable ends
    let longestSegment = segments[0];
    segments.forEach((seg) => {
      if (seg.length > longestSegment.length) {
        longestSegment = seg;
      }
    });

    // Ridge runs parallel to longest wall
    const ridgeAngle = longestSegment.angle;
    const span = this.calculatePerpendicularSpan(closed, ridgeAngle);
    const ridgeHeight = this.calculateRidgeHeight(span, slopeAngle);

    // Calculate ridge line
    const centroid = this.calculateCentroid(closed);
    const ridgeStart = {
      x: centroid.x - Math.cos(ridgeAngle) * longestSegment.length / 2,
      y: centroid.y - Math.sin(ridgeAngle) * longestSegment.length / 2,
    };
    const ridgeEnd = {
      x: centroid.x + Math.cos(ridgeAngle) * longestSegment.length / 2,
      y: centroid.y + Math.sin(ridgeAngle) * longestSegment.length / 2,
    };

    // Generate roof faces
    const faces: RoofFace[] = [];
    const slope = Math.tan((slopeAngle * Math.PI) / 180);

    // Two sloped faces
    faces.push({
      id: 'gable_face_1',
      vertices: [
        ridgeStart,
        ridgeEnd,
        { x: ridgeEnd.x - Math.sin(ridgeAngle) * span / 2, y: ridgeEnd.y + Math.cos(ridgeAngle) * span / 2 },
        { x: ridgeStart.x - Math.sin(ridgeAngle) * span / 2, y: ridgeStart.y + Math.cos(ridgeAngle) * span / 2 },
      ],
      elevation: ridgeHeight,
      slope,
    });

    faces.push({
      id: 'gable_face_2',
      vertices: [
        ridgeStart,
        ridgeEnd,
        { x: ridgeEnd.x + Math.sin(ridgeAngle) * span / 2, y: ridgeEnd.y - Math.cos(ridgeAngle) * span / 2 },
        { x: ridgeStart.x + Math.sin(ridgeAngle) * span / 2, y: ridgeStart.y - Math.cos(ridgeAngle) * span / 2 },
      ],
      elevation: ridgeHeight,
      slope,
    });

    // Calculate roof area
    const roofArea = faces.reduce((sum, face) => {
      const faceArea = this.calculatePolygonArea(face.vertices);
      return sum + faceArea / Math.cos((slopeAngle * Math.PI) / 180);
    }, 0);

    const baseArea = this.calculatePolygonArea(basePoints);

    return {
      ridgeHeight,
      roofArea,
      volume: (baseArea * ridgeHeight) / 2,
      faces,
    };
  }

  /**
   * Generate hip roof
   */
  static generateHipRoof(
    basePoints: Point2D[],
    slopeAngle: number,
    overhang: number
  ): RoofCalculation {
    if (basePoints.length < 3) {
      return { ridgeHeight: 0, roofArea: 0, volume: 0, faces: [] };
    }

    const closed = this.closeWire(basePoints);
    const centroid = this.calculateCentroid(closed);

    // Calculate average span
    let totalSpan = 0;
    for (let i = 0; i < closed.length - 1; i++) {
      const dx = closed[i].x - centroid.x;
      const dy = closed[i].y - centroid.y;
      totalSpan += Math.sqrt(dx * dx + dy * dy) * 2;
    }
    const avgSpan = totalSpan / (closed.length - 1);

    const ridgeHeight = this.calculateRidgeHeight(avgSpan, slopeAngle);
    const slope = Math.tan((slopeAngle * Math.PI) / 180);

    // Generate faces - each wall segment gets a sloped face
    const faces: RoofFace[] = [];
    
    for (let i = 0; i < closed.length - 1; i++) {
      const current = closed[i];
      const next = closed[i + 1];
      const segment = this.getLineSegment(current, next);

      // Face goes from wall edge to ridge point above centroid
      faces.push({
        id: `hip_face_${i}`,
        vertices: [current, next, centroid],
        elevation: ridgeHeight,
        slope,
      });
    }

    // Calculate roof area
    const roofArea = faces.reduce((sum, face) => {
      const faceArea = this.calculatePolygonArea(face.vertices);
      return sum + faceArea / Math.cos((slopeAngle * Math.PI) / 180);
    }, 0);

    const baseArea = this.calculatePolygonArea(basePoints);

    return {
      ridgeHeight,
      roofArea,
      volume: (baseArea * ridgeHeight) / 3,
      faces,
    };
  }

  /**
   * Generate shed roof
   */
  static generateShedRoof(
    basePoints: Point2D[],
    slopeAngle: number,
    overhang: number
  ): RoofCalculation {
    if (basePoints.length < 3) {
      return { ridgeHeight: 0, roofArea: 0, volume: 0, faces: [] };
    }

    const closed = this.closeWire(basePoints);

    // Find the direction for slope (typically along longest dimension)
    let maxDist = 0;
    let slopeDirection = 0;

    for (let i = 0; i < closed.length - 1; i++) {
      for (let j = i + 1; j < closed.length; j++) {
        const dx = closed[j].x - closed[i].x;
        const dy = closed[j].y - closed[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) {
          maxDist = dist;
          slopeDirection = Math.atan2(dy, dx);
        }
      }
    }

    // Calculate span perpendicular to slope
    const span = this.calculatePerpendicularSpan(closed, slopeDirection + Math.PI / 2);
    const ridgeHeight = this.calculateRidgeHeight(span, slopeAngle);
    const slope = Math.tan((slopeAngle * Math.PI) / 180);

    // Single sloped face
    const faces: RoofFace[] = [{
      id: 'shed_face',
      vertices: closed.slice(0, -1), // Remove duplicate last point
      elevation: ridgeHeight,
      slope,
    }];

    const baseArea = this.calculatePolygonArea(basePoints);

    return {
      ridgeHeight,
      roofArea: baseArea / Math.cos((slopeAngle * Math.PI) / 180),
      volume: (baseArea * ridgeHeight) / 2,
      faces,
    };
  }

  /**
   * Generate flat roof (minimal slope for drainage)
   */
  static generateFlatRoof(
    basePoints: Point2D[],
    slopeAngle: number = 2, // 2 degrees for drainage
    overhang: number
  ): RoofCalculation {
    if (basePoints.length < 3) {
      return { ridgeHeight: 0, roofArea: 0, volume: 0, faces: [] };
    }

    const closed = this.closeWire(basePoints);
    
    // For flat roof, height is minimal
    const height = 50; // 50mm typical parapet
    const baseArea = this.calculatePolygonArea(basePoints);

    // Single flat face
    const faces: RoofFace[] = [{
      id: 'flat_face',
      vertices: closed.slice(0, -1),
      elevation: height,
      slope: Math.tan((slopeAngle * Math.PI) / 180),
    }];

    return {
      ridgeHeight: height,
      roofArea: baseArea,
      volume: baseArea * height,
      faces,
    };
  }

  /**
   * Calculate span perpendicular to a given direction
   */
  private static calculatePerpendicularSpan(
    points: Point2D[],
    direction: number
  ): number {
    const perpDirection = direction + Math.PI / 2;
    const cos = Math.cos(perpDirection);
    const sin = Math.sin(perpDirection);

    let minProj = Infinity;
    let maxProj = -Infinity;

    points.forEach((point) => {
      const projection = point.x * cos + point.y * sin;
      minProj = Math.min(minProj, projection);
      maxProj = Math.max(maxProj, projection);
    });

    return maxProj - minProj;
  }

  /**
   * Generate roof based on type
   */
  static generateRoof(
    roof: Roof
  ): RoofCalculation {
    const { roofType, basePoints, slopeAngle, overhang } = roof;

    if (basePoints.length < 3) {
      return { ridgeHeight: 0, roofArea: 0, volume: 0, faces: [] };
    }

    switch (roofType) {
      case 'gable':
        return this.generateGableRoof(basePoints, slopeAngle, overhang);
      case 'hip':
        return this.generateHipRoof(basePoints, slopeAngle, overhang);
      case 'shed':
        return this.generateShedRoof(basePoints, slopeAngle, overhang);
      case 'flat':
        return this.generateFlatRoof(basePoints, slopeAngle, overhang);
      default:
        return { ridgeHeight: 0, roofArea: 0, volume: 0, faces: [] };
    }
  }

  /**
   * Generate 2D roof outline (for plan view)
   */
  static generate2DOutline(roof: Roof): string {
    const { basePoints, overhang } = roof;
    
    if (basePoints.length < 3) return '';

    // Extend points by overhang
    const closed = this.isClosedWire(basePoints) ? basePoints : [...basePoints, basePoints[0]];
    const segments: LineSegment[] = [];

    for (let i = 0; i < closed.length - 1; i++) {
      segments.push(this.getLineSegment(closed[i], closed[i + 1]));
    }

    // Extend segments and find intersections
    const extended: Point2D[] = [];
    const extendedSegments = segments.map((seg) =>
      this.extendSegment(seg, overhang)
    );

    for (let i = 0; i < extendedSegments.length; i++) {
      const current = extendedSegments[i];
      const next = extendedSegments[(i + 1) % extendedSegments.length];

      const intersection = this.findIntersection(current, next);
      if (intersection) {
        extended.push(intersection);
      }
    }

    if (extended.length === 0) return '';

    // Generate SVG path
    let path = `M ${extended[0].x.toFixed(1)} ${extended[0].y.toFixed(1)}`;
    for (let i = 1; i < extended.length; i++) {
      path += ` L ${extended[i].x.toFixed(1)} ${extended[i].y.toFixed(1)}`;
    }
    path += ' Z';

    return path;
  }

  /**
   * Generate 3D roof geometry
   */
  static generate3DGeometry(roof: Roof): {
    vertices: number[][];
    faces: number[][];
    edges: { start: number[]; end: number[] }[];
  } {
    const calculation = this.generateRoof(roof);
    const vertices: number[][] = [];
    const faces: number[][] = [];
    const edges: { start: number[]; end: number[] }[] = [];

    let vertexIndex = 0;

    calculation.faces.forEach((face) => {
      const faceVertices: number[] = [];

      face.vertices.forEach((v) => {
        vertices.push([v.x, v.y, face.elevation]);
        faceVertices.push(vertexIndex);
        vertexIndex++;
      });

      faces.push(faceVertices);

      // Create edges
      for (let i = 0; i < faceVertices.length; i++) {
        const start = vertices[faceVertices[i]];
        const end = vertices[faceVertices[(i + 1) % faceVertices.length]];
        edges.push({ start, end });
      }
    });

    return { vertices, faces, edges };
  }

  /**
   * Validate roof configuration
   */
  static validateRoof(roof: Roof): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check base wire
    if (roof.basePoints.length < 3) {
      errors.push('Roof base wire must have at least 3 points');
    }

    if (!this.isClosedWire(roof.basePoints)) {
      warnings.push('Base wire is not closed; will be closed automatically');
    }

    // Check base area
    const baseArea = this.calculatePolygonArea(roof.basePoints);
    if (baseArea < 1000) {
      warnings.push(`Base area ${baseArea.toFixed(0)}mm² is quite small`);
    }

    // Check slope angle
    if (roof.slopeAngle < 0) {
      errors.push('Slope angle cannot be negative');
    }
    if (roof.slopeAngle > 60) {
      warnings.push('Slope angle > 60° may be impractical');
    }
    if (roof.roofType === 'flat' && roof.slopeAngle > 5) {
      warnings.push('Flat roof with slope > 5° should use shed type');
    }

    // Check overhang
    if (roof.overhang < 0) {
      errors.push('Overhang cannot be negative');
    }
    if (roof.overhang > 1000) {
      warnings.push('Overhang > 1000mm may be excessive');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Generate ridge line for visualization
   */
  static generateRidgeLine(roof: Roof): { start: Point2D; end: Point2D } | null {
    if (roof.roofType === 'flat') return null;

    const calculation = this.generateRoof(roof);
    if (calculation.faces.length < 2) return null;

    // For gable, find ridge from face vertices
    if (roof.roofType === 'gable') {
      // The ridge is shared edge between two faces
      const face1 = calculation.faces[0];
      const face2 = calculation.faces[1];

      // Find common vertices
      const common: Point2D[] = [];
      face1.vertices.forEach((v1) => {
        face2.vertices.forEach((v2) => {
          if (Math.abs(v1.x - v2.x) < 1 && Math.abs(v1.y - v2.y) < 1) {
            common.push(v1);
          }
        });
      });

      if (common.length >= 2) {
        return { start: common[0], end: common[1] };
      }
    }

    return null;
  }
}

/**
 * Factory function to create a roof
 */
export function createRoof(
  basePoints: Point2D[],
  roofType: RoofType = 'gable',
  slopeAngle: number = 30,
  overhang: number = 300
): Roof {
  return {
    id: `roof_${Date.now()}`,
    type: 'roof',
    name: `${roofType.charAt(0).toUpperCase() + roofType.slice(1)} Roof`,
    position: RoofGenerator.calculateCentroid(basePoints),
    rotation: 0,
    visible: true,
    locked: false,
    slopeAngle,
    overhang,
    roofType,
    thickness: 200,
    baseWireId: null,
    basePoints,
    ridgeHeight: 0,
    material: 'tile',
  };
}

export default RoofGenerator;