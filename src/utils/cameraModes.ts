/**
 * Camera Modes Utility
 * 
 * Defines and manages different camera view modes for the BIM workbench.
 * Supports perspective, orthographic, and predefined view angles.
 */

import * as THREE from 'three';

// =============================================================================
// Types and Interfaces
// =============================================================================

export type ViewMode = 
  | 'perspective'
  | 'orthographic'
  | 'top'
  | 'bottom'
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'iso'
  | 'custom';

export interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  zoom: number;
  fov: number;
  near: number;
  far: number;
}

export interface ViewPreset {
  id: ViewMode;
  name: string;
  description: string;
  icon: string;
  cameraState: CameraState;
  isOrthographic: boolean;
}

export interface SmoothTransitionOptions {
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  onComplete?: () => void;
}

// =============================================================================
// Default Camera Settings
// =============================================================================

const DEFAULT_PERSPECTIVE_CAMERA: Partial<CameraState> = {
  fov: 50,
  near: 0.1,
  far: 10000,
  zoom: 1
};

const DEFAULT_ORTHOGRAPHIC_CAMERA: Partial<CameraState> = {
  fov: 45,
  near: 0.1,
  far: 10000,
  zoom: 1
};

// =============================================================================
// View Presets
// =============================================================================

export const VIEW_PRESETS: ViewPreset[] = [
  {
    id: 'perspective',
    name: 'Perspective',
    description: '3D perspective view with depth perception',
    icon: 'view-3d',
    cameraState: {
      position: new THREE.Vector3(100, 100, 100),
      target: new THREE.Vector3(0, 0, 0),
      zoom: 1,
      ...DEFAULT_PERSPECTIVE_CAMERA
    },
    isOrthographic: false
  },
  {
    id: 'orthographic',
    name: 'Orthographic',
    description: 'Parallel projection without perspective distortion',
    icon: 'view-array',
    cameraState: {
      position: new THREE.Vector3(100, 100, 100),
      target: new THREE.Vector3(0, 0, 0),
      zoom: 1,
      ...DEFAULT_ORTHOGRAPHIC_CAMERA
    },
    isOrthographic: true
  },
  {
    id: 'top',
    name: 'Top View',
    description: 'Plan view from above (Z-axis)',
    icon: 'view-top',
    cameraState: {
      position: new THREE.Vector3(0, 500, 0.1),
      target: new THREE.Vector3(0, 0, 0),
      zoom: 1,
      ...DEFAULT_ORTHOGRAPHIC_CAMERA
    },
    isOrthographic: true
  },
  {
    id: 'bottom',
    name: 'Bottom View',
    description: 'View from below (looking up)',
    icon: 'view-bottom',
    cameraState: {
      position: new THREE.Vector3(0, -500, 0.1),
      target: new THREE.Vector3(0, 0, 0),
      zoom: 1,
      ...DEFAULT_ORTHOGRAPHIC_CAMERA
    },
    isOrthographic: true
  },
  {
    id: 'front',
    name: 'Front View',
    description: 'View from the front (Y-axis)',
    icon: 'view-front',
    cameraState: {
      position: new THREE.Vector3(0, 100, 500),
      target: new THREE.Vector3(0, 100, 0),
      zoom: 1,
      ...DEFAULT_ORTHOGRAPHIC_CAMERA
    },
    isOrthographic: true
  },
  {
    id: 'back',
    name: 'Back View',
    description: 'View from the back',
    icon: 'view-back',
    cameraState: {
      position: new THREE.Vector3(0, 100, -500),
      target: new THREE.Vector3(0, 100, 0),
      zoom: 1,
      ...DEFAULT_ORTHOGRAPHIC_CAMERA
    },
    isOrthographic: true
  },
  {
    id: 'left',
    name: 'Left View',
    description: 'View from the left (X-axis)',
    icon: 'view-left',
    cameraState: {
      position: new THREE.Vector3(-500, 100, 0),
      target: new THREE.Vector3(0, 100, 0),
      zoom: 1,
      ...DEFAULT_ORTHOGRAPHIC_CAMERA
    },
    isOrthographic: true
  },
  {
    id: 'right',
    name: 'Right View',
    description: 'View from the right (X-axis)',
    icon: 'view-right',
    cameraState: {
      position: new THREE.Vector3(500, 100, 0),
      target: new THREE.Vector3(0, 100, 0),
      zoom: 1,
      ...DEFAULT_ORTHOGRAPHIC_CAMERA
    },
    isOrthographic: true
  },
  {
    id: 'iso',
    name: 'Isometric',
    description: 'Isometric view at 45° angles',
    icon: 'view-isometric',
    cameraState: {
      position: new THREE.Vector3(200, 200, 200),
      target: new THREE.Vector3(0, 0, 0),
      zoom: 1,
      ...DEFAULT_ORTHOGRAPHIC_CAMERA
    },
    isOrthographic: true
  }
];

