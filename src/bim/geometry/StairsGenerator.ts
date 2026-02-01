/**
 * StairsGenerator - Stair Geometry and Path Drawing
 * 
 * Provides tools for creating stair geometry with proper
 * rise/run calculations, path drawing, and 3D preview.
 * Supports straight, L-shaped, and U-shaped stair configurations.
 */

import type { Point2D } from '../../types/drafting';
import type { Stairs, StairStep, StairPathType } from '../types';

/**
 * Building code requirements (IBC/IRC compliant)
 */
export const BUILDING_CODES = {
  minRiserHeight: 100, // mm (4 inches)
  maxRiserHeight: 200, // mm (7.75 inches)
  minTreadDepth: 250, // mm (10 inches)
  maxTreadDepth: 355, // mm (14 inches)
  maxRiserVariation: 10, // mm (3/8 inch)
  minStairWidth: 860, // mm (34 inches clear)
  minHeadroom: 2030, // mm (80 inches)
  handrailHeight: 865, // mm (34 inches)
};

/**
 * Stair calculation result
 */
export interface StairCalculation {
  totalRise: number;
  totalRun: number;
  riserHeight: number;
  treadDepth: number;
  stairCount: number;
  actualRise: number;
  actualRun: number;
  slope: number; // degrees
  passesCode: boolean;
  codeIssues: string[];
}

/**
 * Stair path segment
 */
export interface StairPathSegment {
  start: Point2D;
  end: Point2D;
  length: number;
  angle: number;
  direction: 'up' | 'down';
}

/**
 * StairsGenerator class
 */
export class StairsGenerator {
  /**
   * Calculate optimal stair dimensions based on total rise
   */
  static calculateOptimalDimensions(
    totalRise: number,
    targetTreadDepth: number = 280,
    maxStairs?: number
  ): StairCalculation {
    const codeIssues: string[] = [];

    // Calculate number of stairs needed
    let stairCount = Math.ceil(totalRise / BUILDING_CODES.maxRiserHeight);
    if (maxStairs && stairCount > maxStairs) {
      stairCount = maxStairs;
    }

    // Calculate riser height
    let riserHeight = totalRise / stairCount;

    // Validate against code
    if (riserHeight < BUILDING_CODES.minRiserHeight) {
      codeIssues.push(
        `Riser height ${riserHeight.toFixed(1)}mm is below minimum ${BUILDING_CODES.minRiserHeight}mm`
      );
    }
    if (riserHeight > BUILDING_CODES.maxRiserHeight) {
      codeIssues.push(
        `Riser height ${riserHeight.toFixed(1)}mm exceeds maximum ${BUILDING_CODES.maxRiserHeight}mm`
      );
    }

    // Use target tread depth or calculate optimal
    let treadDepth = targetTreadDepth;
    if (treadDepth < BUILDING_CODES.minTreadDepth) {
      codeIssues.push(
        `Tread depth ${treadDepth}mm is below minimum ${BUILDING_CODES.minTreadDepth}mm`
      );
      treadDepth = BUILDING_CODES.minTreadDepth;
    }

    // Calculate total run
    const totalRun = treadDepth * (stairCount - 1);

    // Calculate slope
    const slope = Math.atan2(riserHeight, treadDepth) * (180 / Math.PI);

    return {
      totalRise,
      totalRun,
      riserHeight,
      treadDepth,
      stairCount,
      actualRise: riserHeight * stairCount,
      actualRun: totalRun,
      slope,
      passesCode: codeIssues.length === 0,
      codeIssues,
    };
  }

  /**
   * Calculate stairs from total run constraint
   */
  static calculateFromRun(
    totalRise: number,
    totalRun: number,
    maxStairs?: number
  ): StairCalculation {
    let stairCount = maxStairs || Math.ceil(totalRise / BUILDING_CODES.maxRiserHeight);
    
    // Ensure at least 2 stairs
    stairCount = Math.max(2, stairCount);
    
    const riserHeight = totalRise / stairCount;
    const treadDepth = totalRun / (stairCount - 1);

    return this.calculateOptimalDimensions(totalRise, treadDepth, stairCount);
  }

