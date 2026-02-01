/**
 * Layer Model
 * 
 * Defines the layer data structure for organizing BIM objects into hierarchical groups.
 * Layers control visibility, selection, and organization of objects in the scene.
 */

export interface Layer {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Color for UI representation */
  color: string;
  /** Whether layer is visible */
  visible: boolean;
  /** Whether layer is locked (prevents selection) */
  locked: boolean;
  /** Parent layer ID for hierarchy (undefined = root layer) */
  parentId?: string;
  /** Display order (higher = on top) */
  order: number;
  /** Whether this is the default layer */
  isDefault: boolean;
  /** Creation timestamp */
  createdAt: number;
  /** Last modification timestamp */
  updatedAt: number;
}

/** Layer state for persistence */
export interface LayerState {
  visibleLayerIds: string[];
  lockedLayerIds: string[];
  activeLayerId: string;
  expandedLayerIds: string[];
}

/** Layer hierarchy node for tree operations */
export interface LayerNode {
  layer: Layer;
  children: LayerNode[];
  depth: number;
}

/** Layer filter for searching */
export interface LayerFilter {
  nameQuery?: string;
  visible?: boolean;
  locked?: boolean;
  hasParent?: boolean;
}

/** Validation result */
export interface LayerValidationResult {
  valid: boolean;
  errors: string[];
}

/** Default layer colors */
export const DEFAULT_LAYER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

/** Default layers for new projects */
export const DEFAULT_LAYERS: Omit<Layer, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '0',
    color: '#FFFFFF',
    visible: true,
    locked: false,
    order: 0,
    isDefault: true,
  },
  {
    name: 'Structure',
    color: '#3B82F6',
    visible: true,
    locked: false,
    order: 1,
    isDefault: false,
  },
  {
    name: 'Architecture',
    color: '#10B981',
    visible: true,
    locked: false,
    order: 2,
    isDefault: false,
  },
  {
    name: 'MEP',
    color: '#F59E0B',
    visible: true,
    locked: false,
    order: 3,
    isDefault: false,
  },
  {
    name: 'Furniture',
    color: '#8B5CF6',
    visible: true,
    locked: false,
    order: 4,
    isDefault: false,
  },
  {
    name: 'Annotations',
    color: '#EF4444',
    visible: true,
    locked: false,
    order: 5,
    isDefault: false,
  },
];

