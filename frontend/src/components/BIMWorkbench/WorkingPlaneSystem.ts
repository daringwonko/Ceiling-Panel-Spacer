/**
 * WorkingPlaneSystem - Working Plane Management
 * 
 * Manages working planes for 3D BIM editing, supporting standard orientations
 * (top, front, side) and custom planes with projection and intersection capabilities.
 */

import * as THREE from 'three';
import { 
  WorkingPlane, 
  PlaneOrientation, 
  DEFAULT_WORKING_PLANES 
} from './types/3d';

/**
 * WorkingPlaneSystem manages the active working plane for 3D editing
 * 
 * Provides:
 * - Standard plane orientations (top, front, side)
 * - Custom plane definition
 * - Point projection onto plane
 * - Ray-plane intersection
 * - Visual helper for plane visualization
 */
export class WorkingPlaneSystem {
  private _plane: WorkingPlane;
  private _helper: THREE.PlaneHelper | null = null;
  private _scene: THREE.Scene | null = null;
  private _threePlane: THREE.Plane;

  /**
   * Creates a new WorkingPlaneSystem with default top plane
   */
  constructor() {
    this._plane = {
      orientation: 'top',
      normal: new THREE.Vector3(0, 1, 0),
      constant: 0,
      origin: new THREE.Vector3(0, 0, 0),
      visible: true,
      size: 10000,
      color: new THREE.Color(0x4a9eff),
    };
    
    this._threePlane = new THREE.Plane(this._plane.normal, this._plane.constant);
  }

  /**
   * Get the current working plane configuration
   */
  getWorkingPlane(): WorkingPlane {
    return { ...this._plane };
  }

  /**
   * Get the Three.js Plane object
   */
  getPlane(): THREE.Plane {
    return this._threePlane.clone();
  }

  /**
   * Get the plane normal vector
   */
  getNormal(): THREE.Vector3 {
    return this._plane.normal.clone();
  }

  /**
   * Get the plane origin point
   */
  getOrigin(): THREE.Vector3 {
    return this._plane.origin.clone();
  }

  /**
   * Set the working plane to top orientation (XY plane)
   * @param origin - Optional origin point, defaults to (0, 0, 0)
   */
  setTopPlane(origin: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): void {
    const defaults = DEFAULT_WORKING_PLANES.top;
    
    this._plane = {
      orientation: 'top',
      normal: defaults.normal.clone(),
      constant: -defaults.normal.dot(origin),
      origin: origin.clone(),
      visible: this._plane.visible,
      size: this._plane.size,
      color: defaults.color?.clone() || new THREE.Color(0x4a9eff),
    };
    
    this._updateThreePlane();
    this._updateHelper();
  }

  /**
   * Set the working plane to front orientation (XZ plane)
   * @param origin - Optional origin point, defaults to (0, 0, 0)
   */
  setFrontPlane(origin: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): void {
    const defaults = DEFAULT_WORKING_PLANES.front;
    
    this._plane = {
      orientation: 'front',
      normal: defaults.normal.clone(),
      constant: -defaults.normal.dot(origin),
      origin: origin.clone(),
      visible: this._plane.visible,
      size: this._plane.size,
      color: defaults.color?.clone() || new THREE.Color(0xff6b4a),
    };
    
    this._updateThreePlane();
    this._updateHelper();
  }

  /**
   * Set the working plane to side orientation (YZ plane)
   * @param origin - Optional origin point, defaults to (0, 0, 0)
   */
  setSidePlane(origin: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): void {
    const defaults = DEFAULT_WORKING_PLANES.side;
    
    this._plane = {
      orientation: 'side',
      normal: defaults.normal.clone(),
      constant: -defaults.normal.dot(origin),
      origin: origin.clone(),
      visible: this._plane.visible,
      size: this._plane.size,
      color: defaults.color?.clone() || new THREE.Color(0x6bff4a),
    };
    
    this._updateThreePlane();
    this._updateHelper();
  }

