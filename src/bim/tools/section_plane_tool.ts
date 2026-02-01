/**
 * Section Plane Tool
 * 
 * Interactive tool for creating and manipulating section planes
 * with click-to-set-position and drag-to-set-orientation functionality.
 */

import { SectionPlaneClass } from '../section_plane';
import { SectionClipper } from '../section_clipper';
import { SectionType, Point3D, Vector3D } from '../types';

/**
 * Tool state for section plane creation
 */
export type SectionPlaneToolState = 'idle' | 'placing' | 'dragging' | 'complete';

/**
 * Mouse event handler types
 */
export interface MouseEventData {
  clientX: number;
  clientY: number;
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
}

/**
 * Preview data for section plane during creation
 */
export interface SectionPlanePreview {
  position: Point3D | null;
  normal: Vector3D | null;
  width: number;
  height: number;
  type: SectionType;
  isValid: boolean;
}

/**
 * SectionPlaneTool class for interactive section plane creation
 */
export class SectionPlaneTool {
  private state: SectionPlaneToolState = 'idle';
  private clipper: SectionClipper;
  private activeSection: SectionPlaneClass | null = null;
  private preview: SectionPlanePreview;
  private startPosition: Point3D | null = null;
  private currentPosition: Point3D | null = null;
  
  // Callbacks for UI integration
  private onPreviewUpdate: ((preview: SectionPlanePreview) => void) | null = null;
  private onSectionComplete: ((section: SectionPlaneClass) => void) | null = null;
  private onStateChange: ((state: SectionPlaneToolState) => void) | null = null;

  // Default dimensions
  private defaultWidth: number = 2000;
  private defaultHeight: number = 3000;

  constructor(clipper: SectionClipper) {
    this.clipper = clipper;
    this.preview = this.getEmptyPreview();
  }

  /**
   * Get empty preview state
   */
  private getEmptyPreview(): SectionPlanePreview {
    return {
      position: null,
      normal: null,
      width: this.defaultWidth,
      height: this.defaultHeight,
      type: SectionType.SECTION,
      isValid: false,
    };
  }

  /**
   * Start section plane creation mode
   */
  startPlacing(type: SectionType = SectionType.SECTION): void {
    this.state = 'placing';
    this.activeSection = null;
    this.preview = {
      ...this.getEmptyPreview(),
      type,
      isValid: false,
    };
    this.startPosition = null;
    this.currentPosition = null;
    this.notifyStateChange();
  }

  /**
   * Handle mouse down event
   */
  onMouseDown(event: MouseEventData, position: Point3D | null): void {
    if (this.state !== 'placing') return;

    if (position) {
      this.startPosition = { ...position };
      this.currentPosition = { ...position };
      
      // Set default normal based on type
      let normal: Vector3D;
      switch (this.preview.type) {
        case SectionType.PLAN:
          normal = { x: 0, y: -1, z: 0 };
          break;
        case SectionType.ELEVATION:
          normal = { x: 1, y: 0, z: 0 };
          break;
        default:
          normal = { x: 0, y: 0, z: 1 };
      }
      
      this.preview.position = { ...position };
      this.preview.normal = normal;
      this.preview.isValid = true;
      
      this.state = 'dragging';
      this.notifyPreviewUpdate();
      this.notifyStateChange();
    }
  }

  /**
   * Handle mouse move event for drag operation
   */
  onMouseMove(event: MouseEventData, position: Point3D | null): void {
    if (this.state !== 'dragging' || !this.startPosition) return;

    if (position) {
      this.currentPosition = { ...position };
      
      // Calculate orientation from drag direction
      const delta = {
        x: position.x - this.startPosition.x,
        y: position.y - this.startPosition.y,
        z: position.z - this.startPosition.z,
      };
      
      // Update normal based on drag direction
      const dragLength = Math.sqrt(delta.x * delta.x + delta.y * delta.y + delta.z * delta.z);
      if (dragLength > 10) { // Minimum drag distance
        // Use drag direction as normal (perpendicular to view direction)
        this.preview.normal = {
          x: delta.x / dragLength,
          y: delta.y / dragLength,
          z: delta.z / dragLength,
        };
      }
      
      this.notifyPreviewUpdate();
    }
  }

  /**
   * Handle mouse up event to complete placement
   */
  onMouseUp(event: MouseEventData): SectionPlaneClass | null {
    if (this.state !== 'dragging') return null;

    if (this.preview.position && this.preview.normal && this.startPosition) {
      // Create the section plane
      const section = new SectionPlaneClass({
        name: SectionPlaneClass.generateName(this.getExistingNames()),
        type: this.preview.type,
        position: this.preview.position,
        normal: this.preview.normal,
        width: this.preview.width,
        height: this.preview.height,
        isActive: false,
      });

      this.activeSection = section;
      this.state = 'complete';
      this.notifyStateChange();

      // Notify completion
      if (this.onSectionComplete) {
        this.onSectionComplete(section);
      }

      // Reset to idle after a short delay
      setTimeout(() => {
        if (this.state === 'complete') {
          this.reset();
        }
      }, 100);

      return section;
    }

    this.reset();
    return null;
  }

