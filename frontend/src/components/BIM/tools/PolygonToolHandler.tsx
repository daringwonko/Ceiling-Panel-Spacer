import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBIMStore, BIMObject } from '../../../stores/useBIMStore'

interface Point {
  x: number
  y: number
}

interface PolygonCreationResponse {
  id: string
  vertices: number[][]
  success: boolean
}

type DrawingState = 'idle' | 'placing_vertices' | 'complete'

const CANVAS_SIZE = 600
const GRID_SIZE = 50

export default function PolygonToolHandler() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawingState, setDrawingState] = useState<DrawingState>('idle')
  const [vertices, setVertices] = useState<Point[]>([])
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

  const drawExistingPolygons = useCallback((ctx: CanvasRenderingContext2D) => {
    canvas2D.objects
      .filter(obj => obj.type === 'polygon')
      .forEach((polygon) => {
        if (polygon.geometry && polygon.geometry.vertices) {
          const points = polygon.geometry.vertices as Point[]
          if (points.length >= 3) {
            ctx.strokeStyle = '#6366f1'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y)
            }
            ctx.closePath()
            ctx.stroke()
            ctx.fillStyle = '#6366f120'
            ctx.fill()
          }
        }
      })
  }, [canvas2D.objects])

  const drawPreviewPolygon = useCallback((ctx: CanvasRenderingContext2D) => {
    if (vertices.length > 0) {
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(vertices[0].x, vertices[0].y)
      for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y)
      }
      if (hoverPoint) {
        ctx.lineTo(hoverPoint.x, hoverPoint.y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#22d3ee20'
      ctx.fill()

      vertices.forEach((vertex, index) => {
        ctx.fillStyle = index === 0 ? '#22d3ee' : '#f472b6'
        ctx.beginPath()
        ctx.arc(vertex.x, vertex.y, 4, 0, Math.PI * 2)
        ctx.fill()
      })

      if (hoverPoint && vertices.length > 0) {
        ctx.fillStyle = '#a78bfa'
        ctx.beginPath()
        ctx.arc(hoverPoint.x, hoverPoint.y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [vertices, hoverPoint])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    drawGrid(ctx)
    drawExistingPolygons(ctx)
    drawPreviewPolygon(ctx)
  }, [drawGrid, drawExistingPolygons, drawPreviewPolygon])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rawPoint = getCanvasPoint(e)
    const snapped = snapToGrid(rawPoint)
    setHoverPoint(snapped)
    drawCanvas()
  }, [getCanvasPoint, snapToGrid, drawCanvas])

  const isNearFirstPoint = useCallback((point: Point): boolean => {
    if (vertices.length < 3) return false
    const first = vertices[0]
    const distance = Math.sqrt(Math.pow(point.x - first.x, 2) + Math.pow(point.y - first.y, 2))
    return distance < GRID_SIZE
  }, [vertices])

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rawPoint = getCanvasPoint(e)
    const snapped = snapToGrid(rawPoint)

    if (drawingState === 'idle' || vertices.length === 0) {
      setVertices([snapped])
      setDrawingState('placing_vertices')
    } else if (drawingState === 'placing_vertices') {
      if (isNearFirstPoint(snapped) && vertices.length >= 3) {
        setIsLoading(true)
        setError(null)

        try {
          const response = await fetch('/api/bim/tools/polygon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vertices: vertices.map(v => [v.x, v.y, 0]),
            }),
          })

          const data: PolygonCreationResponse = await response.json()

          if (data.success) {
            const centroid = vertices.reduce((acc, v) => ({ x: acc.x + v.x / vertices.length, y: acc.y + v.y / vertices.length }), { x: 0, y: 0 })

            const newPolygon: BIMObject = {
              id: data.id,
              type: 'polygon',
              name: `Polygon ${Date.now()}`,
              geometry: {
                vertices: vertices.map(v => ({ x: v.x, y: v.y })),
                centroid: { x: centroid.x, y: centroid.y },
              },
              material: 'default',
              properties: {
                vertexCount: vertices.length,
              },
              level: '',
              layer: '',
              isSelected: false,
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            }

            addObject(newPolygon)
            setVertices([])
            setDrawingState('idle')
          } else {
            setError('Failed to create polygon')
          }
        } catch (err) {
          setError('Failed to connect to server')
          console.error(err)
        } finally {
          setIsLoading(false)
        }
      } else {
        setVertices(prev => [...prev, snapped])
      }
    }
  }, [drawingState, getCanvasPoint, snapToGrid, vertices, isNearFirstPoint, addObject, drawCanvas])

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && vertices.length >= 3 && drawingState === 'placing_vertices') {
      e.preventDefault()
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/bim/tools/polygon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vertices: vertices.map(v => [v.x, v.y, 0]),
          }),
        })

        const data: PolygonCreationResponse = await response.json()

        if (data.success) {
          const centroid = vertices.reduce((acc, v) => ({ x: acc.x + v.x / vertices.length, y: acc.y + v.y / vertices.length }), { x: 0, y: 0 })

          const newPolygon: BIMObject = {
            id: data.id,
            type: 'polygon',
            name: `Polygon ${Date.now()}`,
            geometry: {
              vertices: vertices.map(v => ({ x: v.x, y: v.y })),
              centroid: { x: centroid.x, y: centroid.y },
            },
            material: 'default',
            properties: {
              vertexCount: vertices.length,
            },
            level: '',
            layer: '',
            isSelected: false,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          }

          addObject(newPolygon)
          setVertices([])
          setDrawingState('idle')
        } else {
          setError('Failed to create polygon')
        }
      } catch (err) {
        setError('Failed to connect to server')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    } else if (e.key === 'Escape') {
      setVertices([])
      setDrawingState('idle')
    }
  }, [vertices, drawingState, addObject, drawCanvas])

  const handleReset = useCallback(() => {
    setVertices([])
    setDrawingState('idle')
    setError(null)
  }, [])

  const handleCancel = useCallback(() => {
    handleReset()
    navigate('/bim')
  }, [handleReset, navigate])

  const canClose = vertices.length >= 3

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }} onKeyDown={handleKeyDown} tabIndex={0}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ color: '#eaeaea', margin: 0 }}>Polygon Tool</h2>
        <p style={{ color: '#a0a0a0', margin: '4px 0 0 0', fontSize: '14px' }}>
          Click to place vertices. Click first point or press Enter to close polygon
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
              Creating polygon...
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
            {drawingState === 'placing_vertices' && `Placing vertices (${vertices.length})`}
            {drawingState === 'complete' && 'Polygon created!'}
          </div>

          {vertices.length > 0 && (
            <>
              <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
                Vertices
              </div>
              <div style={{
                padding: '8px 12px',
                background: '#1f2937',
                borderRadius: '6px',
                color: '#22d3ee',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                {vertices.map((v, i) => (
                  <div key={i}>V{i + 1}: ({v.x}, {v.y})</div>
                ))}
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
                color: isNearFirstPoint(hoverPoint) && canClose ? '#22d3ee' : '#f472b6',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                {isNearFirstPoint(hoverPoint) && canClose ? 'Click to close!' : `X: ${hoverPoint.x}, Y: ${hoverPoint.y}`}
              </div>
            </>
          )}

          {canClose && drawingState !== 'idle' && (
            <div style={{
              padding: '8px 12px',
              background: '#22d3ee20',
              border: '1px solid #22d3ee',
              borderRadius: '6px',
              color: '#22d3ee',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              Press Enter to close
            </div>
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