// =============================================================================
// Camera State Utilities
// =============================================================================

/**
 * Get a view preset by ID
 */
export function getViewPreset(mode: ViewMode): ViewPreset | undefined {
  return VIEW_PRESETS.find(preset => preset.id === mode);
}

/**
 * Get all available view presets
 */
export function getAllViewPresets(): ViewPreset[] {
  return VIEW_PRESETS;
}

/**
 * Get preset categories for UI organization
 */
export function getViewPresetCategories(): { name: string; presets: ViewPreset[] }[] {
  return [
    {
      name: '3D Views',
      presets: VIEW_PRESETS.filter(p => ['perspective', 'orthographic', 'iso'].includes(p.id))
    },
    {
      name: 'Plan Views',
      presets: VIEW_PRESETS.filter(p => ['top', 'bottom'].includes(p.id))
    },
    {
      name: 'Elevation Views',
      presets: VIEW_PRESETS.filter(p => ['front', 'back', 'left', 'right'].includes(p.id))
    }
  ];
}

/**
 * Create a copy of camera state
 */
export function cloneCameraState(state: CameraState): CameraState {
  return {
    position: state.position.clone(),
    target: state.target.clone(),
    zoom: state.zoom,
    fov: state.fov,
    near: state.near,
    far: state.far
  };
}

/**
 * Interpolate between two camera states
 */
export function interpolateCameraState(
  from: CameraState,
  to: CameraState,
  t: number
): CameraState {
  const easedT = easeInOut(t);
  
  return {
    position: new THREE.Vector3().lerpVectors(from.position, to.position, easedT),
    target: new THREE.Vector3().lerpVectors(from.target, to.target, easedT),
    zoom: from.zoom + (to.zoom - from.zoom) * easedT,
    fov: from.fov + (to.fov - from.fov) * easedT,
    near: from.near,
    far: from.far
  };
}

// =============================================================================
// Easing Functions
// =============================================================================

export function linear(t: number): number {
  return t;
}

export function easeIn(t: number): number {
  return t * t;
}

export function easeOut(t: number): number {
  return t * (2 - t);
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function getEasingFunction(type: SmoothTransitionOptions['easing']): (t: number) => number {
  switch (type) {
    case 'linear':
      return linear;
    case 'easeIn':
      return easeIn;
    case 'easeOut':
      return easeOut;
    case 'easeInOut':
      return easeInOut;
    default:
      return easeInOut;
  }
}

// =============================================================================
// Saved Views Management
// =============================================================================

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  cameraState: CameraState;
  isOrthographic: boolean;
  createdAt: Date;
  thumbnail?: string;
}

const SAVED_VIEWS_STORAGE_KEY = 'bim_saved_views';

/**
 * Get all saved views from localStorage
 */
export function getSavedViews(): SavedView[] {
  try {
    const stored = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
    if (!stored) return [];
    
    const views = JSON.parse(stored);
    return views.map((view: any) => ({
      ...view,
      createdAt: new Date(view.createdAt)
    }));
  } catch (error) {
    console.error('Failed to load saved views:', error);
    return [];
  }
}

/**
 * Save a view to localStorage
 */
export function saveView(view: Omit<SavedView, 'id' | 'createdAt'>): SavedView {
  const savedViews = getSavedViews();
  
  const newView: SavedView = {
    ...view,
    id: generateViewId(),
    createdAt: new Date()
  };
  
  savedViews.push(newView);
  
  try {
    localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(savedViews));
  } catch (error) {
    console.error('Failed to save view:', error);
  }
  
  return newView;
}