  /**
   * Get list of existing section names
   */
  private getExistingNames(): string[] {
    const sections = this.clipper.getActiveSectionPlane();
    return sections ? [sections.name] : [];
  }

  /**
   * Cancel current operation
   */
  cancel(): void {
    this.reset();
  }

  /**
   * Reset tool to idle state
   */
  reset(): void {
    this.state = 'idle';
    this.activeSection = null;
    this.preview = this.getEmptyPreview();
    this.startPosition = null;
    this.currentPosition = null;
    this.notifyStateChange();
  }

  /**
   * Set preview dimensions
   */
  setDimensions(width: number, height: number): void {
    this.defaultWidth = width;
    this.defaultHeight = height;
    this.preview.width = width;
    this.preview.height = height;
    this.notifyPreviewUpdate();
  }

  /**
   * Set section plane type
   */
  setType(type: SectionType): void {
    if (this.state === 'idle') {
      this.preview.type = type;
      
      // Set default dimensions for type
      switch (type) {
        case SectionType.PLAN:
          this.defaultWidth = 2000;
          this.defaultHeight = 2000;
          break;
        case SectionType.ELEVATION:
          this.defaultWidth = 2000;
          this.defaultHeight = 3000;
          break;
        default:
          this.defaultWidth = 2000;
          this.defaultHeight = 3000;
      }
      
      this.preview.width = this.defaultWidth;
      this.preview.height = this.defaultHeight;
      this.notifyPreviewUpdate();
    }
  }

  /**
   * Flip section direction
   */
  flipDirection(): void {
    if (this.preview.normal) {
      this.preview.normal = {
        x: -this.preview.normal.x,
        y: -this.preview.normal.y,
        z: -this.preview.normal.z,
      };
      this.notifyPreviewUpdate();
    }
  }

  /**
   * Get current tool state
   */
  getState(): SectionPlaneToolState {
    return this.state;
  }

  /**
   * Get current preview data
   */
  getPreview(): SectionPlanePreview {
    return { ...this.preview };
  }

  /**
   * Get the active section plane
   */
  getActiveSection(): SectionPlaneClass | null {
    return this.activeSection;
  }

  /**
   * Check if tool is in creating state
   */
  isCreating(): boolean {
    return this.state === 'placing' || this.state === 'dragging';
  }

  /**
   * Set callback for preview updates
   */
  onPreviewUpdated(callback: (preview: SectionPlanePreview) => void): void {
    this.onPreviewUpdate = callback;
  }

  /**
   * Set callback for section completion
   */
  onSectionCompleted(callback: (section: SectionPlaneClass) => void): void {
    this.onSectionComplete = callback;
  }

  /**
   * Set callback for state changes
   */
  onStateChanged(callback: (state: SectionPlaneToolState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Notify preview update callback
   */
  private notifyPreviewUpdate(): void {
    if (this.onPreviewUpdate) {
      this.onPreviewUpdate(this.getPreview());
    }
  }

  /**
   * Notify state change callback
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  /**
   * Get visual representation data for preview rendering
   */
  getPreviewVisualRepresentation(): {
    position: Point3D | null;
    normal: Vector3D | null;
    width: number;
    height: number;
    color: number;
    opacity: number;
    showDimensionLabels: boolean;
  } | null {
    if (!this.preview.isValid || !this.preview.position) {
      return null;
    }

    return {
      position: this.preview.position,
      normal: this.preview.normal,
      width: this.preview.width,
      height: this.preview.height,
      color: 0x4287f5, // Blue
      opacity: 0.5,
      showDimensionLabels: this.state === 'dragging',
    };
  }

  /**
   * Get keyboard shortcuts help text
   */
  getHelpText(): string {
    return `
Section Plane Tool
------------------
Click: Set center position
Drag: Set orientation
Enter: Complete placement
Escape: Cancel
F: Flip direction
S: Switch to section type
P: Switch to plan type
E: Switch to elevation type
    `.trim();
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyDown(key: string): boolean {
    switch (key.toLowerCase()) {
      case 'escape':
        this.cancel();
        return true;
      case 'enter':
      case ' ':
        if (this.state === 'dragging') {
          this.onMouseUp({ clientX: 0, clientY: 0, button: 0, shiftKey: false, ctrlKey: false });
          return true;
        }
        return false;
      case 'f':
        this.flipDirection();
        return true;
      case 's':
        this.setType(SectionType.SECTION);
        return true;
      case 'p':
        this.setType(SectionType.PLAN);
        return true;
      case 'e':
        this.setType(SectionType.ELEVATION);
        return true;
      default:
        return false;
    }
  }
}

/**
 * Create a section plane tool instance
 */
export function createSectionPlaneTool(clipper: SectionClipper): SectionPlaneTool {
  return new SectionPlaneTool(clipper);
}

/**
 * Default export
 */
export default SectionPlaneTool;
