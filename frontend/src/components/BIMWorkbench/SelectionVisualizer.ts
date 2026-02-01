/**
 * SelectionVisualizer - Selection Visualization System
 * 
 * Provides visual feedback for selected objects including:
 * - Highlight effects (emissive glow)
 * - Bounding box visualization
 * - Transform controls (translate, rotate, scale)
 * 
 * Uses @react-three/drei for transform controls integration.
 */

import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { BIM3DObject } from './BIM3DObject';
import { SelectionVisuals, TransformEvent } from './types/3d';

/**
 * SelectionVisualizer provides selection feedback and manipulation controls
 * 
 * Features:
 * - Highlight selected objects with emissive glow
 * - Display bounding boxes around selections
 * - Transform controls for translate, rotate, scale operations
 * - Support for single and multi-selection
 */
export class SelectionVisualizer {
  private _scene: THREE.Scene;
  private _camera: THREE.Camera;
  private _renderer: THREE.WebGLRenderer;
  private _domElement: HTMLElement;
  
  private _selectedObjects: Map<string, BIM3DObject> = new Map();
  private _boundingBoxes: Map<string, THREE.BoxHelper> = new Map();
  private _transformControl: TransformControls | null = null;
  private _visuals: SelectionVisuals;
  
  // Event callbacks
  onTransformStart?: () => void;
  onTransformChange?: (object: BIM3DObject) => void;
  onTransformEnd?: (object: BIM3DObject) => void;
  onSelectionChange?: (selectedIds: string[]) => void;

  /**
   * Creates a new SelectionVisualizer
   * @param scene - Three.js scene
   * @param camera - Three.js camera
   * @param renderer - Three.js renderer
   * @param domElement - DOM element for transform controls
   */
  constructor(
    scene: THREE.Scene, 
    camera: THREE.Camera, 
    renderer: THREE.WebGLRenderer,
    domElement: HTMLElement
  ) {
    this._scene = scene;
    this._camera = camera;
    this._renderer = renderer;
    this._domElement = domElement;
    
    this._visuals = {
      highlight: true,
      boundingBox: true,
      transformGizmo: null,
    };
  }

  /**
   * Select an object
   * @param object - BIM object to select
   */
  selectObject(object: BIM3DObject): void {
    if (this._selectedObjects.has(object.id)) {
      return; // Already selected
    }
    
    // Add to selection
    this._selectedObjects.set(object.id, object);
    
    // Apply highlight
    if (this._visuals.highlight) {
      this.showHighlight(object);
    }
    
    // Show bounding box
    if (this._visuals.boundingBox) {
      this.showBoundingBox(object);
    }
    
    // Update transform controls if this is the only selection
    if (this._selectedObjects.size === 1 && this._visuals.transformGizmo) {
      this._attachTransformControl(object);
    } else if (this._selectedObjects.size > 1) {
      // Multi-selection: detach transform controls
      this._detachTransformControl();
      // Show combined bounding box
      this._updateCombinedBoundingBox();
    }
    
    this.onSelectionChange?.(this.getSelectedIds());
  }

  /**
   * Deselect an object
   * @param objectId - ID of object to deselect
   */
  deselectObject(objectId: string): void {
    const object = this._selectedObjects.get(objectId);
    if (!object) return;
    
    // Remove highlight
    this.hideHighlight(object);
    
    // Hide bounding box
    this.hideBoundingBox(objectId);
    
    // Remove from selection
    this._selectedObjects.delete(objectId);
    
    // Update transform controls
    if (this._selectedObjects.size === 0) {
      this._detachTransformControl();
    } else if (this._selectedObjects.size === 1) {
      // Single selection remaining - attach to it
      const remaining = Array.from(this._selectedObjects.values())[0];
      if (this._visuals.transformGizmo) {
        this._attachTransformControl(remaining);
      }
    } else {
      // Multi-selection - update combined bbox
      this._updateCombinedBoundingBox();
    }
    
    this.onSelectionChange?.(this.getSelectedIds());
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    // Hide all highlights and bounding boxes
    this._selectedObjects.forEach((object) => {
      this.hideHighlight(object);
    });
    
    this._boundingBoxes.forEach((box) => {
      this._scene.remove(box);
      box.dispose();
    });
    
    this._detachTransformControl();
    
    this._selectedObjects.clear();
    this._boundingBoxes.clear();
    
    this.onSelectionChange?.([]);
  }

  /**
   * Get all selected objects
   */
  getSelectedObjects(): BIM3DObject[] {
    return Array.from(this._selectedObjects.values());
  }

