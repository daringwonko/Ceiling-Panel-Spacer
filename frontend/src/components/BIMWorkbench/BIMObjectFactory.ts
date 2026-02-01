/**
 * BIMObjectFactory - Factory for Creating BIM Objects
 * 
 * Creates typed BIM objects with appropriate geometry, materials, and metadata.
 * Supports walls, doors, windows, floors, ceilings, columns, beams, and custom objects.
 */

import * as THREE from 'three';
import { BIM3DObject } from './BIM3DObject';
import { WorkingPlaneSystem } from './WorkingPlaneSystem';
import { 
  BIMObjectType, 
  BIMObjectCreateOptions, 
  BIMObjectMetadata,
  IFC_TYPE_MAP
} from './types/3d';

/**
 * Factory for creating BIM objects with proper geometry and metadata
 * 
 * Creates objects positioned on the working plane with appropriate
 * IFC types, materials, and default properties.
 */
export class BIMObjectFactory {
  private _workingPlane: WorkingPlaneSystem;
  private _idCounter: number = 0;
  private _materials: Map<string, THREE.Material> = new Map();

  /**
   * Creates a new BIMObjectFactory
   * @param workingPlane - Working plane system for object positioning
   */
  constructor(workingPlane: WorkingPlaneSystem) {
    this._workingPlane = workingPlane;
    this._initializeDefaultMaterials();
  }

