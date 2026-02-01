import { bimClient } from '../../../api/bimClient'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBIMStore, BIMObject } from '../../../stores/useBIMStore'
import { v4 as uuidv4 } from 'uuid'

interface Point {
  x: number
  y: number
}

type DrawingState = 'idle' | 'placing' | 'complete'

const CANVAS_SIZE = 600
const GRID_SIZE = 50
const DEFAULT_DOOR_WIDTH = 900
const DEFAULT_DOOR_HEIGHT = 2100
const FRAME_WIDTH = 50

export default function DoorToolHandler() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawingState, setDrawingState] = useState<DrawingState>('idle')
  const [doorPosition, setDoorPosition] = useState<Point | null>(null)
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doorDirection, setDoorDirection] = useState<'in' | 'out'>('in')
  const [doorWidth, setDoorWidth] = useState(DEFAULT_DOOR_WIDTH)
  const [doorHeight, setDoorHeight] = useState(DEFAULT_DOOR_HEIGHT)

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

  const drawExistingDoors = useCallback((ctx: CanvasRenderingContext2D) => {
    canvas2D.objects
      .filter(obj => obj.type === 'door')
      .forEach((door) => {
        if (door.geometry && door.geometry.position) {
          const pos = door.geometry.position
          const width = door.properties?.width || DEFAULT_DOOR_WIDTH
          const height = door.properties?.height || DEFAULT_DOOR_HEIGHT

          ctx.strokeStyle = '#6366f1'
          ctx.lineWidth = 2
          ctx.strokeRect(
            pos.x - width / 2,
            pos.y - height / 2,
            width,
            height
          )

          ctx.fillStyle = '#6366f140'
          ctx.fillRect(
            pos.x - width / 2,
            pos.y - height / 2,
            width,
            height
          )

          ctx.strokeStyle = '#a78bfa'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(pos.x - width / 2 + FRAME_WIDTH, pos.y - height / 2)
          ctx.lineTo(pos.x - width / 2 + FRAME_WIDTH, pos.y + height / 2)
          ctx.stroke()
        }
      })
  }, [canvas2D.objects])

  const drawDoorPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (doorPosition && (hoverPoint || !doorPosition)) {
      const width = doorWidth
      const height = doorHeight
      const x = doorPosition.x
      const y = doorPosition.y

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      ctx.strokeRect(x - width / 2, y - height / 2, width, height)

      ctx.fillStyle = '#22d3ee20'
      ctx.fillRect(x - width / 2, y - height / 2, width, height)

      ctx.setLineDash([])

      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = '#a78bfa'
      ctx.lineWidth = 3
      const hingeX = x - width / 2 + FRAME_WIDTH
      ctx.beginPath()
      ctx.moveTo(hingeX, y - height / 2)
      ctx.lineTo(hingeX, y + height / 2)
      ctx.stroke()

      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(hingeX, y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [doorPosition, hoverPoint, doorWidth, doorHeight])

  const drawDoorPlaceholder = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!doorPosition && hoverPoint) {
      const width = doorWidth
      const height = doorHeight
      const x = hoverPoint.x
      const y = hoverPoint.y

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      ctx.strokeRect(x - width / 2, y - height / 2, width, height)

      ctx.fillStyle = '#22d3ee20'
      ctx.fillRect(x - width / 2, y - height / 2, width, height)

      ctx.setLineDash([])

      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.font = '12px monospace'
      ctx.fillStyle = '#a0a0a0'
      ctx.fillText(`${width}mm x ${height}mm`, x - width / 2, y - height / 2 - 8)
    }
  }, [doorPosition, hoverPoint, doorWidth, doorHeight])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    drawGrid(ctx)
    drawExistingDoors(ctx)
    drawDoorPreview(ctx)
    drawDoorPlaceholder(ctx)
  }, [drawGrid, drawExistingDoors, drawDoorPreview, drawDoorPlaceholder])

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
      setDoorPosition(snapped)
      setDrawingState('placing')
    } else if (drawingState === 'placing') {
      setIsLoading(true)
      setError(null)

      try {
        const data = await bimClient.createDoor({
          position: [snapped.x, snapped.y, 0],
          width: doorWidth,
          height: doorHeight,
          direction: doorDirection,
        })

        if (data.success) {
          const newDoor: BIMObject = {
            id: data.id,
            type: 'door',
            name: `Door ${Date.now()}`,
            geometry: {
              position: { x: data.position[0], y: data.position[1] },
            },
            material: 'wood',
            properties: {
              width: data.width,
              height: data.height,
              direction: data.direction,
              frameWidth: FRAME_WIDTH,
            },
            level: '',
            layer: '',
            isSelected: false,
            position: data.position,
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          }

          addObject(newDoor)
          setDoorPosition(null)
          setDrawingState('complete')

          setTimeout(() => {
            setDrawingState('idle')
          }, 1500)
        } else {
          setError('Failed to create door')
        }
      } catch (err) {
        setError('Failed to connect to server')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
  }, [drawingState, getCanvasPoint, snapToGrid, doorWidth, doorHeight, doorDirection, addObject, drawCanvas])

  const handleReset = useCallback(() => {
    setDoorPosition(null)
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
        <h2 style={{ color: '#eaeaea', margin: 0 }}>Door Tool</h2>
        <p style={{ color: '#a0a0a0', margin: '4px 0 0 0', fontSize: '14px' }}>
          Click on the canvas to place a door at the selected position
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
              Creating door...
            </div>
          )}
        </div>

        <div style={{
          width: '280px',
          background: '#16213e',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
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
            {drawingState === 'idle' && 'Ready - Click to place door'}
            {drawingState === 'placing' && 'Position set - Click to confirm'}
            {drawingState === 'complete' && 'Door created successfully!'}
          </div>

          <div style={{ color: '#a0a0a0', fontSize: '12px', textTransform: 'uppercase' }}>
            Door Properties
          </div>

          <div>
            <label style={{ color: '#a0a0a0', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Width (mm)
            </label>
            <input
              type="number"
              value={doorWidth}
              onChange={(e) => setDoorWidth(Number(e.target.value))}
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
            />
          </div>

          <div>
            <label style={{ color: '#a0a0a0', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Height (mm)
            </label>
            <input
              type="number"
              value={doorHeight}
              onChange={(e) => setDoorHeight(Number(e.target.value))}
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
            />
          </div>

          <div>
            <label style={{ color: '#a0a0a0', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              Swing Direction
            </label>
            <select
              value={doorDirection}
              onChange={(e) => setDoorDirection(e.target.value as 'in' | 'out')}
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
            >
              <option value="in">Opening In</option>
              <option value="out">Opening Out</option>
            </select>
          </div>

          {doorPosition && (
            <div style={{
              padding: '12px',
              background: '#1f2937',
              borderRadius: '6px'
            }}>
              <div style={{ color: '#a0a0a0', fontSize: '12px', marginBottom: '8px' }}>
                Door Position
              </div>
              <div style={{ fontFamily: 'monospace', color: '#22d3ee', fontSize: '13px' }}>
                X: {doorPosition.x}mm<br />
                Y: {doorPosition.y}mm
              </div>
            </div>
          )}

          {hoverPoint && drawingState === 'idle' && (
            <div style={{
              padding: '12px',
              background: '#1f2937',
              borderRadius: '6px'
            }}>
              <div style={{ color: '#a0a0a0', fontSize: '12px', marginBottom: '8px' }}>
                Preview Position
              </div>
              <div style={{ fontFamily: 'monospace', color: '#f472b6', fontSize: '13px' }}>
                X: {hoverPoint.x}mm<br />
                Y: {hoverPoint.y}mm
              </div>
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