  /**
   * Get IDs of selected objects
   */
  getSelectedIds(): string[] {
    return Array.from(this._selectedObjects.keys());
  }

  /**
   * Check if an object is selected
   */
  isSelected(objectId: string): boolean {
    return this._selectedObjects.has(objectId);
  }

  /**
   * Apply highlight effect to an object
   * @param object - Object to highlight
   * @param color - Optional highlight color
   */
  showHighlight(object: BIM3DObject, color?: THREE.Color): void {
    object.highlight(color);
  }

  /**
   * Remove highlight from an object
   * @param object - Object to unhighlight
   */
  hideHighlight(object: BIM3DObject): void {
    object.unhighlight();
  }

  /**
   * Show bounding box for an object
   * @param object - Object to show bbox for
   * @param color - Optional bbox color
   */
  showBoundingBox(object: BIM3DObject, color: THREE.Color = new THREE.Color(0x00ffff)): void {
    // Remove existing bbox if any
    this.hideBoundingBox(object.id);
    
    // Create new bounding box helper
    const bbox = new THREE.BoxHelper(object, color);
    bbox.material.depthTest = false;
    bbox.material.transparent = true;
    bbox.renderOrder = 1000; // Render on top
    
    this._scene.add(bbox);
    this._boundingBoxes.set(object.id, bbox);
  }

  /**
   * Hide bounding box for an object
   * @param objectId - ID of object
   */
  hideBoundingBox(objectId: string): void {
    const bbox = this._boundingBoxes.get(objectId);
    if (bbox) {
      this._scene.remove(bbox);
      bbox.geometry.dispose();
      if (Array.isArray(bbox.material)) {
        bbox.material.forEach(m => m.dispose());
      } else {
        bbox.material.dispose();
      }
      this._boundingBoxes.delete(objectId);
    }
  }

  /**
   * Update combined bounding box for multi-selection
   */
  private _updateCombinedBoundingBox(): void {
    if (this._selectedObjects.size < 2) return;
    
    // Create a temporary group to calculate combined bbox
    const group = new THREE.Group();
    this._selectedObjects.forEach((obj) => {
      const clone = obj.clone();
      group.add(clone);
    });
    
    // Create combined bbox
    const combinedBbox = new THREE.BoxHelper(group, 0xffff00); // Yellow for multi-selection
    combinedBbox.material.depthTest = false;
    combinedBbox.material.transparent = true;
    combinedBbox.renderOrder = 1000;
    
    // Store with special key
    const multiKey = '__multi_selection__';
    this.hideBoundingBox(multiKey);
    this._scene.add(combinedBbox);
    this._boundingBoxes.set(multiKey, combinedBbox);
    
    // Clean up temp group
    group.clear();
  }

  /**
   * Enable transform controls
   * @param mode - Transform mode: 'translate', 'rotate', or 'scale'
   */
  enableTransform(mode: 'translate' | 'rotate' | 'scale'): void {
    this._visuals.transformGizmo = mode;
    
    // If single object selected, attach to it
    if (this._selectedObjects.size === 1) {
      const object = Array.from(this._selectedObjects.values())[0];
      this._attachTransformControl(object);
    }
  }

  /**
   * Disable transform controls
   */
  disableTransform(): void {
    this._visuals.transformGizmo = null;
    this._detachTransformControl();
  }

  /**
   * Attach transform controls to an object
   * @param object - Object to control
   */
  private _attachTransformControl(object: BIM3DObject): void {
    this._detachTransformControl();
    
    this._transformControl = new TransformControls(
      this._camera,
      this._domElement
    );
    
    // Set mode
    if (this._visuals.transformGizmo) {
      this._transformControl.setMode(this._visuals.transformGizmo);
    }
    
    // Set space (world vs local)
    this._transformControl.setSpace('world');
    
    // Attach to object
    this._transformControl.attach(object);
    
    // Set up event listeners
    this._transformControl.addEventListener('dragging-changed', (event) => {
      if (event.value) {
        this.onTransformStart?.();
      } else {
        this.onTransformEnd?.(object);
      }
    });
    
    this._transformControl.addEventListener('change', () => {
      // Update bounding box position
      this._updateBoundingBoxPosition(object);
      this.onTransformChange?.(object);
    });
    
    this._scene.add(this._transformControl);
  }

  /**
   * Detach and remove transform controls
   */
  private _detachTransformControl(): void {
    if (this._transformControl) {
      this._transformControl.detach();
      this._scene.remove(this._transformControl);
      this._transformControl.dispose();
      this._transformControl = null;
    }
  }

