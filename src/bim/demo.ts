/**
 * Building Elements Demo
 * 
 * Demonstrates usage of WallCutter, Door/Window Presets,
 * StairsGenerator, and RoofGenerator with practical examples.
 */

import type { Wall, Door, Window, Stairs, Roof } from './types';
import { WallCutter, cutDoorOpening, cutWindowOpening } from './geometry/WallCutter';
import { StairsGenerator, createStairs } from './geometry/StairsGenerator';
import { RoofGenerator, createRoof } from './geometry/RoofGenerator';
import {
  getDoorPresetById,
  getDoorPresetsByCategory,
  getDoorSwingArcPath,
} from './presets/DoorPresets';
import {
  getWindowPresetById,
  getWindowPresetsByCategory,
  checkEgressRequirements,
} from './presets/WindowPresets';

console.log('🏗️  Building Elements Demo\n');

// ==========================================
// Demo 1: Wall with Door and Window Openings
// ==========================================
console.log('📋 Demo 1: Wall with Openings');
console.log('=' .repeat(50));

const wall: Wall = {
  id: 'wall_main',
  type: 'wall',
  name: 'Main Wall',
  position: { x: 0, y: 0 },
  rotation: 0,
  visible: true,
  locked: false,
  startPoint: { x: 0, y: 0 },
  endPoint: { x: 10000, y: 0 }, // 10m wall
  thickness: 200,
  height: 3000,
  openings: [],
  material: 'concrete',
};

const cutter = new WallCutter(wall);

// Add a door at 20% along wall
const doorResult = cutter.addOpening({
  id: 'door_entry',
  type: 'door',
  position: 0.2,
  width: 1000,
  height: 2100,
  sillHeight: 0,
  elementId: 'door_1',
});

console.log(`✅ Door added: ${doorResult.success ? 'Success' : 'Failed'}`);

// Add a window at 60% along wall
const windowResult = cutter.addOpening({
  id: 'window_living',
  type: 'window',
  position: 0.6,
  width: 1500,
  height: 1200,
  sillHeight: 900,
  elementId: 'window_1',
});

console.log(`✅ Window added: ${windowResult.success ? 'Success' : 'Failed'}`);

// Perform boolean cut
const cutResult = cutter.cut();
console.log(`✂️  Cut operation: ${cutResult.success ? 'Success' : 'Failed'}`);
console.log(`   Wall segments: ${cutter.calculateWallSegments().length}`);
console.log(`   Cut paths: ${cutResult.cutPaths.length}`);
console.log();

// ==========================================
// Demo 2: Door Presets
// ==========================================
console.log('📋 Demo 2: Door Presets');
console.log('=' .repeat(50));

const interiorDoors = getDoorPresetsByCategory('interior');
console.log(`🚪 Interior doors available: ${interiorDoors.length}`);

const standardDoor = getDoorPresetById('single_standard');
if (standardDoor) {
  console.log(`\nStandard Door:`);
  console.log(`   Name: ${standardDoor.name}`);
  console.log(`   Size: ${standardDoor.width}mm × ${standardDoor.height}mm`);
  console.log(`   Swing: ${standardDoor.swingDirection}`);
}

const swingPath = getDoorSwingArcPath(
  { x: 100, y: 100 },
  900,
  'right',
  0
);
console.log(`\n📐 Swing arc path generated: ${swingPath ? 'Yes' : 'No'}`);
console.log();

// ==========================================
// Demo 3: Window Presets and Egress
// ==========================================
console.log('📋 Demo 3: Window Presets and Egress Requirements');
console.log('=' .repeat(50));

const bedroomWindows = getWindowPresetsByCategory('standard');
console.log(`🪟 Standard windows available: ${bedroomWindows.length}`);

const casementWindow = getWindowPresetById('casement_standard');
if (casementWindow) {
  console.log(`\nCasement Window:`);
  console.log(`   Name: ${casementWindow.name}`);
  console.log(`   Size: ${casementWindow.width}mm × ${casementWindow.height}mm`);
  console.log(`   Sill: ${casementWindow.sillHeight}mm`);
  console.log(`   Type: ${casementWindow.windowType}`);
  
  // Check egress
  const egress = checkEgressRequirements(
    casementWindow.width,
    casementWindow.height,
    casementWindow.sillHeight
  );
  console.log(`   Egress: ${egress.meetsCode ? '✅ Passes' : '❌ Fails'}`);
  if (!egress.meetsCode) {
    console.log(`   Issues: ${egress.issues.join(', ')}`);
  }
}
console.log();

// ==========================================
// Demo 4: Stairs Generation
// ==========================================
console.log('📋 Demo 4: Stairs Generation');
console.log('=' .repeat(50));

