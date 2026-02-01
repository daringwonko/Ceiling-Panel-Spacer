/**
 * Material Library Service
 * 
 * Central service for managing materials including predefined and custom materials.
 * Provides CRUD operations, search/filter, persistence, and event notifications.
 */

import {
  Material,
  MaterialCategory,
  MaterialCreateInput,
  MaterialUpdateInput,
  createMaterial,
  duplicateMaterial,
  validateMaterialProperties
} from '../models/Material';
import { PREDEFINED_MATERIALS } from '../constants/predefinedMaterials';

type ChangeListener = () => void;
type MaterialChangeCallback = (material: Material) => void;

/** Events emitted by MaterialLibrary */
interface MaterialLibraryEvents {
  onMaterialAdded: MaterialChangeCallback[];
  onMaterialUpdated: MaterialChangeCallback[];
  onMaterialDeleted: MaterialChangeCallback[];
  onMaterialsChanged: ChangeListener[];
}

/** Filter options for searching materials */
export interface MaterialFilter {
  category?: MaterialCategory;
  nameQuery?: string;
  isPredefined?: boolean;
  tags?: string[];
}

/** LocalStorage key for custom materials */
const CUSTOM_MATERIALS_STORAGE_KEY = 'bim-custom-materials';

/**
 * Material Library Service
 * 
 * Singleton service for managing the complete material library.
 * Combines predefined materials with user-created custom materials.
 */
export class MaterialLibrary {
  private static instance: MaterialLibrary;
  private customMaterials: Map<string, Material> = new Map();
  private events: MaterialLibraryEvents = {
    onMaterialAdded: [],
    onMaterialUpdated: [],
    onMaterialDeleted: [],
    onMaterialsChanged: []
  };

  private constructor() {
    this.loadCustomMaterials();
  }

  /** Get singleton instance */
  public static getInstance(): MaterialLibrary {
    if (!MaterialLibrary.instance) {
      MaterialLibrary.instance = new MaterialLibrary();
    }
    return MaterialLibrary.instance;
  }