/** Generate unique layer ID */
export function generateLayerId(): string {
  return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Get a random default color */
export function getDefaultLayerColor(index?: number): string {
  if (index !== undefined) {
    return DEFAULT_LAYER_COLORS[index % DEFAULT_LAYER_COLORS.length];
  }
  return DEFAULT_LAYER_COLORS[Math.floor(Math.random() * DEFAULT_LAYER_COLORS.length)];
}

/** Validate layer name */
export function validateLayerName(name: string, existingNames: string[] = []): LayerValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Layer name is required');
  } else if (name.trim().length > 50) {
    errors.push('Layer name must be 50 characters or less');
  } else if (existingNames.includes(name.trim())) {
    errors.push('Layer name must be unique');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/** Validate layer color */
export function validateLayerColor(color: string): LayerValidationResult {
  const errors: string[] = [];

  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    errors.push('Color must be a valid hex color (e.g., #FF0000)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/** Create a new layer */
export function createLayer(
  name: string,
  options: Partial<Omit<Layer, 'id' | 'name' | 'createdAt' | 'updatedAt'>> = {}
): Layer {
  const now = Date.now();
  
  return {
    id: generateLayerId(),
    name: name.trim(),
    color: options.color || getDefaultLayerColor(),
    visible: options.visible ?? true,
    locked: options.locked ?? false,
    parentId: options.parentId,
    order: options.order ?? 0,
    isDefault: options.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
  };
}

/** Update layer properties */
export function updateLayer(layer: Layer, updates: Partial<Omit<Layer, 'id' | 'createdAt'>>): Layer {
  return {
    ...layer,
    ...updates,
    updatedAt: Date.now(),
  };
}

/** Clone a layer (creates independent copy) */
export function cloneLayer(layer: Layer, newName: string): Layer {
  const now = Date.now();
  
  return {
    ...layer,
    id: generateLayerId(),
    name: newName,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** Build layer hierarchy tree */
export function buildLayerTree(layers: Layer[]): LayerNode[] {
  const layerMap = new Map<string, LayerNode>();
  const rootNodes: LayerNode[] = [];

  // First pass: create nodes
  layers.forEach(layer => {
    layerMap.set(layer.id, {
      layer,
      children: [],
      depth: 0,
    });
  });

  // Second pass: build hierarchy
  layers.forEach(layer => {
    const node = layerMap.get(layer.id)!;
    
    if (layer.parentId && layerMap.has(layer.parentId)) {
      const parentNode = layerMap.get(layer.parentId)!;
      parentNode.children.push(node);
      node.depth = parentNode.depth + 1;
    } else {
      rootNodes.push(node);
    }
  });

  // Sort by order
  const sortNodes = (nodes: LayerNode[]) => {
    nodes.sort((a, b) => a.layer.order - b.layer.order);
    nodes.forEach(node => sortNodes(node.children));
  };
  sortNodes(rootNodes);

  return rootNodes;
}

/** Flatten layer tree back to array */
export function flattenLayerTree(nodes: LayerNode[]): Layer[] {
  const result: Layer[] = [];

  const traverse = (nodeList: LayerNode[]) => {
    nodeList.forEach(node => {
      result.push(node.layer);
      traverse(node.children);
    });
  };

  traverse(nodes);
  return result;
}

/** Get all descendant layer IDs (including self) */
export function getDescendantLayerIds(layerId: string, layers: Layer[]): string[] {
  const result = [layerId];
  const children = layers.filter(l => l.parentId === layerId);
  
  children.forEach(child => {
    result.push(...getDescendantLayerIds(child.id, layers));
  });

  return result;
}

/** Get parent chain (ancestors) for a layer */
export function getLayerAncestors(layerId: string, layers: Layer[]): Layer[] {
  const ancestors: Layer[] = [];
  let current = layers.find(l => l.id === layerId);

  while (current?.parentId) {
    const parent = layers.find(l => l.id === current!.parentId);
    if (parent) {
      ancestors.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }

  return ancestors;
}

/** Check if layer is visible (considers parent visibility) */
export function isLayerVisible(layerId: string, layers: Layer[]): boolean {
  const layer = layers.find(l => l.id === layerId);
  if (!layer) return false;
  if (!layer.visible) return false;

  // Check parent visibility
  if (layer.parentId) {
    return isLayerVisible(layer.parentId, layers);
  }

  return true;
}

/** Check if layer is locked (considers parent lock state) */
export function isLayerLocked(layerId: string, layers: Layer[]): boolean {
  const layer = layers.find(l => l.id === layerId);
  if (!layer) return true;
  if (layer.locked) return true;

  // Check parent lock state
  if (layer.parentId) {
    return isLayerLocked(layer.parentId, layers);
  }

  return false;
}

/** Filter layers by criteria */
export function filterLayers(layers: Layer[], filter: LayerFilter): Layer[] {
  return layers.filter(layer => {
    if (filter.nameQuery && !layer.name.toLowerCase().includes(filter.nameQuery.toLowerCase())) {
      return false;
    }
    if (filter.visible !== undefined && layer.visible !== filter.visible) {
      return false;
    }
    if (filter.locked !== undefined && layer.locked !== filter.locked) {
      return false;
    }
    if (filter.hasParent !== undefined) {
      const hasParent = !!layer.parentId;
      if (hasParent !== filter.hasParent) return false;
    }
    return true;
  });
}

/** Get next available order number */
export function getNextOrder(layers: Layer[]): number {
  if (layers.length === 0) return 0;
  return Math.max(...layers.map(l => l.order)) + 1;
}
