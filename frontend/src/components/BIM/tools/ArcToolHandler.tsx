import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBIMStore, BIMObject } from '../../../stores/useBIMStore'
import { bimClient } from '../../../api/bimClient'

interface Point {
  x: number
  y: number
}

interface ArcCreationResponse {
  id: string
  center: [number, number, number]
  radius: number
  startAngle: number
  endAngle: number
  success: boolean
}

type DrawingState = 'idle' | 'placing_center' | 'placing_radius' | 'placing_end' | 'complete'

const CANVAS_SIZE = 600
const GRID_SIZE = 50

export default function ArcToolHandler() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawingState, setDrawingState] = useState<DrawingState>('idle')
  const [centerPoint, setCenterPoint] = useState<Point | null>(null)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [endPoint, setEndPoint] = useState<Point | null>(null)
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

  const drawExistingArcs = useCallback((ctx: CanvasRenderingContext2D) => {
    canvas2D.objects
      .filter(obj => obj.type === 'arc')
      .forEach((arc) => {
        if (arc.geometry && arc.geometry.center) {
          const radius = arc.geometry.radius || 50
          const startAngle = arc.geometry.startAngle || 0
          const endAngle = arc.geometry.endAngle || Math.PI * 2

          ctx.strokeStyle = '#6366f1'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(arc.geometry.center.x, arc.geometry.center.y, radius, startAngle, endAngle)
          ctx.stroke()
        }
      })
  }, [canvas2D.objects])

  const drawPreviewArc = useCallback((ctx: CanvasRenderingContext2D) => {
    if (centerPoint && startPoint && (hoverPoint || endPoint)) {
      const end = hoverPoint || endPoint
      if (!end) return

      const radius = Math.sqrt(Math.pow(end.x - centerPoint.x, 2) + Math.pow(end.y - centerPoint.y, 2))
      const startAngle = Math.atan2(startPoint.y - centerPoint.y, startPoint.x - centerPoint.x)
      const endAngle = Math.atan2(end.y - centerPoint.y, end.x - centerPoint.x)

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(centerPoint.x, centerPoint.y, radius, startAngle, endAngle)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#22d3ee'
      ctx.beginPath()
      ctx.arc(centerPoint.x, centerPoint.y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(startPoint.x, startPoint.y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#4ade80'
      ctx.beginPath()
      ctx.arc(end.x, end.y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [centerPoint, startPoint, hoverPoint, endPoint])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    drawGrid(ctx)
    drawExistingArcs(ctx)
    drawPreviewArc(ctx)
  }, [drawGrid, drawExistingArcs, drawPreviewArc])

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
      setStartPoint(null)
      setEndPoint(null)
      setDrawingState('placing_radius')
    } else if (drawingState === 'placing_radius') {
      setStartPoint(snapped)
      setEndPoint(null)
      setDrawingState('placing_end')
    } else if (drawingState === 'placing_end') {
      setEndPoint(snapped)
      setDrawingState('complete')
      setIsLoading(true)
      setError(null)

      try {
        const center = [centerPoint!.x, centerPoint!.y, 0]
        const start = [startPoint!.x, startPoint!.y, 0]
        const end = [snapped.x, snapped.y, 0]

        const radius = Math.sqrt(Math.pow(startPoint!.x - centerPoint!.x, 2) + Math.pow(startPoint!.y - centerPoint!.y, 2))
        const startAngle = Math.atan2(startPoint!.y - centerPoint!.y, startPoint!.x - centerPoint!.x)
        const endAngle = Math.atan2(snapped.y - centerPoint!.y, snapped.x - centerPoint!.x)

        const data: ArcCreationResponse = await bimClient.createArc({
          center,
          radius,
          startAngle,
          endAngle,
        })

        if (data.success) {
          const newArc: BIMObject = {
            id: data.id,
            type: 'arc',
            name: `Arc ${Date.now()}`,
            geometry: {
              center: { x: data.center[0], y: data.center[1] },
              radius: data.radius,
              startAngle: data.startAngle,
              endAngle: data.endAngle,
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

          addObject(newArc)
          setCenterPoint(null)
          setStartPoint(null)
          setEndPoint(null)
          setDrawingState('idle')
        } else {
          setError('Failed to create arc')
        }
      } catch (err) {
        setError('Failed to connect to server')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
  }, [drawingState, getCanvasPoint, snapToGrid, centerPoint, startPoint, addObject, drawCanvas])

  const handleReset = useCallback(() => {
    setCenterPoint(null)
    setStartPoint(null)
    setEndPoint(null)
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
        <h2 style={{ color: '#eaeaea', margin: 0 }}>Arc Tool</h2>
        <p style={{ color: '#a0a0a0', margin: '4px 0 0 0', fontSize: '14px' }}>
          Click to set center, then start point, then end point
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
              Creating arc...
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
            {drawingState === 'placing_radius' && 'Placing start point'}
            {drawingState === 'placing_end' && 'Click to set end point'}
            {drawingState === 'complete' && 'Arc created!'}
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

          {startPoint && (
            <>
              <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
                Start Point
              </div>
              <div style={{
                padding: '8px 12px',
                background: '#1f2937',
                borderRadius: '6px',
                color: '#f472b6',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                X: {startPoint.x}, Y: {startPoint.y}
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
                color: '#4ade80',
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