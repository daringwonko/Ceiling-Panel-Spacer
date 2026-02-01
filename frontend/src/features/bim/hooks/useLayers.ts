/**
 * useLayers Hook
 * 
 * React hook for accessing and managing layers through LayerManager.
 * Provides reactive state management for the layer system.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Layer,
  LayerNode,
  LayerState,
  LayerFilter
} from '../models/Layer';
import { layerManager } from '../services/LayerManager';

interface UseLayersReturn {
  /** All layers as flat array */
  layers: Layer[];
  /** Layer tree structure for hierarchy */
  layerTree: LayerNode[];
  /** Currently active layer */
  activeLayer: Layer | undefined;
  /** Active layer ID */
  activeLayerId: string | null;
  /** Root layers (no parent) */
  rootLayers: Layer[];
  /** Visible layers */
  visibleLayers: Layer[];
  /** Locked layers */
  lockedLayers: Layer[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Create a new layer */
  createLayer: (name: string, options?: Partial<Omit<Layer, 'id' | 'name' | 'createdAt' | 'updatedAt'>>) => Layer;
  /** Create a child layer */
  createChildLayer: (parentId: string, name: string, options?: Partial<Omit<Layer, 'id' | 'name' | 'createdAt' | 'updatedAt' | 'parentId'>>) => Layer;
  /** Update layer properties */
  updateLayer: (id: string, updates: Partial<Omit<Layer, 'id' | 'createdAt'>>) => Layer;
  /** Rename layer */
  renameLayer: (id: string, newName: string) => Layer;
  /** Delete layer */
  deleteLayer: (id: string, force?: boolean) => void;
  /** Duplicate layer */
  duplicateLayer: (id: string, newName: string) => Layer;
  /** Toggle layer visibility */
  toggleVisibility: (id: string) => Layer;
  /** Set layer visibility */
  setVisibility: (id: string, visible: boolean) => Layer;
  /** Toggle layer lock */
  toggleLock: (id: string) => Layer;
  /** Set layer lock */
  setLock: (id: string, locked: boolean) => Layer;
  /** Set active layer */
  setActiveLayer: (id: string) => void;
  /** Move layer to new parent */
  moveLayer: (id: string, newParentId: string | undefined) => Layer;
  /** Change layer order */
  setLayerOrder: (id: string, newOrder: number) => Layer;
  /** Get child layers */
  getChildLayers: (parentId: string) => Layer[];
  /** Show all layers */
  showAllLayers: () => void;
  /** Hide all layers except one */
  isolateLayer: (id: string) => void;
  /** Lock all layers */
  lockAllLayers: () => void;
  /** Unlock all layers */
  unlockAllLayers: () => void;
  /** Export layer state */
  exportState: () => LayerState;
  /** Import layer state */
  importState: (state: LayerState) => void;
  /** Get layer by ID */
  getLayerById: (id: string) => Layer | undefined;
  /** Check if layer name is available */
  isNameAvailable: (name: string, excludeId?: string) => boolean;
  /** Clear error */
  clearError: () => void;
  /** Statistics */
  stats: {
    total: number;
    visible: number;
    hidden: number;
    locked: number;
    unlocked: number;
  };
}