/**
 * Delete a saved view
 */
export function deleteView(viewId: string): boolean {
  const savedViews = getSavedViews();
  const filtered = savedViews.filter(v => v.id !== viewId);
  
  if (filtered.length === savedViews.length) {
    return false;
  }
  
  try {
    localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete view:', error);
    return false;
  }
}

/**
 * Update a saved view
 */
export function updateView(viewId: string, updates: Partial<Omit<SavedView, 'id' | 'createdAt'>>): boolean {
  const savedViews = getSavedViews();
  const index = savedViews.findIndex(v => v.id === viewId);
  
  if (index === -1) {
    return false;
  }
  
  savedViews[index] = {
    ...savedViews[index],
    ...updates
  };
  
  try {
    localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(savedViews));
    return true;
  } catch (error) {
    console.error('Failed to update view:', error);
    return false;
  }
}

/**
 * Generate a unique view ID
 */
function generateViewId(): string {
  return `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// Camera Mode Helper Functions
// =============================================================================

/**
 * Check if a view mode is an orthographic view
 */
export function isOrthographic(mode: ViewMode): boolean {
  const preset = getViewPreset(mode);
  return preset?.isOrthographic ?? false;
}

/**
 * Check if a view mode is a 3D view
 */
export function is3DView(mode: ViewMode): boolean {
  return ['perspective', 'orthographic', 'iso'].includes(mode);
}

/**
 * Check if a view mode is a plan view
 */
export function isPlanView(mode: ViewMode): boolean {
  return ['top', 'bottom'].includes(mode);
}

/**
 * Check if a view mode is an elevation view
 */
export function isElevationView(mode: ViewMode): boolean {
  return ['front', 'back', 'left', 'right'].includes(mode);
}

/**
 * Get the opposite view (e.g., front → back)
 */
export function getOppositeView(mode: ViewMode): ViewMode | null {
  const opposites: Record<ViewMode, ViewMode | null> = {
    top: 'bottom',
    bottom: 'top',
    front: 'back',
    back: 'front',
    left: 'right',
    right: 'left',
    perspective: null,
    orthographic: null,
    iso: null,
    custom: null
  };
  
  return opposites[mode] ?? null;
}

/**
 * Rotate a view 90 degrees clockwise
 */
export function rotateViewClockwise(mode: ViewMode): ViewMode {
  const rotation: Record<ViewMode, ViewMode> = {
    top: 'left',      // Top view rotated clockwise shows right side
    bottom: 'right',
    front: 'left',    // Front view rotated clockwise shows right side
    back: 'right',
    left: 'bottom',   // Left view rotated clockwise shows bottom
    right: 'top',
    perspective: 'perspective',
    orthographic: 'orthographic',
    iso: 'iso',
    custom: 'custom'
  };
  
  return rotation[mode] ?? mode;
}

/**
 * Rotate a view 90 degrees counter-clockwise
 */
export function rotateViewCounterClockwise(mode: ViewMode): ViewMode {
  const rotation: Record<ViewMode, ViewMode> = {
    top: 'right',
    bottom: 'left',
    front: 'right',
    back: 'left',
    left: 'top',
    right: 'bottom',
    perspective: 'perspective',
    orthographic: 'orthographic',
    iso: 'iso',
    custom: 'custom'
  };
  
  return rotation[mode] ?? mode;
}

// =============================================================================
// Export
// =============================================================================

export default {
  ViewMode,
  CameraState,
  ViewPreset,
  SmoothTransitionOptions,
  VIEW_PRESETS,
  getViewPreset,
  getAllViewPresets,
  getViewPresetCategories,
  cloneCameraState,
  interpolateCameraState,
  getEasingFunction,
  getSavedViews,
  saveView,
  deleteView,
  updateView,
  isOrthographic,
  is3DView,
  isPlanView,
  isElevationView,
  getOppositeView,
  rotateViewClockwise,
  rotateViewCounterClockwise
};
