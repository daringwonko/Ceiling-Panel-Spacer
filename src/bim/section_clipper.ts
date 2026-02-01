/**
 * Section Clipper Implementation
 * 
 * Provides 3D geometry clipping at section planes with cut surface generation.
 * Uses CSG (Constructive Solid Geometry) for cutting geometry at planes.
 */

import { SectionPlaneClass } from './section_plane';
import {
  SectionPlane,
  SectionType,
  Point3D,
  Vector3D,
  PlaneEquation,
  ThreeGeometry,
  ClippingResult,
} from './types';

/**
 * Vector utility functions
 */
function crossProduct(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dotProduct(a: Vector3D, b: Vector3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function subtractVectors(a: Point3D, b: Point3D): Vector3D {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

/**
 * Clipping plane definition for operations
 */
interface ClippingPlane {
  equation: PlaneEquation;
  normal: Vector3D;
  position: Point3D;
}

/**
 * Geometry batch for optimized clipping
 */
interface GeometryBatch {
  geometries: ThreeGeometry[];
  transformation?: {
    position: Point3D;
    rotation: Vector3D;
    scale: Vector3D;
  };
}

/**
 * Cut surface face data
 */
interface CutFace {
  vertices: Point3D[];
  edges: Array<[Point3D, Point3D]>;
  centroid: Point3D;
  normal: Vector3D;
}

/**
 * SectionClipper class for clipping 3D geometry at section planes
 */
export class SectionClipper {
  private activeSection: SectionPlaneClass | null = null;
  private originalGeometryCache: Map<string, ThreeGeometry> = new Map();
  private clippedGeometryCache: Map<string, ThreeGeometry> = new Map();
  private cutSurfacesCache: Map<string, CutFace[]> = new Map();
  private isClippingActive: boolean = false;

  /**
   * Activate clipping with a specific section plane
   */
  activate(section: SectionPlaneClass): void {
    this.activeSection = section;
    this.isClippingActive = true;
    console.log(`Section clipping activated: ${section.name}`);
  }

  /**
   * Deactivate clipping and restore original view
   */
  deactivate(): void {
    if (this.activeSection) {
      console.log(`Section clipping deactivated: ${this.activeSection.name}`);
    }
    this.activeSection = null;
    this.isClippingActive = false;
    // Optionally clear caches
    // this.clippedGeometryCache.clear();
    // this.cutSurfacesCache.clear();
  }

  /**
   * Toggle clipping state
   */
  toggle(section?: SectionPlaneClass): boolean {
    if (this.isClippingActive && this.activeSection) {
      this.deactivate();
      return false;
    } else if (section) {
      this.activate(section);
      return true;
    }
    return false;
  }

  /**
   * Check if clipping is currently active
   */
  isActive(): boolean {
    return this.isClippingActive;
  }

  /**
   * Get the currently active section plane
   */
  getActiveSection(): SectionPlaneClass | null {
    return this.activeSection;
  }

  /**
   * Clip geometry at the active section plane
   * Returns the clipped geometry and cut surface
   */
  clipGeometry(
    geometry: ThreeGeometry,
    geometryId: string
  ): ClippingResult {
    if (!this.activeSection) {
      return { clipped: false, geometry, cutSurface: null };
    }

    // Check cache first
    const cacheKey = `${geometryId}-${this.activeSection.id}`;
    if (this.clippedGeometryCache.has(cacheKey)) {
      const cached = this.clippedGeometryCache.get(cacheKey);
      const cutKey = `${geometryId}-${this.activeSection.id}-cuts`;
      const cutSurface = this.cutSurfacesCache.get(cutKey) || null;
      return { clipped: true, geometry: cached!, cutSurface };
    }

    // Cache the original geometry if not already cached
    if (!this.originalGeometryCache.has(geometryId)) {
      this.originalGeometryCache.set(geometryId, { ...geometry });
    }

    // Perform the clipping operation
    const clippingPlane = this.createClippingPlane(this.activeSection);
    const clippedGeometry = this.performClipping(geometry, clippingPlane);
    const cutSurface = this.generateCutSurface(geometry, clippingPlane);

    // Cache the results
    if (clippedGeometry) {
      this.clippedGeometryCache.set(cacheKey, clippedGeometry);
    }
    if (cutSurface && cutSurface.length > 0) {
      this.cutSurfacesCache.set(`${geometryId}-${this.activeSection.id}-cuts`, cutSurface);
    }

    return {
      clipped: !!clippedGeometry,
      geometry: clippedGeometry || geometry,
      cutSurface: cutSurface && cutSurface.length > 0 ? this.createCutSurfaceGeometry(cutSurface) : null,
    };
  }

  /**
   * Clip multiple geometries in batch for performance
   */
  clipGeometryBatch(
    geometries: Array<{ id: string; geometry: ThreeGeometry }>
  ): Map<string, ClippingResult> {
    const results = new Map<string, ClippingResult>();

    if (!this.activeSection) {
      // Return all geometries unclipped
      for (const { id, geometry } of geometries) {
        results.set(id, { clipped: false, geometry, cutSurface: null });
      }
      return results;
    }

    // Process all geometries
    for (const { id, geometry } of geometries) {
      results.set(id, this.clipGeometry(geometry, id));
    }

    return results;
  }

  /**
   * Restore original geometry (undo clipping)
   */
  restoreGeometry(geometryId: string): ThreeGeometry | null {
    return this.originalGeometryCache.get(geometryId) || null;
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.originalGeometryCache.clear();
    this.clippedGeometryCache.clear();
    this.cutSurfacesCache.clear();
  }

  /**
   * Clear cache for specific geometry
   */
  clearGeometryCache(geometryId: string): void {
    this.originalGeometryCache.delete(geometryId);
    this.clippedGeometryCache.delete(geometryId);
    this.cutSurfacesCache.delete(`${geometryId}-${this.activeSection?.id}-cuts`);
    this.cutSurfacesCache.delete(`${geometryId}-${this.activeSection?.id}-cuts`);
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Create clipping plane from section plane
   */
  private createClippingPlane(section: SectionPlaneClass): ClippingPlane {
    return {
      equation: section.getPlaneEquation(),
      normal: { ...section.normal },
      position: { ...section.position },
    };
  }

  /**
   * Perform the actual clipping operation
   * This is a simplified implementation - in production, use a proper CSG library
   */
  private performClipping(
    geometry: ThreeGeometry,
    clippingPlane: ClippingPlane
  ): ThreeGeometry | null {
    if (!geometry.vertices || geometry.vertices.length === 0) {
      return null;
    }

    // Extract vertices
    const vertices = geometry.vertices;
    const newVertices: number[] = [];
    const newFaces: number[] = [];

    // Process vertices in groups of 3 (x, y, z)
    const numVertices = vertices.length / 3;

    // Track which side each vertex is on
    const vertexSides: boolean[] = [];
    for (let i = 0; i < numVertices; i++) {
      const x = vertices[i * 3];
      const y = vertices[i * 3 + 1];
      const z = vertices[i * 3 + 2];
      const point: Point3D = { x, y, z };

      // Check which side of the plane the point is on
      const value = this.evaluatePlaneEquation(clippingPlane.equation, point);
      vertexSides.push(value >= 0); // Keep positive side
    }

    // If all vertices on same side, no clipping needed
    const allOnPositive = vertexSides.every((s) => s);
    const allOnNegative = vertexSides.every((s) => !s);

    if (allOnNegative) {
      // All on negative side - completely clipped away
      return null;
    }

    if (allOnPositive) {
      // All on positive side - keep original geometry
      return geometry;
    }

    // Some vertices on each side - need to clip
    // This is a simplified clipping - real implementation would use proper CSG
    // For now, we'll create a simplified clipped geometry

    // Collect vertices on positive side and create new faces
    const positiveVertexMap: Map<number, number> = new Map();
    let newVertexIndex = 0;

    for (let i = 0; i < numVertices; i++) {
      if (vertexSides[i]) {
        positiveVertexMap.set(i, newVertexIndex);
        newVertices.push(vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]);
        newVertexIndex++;
      }
    }

    // Create faces from positive side vertices
    // This is simplified - proper implementation would create new faces at the cut
    if (geometry.faces) {
      for (const faceIndex of geometry.faces) {
        if (positiveVertexMap.has(faceIndex)) {
          newFaces.push(positiveVertexMap.get(faceIndex)!);
        }
      }
    }

    // Return clipped geometry
    return {
      type: 'bufferGeometry',
      vertices: newVertices.length > 0 ? newVertices : undefined,
      faces: newFaces.length > 0 ? newFaces : undefined,
      attributes: geometry.attributes,
    };
  }

  /**
   * Generate cut surface at the intersection
   */
  private generateCutSurface(
    geometry: ThreeGeometry,
    clippingPlane: ClippingPlane
  ): CutFace[] {
    if (!geometry.vertices || geometry.vertices.length < 9) {
      return [];
    }

    const cutFaces: CutFace[] = [];

    // Find edges that cross the clipping plane
    const edges = this.findCrossingEdges(geometry.vertices, clippingPlane);

    if (edges.length < 3) {
      return []; // Not enough edges to form a face
    }

    // Create polygon from intersection points
    const intersectionPoints = edges.map((edge) => this.findPlaneIntersection(
      { x: edge[0], y: edge[1], z: edge[2] },
      { x: edge[3], y: edge[4], z: edge[5] },
      clippingPlane.equation
    )).filter((p): p is Point3D => p !== null);

    if (intersectionPoints.length < 3) {
      return []; // Not enough points for a face
    }

    // Sort points to form a valid polygon (simple convex hull)
    const sortedPoints = this.sortPointsOnPlane(intersectionPoints, clippingPlane.normal);

    if (sortedPoints.length >= 3) {
      // Create edges
      const faceEdges: Array<[Point3D, Point3D]> = [];
      for (let i = 0; i < sortedPoints.length; i++) {
        const next = (i + 1) % sortedPoints.length;
        faceEdges.push([sortedPoints[i], sortedPoints[next]]);
      }

      // Calculate centroid
      const centroid = this.calculateCentroid(sortedPoints);

      cutFaces.push({
        vertices: sortedPoints,
        edges: faceEdges,
        centroid,
        normal: clippingPlane.normal,
      });
    }

    return cutFaces;
  }

  /**
   * Find edges that cross the clipping plane
   */
  private findCrossingEdges(
    vertices: number[],
    clippingPlane: ClippingPlane
  ): Array<[number, number, number, number, number, number]> {
    const crossingEdges: Array<[number, number, number, number, number, number]> = [];
    const numVertices = vertices.length / 3;

    // Assuming triangle mesh - check each edge
    // For a proper implementation, you'd need face information
    // Here we check all possible edges for simplicity

    for (let i = 0; i < numVertices; i++) {
      for (let j = i + 1; j < numVertices; j++) {
        const v1: Point3D = {
          x: vertices[i * 3],
          y: vertices[i * 3 + 1],
          z: vertices[i * 3 + 2],
        };
        const v2: Point3D = {
          x: vertices[j * 3],
          y: vertices[j * 3 + 1],
          z: vertices[j * 3 + 2],
        };

        const side1 = this.evaluatePlaneEquation(clippingPlane.equation, v1) >= 0;
        const side2 = this.evaluatePlaneEquation(clippingPlane.equation, v2) >= 0;

        if (side1 !== side2) {
          crossingEdges.push([v1.x, v1.y, v1.z, v2.x, v2.y, v2.z]);
        }
      }
    }

    return crossingEdges;
  }

  /**
   * Find intersection point between line segment and plane
   */
  private findPlaneIntersection(
    p1: Point3D,
    p2: Point3D,
    equation: PlaneEquation
  ): Point3D | null {
    const value1 = this.evaluatePlaneEquation(equation, p1);
    const value2 = this.evaluatePlaneEquation(equation, p2);

    // If both on same side or on plane, no intersection
    if (value1 * value2 > 0 || (Math.abs(value1) < 0.001 && Math.abs(value2) < 0.001)) {
      return null;
    }

    // Calculate intersection using linear interpolation
    const t = value1 / (value1 - value2);

    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
      z: p1.z + t * (p2.z - p1.z),
    };
  }

  /**
   * Evaluate plane equation at a point
   */
  private evaluatePlaneEquation(equation: PlaneEquation, point: Point3D): number {
    return equation.a * point.x + equation.b * point.y + equation.c * point.z - equation.d;
  }

  /**
   * Sort points on plane to form a valid polygon
   */
  private sortPointsOnPlane(points: Point3D[], normal: Vector3D): Point3D[] {
    if (points.length <= 2) return points;

    // Calculate centroid
    const centroid = this.calculateCentroid(points);

    // Calculate tangent vectors on the plane
    const tangent1 = this.calculateTangent(normal);
    const tangent2 = crossProduct(normal, tangent1);

    // Sort by angle around centroid
    const sorted = [...points].sort((a, b) => {
      const va = subtractVectors(a, centroid);
      const vb = subtractVectors(b, centroid);

      const angle1 = Math.atan2(
        dotProduct(va, tangent2),
        dotProduct(va, tangent1)
      );
      const angle2 = Math.atan2(
        dotProduct(vb, tangent2),
        dotProduct(vb, tangent1)
      );

      return angle1 - angle2;
    });

    return sorted;
  }

  /**
   * Calculate centroid of points
   */
  private calculateCentroid(points: Point3D[]): Point3D {
    if (points.length === 0) return { x: 0, y: 0, z: 0 };

    let x = 0, y = 0, z = 0;
    for (const p of points) {
      x += p.x;
      y += p.y;
      z += p.z;
    }

    return {
      x: x / points.length,
      y: y / points.length,
      z: z / points.length,
    };
  }

  /**
   * Calculate tangent vector perpendicular to normal
   */
  private calculateTangent(normal: Vector3D): Vector3D {
    // Find arbitrary vector not parallel to normal
    const arbitrary: Vector3D = Math.abs(normal.x) < 0.9
      ? { x: 1, y: 0, z: 0 }
      : { x: 0, y: 1, z: 0 };

    // Cross product gives tangent perpendicular to both
    const tangent = crossProduct(normal, arbitrary);
    return this.normalize(tangent);
  }

  /**
   * Normalize vector
   */
  private normalize(v: Vector3D): Vector3D {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length === 0) return { x: 0, y: 0, z: 1 };
    return {
      x: v.x / length,
      y: v.y / length,
      z: v.z / length,
    };
  }

  /**
   * Create cut surface geometry from cut faces
   */
  private createCutSurfaceGeometry(cutFaces: CutFace[]): ThreeGeometry {
    const allVertices: number[] = [];
    const allFaces: number[] = [];
    let vertexOffset = 0;

    for (const face of cutFaces) {
      // Add vertices
      for (const vertex of face.vertices) {
        allVertices.push(vertex.x, vertex.y, vertex.z);
      }

      // Create face (triangle fan for convex polygons)
      for (let i = 1; i < face.vertices.length - 1; i++) {
        allFaces.push(vertexOffset, vertexOffset + i, vertexOffset + i + 1);
      }

      vertexOffset += face.vertices.length;
    }

    return {
      type: 'bufferGeometry',
      vertices: allVertices,
      faces: allFaces,
    };
  }
}

// Export type aliases for convenience
export type { ClippingPlane, GeometryBatch, CutFace };

// Default export
export default SectionClipper;