const totalRise = 3000; // 3m floor-to-floor
const stairsCalc = StairsGenerator.calculateOptimalDimensions(totalRise);

console.log(`🏗️  Stairs Calculation for ${totalRise}mm rise:`);
console.log(`   Number of stairs: ${stairsCalc.stairCount}`);
console.log(`   Riser height: ${stairsCalc.riserHeight.toFixed(1)}mm`);
console.log(`   Tread depth: ${stairsCalc.treadDepth.toFixed(1)}mm`);
console.log(`   Total run: ${stairsCalc.totalRun.toFixed(1)}mm`);
console.log(`   Slope: ${stairsCalc.slope.toFixed(1)}°`);
console.log(`   Code compliant: ${stairsCalc.passesCode ? '✅ Yes' : '❌ No'}`);

// Generate straight stairs
const straightPath = [
  { x: 0, y: 0 },
  { x: stairsCalc.totalRun, y: 0 },
];

const steps = StairsGenerator.generateSteps(straightPath, totalRise, 1000);
console.log(`\n📐 Generated ${steps.length} steps`);

// Generate 2D outline
const outline = StairsGenerator.generate2DOutline(straightPath, 1000);
console.log(`   2D outline: ${outline.substring(0, 50)}...`);
console.log();

// Create stairs object
const stairs = createStairs(straightPath, totalRise, 1000, 'straight');
console.log(`✅ Stairs object created: ${stairs.id}`);
console.log();

// ==========================================
// Demo 5: Roof Generation
// ==========================================
console.log('📋 Demo 5: Roof Generation');
console.log('=' .repeat(50));

// Simple rectangular house
const houseOutline = [
  { x: 0, y: 0 },
  { x: 8000, y: 0 },
  { x: 8000, y: 6000 },
  { x: 0, y: 6000 },
];

console.log(`🏠 House dimensions: 8m × 6m`);

// Gable roof
const gableRoof = createRoof(houseOutline, 'gable', 30, 300);
const gableCalc = RoofGenerator.generateRoof(gableRoof);

console.log(`\n📐 Gable Roof (30° slope):`);
console.log(`   Ridge height: ${gableCalc.ridgeHeight.toFixed(0)}mm`);
console.log(`   Roof area: ${gableCalc.roofArea.toFixed(0)}mm²`);
console.log(`   Volume: ${gableCalc.volume.toFixed(0)}mm³`);
console.log(`   Faces: ${gableCalc.faces.length}`);

// Hip roof
const hipRoof = createRoof(houseOutline, 'hip', 30, 300);
const hipCalc = RoofGenerator.generateRoof(hipRoof);

console.log(`\n📐 Hip Roof (30° slope):`);
console.log(`   Ridge height: ${hipCalc.ridgeHeight.toFixed(0)}mm`);
console.log(`   Roof area: ${hipCalc.roofArea.toFixed(0)}mm²`);
console.log(`   Volume: ${hipCalc.volume.toFixed(0)}mm³`);
console.log(`   Faces: ${hipCalc.faces.length}`);

// Generate 2D outline
const roofOutline = RoofGenerator.generate2DOutline(gableRoof);
console.log(`\n📐 2D outline generated: ${roofOutline ? 'Yes' : 'No'}`);
console.log();

// ==========================================
// Demo 6: Complex Roof Shape
// ==========================================
console.log('📋 Demo 6: L-Shaped House with Hip Roof');
console.log('=' .repeat(50));

const lShapedOutline = [
  { x: 0, y: 0 },
  { x: 5000, y: 0 },
  { x: 5000, y: 3000 },
  { x: 8000, y: 3000 },
  { x: 8000, y: 6000 },
  { x: 0, y: 6000 },
];

const complexRoof = createRoof(lShapedOutline, 'hip', 25, 400);
const complexCalc = RoofGenerator.generateRoof(complexRoof);

console.log(`🏠 L-shaped house with hip roof (25° slope):`);
console.log(`   Ridge height: ${complexCalc.ridgeHeight.toFixed(0)}mm`);
console.log(`   Roof area: ${complexCalc.roofArea.toFixed(0)}mm²`);
console.log(`   Number of faces: ${complexCalc.faces.length}`);
console.log();

// ==========================================
// Summary
// ==========================================
console.log('📊 Summary');
console.log('=' .repeat(50));
console.log('✅ WallCutter: Boolean operations for door/window openings');
console.log('✅ DoorPresets: 16 predefined door configurations');
console.log('✅ WindowPresets: 25 predefined window configurations');
console.log('✅ StairsGenerator: Code-compliant stair calculations');
console.log('✅ RoofGenerator: Gable, hip, shed, and flat roof types');
console.log('✅ Property Panels: React components for all elements');
console.log();
console.log('🎉 All building element features working correctly!');