export function useLayers(): UseLayersReturn {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to layer manager changes
  useEffect(() => {
    setLoading(true);

    // Initial load
    try {
      setLayers(layerManager.getAllLayers());
      setActiveLayerId(layerManager.getActiveLayerId());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load layers');
    } finally {
      setLoading(false);
    }

    // Subscribe to changes
    const unsubscribeLayers = layerManager.onLayersChanged(() => {
      setLayers(layerManager.getAllLayers());
    });

    const unsubscribeActive = layerManager.onActiveLayerChanged((id) => {
      setActiveLayerId(id);
    });

    return () => {
      unsubscribeLayers();
      unsubscribeActive();
    };
  }, []);

  // Derived state
  const layerTree = useMemo(() => layerManager.getLayerTree(), [layers]);
  const rootLayers = useMemo(() => layerManager.getRootLayers(), [layers]);
  const visibleLayers = useMemo(() => layerManager.getVisibleLayers(), [layers]);
  const lockedLayers = useMemo(() => layerManager.getLockedLayers(), [layers]);
  const activeLayer = useMemo(() => layerManager.getActiveLayer(), [activeLayerId, layers]);

  // Filtered layers for search
  const filteredLayers = useMemo(() => {
    if (!searchQuery.trim()) return layers;
    return layerManager.searchLayers(searchQuery);
  }, [layers, searchQuery]);

  // Actions
  const createLayer = useCallback((name: string, options?: Partial<Omit<Layer, 'id' | 'name' | 'createdAt' | 'updatedAt'>>) => {
    try {
      setError(null);
      return layerManager.createLayer(name, options);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create layer';
      setError(message);
      throw err;
    }
  }, []);

  const createChildLayer = useCallback((parentId: string, name: string, options?: Partial<Omit<Layer, 'id' | 'name' | 'createdAt' | 'updatedAt' | 'parentId'>>) => {
    try {
      setError(null);
      return layerManager.createChildLayer(parentId, name, options);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create child layer';
      setError(message);
      throw err;
    }
  }, []);

  const updateLayer = useCallback((id: string, updates: Partial<Omit<Layer, 'id' | 'createdAt'>>) => {
    try {
      setError(null);
      return layerManager.updateLayer(id, updates);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update layer';
      setError(message);
      throw err;
    }
  }, []);

  const renameLayer = useCallback((id: string, newName: string) => {
    try {
      setError(null);
      return layerManager.renameLayer(id, newName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rename layer';
      setError(message);
      throw err;
    }
  }, []);

  const deleteLayer = useCallback((id: string, force?: boolean) => {
    try {
      setError(null);
      layerManager.deleteLayer(id, force);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete layer';
      setError(message);
      throw err;
    }
  }, []);

  const duplicateLayer = useCallback((id: string, newName: string) => {
    try {
      setError(null);
      return layerManager.duplicateLayer(id, newName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to duplicate layer';
      setError(message);
      throw err;
    }
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    try {
      setError(null);
      return layerManager.toggleVisibility(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle visibility';
      setError(message);
      throw err;
    }
  }, []);

  const setVisibility = useCallback((id: string, visible: boolean) => {
    try {
      setError(null);
      return layerManager.setVisibility(id, visible);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set visibility';
      setError(message);
      throw err;
    }
  }, []);

  const toggleLock = useCallback((id: string) => {
    try {
      setError(null);
      return layerManager.toggleLock(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle lock';
      setError(message);
      throw err;
    }
  }, []);

  const setLock = useCallback((id: string, locked: boolean) => {
    try {
      setError(null);
      return layerManager.setLock(id, locked);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set lock';
      setError(message);
      throw err;
    }
  }, []);

  const setActiveLayer = useCallback((id: string) => {
    try {
      setError(null);
      layerManager.setActiveLayer(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set active layer';
      setError(message);
      throw err;
    }
  }, []);

  const moveLayer = useCallback((id: string, newParentId: string | undefined) => {
    try {
      setError(null);
      return layerManager.moveLayer(id, newParentId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to move layer';
      setError(message);
      throw err;
    }
  }, []);

  const setLayerOrder = useCallback((id: string, newOrder: number) => {
    try {
      setError(null);
      return layerManager.setLayerOrder(id, newOrder);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set layer order';
      setError(message);
      throw err;
    }
  }, []);

  const getChildLayers = useCallback((parentId: string) => {
    return layerManager.getChildLayers(parentId);
  }, []);

  const showAllLayers = useCallback(() => {
    layerManager.showAllLayers();
  }, []);

  const isolateLayer = useCallback((id: string) => {
    layerManager.isolateLayer(id);
  }, []);

  const lockAllLayers = useCallback(() => {
    layerManager.lockAllLayers();
  }, []);

  const unlockAllLayers = useCallback(() => {
    layerManager.unlockAllLayers();
  }, []);

  const exportState = useCallback(() => {
    return layerManager.exportState();
  }, []);

  const importState = useCallback((state: LayerState) => {
    try {
      setError(null);
      layerManager.importState(state);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import layer state';
      setError(message);
      throw err;
    }
  }, []);

  const getLayerById = useCallback((id: string) => {
    return layerManager.getLayerById(id);
  }, []);

  const isNameAvailable = useCallback((name: string, excludeId?: string) => {
    return layerManager.isNameAvailable(name, excludeId);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Stats
  const stats = useMemo(() => {
    return {
      total: layers.length,
      visible: visibleLayers.length,
      hidden: layers.length - visibleLayers.length,
      locked: lockedLayers.length,
      unlocked: layers.length - lockedLayers.length
    };
  }, [layers, visibleLayers, lockedLayers]);

  return {
    layers: filteredLayers,
    layerTree,
    activeLayer,
    activeLayerId,
    rootLayers,
    visibleLayers,
    lockedLayers,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    createLayer,
    createChildLayer,
    updateLayer,
    renameLayer,
    deleteLayer,
    duplicateLayer,
    toggleVisibility,
    setVisibility,
    toggleLock,
    setLock,
    setActiveLayer,
    moveLayer,
    setLayerOrder,
    getChildLayers,
    showAllLayers,
    isolateLayer,
    lockAllLayers,
    unlockAllLayers,
    exportState,
    importState,
    getLayerById,
    isNameAvailable,
    clearError,
    stats
  };
}
