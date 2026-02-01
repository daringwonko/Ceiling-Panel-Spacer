import * as THREE from 'three';
import { WorkingPlane, PlaneOrientation } from './types/3d';

/**
 * WorkingPlaneSystem
 * 
 * Manages working planes for 3D object placement and manipulation.
 * Supports standard orientations (top, front, side) and custom planes.
 */
export class WorkingPlaneSystem {
  private _plane: WorkingPlane;
  private _helper: THREE.PlaneHelper | null = null;
  private _scene: THREE.Scene | null = null;
  
  /**
   * Create a new WorkingPlaneSystem with default top plane
   */
  constructor() {
    this._plane = {
      orientation: 'top',
      normal: new THREE.Vector3(0, 1, 0),
      constant: 0,
      origin: new THREE.Vector3(0, 0, 0),
      visible: true,
      size: 20
    };
  }
  
  /**
   * Set the working plane to top orientation (XY plane, Z = 0)
   * @param origin - Optional origin point (defaults to 0,0,0)
   */
  public setTopPlane(origin: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): void {
    this._plane = {
      orientation: 'top',
      normal: new THREE.Vector3(0, 1, 0),
      constant: -origin.y,
      origin: origin.clone(),
      visible: this._plane.visible,
      size: this._plane.size
    };
    this.updateHelper();
  }
  
  /**
   * Set the working plane to front orientation (XZ plane, Y = 0)
   * @param origin - Optional origin point (defaults to 0,0,0)
   */
  public setFrontPlane(origin: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): void {
    this._plane = {
      orientation: 'front',
      normal: new THREE.Vector3(0, 0, 1),
      constant: -origin.z,
      origin: origin.clone(),
      visible: this._plane.visible,
      size: this._plane.size
    };
    this.updateHelper();
  }
  
  /**
   * Set the working plane to side orientation (YZ plane, X = 0)
   * @param origin - Optional origin point (defaults to 0,0,0)
   */
  public setSidePlane(origin: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): void {
    this._plane = {
      orientation: 'side',
      normal: new THREE.Vector3(1, 0, 0),
      constant: -origin.x,
      origin: origin.clone(),
      visible: this._plane.visible,
      size: this._plane.size
    };
    this.updateHelper();
  }
  
  /**
   * Set a custom working plane
   * @param normal - Plane normal vector
   * @param origin - Point on the plane
   */
  public setCustomPlane(normal: THREE.Vector3, origin: THREE.Vector3): void {
    // Normalize the normal vector
    const normalizedNormal = normal.clone().normalize();
    
    // Calculate plane constant from normal and origin
    // Plane equation: ax + by + cz + d = 0
    // d = -(ax0 + by0 + cz0)
    const constant = -(
      normalizedNormal.x * origin.x +
      normalizedNormal.y * origin.y +
      normalizedNormal.z * origin.z
    );
    
    this._plane = {
      orientation: 'custom',
      normal: normalizedNormal,
      constant: constant,
      origin: origin.clone(),
      visible: this._plane.visible,
      size: this._plane.size
    };
    this.updateHelper();
  }
  
  /**
   * Get the current working plane as Three.js Plane
   * @returns Three.js Plane object
   */
  public getPlane(): THREE.Plane {
    return new THREE.Plane(
      this._plane.normal.clone(),
      this._plane.constant
    );
  }
  
  /**
   * Get the current working plane configuration
   * @returns WorkingPlane object
   */
  public getWorkingPlane(): WorkingPlane {
    return { ...this._plane };
  }
  
  /**
   * Set the plane visibility
   * @param visible - Whether to show the plane helper
   */
  public setVisible(visible: boolean): void {
    this._plane.visible = visible;
    if (this._helper) {
      this._helper.visible = visible;
    }
  }
  
  /**
   * Set the plane helper size
   * @param size - Size of the plane visualization
   */
  public setSize(size: number): void {
    this._plane.size = size;
    this.updateHelper();
  }
  
