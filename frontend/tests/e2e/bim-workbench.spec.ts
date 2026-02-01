import { test, expect, describe } from '@playwright/test'

describe('BIM Workbench E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bim')
    await page.waitForLoadState('networkidle')
  })

  describe('Project Management', () => {
    test('user can create a new project', async ({ page }) => {
      // Click new project button
      await page.click('button:has-text("New Project")')
      
      // Fill in project name
      await page.fill('input[placeholder="Project name"]', 'E2E Test Project')
      
      // Create project
      await page.click('button:has-text("Create")')
      
      // Verify project was created
      await expect(page.locator('text=E2E Test Project')).toBeVisible()
    })

    test('user can save project', async ({ page }) => {
      // Create some objects first
      await page.click('button:has-text("Line")')
      const canvas = page.locator('[data-testid="drafting-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 200, y: 100 } })
      
      // Save project
      await page.click('button:has-text("Save")')
      
      // Verify save notification
      await expect(page.locator('text=Project saved')).toBeVisible()
    })
  })

  describe('2D Drafting Tools', () => {
    test('user can draw a line', async ({ page }) => {
      // Select line tool
      await page.click('button:has-text("Line")')
      
      // Draw on canvas
      const canvas = page.locator('[data-testid="drafting-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 200, y: 100 } })
      
      // Verify line created
      await expect(page.locator('[data-object-type="line"]')).toHaveCount(1)
    })

    test('user can draw a rectangle', async ({ page }) => {
      await page.click('button:has-text("Rectangle")')
      
      const canvas = page.locator('[data-testid="drafting-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 200, y: 150 } })
      
      await expect(page.locator('[data-object-type="rectangle"]')).toHaveCount(1)
    })

    test('user can draw a circle', async ({ page }) => {
      await page.click('button:has-text("Circle")')
      
      const canvas = page.locator('[data-testid="drafting-canvas"]')
      await canvas.click({ position: { x: 150, y: 150 } })
      
      await expect(page.locator('[data-object-type="circle"]')).toHaveCount(1)
    })

    test('ortho mode constrains lines to horizontal/vertical', async ({ page }) => {
      // Enable ortho mode
      await page.click('button:has-text("Ortho")')
      
      // Select line tool
      await page.click('button:has-text("Line")')
      
      // Draw diagonal line
      const canvas = page.locator('[data-testid="drafting-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 150, y: 150 } })
      
      // Line should be horizontal or vertical
      const line = page.locator('[data-object-type="line"]')
      const boundingBox = await line.boundingBox()
      
      if (boundingBox) {
        const width = boundingBox.width
        const height = boundingBox.height
        // One dimension should be very small (horizontal or vertical)
        expect(width < 5 || height < 5).toBe(true)
      }
    })
  })

  describe('3D Modeling', () => {
    test('user can switch to 3D view', async ({ page }) => {
      await page.click('button:has-text("3D")')
      await expect(page.locator('[data-testid="bim-3d-canvas"]')).toBeVisible()
    })

    test('user can create a wall', async ({ page }) => {
      // Switch to 3D mode
      await page.click('button:has-text("3D")')
      
      // Select wall tool
      await page.click('button:has-text("Wall")')
      
      // Draw on 3D canvas
      const canvas = page.locator('[data-testid="bim-3d-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 300, y: 100 } })
      
      // Verify wall created
      await expect(page.locator('[data-object-type="wall"]')).toHaveCount(1)
    })

    test('user can create a door', async ({ page }) => {
      await page.click('button:has-text("3D")')
      await page.click('button:has-text("Door")')
      
      const canvas = page.locator('[data-testid="bim-3d-canvas"]')
      await canvas.click({ position: { x: 200, y: 100 } })
      
      await expect(page.locator('[data-object-type="door"]')).toHaveCount(1)
    })

    test('user can create a window', async ({ page }) => {
      await page.click('button:has-text("3D")')
      await page.click('button:has-text("Window")')
      
      const canvas = page.locator('[data-testid="bim-3d-canvas"]')
      await canvas.click({ position: { x: 150, y: 100 } })
      
      await expect(page.locator('[data-object-type="window"]')).toHaveCount(1)
    })
  })

  describe('Object Selection & Manipulation', () => {
    test('user can select an object', async ({ page }) => {
      // Create a line first
      await page.click('button:has-text("Line")')
      const canvas = page.locator('[data-testid="drafting-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 200, y: 100 } })
      
      // Click on the line to select it
      await page.locator('[data-object-type="line"]').click()
      
      // Verify selection
      await expect(page.locator('[data-selected="true"]')).toHaveCount(1)
    })

    test('user can select multiple objects', async ({ page }) => {
      // Create multiple objects
      await page.click('button:has-text("Line")')
      const canvas = page.locator('[data-testid="drafting-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 200, y: 100 } })
      
      await page.click('button:has-text("Rectangle")')
      await canvas.click({ position: { x: 300, y: 100 } })
      await canvas.click({ position: { x: 350, y: 150 } })
      
      // Select first object
      await page.locator('[data-object-type="line"]').click()
      
      // Hold shift and select second object
      await page.keyboard.down('Shift')
      await page.locator('[data-object-type="rectangle"]').click()
      await page.keyboard.up('Shift')
      
      // Verify multi-select
      await expect(page.locator('[data-selected="true"]')).toHaveCount(2)
    })

    test('user can delete selected object', async ({ page }) => {
      // Create object
      await page.click('button:has-text("Line")')
      const canvas = page.locator('[data-testid="drafting-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 200, y: 100 } })
      
      // Select and delete
      await page.locator('[data-object-type="line"]').click()
      await page.keyboard.press('Delete')
      
      // Verify deletion
      await expect(page.locator('[data-object-type="line"]')).toHaveCount(0)
    })
  })

  describe('Undo/Redo', () => {
    test('user can undo an action', async ({ page }) => {
      // Create object
      await page.click('button:has-text("Line")')
      const canvas = page.locator('[data-testid="drafting-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 200, y: 100 } })
      
      // Verify object created
      await expect(page.locator('[data-object-type="line"]')).toHaveCount(1)
      
      // Undo
      await page.keyboard.press('Control+z')
      
      // Verify object removed
      await expect(page.locator('[data-object-type="line"]')).toHaveCount(0)
    })

    test('user can redo an undone action', async ({ page }) => {
      // Create object
      await page.click('button:has-text("Line")')
      const canvas = page.locator('[data-testid="drafting-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 200, y: 100 } })
      
      // Undo
      await page.keyboard.press('Control+z')
      
      // Verify object removed
      await expect(page.locator('[data-object-type="line"]')).toHaveCount(0)
      
      // Redo
      await page.keyboard.press('Control+y')
      
      // Verify object restored
      await expect(page.locator('[data-object-type="line"]')).toHaveCount(1)
    })
  })

  describe('View Controls', () => {
    test('user can toggle grid', async ({ page }) => {
      // Grid should be visible initially
      await expect(page.locator('[data-grid-visible="true"]')).toBeVisible()
      
      // Toggle grid off
      await page.click('button:has-text("Grid")')
      
      // Verify grid hidden
      await expect(page.locator('[data-grid-visible="false"]')).toBeVisible()
    })

    test('user can toggle snapping', async ({ page }) => {
      // Snap should be enabled initially
      await expect(page.locator('[data-snap-enabled="true"]')).toBeVisible()
      
      // Toggle snap off
      await page.click('button:has-text("Snap")')
      
      // Verify snap disabled
      await expect(page.locator('[data-snap-enabled="false"]')).toBeVisible()
    })

    test('user can toggle ortho mode', async ({ page }) => {
      // Ortho should be disabled initially
      await expect(page.locator('[data-ortho-enabled="false"]')).toBeVisible()
      
      // Toggle ortho on
      await page.click('button:has-text("Ortho")')
      
      // Verify ortho enabled
      await expect(page.locator('[data-ortho-enabled="true"]')).toBeVisible()
    })
  })

  describe('Export', () => {
    test('user can export to IFC', async ({ page }) => {
      // Create a wall first
      await page.click('button:has-text("3D")')
      await page.click('button:has-text("Wall")')
      const canvas = page.locator('[data-testid="bim-3d-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 300, y: 100 } })
      
      // Open export menu
      await page.click('button:has-text("Export")')
      await page.click('text=IFC Export')
      
      // Verify download started
      const download = await page.waitForEvent('download')
      expect(download.suggestedFilename()).toContain('.ifc')
    })

    test('user can export to SVG', async ({ page }) => {
      // Create object
      await page.click('button:has-text("Line")')
      const canvas = page.locator('[data-testid="drafting-canvas"]')
      await canvas.click({ position: { x: 100, y: 100 } })
      await canvas.click({ position: { x: 200, y: 100 } })
      
      // Open export menu
      await page.click('button:has-text("Export")')
      await page.click('text=SVG Export')
      
      // Verify download started
      const download = await page.waitForEvent('download')
      expect(download.suggestedFilename()).toContain('.svg')
    })
  })
})