  /**
   * Update bounding box position to match object transform
   * @param object - Object whose bbox to update
   */
  private _updateBoundingBoxPosition(object: BIM3DObject): void {
    const bbox = this._boundingBoxes.get(object.id);
    if (bbox) {
      bbox.update();
    }
  }

  /**
   * Set snap settings for transform controls
   * @param translateSnap - Translation snap value (0 to disable)
   * @param rotationSnap - Rotation snap in radians (0 to disable)
   * @param scaleSnap - Scale snap value (0 to disable)
   */
  setSnap(
    translateSnap: number = 0,
    rotationSnap: number = 0,
    scaleSnap: number = 0
  ): void {
    if (this._transformControl) {
      this._transformControl.setTranslationSnap(translateSnap || null);
      this._transformControl.setRotationSnap(rotationSnap || null);
      this._transformControl.setScaleSnap(scaleSnap || null);
    }
  }

  /**
   * Set the size of the transform gizmo
   * @param size - Gizmo size (default 1)
   */
  setGizmoSize(size: number): void {
    if (this._transformControl) {
      this._transformControl.setSize(size);
    }
  }

  /**
   * Toggle bounding box visibility
   * @param show - Whether to show bounding boxes
   */
  showBoundingBoxes(show: boolean): void {
    this._visuals.boundingBox = show;
    
    if (show) {
      this._selectedObjects.forEach((object) => {
        this.showBoundingBox(object);
      });
    } else {
      this._boundingBoxes.forEach((bbox, id) => {
        this.hideBoundingBox(id);
      });
    }
  }

  /**
   * Toggle highlight visibility
   * @param show - Whether to show highlights
   */
  showHighlights(show: boolean): void {
    this._visuals.highlight = show;
    
    this._selectedObjects.forEach((object) => {
      if (show) {
        this.showHighlight(object);
      } else {
        this.hideHighlight(object);
      }
    });
  }

  /**
   * Update the visualizer (call in animation loop)
   */
  update(): void {
    // Update all bounding boxes
    this._boundingBoxes.forEach((bbox) => {
      bbox.update();
    });
  }

  /**
   * Set the camera
   * @param camera - New camera
   */
  setCamera(camera: THREE.Camera): void {
    this._camera = camera;
    if (this._transformControl) {
      this._transformControl.camera = camera;
    }
  }

  /**
   * Set the renderer
   * @param renderer - New renderer
   */
  setRenderer(renderer: THREE.WebGLRenderer): void {
    this._renderer = renderer;
  }

  /**
   * Get the current selection count
   */
  getSelectionCount(): number {
    return this._selectedObjects.size;
  }

  /**
   * Check if in multi-selection mode
   */
  isMultiSelection(): boolean {
    return this._selectedObjects.size > 1;
  }

  /**
   * Get transform controls (if active)
   */
  getTransformControl(): TransformControls | null {
    return this._transformControl;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.clearSelection();
    this._detachTransformControl();
  }
}

/**
 * Hook-compatible wrapper for SelectionVisualizer
 * This is a stub for React Three Fiber integration
 */
export class SelectionVisualizerR3F {
  private _visualizer: SelectionVisualizer | null = null;
  private _config: SelectionVisuals = {
    highlight: true,
    boundingBox: true,
    transformGizmo: null,
  };

  /**
   * Initialize the visualizer with scene, camera, renderer
   */
  initialize(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    domElement: HTMLElement
  ): void {
    this._visualizer = new SelectionVisualizer(scene, camera, renderer, domElement);
  }

  /**
   * Get the underlying visualizer
   */
  getVisualizer(): SelectionVisualizer | null {
    return this._visualizer;
  }

  /**
   * Select objects
   */
  select(objects: BIM3DObject[]): void {
    objects.forEach(obj => this._visualizer?.selectObject(obj));
  }

  /**
   * Deselect objects
   */
  deselect(objectIds: string[]): void {
    objectIds.forEach(id => this._visualizer?.deselectObject(id));
  }

  /**
   * Clear selection
   */
  clear(): void {
    this._visualizer?.clearSelection();
  }

  /**
   * Enable transform mode
   */
  setTransformMode(mode: 'translate' | 'rotate' | 'scale' | null): void {
    if (mode) {
      this._visualizer?.enableTransform(mode);
    } else {
      this._visualizer?.disableTransform();
    }
  }

  /**
   * Dispose
   */
  dispose(): void {
    this._visualizer?.dispose();
    this._visualizer = null;
  }
}

export default SelectionVisualizer;