  /**
   * Set a custom working plane
   * @param normal - Plane normal vector
   * @param origin - Point on the plane
   */
  setCustomPlane(normal: THREE.Vector3, origin: THREE.Vector3): void {
    const normalizedNormal = normal.clone().normalize();
    
    this._plane = {
      orientation: 'custom',
      normal: normalizedNormal,
      constant: -normalizedNormal.dot(origin),
      origin: origin.clone(),
      visible: this._plane.visible,
      size: this._plane.size,
      color: new THREE.Color(0xffaa00), // Orange for custom planes
    };
    
    this._updateThreePlane();
    this._updateHelper();
  }

  /**
   * Set working plane from three points
   * @param p1 - First point
   * @param p2 - Second point
   * @param p3 - Third point
   */
  setPlaneFromPoints(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): void {
    const v1 = new THREE.Vector3().subVectors(p2, p1);
    const v2 = new THREE.Vector3().subVectors(p3, p1);
    const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
    
    this.setCustomPlane(normal, p1);
  }

  /**
   * Update the Three.js plane from current configuration
   */
  private _updateThreePlane(): void {
    this._threePlane.setFromNormalAndCoplanarPoint(
      this._plane.normal,
      this._plane.origin
    );
  }

  /**
   * Project a point onto the working plane
   * @param point - Point to project
   * @returns Projected point on the plane
   */
  projectPoint(point: THREE.Vector3): THREE.Vector3 {
    return this.projectOntoPlane(point);
  }

  /**
   * Project a point onto the working plane
   * @param point - Point to project
   * @returns Projected point on the plane
   */
  projectOntoPlane(point: THREE.Vector3): THREE.Vector3 {
    const projected = point.clone();
    this._threePlane.projectPoint(point, projected);
    return projected;
  }

  /**
   * Get the distance from a point to the working plane
   * @param point - Point to check
   * @returns Signed distance to plane
   */
  distanceToPoint(point: THREE.Vector3): number {
    return this._threePlane.distanceToPoint(point);
  }

  /**
   * Check if a point is on the working plane (within tolerance)
   * @param point - Point to check
   * @param tolerance - Distance tolerance, defaults to 0.01
   * @returns True if point is on plane
   */
  isPointOnPlane(point: THREE.Vector3, tolerance: number = 0.01): boolean {
    return Math.abs(this.distanceToPoint(point)) < tolerance;
  }

  /**
   * Intersect a ray with the working plane
   * @param raycaster - Three.js raycaster
   * @returns Intersection point or null if no intersection
   */
  rayIntersect(raycaster: THREE.Raycaster): THREE.Vector3 | null {
    const target = new THREE.Vector3();
    const intersection = raycaster.ray.intersectPlane(this._threePlane, target);
    return intersection ? target : null;
  }

  /**
   * Intersect a line with the working plane
   * @param start - Line start point
   * @param end - Line end point
   * @returns Intersection point or null if no intersection
   */
  lineIntersect(start: THREE.Vector3, end: THREE.Vector3): THREE.Vector3 | null {
    const line = new THREE.Line3(start, end);
    const target = new THREE.Vector3();
    const intersection = this._threePlane.intersectLine(line, target);
    return intersection ? target : null;
  }

  /**
   * Create a visual helper for the working plane
   * @param scene - Three.js scene to add helper to
   */
  createHelper(scene: THREE.Scene): void {
    this.removeHelper();
    
    this._scene = scene;
    
    if (!this._plane.visible) return;
    
    this._helper = new THREE.PlaneHelper(
      this._threePlane,
      this._plane.size,
      this._plane.color?.getHex() || 0x4a9eff
    );
    
    // Make the helper less obtrusive
    this._helper.material.transparent = true;
    this._helper.material.opacity = 0.3;
    this._helper.material.depthWrite = false;
    
    scene.add(this._helper);
  }

  /**
   * Remove the plane helper from the scene
   */
  removeHelper(): void {
    if (this._helper && this._scene) {
      this._scene.remove(this._helper);
      this._helper.geometry.dispose();
      if (Array.isArray(this._helper.material)) {
        this._helper.material.forEach(m => m.dispose());
      } else {
        this._helper.material.dispose();
      }
      this._helper = null;
    }
  }

