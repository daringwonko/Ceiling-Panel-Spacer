import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBIMStore, BIMObject } from '../../../stores/useBIMStore'
import { v4 as uuidv4 } from 'uuid'

interface Point {
  x: number
  y: number
}

interface PolylineCreationResponse {
  id: string
  points: [[number, number, number]]
  success: boolean
}

type DrawingState = 'idle' | 'placing_points' | 'complete'

const CANVAS_SIZE = 600
const GRID_SIZE = 50

export default function PolylineToolHandler() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawingState, setDrawingState] = useState<DrawingState>('idle')
  const [points, setPoints] = useState<Point[]>([])
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

  const drawExistingPolylines = useCallback((ctx: CanvasRenderingContext2D) => {
    canvas2D.objects
      .filter(obj => obj.type === 'polyline')
      .forEach((polyline) => {
        if (polyline.geometry && polyline.geometry.points && Array.isArray(polyline.geometry.points)) {
          ctx.strokeStyle = '#6366f1'
          ctx.lineWidth = 2
          ctx.beginPath()
          const pts = polyline.geometry.points as Point[]
          if (pts.length > 0) {
            ctx.moveTo(pts[0].x, pts[0].y)
            for (let i = 1; i < pts.length; i++) {
              ctx.lineTo(pts[i].x, pts[i].y)
            }
          }
          ctx.stroke()

          for (const pt of pts) {
            ctx.fillStyle = '#22d3ee'
            ctx.beginPath()
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })
  }, [canvas2D.objects])

  const drawPreviewPolyline = useCallback((ctx: CanvasRenderingContext2D) => {
    if (points.length > 0) {
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      for (const pt of points) {
        ctx.fillStyle = '#22d3ee'
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (hoverPoint && points.length > 0) {
      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y)
      ctx.lineTo(hoverPoint.x, hoverPoint.y)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(hoverPoint.x, hoverPoint.y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [points, hoverPoint])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    drawGrid(ctx)
    drawExistingPolylines(ctx)
    drawPreviewPolyline(ctx)
  }, [drawGrid, drawExistingPolylines, drawPreviewPolyline])

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

    if (drawingState === 'idle') {
      setPoints([snapped])
      setDrawingState('placing_points')
    } else if (drawingState === 'placing_points') {
      setPoints(prev => [...prev, snapped])
    }
  }, [drawingState, getCanvasPoint, snapToGrid])

  const handleDoubleClick = useCallback(async () => {
    if (points.length < 2) {
      setError('Polyline needs at least 2 points')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/bim/tools/polyline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: points.map(p => [p.x, p.y, 0]),
        }),
      })

      const data: PolylineCreationResponse = await response.json()

      if (data.success) {
        const newPolyline: BIMObject = {
          id: data.id,
          type: 'polyline',
          name: `Polyline ${Date.now()}`,
          geometry: {
            points: points,
          },
          material: 'default',
          properties: {},
          level: '',
          layer: '',
          isSelected: false,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        }

        addObject(newPolyline)
        setPoints([])
        setDrawingState('complete')
        setTimeout(() => setDrawingState('idle'), 1000)
      } else {
        setError('Failed to create polyline')
      }
    } catch (err) {
      setError('Failed to connect to server')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [points, addObject, drawCanvas])

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (points.length < 2) {
        setError('Polyline needs at least 2 points')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/bim/tools/polyline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            points: points.map(p => [p.x, p.y, 0]),
          }),
        })

        const data: PolylineCreationResponse = await response.json()

        if (data.success) {
          const newPolyline: BIMObject = {
            id: data.id,
            type: 'polyline',
            name: `Polyline ${Date.now()}`,
            geometry: {
              points: points,
            },
            material: 'default',
            properties: {},
            level: '',
            layer: '',
            isSelected: false,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          }

          addObject(newPolyline)
          setPoints([])
          setDrawingState('complete')
          setTimeout(() => setDrawingState('idle'), 1000)
        } else {
          setError('Failed to create polyline')
        }
      } catch (err) {
        setError('Failed to connect to server')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    } else if (e.key === 'Escape') {
      handleReset()
    }
  }, [points, addObject, drawCanvas])

  const handleReset = useCallback(() => {
    setPoints([])
    setDrawingState('idle')
    setError(null)
  }, [])

  const handleCancel = useCallback(() => {
    handleReset()
    navigate('/bim')
  }, [handleReset, navigate])

  const handleRemoveLastPoint = useCallback(() => {
    setPoints(prev => prev.slice(0, -1))
    if (points.length <= 1) {
      setDrawingState('idle')
    }
  }, [points.length])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px',
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ color: '#eaeaea', margin: 0 }}>Polyline Tool</h2>
        <p style={{ color: '#a0a0a0', margin: '4px 0 0 0', fontSize: '14px' }}>
          Click to add points, Double-click or Enter to finish
        </p>
      </div>

      {error && (
        <div
          style={{
            background: '#ef444420',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#fca5a5',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
        <div
          style={{
            position: 'relative',
            border: '2px solid #374151',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            style={{ cursor: 'crosshair', display: 'block' }}
          />
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: '#00000080',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              Creating polyline...
            </div>
          )}
        </div>

        <div
          style={{
            width: '240px',
            background: '#16213e',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
            Status
          </div>
          <div
            style={{
              padding: '8px 12px',
              background: drawingState === 'idle' ? '#374151' : '#6366f120',
              border: `1px solid ${drawingState === 'idle' ? '#4b5563' : '#6366f1'}`,
              borderRadius: '6px',
              color: '#eaeaea',
              fontSize: '14px',
            }}
          >
            {drawingState === 'idle' && 'Ready - Click to start'}
            {drawingState === 'placing_points' && `Placing points (${points.length})`}
            {drawingState === 'complete' && 'Polyline created!'}
          </div>

          {points.length > 0 && (
            <>
              <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
                Points ({points.length})
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  background: '#1f2937',
                  borderRadius: '6px',
                  color: '#22d3ee',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  maxHeight: '120px',
                  overflow: 'auto',
                }}
              >
                {points.map((pt, i) => (
                  <div key={i}>
                    P{i + 1}: ({pt.x}, {pt.y})
                  </div>
                ))}
              </div>
            </>
          )}

          {hoverPoint && drawingState !== 'idle' && (
            <>
              <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
                Cursor Position
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  background: '#1f2937',
                  borderRadius: '6px',
                  color: '#f472b6',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                }}
              >
                X: {hoverPoint.x}, Y: {hoverPoint.y}
              </div>
            </>
          )}

          <div style={{ flex: 1 }} />

          {points.length >= 2 && (
            <button
              onClick={handleRemoveLastPoint}
              style={{
                padding: '10px 16px',
                background: '#7c3aed',
                border: 'none',
                borderRadius: '6px',
                color: '#eaeaea',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Remove Last Point
            </button>
          )}

          <button
            onClick={handleReset}
            style={{
              padding: '10px 16px',
              background: '#374151',
              border: 'none',
              borderRadius: '6px',
              color: '#eaeaea',
              cursor: 'pointer',
              fontSize: '14px',
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
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}