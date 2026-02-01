import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { BIM3DObject } from './BIM3DObject';

/**
 * SelectionVisuals Configuration
 */
export interface SelectionVisuals {
  /** Whether to show highlight effect */
  highlight: boolean;
  
  /** Whether to show bounding box */
  boundingBox: boolean;
  
  /** Transform gizmo mode */
  transformGizmo: 'translate' | 'rotate' | 'scale' | null;
}

/**
 * SelectionVisualizer
 * 
 * Manages visual feedback for selected objects including:
 * - Highlight effects
 * - Bounding box visualization
 * - Transform controls (translate, rotate, scale)
 */
export class SelectionVisualizer {
  private _scene: THREE.Scene;
  private _camera: THREE.Camera;
  private _renderer: THREE.WebGLRenderer;
  private _selectedObjects: Map<string, BIM3DObject> = new Map();
  private _boundingBoxes: Map<string, THREE.BoxHelper> = new Map();
  private _transformControl: TransformControls | null = null;
  private _config: SelectionVisuals = {
    highlight: true,
    boundingBox: true,
    transformGizmo: null
  };
  
  // Event callbacks
  public onTransformStart?: () => void;
  public onTransformChange?: (object: BIM3DObject) => void;
  public onTransformEnd?: (object: BIM3DObject) => void;
  
