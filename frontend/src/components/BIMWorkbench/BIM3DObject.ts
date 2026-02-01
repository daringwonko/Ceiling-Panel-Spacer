/**
 * BIM3DObject - Base Class for 3D BIM Objects
 * 
 * Extends Three.js Object3D with BIM-specific metadata, selection handling,
 * and serialization capabilities.
 */

import * as THREE from 'three';
import { BIMObjectMetadata } from './types/3d';

/**
 * Base class for all 3D BIM objects
 * Extends Three.js Object3D with BIM metadata and selection capabilities
 */
export class BIM3DObject extends THREE.Object3D {
  /** BIM metadata including IFC type, material, level, etc. */
  metadata: BIMObjectMetadata;
  
  /** Whether the object is currently selected */
  private _selected: boolean = false;
  
  /** Original material storage for selection highlighting */
  private _originalMaterials: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map();
  
  /** Selection highlight material */
  private _highlightMaterial: THREE.MeshBasicMaterial;
  
  /** Object geometry (if applicable) */
  geometry?: THREE.BufferGeometry;
  
  /** Object material (if applicable) */
  material?: THREE.Material | THREE.Material[];

  /**
   * Creates a new BIM3DObject
   * @param metadata - BIM metadata for the object
   */
  constructor(metadata: BIMObjectMetadata) {
    super();
    
    this.metadata = {
      ...metadata,
      createdAt: metadata.createdAt ?? Date.now(),
      modifiedAt: metadata.modifiedAt ?? Date.now(),
    };
    
    // Set object name from metadata
    this.name = metadata.name || metadata.id;
    
    // Create selection highlight material (bright cyan)
    this._highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      depthTest: false,
      depthWrite: false,
    });
    
    // Store reference to this BIM object
    this.userData.isBIMObject = true;
    this.userData.bimId = metadata.id;
  }

  /**
   * Get the object's unique ID
   */
  get id(): string {
    return this.metadata.id;
  }

  /**
   * Get the IFC type
   */
  get ifcType(): string {
    return this.metadata.ifcType;
  }

  /**
   * Check if the object is selected
   */
  isSelected(): boolean {
    return this._selected;
  }

  /**
   * Select the object
   * Applies selection highlighting
   */
  select(): void {
    if (this._selected) return;
    
    this._selected = true;
    this.userData.selected = true;
    this.highlight();
  }

  /**
   * Deselect the object
   * Removes selection highlighting
   */
  deselect(): void {
    if (!this._selected) return;
    
    this._selected = false;
    this.userData.selected = false;
    this.unhighlight();
  }

  /**
   * Apply highlight effect to the object
   * Uses emissive material or overlay effect
   */
  highlight(color: THREE.Color = new THREE.Color(0x00ffff)): void {
    this._highlightMaterial.color = color;
    
    this.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Store original material if not already stored
        if (!this._originalMaterials.has(child)) {
          this._originalMaterials.set(child, child.material);
        }
        
        // Apply emissive highlight or use highlight material overlay
        if (Array.isArray(child.material)) {
          // For multi-material meshes, create highlight materials array
          child.material = child.material.map(() => this._highlightMaterial.clone());
        } else if (child.material) {
          // Apply emissive effect to existing material
          const originalMaterial = child.material;
          if (originalMaterial instanceof THREE.MeshStandardMaterial || 
              originalMaterial instanceof THREE.MeshLambertMaterial ||
              originalMaterial instanceof THREE.MeshPhongMaterial) {
            // Clone and add emissive
            const highlightedMaterial = originalMaterial.clone();
            highlightedMaterial.emissive = color;
            highlightedMaterial.emissiveIntensity = 0.3;
            child.material = highlightedMaterial;
          } else {
            // Use highlight material for other types
            child.material = this._highlightMaterial.clone();
          }
        }
      }
    });
  }

  /**
   * Remove highlight effect
   * Restores original materials
   */
  unhighlight(): void {
    this.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const originalMaterial = this._originalMaterials.get(child);
        if (originalMaterial) {
          child.material = originalMaterial;
        }
      }
    });
    
    // Clear stored materials if not selected
    if (!this._selected) {
      this._originalMaterials.clear();
    }
  }

  /**
   * Update metadata with new values
   * @param updates - Partial metadata updates
   */
  updateMetadata(updates: Partial<BIMObjectMetadata>): void {
    this.metadata = {
      ...this.metadata,
      ...updates,
      modifiedAt: Date.now(),
    };
    
    // Update name if provided
    if (updates.name) {
      this.name = updates.name;
    }
  }

  /**
   * Get the object's bounding box in world space
   */
  getBoundingBox(): THREE.Box3 {
    const box = new THREE.Box3();
    this.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const childBox = new THREE.Box3().setFromObject(child);
        box.union(childBox);
      }
    });
    return box;
  }

  /**
   * Get the center point of the object
   */
  getCenter(): THREE.Vector3 {
    return this.getBoundingBox().getCenter(new THREE.Vector3());
  }

  /**
   * Get the dimensions of the object
   */
  getDimensions(): THREE.Vector3 {
    const box = this.getBoundingBox();
    return new THREE.Vector3(
      box.max.x - box.min.x,
      box.max.y - box.min.y,
      box.max.z - box.min.z
    );
  }

  /**
   * Serialize the object to JSON
   * @returns Serialized object data
   */
  toJSON(): object {
    return {
      metadata: this.metadata,
      transform: {
        position: this.position.toArray(),
        rotation: this.rotation.toArray(),
        scale: this.scale.toArray(),
      },
      children: this.children
        .filter(child => child instanceof BIM3DObject)
        .map(child => (child as BIM3DObject).toJSON()),
    };
  }

  /**
   * Create a BIM3DObject from JSON data
   * @param data - Serialized object data
   * @returns New BIM3DObject instance
   */
  static fromJSON(data: any): BIM3DObject {
    const obj = new BIM3DObject(data.metadata);
    
    if (data.transform) {
      obj.position.fromArray(data.transform.position);
      obj.rotation.fromArray(data.transform.rotation);
      obj.scale.fromArray(data.transform.scale);
    }
    
    return obj;
  }

  /**
   * Clone the object
   * @returns Cloned BIM3DObject
   */
  clone(recursive?: boolean): BIM3DObject {
    const cloned = super.clone(recursive) as BIM3DObject;
    cloned.metadata = { ...this.metadata, id: `${this.metadata.id}_clone_${Date.now()}` };
    cloned._selected = false;
    cloned._originalMaterials = new Map();
    return cloned;
  }

  /**
   * Dispose of the object and its resources
   * Clean up materials, geometries, and references
   */
  dispose(): void {
    // Dispose highlight material
    this._highlightMaterial.dispose();
    
    // Dispose all stored original materials
    this._originalMaterials.forEach((material) => {
      if (Array.isArray(material)) {
        material.forEach(m => m.dispose());
      } else {
        material.dispose();
      }
    });
    this._originalMaterials.clear();
    
    // Dispose geometries and materials in children
    this.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
    
    // Remove from parent
    this.removeFromParent();
  }

  /**
   * Set the object's visibility
   * @param visible - Whether the object should be visible
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
    this.traverse((child) => {
      child.visible = visible;
    });
  }

  /**
   * Check if the object is visible
   */
  isVisible(): boolean {
    return this.visible;
  }
}

export default BIM3DObject;
