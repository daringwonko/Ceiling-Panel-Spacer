import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBIMStore, BIMObject } from '../../../stores/useBIMStore'
import { v4 as uuidv4 } from 'uuid'
import { bimClient } from '../../../api/bimClient'

interface Point {
  x: number
  y: number
}

interface RectangleCreationResponse {
  id: string
  corner: [number, number, number]
  opposite_corner: [number, number, number]
  width: number
  height: number
  success: boolean
}

type DrawingState = 'idle' | 'placing_corner' | 'placing_opposite' | 'complete'

const CANVAS_SIZE = 600
const GRID_SIZE = 50

export default function RectangleToolHandler() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawingState, setDrawingState] = useState<DrawingState>('idle')
  const [corner, setCorner] = useState<Point | null>(null)
  const [oppositeCorner, setOppositeCorner] = useState<Point | null>(null)
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { addObject, canvas2D } = useBIMStore()

  const snapToGrid = useCallback((point: Point): Point => {
    return {
      x: Math.round(point.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(point.y / GRID_SIZE) * GRID_SIZE,
    }
  }, [])

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    return { x, y }
  }, [])

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#2d3748'
    ctx.lineWidth = 0.5

    for (let x = 0; x <= CANVAS_SIZE; x += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_SIZE)
      ctx.stroke()
    }

    for (let y = 0; y <= CANVAS_SIZE; y += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_SIZE, y)
      ctx.stroke()
    }
  }, [])

  const drawExistingRectangles = useCallback((ctx: CanvasRenderingContext2D) => {
    canvas2D.objects
      .filter(obj => obj.type === 'rectangle')
      .forEach((rect) => {
        if (rect.geometry && rect.geometry.corner && rect.geometry.oppositeCorner) {
          const x = Math.min(rect.geometry.corner.x, rect.geometry.oppositeCorner.x)
          const y = Math.min(rect.geometry.corner.y, rect.geometry.oppositeCorner.y)
          const width = Math.abs(rect.geometry.oppositeCorner.x - rect.geometry.corner.x)
          const height = Math.abs(rect.geometry.oppositeCorner.y - rect.geometry.corner.y)

          ctx.strokeStyle = '#6366f1'
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, width, height)
        }
      })
  }, [canvas2D.objects])

  const drawPreviewRectangle = useCallback((ctx: CanvasRenderingContext2D) => {
    if (corner && (hoverPoint || oppositeCorner)) {
      const end = hoverPoint || oppositeCorner
      if (!end) return

      const x = Math.min(corner.x, end.x)
      const y = Math.min(corner.y, end.y)
      const width = Math.abs(end.x - corner.x)
      const height = Math.abs(end.y - corner.y)

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(x, y, width, height)
      ctx.setLineDash([])

      ctx.fillStyle = '#22d3ee'
      ctx.beginPath()
      ctx.arc(corner.x, corner.y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(end.x, end.y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#a78bfa'
      const thirdX = corner.x !== end.x ? end.x : corner.x + width
      const thirdY = corner.y !== end.y ? corner.y : corner.y + height
      ctx.beginPath()
      ctx.arc(thirdX, thirdY, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [corner, hoverPoint, oppositeCorner])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    drawGrid(ctx)
    drawExistingRectangles(ctx)
    drawPreviewRectangle(ctx)
  }, [drawGrid, drawExistingRectangles, drawPreviewRectangle])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rawPoint = getCanvasPoint(e)
    const snapped = snapToGrid(rawPoint)
    setHoverPoint(snapped)
    drawCanvas()
  }, [getCanvasPoint, snapToGrid, drawCanvas])

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rawPoint = getCanvasPoint(e)
    const snapped = snapToGrid(rawPoint)

    if (drawingState === 'idle' || drawingState === 'placing_corner') {
      setCorner(snapped)
      setOppositeCorner(null)
      setDrawingState('placing_opposite')
    } else if (drawingState === 'placing_opposite') {
      setOppositeCorner(snapped)
      setDrawingState('complete')
      setIsLoading(true)
      setError(null)

      try {
        const data: RectangleCreationResponse = await bimClient.createRectangle({
          corner: [snapped.x, snapped.y, 0],
          opposite_corner: [corner!.x, corner!.y, 0],
        })

        if (data.success) {
          const width = Math.abs(data.opposite_corner[0] - data.corner[0])
          const height = Math.abs(data.opposite_corner[1] - data.corner[1])

          const newRectangle: BIMObject = {
            id: data.id,
            type: 'rectangle',
            name: `Rectangle ${Date.now()}`,
            geometry: {
              corner: { x: data.corner[0], y: data.corner[1] },
              oppositeCorner: { x: data.opposite_corner[0], y: data.opposite_corner[1] },
            },
            material: 'default',
            properties: {
              width: width,
              height: height,
            },
            level: '',
            layer: '',
            isSelected: false,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          }

          addObject(newRectangle)
          setCorner(null)
          setOppositeCorner(null)
          setDrawingState('idle')
        } else {
          setError('Failed to create rectangle')
        }
      } catch (err) {
        setError('Failed to connect to server')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
  }, [drawingState, getCanvasPoint, snapToGrid, corner, addObject, drawCanvas])

  const handleReset = useCallback(() => {
    setCorner(null)
    setOppositeCorner(null)
    setDrawingState('idle')
    setError(null)
  }, [])

  const handleCancel = useCallback(() => {
    handleReset()
    navigate('/bim')
  }, [handleReset, navigate])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ color: '#eaeaea', margin: 0 }}>Rectangle Tool</h2>
        <p style={{ color: '#a0a0a0', margin: '4px 0 0 0', fontSize: '14px' }}>
          Click to set corner point, then click again to set opposite corner
        </p>
      </div>

      {error && (
        <div style={{
          background: '#ef444420',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          color: '#fca5a5'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
        <div style={{ position: 'relative', border: '2px solid #374151', borderRadius: '8px', overflow: 'hidden' }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            style={{ cursor: 'crosshair', display: 'block' }}
          />
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: '#00000080',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              Creating rectangle...
            </div>
          )}
        </div>

        <div style={{
          width: '240px',
          background: '#16213e',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
            Status
          </div>
          <div style={{
            padding: '8px 12px',
            background: drawingState === 'idle' ? '#374151' : '#6366f120',
            border: `1px solid ${drawingState === 'idle' ? '#4b5563' : '#6366f1'}`,
            borderRadius: '6px',
            color: '#eaeaea',
            fontSize: '14px'
          }}>
            {drawingState === 'idle' && 'Ready - Click to start'}
            {drawingState === 'placing_corner' && 'Placing corner point'}
            {drawingState === 'placing_opposite' && 'Click to set opposite corner'}
            {drawingState === 'complete' && 'Rectangle created!'}
          </div>

          {corner && (
            <>
              <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
                Corner Point
              </div>
              <div style={{
                padding: '8px 12px',
                background: '#1f2937',
                borderRadius: '6px',
                color: '#22d3ee',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                X: {corner.x}, Y: {corner.y}
              </div>
            </>
          )}

          {corner && oppositeCorner && (
            <>
              <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
                Dimensions
              </div>
              <div style={{
                padding: '8px 12px',
                background: '#1f2937',
                borderRadius: '6px',
                color: '#a78bfa',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                W: {Math.abs(oppositeCorner.x - corner.x)}mm<br />
                H: {Math.abs(oppositeCorner.y - corner.y)}mm
              </div>
            </>
          )}

          {hoverPoint && drawingState !== 'idle' && (
            <>
              <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
                Cursor Position
              </div>
              <div style={{
                padding: '8px 12px',
                background: '#1f2937',
                borderRadius: '6px',
                color: '#f472b6',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                X: {hoverPoint.x}, Y: {hoverPoint.y}
              </div>
            </>
          )}

          <div style={{ flex: 1 }} />

          <button
            onClick={handleReset}
            style={{
              padding: '10px 16px',
              background: '#374151',
              border: 'none',
              borderRadius: '6px',
              color: '#eaeaea',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Reset
          </button>

          <button
            onClick={handleCancel}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: '1px solid #4b5563',
              borderRadius: '6px',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}