  /**
   * Create a new SelectionVisualizer
   * @param scene - Three.js scene
   * @param camera - Three.js camera
   * @param renderer - Three.js renderer
   */
  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ) {
    this._scene = scene;
    this._camera = camera;
    this._renderer = renderer;
    
    this._setupTransformControls();
  }
  
  /**
   * Initialize transform controls
   */
  private _setupTransformControls(): void {
    this._transformControl = new TransformControls(
      this._camera,
      this._renderer.domElement
    );
    
    // Set up transform events
    this._transformControl.addEventListener('dragging-changed', (event) => {
      // Disable orbit controls while transforming
      // Note: This would need to be connected to orbit controls
    });
    
    this._transformControl.addEventListener('change', () => {
      const object = this._transformControl?.object as BIM3DObject;
      if (object && this.onTransformChange) {
        this.onTransformChange(object);
      }
    });
    
    this._transformControl.addEventListener('mouseDown', () => {
      if (this.onTransformStart) {
        this.onTransformStart();
      }
    });
    
    this._transformControl.addEventListener('mouseUp', () => {
      const object = this._transformControl?.object as BIM3DObject;
      if (object && this.onTransformEnd) {
        this.onTransformEnd(object);
      }
    });
    
    this._scene.add(this._transformControl);
  }
  
  /**
   * Select an object
   * @param object - BIM3DObject to select
   */
  public selectObject(object: BIM3DObject): void {
    const id = object.metadata.id;
    
    if (this._selectedObjects.has(id)) return;
    
    this._selectedObjects.set(id, object);
    
    // Apply visual feedback
    if (this._config.highlight) {
      object.select();
    }
    
    if (this._config.boundingBox) {
      this._showBoundingBox(object);
    }
    
    // Update transform controls for single selection
    if (this._selectedObjects.size === 1 && this._config.transformGizmo) {
      this._attachTransformControl(object);
    }
  }
  
  /**
   * Deselect an object
   * @param objectId - ID of object to deselect
   */
  public deselectObject(objectId: string): void {
    const object = this._selectedObjects.get(objectId);
    if (!object) return;
    
    // Remove visual feedback
    if (this._config.highlight) {
      object.deselect();
    }
    
    if (this._config.boundingBox) {
      this._hideBoundingBox(objectId);
    }
    
    this._selectedObjects.delete(objectId);
    
    // Update transform controls
    if (this._selectedObjects.size === 0) {
      this._detachTransformControl();
    } else if (this._selectedObjects.size === 1) {
      // Switch to remaining object
      const remaining = Array.from(this._selectedObjects.values())[0];
      this._attachTransformControl(remaining);
    } else {
      // Multiple selection - detach gizmo
      this._detachTransformControl();
    }
  }
  
  /**
   * Clear all selections
   */
  public clearSelection(): void {
    this._selectedObjects.forEach((object, id) => {
      if (this._config.highlight) {
        object.deselect();
      }
      this._hideBoundingBox(id);
    });
    
    this._selectedObjects.clear();
    this._detachTransformControl();
  }
  
  /**
   * Get all selected objects
   * @returns Array of selected BIM3DObjects
   */
  public getSelectedObjects(): BIM3DObject[] {
    return Array.from(this._selectedObjects.values());
  }
  
  /**
   * Get selected object IDs
   * @returns Array of selected object IDs
   */
  public getSelectedIds(): string[] {
    return Array.from(this._selectedObjects.keys());
  }
  
  /**
   * Check if an object is selected
   * @param objectId - Object ID to check
   * @returns True if selected
   */
  public isSelected(objectId: string): boolean {
    return this._selectedObjects.has(objectId);
  }
  
  /**
   * Show bounding box for an object
   * @param object - Object to show bbox for
   */
  private _showBoundingBox(object: BIM3DObject): void {
    const id = object.metadata.id;
    
    // Remove existing bbox if any
    this._hideBoundingBox(id);
    
    // Create new bbox
    const bbox = new THREE.BoxHelper(object, 0x4a9eff);
    this._scene.add(bbox);
    this._boundingBoxes.set(id, bbox);
  }
  
  /**
   * Hide bounding box for an object
   * @param objectId - Object ID
   */
  private _hideBoundingBox(objectId: string): void {
    const bbox = this._boundingBoxes.get(objectId);
    if (bbox) {
      this._scene.remove(bbox);
      bbox.dispose();
      this._boundingBoxes.delete(objectId);
    }
  }
  
  /**
   * Update all bounding boxes
   * Call this when objects move or resize
   */
  public updateBoundingBoxes(): void {
    this._boundingBoxes.forEach((bbox) => {
      bbox.update();
    });
  }
  
  /**
   * Attach transform controls to an object
   * @param object - Object to attach to
   */
  private _attachTransformControl(object: BIM3DObject): void {
    if (!this._transformControl) return;
    
    this._transformControl.attach(object);
    this._transformControl.visible = true;
    
    // Apply current mode
    if (this._config.transformGizmo) {
      this._transformControl.setMode(this._config.transformGizmo);
    }
  }
  
  /**
   * Detach transform controls
   */
  private _detachTransformControl(): void {
    if (!this._transformControl) return;
    
    this._transformControl.detach();
    this._transformControl.visible = false;
  }
  
  /**
   * Enable transform controls with specified mode
   * @param mode - Transform mode ('translate', 'rotate', 'scale')
   */
  public enableTransform(mode: 'translate' | 'rotate' | 'scale'): void {
    this._config.transformGizmo = mode;
    
    if (!this._transformControl) return;
    
    this._transformControl.setMode(mode);
    
    // Attach to first selected object if single selection
    if (this._selectedObjects.size === 1) {
      const object = Array.from(this._selectedObjects.values())[0];
      this._attachTransformControl(object);
    }
    
    this._transformControl.visible = this._selectedObjects.size > 0;
  }
  
  /**
   * Disable transform controls
   */
  public disableTransform(): void {
    this._config.transformGizmo = null;
    this._detachTransformControl();
  }
  
  /**
   * Set snap values for transform controls
   * @param translateSnap - Translation snap value
   * @param rotateSnap - Rotation snap value (radians)
   * @param scaleSnap - Scale snap value
   */
  public setSnap(
    translateSnap?: number,
    rotateSnap?: number,
    scaleSnap?: number
  ): void {
    if (!this._transformControl) return;
    
    if (translateSnap !== undefined) {
      this._transformControl.setTranslationSnap(translateSnap);
    }
    
    if (rotateSnap !== undefined) {
      this._transformControl.setRotationSnap(rotateSnap);
    }
    
    if (scaleSnap !== undefined) {
      this._transformControl.setScaleSnap(scaleSnap);
    }
  }
  
  /**
   * Show highlight on an object
   * @param object - Object to highlight
   * @param color - Highlight color
   */
  public showHighlight(
    object: BIM3DObject,
    color: THREE.Color = new THREE.Color(0x4a9eff)
  ): void {
    object.showHighlight(color);
  }
  
  /**
   * Hide highlight on an object
   * @param object - Object to unhighlight
   */
  public hideHighlight(object: BIM3DObject): void {
    object.hideHighlight();
  }
  
  /**
   * Update the visualizer
   * Should be called in the animation loop
   */
  public update(): void {
    // Update bounding boxes
    this.updateBoundingBoxes();
  }
  
  /**
   * Configure visual feedback options
   * @param config - Visual configuration
   */
  public configure(config: Partial<SelectionVisuals>): void {
    this._config = { ...this._config, ...config };
    
    // Apply changes to existing selection
    if (config.highlight !== undefined) {
      this._selectedObjects.forEach(object => {
        if (config.highlight) {
          object.select();
        } else {
          object.deselect();
        }
      });
    }
    
    if (config.boundingBox !== undefined) {
      this._selectedObjects.forEach(object => {
        if (config.boundingBox) {
          this._showBoundingBox(object);
        } else {
          this._hideBoundingBox(object.metadata.id);
        }
      });
    }
    
    if (config.transformGizmo !== undefined) {
      if (config.transformGizmo) {
        this.enableTransform(config.transformGizmo);
      } else {
        this.disableTransform();
      }
    }
  }
  
  /**
   * Get current configuration
   * @returns Current visual configuration
   */
  public getConfiguration(): SelectionVisuals {
    return { ...this._config };
  }
  
  /**
   * Dispose of all resources
   */
  public dispose(): void {
    // Clear selection
    this.clearSelection();
    
    // Dispose transform controls
    if (this._transformControl) {
      this._scene.remove(this._transformControl);
      this._transformControl.dispose();
      this._transformControl = null;
    }
    
    // Clear references
    this._selectedObjects.clear();
    this._boundingBoxes.clear();
  }
}

export default SelectionVisualizer;