  /**
   * Generate stair steps from path points
   */
  static generateSteps(
    pathPoints: Point2D[],
    totalRise: number,
    stairWidth: number
): StairStep[] {
    if (pathPoints.length < 2) return [];

    const calculation = this.calculateOptimalDimensions(totalRise);
    const steps: StairStep[] = [];

    // Calculate total path length
    let totalPathLength = 0;
    const segments: { start: number; end: number; length: number; angle: number }[] = [];

    for (let i = 0; i < pathPoints.length - 1; i++) {
      const dx = pathPoints[i + 1].x - pathPoints[i].x;
      const dy = pathPoints[i + 1].y - pathPoints[i].y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      segments.push({
        start: totalPathLength,
        end: totalPathLength + length,
        length,
        angle,
      });
      totalPathLength += length;
    }

    // Generate steps along the path
    const treadSpacing = calculation.totalRun / (calculation.stairCount - 1);

    for (let i = 0; i < calculation.stairCount; i++) {
      const distanceAlongPath = i * treadSpacing;
      
      // Find which segment this step belongs to
      let segmentIndex = 0;
      let positionInSegment = distanceAlongPath;
      
      for (let j = 0; j < segments.length; j++) {
        if (distanceAlongPath >= segments[j].start && distanceAlongPath < segments[j].end) {
          segmentIndex = j;
          positionInSegment = distanceAlongPath - segments[j].start;
          break;
        }
        if (j === segments.length - 1) {
          segmentIndex = j;
          positionInSegment = segments[j].length;
        }
      }

      const segment = segments[segmentIndex];
      const t = positionInSegment / segment.length;
      const segmentStartPoint = pathPoints[segmentIndex];
      const segmentEndPoint = pathPoints[segmentIndex + 1];

      const treadCenterX = segmentStartPoint.x + t * (segmentEndPoint.x - segmentStartPoint.x);
      const treadCenterY = segmentStartPoint.y + t * (segmentEndPoint.y - segmentStartPoint.y);

      // Calculate tread corners (perpendicular to path)
      const perpX = -Math.sin(segment.angle) * (stairWidth / 2);
      const perpY = Math.cos(segment.angle) * (stairWidth / 2);

      steps.push({
        index: i,
        treadStart: {
          x: treadCenterX + perpX,
          y: treadCenterY + perpY,
        },
        treadEnd: {
          x: treadCenterX - perpX,
          y: treadCenterY - perpY,
        },
        riserHeight: calculation.riserHeight,
        cumulativeRise: (i + 1) * calculation.riserHeight,
      });
    }

    return steps;
  }

  /**
   * Generate straight stair path
   */
  static generateStraightPath(
    startPoint: Point2D,
    direction: number, // radians
    totalRun: number
  ): Point2D[] {
    return [
      startPoint,
      {
        x: startPoint.x + Math.cos(direction) * totalRun,
        y: startPoint.y + Math.sin(direction) * totalRun,
      },
    ];
  }

  /**
   * Generate L-shaped stair path
   */
  static generateLShapedPath(
    startPoint: Point2D,
    direction1: number,
    run1: number,
    turnDirection: 'left' | 'right',
    run2: number
  ): Point2D[] {
    const landingSize = 1200; // mm
    const corner1 = {
      x: startPoint.x + Math.cos(direction1) * run1,
      y: startPoint.y + Math.sin(direction1) * run1,
    };

    const turnAngle = turnDirection === 'left' ? Math.PI / 2 : -Math.PI / 2;
    const direction2 = direction1 + turnAngle;

    const corner2 = {
      x: corner1.x + Math.cos(direction2) * landingSize,
      y: corner1.y + Math.sin(direction2) * landingSize,
    };

    const endPoint = {
      x: corner2.x + Math.cos(direction2) * run2,
      y: corner2.y + Math.sin(direction2) * run2,
    };

    return [startPoint, corner1, corner2, endPoint];
  }

  /**
   * Generate U-shaped stair path
   */
  static generateUShapedPath(
    startPoint: Point2D,
    direction: number,
    run1: number,
    landingDepth: number,
    run2: number
  ): Point2D[] {
    const corner1 = {
      x: startPoint.x + Math.cos(direction) * run1,
      y: startPoint.y + Math.sin(direction) * run1,
    };

    // 180 degree turn
    const reverseDirection = direction + Math.PI;
    const landingOffset = {
      x: Math.cos(reverseDirection) * landingDepth,
      y: Math.sin(reverseDirection) * landingDepth,
    };

    const corner2 = {
      x: corner1.x + landingOffset.x,
      y: corner1.y + landingOffset.y,
    };

    // Parallel return
    const returnOffset = {
      x: Math.cos(direction + Math.PI / 2) * 1200, // stair width
      y: Math.sin(direction + Math.PI / 2) * 1200,
    };

    const corner3 = {
      x: corner2.x + returnOffset.x,
      y: corner2.y + returnOffset.y,
    };

    const endPoint = {
      x: corner3.x + Math.cos(reverseDirection) * run2,
      y: corner3.y + Math.sin(reverseDirection) * run2,
    };

    return [startPoint, corner1, corner2, corner3, endPoint];
  }

