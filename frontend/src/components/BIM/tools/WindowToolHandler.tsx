import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBIMStore, BIMObject } from '../../../stores/useBIMStore'

interface Point {
  x: number
  y: number
}

interface WindowCreationResponse {
  id: string
  position: [number, number, number]
  width: number
  height: number
  success: boolean
}

const CANVAS_SIZE = 600
const GRID_SIZE = 50
const DEFAULT_WINDOW_WIDTH = 1200
const DEFAULT_WINDOW_HEIGHT = 1500

export default function WindowToolHandler() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [windowWidth, setWindowWidth] = useState(DEFAULT_WINDOW_WIDTH)
  const [windowHeight, setWindowHeight] = useState(DEFAULT_WINDOW_HEIGHT)
  const [placedWindows, setPlacedWindows] = useState<Array<{
    id: string
    position: Point
    width: number
    height: number
  }>>([])

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

  const drawExistingWindows = useCallback((ctx: CanvasRenderingContext2D) => {
    const allWindows = [
      ...canvas2D.objects.filter(obj => obj.type === 'window'),
      ...placedWindows.map(w => ({
        type: 'window' as const,
        id: w.id,
        geometry: { position: w.position, width: w.width, height: w.height }
      }))
    ]

    allWindows.forEach((window) => {
      if (window.geometry && window.geometry.position) {
        const pos = window.geometry.position as unknown as Point
        const width = window.geometry.width as number || DEFAULT_WINDOW_WIDTH
        const height = window.geometry.height as number || DEFAULT_WINDOW_HEIGHT

        const halfWidth = width / 2
        const halfHeight = height / 2

        const x = pos.x - halfWidth
        const y = pos.y - halfHeight

        ctx.strokeStyle = '#6366f1'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, width, height)

        ctx.fillStyle = '#6366f120'
        ctx.fillRect(x, y, width, height)

        ctx.strokeStyle = '#4a5568'
        ctx.lineWidth = 8
        ctx.strokeRect(x, y, width, height)

        ctx.fillStyle = '#60a5fa'
        ctx.fillRect(x + 4, y + 4, width - 8, height - 8)
      }
    })
  }, [canvas2D.objects, placedWindows])

  const drawWindowPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!hoverPoint) return

    const halfWidth = windowWidth / 2
    const halfHeight = windowHeight / 2

    const x = hoverPoint.x - halfWidth
    const y = hoverPoint.y - halfHeight

    ctx.setLineDash([5, 5])

    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, windowWidth, windowHeight)

    ctx.fillStyle = '#22d3ee20'
    ctx.fillRect(x, y, windowWidth, windowHeight)

    ctx.setLineDash([])

    ctx.strokeStyle = '#0891b2'
    ctx.lineWidth = 6
    ctx.strokeRect(x, y, windowWidth, windowHeight)

    ctx.fillStyle = '#67e8f9'
    ctx.globalAlpha = 0.6
    ctx.fillRect(x + 3, y + 3, windowWidth - 6, windowHeight - 6)
    ctx.globalAlpha = 1

    ctx.fillStyle = '#ffffff'
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${windowWidth}mm`, hoverPoint.x, hoverPoint.y - halfHeight - 8)
    ctx.fillText(`${windowHeight}mm`, hoverPoint.x + halfWidth + 40, hoverPoint.y)

    ctx.fillStyle = '#f472b6'
    ctx.beginPath()
    ctx.arc(hoverPoint.x, hoverPoint.y, 5, 0, Math.PI * 2)
    ctx.fill()
  }, [hoverPoint, windowWidth, windowHeight])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    drawGrid(ctx)
    drawExistingWindows(ctx)
    drawWindowPreview(ctx)
  }, [drawGrid, drawExistingWindows, drawWindowPreview])

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
    if (isLoading || !hoverPoint) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/bim/tools/window', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: [hoverPoint.x, hoverPoint.y, 0],
          width: windowWidth,
          height: windowHeight,
        }),
      })

      const data: WindowCreationResponse = await response.json()

      if (data.success) {
        const newWindow = {
          id: data.id,
          position: { x: data.position[0], y: data.position[1] },
          width: data.width,
          height: data.height,
        }

        setPlacedWindows(prev => [...prev, newWindow])

        const newBIMObject: BIMObject = {
          id: data.id,
          type: 'window',
          name: `Window ${Date.now()}`,
          geometry: {
            position: { x: data.position[0], y: data.position[1], z: data.position[2] },
            width: data.width,
            height: data.height,
          },
          material: 'default',
          properties: {
            width: data.width,
            height: data.height,
          },
          level: '',
          layer: '',
          isSelected: false,
          position: data.position,
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        }

        addObject(newBIMObject)
      } else {
        setError('Failed to create window')
      }
    } catch (err) {
      setError('Failed to connect to server')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hoverPoint, windowWidth, windowHeight, addObject])

  const handleReset = useCallback(() => {
    setPlacedWindows([])
    setError(null)
  }, [])

  const handleCancel = useCallback(() => {
    handleReset()
    navigate('/bim')
  }, [handleReset, navigate])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ color: '#eaeaea', margin: 0 }}>Window Tool</h2>
        <p style={{ color: '#a0a0a0', margin: '4px 0 0 0', fontSize: '14px' }}>
          Click on the canvas to place a window with frame and glass
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
              Creating window...
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
            Window Dimensions
          </div>

          <div>
            <label style={{ color: '#a0a0a0', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Width (mm)
            </label>
            <input
              type="number"
              value={windowWidth}
              onChange={(e) => setWindowWidth(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#eaeaea',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              min="100"
              max="5000"
            />
          </div>

          <div>
            <label style={{ color: '#a0a0a0', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Height (mm)
            </label>
            <input
              type="number"
              value={windowHeight}
              onChange={(e) => setWindowHeight(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1f2937',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: '#eaeaea',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              min="100"
              max="5000"
            />
          </div>

          <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase', marginTop: '8px' }}>
            Status
          </div>
          <div style={{
            padding: '8px 12px',
            background: '#374151',
            border: '1px solid #4b5563',
            borderRadius: '6px',
            color: '#eaeaea',
            fontSize: '14px'
          }}>
            {isLoading ? 'Creating window...' : 'Ready - Click to place'}
          </div>

          {hoverPoint && (
            <>
              <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
                Cursor Position
              </div>
              <div style={{
                padding: '8px 12px',
                background: '#1f2937',
                borderRadius: '6px',
                color: '#22d3ee',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                X: {hoverPoint.x}, Y: {hoverPoint.y}
              </div>
            </>
          )}

          {placedWindows.length > 0 && (
            <>
              <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
                Windows Placed
              </div>
              <div style={{
                padding: '8px 12px',
                background: '#1f2937',
                borderRadius: '6px',
                color: '#a78bfa',
                fontSize: '13px'
              }}>
                {placedWindows.length} window{placedWindows.length !== 1 ? 's' : ''} placed
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