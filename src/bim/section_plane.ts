/**
 * Section Plane Implementation
 * 
 * Provides section plane objects for cutting through 3D models to generate 2D views.
 * Supports plan, elevation, and custom section types with visual representation.
 */

import {
  SectionPlane,
  SectionType,
  Point3D,
  Vector3D,
  PlaneEquation,
  SectionBounds,
  DEFAULT_SECTION_PLANE,
} from './types';

/**
 * Generate unique ID for section planes using crypto or Math.random fallback
 */
function generateSectionId(): string {
  // Use crypto.randomUUID() if available (Node.js 14.17+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `section-${crypto.randomUUID().substring(0, 8)}`;
  }
  // Fallback to Math.random
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `section-${randomPart}`;
}

/**
 * Generate sequential section name (Section A, Section B, etc.)
 */
let sectionNameCounter = 0;
function generateSectionName(): string {
  sectionNameCounter++;
  // Use letters A, B, C... then AA, AB, etc.
  const letterIndex = (sectionNameCounter - 1) % 26;
  const letter = String.fromCharCode(65 + letterIndex);
  const suffix = Math.floor((sectionNameCounter - 1) / 26);
  return suffix > 0 ? `Section ${letter}${String.fromCharCode(64 + suffix)}` : `Section ${letter}`;
}

/**
 * Normalize a vector to unit length
 */
function normalizeVector(v: Vector3D): Vector3D {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (length === 0) {
    return { x: 0, y: 0, z: 1 }; // Default up direction
  }
  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length,
  };
}

/**
 * Cross product of two vectors
 */