  /**
   * Calculate landing position for L or U shaped stairs
   */
  static calculateLandingPosition(
    pathType: StairPathType,
    pathPoints: Point2D[]
  ): Point2D | null {
    if (pathType === 'straight' || pathPoints.length < 3) return null;

    if (pathType === 'lShape' && pathPoints.length >= 3) {
      return pathPoints[1];
    }

    if (pathType === 'uShape' && pathPoints.length >= 4) {
      return pathPoints[2];
    }

    return null;
  }

  /**
   * Generate 2D stair outline (for plan view)
   */
  static generate2DOutline(
    pathPoints: Point2D[],
    stairWidth: number
  ): string {
    if (pathPoints.length < 2) return '';

    const outline: Point2D[] = [];
    
    // Calculate offset points for stair width
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const dx = pathPoints[i + 1].x - pathPoints[i].x;
      const dy = pathPoints[i + 1].y - pathPoints[i].y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length === 0) continue;

      const angle = Math.atan2(dy, dx);
      const perpX = (-dy / length) * (stairWidth / 2);
      const perpY = (dx / length) * (stairWidth / 2);

      // Left side
      outline.push({
        x: pathPoints[i].x + perpX,
        y: pathPoints[i].y + perpY,
      });
    }

    // Add last point left side
    const lastIdx = pathPoints.length - 1;
    const secondLastIdx = pathPoints.length - 2;
    const lastDx = pathPoints[lastIdx].x - pathPoints[secondLastIdx].x;
    const lastDy = pathPoints[lastIdx].y - pathPoints[secondLastIdx].y;
    const lastLength = Math.sqrt(lastDx * lastDx + lastDy * lastDy);
    const lastPerpX = (-lastDy / lastLength) * (stairWidth / 2);
    const lastPerpY = (lastDx / lastLength) * (stairWidth / 2);

    outline.push({
      x: pathPoints[lastIdx].x + lastPerpX,
      y: pathPoints[lastIdx].y + lastPerpY,
    });

    // Right side (reverse)
    for (let i = pathPoints.length - 1; i > 0; i--) {
      const dx = pathPoints[i].x - pathPoints[i - 1].x;
      const dy = pathPoints[i].y - pathPoints[i - 1].y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length === 0) continue;

      const perpX = (-dy / length) * (stairWidth / 2);
      const perpY = (dx / length) * (stairWidth / 2);

      outline.push({
        x: pathPoints[i].x - perpX,
        y: pathPoints[i].y - perpY,
      });
    }

    // Close the path
    const firstDx = pathPoints[1].x - pathPoints[0].x;
    const firstDy = pathPoints[1].y - pathPoints[0].y;
    const firstLength = Math.sqrt(firstDx * firstDx + firstDy * firstDy);
    const firstPerpX = (-firstDy / firstLength) * (stairWidth / 2);
    const firstPerpY = (firstDx / firstLength) * (stairWidth / 2);

    outline.push({
      x: pathPoints[0].x - firstPerpX,
      y: pathPoints[0].y - firstPerpY,
    });

    // Generate SVG path
    if (outline.length === 0) return '';
    
    let path = `M ${outline[0].x.toFixed(1)} ${outline[0].y.toFixed(1)}`;
    for (let i = 1; i < outline.length; i++) {
      path += ` L ${outline[i].x.toFixed(1)} ${outline[i].y.toFixed(1)}`;
    }
    path += ' Z';

    return path;
  }

  /**
   * Generate 3D stair geometry data
   */
  static generate3DGeometry(
    stairs: Stairs
  ): {
    vertices: number[][];
    faces: number[][];
    steps: { tread: number[][]; riser: number[][] }[];
  } {
    const calculation = this.calculateOptimalDimensions(
      stairs.totalRise,
      stairs.treadDepth
    );
    const steps = this.generateSteps(
      stairs.pathPoints,
      stairs.totalRise,
      stairs.stairWidth
    );

    const vertices: number[][] = [];
    const faces: number[][] = [];
    const stepGeometries: { tread: number[][]; riser: number[][] }[] = [];

    let vertexIndex = 0;

    steps.forEach((step, i) => {
      const elevation = i * calculation.riserHeight;
      const nextElevation = (i + 1) * calculation.riserHeight;

      // Tread vertices (4 corners)
      const treadVertices = [
        [step.treadStart.x, step.treadStart.y, elevation],
        [step.treadEnd.x, step.treadEnd.y, elevation],
        [step.treadEnd.x, step.treadEnd.y, elevation], // Will be extended for tread depth
        [step.treadStart.x, step.treadStart.y, elevation],
      ];

      // Calculate tread direction for depth extension
      if (i < steps.length - 1) {
        const nextStep = steps[i + 1];
        const midX = (step.treadStart.x + step.treadEnd.x) / 2;
        const midY = (step.treadStart.y + step.treadEnd.y) / 2;
        const nextMidX = (nextStep.treadStart.x + nextStep.treadEnd.x) / 2;
        const nextMidY = (nextStep.treadStart.y + nextStep.treadEnd.y) / 2;
        
        const dx = nextMidX - midX;
        const dy = nextMidY - midY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          const extendX = (dx / dist) * stairs.treadDepth;
          const extendY = (dy / dist) * stairs.treadDepth;
          
          treadVertices[2][0] += extendX;
          treadVertices[2][1] += extendY;
          treadVertices[3][0] += extendX;
          treadVertices[3][1] += extendY;
        }
      }

      // Riser vertices (vertical face)
      const riserVertices = [
        [treadVertices[2][0], treadVertices[2][1], elevation],
        [treadVertices[3][0], treadVertices[3][1], elevation],
        [treadVertices[3][0], treadVertices[3][1], nextElevation],
        [treadVertices[2][0], treadVertices[2][1], nextElevation],
      ];

      // Add vertices to main array
      const treadIndices = [
        vertexIndex,
        vertexIndex + 1,
        vertexIndex + 2,
        vertexIndex + 3,
      ];
      
      const riserIndices = [
        vertexIndex + 4,
        vertexIndex + 5,
        vertexIndex + 6,
        vertexIndex + 7,
      ];

      vertices.push(...treadVertices, ...riserVertices);
      
      // Tread face (top)
      faces.push([treadIndices[0], treadIndices[1], treadIndices[2], treadIndices[3]]);
      
      // Riser face (front)
      faces.push([riserIndices[0], riserIndices[1], riserIndices[2], riserIndices[3]]);

      stepGeometries.push({
        tread: treadVertices,
        riser: riserVertices,
      });

      vertexIndex += 8;
    });

    return { vertices, faces, steps: stepGeometries };
  }

  /**
   * Validate stair configuration
   */
  static validateStairs(stairs: Stairs): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check path points
    if (stairs.pathPoints.length < 2) {
      errors.push('Stair path must have at least 2 points');
    }

    // Check dimensions
    if (stairs.totalRise <= 0) {
      errors.push('Total rise must be positive');
    }
    if (stairs.totalRun <= 0) {
      errors.push('Total run must be positive');
    }
    if (stairs.stairWidth < BUILDING_CODES.minStairWidth) {
      errors.push(
        `Stair width ${stairs.stairWidth}mm is below minimum ${BUILDING_CODES.minStairWidth}mm`
      );
    }

    // Check calculations
    const calculation = this.calculateOptimalDimensions(
      stairs.totalRise,
      stairs.treadDepth
    );

    if (!calculation.passesCode) {
      warnings.push(...calculation.codeIssues);
    }

    // Check stair count matches
    if (Math.abs(calculation.stairCount - stairs.stairCount) > 1) {
      warnings.push(
        `Calculated stair count (${calculation.stairCount}) differs from specified (${stairs.stairCount})`
      );
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Get stair dimensions as formatted string
   */
  static formatStairDimensions(calculation: StairCalculation): string {
    return (
      `${calculation.stairCount} stairs | ` +
      `Riser: ${calculation.riserHeight.toFixed(1)}mm | ` +
      `Tread: ${calculation.treadDepth.toFixed(1)}mm | ` +
      `Slope: ${calculation.slope.toFixed(1)}°`
    );
  }
}

/**
 * Factory function to create stairs
 */
export function createStairs(
  pathPoints: Point2D[],
  totalRise: number,
  stairWidth: number = 1000,
  pathType: StairPathType = 'straight'
): Stairs {
  const calculation = StairsGenerator.calculateOptimalDimensions(totalRise);

  return {
    id: `stairs_${Date.now()}`,
    type: 'stairs',
    name: 'Stairs',
    position: pathPoints[0],
    rotation: 0,
    visible: true,
    locked: false,
    totalRise,
    totalRun: calculation.totalRun,
    treadDepth: calculation.treadDepth,
    riserHeight: calculation.riserHeight,
    stairCount: calculation.stairCount,
    stairWidth,
    pathType,
    pathPoints,
    landingDepth: 1200,
    hasLanding: pathType !== 'straight',
    material: 'concrete',
  };
}

export default StairsGenerator;