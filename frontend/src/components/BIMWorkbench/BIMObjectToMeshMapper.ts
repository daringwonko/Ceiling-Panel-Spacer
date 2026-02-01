/**
 * BIMObjectToMeshMapper - Wiring from Store to 3D Canvas
 *
 * Converts BIMObject instances from the store (zustand) into Three.js meshes
 * that can be rendered in the BIM3DCanvas.
 *
 * Supports: wall, beam, column, slab, door, window, stairs, roof, panel,
 *           point, line, polyline, rectangle, circle, arc
 */

import React from 'react';
import * as THREE from 'three';
import { BIM3DObject } from './BIM3DObject';
import { BIMObjectFactory } from './BIMObjectFactory';
import {
  BIMObjectMetadata,
  BIMObjectType,
  BIMObjectCreateOptions,
  IFC_TYPE_MAP,
} from './types/3d';

/**
 * Material mapping for store material strings to Three.js materials
 */
const MATERIAL_MAP: Record<string, THREE.Material> = {
  wall: new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.9,
    metalness: 0.0,
  }),
  beam: new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.7,
    metalness: 0.3,
  }),
  column: new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.9,
    metalness: 0.0,
  }),
  slab: new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.8,
    metalness: 0.1,
  }),
  door: new THREE.MeshStandardMaterial({
    color: 0x8B4513,
    roughness: 0.6,
    metalness: 0.1,
  }),
  window: new THREE.MeshPhysicalMaterial({
    color: 0xaaccff,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.9,
    transparent: true,
    opacity: 0.3,
  }),
  stairs: new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    roughness: 0.7,
    metalness: 0.2,
  }),
  roof: new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.8,
    metalness: 0.1,
  }),
  panel: new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.5,
    metalness: 0.1,
  }),
  default: new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.7,
    metalness: 0.2,
  }),
};

/**
 * Store BIMObject interface (from useBIMStore)
 */
export interface StoreBIMObject {
  id: string;
  type: string;
  name: string;
  geometry: any;
  material: string;
  properties: Record<string, any>;
  level: string;
  layer: string;
  isSelected: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  bounds?: {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
  };
}

/**
 * Mapper configuration options
 */
export interface MapperOptions {
  factory?: BIMObjectFactory;
  selectedIds?: Set<string>;
  onObjectCreated?: (obj: BIM3DObject) => void;
}

/**
 * Result of object mapping with metadata
 */
export interface MappingResult {
  objects: BIM3DObject[];
  idMapping: Map<string, string>; // storeId -> meshId
  created: string[];
  updated: string[];
  removed: string[];
}

/**
 * Convert store BIMObject to BIM3DObject using factory
 */
function convertTo3DObject(
  storeObj: StoreBIMObject,
  factory: BIMObjectFactory,
  isSelected: boolean
): BIM3DObject {
  const options: BIMObjectCreateOptions = {
    type: mapStoreTypeToFactoryType(storeObj.type),
    position: new THREE.Vector3(...storeObj.position),
    rotation: new THREE.Euler(
      storeObj.rotation[0],
      storeObj.rotation[1],
      storeObj.rotation[2]
    ),
    scale: new THREE.Vector3(...storeObj.scale),
    material: storeObj.material || storeObj.type,
    level: storeObj.level,
    name: storeObj.name,
    properties: storeObj.properties || {},
  };

  const bim3DObj = factory.create(options);
  bim3DObj.userData.storeId = storeObj.id;

  if (isSelected) {
    bim3DObj.select();
  }

  return bim3DObj;
}

/**
 * Map store object type to factory type
 */
function mapStoreTypeToFactoryType(storeType: string): BIMObjectType {
  const typeMap: Record<string, BIMObjectType> = {
    wall: 'wall',
    beam: 'beam',
    column: 'column',
    slab: 'floor',
    door: 'door',
    window: 'window',
    stairs: 'stair',
    roof: 'roof',
    panel: 'custom',
    point: 'custom',
    line: 'custom',
    polyline: 'custom',
    rectangle: 'custom',
    circle: 'custom',
    arc: 'custom',
  };

  return typeMap[storeType] || 'custom';
}

/**
 * Get material for a store object
 */
function getMaterialForObject(storeObj: StoreBIMObject): THREE.Material {
  const materialName = storeObj.material || storeObj.type;
  return MATERIAL_MAP[materialName] || MATERIAL_MAP.default;
}

/**
 * Create simple mesh from geometry data without using factory
 */
