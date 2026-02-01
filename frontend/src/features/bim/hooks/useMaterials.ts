/**
 * useMaterials Hook
 * 
 * React hook for accessing and managing materials through MaterialLibrary.
 * Provides reactive state management for the material system.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Material,
  MaterialCategory,
  MaterialCreateInput,
  MaterialUpdateInput
} from '../models/Material';
import { materialLibrary, MaterialFilter } from '../services/MaterialLibrary';

interface UseMaterialsReturn {
  /** All materials (predefined + custom) */
  materials: Material[];
  /** Currently selected material ID */
  selectedMaterialId: string | null;
  /** Currently selected material */
  selectedMaterial: Material | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Filter by category */
  filterCategory: MaterialCategory | null;
  /** Search query */
  searchQuery: string;
  /** Set category filter */
  setFilterCategory: (category: MaterialCategory | null) => void;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Select a material by ID */
  selectMaterial: (materialId: string | null) => void;
  /** Create a new material */
  createMaterial: (input: MaterialCreateInput) => Material;
  /** Update an existing material */
  updateMaterial: (id: string, input: MaterialUpdateInput) => Material;
  /** Delete a material */
  deleteMaterial: (id: string) => void;
  /** Duplicate a material */
  duplicateMaterial: (id: string, newName?: string) => Material;
  /** Export materials to JSON */
  exportMaterials: () => string;
  /** Import materials from JSON */
  importMaterials: (json: string) => { success: number; errors: string[] };
  /** Get materials by category */
  getMaterialsByCategory: (category: MaterialCategory) => Material[];
  /** Clear error */
  clearError: () => void;
  /** Library statistics */
  stats: {
    total: number;
    predefined: number;
    custom: number;
    byCategory: Map<MaterialCategory, number>;
  };
}

export function useMaterials(): UseMaterialsReturn {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<MaterialCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to library changes
  useEffect(() => {
    setLoading(true);

    // Initial load
    try {
      setMaterials(materialLibrary.getAllMaterials());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load materials');
    } finally {
      setLoading(false);
    }

    // Subscribe to library changes
    const unsubscribe = materialLibrary.onMaterialsChanged(() => {
      setMaterials(materialLibrary.getAllMaterials());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    const filter: MaterialFilter = {};
    
    if (filterCategory) {
      filter.category = filterCategory;
    }
    
    if (searchQuery.trim()) {
      filter.nameQuery = searchQuery;
    }
    
    return materialLibrary.filterMaterials(filter);
  }, [filterCategory, searchQuery]);

  // Selected material
  const selectedMaterial = useMemo(() => {
    if (!selectedMaterialId) return null;
    return materialLibrary.getMaterialById(selectedMaterialId) || null;
  }, [selectedMaterialId]);

  // Actions
  const selectMaterial = useCallback((materialId: string | null) => {
    setSelectedMaterialId(materialId);
  }, []);

  const createMaterial = useCallback((input: MaterialCreateInput) => {
    try {
      setError(null);
      return materialLibrary.createMaterial(input);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create material';
      setError(message);
      throw err;
    }
  }, []);

  const updateMaterial = useCallback((id: string, input: MaterialUpdateInput) => {
    try {
      setError(null);
      return materialLibrary.updateMaterial(id, input);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update material';
      setError(message);
      throw err;
    }
  }, []);

  const deleteMaterial = useCallback((id: string) => {
    try {
      setError(null);
      materialLibrary.deleteMaterial(id);
      if (selectedMaterialId === id) {
        setSelectedMaterialId(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete material';
      setError(message);
      throw err;
    }
  }, [selectedMaterialId]);

  const duplicateMaterial = useCallback((id: string, newName?: string) => {
    try {
      setError(null);
      return materialLibrary.duplicateMaterial(id, newName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to duplicate material';
      setError(message);
      throw err;
    }
  }, []);

  const exportMaterials = useCallback(() => {
    return materialLibrary.exportToJSON();
  }, []);

  const importMaterials = useCallback((json: string) => {
    try {
      setError(null);
      return materialLibrary.importFromJSON(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import materials';
      setError(message);
      throw err;
    }
  }, []);

  const getMaterialsByCategory = useCallback((category: MaterialCategory) => {
    return materialLibrary.getMaterialsByCategory(category);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Stats
  const stats = useMemo(() => {
    return {
      total: materialLibrary.getMaterialCount(),
      predefined: materialLibrary.getPredefinedMaterials().length,
      custom: materialLibrary.getCustomMaterials().length,
      byCategory: materialLibrary.getCategoryCounts()
    };
  }, [materials]);

  return {
    materials: filteredMaterials,
    selectedMaterialId,
    selectedMaterial,
    loading,
    error,
    filterCategory,
    searchQuery,
    setFilterCategory,
    setSearchQuery,
    selectMaterial,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    duplicateMaterial,
    exportMaterials,
    importMaterials,
    getMaterialsByCategory,
    clearError,
    stats
  };
}