  /**
   * Update the helper to match current plane
   */
  private _updateHelper(): void {
    if (this._helper && this._scene) {
      this.createHelper(this._scene);
    }
  }

  /**
   * Update helper size
   * @param size - New size for the plane helper
   */
  setSize(size: number): void {
    this._plane.size = size;
    this._updateHelper();
  }

  /**
   * Toggle plane visibility
   * @param visible - Whether the plane should be visible
   */
  setVisible(visible: boolean): void {
    this._plane.visible = visible;
    if (visible && this._scene) {
      this.createHelper(this._scene);
    } else {
      this.removeHelper();
    }
  }

  /**
   * Check if the plane helper is visible
   */
  isVisible(): boolean {
    return this._plane.visible;
  }

  /**
   * Set plane color
   * @param color - New color for the plane helper
   */
  setColor(color: THREE.Color): void {
    this._plane.color = color.clone();
    this._updateHelper();
  }

  /**
   * Get a coordinate system aligned with the working plane
   * @returns Object containing origin, xAxis, yAxis, zAxis (normal)
   */
  getCoordinateSystem(): {
    origin: THREE.Vector3;
    xAxis: THREE.Vector3;
    yAxis: THREE.Vector3;
    zAxis: THREE.Vector3;
  } {
    const zAxis = this._plane.normal.clone();
    
    // Find perpendicular vectors for x and y axes
    let xAxis: THREE.Vector3;
    if (Math.abs(zAxis.y) < 0.9) {
      xAxis = new THREE.Vector3(0, 1, 0).cross(zAxis).normalize();
    } else {
      xAxis = new THREE.Vector3(1, 0, 0).cross(zAxis).normalize();
    }
    
    const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
    
    return {
      origin: this._plane.origin.clone(),
      xAxis,
      yAxis,
      zAxis,
    };
  }

  /**
   * Convert a world point to plane coordinates
   * @param worldPoint - Point in world space
   * @returns Point in plane coordinates (u, v, distance)
   */
  worldToPlane(worldPoint: THREE.Vector3): { u: number; v: number; distance: number } {
    const coords = this.getCoordinateSystem();
    const toPoint = new THREE.Vector3().subVectors(worldPoint, coords.origin);
    
    return {
      u: toPoint.dot(coords.xAxis),
      v: toPoint.dot(coords.yAxis),
      distance: this.distanceToPoint(worldPoint),
    };
  }

  /**
   * Convert plane coordinates to world point
   * @param u - Coordinate along plane x-axis
   * @param v - Coordinate along plane y-axis
   * @returns Point in world space on the plane
   */
  planeToWorld(u: number, v: number): THREE.Vector3 {
    const coords = this.getCoordinateSystem();
    return new THREE.Vector3()
      .copy(coords.origin)
      .addScaledVector(coords.xAxis, u)
      .addScaledVector(coords.yAxis, v);
  }

  /**
   * Serialize the working plane
   */
  toJSON(): object {
    return {
      orientation: this._plane.orientation,
      normal: this._plane.normal.toArray(),
      constant: this._plane.constant,
      origin: this._plane.origin.toArray(),
      visible: this._plane.visible,
      size: this._plane.size,
      color: this._plane.color?.toArray(),
    };
  }

  /**
   * Load working plane from JSON
   */
  static fromJSON(data: any): WorkingPlaneSystem {
    const system = new WorkingPlaneSystem();
    
    if (data.orientation === 'custom') {
      system.setCustomPlane(
        new THREE.Vector3().fromArray(data.normal),
        new THREE.Vector3().fromArray(data.origin)
      );
    } else {
      const origin = new THREE.Vector3().fromArray(data.origin);
      switch (data.orientation) {
        case 'front':
          system.setFrontPlane(origin);
          break;
        case 'side':
          system.setSidePlane(origin);
          break;
        case 'top':
        default:
          system.setTopPlane(origin);
          break;
      }
    }
    
    system.setVisible(data.visible);
    system.setSize(data.size);
    
    if (data.color) {
      system.setColor(new THREE.Color().fromArray(data.color));
    }
    
    return system;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.removeHelper();
    this._scene = null;
  }
}

export default WorkingPlaneSystem;
export { PlaneOrientation };