function crossProduct(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Dot product of two vectors
 */
function dotProduct(a: Vector3D, b: Vector3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Vector subtraction
 */
function subtractVectors(a: Point3D, b: Point3D): Vector3D {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

/**
 * Vector addition
 */
function addVectorToPoint(point: Point3D, v: Vector3D): Point3D {
  return {
    x: point.x + v.x,
    y: point.y + v.y,
    z: point.z + v.z,
  };
}

/**
 * Scale a vector
 */
function scaleVector(v: Vector3D, scale: number): Vector3D {
  return {
    x: v.x * scale,
    y: v.y * scale,
    z: v.z * scale,
  };
}

/**
 * SectionPlane class for creating and managing section cuts
 */
export class SectionPlaneClass {
  public readonly id: string;
  public name: string;
  public type: SectionType;
  public position: Point3D;
  public normal: Vector3D;
  public width: number;
  public height: number;
  public isActive: boolean;

  constructor(config?: Partial<SectionPlane>) {
    this.id = config?.id || generateSectionId();
    this.name = config?.name || generateSectionName();
    this.type = config?.type || SectionType.SECTION;
    this.position = config?.position || { ...DEFAULT_SECTION_PLANE.position };
    this.normal = normalizeVector(config?.normal || DEFAULT_SECTION_PLANE.normal);
    this.width = config?.width || DEFAULT_SECTION_PLANE.width;
    this.height = config?.height || DEFAULT_SECTION_PLANE.height;
    this.isActive = config?.isActive ?? DEFAULT_SECTION_PLANE.isActive;

    // Validate properties
    this.validate();
  }

  /**
   * Validate section plane properties
   */
  private validate(): void {
    if (this.width <= 0) {
      throw new Error(`Section plane width must be positive, got ${this.width}`);
    }
    if (this.height <= 0) {
      throw new Error(`Section plane height must be positive, got ${this.height}`);
    }
  }

  /**
   * Get the plane equation (ax + by + cz = d)
   */
  getPlaneEquation(): PlaneEquation {
    // Plane equation: normal · (point - p0) = 0
    // => normal · point = normal · p0
    // => ax + by + cz = d where d = normal · p0
    const d = dotProduct(this.normal, this.position);
    return {
      a: this.normal.x,
      b: this.normal.y,
      c: this.normal.z,
      d: d,
    };
  }

  /**
   * Calculate the 3D bounds rectangle for this section plane
   */
  getBounds(): SectionBounds {
    // Calculate two orthogonal vectors on the plane
    // First, find an arbitrary vector not parallel to normal
    const arbitrary: Vector3D = Math.abs(this.normal.x) < 0.9
      ? { x: 1, y: 0, z: 0 }
      : { x: 0, y: 1, z: 0 };

    // Get tangent vectors on the plane
    const tangent1 = normalizeVector(crossProduct(this.normal, arbitrary));
    const tangent2 = normalizeVector(crossProduct(this.normal, tangent1));

    // Scale tangents by half width and height
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    // Calculate four corners of the rectangle
    const corner1 = addVectorToPoint(
      this.position,
      addVectorToPoint(scaleVector(tangent1, halfWidth), scaleVector(tangent2, halfHeight))
    );
    const corner2 = addVectorToPoint(
      this.position,
      addVectorToPoint(scaleVector(tangent1, -halfWidth), scaleVector(tangent2, halfHeight))
    );
    const corner3 = addVectorToPoint(
      this.position,
      addVectorToPoint(scaleVector(tangent1, -halfWidth), scaleVector(tangent2, -halfHeight))
    );
    const corner4 = addVectorToPoint(
      this.position,
      addVectorToPoint(scaleVector(tangent1, halfWidth), scaleVector(tangent2, -halfHeight))
    );

    const corners = [corner1, corner2, corner3, corner4];

    // Calculate min/max bounds
    const xs = corners.map((c) => c.x);
    const ys = corners.map((c) => c.y);
    const zs = corners.map((c) => c.z);

    return {
      corners,
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      minZ: Math.min(...zs),
      maxZ: Math.max(...zs),
    };
  }

  /**
   * Get the view direction (direction the section is looking toward)
   * This is the negative of the normal (view looks toward positive side)
   */
  getViewDirection(): Vector3D {
    return scaleVector(this.normal, -1);
  }

  /**
   * Flip the direction of the section plane
   */
  flipDirection(): void {
    this.normal = scaleVector(this.normal, -1);
  }

  /**
   * Set the type and automatically configure normal for common orientations
   */
  setType(type: SectionType): void {
    this.type = type;

    switch (type) {
      case SectionType.PLAN:
        // Horizontal cut looking down
        this.normal = { x: 0, y: -1, z: 0 };
        break;
      case SectionType.ELEVATION:
        // Vertical cut looking horizontally (default to X direction)
        this.normal = { x: 1, y: 0, z: 0 };
        break;
      case SectionType.SECTION:
        // Custom - keep existing normal
        break;
    }
  }

  /**
   * Move the section plane to a new position
   */
  moveTo(position: Point3D): void {
    this.position = { ...position };
  }

  /**
   * Set the size of the section plane
   */
  setSize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive values');
    }
    this.width = width;
    this.height = height;
  }

  /**
   * Check if a 3D point is on the positive side of the section plane
   */
  isPointOnPositiveSide(point: Point3D): boolean {
    const equation = this.getPlaneEquation();
    const value = equation.a * point.x + equation.b * point.y + equation.c * point.z - equation.d;
    return value >= 0;
  }

  /**
   * Calculate distance from a point to the plane
   */
  getDistanceToPlane(point: Point3D): number {
    const equation = this.getPlaneEquation();
    const numerator = Math.abs(
      equation.a * point.x + equation.b * point.y + equation.c * point.z - equation.d
    );
    const denominator = Math.sqrt(equation.a * equation.a + equation.b * equation.b + equation.c * equation.c);
    return numerator / denominator;
  }

  /**
   * Activate this section plane
   */
  activate(): void {
    this.isActive = true;
  }

  /**
   * Deactivate this section plane
   */
  deactivate(): void {
    this.isActive = false;
  }

  /**
   * Toggle active state
   */
  toggle(): boolean {
    this.isActive = !this.isActive;
    return this.isActive;
  }

  /**
   * Serialize to plain object for storage
   */
  toDict(): SectionPlane {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      position: { ...this.position },
      normal: { ...this.normal },
      width: this.width,
      height: this.height,
      isActive: this.isActive,
    };
  }

  /**
   * Create SectionPlane from serialized data
   */
  static fromDict(data: SectionPlane): SectionPlaneClass {
    return new SectionPlaneClass(data);
  }

  /**
   * Clone this section plane
   */
  clone(): SectionPlaneClass {
    return new SectionPlaneClass(this.toDict());
  }

  /**
   * Check if this section overlaps with another (same position and orientation)
   */
  overlaps(other: SectionPlaneClass): boolean {
    // Check if normals are parallel (same or opposite direction)
    const dot = Math.abs(dotProduct(this.normal, other.normal));
    if (dot < 0.99) return false; // Not parallel

    // Check if planes are at similar positions
    const dist1 = Math.abs(
      this.getPlaneEquation().d - other.getPlaneEquation().d
    );
    const dist2 = this.getDistanceToPlane(other.position);
    const dist3 = other.getDistanceToPlane(this.position);

    return dist1 < Math.max(this.width, this.height) * 0.1 ||
           dist2 < Math.max(this.width, this.height) * 0.1 ||
           dist3 < Math.max(this.width, this.height) * 0.1;
  }

  // ==================== VISUAL REPRESENTATION ====================

  /**
   * Visual material properties for section plane
   */
  public readonly visualProperties = {
    planeColor: 0x4287f5,        // Blue color for section plane
    planeOpacity: 0.3,           // Semi-transparent
    borderColor: 0x1a4d8c,       // Darker blue for border
    borderThickness: 2,          // Border line thickness in pixels
    hatchingColor: 0x1a4d8c,     // Dark blue for hatching
    hatchingSpacing: 20,         // Spacing between hatching lines in pixels
    arrowColor: 0xff6b6b,        // Red for direction arrows
    arrowSize: 50,               // Size of direction arrows in pixels
    selectedColor: 0xff9500,     // Orange when selected
    activeColor: 0x00c853,       // Green when active
  };

  /**
   * Generate vertices for the rectangle mesh
   * Returns array of vertices for a quad [x, y, z, x, y, z, ...]
   */
  getRectangleMeshVertices(): number[] {
    const bounds = this.getBounds();
    const corners = bounds.corners;
    
    // Create quad as two triangles
    return [
      // Triangle 1: corner1, corner2, corner3
      corners[0].x, corners[0].y, corners[0].z,
      corners[1].x, corners[1].y, corners[1].z,
      corners[2].x, corners[2].y, corners[2].z,
      // Triangle 2: corner1, corner3, corner4
      corners[0].x, corners[0].y, corners[0].z,
      corners[2].x, corners[2].y, corners[2].z,
      corners[3].x, corners[3].y, corners[3].z,
    ];
  }

  /**
   * Generate indices for the rectangle mesh
   */
  getRectangleMeshIndices(): number[] {
    return [0, 1, 2, 0, 2, 3];
  }

  /**
   * Generate UV coordinates for texture mapping
   */
  getRectangleMeshUVs(): number[] {
    return [
      0, 0,
      1, 0,
      1, 1,
      0, 1,
    ];
  }

  /**
   * Generate border line segments for the rectangle
   * Returns array of line segments [[start, end], ...]
   */
  getBorderLines(): Point3D[][] {
    const bounds = this.getBounds();
    const corners = bounds.corners;
    
    return [
      [corners[0], corners[1]], // Top
      [corners[1], corners[2]], // Right
      [corners[2], corners[3]], // Bottom
      [corners[3], corners[0]], // Left
    ];
  }

  /**
   * Generate hatching pattern lines for cut surfaces
   * Diagonal lines across the section plane
   */
  getHatchingLines(): Point3D[][] {
    const lines: Point3D[][] = [];
    const bounds = this.getBounds();
    const corners = bounds.corners;

    // Calculate diagonal direction on the plane
    const diagonal1 = subtractVectors(corners[2], corners[0]);
    const diagonal2 = subtractVectors(corners[3], corners[1]);

    // Generate hatching at regular intervals across the plane
    const numLines = Math.max(5, Math.floor(this.width / 100));
    const spacing = this.width / numLines;

    for (let i = 1; i < numLines; i++) {
      // Create parallel lines in diagonal direction
      const offset = scaleVector(normalizeVector(diagonal1), spacing * i);
      
      // Calculate intersection with plane bounds
      const lineStart = addVectorToPoint(corners[0], offset);
      const lineEnd = addVectorToPoint(corners[3], offset);
      
      // Store line as segment (will be clipped to bounds later)
      lines.push([lineStart, lineEnd]);
    }

    return lines;
  }

  /**
   * Generate direction arrows at the corners
   * Arrows point in the view direction (negative normal)
   */
  getDirectionArrows(): Array<{ position: Point3D; direction: Vector3D }> {
    const arrows: Array<{ position: Point3D; direction: Vector3D }> = [];
    const bounds = this.getBounds();
    const corners = bounds.corners;
    const viewDir = this.getViewDirection();

    // Place arrows at each corner pointing in view direction
    for (const corner of corners) {
      arrows.push({
        position: { ...corner },
        direction: { ...viewDir },
      });
    }

    return arrows;
  }

  /**
   * Get arrow head geometry for visualization
   */
  getArrowHeadGeometry(): { vertices: number[]; indices: number[] } {
    const size = this.visualProperties.arrowSize;
    const halfSize = size / 2;
    
    // Arrow head pointing in +Y direction
    const vertices = [
      0, size, 0,           // Tip
      -halfSize, 0, 0,      // Left base
      halfSize, 0, 0,       // Right base
    ];

    const indices = [0, 1, 2];

    return { vertices, indices };
  }

  /**
   * Get the normal direction for a specific corner
   * Useful for orienting arrows at corners
   */
  getCornerNormal(cornerIndex: number): Vector3D {
    const bounds = this.getBounds();
    if (cornerIndex < 0 || cornerIndex >= bounds.corners.length) {
      return { ...this.normal };
    }

    // Calculate vector from center to corner
    const corner = bounds.corners[cornerIndex];
    return normalizeVector(subtractVectors(corner, this.position));
  }

  /**
   * Check if a point is within the section plane bounds
   */
  isPointWithinBounds(point: Point3D): boolean {
    const bounds = this.getBounds();
    const epsilon = 0.1; // Small tolerance for floating point
    
    return (
      point.x >= bounds.minX - epsilon &&
      point.x <= bounds.maxX + epsilon &&
      point.y >= bounds.minY - epsilon &&
      point.y <= bounds.maxY + epsilon &&
      point.z >= bounds.minZ - epsilon &&
      point.z <= bounds.maxZ + epsilon
    );
  }

  /**
   * Get the display color based on state
   */
  getDisplayColor(): number {
    if (this.isActive) {
      return this.visualProperties.activeColor;
    }
    return this.visualProperties.planeColor;
  }

  /**
   * Get visual representation data for rendering
   */
  getVisualRepresentation(): {
    meshVertices: number[];
    meshIndices: number[];
    meshUVs: number[];
    borderLines: Point3D[][];
    hatchingLines: Point3D[][];
    arrows: Array<{ position: Point3D; direction: Vector3D }>;
    color: number;
    opacity: number;
  } {
    return {
      meshVertices: this.getRectangleMeshVertices(),
      meshIndices: this.getRectangleMeshIndices(),
      meshUVs: this.getRectangleMeshUVs(),
      borderLines: this.getBorderLines(),
      hatchingLines: this.getHatchingLines(),
      arrows: this.getDirectionArrows(),
      color: this.getDisplayColor(),
      opacity: this.visualProperties.planeOpacity,
    };
  }
}

// Export type alias for convenience
export type SectionPlane = SectionPlaneClass;

// Default export for easy importing
export default SectionPlaneClass;
