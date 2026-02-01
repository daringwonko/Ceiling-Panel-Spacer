/**
 * BIM Object Manager Service
 * 
 * Central service for managing BIM objects with material and layer integration.
 * Coordinates object lifecycle with material assignment and layer organization.
 */

import { BIMObject } from '../../../stores/useBIMStore';
import { materialLibrary } from './MaterialLibrary';
import { layerManager } from './LayerManager';

type ObjectChangeCallback = (object: BIMObject) => void;
type ObjectBatchChangeCallback = (objects: BIMObject[]) => void;

/** Events emitted by BIMObjectManager */
interface BIMObjectManagerEvents {
  onObjectAdded: ObjectChangeCallback[];
  onObjectUpdated: ObjectChangeCallback[];
  onObjectDeleted: ObjectChangeCallback[];
  onMaterialAssigned: ((objectId: string, materialId: string | null) => void)[];
  onLayerAssigned: ((objectId: string, layerId: string) => void)[];
  onObjectsChanged: (() => void)[];
}

/** Object filter for searching */
export interface ObjectFilter {
  type?: BIMObject['type'];
  layerId?: string;
  materialId?: string | null;
  nameQuery?: string;
}

/**
 * BIM Object Manager Service
 * 
 * Manages BIM objects and their relationships with materials and layers.
 * Provides CRUD operations, batch operations, and event notifications.
 */
export class BIMObjectManager {
  private static instance: BIMObjectManager;
  private objects: Map<string, BIMObject> = new Map();
  private events: BIMObjectManagerEvents = {
    onObjectAdded: [],
    onObjectUpdated: [],
    onObjectDeleted: [],
    onMaterialAssigned: [],
    onLayerAssigned: [],
    onObjectsChanged: []
  };

  private constructor() {
    // Subscribe to layer visibility changes
    layerManager.onLayerVisibilityChanged((layerId, visible) => {
      this.handleLayerVisibilityChange(layerId, visible);
    });

    // Subscribe to layer lock changes
    layerManager.onLayerLockChanged((layerId, locked) => {
      this.handleLayerLockChange(layerId, locked);
    });
  }

  /** Get singleton instance */
  public static getInstance(): BIMObjectManager {
    if (!BIMObjectManager.instance) {
      BIMObjectManager.instance = new BIMObjectManager();
    }
    return BIMObjectManager.instance;
  }

