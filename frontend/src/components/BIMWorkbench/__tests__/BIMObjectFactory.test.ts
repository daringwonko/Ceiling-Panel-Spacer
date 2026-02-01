import * as THREE from 'three';
import { BIMObjectFactory } from '../BIMObjectFactory';
import { WorkingPlaneSystem } from '../WorkingPlaneSystem';
import { BIMObjectType, IFC_TYPE_MAP, OBJECT_TO_MESH_TYPE } from '../types/3d';

describe('BIMObjectFactory - Object-to-Mesh Mapping', () => {
  let workingPlane: WorkingPlaneSystem;
  let factory: BIMObjectFactory;

  beforeEach(() => {
    workingPlane = new WorkingPlaneSystem();
    factory = new BIMObjectFactory(workingPlane);
  });

  afterEach(() => {
    factory.dispose();
  });

  describe('BIMObjectType support', () => {
    const supportedTypes: BIMObjectType[] = [
      'wall', 'door', 'window', 'floor', 'ceiling',
      'column', 'beam', 'roof', 'stair', 'railing',
      'custom', 'circle', 'rectangle', 'arc', 'line',
      'ellipse', 'polygon', 'polyline'
    ];

    test.each(supportedTypes)('should support %s type', (type) => {
      const bimObject = factory.create({ type });
      expect(bimObject).toBeDefined();
      expect(bimObject.metadata.ifcType).toBe(IFC_TYPE_MAP[type]);
    });
  });

  describe('IFC_TYPE_MAP', () => {
    test('should have mapping for all supported types', () => {
      const types: BIMObjectType[] = [
        'wall', 'door', 'window', 'floor', 'ceiling',
        'column', 'beam', 'roof', 'stair', 'railing',
        'custom', 'circle', 'rectangle', 'arc', 'line',
        'ellipse', 'polygon', 'polyline'
      ];

      types.forEach(type => {
        expect(IFC_TYPE_MAP).toHaveProperty(type);
        expect(IFC_TYPE_MAP[type]).toBeDefined();
      });
    });
  });

  describe('OBJECT_TO_MESH_TYPE mapping', () => {
    test('should have mesh type mapping for all supported types', () => {
      const types: BIMObjectType[] = [
        'wall', 'door', 'window', 'floor', 'ceiling',
        'column', 'beam', 'roof', 'stair', 'railing',
        'custom', 'circle', 'rectangle', 'arc', 'line',
        'ellipse', 'polygon', 'polyline'
      ];

      types.forEach(type => {
        expect(OBJECT_TO_MESH_TYPE).toHaveProperty(type);
        expect(OBJECT_TO_MESH_TYPE[type]).toBeDefined();
      });
    });
  });

  describe('2D Shape Creation', () => {
    test('should create circle geometry', () => {
      const circle = factory.createCircle(500, 32);
      expect(circle).toBeDefined();
      expect(circle.metadata.ifcType).toBe('IfcCircle');
    });

    test('should create rectangle geometry', () => {
      const rectangle = factory.createRectangle(1000, 500);
      expect(rectangle).toBeDefined();
      expect(rectangle.metadata.ifcType).toBe('IfcRectangleProfileDef');
    });

    test('should create arc geometry', () => {
      const arc = factory.createArc(500, 0, Math.PI);
      expect(arc).toBeDefined();
      expect(arc.metadata.ifcType).toBe('IfcArc');
    });

    test('should create ellipse geometry', () => {
      const ellipse = factory.createEllipse(500, 300);
      expect(ellipse).toBeDefined();
      expect(ellipse.metadata.ifcType).toBe('IfcEllipse');
    });

    test('should create polygon geometry', () => {
      const vertices = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1000, 0, 0),
        new THREE.Vector3(1000, 1000, 0),
        new THREE.Vector3(0, 1000, 0),
      ];
      const polygon = factory.createPolygon(vertices);
      expect(polygon).toBeDefined();
      expect(polygon.metadata.ifcType).toBe('IfcPolygon');
    });

    test('should create polyline geometry', () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(500, 500, 0),
        new THREE.Vector3(1000, 0, 0),
      ];
      const polyline = factory.createPolyline(points);
      expect(polyline).toBeDefined();
      expect(polyline.metadata.ifcType).toBe('IfcPolyline');
    });

    test('should create line geometry', () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1000, 0, 0),
      ];
      const line = factory.createLine(points);
      expect(line).toBeDefined();
      expect(line.metadata.ifcType).toBe('IfcLine');
    });
  });

  describe('Line and Polyline specific handling', () => {
    test('line should use Line object type', () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1000, 0, 0),
      ];
      const line = factory.createLine(points);
      const mesh = line.children[0];
      expect(mesh).toBeInstanceOf(THREE.Line);
    });

    test('polyline should use Line object type', () => {
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(500, 500, 0),
        new THREE.Vector3(1000, 0, 0),
      ];
      const polyline = factory.createPolyline(points);
      const mesh = polyline.children[0];
      expect(mesh).toBeInstanceOf(THREE.Line);
    });
  });
});
