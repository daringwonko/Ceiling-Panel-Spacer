import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBIMStore, BIMObject } from '../../../stores/useBIMStore'
import { bimClient } from '../../../api/bimClient'

interface Point {
  x: number
  y: number
}

interface EllipseCreationResponse {
  id: string
  center: [number, number, number]
  rx: number
  ry: number
  rotation: number
  success: boolean
}

type DrawingState = 'idle' | 'placing_center' | 'placing_radius_x' | 'placing_radius_y' | 'complete'

const CANVAS_SIZE = 600
const GRID_SIZE = 50

export default function EllipseToolHandler() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawingState, setDrawingState] = useState<DrawingState>('idle')
  const [centerPoint, setCenterPoint] = useState<Point | null>(null)
  const [radiusXPoint, setRadiusXPoint] = useState<Point | null>(null)
  const [radiusYPoint, setRadiusYPoint] = useState<Point | null>(null)
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

  const drawExistingEllipses = useCallback((ctx: CanvasRenderingContext2D) => {
    canvas2D.objects
      .filter(obj => obj.type === 'ellipse')
      .forEach((ellipse) => {
        if (ellipse.geometry && ellipse.geometry.center) {
          ctx.strokeStyle = '#6366f1'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.ellipse(
            ellipse.geometry.center.x,
            ellipse.geometry.center.y,
            ellipse.geometry.radiusX || 0,
            ellipse.geometry.radiusY || 0,
            ellipse.geometry.rotation || 0,
            0,
            Math.PI * 2
          )
          ctx.stroke()
        }
      })
  }, [canvas2D.objects])

  const drawPreviewEllipse = useCallback((ctx: CanvasRenderingContext2D) => {
    if (centerPoint) {
      ctx.fillStyle = '#22d3ee'
      ctx.beginPath()
      ctx.arc(centerPoint.x, centerPoint.y, 4, 0, Math.PI * 2)
      ctx.fill()

      if (drawingState === 'placing_radius_x' && radiusXPoint) {
        const radiusX = Math.abs(radiusXPoint.x - centerPoint.x)
        const radiusY = radiusX

        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.ellipse(centerPoint.x, centerPoint.y, radiusX, radiusY, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = '#f472b6'
        ctx.beginPath()
        ctx.arc(radiusXPoint.x, radiusXPoint.y, 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.setLineDash([2, 4])
        ctx.strokeStyle = '#f472b680'
        ctx.beginPath()
        ctx.moveTo(centerPoint.x, centerPoint.y)
        ctx.lineTo(radiusXPoint.x, centerPoint.y)
        ctx.stroke()
        ctx.setLineDash([])
      } else if (drawingState === 'placing_radius_y' && radiusYPoint && radiusXPoint) {
        const radiusX = Math.abs(radiusXPoint.x - centerPoint.x)
        const radiusY = Math.abs(radiusYPoint.y - centerPoint.y)

        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.ellipse(centerPoint.x, centerPoint.y, radiusX, radiusY, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = '#f472b6'
        ctx.beginPath()
        ctx.arc(centerPoint.x, radiusYPoint.y, 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.setLineDash([2, 4])
        ctx.strokeStyle = '#f472b680'
        ctx.beginPath()
        ctx.moveTo(centerPoint.x, centerPoint.y)
        ctx.lineTo(centerPoint.x, radiusYPoint.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }
  }, [centerPoint, radiusXPoint, radiusYPoint, drawingState])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    drawGrid(ctx)
    drawExistingEllipses(ctx)
    drawPreviewEllipse(ctx)
  }, [drawGrid, drawExistingEllipses, drawPreviewEllipse])

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

    if (drawingState === 'idle' || drawingState === 'placing_center') {
      setCenterPoint(snapped)
      setRadiusXPoint(null)
      setRadiusYPoint(null)
      setDrawingState('placing_radius_x')
    } else if (drawingState === 'placing_radius_x') {
      setRadiusXPoint(snapped)
      setRadiusYPoint(null)
      setDrawingState('placing_radius_y')
    } else if (drawingState === 'placing_radius_y') {
      setRadiusYPoint(snapped)
      setDrawingState('complete')
      setIsLoading(true)
      setError(null)

      try {
        const radiusX = Math.abs(snapped.x - centerPoint!.x)
        const radiusY = Math.abs(snapped.y - centerPoint!.y)

        const data: EllipseCreationResponse = await bimClient.createEllipse({
          center: [centerPoint!.x, centerPoint!.y, 0],
          rx: radiusX,
          ry: radiusY,
          rotation: 0,
        })

        if (data.success) {
          const newEllipse: BIMObject = {
            id: data.id,
            type: 'ellipse',
            name: `Ellipse ${Date.now()}`,
            geometry: {
              center: { x: data.center[0], y: data.center[1] },
              rx: data.rx,
              ry: data.ry,
              rotation: data.rotation,
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

          addObject(newEllipse)
          setCenterPoint(null)
          setRadiusXPoint(null)
          setRadiusYPoint(null)
          setDrawingState('idle')
        } else {
          setError('Failed to create ellipse')
        }
      } catch (err) {
        setError('Failed to connect to server')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
  }, [drawingState, getCanvasPoint, snapToGrid, centerPoint, addObject, drawCanvas])

  const handleReset = useCallback(() => {
    setCenterPoint(null)
    setRadiusXPoint(null)
    setRadiusYPoint(null)
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
        <h2 style={{ color: '#eaeaea', margin: 0 }}>Ellipse Tool</h2>
        <p style={{ color: '#a0a0a0', margin: '4px 0 0 0', fontSize: '14px' }}>
          Click to set center, then set X radius, then set Y radius
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
              Creating ellipse...
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
            {drawingState === 'placing_center' && 'Placing center point'}
            {drawingState === 'placing_radius_x' && 'Click to set X radius'}
            {drawingState === 'placing_radius_y' && 'Click to set Y radius'}
            {drawingState === 'complete' && 'Ellipse created!'}
          </div>

          {centerPoint && (
            <>
              <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
                Center Point
              </div>
              <div style={{
                padding: '8px 12px',
                background: '#1f2937',
                borderRadius: '6px',
                color: '#22d3ee',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                X: {centerPoint.x}, Y: {centerPoint.y}
              </div>
            </>
          )}

          {centerPoint && radiusXPoint && drawingState === 'placing_radius_y' && (
            <>
              <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
                Radii
              </div>
              <div style={{
                padding: '8px 12px',
                background: '#1f2937',
                borderRadius: '6px',
                color: '#f472b6',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                Rx: {Math.abs(radiusXPoint.x - centerPoint.x)}mm{'\n'}
                Ry: {hoverPoint ? Math.abs(hoverPoint.y - centerPoint.y) : '?'}mm
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