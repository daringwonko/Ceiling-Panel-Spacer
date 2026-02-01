/**
 * Building Elements Test Suite
 * 
 * Comprehensive tests for WallCutter, Door/Window Presets,
 * StairsGenerator, and RoofGenerator.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Wall, Door, Window, Stairs, Roof } from '../types';
import { WallCutter, cutDoorOpening, cutWindowOpening } from '../geometry/WallCutter';
import { StairsGenerator, BUILDING_CODES } from '../geometry/StairsGenerator';
import { RoofGenerator } from '../geometry/RoofGenerator';
import {
  DOOR_PRESETS,
  getDoorPresetById,
  getDoorPresetsByCategory,
  getDoorSwingArcPath,
} from '../presets/DoorPresets';
import {
  WINDOW_PRESETS,
  getWindowPresetById,
  getWindowPresetsByCategory,
  checkEgressRequirements,
} from '../presets/WindowPresets';

describe('Building Elements', () => {
  
  // ==========================================
  // WallCutter Tests
  // ==========================================
  describe('WallCutter', () => {
    let wall: Wall;

    beforeEach(() => {
      wall = {
        id: 'wall_1',
        type: 'wall',
        name: 'Test Wall',
        position: { x: 0, y: 0 },
        rotation: 0,
        visible: true,
        locked: false,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 5000, y: 0 },
        thickness: 200,
        height: 3000,
        openings: [],
        material: 'concrete',
      };
    });

    it('should create wall outline correctly', () => {
      const cutter = new WallCutter(wall);
      const outline = cutter.getWallOutline();
      
      expect(outline).toHaveLength(4);
      expect(outline[0]).toEqual({ x: 0, y: 100 }); // Top-left
      expect(outline[2]).toEqual({ x: 5000, y: -100 }); // Bottom-right
    });

    it('should validate opening within wall bounds', () => {
      const cutter = new WallCutter(wall);
      
      const validOpening = {
        id: 'opening_1',
        type: 'door' as const,
        position: 0.5,
        width: 900,
        height: 2100,
        sillHeight: 0,
        elementId: 'door_1',
      };
      
      const result = cutter.validateOpening(validOpening);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject opening outside wall bounds', () => {
      const cutter = new WallCutter(wall);
      
      const invalidOpening = {
        id: 'opening_1',
        type: 'door' as const,
        position: 1.5, // Outside bounds
        width: 900,
        height: 2100,
        sillHeight: 0,
        elementId: 'door_1',
      };
      
      const result = cutter.validateOpening(invalidOpening);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject opening wider than wall', () => {
      const cutter = new WallCutter(wall);
      
      const wideOpening = {
        id: 'opening_1',
        type: 'door' as const,
        position: 0.5,
        width: 6000, // Wider than wall
        height: 2100,
        sillHeight: 0,
        elementId: 'door_1',
      };
      
      const result = cutter.validateOpening(wideOpening);
      expect(result.valid).toBe(false);
    });

    it('should add and remove openings', () => {
      const cutter = new WallCutter(wall);
      
      const opening = {
        id: 'opening_1',
        type: 'door' as const,
        position: 0.5,
        width: 900,
        height: 2100,
        sillHeight: 0,
        elementId: 'door_1',
      };
      
      const addResult = cutter.addOpening(opening);
      expect(addResult.success).toBe(true);
      
      const removeResult = cutter.removeOpening('opening_1');
      expect(removeResult).toBe(true);
    });

    it('should calculate wall segments with openings', () => {
      const cutter = new WallCutter(wall);
      
      // Add two openings
      cutter.addOpening({
        id: 'door_1',
        type: 'door',
        position: 0.3,
        width: 900,
        height: 2100,
        sillHeight: 0,
        elementId: 'door_1',
      });
      
      cutter.addOpening({
        id: 'window_1',
        type: 'window',
        position: 0.7,
        width: 1200,
        height: 1200,
        sillHeight: 900,
        elementId: 'window_1',
      });
      
      const segments = cutter.calculateWallSegments();
      expect(segments.length).toBeGreaterThan(0);
    });

    it('should perform boolean cut operation', () => {
      const cutter = new WallCutter(wall);
      
      cutter.addOpening({
        id: 'door_1',
        type: 'door',
        position: 0.5,
        width: 900,
        height: 2100,
        sillHeight: 0,
        elementId: 'door_1',
      });
      
      const result = cutter.cut();
      expect(result.success).toBe(true);
      expect(result.remainingPath).toBeTruthy();
      expect(result.cutPaths.length).toBe(1);
    });

    it('should calculate position on wall', () => {
      const cutter = new WallCutter(wall);
      
      const pos1 = cutter.getPositionOnWall({ x: 2500, y: 0 });
      expect(pos1).toBeCloseTo(0.5, 1);
      
      const pos2 = cutter.getPositionOnWall({ x: 0, y: 500 }); // Far from wall
      expect(pos2).toBe(-1);
    });

    it('should cut door opening via utility function', () => {
      const result = cutDoorOpening(wall, 0.5, 900, 2100);
      expect(result.success).toBe(true);
    });

    it('should cut window opening via utility function', () => {
      const result = cutWindowOpening(wall, 0.5, 1200, 1200, 900);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================
  // Door Presets Tests
  // ==========================================
  describe('DoorPresets', () => {
    it('should have preset configurations', () => {
      expect(DOOR_PRESETS.length).toBeGreaterThan(0);
    });

    it('should retrieve preset by ID', () => {
      const preset = getDoorPresetById('single_standard');
      expect(preset).toBeDefined();
      expect(preset?.width).toBe(900);
      expect(preset?.height).toBe(2100);
    });

    it('should return undefined for invalid ID', () => {
      const preset = getDoorPresetById('invalid_id');
      expect(preset).toBeUndefined();
    });

    it('should filter presets by category', () => {
      const interior = getDoorPresetsByCategory('interior');
      expect(interior.length).toBeGreaterThan(0);
      expect(interior.every((p) => p.category === 'interior')).toBe(true);
    });

    it('should generate swing arc path', () => {
      const path = getDoorSwingArcPath(
        { x: 0, y: 0 },
        900,
        'right',
        0
      );
      expect(path).toBeTruthy();
      expect(path?.startsWith('M')).toBe(true);
    });

    it('should return null for sliding doors', () => {
      const path = getDoorSwingArcPath(
        { x: 0, y: 0 },
        900,
        'sliding',
        0
      );
      expect(path).toBeNull();
    });

    it('should have valid dimensions for all presets', () => {
      DOOR_PRESETS.forEach((preset) => {
        expect(preset.width).toBeGreaterThanOrEqual(600);
        expect(preset.width).toBeLessThanOrEqual(2400);
        expect(preset.height).toBeGreaterThanOrEqual(1800);
        expect(preset.height).toBeLessThanOrEqual(2400);
      });
    });
  });

  // ==========================================
  // Window Presets Tests
  // ==========================================
  describe('WindowPresets', () => {
    it('should have preset configurations', () => {
      expect(WINDOW_PRESETS.length).toBeGreaterThan(0);
    });

    it('should retrieve preset by ID', () => {
      const preset = getWindowPresetById('casement_standard');
      expect(preset).toBeDefined();
      expect(preset?.width).toBe(900);
      expect(preset?.windowType).toBe('casement');
    });

    it('should filter presets by category', () => {
      const standard = getWindowPresetsByCategory('standard');
      expect(standard.length).toBeGreaterThan(0);
    });

    it('should check egress requirements', () => {
      const valid = checkEgressRequirements(600, 900, 900);
      expect(valid.meetsCode).toBe(false); // Too small
      
      const egress = checkEgressRequirements(600, 900, 1100);
      expect(egress.issues.length).toBeGreaterThan(0);
    });

    it('should have valid dimensions for all presets', () => {
      WINDOW_PRESETS.forEach((preset) => {
        expect(preset.width).toBeGreaterThanOrEqual(300);
        expect(preset.width).toBeLessThanOrEqual(2400);
        expect(preset.height).toBeGreaterThanOrEqual(300);
        expect(preset.height).toBeLessThanOrEqual(2400);
        expect(preset.sillHeight).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ==========================================
  // StairsGenerator Tests
  // ==========================================
  describe('StairsGenerator', () => {
    it('should calculate optimal stair dimensions', () => {
      const calc = StairsGenerator.calculateOptimalDimensions(3000);
      
      expect(calc.totalRise).toBe(3000);
      expect(calc.stairCount).toBeGreaterThanOrEqual(2);
      expect(calc.riserHeight).toBeGreaterThanOrEqual(BUILDING_CODES.minRiserHeight);
      expect(calc.riserHeight).toBeLessThanOrEqual(BUILDING_CODES.maxRiserHeight);
      expect(calc.treadDepth).toBeGreaterThanOrEqual(BUILDING_CODES.minTreadDepth);
    });

    it('should calculate from run constraint', () => {
      const calc = StairsGenerator.calculateFromRun(3000, 4000);
      
      expect(calc.totalRise).toBe(3000);
      expect(calc.totalRun).toBe(4000);
      expect(calc.stairCount).toBeGreaterThanOrEqual(2);
    });

    it('should generate steps from path', () => {
      const pathPoints = [
        { x: 0, y: 0 },
        { x: 4000, y: 0 },
      ];
      
      const steps = StairsGenerator.generateSteps(pathPoints, 3000, 1000);
      expect(steps.length).toBeGreaterThan(0);
      
      // Check step properties
      steps.forEach((step, i) => {
        expect(step.index).toBe(i);
        expect(step.cumulativeRise).toBeGreaterThan(0);
      });
    });

    it('should generate straight path', () => {
      const path = StairsGenerator.generateStraightPath(
        { x: 0, y: 0 },
        0,
        4000
      );
      
      expect(path).toHaveLength(2);
      expect(path[0]).toEqual({ x: 0, y: 0 });
      expect(path[1]).toEqual({ x: 4000, y: 0 });
    });

    it('should generate L-shaped path', () => {
      const path = StairsGenerator.generateLShapedPath(
        { x: 0, y: 0 },
        0,
        2000,
        'left',
        2000
      );
      
      expect(path.length).toBeGreaterThanOrEqual(3);
    });

    it('should generate 2D outline', () => {
      const pathPoints = [
        { x: 0, y: 0 },
        { x: 4000, y: 0 },
      ];
      
      const outline = StairsGenerator.generate2DOutline(pathPoints, 1000);
      expect(outline).toBeTruthy();
      expect(outline.startsWith('M')).toBe(true);
    });

    it('should validate stairs', () => {
      const stairs: Stairs = {
        id: 'stairs_1',
        type: 'stairs',
        name: 'Test Stairs',
        position: { x: 0, y: 0 },
        rotation: 0,
        visible: true,
        locked: false,
        totalRise: 3000,
        totalRun: 4000,
        treadDepth: 280,
        riserHeight: 175,
        stairCount: 17,
        stairWidth: 1000,
        pathType: 'straight',
        pathPoints: [{ x: 0, y: 0 }, { x: 4000, y: 0 }],
        landingDepth: 1200,
        hasLanding: false,
        material: 'concrete',
      };
      
      const validation = StairsGenerator.validateStairs(stairs);
      expect(validation.valid).toBe(true);
    });

    it('should reject invalid stairs', () => {
      const stairs: Stairs = {
        id: 'stairs_1',
        type: 'stairs',
        name: 'Test Stairs',
        position: { x: 0, y: 0 },
        rotation: 0,
        visible: true,
        locked: false,
        totalRise: -100, // Invalid
        totalRun: 4000,
        treadDepth: 280,
        riserHeight: 175,
        stairCount: 17,
        stairWidth: 1000,
        pathType: 'straight',
        pathPoints: [{ x: 0, y: 0 }, { x: 4000, y: 0 }],
        landingDepth: 1200,
        hasLanding: false,
        material: 'concrete',
      };
      
      const validation = StairsGenerator.validateStairs(stairs);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should format stair dimensions', () => {
      const calc = StairsGenerator.calculateOptimalDimensions(3000);
      const formatted = StairsGenerator.formatStairDimensions(calc);
      
      expect(formatted).toContain('stairs');
      expect(formatted).toContain('Riser');
      expect(formatted).toContain('Tread');
    });
  });

  // ==========================================
  // RoofGenerator Tests
  // ==========================================
  describe('RoofGenerator', () => {
    const basePoints = [
      { x: 0, y: 0 },
      { x: 5000, y: 0 },
      { x: 5000, y: 4000 },
      { x: 0, y: 4000 },
    ];

    it('should check if wire is closed', () => {
      expect(RoofGenerator.isClosedWire(basePoints)).toBe(false);
      
      const closed = [...basePoints, basePoints[0]];
      expect(RoofGenerator.isClosedWire(closed)).toBe(true);
    });

    it('should close an open wire', () => {
      const closed = RoofGenerator.closeWire(basePoints);
      expect(closed.length).toBe(basePoints.length + 1);
      expect(closed[closed.length - 1]).toEqual(closed[0]);
    });

    it('should calculate polygon area', () => {
      const area = RoofGenerator.calculatePolygonArea(basePoints);
      expect(area).toBeCloseTo(20000000, 0); // 5000 * 4000 = 20,000,000 mm²
    });

    it('should calculate centroid', () => {
      const centroid = RoofGenerator.calculateCentroid(basePoints);
      expect(centroid.x).toBeCloseTo(2500, 0);
      expect(centroid.y).toBeCloseTo(2000, 0);
    });

    it('should calculate ridge height', () => {
      const height = RoofGenerator.calculateRidgeHeight(4000, 30);
      // Height = (span/2) * tan(30°) = 2000 * 0.577 = 1155
      expect(height).toBeCloseTo(1155, 0);
    });

    it('should generate gable roof', () => {
      const roof: Roof = {
        id: 'roof_1',
        type: 'roof',
        name: 'Test Roof',
        position: { x: 2500, y: 2000 },
        rotation: 0,
        visible: true,
        locked: false,
        slopeAngle: 30,
        overhang: 300,
        roofType: 'gable',
        thickness: 200,
        baseWireId: null,
        basePoints,
        ridgeHeight: 0,
        material: 'tile',
      };
      
      const calc = RoofGenerator.generateRoof(roof);
      expect(calc.ridgeHeight).toBeGreaterThan(0);
      expect(calc.roofArea).toBeGreaterThan(0);
      expect(calc.volume).toBeGreaterThan(0);
      expect(calc.faces.length).toBeGreaterThan(0);
    });

    it('should generate hip roof', () => {
      const roof: Roof = {
        id: 'roof_1',
        type: 'roof',
        name: 'Test Roof',
        position: { x: 2500, y: 2000 },
        rotation: 0,
        visible: true,
        locked: false,
        slopeAngle: 30,
        overhang: 300,
        roofType: 'hip',
        thickness: 200,
        baseWireId: null,
        basePoints,
        ridgeHeight: 0,
        material: 'tile',
      };
      
      const calc = RoofGenerator.generateRoof(roof);
      expect(calc.ridgeHeight).toBeGreaterThan(0);
      expect(calc.faces.length).toBeGreaterThanOrEqual(4);
    });

    it('should generate shed roof', () => {
      const roof: Roof = {
        id: 'roof_1',
        type: 'roof',
        name: 'Test Roof',
        position: { x: 2500, y: 2000 },
        rotation: 0,
        visible: true,
        locked: false,
        slopeAngle: 15,
        overhang: 200,
        roofType: 'shed',
        thickness: 200,
        baseWireId: null,
        basePoints,
        ridgeHeight: 0,
        material: 'metal',
      };
      
      const calc = RoofGenerator.generateRoof(roof);
      expect(calc.ridgeHeight).toBeGreaterThan(0);
    });

    it('should generate flat roof', () => {
      const roof: Roof = {
        id: 'roof_1',
        type: 'roof',
        name: 'Test Roof',
        position: { x: 2500, y: 2000 },
        rotation: 0,
        visible: true,
        locked: false,
        slopeAngle: 2,
        overhang: 0,
        roofType: 'flat',
        thickness: 200,
        baseWireId: null,
        basePoints,
        ridgeHeight: 0,
        material: 'membrane',
      };
      
      const calc = RoofGenerator.generateRoof(roof);
      expect(calc.ridgeHeight).toBe(50); // Default flat roof height
      expect(calc.faces.length).toBe(1);
    });

    it('should generate 2D outline', () => {
      const roof: Roof = {
        id: 'roof_1',
        type: 'roof',
        name: 'Test Roof',
        position: { x: 2500, y: 2000 },
        rotation: 0,
        visible: true,
        locked: false,
        slopeAngle: 30,
        overhang: 300,
        roofType: 'gable',
        thickness: 200,
        baseWireId: null,
        basePoints,
        ridgeHeight: 0,
        material: 'tile',
      };
      
      const outline = RoofGenerator.generate2DOutline(roof);
      expect(outline).toBeTruthy();
      expect(outline.startsWith('M')).toBe(true);
    });

    it('should validate roof', () => {
      const roof: Roof = {
        id: 'roof_1',
        type: 'roof',
        name: 'Test Roof',
        position: { x: 2500, y: 2000 },
        rotation: 0,
        visible: true,
        locked: false,
        slopeAngle: 30,
        overhang: 300,
        roofType: 'gable',
        thickness: 200,
        baseWireId: null,
        basePoints,
        ridgeHeight: 0,
        material: 'tile',
      };
      
      const validation = RoofGenerator.validateRoof(roof);
      expect(validation.valid).toBe(true);
    });

    it('should reject invalid roof', () => {
      const roof: Roof = {
        id: 'roof_1',
        type: 'roof',
        name: 'Test Roof',
        position: { x: 0, y: 0 },
        rotation: 0,
        visible: true,
        locked: false,
        slopeAngle: -10, // Invalid
        overhang: 300,
        roofType: 'gable',
        thickness: 200,
        baseWireId: null,
        basePoints: [], // Invalid - too few points
        ridgeHeight: 0,
        material: 'tile',
      };
      
      const validation = RoofGenerator.validateRoof(roof);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should handle complex roof shapes', () => {
      const lShapedBase = [
        { x: 0, y: 0 },
        { x: 3000, y: 0 },
        { x: 3000, y: 2000 },
        { x: 5000, y: 2000 },
        { x: 5000, y: 4000 },
        { x: 0, y: 4000 },
      ];
      
      const roof: Roof = {
        id: 'roof_2',
        type: 'roof',
        name: 'L-Shaped Roof',
        position: { x: 2500, y: 2000 },
        rotation: 0,
        visible: true,
        locked: false,
        slopeAngle: 30,
        overhang: 300,
        roofType: 'hip',
        thickness: 200,
        baseWireId: null,
        basePoints: lShapedBase,
        ridgeHeight: 0,
        material: 'tile',
      };
      
      const calc = RoofGenerator.generateRoof(roof);
      expect(calc.ridgeHeight).toBeGreaterThan(0);
      expect(calc.faces.length).toBeGreaterThan(0);
    });
  });
});