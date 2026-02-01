/**
 * Layer Manager Service
 * 
 * Central service for managing layers including CRUD operations, hierarchy,
 * visibility/lock controls, and persistence.
 */

import {
  Layer,
  LayerState,
  LayerNode,
  LayerFilter,
  LayerValidationResult,
  DEFAULT_LAYERS,
  generateLayerId,
  createLayer,
  updateLayer,
  cloneLayer,
  buildLayerTree,
  getDescendantLayerIds,
  isLayerVisible,
  isLayerLocked,
  filterLayers,
  getNextOrder,
  validateLayerName,
  validateLayerColor
} from '../models/Layer';

type ChangeListener = () => void;
type LayerChangeCallback = (layer: Layer) => void;

/** Events emitted by LayerManager */
interface LayerManagerEvents {
  onLayerAdded: LayerChangeCallback[];
  onLayerUpdated: LayerChangeCallback[];
  onLayerDeleted: LayerChangeCallback[];
  onLayerVisibilityChanged: ((layerId: string, visible: boolean) => void)[];
  onLayerLockChanged: ((layerId: string, locked: boolean) => void)[];
  onActiveLayerChanged: ((layerId: string) => void)[];
  onLayersChanged: ChangeListener[];
}

/** LocalStorage key for layers */
const LAYERS_STORAGE_KEY = 'bim-layers';
const ACTIVE_LAYER_KEY = 'bim-active-layer';

/**
 * Layer Manager Service
 * 
 * Singleton service for managing all layers in the BIM workbench.
 * Handles layer hierarchy, visibility, locking, and active layer selection.
 */
export class LayerManager {
  private static instance: LayerManager;
  private layers: Map<string, Layer> = new Map();
  private activeLayerId: string | null = null;
  private events: LayerManagerEvents = {
    onLayerAdded: [],
    onLayerUpdated: [],
    onLayerDeleted: [],
    onLayerVisibilityChanged: [],
    onLayerLockChanged: [],
    onActiveLayerChanged: [],
    onLayersChanged: []
  };
  private initialized = false;

  private constructor() {
    this.initializeDefaultLayers();
  }

  /** Get singleton instance */
  public static getInstance(): LayerManager {
    if (!LayerManager.instance) {
      LayerManager.instance = new LayerManager();
    }
    return LayerManager.instance;
  }