  /**
   * Initialize default materials for BIM objects
   */
  private _initializeDefaultMaterials(): void {
    // Wall material - concrete gray
    this._materials.set('wall', new THREE.MeshStandardMaterial({
      color: 0x999999,
      roughness: 0.9,
      metalness: 0.0,
    }));

    // Door material - wood brown
    this._materials.set('door', new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.6,
      metalness: 0.1,
    }));

    // Window material - glass blue with transparency
    this._materials.set('window', new THREE.MeshPhysicalMaterial({
      color: 0xaaccff,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      transparent: true,
      opacity: 0.3,
    }));

    // Floor material - light beige
    this._materials.set('floor', new THREE.MeshStandardMaterial({
      color: 0xE8DCC4,
      roughness: 0.8,
      metalness: 0.0,
    }));

    // Ceiling material - white
    this._materials.set('ceiling', new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.9,
      metalness: 0.0,
    }));

    // Column material - concrete gray
    this._materials.set('column', new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.0,
    }));

    // Beam material - steel gray
    this._materials.set('beam', new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.3,
    }));

    // Roof material - dark gray
    this._materials.set('roof', new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.8,
      metalness: 0.1,
    }));

    // Default material
    this._materials.set('default', new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.5,
      metalness: 0.2,
    }));
  }

  /**
   * Generate a unique ID for a BIM object
   * @param type - Object type
   * @returns Unique ID string
   */
  private _generateId(type: BIMObjectType): string {
    this._idCounter++;
    const timestamp = Date.now().toString(36);
    return `${type}_${timestamp}_${this._idCounter}`;
  }

  /**
   * Get or create a material
   * @param materialRef - Material reference or undefined
   * @returns Three.js material
   */
  private _getMaterial(materialRef?: string): THREE.Material {
    if (materialRef && this._materials.has(materialRef)) {
      return this._materials.get(materialRef)!;
    }
    return this._materials.get('default')!;
  }

  /**
   * Position object on the working plane
   * @param object - Object to position
   * @param position - Desired position
   */
  private _positionOnPlane(object: BIM3DObject, position?: THREE.Vector3): void {
    if (position) {
      // Project position onto working plane
      const projected = this._workingPlane.projectPoint(position);
      object.position.copy(projected);
    } else {
      // Place at plane origin
      object.position.copy(this._workingPlane.getOrigin());
    }
  }

  /**
   * Main creation method - creates any type of BIM object
   * @param options - Object creation options
   * @returns Created BIM3DObject
   */
  create(options: BIMObjectCreateOptions): BIM3DObject {
    const geometry = this._createGeometry(options.type, options);
    const material = this._getMaterial(options.material);
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Create metadata
    const metadata: BIMObjectMetadata = {
      ifcType: IFC_TYPE_MAP[options.type],
      material: options.material || options.type,
      level: options.level || 'Level 0',
      id: this._generateId(options.type),
      properties: options.properties || {},
      name: options.name || `${options.type.charAt(0).toUpperCase() + options.type.slice(1)}`,
    };
    
    // Create BIM object
    const bimObject = new BIM3DObject(metadata);
    bimObject.add(mesh);
    
    // Apply transforms
    this._positionOnPlane(bimObject, options.position);
    
    if (options.rotation) {
      bimObject.rotation.copy(options.rotation);
    }
    
    if (options.scale) {
      bimObject.scale.copy(options.scale);
    }
    
    return bimObject;
  }

  /**
   * Create geometry based on object type
   * @param type - BIM object type
   * @param options - Creation options
   * @returns Three.js geometry
   */
  private _createGeometry(type: BIMObjectType, options: BIMObjectCreateOptions): THREE.BufferGeometry {
    switch (type) {
      case 'wall':
        return this._createWallGeometry(options);
      case 'door':
        return this._createDoorGeometry(options);
      case 'window':
        return this._createWindowGeometry(options);
      case 'floor':
        return this._createFloorGeometry(options);
      case 'ceiling':
        return this._createCeilingGeometry(options);
      case 'column':
        return this._createColumnGeometry(options);
      case 'beam':
        return this._createBeamGeometry(options);
      case 'roof':
        return this._createRoofGeometry(options);
      case 'stair':
        return this._createStairGeometry(options);
      case 'railing':
        return this._createRailingGeometry(options);
      case 'custom':
      default:
        return new THREE.BoxGeometry(1000, 1000, 1000);
    }
  }

  /**
   * Create wall geometry
   */
  private _createWallGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const width = options.properties?.width || 3000;
    const height = options.properties?.height || 2800;
    const thickness = options.properties?.thickness || 200;
    
    return new THREE.BoxGeometry(width, height, thickness);
  }

  /**
   * Create door geometry
   */
  private _createDoorGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const width = options.properties?.width || 900;
    const height = options.properties?.height || 2100;
    const thickness = options.properties?.thickness || 50;
    
    return new THREE.BoxGeometry(width, height, thickness);
  }

  /**
   * Create window geometry
   */
  private _createWindowGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const width = options.properties?.width || 1200;
    const height = options.properties?.height || 1200;
    const thickness = options.properties?.thickness || 100;
    
    return new THREE.BoxGeometry(width, height, thickness);
  }

  /**
   * Create floor geometry
   */
  private _createFloorGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const width = options.properties?.width || 5000;
    const depth = options.properties?.depth || 5000;
    const thickness = options.properties?.thickness || 200;
    
    return new THREE.BoxGeometry(width, thickness, depth);
  }

  /**
   * Create ceiling geometry
   */
  private _createCeilingGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const width = options.properties?.width || 5000;
    const depth = options.properties?.depth || 5000;
    const thickness = options.properties?.thickness || 150;
    
    return new THREE.BoxGeometry(width, thickness, depth);
  }

  /**
   * Create column geometry
   */
  private _createColumnGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const width = options.properties?.width || 300;
    const height = options.properties?.height || 3000;
    const depth = options.properties?.depth || 300;
    
    return new THREE.BoxGeometry(width, height, depth);
  }

  /**
   * Create beam geometry
   */
  private _createBeamGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const width = options.properties?.width || 300;
    const height = options.properties?.height || 400;
    const length = options.properties?.length || 5000;
    
    return new THREE.BoxGeometry(length, height, width);
  }

  /**
   * Create roof geometry
   */
  private _createRoofGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const width = options.properties?.width || 5000;
    const depth = options.properties?.depth || 5000;
    const thickness = options.properties?.thickness || 200;
    
    // Create a simple sloped roof using a rotated box
    const geometry = new THREE.BoxGeometry(width, thickness, depth);
    return geometry;
  }

  /**
   * Create stair geometry
   */
  private _createStairGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const width = options.properties?.width || 1200;
    const height = options.properties?.height || 3000;
    const depth = options.properties?.depth || 4000;
    
    // Simple stair as a wedge
    const geometry = new THREE.BoxGeometry(width, height, depth);
    return geometry;
  }

  /**
   * Create railing geometry
   */
  private _createRailingGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const length = options.properties?.length || 1000;
    const height = options.properties?.height || 1100;
    
    // Simple railing as a thin box
    return new THREE.BoxGeometry(length, height, 50);
  }

  /**
   * Create a wall
   * @param width - Wall width in mm
   * @param height - Wall height in mm
   * @param thickness - Wall thickness in mm
   * @param options - Additional options
   */
  createWall(
    width: number, 
    height: number, 
    thickness: number, 
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'wall',
      ...options,
      properties: {
        width,
        height,
        thickness,
        ...options.properties,
      },
    });
  }

  /**
   * Create a door
   * @param width - Door width in mm
   * @param height - Door height in mm
   * @param options - Additional options
   */
  createDoor(
    width: number, 
    height: number, 
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'door',
      ...options,
      properties: {
        width,
        height,
        thickness: 50,
        ...options.properties,
      },
    });
  }

  /**
   * Create a window
   * @param width - Window width in mm
   * @param height - Window height in mm
   * @param options - Additional options
   */
  createWindow(
    width: number, 
    height: number, 
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'window',
      ...options,
      properties: {
        width,
        height,
        thickness: 100,
        ...options.properties,
      },
    });
  }

  /**
   * Create a floor
   * @param width - Floor width in mm
   * @param depth - Floor depth in mm
   * @param options - Additional options
   */
  createFloor(
    width: number, 
    depth: number, 
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'floor',
      ...options,
      properties: {
        width,
        depth,
        thickness: 200,
        ...options.properties,
      },
    });
  }

  /**
   * Create a ceiling
   * @param width - Ceiling width in mm
   * @param depth - Ceiling depth in mm
   * @param options - Additional options
   */
  createCeiling(
    width: number, 
    depth: number, 
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'ceiling',
      ...options,
      properties: {
        width,
        depth,
        thickness: 150,
        ...options.properties,
      },
    });
  }

  /**
   * Create a column
   * @param width - Column width in mm
   * @param height - Column height in mm
   * @param options - Additional options
   */
  createColumn(
    width: number, 
    height: number, 
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'column',
      ...options,
      properties: {
        width,
        height,
        depth: width,
        ...options.properties,
      },
    });
  }

  /**
   * Create a beam
   * @param width - Beam width in mm
   * @param height - Beam height in mm
   * @param length - Beam length in mm
   * @param options - Additional options
   */
  createBeam(
    width: number, 
    height: number, 
    length: number,
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'beam',
      ...options,
      properties: {
        width,
        height,
        length,
        ...options.properties,
      },
    });
  }

  /**
   * Register a custom material
   * @param name - Material name
   * @param material - Three.js material
   */
  registerMaterial(name: string, material: THREE.Material): void {
    this._materials.set(name, material);
  }

  /**
   * Get a registered material
   * @param name - Material name
   * @returns Material or undefined
   */
  getMaterial(name: string): THREE.Material | undefined {
    return this._materials.get(name);
  }

  /**
   * Get all registered material names
   */
  getMaterialNames(): string[] {
    return Array.from(this._materials.keys());
  }

  /**
   * Update the working plane
   * @param workingPlane - New working plane system
   */
  setWorkingPlane(workingPlane: WorkingPlaneSystem): void {
    this._workingPlane = workingPlane;
  }

  /**
   * Dispose of all materials
   */
  dispose(): void {
    this._materials.forEach(material => material.dispose());
    this._materials.clear();
  }
}

export default BIMObjectFactory;
