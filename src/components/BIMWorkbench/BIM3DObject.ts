import * as THREE from 'three';
import { BIMObjectMetadata } from './types/3d';

/**
 * BIM3DObject - Base class for all 3D BIM objects
 * 
 * Extends Three.js Object3D with BIM-specific metadata,
 * selection capabilities, and serialization support.
 */
export class BIM3DObject extends THREE.Object3D {
  /** BIM metadata for IFC compatibility */
  public metadata: BIMObjectMetadata;
  
  /** Whether the object is currently selected */
  private _selected: boolean = false;
  
  /** Original material before selection highlight */
  private _originalMaterial: THREE.Material | THREE.Material[] | null = null;
  
  /** Highlight material for selection */
  private _highlightMaterial: THREE.Material | null = null;
  
  /**
   * Create a new BIM3DObject
   * @param metadata - BIM metadata for the object
   */
  constructor(metadata: BIMObjectMetadata) {
    super();
    this.metadata = { ...metadata };
    this.name = metadata.id;
    
    // Create highlight material
    this._highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
  }
  
  /**
   * Select the object
   * Applies visual highlight and sets selection state
   */
  public select(): void {
    if (this._selected) return;
    
    this._selected = true;
    this.showHighlight();
    
    // Dispatch selection event
    this.dispatchEvent({ type: 'selected', object: this } as any);
  }
  
  /**
   * Deselect the object
   * Removes visual highlight and clears selection state
   */
  public deselect(): void {
    if (!this._selected) return;
    
    this._selected = false;
    this.hideHighlight();
    
    // Dispatch deselection event
    this.dispatchEvent({ type: 'deselected', object: this } as any);
  }
  
  /**
   * Check if object is selected
   * @returns True if selected
   */
  public isSelected(): boolean {
    return this._selected;
  }
  
  /**
   * Show highlight effect on the object
   * Uses emissive material override or outline effect
   */
  public showHighlight(color: THREE.Color = new THREE.Color(0x4a9eff)): void {
    this.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Store original material if not already stored
        if (!this._originalMaterial) {
          this._originalMaterial = child.material.clone();
        }
        
        // Create highlight material
        const highlightMat = new THREE.MeshPhongMaterial({
          color: child.material instanceof THREE.Material 
            ? (child.material as any).color || new THREE.Color(0xffffff)
            : new THREE.Color(0xffffff),
          emissive: color,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.9
        });
        
        child.material = highlightMat;
      }
    });
  }
  
  /**
   * Remove highlight effect
   * Restores original material
   */
  public hideHighlight(): void {
    if (!this._originalMaterial) return;
    
    this.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = this._originalMaterial instanceof THREE.Material
          ? this._originalMaterial.clone()
          : this._originalMaterial.map(m => m.clone());
      }
    });
    
    this._originalMaterial = null;
  }
  
  /**
   * Update BIM metadata
   * @param updates - Partial metadata updates
   */
  public updateMetadata(updates: Partial<BIMObjectMetadata>): void {
    this.metadata = { ...this.metadata, ...updates };
    
    // Update name if ID changed
    if (updates.id) {
      this.name = updates.id;
    }
    
    // Dispatch metadata change event
    this.dispatchEvent({ type: 'metadataChanged', object: this, updates } as any);
  }
  
  /**
   * Serialize object to JSON
   * @returns Serialized object data
   */
  public toJSON(): object {
    return {
      metadata: this.metadata,
      transform: {
        position: this.position.toArray(),
        rotation: this.rotation.toArray(),
        scale: this.scale.toArray()
      },
      children: this.children.map(child => {
        if (child instanceof BIM3DObject) {
          return child.toJSON();
        }
        return null;
      }).filter(Boolean)
    };
  }
  
  /**
   * Deserialize object from JSON
   * @param data - Serialized object data
   * @returns Reconstructed BIM3DObject
   */
  public static fromJSON(data: any): BIM3DObject {
    const metadata: BIMObjectMetadata = data.metadata;
    const obj = new BIM3DObject(metadata);
    
    if (data.transform) {
      obj.position.fromArray(data.transform.position);
      obj.rotation.fromArray(data.transform.rotation);
      obj.scale.fromArray(data.transform.scale);
    }
    
    return obj;
  }
  
  /**
   * Get the bounding box of this object
   * @returns Axis-aligned bounding box
   */
  public getBoundingBox(): THREE.Box3 {
    const box = new THREE.Box3();
    box.setFromObject(this);
    return box;
  }
  
  /**
   * Get object center point
   * @returns Center position
   */
  public getCenter(): THREE.Vector3 {
    return this.getBoundingBox().getCenter(new THREE.Vector3());
  }
  
  /**
   * Get object dimensions
   * @returns Width, height, depth
   */
  public getDimensions(): THREE.Vector3 {
    const box = this.getBoundingBox();
    return new THREE.Vector3(
      box.max.x - box.min.x,
      box.max.y - box.min.y,
      box.max.z - box.min.z
    );
  }
  
  /**
   * Clean up resources
   * Removes event listeners and disposes materials
   */
  public dispose(): void {
    // Remove highlight material
    if (this._highlightMaterial) {
      this._highlightMaterial.dispose();
      this._highlightMaterial = null;
    }
    
    // Dispose original material if stored
    if (this._originalMaterial) {
      if (this._originalMaterial instanceof THREE.Material) {
        this._originalMaterial.dispose();
      } else if (Array.isArray(this._originalMaterial)) {
        this._originalMaterial.forEach(m => m.dispose());
      }
      this._originalMaterial = null;
    }
    
    // Dispose geometry and materials on all meshes
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
}

export default BIM3DObject;