function createMeshFromGeometry(
  storeObj: StoreBIMObject
): THREE.Mesh | null {
  const geometry = storeObj.geometry;
  const props = storeObj.properties || {};

  if (!geometry) {
    return null;
  }

  let bufferGeometry: THREE.BufferGeometry | null = null;

  switch (geometry.type) {
    case 'box':
      bufferGeometry = new THREE.BoxGeometry(
        props.width || 1000,
        props.height || 1000,
        props.depth || 1000
      );
      break;
    case 'cylinder':
      bufferGeometry = new THREE.CylinderGeometry(
        props.radius || 100,
        props.radius || 100,
        props.height || 1000,
        32
      );
      break;
    case 'sphere':
      bufferGeometry = new THREE.SphereGeometry(props.radius || 100, 32, 32);
      break;
    case 'plane':
      bufferGeometry = new THREE.PlaneGeometry(
        props.width || 1000,
        props.height || 1000
      );
      break;
    default:
      bufferGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
  }

  const material = getMaterialForObject(storeObj);
  const mesh = new THREE.Mesh(bufferGeometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

/**
 * Create line geometry for point, line, polyline objects
 */
function createLineGeometry(
  storeObj: StoreBIMObject
): THREE.Object3D | null {
  const geometry = storeObj.geometry;
  const props = storeObj.properties || {};

  if (!geometry?.points) {
    return null;
  }

  const points = geometry.points.map(
    (p: any) => new THREE.Vector3(p.x || 0, p.y || 0, p.z || 0)
  );

  if (points.length === 0) {
    return null;
  }

  if (storeObj.type === 'point') {
    const sphere = new THREE.SphereGeometry(50, 16, 16);
    const material = getMaterialForObject(storeObj);
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.copy(points[0]);
    return mesh;
  }

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const mat = MATERIAL_MAP[storeObj.type];
    const materialColor = mat && 'color' in mat ? (mat as any).color : 0x00ff00;
    const material = new THREE.LineBasicMaterial({
      color: materialColor,
    });

  if (storeObj.type === 'line' || storeObj.type === 'arc') {
    return new THREE.Line(lineGeometry, material);
  }

  if (storeObj.type === 'polyline') {
    const group = new THREE.Group();
    const line = new THREE.Line(lineGeometry, material);
    group.add(line);

    if (points.length > 0) {
      const sphereGeo = new THREE.SphereGeometry(30, 8, 8);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      points.forEach((p: THREE.Vector3) => {
        const vertex = new THREE.Mesh(sphereGeo, sphereMat);
        vertex.position.copy(p);
        group.add(vertex);
      });
    }

    return group;
  }

  const meshGeometry = new THREE.BoxGeometry(100, 100, 100);
  const meshMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  return new THREE.Mesh(meshGeometry, meshMaterial);
}

/**
 * Convert store BIMObject to Three.js Group containing meshes
 */
export function storeObjectToThreeJS(
  storeObj: StoreBIMObject,
  isSelected: boolean = false
): BIM3DObject {
  const metadata: BIMObjectMetadata = {
    ifcType: mapStoreTypeToIFCType(storeObj.type),
    material: storeObj.material || storeObj.type,
    level: storeObj.level,
    id: storeObj.id,
    properties: storeObj.properties || {},
    name: storeObj.name,
  };

  const bim3DObj = new BIM3DObject(metadata);
  bim3DObj.userData.storeId = storeObj.id;

  let content: THREE.Object3D | null = null;

  if (['point', 'line', 'polyline', 'rectangle', 'circle', 'arc'].includes(storeObj.type)) {
    content = createLineGeometry(storeObj);
  } else {
    const mesh = createMeshFromGeometry(storeObj);
    if (mesh) {
      content = mesh;
    } else {
      const boxGeo = new THREE.BoxGeometry(1000, 1000, 1000);
      const material = getMaterialForObject(storeObj);
      content = new THREE.Mesh(boxGeo, material);
    }
  }

  if (content) {
    bim3DObj.add(content);
  }

  bim3DObj.position.set(...storeObj.position);
  bim3DObj.rotation.set(...storeObj.rotation);
  bim3DObj.scale.set(...storeObj.scale);

  if (isSelected) {
    bim3DObj.select();
  }

  return bim3DObj;
}

/**
 * Map store object type to IFC type
 */
function mapStoreTypeToIFCType(storeType: string): string {
  const ifcMap: Record<string, string> = {
    wall: 'IfcWall',
    beam: 'IfcBeam',
    column: 'IfcColumn',
    slab: 'IfcSlab',
    door: 'IfcDoor',
    window: 'IfcWindow',
    stairs: 'IfcStair',
    roof: 'IfcRoof',
    panel: 'IfcBuildingElementProxy',
    point: 'IfcSite',
    line: 'IfcCurve',
    polyline: 'IfcPolyline',
    rectangle: 'IfcRectangleProfileDef',
    circle: 'IfcCircleProfileDef',
    arc: 'IfcArc',
  };

  return ifcMap[storeType] || 'IfcBuildingElementProxy';
}

/**
 * BIMObjectToMeshMapper - Main class for converting store objects to 3D meshes
 *
 * Maintains a cache of created meshes and updates them when store objects change.
 * Provides efficient diffing to only recreate/modify objects as needed.
 */
export class BIMObjectToMeshMapper {
  private _factory: BIMObjectFactory | null;
  private _meshCache: Map<string, BIM3DObject> = new Map();
  private _selectedIds: Set<string> = new Set();

  constructor(options: MapperOptions = {}) {
    this._factory = options.factory || null;
    if (options.selectedIds) {
      this._selectedIds = options.selectedIds;
    }
  }

  /**
   * Set selected object IDs
   */
  setSelectedIds(ids: Set<string>): void {
    this._selectedIds = ids;
  }

  /**
   * Clear the mesh cache
   */
  clearCache(): void {
    this._meshCache.forEach((obj) => obj.dispose());
    this._meshCache.clear();
  }

  /**
   * Convert store objects to 3D objects with diffing
   */
  mapObjects(storeObjects: StoreBIMObject[]): MappingResult {
    const storeIds = new Set(storeObjects.map((o) => o.id));
    const created: string[] = [];
    const updated: string[] = [];
    const removed: string[] = [];

    const existingIds = new Set(this._meshCache.keys());
    const idMapping = new Map<string, string>();

    removed.push(...Array.from(existingIds).filter((id) => !storeIds.has(id)));

    const newObjects: BIM3DObject[] = [];

    for (const storeObj of storeObjects) {
      let mesh = this._meshCache.get(storeObj.id);

      const isSelected = this._selectedIds.has(storeObj.id);

      if (!mesh) {
        if (this._factory) {
          mesh = convertTo3DObject(storeObj, this._factory, isSelected);
        } else {
          mesh = storeObjectToThreeJS(storeObj, isSelected);
        }
        this._meshCache.set(storeObj.id, mesh);
        created.push(storeObj.id);
      } else {
        if (isSelected && !mesh.isSelected()) {
          mesh.select();
        } else if (!isSelected && mesh.isSelected()) {
          mesh.deselect();
        }

        mesh.position.set(...storeObj.position);
        mesh.rotation.set(...storeObj.rotation);
        mesh.scale.set(...storeObj.scale);
        updated.push(storeObj.id);
      }

      newObjects.push(mesh);
      idMapping.set(storeObj.id, mesh.id);
    }

    for (const removedId of removed) {
      const mesh = this._meshCache.get(removedId);
      if (mesh) {
        mesh.dispose();
        this._meshCache.delete(removedId);
      }
    }

    return {
      objects: newObjects,
      idMapping,
      created,
      updated,
      removed,
    };
  }

  /**
   * Get single 3D object by store ID
   */
  getObject(storeId: string): BIM3DObject | undefined {
    return this._meshCache.get(storeId);
  }

  /**
   * Get all cached 3D objects
   */
  getAllObjects(): BIM3DObject[] {
    return Array.from(this._meshCache.values());
  }

  /**
   * Get geometry type from properties
   */
  static getGeometryType(props: Record<string, any>): string {
    if (props.width && props.height && props.depth) {
      return 'box';
    }
    if (props.radius && props.height) {
      return 'cylinder';
    }
    if (props.radius) {
      return 'sphere';
    }
    if (props.width && props.height) {
      return 'plane';
    }
    return 'box';
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.clearCache();
  }
}

/**
 * React hook for mapping store objects to 3D objects
 */
export function useBIMObjectMapper() {
  const mapperRef = React.useRef<BIMObjectToMeshMapper | null>(null);

  React.useEffect(() => {
    mapperRef.current = new BIMObjectToMeshMapper();

    return () => {
      mapperRef.current?.dispose();
      mapperRef.current = null;
    };
  }, []);

  const mapObjects = React.useCallback(
    (
      storeObjects: StoreBIMObject[],
      selectedIds: Set<string>
    ): BIM3DObject[] => {
      if (!mapperRef.current) {
        mapperRef.current = new BIMObjectToMeshMapper();
      }

      mapperRef.current.setSelectedIds(selectedIds);
      const result = mapperRef.current.mapObjects(storeObjects);

      return result.objects;
    },
    []
  );

  const getObject = React.useCallback((storeId: string): BIM3DObject | undefined => {
    return mapperRef.current?.getObject(storeId);
  }, []);

  return {
    mapObjects,
    getObject,
    getAllObjects: () => mapperRef.current?.getAllObjects() || [],
  };
}

export default BIMObjectToMeshMapper;
