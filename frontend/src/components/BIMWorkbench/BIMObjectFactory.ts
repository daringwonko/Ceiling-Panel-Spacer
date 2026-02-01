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

    // 2D shape materials
    this._materials.set('circle', new THREE.MeshBasicMaterial({
      color: 0x3498db,
      side: THREE.DoubleSide,
    }));

    this._materials.set('rectangle', new THREE.MeshBasicMaterial({
      color: 0xe74c3c,
      side: THREE.DoubleSide,
    }));

    this._materials.set('arc', new THREE.MeshBasicMaterial({
      color: 0x9b59b6,
      side: THREE.DoubleSide,
    }));

    this._materials.set('line', new THREE.LineBasicMaterial({
      color: 0x2ecc71,
      linewidth: 2,
    }));

    this._materials.set('ellipse', new THREE.MeshBasicMaterial({
      color: 0xf39c12,
      side: THREE.DoubleSide,
    }));

    this._materials.set('polygon', new THREE.MeshBasicMaterial({
      color: 0x1abc9c,
      side: THREE.DoubleSide,
    }));

    this._materials.set('polyline', new THREE.LineBasicMaterial({
      color: 0xe91e63,
      linewidth: 2,
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

    const isLineType = options.type === 'line' || options.type === 'polyline';

    let object3D: THREE.Object3D;

    if (isLineType) {
      const material = this._getMaterial(options.material) as THREE.LineBasicMaterial;
      const line = new THREE.Line(geometry, material);
      object3D = line;
    } else {
      const material = this._getMaterial(options.material);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      object3D = mesh;
    }

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
    bimObject.add(object3D);

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
      case 'circle':
        return this._createCircleGeometry(options);
      case 'rectangle':
        return this._createRectangleGeometry(options);
      case 'arc':
        return this._createArcGeometry(options);
      case 'line':
        return this._createLineGeometry(options);
      case 'ellipse':
        return this._createEllipseGeometry(options);
      case 'polygon':
        return this._createPolygonGeometry(options);
      case 'polyline':
        return this._createPolylineGeometry(options);
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
   * Create circle geometry
   */
  private _createCircleGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const radius = options.properties?.radius || 500;
    const segments = options.properties?.segments || 32;
    return new THREE.CircleGeometry(radius, segments);
  }

  /**
   * Create rectangle geometry
   */
  private _createRectangleGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const width = options.properties?.width || 1000;
    const height = options.properties?.height || 1000;
    return new THREE.PlaneGeometry(width, height);
  }

  /**
   * Create arc geometry
   */
  private _createArcGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const radius = options.properties?.radius || 500;
    const startAngle = options.properties?.startAngle || 0;
    const endAngle = options.properties?.endAngle || Math.PI;
    const segments = options.properties?.segments || 32;

    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius, startAngle, endAngle, false);

    return new THREE.ShapeGeometry(shape, segments);
  }

  /**
   * Create line geometry
   */
  private _createLineGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const points = options.properties?.points || [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1000, 0, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  /**
   * Create ellipse geometry
   */
  private _createEllipseGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const xRadius = options.properties?.xRadius || 500;
    const yRadius = options.properties?.yRadius || 300;
    const segments = options.properties?.segments || 32;

    const curve = new THREE.EllipseCurve(0, 0, xRadius, yRadius, 0, 2 * Math.PI, false, 0);
    const points = curve.getPoints(segments);
    const shape = new THREE.Shape(points);

    return new THREE.ShapeGeometry(shape, segments);
  }

  /**
   * Create polygon geometry
   */
  private _createPolygonGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const vertices = options.properties?.vertices || [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1000, 0, 0),
      new THREE.Vector3(1000, 1000, 0),
      new THREE.Vector3(0, 1000, 0),
    ];

    const shape = new THREE.Shape();
    shape.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      shape.lineTo(vertices[i].x, vertices[i].y);
    }
    shape.closePath();

    return new THREE.ShapeGeometry(shape);
  }

  /**
   * Create polyline geometry
   */
  private _createPolylineGeometry(options: BIMObjectCreateOptions): THREE.BufferGeometry {
    const points = options.properties?.points || [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(500, 500, 0),
      new THREE.Vector3(1000, 0, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
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
   * Create a circle
   * @param radius - Circle radius in mm
   * @param segments - Number of segments
   * @param options - Additional options
   */
  createCircle(
    radius: number,
    segments: number = 32,
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'circle',
      ...options,
      properties: {
        radius,
        segments,
        ...options.properties,
      },
    });
  }

  /**
   * Create a rectangle
   * @param width - Rectangle width in mm
   * @param height - Rectangle height in mm
   * @param options - Additional options
   */
  createRectangle(
    width: number,
    height: number,
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'rectangle',
      ...options,
      properties: {
        width,
        height,
        ...options.properties,
      },
    });
  }

  /**
   * Create an arc
   * @param radius - Arc radius in mm
   * @param startAngle - Start angle in radians
   * @param endAngle - End angle in radians
   * @param options - Additional options
   */
  createArc(
    radius: number,
    startAngle: number = 0,
    endAngle: number = Math.PI,
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'arc',
      ...options,
      properties: {
        radius,
        startAngle,
        endAngle,
        ...options.properties,
      },
    });
  }

  /**
   * Create a line
   * @param points - Array of points defining the line
   * @param options - Additional options
   */
  createLine(
    points: THREE.Vector3[],
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'line',
      ...options,
      properties: {
        points,
        ...options.properties,
      },
    });
  }

  /**
   * Create an ellipse
   * @param xRadius - X-axis radius in mm
   * @param yRadius - Y-axis radius in mm
   * @param segments - Number of segments
   * @param options - Additional options
   */
  createEllipse(
    xRadius: number,
    yRadius: number,
    segments: number = 32,
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'ellipse',
      ...options,
      properties: {
        xRadius,
        yRadius,
        segments,
        ...options.properties,
      },
    });
  }

  /**
   * Create a polygon
   * @param vertices - Array of vertices defining the polygon
   * @param options - Additional options
   */
  createPolygon(
    vertices: THREE.Vector3[],
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'polygon',
      ...options,
      properties: {
        vertices,
        ...options.properties,
      },
    });
  }

  /**
   * Create a polyline
   * @param points - Array of points defining the polyline
   * @param options - Additional options
   */
  createPolyline(
    points: THREE.Vector3[],
    options: Partial<BIMObjectCreateOptions> = {}
  ): BIM3DObject {
    return this.create({
      type: 'polyline',
      ...options,
      properties: {
        points,
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
