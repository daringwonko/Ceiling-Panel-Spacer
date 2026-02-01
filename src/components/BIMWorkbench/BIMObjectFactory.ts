import * as THREE from 'three';
import { BIM3DObject } from './BIM3DObject';
import { WorkingPlaneSystem } from './WorkingPlaneSystem';
import { 
  BIMObjectType, 
  BIMObjectCreateOptions, 
  BIMObjectMetadata 
} from './types/3d';

/**
 * BIMObjectFactory
 * 
 * Factory class for creating BIM objects with proper geometry,
 * materials, and IFC metadata. Positions objects on the working plane.
 */
export class BIMObjectFactory {
  private _workingPlane: WorkingPlaneSystem;
  private _idCounter: number = 0;
  private _materialCache: Map<string, THREE.Material> = new Map();
  
  /**
   * Create a new BIMObjectFactory
   * @param workingPlane - Working plane system for object positioning
   */
  constructor(workingPlane: WorkingPlaneSystem) {
    this._workingPlane = workingPlane;
    this._initializeDefaultMaterials();
  }
  
  /**
   * Initialize default materials cache
   */
  private _initializeDefaultMaterials(): void {
    // Concrete
    this._materialCache.set('concrete', new THREE.MeshLambertMaterial({
      color: 0x999999,
      name: 'concrete'
    }));
    
    // Wood
    this._materialCache.set('wood', new THREE.MeshLambertMaterial({
      color: 0x8b4513,
      name: 'wood'
    }));
    
    // Glass
    this._materialCache.set('glass', new THREE.MeshPhongMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.4,
      name: 'glass'
    }));
    
    // Metal
    this._materialCache.set('metal', new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2,
      name: 'metal'
    }));
    
    // Brick
    this._materialCache.set('brick', new THREE.MeshLambertMaterial({
      color: 0xcc6644,
      name: 'brick'
    }));
    
    // Default
    this._materialCache.set('default', new THREE.MeshLambertMaterial({
      color: 0xcccccc,
      name: 'default'
    }));
  }
  
  /**
   * Main creation method - creates any BIM object type
   * @param options - Object creation options
   * @returns Created BIM3DObject
   */
  public create(options: BIMObjectCreateOptions): BIM3DObject {
    const id = this._generateId(options.type);
    
    // Create metadata
    const metadata: BIMObjectMetadata = {
      ifcType: this._getIfcType(options.type),
      material: options.material || 'default',
      level: options.level || 'Level 0',
      id: id,
      properties: options.properties || {}
    };
    
    // Create the BIM object
    const object = new BIM3DObject(metadata);
    
    // Create and add geometry
    const geometry = this._createGeometry(options.type, options);
    const material = this._createMaterial(options.material);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    object.add(mesh);
    
    // Set position on working plane
    const position = options.position || new THREE.Vector3(0, 0, 0);
    const projectedPosition = this._workingPlane.projectPoint(position);
    object.position.copy(projectedPosition);
    
    // Set rotation
    if (options.rotation) {
      object.rotation.copy(options.rotation);
    }
    
    // Set scale
    if (options.scale) {
      object.scale.copy(options.scale);
    }
    
    return object;
  }
  
  /**
   * Create a wall object
   * @param width - Wall width (length)
   * @param height - Wall height
   * @param thickness - Wall thickness
   * @param options - Additional options
   * @returns Wall BIM3DObject
   */
  public createWall(
    width: number,
    height: number,
    thickness: number,
    options?: Partial<BIMObjectCreateOptions>
  ): BIM3DObject {
    return this.create({
      type: 'wall',
      ...options,
      properties: {
        width,
        height,
        thickness,
        ...options?.properties
      }
    });
  }
  
  /**
   * Create a door object
   * @param width - Door width
   * @param height - Door height
   * @param options - Additional options
   * @returns Door BIM3DObject
   */
  public createDoor(
    width: number,
    height: number,
    options?: Partial<BIMObjectCreateOptions>
  ): BIM3DObject {
    return this.create({
      type: 'door',
      ...options,
      properties: {
        width,
        height,
        ...options?.properties
      }
    });
  }
  
  /**
   * Create a window object
   * @param width - Window width
   * @param height - Window height
   * @param options - Additional options
   * @returns Window BIM3DObject
   */
  public createWindow(
    width: number,
    height: number,
    options?: Partial<BIMObjectCreateOptions>
  ): BIM3DObject {
    return this.create({
      type: 'window',
      ...options,
      properties: {
        width,
        height,
        ...options?.properties
      }
    });
  }
  
  /**
   * Create a floor object
   * @param width - Floor width
   * @param depth - Floor depth
   * @param options - Additional options
   * @returns Floor BIM3DObject
   */
  public createFloor(
    width: number,
    depth: number,
    options?: Partial<BIMObjectCreateOptions>
  ): BIM3DObject {
    return this.create({
      type: 'floor',
      ...options,
      properties: {
        width,
        depth,
        ...options?.properties
      }
    });
  }
  
  /**
   * Create a ceiling object
   * @param width - Ceiling width
   * @param depth - Ceiling depth
   * @param options - Additional options
   * @returns Ceiling BIM3DObject
   */
  public createCeiling(
    width: number,
    depth: number,
    options?: Partial<BIMObjectCreateOptions>
  ): BIM3DObject {
    return this.create({
      type: 'ceiling',
      ...options,
      properties: {
        width,
        depth,
        ...options?.properties
      }
    });
  }
  
  /**
   * Create a column object
   * @param width - Column width
   * @param height - Column height
   * @param options - Additional options
   * @returns Column BIM3DObject
   */
  public createColumn(
    width: number,
    height: number,
    options?: Partial<BIMObjectCreateOptions>
  ): BIM3DObject {
    return this.create({
      type: 'column',
      ...options,
      properties: {
        width,
        height,
        ...options?.properties
      }
    });
  }
  
  /**
   * Create a beam object
   * @param width - Beam width
   * @param height - Beam height
   * @param length - Beam length
   * @param options - Additional options
   * @returns Beam BIM3DObject
   */
  public createBeam(
    width: number,
    height: number,
    length: number,
    options?: Partial<BIMObjectCreateOptions>
  ): BIM3DObject {
    return this.create({
      type: 'beam',
      ...options,
      properties: {
        width,
        height,
        length,
        ...options?.properties
      }
    });
  }
  
  /**
   * Create geometry for a specific object type
   * @param type - Object type
   * @param options - Creation options
   * @returns Three.js BufferGeometry
   */
  private _createGeometry(
    type: BIMObjectType,
    options: BIMObjectCreateOptions
  ): THREE.BufferGeometry {
    const props = options.properties || {};
    
    switch (type) {
      case 'wall': {
        const width = props.width || 2000;
        const height = props.height || 3000;
        const thickness = props.thickness || 200;
        return new THREE.BoxGeometry(width, height, thickness);
      }
        
      case 'door': {
        const dWidth = props.width || 900;
        const dHeight = props.height || 2100;
        const dThickness = props.thickness || 50;
        return new THREE.BoxGeometry(dWidth, dHeight, dThickness);
      }
        
      case 'window': {
        const wWidth = props.width || 1200;
        const wHeight = props.height || 1200;
        const wThickness = props.thickness || 100;
        return new THREE.BoxGeometry(wWidth, wHeight, wThickness);
      }
        
      case 'floor': {
        const fWidth = props.width || 5000;
        const fDepth = props.depth || 5000;
        const fThickness = props.thickness || 200;
        return new THREE.BoxGeometry(fWidth, fThickness, fDepth);
      }
        
      case 'ceiling': {
        const cWidth = props.width || 5000;
        const cDepth = props.depth || 5000;
        const cThickness = props.thickness || 100;
        return new THREE.BoxGeometry(cWidth, cThickness, cDepth);
      }
        
      case 'column': {
        const colWidth = props.width || 300;
        const colHeight = props.height || 3000;
        return new THREE.BoxGeometry(colWidth, colHeight, colWidth);
      }
        
      case 'beam': {
        const bWidth = props.width || 300;
        const bHeight = props.height || 500;
        const bLength = props.length || 5000;
        return new THREE.BoxGeometry(bWidth, bHeight, bLength);
      }
        
      case 'custom':
      default: {
        const cSize = props.size || 1000;
        return new THREE.BoxGeometry(cSize, cSize, cSize);
      }
    }
  }
  
  /**
   * Get or create material
   * @param materialRef - Material name or reference
   * @returns Three.js Material
   */
  private _createMaterial(materialRef?: string): THREE.Material {
    if (materialRef && this._materialCache.has(materialRef)) {
      return this._materialCache.get(materialRef)!;
    }
    return this._materialCache.get('default')!;
  }
  
  /**
   * Get IFC type string for object type
   * @param type - BIM object type
   * @returns IFC entity type
   */
  private _getIfcType(type: BIMObjectType): string {
    const ifcTypes: Record<BIMObjectType, string> = {
      wall: 'IfcWall',
      door: 'IfcDoor',
      window: 'IfcWindow',
      floor: 'IfcSlab',
      ceiling: 'IfcCovering',
      column: 'IfcColumn',
      beam: 'IfcBeam',
      custom: 'IfcBuildingElementProxy'
    };
    return ifcTypes[type] || 'IfcBuildingElementProxy';
  }
  
  /**
   * Generate unique ID for object
   * @param type - Object type
   * @returns Unique ID string
   */
  private _generateId(type: BIMObjectType): string {
    const timestamp = Date.now();
    const counter = ++this._idCounter;
    return `${type}_${timestamp}_${counter}`;
  }
  
  /**
   * Register a custom material
   * @param name - Material name
   * @param material - Three.js material
   */
  public registerMaterial(name: string, material: THREE.Material): void {
    this._materialCache.set(name, material);
  }
  
  /**
   * Get available material names
   * @returns Array of material names
   */
  public getAvailableMaterials(): string[] {
    return Array.from(this._materialCache.keys());
  }
  
  /**
   * Dispose of factory resources
   */
  public dispose(): void {
    // Dispose cached materials
    this._materialCache.forEach(material => {
      material.dispose();
    });
    this._materialCache.clear();
  }
}

export default BIMObjectFactory;