  /** Reset singleton instance (useful for testing) */
  public static resetInstance(): void {
    LayerManager.instance = new LayerManager();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /** Initialize with default layers */
  private initializeDefaultLayers(): void {
    if (this.initialized) return;

    // Try to load from localStorage first
    const loaded = this.loadLayers();
    
    if (!loaded) {
      // Create default layers
      DEFAULT_LAYERS.forEach((layerData, index) => {
        const layer: Layer = {
          ...layerData,
          id: layerData.isDefault ? 'layer-0' : generateLayerId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        this.layers.set(layer.id, layer);
      });

      // Set active layer to default (layer-0)
      this.activeLayerId = 'layer-0';
      this.saveLayers();
    }

    this.initialized = true;
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /** Get all layers as array */
  public getAllLayers(): Layer[] {
    return Array.from(this.layers.values()).sort((a, b) => a.order - b.order);
  }

  /** Get layer by ID */
  public getLayerById(id: string): Layer | undefined {
    return this.layers.get(id);
  }

  /** Get layer tree structure */
  public getLayerTree(): LayerNode[] {
    return buildLayerTree(this.getAllLayers());
  }

  /** Get root layers (no parent) */
  public getRootLayers(): Layer[] {
    return this.getAllLayers().filter(l => !l.parentId);
  }

  /** Get child layers of a parent */
  public getChildLayers(parentId: string): Layer[] {
    return this.getAllLayers().filter(l => l.parentId === parentId);
  }

  /** Get default layer */
  public getDefaultLayer(): Layer | undefined {
    return this.getAllLayers().find(l => l.isDefault);
  }

  /** Get active layer */
  public getActiveLayer(): Layer | undefined {
    if (!this.activeLayerId) return undefined;
    return this.layers.get(this.activeLayerId);
  }

  /** Get active layer ID */
  public getActiveLayerId(): string | null {
    return this.activeLayerId;
  }

  /** Check if layer exists */
  public hasLayer(id: string): boolean {
    return this.layers.has(id);
  }

  /** Get visible layers */
  public getVisibleLayers(): Layer[] {
    return this.getAllLayers().filter(l => isLayerVisible(l.id, this.getAllLayers()));
  }

  /** Get hidden layers */
  public getHiddenLayers(): Layer[] {
    return this.getAllLayers().filter(l => !isLayerVisible(l.id, this.getAllLayers()));
  }

  /** Get locked layers */
  public getLockedLayers(): Layer[] {
    return this.getAllLayers().filter(l => isLayerLocked(l.id, this.getAllLayers()));
  }

  /** Filter layers by criteria */
  public filterLayers(filter: LayerFilter): Layer[] {
    return filterLayers(this.getAllLayers(), filter);
  }

  /** Search layers by name */
  public searchLayers(query: string): Layer[] {
    if (!query.trim()) return this.getAllLayers();
    
    const lowerQuery = query.toLowerCase();
    return this.getAllLayers().filter(l => 
      l.name.toLowerCase().includes(lowerQuery)
    );
  }

  /** Get layer count */
  public getLayerCount(): number {
    return this.layers.size;
  }

  /** Check if layer name is available */
  public isNameAvailable(name: string, excludeId?: string): boolean {
    const existing = this.getAllLayers().find(
      l => l.name.toLowerCase() === name.toLowerCase() && l.id !== excludeId
    );
    return !existing;
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /** Create a new layer */
  public createLayer(
    name: string,
    options: Partial<Omit<Layer, 'id' | 'name' | 'createdAt' | 'updatedAt'>> = {}
  ): Layer {
    const validation = validateLayerName(name, this.getAllLayers().map(l => l.name));
    if (!validation.valid) {
      throw new Error(`Invalid layer name: ${validation.errors.join(', ')}`);
    }

    const order = options.order ?? getNextOrder(this.getAllLayers());
    const layer = createLayer(name, { ...options, order });
    
    this.layers.set(layer.id, layer);
    this.saveLayers();
    this.emitLayerAdded(layer);
    this.emitLayersChanged();

    return layer;
  }

  /** Create a child layer */
  public createChildLayer(
    parentId: string,
    name: string,
    options: Partial<Omit<Layer, 'id' | 'name' | 'createdAt' | 'updatedAt' | 'parentId'>> = {}
  ): Layer {
    const parent = this.layers.get(parentId);
    if (!parent) {
      throw new Error(`Parent layer not found: ${parentId}`);
    }

    return this.createLayer(name, { ...options, parentId });
  }

  /** Update layer */
  public updateLayer(id: string, updates: Partial<Omit<Layer, 'id' | 'createdAt'>>): Layer {
    const layer = this.layers.get(id);
    if (!layer) {
      throw new Error(`Layer not found: ${id}`);
    }

    // Validate name if updating
    if (updates.name !== undefined) {
      const validation = validateLayerName(updates.name, this.getAllLayers().map(l => l.name));
      if (!validation.valid) {
        throw new Error(`Invalid layer name: ${validation.errors.join(', ')}`);
      }
    }

    // Validate color if updating
    if (updates.color !== undefined) {
      const validation = validateLayerColor(updates.color);
      if (!validation.valid) {
        throw new Error(`Invalid layer color: ${validation.errors.join(', ')}`);
      }
    }

    // Prevent changing default layer's isDefault status
    if (updates.isDefault !== undefined && layer.isDefault && !updates.isDefault) {
      throw new Error('Cannot change the default layer');
    }

    const updatedLayer = updateLayer(layer, updates);
    this.layers.set(id, updatedLayer);
    this.saveLayers();
    this.emitLayerUpdated(updatedLayer);
    this.emitLayersChanged();

    return updatedLayer;
  }

  /** Rename layer */
  public renameLayer(id: string, newName: string): Layer {
    return this.updateLayer(id, { name: newName });
  }

  /** Delete layer */
  public deleteLayer(id: string, force: boolean = false): void {
    const layer = this.layers.get(id);
    if (!layer) {
      throw new Error(`Layer not found: ${id}`);
    }

    if (layer.isDefault) {
      throw new Error('Cannot delete the default layer');
    }

    // Check if has children
    const children = this.getChildLayers(id);
    if (children.length > 0 && !force) {
      throw new Error(`Cannot delete layer with children. Use force=true to delete with children.`);
    }

    // Delete children if force
    if (force) {
      children.forEach(child => this.deleteLayer(child.id, true));
    } else {
      // Reparent children to grandparent
      children.forEach(child => {
        this.updateLayer(child.id, { parentId: layer.parentId });
      });
    }

    // If active layer, switch to default
    if (this.activeLayerId === id) {
      const defaultLayer = this.getDefaultLayer();
      if (defaultLayer) {
        this.setActiveLayer(defaultLayer.id);
      }
    }

    this.layers.delete(id);
    this.saveLayers();
    this.emitLayerDeleted(layer);
    this.emitLayersChanged();
  }

  /** Duplicate layer */
  public duplicateLayer(id: string, newName: string): Layer {
    const sourceLayer = this.layers.get(id);
    if (!sourceLayer) {
      throw new Error(`Layer not found: ${id}`);
    }

    const duplicated = cloneLayer(sourceLayer, newName);
    duplicated.order = getNextOrder(this.getAllLayers());
    
    this.layers.set(duplicated.id, duplicated);
    this.saveLayers();
    this.emitLayerAdded(duplicated);
    this.emitLayersChanged();

    return duplicated;
  }

  // ============================================================================
  // VISIBILITY & LOCK
  // ============================================================================

  /** Toggle layer visibility */
  public toggleVisibility(id: string): Layer {
    const layer = this.layers.get(id);
    if (!layer) {
      throw new Error(`Layer not found: ${id}`);
    }

    const updated = this.updateLayer(id, { visible: !layer.visible });
    this.emitLayerVisibilityChanged(id, updated.visible);
    
    return updated;
  }

  /** Set layer visibility */
  public setVisibility(id: string, visible: boolean): Layer {
    const layer = this.layers.get(id);
    if (!layer) {
      throw new Error(`Layer not found: ${id}`);
    }

    if (layer.visible === visible) return layer;

    const updated = this.updateLayer(id, { visible });
    this.emitLayerVisibilityChanged(id, visible);
    
    return updated;
  }

  /** Toggle layer lock */
  public toggleLock(id: string): Layer {
    const layer = this.layers.get(id);
    if (!layer) {
      throw new Error(`Layer not found: ${id}`);
    }

    const updated = this.updateLayer(id, { locked: !layer.locked });
    this.emitLayerLockChanged(id, updated.locked);
    
    return updated;
  }

  /** Set layer lock */
  public setLock(id: string, locked: boolean): Layer {
    const layer = this.layers.get(id);
    if (!layer) {
      throw new Error(`Layer not found: ${id}`);
    }

    if (layer.locked === locked) return layer;

    const updated = this.updateLayer(id, { locked });
    this.emitLayerLockChanged(id, locked);
    
    return updated;
  }

  /** Show all layers */
  public showAllLayers(): void {
    this.layers.forEach(layer => {
      if (!layer.visible) {
        this.updateLayer(layer.id, { visible: true });
        this.emitLayerVisibilityChanged(layer.id, true);
      }
    });
  }

  /** Hide all layers except one */
  public isolateLayer(id: string): void {
    this.layers.forEach(layer => {
      const shouldBeVisible = layer.id === id;
      if (layer.visible !== shouldBeVisible) {
        this.updateLayer(layer.id, { visible: shouldBeVisible });
        this.emitLayerVisibilityChanged(layer.id, shouldBeVisible);
      }
    });
  }

  /** Unlock all layers */
  public unlockAllLayers(): void {
    this.layers.forEach(layer => {
      if (layer.locked) {
        this.updateLayer(layer.id, { locked: false });
        this.emitLayerLockChanged(layer.id, false);
      }
    });
  }

  /** Lock all layers */
  public lockAllLayers(): void {
    this.layers.forEach(layer => {
      if (!layer.locked && !layer.isDefault) {
        this.updateLayer(layer.id, { locked: true });
        this.emitLayerLockChanged(layer.id, true);
      }
    });
  }

  // ============================================================================
  // ACTIVE LAYER
  // ============================================================================

  /** Set active layer */
  public setActiveLayer(id: string): void {
    const layer = this.layers.get(id);
    if (!layer) {
      throw new Error(`Layer not found: ${id}`);
    }

    if (layer.locked) {
      throw new Error('Cannot set a locked layer as active');
    }

    this.activeLayerId = id;
    localStorage.setItem(ACTIVE_LAYER_KEY, id);
    this.emitActiveLayerChanged(id);
  }

  // ============================================================================
  // HIERARCHY OPERATIONS
  // ============================================================================

  /** Move layer to new parent */
  public moveLayer(id: string, newParentId: string | undefined): Layer {
    const layer = this.layers.get(id);
    if (!layer) {
      throw new Error(`Layer not found: ${id}`);
    }

    // Prevent circular reference
    if (newParentId) {
      const descendants = getDescendantLayerIds(id, this.getAllLayers());
      if (descendants.includes(newParentId)) {
        throw new Error('Cannot move a layer to its own descendant');
      }
    }

    return this.updateLayer(id, { parentId: newParentId });
  }

  /** Change layer order */
  public setLayerOrder(id: string, newOrder: number): Layer {
    return this.updateLayer(id, { order: newOrder });
  }

  /** Move layer up in order */
  public moveLayerUp(id: string): Layer {
    const layer = this.layers.get(id);
    if (!layer) {
      throw new Error(`Layer not found: ${id}`);
    }

    return this.updateLayer(id, { order: layer.order - 1 });
  }

  /** Move layer down in order */
  public moveLayerDown(id: string): Layer {
    const layer = this.layers.get(id);
    if (!layer) {
      throw new Error(`Layer not found: ${id}`);
    }

    return this.updateLayer(id, { order: layer.order + 1 });
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  /** Save layers to localStorage */
  private saveLayers(): void {
    try {
      const layers = this.getAllLayers();
      localStorage.setItem(LAYERS_STORAGE_KEY, JSON.stringify(layers));
    } catch (error) {
      console.error('Failed to save layers:', error);
    }
  }

  /** Load layers from localStorage */
  private loadLayers(): boolean {
    try {
      const stored = localStorage.getItem(LAYERS_STORAGE_KEY);
      if (stored) {
        const layers: Layer[] = JSON.parse(stored);
        layers.forEach(layer => {
          this.layers.set(layer.id, layer);
        });

        // Load active layer
        const activeId = localStorage.getItem(ACTIVE_LAYER_KEY);
        if (activeId && this.layers.has(activeId)) {
          this.activeLayerId = activeId;
        } else {
          const defaultLayer = this.getDefaultLayer();
          this.activeLayerId = defaultLayer?.id || null;
        }

        return true;
      }
    } catch (error) {
      console.error('Failed to load layers:', error);
    }
    return false;
  }

  /** Export layer state */
  public exportState(): LayerState {
    return {
      visibleLayerIds: this.getVisibleLayers().map(l => l.id),
      lockedLayerIds: this.getLockedLayers().map(l => l.id),
      activeLayerId: this.activeLayerId || '',
      expandedLayerIds: [], // Managed by UI component
    };
  }

  /** Import layer state */
  public importState(state: LayerState): void {
    // Restore visibility
    this.layers.forEach(layer => {
      const shouldBeVisible = state.visibleLayerIds.includes(layer.id);
      if (layer.visible !== shouldBeVisible) {
        this.setVisibility(layer.id, shouldBeVisible);
      }
    });

    // Restore locks
    this.layers.forEach(layer => {
      const shouldBeLocked = state.lockedLayerIds.includes(layer.id);
      if (layer.locked !== shouldBeLocked) {
        this.setLock(layer.id, shouldBeLocked);
      }
    });

    // Restore active layer
    if (state.activeLayerId && this.layers.has(state.activeLayerId)) {
      this.setActiveLayer(state.activeLayerId);
    }
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  public onLayerAdded(callback: LayerChangeCallback): () => void {
    this.events.onLayerAdded.push(callback);
    return () => {
      const index = this.events.onLayerAdded.indexOf(callback);
      if (index > -1) this.events.onLayerAdded.splice(index, 1);
    };
  }

  public onLayerUpdated(callback: LayerChangeCallback): () => void {
    this.events.onLayerUpdated.push(callback);
    return () => {
      const index = this.events.onLayerUpdated.indexOf(callback);
      if (index > -1) this.events.onLayerUpdated.splice(index, 1);
    };
  }

  public onLayerDeleted(callback: LayerChangeCallback): () => void {
    this.events.onLayerDeleted.push(callback);
    return () => {
      const index = this.events.onLayerDeleted.indexOf(callback);
      if (index > -1) this.events.onLayerDeleted.splice(index, 1);
    };
  }

  public onLayerVisibilityChanged(callback: (layerId: string, visible: boolean) => void): () => void {
    this.events.onLayerVisibilityChanged.push(callback);
    return () => {
      const index = this.events.onLayerVisibilityChanged.indexOf(callback);
      if (index > -1) this.events.onLayerVisibilityChanged.splice(index, 1);
    };
  }

  public onLayerLockChanged(callback: (layerId: string, locked: boolean) => void): () => void {
    this.events.onLayerLockChanged.push(callback);
    return () => {
      const index = this.events.onLayerLockChanged.indexOf(callback);
      if (index > -1) this.events.onLayerLockChanged.splice(index, 1);
    };
  }

  public onActiveLayerChanged(callback: (layerId: string) => void): () => void {
    this.events.onActiveLayerChanged.push(callback);
    return () => {
      const index = this.events.onActiveLayerChanged.indexOf(callback);
      if (index > -1) this.events.onActiveLayerChanged.splice(index, 1);
    };
  }

  public onLayersChanged(callback: ChangeListener): () => void {
    this.events.onLayersChanged.push(callback);
    return () => {
      const index = this.events.onLayersChanged.indexOf(callback);
      if (index > -1) this.events.onLayersChanged.splice(index, 1);
    };
  }

  private emitLayerAdded(layer: Layer): void {
    this.events.onLayerAdded.forEach(cb => cb(layer));
  }

  private emitLayerUpdated(layer: Layer): void {
    this.events.onLayerUpdated.forEach(cb => cb(layer));
  }

  private emitLayerDeleted(layer: Layer): void {
    this.events.onLayerDeleted.forEach(cb => cb(layer));
  }

  private emitLayerVisibilityChanged(layerId: string, visible: boolean): void {
    this.events.onLayerVisibilityChanged.forEach(cb => cb(layerId, visible));
  }

  private emitLayerLockChanged(layerId: string, locked: boolean): void {
    this.events.onLayerLockChanged.forEach(cb => cb(layerId, locked));
  }

  private emitActiveLayerChanged(layerId: string): void {
    this.events.onActiveLayerChanged.forEach(cb => cb(layerId));
  }

  private emitLayersChanged(): void {
    this.events.onLayersChanged.forEach(cb => cb());
  }
}

/** Convenience hook for accessing layer manager */
export const layerManager = LayerManager.getInstance();
