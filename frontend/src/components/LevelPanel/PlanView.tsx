import * as React from "react"
import { useMemo, useRef, useEffect, useState, useCallback } from "react"
import { cn } from "../../utils/cn"
import { useLevels } from "../../hooks/useLevels"
import { rgbToCss } from "../../utils/levelUtils"
import type { Level } from "../../types/level"

interface PlanViewProps {
  levelId: string
  width?: number
  height?: number
  className?: string
  showGrid?: boolean
  backgroundColor?: string
}

interface PlanViewObject {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  color: string
}

export function PlanView({
  levelId,
  width = 400,
  height = 300,
  className,
  showGrid = true,
  backgroundColor = '#1e293b',
}: PlanViewProps) {
  const { getLevelById, getObjectsByLevel } = useLevels()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  
  const level = getLevelById(levelId)
  const objects = getObjectsByLevel(levelId)

  // Calculate bounding box and scale
  const { bounds, center } = useMemo(() => {
    if (objects.length === 0) {
      return {
        bounds: { minX: -10, minY: -10, maxX: 10, maxY: 10 },
        center: { x: 0, y: 0 },
      }
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    objects.forEach((obj: any) => {
      const [x, y] = obj.position
      const size = 2 // Default size if not specified
      minX = Math.min(minX, x - size)
      minY = Math.min(minY, y - size)
      maxX = Math.max(maxX, x + size)
      maxY = Math.max(maxY, y + size)
    })

    // Add padding
    const padding = Math.max(maxX - minX, maxY - minY) * 0.1
    minX -= padding
    minY -= padding
    maxX += padding
    maxY += padding

    return {
      bounds: { minX, minY, maxX, maxY },
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    }
  }, [objects])

  // Calculate scale to fit content
  useEffect(() => {
    const contentWidth = bounds.maxX - bounds.minX
    const contentHeight = bounds.maxY - bounds.minY
    
    const scaleX = (width - 40) / contentWidth
    const scaleY = (height - 40) / contentHeight
    const newScale = Math.min(scaleX, scaleY, 50) // Max scale of 50
    
    setScale(newScale)
    setOffset({
      x: width / 2 - center.x * newScale,
      y: height / 2 - center.y * newScale,
    })
  }, [bounds, center, width, height])

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !level) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Save context for transformations
    ctx.save()
    
    // Apply offset and scale (flip Y for CAD coordinates)
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, -scale)

    // Draw grid
    if (showGrid) {
      drawGrid(ctx, bounds, scale)
    }

    // Draw level boundary (if has bounds)
    if (bounds.maxX - bounds.minX > 0) {
      ctx.strokeStyle = rgbToCss(level.color)
      ctx.lineWidth = 2 / scale
      ctx.setLineDash([5 / scale, 5 / scale])
      ctx.strokeRect(
        bounds.minX,
        bounds.minY,
        bounds.maxX - bounds.minX,
        bounds.maxY - bounds.minY
      )
      ctx.setLineDash([])
    }

    // Draw objects
    objects.forEach((obj: any) => {
      drawObject(ctx, obj, scale)
    })

    // Restore context
    ctx.restore()

    // Draw labels (not scaled)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Level: ${level.name}`, 10, 20)
    ctx.fillText(`Elevation: ${level.elevation.toFixed(2)}m`, 10, 35)
    ctx.fillText(`Objects: ${objects.length}`, 10, 50)
    ctx.fillText(`Scale: 1:${(1/scale).toFixed(0)}`, 10, 65)
  }, [level, objects, bounds, offset, scale, width, height, backgroundColor, showGrid])

  // Draw grid lines
  const drawGrid = (ctx: CanvasRenderingContext2D, bounds: any, scale: number) => {
    const gridSize = 1 // 1 meter grid
    const majorGridSize = 5 // 5 meter major grid
    
    ctx.lineWidth = 0.5 / scale
    
    // Minor grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)'
    ctx.beginPath()
    for (let x = Math.floor(bounds.minX / gridSize) * gridSize; x <= bounds.maxX; x += gridSize) {
      ctx.moveTo(x, bounds.minY)
      ctx.lineTo(x, bounds.maxY)
    }
    for (let y = Math.floor(bounds.minY / gridSize) * gridSize; y <= bounds.maxY; y += gridSize) {
      ctx.moveTo(bounds.minX, y)
      ctx.lineTo(bounds.maxX, y)
    }
    ctx.stroke()
    
    // Major grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'
    ctx.beginPath()
    for (let x = Math.floor(bounds.minX / majorGridSize) * majorGridSize; x <= bounds.maxX; x += majorGridSize) {
      ctx.moveTo(x, bounds.minY)
      ctx.lineTo(x, bounds.maxY)
    }
    for (let y = Math.floor(bounds.minY / majorGridSize) * majorGridSize; y <= bounds.maxY; y += majorGridSize) {
      ctx.moveTo(bounds.minX, y)
      ctx.lineTo(bounds.maxX, y)
    }
    ctx.stroke()
    
    // Origin axes
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)'
    ctx.lineWidth = 1 / scale
    ctx.beginPath()
    ctx.moveTo(0, bounds.minY)
    ctx.lineTo(0, bounds.maxY)
    ctx.moveTo(bounds.minX, 0)
    ctx.lineTo(bounds.maxX, 0)
    ctx.stroke()
  }

  // Draw individual object
  const drawObject = (ctx: CanvasRenderingContext2D, obj: any, scale: number) => {
    const [x, y] = obj.position
    const [rx, ry, rz] = obj.rotation || [0, 0, 0]
    const color = obj.color || '#64748b'
    
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rz)
    
    // Get object dimensions from geometry or use defaults
    let w = 1, h = 1
    if (obj.geometry) {
      if (obj.geometry.width) w = obj.geometry.width
      if (obj.geometry.height) h = obj.geometry.height
      if (obj.geometry.length) w = obj.geometry.length
    }
    
    // Draw based on object type
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 2 / scale
    
    switch (obj.type) {
      case 'wall':
        ctx.fillRect(-w/2, -h/2, w, h)
        break
      case 'column':
        ctx.beginPath()
        ctx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'door':
        ctx.strokeRect(-w/2, -h/2, w, h)
        ctx.beginPath()
        ctx.arc(-w/2, -h/2, w, 0, Math.PI / 2)
        ctx.stroke()
        break
      case 'window':
        ctx.strokeRect(-w/2, -h/2, w, h)
        ctx.beginPath()
        ctx.moveTo(0, -h/2)
        ctx.lineTo(0, h/2)
        ctx.moveTo(-w/2, 0)
        ctx.lineTo(w/2, 0)
        ctx.stroke()
        break
      case 'rectangle':
        ctx.strokeRect(-w/2, -h/2, w, h)
        break
      case 'circle':
        ctx.beginPath()
        ctx.arc(0, 0, w/2, 0, Math.PI * 2)
        ctx.stroke()
        break
      case 'line':
      case 'polyline':
        if (obj.geometry?.points && obj.geometry.points.length > 1) {
          ctx.beginPath()
          const points = obj.geometry.points
          ctx.moveTo(points[0][0], points[0][1])
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1])
          }
          ctx.stroke()
        }
        break
      default:
        // Default: draw a small square
        ctx.fillRect(-0.25, -0.25, 0.5, 0.5)
    }
    
    ctx.restore()
  }

  if (!level) {
    return (
      <div 
        className={cn("flex items-center justify-center bg-slate-800 rounded-lg", className)}
        style={{ width, height }}
      >
        <span className="text-slate-500 text-sm">Level not found</span>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg border border-slate-700"
      />
    </div>
  )
}
