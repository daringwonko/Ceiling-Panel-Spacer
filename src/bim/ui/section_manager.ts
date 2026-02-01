/**
 * Section Manager
 * 
 * Singleton manager for all section planes in the BIM system.
 * Provides CRUD operations and manages active section state.
 */

import { SectionPlaneClass } from '../section_plane';
import { SectionClipper, createSectionClipper } from '../section_clipper';
import { SectionType, Point3D, Vector3D, SectionPlane } from '../types';

/**
 * Section plane change event data
 */
export interface SectionChangeEvent {
  type: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
  section: SectionPlaneClass;
  previousActiveId?: string;
}

/**
 * Section manager callback types
 */
export type SectionChangeCallback = (event: SectionChangeEvent) => void;
export type SectionListChangeCallback = (sections: SectionPlaneClass[]) => void;

/**
 * SectionManager singleton for managing section planes
 */
export class SectionManager {
  private static instance: SectionManager | null = null;
  private sections: Map<string, SectionPlaneClass> = new Map();
  private clipper: SectionClipper;
  private activeSectionId: string | null = null;
  
  // Event callbacks
  private changeCallbacks: Set<SectionChangeCallback> = new Set();
  private listChangeCallbacks: Set<SectionListChangeCallback> = new Set();

  // Private constructor for singleton pattern
  private constructor() {
    this.clipper = createSectionClipper();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SectionManager {
    if (!SectionManager.instance) {
      SectionManager.instance = new SectionManager();
    }
    return SectionManager.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    if (SectionManager.instance) {
      SectionManager.instance.sections.clear();
      SectionManager.instance.activeSectionId = null;
    }
    SectionManager.instance = null;
  }

  /**
   * Create a new section plane
   */
  createSection(
    name: string,
    type: SectionType,
    position: Point3D,
    normal: Vector3D,
    width: number = 2000,
    height: number = 3000
  ): SectionPlaneClass {
    const section = new SectionPlaneClass({
      name,
      type,
      position,
      normal,
      width,
      height,
      isActive: false,
    });

    this.sections.set(section.id, section);
    this.notifySectionChange({ type: 'created', section });
    this.notifyListChange();

    return section;
  }

  /**
   * Create a section with auto-generated name
   */
  createSectionWithAutoName(
    type: SectionType,
    position: Point3D,
    normal: Vector3D,
    width: number = 2000,
    height: number = 3000
  ): SectionPlaneClass {
    const existingNames = Array.from(this.sections.values()).map(s => s.name);
    const name = SectionPlaneClass.generateName(existingNames);
    return this.createSection(name, type, position, normal, width, height);
  }

  /**
   * Delete a section plane
   */
  deleteSection(sectionId: string): boolean {
    const section = this.sections.get(sectionId);
    if (!section) return false;

    // Deactivate if active
    if (this.activeSectionId === sectionId) {
      this.deactivateSection();
    }

    this.sections.delete(sectionId);
    this.notifySectionChange({ type: 'deleted', section });
    this.notifyListChange();

    return true;
  }

  /**
   * Activate a section plane for clipping
   */
  activateSection(sectionId: string): boolean {
    const section = this.sections.get(sectionId);
    if (!section) return false;

    const previousActiveId = this.activeSectionId;

    // Deactivate previous active section
    if (previousActiveId) {
      const previous = this.sections.get(previousActiveId);
      if (previous) {
        previous.deactivate();
        this.notifySectionChange({ type: 'deactivated', section: previous });
      }
    }

    // Activate new section
    section.activate();
    this.activeSectionId = sectionId;
    this.clipper.activate(section);
    
    this.notifySectionChange({ 
      type: 'activated', 
      section, 
      previousActiveId: previousActiveId || undefined 
    });

    return true;
  }

  /**
   * Deactivate the currently active section
   */
  deactivateSection(): boolean {
    if (!this.activeSectionId) return false;

    const section = this.sections.get(this.activeSectionId);
    if (section) {
      section.deactivate();
      this.clipper.deactivate();
      this.notifySectionChange({ type: 'deactivated', section });
      this.activeSectionId = null;
      return true;
    }

    return false;
  }

  /**
   * Get a section by ID
   */
  getSection(sectionId: string): SectionPlaneClass | undefined {
    return this.sections.get(sectionId);
  }

  /**
   * Get all sections
   */
  getAllSections(): SectionPlaneClass[] {
    return Array.from(this.sections.values());
  }

  /**
   * Get the currently active section
   */
  getActiveSection(): SectionPlaneClass | null {
    if (this.activeSectionId) {
      return this.sections.get(this.activeSectionId) || null;
    }
    return null;
  }

  /**
   * Get active section ID
   */
  getActiveSectionId(): string | null {
    return this.activeSectionId;
  }

  /**
   * Check if any section is active
   */
  isAnyActive(): boolean {
    return this.activeSectionId !== null;
  }

  /**
   * Update section properties
   */
  updateSection(
    sectionId: string, 
    updates: Partial<{ name: string; position: Point3D; normal: Vector3D; width: number; height: number }>
  ): boolean {
    const section = this.sections.get(sectionId);
    if (!section) return false;

    // Apply updates
    if (updates.name !== undefined) {
      section.name = updates.name;
    }
    if (updates.position !== undefined) {
      section.moveTo(updates.position);
    }
    if (updates.normal !== undefined) {
      section.normal = updates.normal;
    }
    if (updates.width !== undefined || updates.height !== undefined) {
      const width = updates.width ?? section.width;
      const height = updates.height ?? section.height;
      section.setSize(width, height);
    }

    this.notifySectionChange({ type: 'updated', section });
    this.notifyListChange();

    // If this is the active section, update clipping
    if (this.activeSectionId === sectionId) {
      this.clipper.deactivate();
      this.clipper.activate(section);
    }

    return true;
  }

  /**
   * Rename a section
   */
  renameSection(sectionId: string, newName: string): boolean {
    return this.updateSection(sectionId, { name: newName });
  }

  /**
   * Flip section direction
   */
  flipSectionDirection(sectionId: string): boolean {
    const section = this.sections.get(sectionId);
    if (!section) return false;

    section.flipDirection();
    this.notifySectionChange({ type: 'updated', section });

    // Update clipping if active
    if (this.activeSectionId === sectionId) {
      this.clipper.deactivate();
      this.clipper.activate(section);
    }

    return true;
  }

  /**
   * Toggle section active state
   */
  toggleSection(sectionId: string): boolean {
    const section = this.sections.get(sectionId);
    if (!section) return false;

    if (section.isActive) {
      return this.deactivateSection() !== false;
    } else {
      return this.activateSection(sectionId);
    }
  }

  /**
   * Get sections by type
   */
  getSectionsByType(type: SectionType): SectionPlaneClass[] {
    return Array.from(this.sections.values()).filter(s => s.type === type);
  }

  /**
   * Get section count
   */
  getSectionCount(): number {
    return this.sections.size;
  }

  /**
   * Get active section count (should be 0 or 1)
   */
  getActiveSectionCount(): number {
    return this.activeSectionId ? 1 : 0;
  }

  /**
   * Clear all sections
   */
  clearAll(): void {
    this.deactivateSection();
    this.sections.clear();
    this.activeSectionId = null;
    this.notifyListChange();
  }

  /**
   * Export all sections to JSON
   */
  toJSON(): SectionPlane[] {
    return Array.from(this.sections.values()).map(s => s.toDict());
  }

  /**
   * Import sections from JSON
   */
  fromJSON(data: SectionPlane[]): void {
    this.clearAll();
    
    for (const sectionData of data) {
      const section = SectionPlaneClass.fromDict(sectionData);
      this.sections.set(section.id, section);
    }

    this.notifyListChange();
  }

  /**
   * Subscribe to section change events
   */
  onSectionChange(callback: SectionChangeCallback): () => void {
    this.changeCallbacks.add(callback);
    return () => {
      this.changeCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to section list changes
   */
  onListChange(callback: SectionListChangeCallback): () => void {
    this.listChangeCallbacks.add(callback);
    return () => {
      this.listChangeCallbacks.delete(callback);
    };
  }

  /**
   * Notify section change callbacks
   */
  private notifySectionChange(event: SectionChangeEvent): void {
    for (const callback of this.changeCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Section change callback error:', error);
      }
    }
  }

  /**
   * Notify list change callbacks
   */
  private notifyListChange(): void {
    const sections = this.getAllSections();
    for (const callback of this.listChangeCallbacks) {
      try {
        callback(sections);
      } catch (error) {
        console.error('Section list change callback error:', error);
      }
    }
  }

  /**
   * Get clipper instance
   */
  getClipper(): SectionClipper {
    return this.clipper;
  }
}

/**
 * Get SectionManager singleton instance
 */
export function getSectionManager(): SectionManager {
  return SectionManager.getInstance();
}

/**
 * Create and initialize section manager
 */
export function createSectionManager(): SectionManager {
  return SectionManager.getInstance();
}

/**
 * Default export
 */
export default SectionManager;
