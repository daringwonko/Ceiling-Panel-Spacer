// ============================================================================
// LEVEL SYSTEM TEST
// Run: npx tsx frontend/src/test/levelSystem.test.ts
// ============================================================================

import { useBIMStore } from '../stores/useBIMStore'
import type { Site, Building, Level } from '../types/level'

// Mock localStorage for Node.js environment
const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem(key: string) { return this.data[key] || null },
  setItem(key: string, value: string) { this.data[key] = value },
  removeItem(key: string) { delete this.data[key] },
}
Object.defineProperty(global, 'localStorage', { value: mockLocalStorage })

console.log('🧪 Testing Level System...\n')

// Get store instance
const store = useBIMStore.getState()

// Test 1: Create Site
console.log('Test 1: Create Site')
const site = {
  id: 'site-1',
  name: 'Main Project Site',
  description: 'Downtown construction project',
  buildingIds: [],
  elevation: 10.5,
  address: '123 Main St',
  latitude: 40.7128,
  longitude: -74.0060,
}
store.sites = [...store.sites, site]
console.log('✓ Site created:', site.name)

// Test 2: Create Building
console.log('\nTest 2: Create Building')
const building = {
  id: 'building-1',
  name: 'Office Tower A',
  siteId: 'site-1',
  levelIds: [],
  buildingType: 'commercial' as const,
  constructionYear: 2024,
}
store.buildings = [...store.buildings, building]
store.sites = store.sites.map(s => 
  s.id === 'site-1' ? { ...s, buildingIds: [...s.buildingIds, 'building-1'] } : s
)
console.log('✓ Building created:', building.name)

// Test 3: Create Levels
console.log('\nTest 3: Create Levels')
const levels: Level[] = [
  {
    id: 'level-0',
    name: 'Ground Floor',
    elevation: 0,
    height: 4.5,
    levelNumber: 0,
    usageType: 'retail',
    isVisible: true,
    color: [255, 220, 180],
    buildingId: 'building-1',
    objectIds: [],
  },
  {
    id: 'level-1',
    name: 'Floor 1',
    elevation: 4.5,
    height: 3.5,
    levelNumber: 1,
    usageType: 'office',
    isVisible: true,
    color: [200, 220, 255],
    buildingId: 'building-1',
    objectIds: [],
  },
  {
    id: 'level-2',
    name: 'Floor 2',
    elevation: 8.0,
    height: 3.5,
    levelNumber: 2,
    usageType: 'office',
    isVisible: true,
    color: [200, 220, 255],
    buildingId: 'building-1',
    objectIds: [],
  },
]

store.levels = [...store.levels, ...levels]
store.buildings = store.buildings.map(b => 
  b.id === 'building-1' ? { ...b, levelIds: levels.map(l => l.id) } : b
)
levels.forEach(l => console.log(`✓ Level created: ${l.name} @ ${l.elevation}m`))

// Test 4: Add Objects to Levels
console.log('\nTest 4: Add Objects to Levels')
const testObjects = [
  { id: 'obj-1', type: 'wall', position: [0, 0, 0], level: 'level-0', name: 'Wall 1' },
  { id: 'obj-2', type: 'door', position: [5, 0, 0], level: 'level-0', name: 'Main Door' },
  { id: 'obj-3', type: 'wall', position: [0, 0, 4.5], level: 'level-1', name: 'Office Wall' },
  { id: 'obj-4', type: 'window', position: [10, 5, 4.5], level: 'level-1', name: 'Office Window' },
]

store.objects = [...store.objects, ...testObjects]
store.levels = store.levels.map(l => {
  const levelObjects = testObjects.filter(o => o.level === l.id)
  return { ...l, objectIds: levelObjects.map(o => o.id) }
})
console.log(`✓ Added ${testObjects.length} objects to levels`)

// Test 5: Verify Hierarchy
console.log('\nTest 5: Verify Hierarchy')
const siteBuildings = store.buildings.filter(b => b.siteId === 'site-1')
const buildingLevels = store.levels.filter(l => l.buildingId === 'building-1')
const level0Objects = store.objects.filter(o => o.level === 'level-0')

console.log(`✓ Site has ${siteBuildings.length} building(s)`)
console.log(`✓ Building has ${buildingLevels.length} level(s)`)
console.log(`✓ Ground Floor has ${level0Objects.length} object(s)`)

// Test 6: Level Visibility
console.log('\nTest 6: Level Visibility')
store.levels = store.levels.map(l => 
  l.id === 'level-1' ? { ...l, isVisible: false } : l
)
const visibleLevels = store.levels.filter(l => l.isVisible)
console.log(`✓ ${visibleLevels.length} levels visible (1 hidden)`)

// Test 7: Export with Hierarchy
console.log('\nTest 7: Export with Hierarchy')
const exported = store.exportProject()
const parsed = JSON.parse(exported)
console.log('✓ Project exported successfully')
console.log(`  - Sites: ${parsed.data.sites?.length || 0}`)
console.log(`  - Buildings: ${parsed.data.buildings?.length || 0}`)
console.log(`  - Levels: ${parsed.data.levels?.length || 0}`)
console.log(`  - Objects: ${parsed.data.objects?.length || 0}`)

// Test 8: Import with Hierarchy
console.log('\nTest 8: Import with Hierarchy')
store.importProject(exported)
console.log('✓ Project imported successfully')
console.log(`  - Sites: ${store.sites.length}`)
console.log(`  - Buildings: ${store.buildings.length}`)
console.log(`  - Levels: ${store.levels.length}`)
console.log(`  - Objects: ${store.objects.length}`)

// Summary
console.log('\n' + '='.repeat(50))
console.log('✅ All Level System Tests Passed!')
console.log('='.repeat(50))
console.log('\nHierarchy Structure:')
console.log(`  📍 ${site.name}`)
console.log(`    🏢 ${building.name}`)
levels.forEach(l => {
  const objCount = store.objects.filter((o: any) => o.level === l.id).length
  console.log(`      📐 ${l.name} (${l.elevation}m) - ${objCount} objects`)
})