  /** Reset singleton instance (useful for testing) */
  public static resetInstance(): void {
    MaterialLibrary.instance = new MaterialLibrary();
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /** Get all materials (predefined + custom) */
  public getAllMaterials(): Material[] {
    return [...PREDEFINED_MATERIALS, ...this.customMaterials.values()];
  }

  /** Get predefined materials only */
  public getPredefinedMaterials(): Material[] {
    return [...PREDEFINED_MATERIALS];
  }

  /** Get custom materials only */
  public getCustomMaterials(): Material[] {
    return Array.from(this.customMaterials.values());
  }

  /** Get material by ID */
  public getMaterialById(id: string): Material | undefined {
    // Check predefined first
    const predefined = PREDEFINED_MATERIALS.find(m => m.id === id);
    if (predefined) return predefined;

    // Check custom materials
    return this.customMaterials.get(id);
  }

  /** Get materials by category */
  public getMaterialsByCategory(category: MaterialCategory): Material[] {
    const predefined = PREDEFINED_MATERIALS.filter(m => m.category === category);
    const custom = Array.from(this.customMaterials.values()).filter(m => m.category === category);
    return [...predefined, ...custom];
  }

  /** Filter materials by criteria */
  public filterMaterials(filter: MaterialFilter): Material[] {
    let materials = this.getAllMaterials();

    if (filter.category !== undefined) {
      materials = materials.filter(m => m.category === filter.category);
    }

    if (filter.nameQuery) {
      const query = filter.nameQuery.toLowerCase();
      materials = materials.filter(m => m.name.toLowerCase().includes(query));
    }

    if (filter.isPredefined !== undefined) {
      materials = materials.filter(m => m.isPredefined === filter.isPredefined);
    }

    if (filter.tags && filter.tags.length > 0) {
      materials = materials.filter(m => 
        filter.tags!.some(tag => m.tags?.includes(tag))
      );
    }

    return materials;
  }

  /** Search materials by name (partial match) */
  public searchMaterials(query: string): Material[] {
    if (!query.trim()) return this.getAllMaterials();
    
    const lowerQuery = query.toLowerCase();
    return this.getAllMaterials().filter(m => 
      m.name.toLowerCase().includes(lowerQuery) ||
      m.description?.toLowerCase().includes(lowerQuery) ||
      m.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /** Check if material exists */
  public hasMaterial(id: string): boolean {
    return this.getMaterialById(id) !== undefined;
  }

  /** Get total count of materials */
  public getMaterialCount(): number {
    return PREDEFINED_MATERIALS.length + this.customMaterials.size;
  }

  /** Get count by category */
  public getCategoryCounts(): Map<MaterialCategory, number> {
    const counts = new Map<MaterialCategory, number>();
    
    // Initialize with 0
    Object.values(MaterialCategory).forEach(cat => counts.set(cat, 0));
    
    // Count predefined
    PREDEFINED_MATERIALS.forEach(m => {
      counts.set(m.category, (counts.get(m.category) || 0) + 1);
    });
    
    // Count custom
    this.customMaterials.forEach(m => {
      counts.set(m.category, (counts.get(m.category) || 0) + 1);
    });
    
    return counts;
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /** Create a new custom material */
  public createMaterial(input: MaterialCreateInput): Material {
    const validation = validateMaterialProperties(input.properties);
    if (!validation.valid) {
      throw new Error(`Invalid material properties: ${validation.errors.join(', ')}`);
    }

    const id = `mat-custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const material = createMaterial(id, input, false);
    
    this.customMaterials.set(id, material);
    this.saveCustomMaterials();
    this.emitMaterialAdded(material);
    this.emitMaterialsChanged();

    return material;
  }

  /** Update an existing custom material */
  public updateMaterial(id: string, input: MaterialUpdateInput): Material {
    const material = this.customMaterials.get(id);
    if (!material) {
      throw new Error(`Material not found: ${id}`);
    }

    if (material.isPredefined) {
      throw new Error('Cannot modify predefined materials. Duplicate it first.');
    }

    if (input.properties) {
      const validation = validateMaterialProperties(input.properties);
      if (!validation.valid) {
        throw new Error(`Invalid material properties: ${validation.errors.join(', ')}`);
      }
    }

    const updatedMaterial: Material = {
      ...material,
      name: input.name ?? material.name,
      category: input.category ?? material.category,
      properties: input.properties 
        ? { ...material.properties, ...input.properties }
        : material.properties,
      description: input.description ?? material.description,
      updatedAt: Date.now()
    };

    this.customMaterials.set(id, updatedMaterial);
    this.saveCustomMaterials();
    this.emitMaterialUpdated(updatedMaterial);
    this.emitMaterialsChanged();

    return updatedMaterial;
  }

  /** Delete a custom material */
  public deleteMaterial(id: string): void {
    const material = this.customMaterials.get(id);
    if (!material) {
      throw new Error(`Material not found: ${id}`);
    }

    if (material.isPredefined) {
      throw new Error('Cannot delete predefined materials');
    }

    this.customMaterials.delete(id);
    this.saveCustomMaterials();
    this.emitMaterialDeleted(material);
    this.emitMaterialsChanged();
  }

  /** Duplicate an existing material (creates editable copy) */
  public duplicateMaterial(id: string, newName?: string): Material {
    const sourceMaterial = this.getMaterialById(id);
    if (!sourceMaterial) {
      throw new Error(`Material not found: ${id}`);
    }

    const newId = `mat-custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duplicated = duplicateMaterial(sourceMaterial, newId, newName);
    
    this.customMaterials.set(newId, duplicated);
    this.saveCustomMaterials();
    this.emitMaterialAdded(duplicated);
    this.emitMaterialsChanged();

    return duplicated;
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  /** Load custom materials from localStorage */
  private loadCustomMaterials(): void {
    try {
      const stored = localStorage.getItem(CUSTOM_MATERIALS_STORAGE_KEY);
      if (stored) {
        const materials: Material[] = JSON.parse(stored);
        materials.forEach(m => {
          if (!m.isPredefined) {
            this.customMaterials.set(m.id, m);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load custom materials:', error);
    }
  }

  /** Save custom materials to localStorage */
  private saveCustomMaterials(): void {
    try {
      const materials = Array.from(this.customMaterials.values());
      localStorage.setItem(CUSTOM_MATERIALS_STORAGE_KEY, JSON.stringify(materials));
    } catch (error) {
      console.error('Failed to save custom materials:', error);
    }
  }

  /** Clear all custom materials */
  public clearCustomMaterials(): void {
    this.customMaterials.clear();
    this.saveCustomMaterials();
    this.emitMaterialsChanged();
  }

  // ============================================================================
  // IMPORT/EXPORT
  // ============================================================================

  /** Export material library as JSON */
  public exportToJSON(): string {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      customMaterials: Array.from(this.customMaterials.values())
    };
    return JSON.stringify(data, null, 2);
  }

  /** Import materials from JSON */
  public importFromJSON(json: string): { success: number; errors: string[] } {
    const errors: string[] = [];
    let success = 0;

    try {
      const data = JSON.parse(json);
      
      if (!data.customMaterials || !Array.isArray(data.customMaterials)) {
        throw new Error('Invalid import format: missing customMaterials array');
      }

      data.customMaterials.forEach((mat: any) => {
        try {
          if (!mat.id || !mat.name || !mat.category) {
            errors.push(`Invalid material data: missing required fields`);
            return;
          }

          // Generate new ID to avoid conflicts
          const newId = `mat-imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const importedMaterial: Material = {
            ...mat,
            id: newId,
            isPredefined: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };

          this.customMaterials.set(newId, importedMaterial);
          this.emitMaterialAdded(importedMaterial);
          success++;
        } catch (err) {
          errors.push(`Failed to import material: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      });

      if (success > 0) {
        this.saveCustomMaterials();
        this.emitMaterialsChanged();
      }
    } catch (error) {
      errors.push(`Failed to parse import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { success, errors };
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  /** Subscribe to material added events */
  public onMaterialAdded(callback: MaterialChangeCallback): () => void {
    this.events.onMaterialAdded.push(callback);
    return () => {
      const index = this.events.onMaterialAdded.indexOf(callback);
      if (index > -1) {
        this.events.onMaterialAdded.splice(index, 1);
      }
    };
  }

  /** Subscribe to material updated events */
  public onMaterialUpdated(callback: MaterialChangeCallback): () => void {
    this.events.onMaterialUpdated.push(callback);
    return () => {
      const index = this.events.onMaterialUpdated.indexOf(callback);
      if (index > -1) {
        this.events.onMaterialUpdated.splice(index, 1);
      }
    };
  }

  /** Subscribe to material deleted events */
  public onMaterialDeleted(callback: MaterialChangeCallback): () => void {
    this.events.onMaterialDeleted.push(callback);
    return () => {
      const index = this.events.onMaterialDeleted.indexOf(callback);
      if (index > -1) {
        this.events.onMaterialDeleted.splice(index, 1);
      }
    };
  }

  /** Subscribe to any material library changes */
  public onMaterialsChanged(callback: ChangeListener): () => void {
    this.events.onMaterialsChanged.push(callback);
    return () => {
      const index = this.events.onMaterialsChanged.indexOf(callback);
      if (index > -1) {
        this.events.onMaterialsChanged.splice(index, 1);
      }
    };
  }

  private emitMaterialAdded(material: Material): void {
    this.events.onMaterialAdded.forEach(cb => cb(material));
  }

  private emitMaterialUpdated(material: Material): void {
    this.events.onMaterialUpdated.forEach(cb => cb(material));
  }

  private emitMaterialDeleted(material: Material): void {
    this.events.onMaterialDeleted.forEach(cb => cb(material));
  }

  private emitMaterialsChanged(): void {
    this.events.onMaterialsChanged.forEach(cb => cb());
  }
}

/** Convenience hook for accessing material library */
export const materialLibrary = MaterialLibrary.getInstance();
