import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBIMStore, BIMObject } from '../../../stores/useBIMStore'
import { v4 as uuidv4 } from 'uuid'
import { bimClient } from '../../../api/bimClient'

interface Point {
  x: number
  y: number
}

interface CircleCreationResponse {
  id: string
  center: [number, number, number]
  radius: number
  success: boolean
}

type DrawingState = 'idle' | 'placing_center' | 'placing_radius' | 'complete'

const CANVAS_SIZE = 600
const GRID_SIZE = 50

export default function CircleToolHandler() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawingState, setDrawingState] = useState<DrawingState>('idle')
  const [centerPoint, setCenterPoint] = useState<Point | null>(null)
  const [radiusPoint, setRadiusPoint] = useState<Point | null>(null)
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

  const drawExistingCircles = useCallback((ctx: CanvasRenderingContext2D) => {
    canvas2D.objects
      .filter(obj => obj.type === 'circle')
      .forEach((circle) => {
        if (circle.geometry && circle.geometry.center && circle.geometry.radius !== undefined) {
          ctx.strokeStyle = '#6366f1'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(
            circle.geometry.center.x,
            circle.geometry.center.y,
            circle.geometry.radius,
            0,
            Math.PI * 2
          )
          ctx.stroke()
        }
      })
  }, [canvas2D.objects])

  const drawPreviewCircle = useCallback((ctx: CanvasRenderingContext2D) => {
    if (centerPoint && (hoverPoint || radiusPoint)) {
      const endPoint = hoverPoint || radiusPoint
      if (!endPoint) return

      const radius = Math.sqrt(
        Math.pow(endPoint.x - centerPoint.x, 2) + Math.pow(endPoint.y - centerPoint.y, 2)
      )

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(centerPoint.x, centerPoint.y, radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = '#22d3ee'
      ctx.beginPath()
      ctx.arc(centerPoint.x, centerPoint.y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(endPoint.x, endPoint.y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.setLineDash([2, 4])
      ctx.strokeStyle = '#f472b680'
      ctx.beginPath()
      ctx.moveTo(centerPoint.x, centerPoint.y)
      ctx.lineTo(endPoint.x, endPoint.y)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [centerPoint, hoverPoint, radiusPoint])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    drawGrid(ctx)
    drawExistingCircles(ctx)
    drawPreviewCircle(ctx)
  }, [drawGrid, drawExistingCircles, drawPreviewCircle])

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
      setRadiusPoint(null)
      setDrawingState('placing_radius')
    } else if (drawingState === 'placing_radius') {
      setRadiusPoint(snapped)
      setDrawingState('complete')
      setIsLoading(true)
      setError(null)

      try {
        const radius = Math.sqrt(
          Math.pow(snapped.x - centerPoint!.x, 2) + Math.pow(snapped.y - centerPoint!.y, 2)
        )

        const data: CircleCreationResponse = await bimClient.createCircle({
          center: [centerPoint!.x, centerPoint!.y, 0],
          radius: radius,
        })

        if (data.success) {
          const newCircle: BIMObject = {
            id: data.id,
            type: 'circle',
            name: `Circle ${Date.now()}`,
            geometry: {
              center: { x: data.center[0], y: data.center[1] },
              radius: data.radius,
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

          addObject(newCircle)
          setCenterPoint(null)
          setRadiusPoint(null)
          setDrawingState('idle')
        } else {
          setError('Failed to create circle')
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
    setRadiusPoint(null)
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
        <h2 style={{ color: '#eaeaea', margin: 0 }}>Circle Tool</h2>
        <p style={{ color: '#a0a0a0', margin: '4px 0 0 0', fontSize: '14px' }}>
          Click to set center point, then click again to set radius
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
              Creating circle...
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
            {drawingState === 'placing_radius' && 'Click to set radius'}
            {drawingState === 'complete' && 'Circle created!'}
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

          {centerPoint && hoverPoint && drawingState === 'placing_radius' && (
            <>
              <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
                Radius
              </div>
              <div style={{
                padding: '8px 12px',
                background: '#1f2937',
                borderRadius: '6px',
                color: '#f472b6',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                {Math.sqrt(
                  Math.pow(hoverPoint.x - centerPoint.x, 2) + Math.pow(hoverPoint.y - centerPoint.y, 2)
                ).toFixed(0)}mm
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