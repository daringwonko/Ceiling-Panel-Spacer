import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBIMStore, BIMObject } from '../../../stores/useBIMStore'
import { bimClient } from '../../../api/bimClient'
import { v4 as uuidv4 } from 'uuid'

interface Point {
  x: number
  y: number
}

interface StairsCreationResponse {
  id: string
  start: [number, number, number]
  end: [number, number, number]
  width: number
  num_steps: number
  success: boolean
}

type DrawingState = 'idle' | 'placing_start' | 'placing_end' | 'complete'

const CANVAS_SIZE = 600
const GRID_SIZE = 50
const DEFAULT_NUM_STEPS = 10
const DEFAULT_WIDTH = 120

export default function StairsToolHandler() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawingState, setDrawingState] = useState<DrawingState>('idle')
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [endPoint, setEndPoint] = useState<Point | null>(null)
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [numSteps, setNumSteps] = useState(DEFAULT_NUM_STEPS)
  const [width, setWidth] = useState(DEFAULT_WIDTH)

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

  const drawExistingStairs = useCallback((ctx: CanvasRenderingContext2D) => {
    canvas2D.objects
      .filter(obj => obj.type === 'stairs')
      .forEach((stairs) => {
        if (stairs.geometry && stairs.geometry.start && stairs.geometry.end) {
          ctx.strokeStyle = '#6366f1'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(stairs.geometry.start.x, stairs.geometry.start.y)
          ctx.lineTo(stairs.geometry.end.x, stairs.geometry.end.y)
          ctx.stroke()

          ctx.fillStyle = '#6366f150'
          ctx.fillRect(
            stairs.geometry.start.x,
            stairs.geometry.start.y - 10,
            stairs.geometry.end.x - stairs.geometry.start.x,
            20
          )
        }
      })
  }, [canvas2D.objects])

  const drawPreviewStairs = useCallback((ctx: CanvasRenderingContext2D) => {
    if (startPoint && (hoverPoint || endPoint)) {
      const end = hoverPoint || endPoint
      if (!end) return

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(startPoint.x, startPoint.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
      ctx.setLineDash([])

      const dx = end.x - startPoint.x
      const dy = end.y - startPoint.y
      const length = Math.sqrt(dx * dx + dy * dy)

      if (length > 0) {
        const stepWidth = length / numSteps
        const perpX = -dy / length * (width / 2)
        const perpY = dx / length * (width / 2)

        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 1
        ctx.setLineDash([2, 2])

        for (let i = 0; i <= numSteps; i++) {
          const t = i / numSteps
          const px = startPoint.x + dx * t
          const py = startPoint.y + dy * t

          ctx.beginPath()
          ctx.moveTo(px - perpX, py - perpY)
          ctx.lineTo(px + perpX, py + perpY)
          ctx.stroke()
        }

        ctx.setLineDash([])

        ctx.strokeStyle = '#f472b6'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(startPoint.x - perpX, startPoint.y - perpY)
        ctx.lineTo(startPoint.x + perpX, startPoint.y + perpY)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(end.x - perpX, end.y - perpY)
        ctx.lineTo(end.x + perpX, end.y + perpY)
        ctx.stroke()
      }

      ctx.fillStyle = '#22d3ee'
      ctx.beginPath()
      ctx.arc(startPoint.x, startPoint.y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(end.x, end.y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [startPoint, hoverPoint, endPoint, numSteps, width])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    drawGrid(ctx)
    drawExistingStairs(ctx)
    drawPreviewStairs(ctx)
  }, [drawGrid, drawExistingStairs, drawPreviewStairs])

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

    if (drawingState === 'idle' || drawingState === 'placing_start') {
      setStartPoint(snapped)
      setEndPoint(null)
      setDrawingState('placing_end')
    } else if (drawingState === 'placing_end') {
      setEndPoint(snapped)
      setDrawingState('complete')
      setIsLoading(true)
      setError(null)

      try {
        const data: StairsCreationResponse = await bimClient.createStairs({
          start: [startPoint!.x, startPoint!.y, 0],
          end: [snapped.x, snapped.y, 0],
          width: width,
          num_steps: numSteps,
        })

        if (data.success) {
          const newStairs: BIMObject = {
            id: data.id,
            type: 'stairs',
            name: `Stairs ${Date.now()}`,
            geometry: {
              start: { x: data.start[0], y: data.start[1] },
              end: { x: data.end[0], y: data.end[1] },
            },
            material: 'default',
            properties: {
              width: data.width,
              num_steps: data.num_steps,
            },
            level: '',
            layer: '',
            isSelected: false,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          }

          addObject(newStairs)
          setStartPoint(null)
          setEndPoint(null)
          setDrawingState('idle')
        } else {
          setError('Failed to create stairs')
        }
      } catch (err) {
        setError('Failed to connect to server')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
  }, [drawingState, getCanvasPoint, snapToGrid, startPoint, width, numSteps, addObject, drawCanvas])

  const handleReset = useCallback(() => {
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
        <h2 style={{ color: '#eaeaea', margin: 0 }}>Stairs Tool</h2>
        <p style={{ color: '#a0a0a0', margin: '4px 0 0 0', fontSize: '14px' }}>
          Click to set start point, then click again to set end point
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
              Creating stairs...
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
            {drawingState === 'placing_start' && 'Placing start point'}
            {drawingState === 'placing_end' && 'Click to set end point'}
            {drawingState === 'complete' && 'Stairs created!'}
          </div>

          <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
            Number of Steps
          </div>
          <input
            type="number"
            value={numSteps}
            onChange={(e) => setNumSteps(Math.max(2, Math.min(50, parseInt(e.target.value) || 2)))}
            min={2}
            max={50}
            style={{
              padding: '8px 12px',
              background: '#1f2937',
              border: '1px solid #4b5563',
              borderRadius: '6px',
              color: '#eaeaea',
              fontSize: '14px',
              width: '100%',
            }}
          />

          <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
            Width (mm)
          </div>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Math.max(50, Math.min(500, parseInt(e.target.value) || 50)))}
            min={50}
            max={500}
            style={{
              padding: '8px 12px',
              background: '#1f2937',
              border: '1px solid #4b5563',
              borderRadius: '6px',
              color: '#eaeaea',
              fontSize: '14px',
              width: '100%',
            }}
          />

          {startPoint && (
            <>
              <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
                Start Point
              </div>
              <div style={{
                padding: '8px 12px',
                background: '#1f2937',
                borderRadius: '6px',
                color: '#22d3ee',
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