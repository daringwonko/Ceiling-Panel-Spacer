import { describe, it, expect } from 'vitest'
import { LineTool } from '../lineTool'
import { RectangleTool } from '../rectangleTool'
import { CircleTool } from '../circleTool'

describe('LineTool', () => {
  it('should create a line from two points', () => {
    const tool = new LineTool()
    
    const start = { x: 0, y: 0 }
    const end = { x: 100, y: 0 }
    
    const result = tool.createLine(start, end)
    
    expect(result).not.toBeNull()
    expect(result.type).toBe('line')
    expect(result.geometry.start).toEqual(start)
    expect(result.geometry.end).toEqual(end)
  })

  it('should calculate correct line length', () => {
    const tool = new LineTool()
    
    const start = { x: 0, y: 0 }
    const end = { x: 100, y: 100 }
    
    const line = tool.createLine(start, end)
    const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
    
    expect(line.properties.length).toBeCloseTo(length, 2)
  })

  it('should snap to horizontal in ortho mode', () => {
    const tool = new LineTool({ orthoMode: true })
    
    const start = { x: 0, y: 0 }
    const end = { x: 50, y: 100 }
    
    const line = tool.createLine(start, end)
    
    // Should snap to horizontal (y unchanged) or vertical (x unchanged)
    const dx = Math.abs(line.geometry.end.x - line.geometry.start.x)
    const dy = Math.abs(line.geometry.end.y - line.geometry.start.y)
    
    expect(dx === 0 || dy === 0).toBe(true)
  })

  it('should calculate correct midpoint', () => {
    const tool = new LineTool()
    
    const start = { x: 0, y: 0 }
    const end = { x: 200, y: 100 }
    
    const line = tool.createLine(start, end)
    
    const expectedMidpoint = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    }
    
    expect(line.properties.midpoint).toEqual(expectedMidpoint)
  })
})

describe('RectangleTool', () => {
  it('should create a rectangle from two corners', () => {
    const tool = new RectangleTool()
    
    const start = { x: 0, y: 0 }
    const end = { x: 100, y: 50 }
    
    const result = tool.createRectangle(start, end)
    
    expect(result).not.toBeNull()
    expect(result.type).toBe('rectangle')
    expect(result.geometry.x).toBe(0)
    expect(result.geometry.y).toBe(0)
    expect(result.geometry.width).toBe(100)
    expect(result.geometry.height).toBe(50)
  })

  it('should calculate correct area', () => {
    const tool = new RectangleTool()
    
    const start = { x: 0, y: 0 }
    const end = { x: 200, y: 150 }
    
    const rectangle = tool.createRectangle(start, end)
    
    expect(rectangle.properties.area).toBe(200 * 150)
  })

  it('should calculate correct perimeter', () => {
    const tool = new RectangleTool()
    
    const start = { x: 0, y: 0 }
    const end = { x: 100, y: 50 }
    
    const rectangle = tool.createRectangle(start, end)
    const perimeter = 2 * (100 + 50)
    
    expect(rectangle.properties.perimeter).toBe(perimeter)
  })

  it('should handle negative dimensions', () => {
    const tool = new RectangleTool()
    
    const start = { x: 100, y: 100 }
    const end = { x: 50, y: 50 }
    
    const result = tool.createRectangle(start, end)
    
    // Should normalize to positive dimensions
    expect(result.geometry.width).toBe(Math.abs(100 - 50))
    expect(result.geometry.height).toBe(Math.abs(100 - 50))
  })
})

describe('CircleTool', () => {
  it('should create a circle from center and radius', () => {
    const tool = new CircleTool()
    
    const center = { x: 50, y: 50 }
    const radius = 25
    
    const result = tool.createCircle(center, radius)
    
    expect(result).not.toBeNull()
    expect(result.type).toBe('circle')
    expect(result.geometry.center).toEqual(center)
    expect(result.geometry.radius).toBe(radius)
  })

  it('should calculate correct area', () => {
    const tool = new CircleTool()
    
    const center = { x: 0, y: 0 }
    const radius = 10
    
    const circle = tool.createCircle(center, radius)
    const area = Math.PI * Math.pow(radius, 2)
    
    expect(circle.properties.area).toBeCloseTo(area, 2)
  })

  it('should calculate correct circumference', () => {
    const tool = new CircleTool()
    
    const center = { x: 0, y: 0 }
    const radius = 5
    
    const circle = tool.createCircle(center, radius)
    const circumference = 2 * Math.PI * radius
    
    expect(circle.properties.circumference).toBeCloseTo(circumference, 2)
  })

  it('should reject negative radius', () => {
    const tool = new CircleTool()
    
    const center = { x: 50, y: 50 }
    const negativeRadius = -10
    
    const result = tool.createCircle(center, negativeRadius)
    
    expect(result).toBeNull()
  })

  it('should reject zero radius', () => {
    const tool = new CircleTool()
    
    const center = { x: 50, y: 50 }
    const zeroRadius = 0
    
    const result = tool.createCircle(center, zeroRadius)
    
    expect(result).toBeNull()
  })
})
