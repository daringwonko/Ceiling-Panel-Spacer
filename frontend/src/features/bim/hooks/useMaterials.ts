/**
 * useMaterials Hook
 * React hook for accessing and managing materials
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Material,
  MaterialCategory,
  MaterialCreateInput,
  MaterialUpdateInput
} from '../models/Material';
import { getMaterialLibrary } from '../services/MaterialLibrary';

interface UseMaterialsReturn {
  /** All materials (predefined + custom) */
  materials: Material[];
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
  /** Select a material */
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
  importMaterials: (json: string) => { imported: number; errors: string[] };
  /** Get materials by category */
  getMaterialsByCategory: (category: MaterialCategory) => Material[];
  /** Library statistics */
  stats: {
    total: number;
    predefined: number;
    custom: number;
    byCategory: Record<MaterialCategory, number>;
  };
}

export function useMaterials(): UseMaterialsReturn {
  const [library] = useState(() => getMaterialLibrary());
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<MaterialCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to library changes
  useEffect(() => {
    setLoading(true);

    // Subscribe to changes
    const unsubscribeChanges = library.onChange((updatedMaterials) => {
      setMaterials(updatedMaterials);
      setLoading(false);
    });

    // Subscribe to selection changes
    const unsubscribeSelect = library.onSelect((material) => {
      setSelectedMaterial(material);
    });

    // Initial load
    try {
      setMaterials(library.getAllMaterials());
      setSelectedMaterial(library.getSelectedMaterial());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load materials');
    } finally {
      setLoading(false);
    }

    return () => {
      unsubscribeChanges();
      unsubscribeSelect();
    };
  }, [library]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    let result = materials;

    // Apply category filter
    if (filterCategory) {
      result = result.filter(m => m.category === filterCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        m =>
          m.name.toLowerCase().includes(query) ||
          m.category.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [materials, filterCategory, searchQuery]);

  // Actions
  const selectMaterial = useCallback(
    (materialId: string | null) => {
      library.setSelectedMaterial(materialId);
    },
    [library]
  );

  const createMaterial = useCallback(
    (input: MaterialCreateInput) => {
      try {
        return library.createMaterial(input);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create material');
        throw err;
      }
    },
    [library]
  );

  const updateMaterial = useCallback(
    (id: string, input: MaterialUpdateInput) => {
      try {
        return library.updateMaterial(id, input);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update material');
        throw err;
      }
    },
    [library]
  );

  const deleteMaterial = useCallback(
    (id: string) => {
      try {
        library.deleteMaterial(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete material');
        throw err;
      }
    },
    [library]
  );

  const duplicateMaterial = useCallback(
    (id: string, newName?: string) => {
      try {
        return library.duplicateMaterial(id, newName);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to duplicate material');
        throw err;
      }
    },
    [library]
  );

  const exportMaterials = useCallback(() => {
    return library.exportToJSON();
  }, [library]);

  const importMaterials = useCallback(
    (json: string) => {
      try {
        return library.importFromJSON(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import materials');
        throw err;
      }
    },
    [library]
  );

  const getMaterialsByCategory = useCallback(
    (category: MaterialCategory) => {
      return library.getMaterialsByCategory(category);
    },
    [library]
  );

  // Stats
  const stats = useMemo(() => {
    return library.getStats();
  }, [library, materials]);

  return {
    materials: filteredMaterials,
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
    stats
  };
}