  /**
   * Create a visual helper for the working plane
   * @param scene - Three.js scene to add the helper to
   */
  public createHelper(scene: THREE.Scene): void {
    this._scene = scene;
    
    // Remove existing helper
    this.removeHelper();
    
    // Create new helper
    const plane = this.getPlane();
    this._helper = new THREE.PlaneHelper(plane, this._plane.size, 0x4a9eff);
    this._helper.visible = this._plane.visible;
    
    scene.add(this._helper);
  }
  
  /**
   * Remove the plane helper from the scene
   */
  public removeHelper(): void {
    if (this._helper && this._scene) {
      this._scene.remove(this._helper);
      this._helper.geometry.dispose();
      if (this._helper.material instanceof THREE.Material) {
        this._helper.material.dispose();
      }
      this._helper = null;
    }
  }
  
  /**
   * Update the plane helper to match current plane settings
   */
  public updateHelper(): void {
    if (this._helper && this._scene) {
      this.removeHelper();
      this.createHelper(this._scene);
    }
  }
  
  /**
   * Project a 3D point onto the working plane
   * @param point - Point to project
   * @returns Projected point on the plane
   */
  public projectPoint(point: THREE.Vector3): THREE.Vector3 {
    const plane = this.getPlane();
    const projected = point.clone();
    plane.projectPoint(point, projected);
    return projected;
  }
  
  /**
   * Project a point onto the plane along a specific direction
   * @param point - Point to project
   * @param direction - Direction vector for projection
   * @returns Projected point or null if no intersection
   */
  public projectOntoPlane(
    point: THREE.Vector3,
    direction: THREE.Vector3 = this._plane.normal.clone().negate()
  ): THREE.Vector3 | null {
    const plane = this.getPlane();
    const ray = new THREE.Ray(point, direction.normalize());
    const target = new THREE.Vector3();
    
    const intersected = ray.intersectPlane(plane, target);
    return intersected ? target : null;
  }
  
  /**
   * Intersect a raycaster with the working plane
   * @param raycaster - Three.js Raycaster
   * @returns Intersection point or null
   */
  public rayIntersect(raycaster: THREE.Raycaster): THREE.Vector3 | null {
    const plane = this.getPlane();
    const target = new THREE.Vector3();
    
    const intersected = raycaster.ray.intersectPlane(plane, target);
    return intersected ? target : null;
  }
  
  /**
   * Get the current plane orientation
   * @returns Plane orientation type
   */
  public getOrientation(): PlaneOrientation {
    return this._plane.orientation;
  }
  
  /**
   * Get the plane normal vector
   * @returns Normal vector
   */
  public getNormal(): THREE.Vector3 {
    return this._plane.normal.clone();
  }
  
  /**
   * Get the plane origin
   * @returns Origin point
   */
  public getOrigin(): THREE.Vector3 {
    return this._plane.origin.clone();
  }
  
  /**
   * Align an object's up vector with the plane normal
   * @param object - Object to align
   */
  public alignObjectToPlane(object: THREE.Object3D): void {
    // Create a quaternion that rotates the object's up vector to match plane normal
    const up = new THREE.Vector3(0, 1, 0);
    const normal = this._plane.normal;
    
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(up, normal);
    
    object.quaternion.multiply(quaternion);
  }
  
  /**
   * Snap a point to the grid on the working plane
   * @param point - Point to snap
   * @param gridSize - Grid size for snapping
   * @returns Snapped point
   */
  public snapToGrid(point: THREE.Vector3, gridSize: number = 1): THREE.Vector3 {
    const projected = this.projectPoint(point);
    
    // Calculate local coordinates on the plane
    const localX = new THREE.Vector3(1, 0, 0);
    const localY = new THREE.Vector3(0, 1, 0);
    
    // Adjust local axes based on plane normal
    if (Math.abs(this._plane.normal.y) < 0.9) {
      localX.set(0, 1, 0);
    }
    
    // Snap to grid
    const snappedX = Math.round(projected.dot(localX) / gridSize) * gridSize;
    const snappedY = Math.round(projected.dot(localY) / gridSize) * gridSize;
    
    return projected;
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.removeHelper();
    this._scene = null;
  }
}

export default WorkingPlaneSystem;