  /** Reset singleton instance (useful for testing) */
  public static resetInstance(): void {
    BIMObjectManager.instance = new BIMObjectManager();
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /** Get all objects */
  public getAllObjects(): BIMObject[] {
    return Array.from(this.objects.values());
  }

  /** Get object by ID */
  public getObjectById(id: string): BIMObject | undefined {
    return this.objects.get(id);
  }

  /** Get objects by IDs */
  public getObjectsByIds(ids: string[]): BIMObject[] {
    return ids.map(id => this.objects.get(id)).filter((obj): obj is BIMObject => obj !== undefined);
  }

  /** Get objects by type */
  public getObjectsByType(type: BIMObject['type']): BIMObject[] {
    return this.getAllObjects().filter(obj => obj.type === type);
  }

  /** Get objects by layer */
  public getObjectsByLayer(layerId: string): BIMObject[] {
    return this.getAllObjects().filter(obj => obj.layer === layerId);
  }

  /** Get objects by material */
  public getObjectsByMaterial(materialId: string | null): BIMObject[] {
    return this.getAllObjects().filter(obj => obj.material === materialId);
  }

  /** Get objects with no material assigned */
  public getObjectsWithoutMaterial(): BIMObject[] {
    return this.getAllObjects().filter(obj => !obj.material);
  }

  /** Filter objects by criteria */
  public filterObjects(filter: ObjectFilter): BIMObject[] {
    return this.getAllObjects().filter(obj => {
      if (filter.type && obj.type !== filter.type) return false;
      if (filter.layerId && obj.layer !== filter.layerId) return false;
      if (filter.materialId !== undefined && obj.material !== filter.materialId) return false;
      if (filter.nameQuery) {
        const query = filter.nameQuery.toLowerCase();
        if (!obj.name.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }

  /** Search objects by name */
  public searchObjects(query: string): BIMObject[] {
    if (!query.trim()) return this.getAllObjects();
    
    const lowerQuery = query.toLowerCase();
    return this.getAllObjects().filter(obj => 
      obj.name.toLowerCase().includes(lowerQuery) ||
      obj.type.toLowerCase().includes(lowerQuery)
    );
  }

  /** Get object count */
  public getObjectCount(): number {
    return this.objects.size;
  }

  /** Get count by layer */
  public getObjectCountByLayer(layerId: string): number {
    return this.getObjectsByLayer(layerId).length;
  }

  /** Get object counts for all layers */
  public getObjectCountsByLayer(): Map<string, number> {
    const counts = new Map<string, number>();
    
    this.objects.forEach(obj => {
      const layerId = obj.layer || '0';
      counts.set(layerId, (counts.get(layerId) || 0) + 1);
    });

    return counts;
  }

  /** Check if object exists */
  public hasObject(id: string): boolean {
    return this.objects.has(id);
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /** Add a new object */
  public addObject(object: BIMObject): BIMObject {
    // Ensure object has default layer if none specified
    const objectWithDefaults: BIMObject = {
      ...object,
      layer: object.layer || layerManager.getActiveLayerId() || '0',
      material: object.material || null
    };

    this.objects.set(object.id, objectWithDefaults);
    this.emitObjectAdded(objectWithDefaults);
    this.emitObjectsChanged();

    return objectWithDefaults;
  }

  /** Add multiple objects */
  public addObjects(objects: BIMObject[]): BIMObject[] {
    const added = objects.map(obj => this.addObject(obj));
    return added;
  }

  /** Update object */
  public updateObject(id: string, updates: Partial<BIMObject>): BIMObject {
    const object = this.objects.get(id);
    if (!object) {
      throw new Error(`Object not found: ${id}`);
    }

    const updatedObject = { ...object, ...updates };
    this.objects.set(id, updatedObject);
    this.emitObjectUpdated(updatedObject);
    this.emitObjectsChanged();

    return updatedObject;
  }

  /** Delete object */
  public deleteObject(id: string): void {
    const object = this.objects.get(id);
    if (!object) {
      throw new Error(`Object not found: ${id}`);
    }

    this.objects.delete(id);
    this.emitObjectDeleted(object);
    this.emitObjectsChanged();
  }

  /** Delete multiple objects */
  public deleteObjects(ids: string[]): void {
    ids.forEach(id => this.deleteObject(id));
  }

  // ============================================================================
  // MATERIAL OPERATIONS
  // ============================================================================

  /** Assign material to object */
  public assignMaterial(objectId: string, materialId: string | null): BIMObject {
    const object = this.objects.get(objectId);
    if (!object) {
      throw new Error(`Object not found: ${objectId}`);
    }

    // Validate material exists if not null
    if (materialId && !materialLibrary.getMaterialById(materialId)) {
      throw new Error(`Material not found: ${materialId}`);
    }

    const updated = this.updateObject(objectId, { material: materialId });
    this.emitMaterialAssigned(objectId, materialId);

    return updated;
  }

  /** Assign material to multiple objects (batch) */
  public assignMaterialToMultiple(objectIds: string[], materialId: string | null): BIMObject[] {
    return objectIds.map(id => this.assignMaterial(id, materialId));
  }

  /** Remove material from object */
  public removeMaterial(objectId: string): BIMObject {
    return this.assignMaterial(objectId, null);
  }

  /** Get material for object */
  public getObjectMaterial(objectId: string): string | null {
    const object = this.objects.get(objectId);
    return object?.material || null;
  }

  /** Get objects using a specific material */
  public getObjectsUsingMaterial(materialId: string): BIMObject[] {
    return this.getObjectsByMaterial(materialId);
  }

  /** Update all objects when material changes */
  public updateObjectsForMaterialChange(materialId: string): void {
    const objects = this.getObjectsByMaterial(materialId);
    objects.forEach(obj => {
      this.emitObjectUpdated(obj);
    });
  }

  // ============================================================================
  // LAYER OPERATIONS
  // ============================================================================

  /** Assign object to layer */
  public assignToLayer(objectId: string, layerId: string): BIMObject {
    const object = this.objects.get(objectId);
    if (!object) {
      throw new Error(`Object not found: ${objectId}`);
    }

    // Validate layer exists
    if (!layerManager.getLayerById(layerId)) {
      throw new Error(`Layer not found: ${layerId}`);
    }

    const updated = this.updateObject(objectId, { layer: layerId });
    this.emitLayerAssigned(objectId, layerId);

    return updated;
  }

  /** Assign multiple objects to layer (batch) */
  public assignMultipleToLayer(objectIds: string[], layerId: string): BIMObject[] {
    return objectIds.map(id => this.assignToLayer(id, layerId));
  }

  /** Move all objects from one layer to another */
  public moveAllObjectsToLayer(fromLayerId: string, toLayerId: string): number {
    const objects = this.getObjectsByLayer(fromLayerId);
    objects.forEach(obj => {
      this.assignToLayer(obj.id, toLayerId);
    });
    return objects.length;
  }

  /** Get layer for object */
  public getObjectLayer(objectId: string): string | null {
    const object = this.objects.get(objectId);
    return object?.layer || null;
  }

  /** Check if object is in visible layer */
  public isObjectVisible(objectId: string): boolean {
    const object = this.objects.get(objectId);
    if (!object) return false;

    const layerId = object.layer || '0';
    return layerManager.getAllLayers().some(l => l.id === layerId && l.visible);
  }

  /** Check if object is in locked layer */
  public isObjectLocked(objectId: string): boolean {
    const object = this.objects.get(objectId);
    if (!object) return true;

    const layerId = object.layer || '0';
    const layer = layerManager.getLayerById(layerId);
    return layer?.locked || false;
  }

  /** Handle layer visibility change */
  private handleLayerVisibilityChange(layerId: string, visible: boolean): void {
    const objects = this.getObjectsByLayer(layerId);
    objects.forEach(obj => {
      this.emitObjectUpdated(obj);
    });
  }

  /** Handle layer lock change */
  private handleLayerLockChange(layerId: string, locked: boolean): void {
    const objects = this.getObjectsByLayer(layerId);
    objects.forEach(obj => {
      this.emitObjectUpdated(obj);
    });
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /** Duplicate object */
  public duplicateObject(objectId: string, newName?: string): BIMObject {
    const object = this.objects.get(objectId);
    if (!object) {
      throw new Error(`Object not found: ${objectId}`);
    }

    const duplicated: BIMObject = {
      ...object,
      id: `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName || `${object.name} (Copy)`,
      isSelected: false
    };

    return this.addObject(duplicated);
  }

  /** Duplicate multiple objects */
  public duplicateObjects(objectIds: string[]): BIMObject[] {
    return objectIds.map(id => this.duplicateObject(id));
  }

  // ============================================================================
  // IMPORT/EXPORT
  // ============================================================================

  /** Export all objects as JSON */
  public exportToJSON(): string {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      objects: this.getAllObjects()
    };
    return JSON.stringify(data, null, 2);
  }

  /** Import objects from JSON */
  public importFromJSON(json: string): { success: number; errors: string[] } {
    const errors: string[] = [];
    let success = 0;

    try {
      const data = JSON.parse(json);
      
      if (!data.objects || !Array.isArray(data.objects)) {
        throw new Error('Invalid import format: missing objects array');
      }

      data.objects.forEach((obj: any) => {
        try {
          if (!obj.id || !obj.name || !obj.type) {
            errors.push(`Invalid object data: missing required fields`);
            return;
          }

          // Generate new ID to avoid conflicts
          const newId = `obj-imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const importedObject: BIMObject = {
            ...obj,
            id: newId,
            isSelected: false
          };

          this.addObject(importedObject);
          success++;
        } catch (err) {
          errors.push(`Failed to import object: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      });
    } catch (error) {
      errors.push(`Failed to parse import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { success, errors };
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  public onObjectAdded(callback: ObjectChangeCallback): () => void {
    this.events.onObjectAdded.push(callback);
    return () => {
      const index = this.events.onObjectAdded.indexOf(callback);
      if (index > -1) this.events.onObjectAdded.splice(index, 1);
    };
  }

  public onObjectUpdated(callback: ObjectChangeCallback): () => void {
    this.events.onObjectUpdated.push(callback);
    return () => {
      const index = this.events.onObjectUpdated.indexOf(callback);
      if (index > -1) this.events.onObjectUpdated.splice(index, 1);
    };
  }

  public onObjectDeleted(callback: ObjectChangeCallback): () => void {
    this.events.onObjectDeleted.push(callback);
    return () => {
      const index = this.events.onObjectDeleted.indexOf(callback);
      if (index > -1) this.events.onObjectDeleted.splice(index, 1);
    };
  }

  public onMaterialAssigned(callback: (objectId: string, materialId: string | null) => void): () => void {
    this.events.onMaterialAssigned.push(callback);
    return () => {
      const index = this.events.onMaterialAssigned.indexOf(callback);
      if (index > -1) this.events.onMaterialAssigned.splice(index, 1);
    };
  }

  public onLayerAssigned(callback: (objectId: string, layerId: string) => void): () => void {
    this.events.onLayerAssigned.push(callback);
    return () => {
      const index = this.events.onLayerAssigned.indexOf(callback);
      if (index > -1) this.events.onLayerAssigned.splice(index, 1);
    };
  }

  public onObjectsChanged(callback: () => void): () => void {
    this.events.onObjectsChanged.push(callback);
    return () => {
      const index = this.events.onObjectsChanged.indexOf(callback);
      if (index > -1) this.events.onObjectsChanged.splice(index, 1);
    };
  }

  private emitObjectAdded(object: BIMObject): void {
    this.events.onObjectAdded.forEach(cb => cb(object));
  }

  private emitObjectUpdated(object: BIMObject): void {
    this.events.onObjectUpdated.forEach(cb => cb(object));
  }

  private emitObjectDeleted(object: BIMObject): void {
    this.events.onObjectDeleted.forEach(cb => cb(object));
  }

  private emitMaterialAssigned(objectId: string, materialId: string | null): void {
    this.events.onMaterialAssigned.forEach(cb => cb(objectId, materialId));
  }

  private emitLayerAssigned(objectId: string, layerId: string): void {
    this.events.onLayerAssigned.forEach(cb => cb(objectId, layerId));
  }

  private emitObjectsChanged(): void {
    this.events.onObjectsChanged.forEach(cb => cb());
  }
}

/** Convenience singleton instance */
export const bimObjectManager = BIMObjectManager.getInstance();
